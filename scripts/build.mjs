import { cp, mkdir, readFile, readdir, rm, stat, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import yaml from 'js-yaml';
import MarkdownIt from 'markdown-it';
import sanitizeHtml from 'sanitize-html';

const execFileAsync = promisify(execFile);
const DEFAULT_URL = 'https://eigenwill.github.io';
const META_FIELDS = new Set(['title', 'date', 'description', 'category', 'tags', 'slug', 'draft', 'originalUrl', 'aliases', 'math', 'license', 'image', 'comments', 'hidden']);
const booleanFields = ['draft', 'math', 'comments', 'hidden'];
const MAX_POST_SIZE = 2 * 1024 * 1024;
const xml = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c]);
const escapeHtml = value => String(value).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

// Protect TeX before Markdown consumes backslashes, underscores, or matrix rows.
// Delimiters remain text so the browser's KaTeX auto-render can handle them.
function mathTextPlugin(md) {
  md.inline.ruler.before('escape', 'tex_text', (state, silent) => {
    const start = state.pos;
    const source = state.src;
    let open;
    let close;
    if (source.startsWith('$$', start)) { open = '$$'; close = '$$'; }
    else if (source[start] === '$' && source[start + 1] && !/\s/.test(source[start + 1])) { open = '$'; close = '$'; }
    else if (source.startsWith('\\(', start)) { open = '\\('; close = '\\)'; }
    else if (source.startsWith('\\[', start)) { open = '\\['; close = '\\]'; }
    else return false;
    let end = start + open.length;
    while ((end = source.indexOf(close, end)) !== -1) {
      let backslashes = 0;
      for (let p = end - 1; p >= 0 && source[p] === '\\'; p--) backslashes++;
      if ((close.startsWith('\\') || backslashes % 2 === 0) && (close !== '$' || !/\s/.test(source[end - 1]))) break;
      end += close.length;
    }
    if (end < 0 || end === start + open.length) return false;
    if (!silent) {
      const token = state.push('tex_text', '', 0);
      token.content = source.slice(start, end + close.length);
    }
    state.pos = end + close.length;
    return true;
  });
  md.renderer.rules.tex_text = (tokens, idx) => escapeHtml(tokens[idx].content);
  md.block.ruler.before('fence', 'tex_block', (state, startLine, endLine, silent) => {
    const start = state.bMarks[startLine] + state.tShift[startLine];
    const line = state.src.slice(start, state.eMarks[startLine]).trim();
    const open = line.startsWith('$$') ? '$$' : line.startsWith('\\[') ? '\\[' : null;
    if (!open) return false;
    const close = open === '$$' ? '$$' : '\\]';
    let nextLine = startLine;
    if (line.indexOf(close, open.length) < 0) {
      do { nextLine++; } while (nextLine < endLine && !state.src.slice(state.bMarks[nextLine], state.eMarks[nextLine]).includes(close));
      if (nextLine === endLine) return false;
    }
    if (silent) return true;
    const token = state.push('tex_block', 'div', 0);
    token.content = state.src.slice(start, state.eMarks[nextLine]);
    token.map = [startLine, nextLine + 1];
    state.line = nextLine + 1;
    return true;
  });
  md.renderer.rules.tex_block = (tokens, idx) => '<div class="math-block">' + escapeHtml(tokens[idx].content) + '</div>\n';
}

const markdown = new MarkdownIt({ html: true, linkify: true, typographer: false }).use(mathTextPlugin);
markdown.core.ruler.after('inline', 'heading_ids', state => {
  const used = new Set();
  for (let index = 0; index < state.tokens.length; index++) {
    if (state.tokens[index].type !== 'heading_open') continue;
    const heading = state.tokens[index + 1];
    const text = (heading.children || []).map(token => token.type === 'html_inline' ? '' : token.content).join('');
    const stem = normalizeSlug(text) || 'section';
    let id = stem;
    let suffix = 2;
    while (used.has(id)) id = stem + '-' + suffix++;
    used.add(id);
    state.tokens[index].attrSet('id', id);
  }
});
export function renderMarkdown(source) {
  return sanitizeHtml(markdown.render(source), {
    allowedTags: [...sanitizeHtml.defaults.allowedTags, 'img', 'details', 'summary', 'figure', 'figcaption', 'kbd', 'samp', 'del'],
    allowedAttributes: {
      a: ['href', 'title', 'rel'],
      img: ['src', 'alt', 'title', 'width', 'height', 'loading'],
      code: ['class'],
      h1: ['id'], h2: ['id'], h3: ['id'], h4: ['id'], h5: ['id'], h6: ['id'],
      div: ['class'],
      span: ['class'],
      th: ['align'],
      td: ['align']
    },
    allowedClasses: { code: [/^language-[\w+-]+$/], div: ['math-block'], span: [] },
    allowedSchemes: ['https', 'http', 'mailto'],
    allowedSchemesByTag: { img: ['https', 'http'] },
    allowProtocolRelative: false,
    transformTags: {
      a: (tagName, attribs) => ({ tagName, attribs: { ...attribs, rel: 'noopener noreferrer' } }),
      img: (tagName, attribs) => ({ tagName, attribs: { ...attribs, loading: 'lazy' } })
    }
  });
}

export function normalizeSlug(value) {
  return value.normalize('NFKC').toLowerCase()
    .replace(/[^\p{L}\p{N}-]+/gu, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
}

function validateSlug(value, filename) {
  if (typeof value !== 'string' || value.length > 100 || !/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(value)) {
    throw new Error(filename + ': slug must be 1–100 letters/numbers separated by single hyphens; paths, spaces and HTML are forbidden.');
  }
  return value;
}

function shortString(data, key, filename, max, { optional = true, nullable = false } = {}) {
  const value = data[key];
  if (value === undefined && optional) return undefined;
  if (value === null && nullable) return undefined;
  if (typeof value !== 'string' || (!optional && !value.trim()) || value.length > max || /[\u0000-\u0008\u000b\u000c\u000e-\u001f<>]/.test(value)) {
    throw new Error(filename + ': ' + key + ' must be plain text up to ' + max + ' characters.');
  }
  return value.trim();
}

function dateString(value, filename) {
  if (value instanceof Date) value = value.toISOString();
  if (typeof value !== 'string' || !/^\d{4}-\d{2}-\d{2}(?:[T ]\d{2}:\d{2}(?::\d{2}(?:\.\d{1,3})?)?(?:Z|[+-]\d{2}:\d{2})?)?$/.test(value)) {
    throw new Error(filename + ': date must be YYYY-MM-DD or an ISO date/time.');
  }
  const day = value.slice(0, 10);
  const actual = new Date(day + 'T00:00:00Z');
  if (!Number.isFinite(actual.getTime()) || actual.toISOString().slice(0, 10) !== day || !Number.isFinite(Date.parse(value))) {
    throw new Error(filename + ': invalid calendar date.');
  }
  return day;
}

function validateAliases(value, filename) {
  if (value === undefined) return [];
  if (!Array.isArray(value) || value.length > 20 || value.some(alias => typeof alias !== 'string' || !/^\/(?:p|posts)\/[\p{L}\p{N}_()/-]+\/$/u.test(alias) || alias.includes('//'))) {
    throw new Error(filename + ': aliases must be safe directory paths under /p/ or /posts/, ending in /.');
  }
  return [...new Set(value)];
}

export function parseArticle(source, { filename = 'untitled.md', fallbackDate = new Date() } = {}) {
  let parsed;
  try {
    parsed = matter(source, { engines: { yaml: value => yaml.load(value, { schema: yaml.JSON_SCHEMA }) } });
  } catch (error) {
    throw new Error(filename + ': invalid YAML frontmatter: ' + error.message);
  }
  const data = parsed.data;
  if (!data || Array.isArray(data) || typeof data !== 'object') throw new Error(filename + ': frontmatter must be a mapping.');
  for (const key of Object.keys(data)) {
    if (!META_FIELDS.has(key)) throw new Error(filename + ': unsupported metadata "' + key + '".');
  }
  for (const key of booleanFields) {
    if (data[key] !== undefined && typeof data[key] !== 'boolean') throw new Error(filename + ': ' + key + ' must be true or false.');
  }
  const stem = path.basename(filename, path.extname(filename)).replace(/^\d{4}-\d{2}-\d{2}-/, '');
  const heading = parsed.content.match(/^#\s+(.+?)\s*#*\s*$/m)?.[1];
  const title = data.title === undefined ? undefined : shortString(data, 'title', filename, 240, { optional: false, nullable: false });
  const inferredTitle = heading?.replace(/[\x60*_]/g, '').replace(/<[^>]*>/g, '').trim() || stem.replace(/[-_]+/g, ' ');
  const omittedSlug = data.slug === undefined || data.slug === null || (typeof data.slug === 'string' && !data.slug.trim());
  const id = validateSlug(omittedSlug ? normalizeSlug(stem) : data.slug, filename);
  const description = shortString(data, 'description', filename, 1000, { nullable: true });
  const category = shortString(data, 'category', filename, 100, { nullable: true }) || '随笔';
  for (const key of ['image', 'license']) shortString(data, key, filename, 1000, { nullable: true });
  let tags = data.tags ?? [];
  if (!Array.isArray(tags) || tags.length > 30 || tags.some(tag => typeof tag !== 'string' || !tag.trim() || tag.length > 100 || /[<>\u0000-\u001f]/.test(tag))) {
    throw new Error(filename + ': tags must be an array of up to 30 plain-text strings.');
  }
  tags = [...new Set(tags.map(tag => tag.trim()))];
  const date = dateString(data.date ?? fallbackDate, filename);
  let originalUrl = shortString(data, 'originalUrl', filename, 2000);
  if (originalUrl) {
    try {
      const url = new URL(originalUrl);
      if (!['http:', 'https:'].includes(url.protocol) || url.username || url.password) throw new Error();
    } catch { throw new Error(filename + ': originalUrl must be an HTTP(S) URL.'); }
  }
  const html = renderMarkdown(parsed.content);
  const plainText = sanitizeHtml(html, { allowedTags: [], allowedAttributes: {} }).replace(/\s+/g, ' ').trim();
  const cjkCount = (plainText.match(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu) || []).length;
  const latinWords = (plainText.replace(/[\p{Script=Han}\p{Script=Hiragana}\p{Script=Katakana}]/gu, ' ').match(/[\p{L}\p{N}]+/gu) || []).length;
  return {
    id,
    title: title ?? inferredTitle,
    date,
    minutes: Math.max(1, Math.ceil(cjkCount / 450 + latinWords / 220)),
    category,
    tags,
    description: description || plainText.slice(0, 140) + (plainText.length > 140 ? '…' : ''),
    originalUrl: originalUrl || DEFAULT_URL + '/p/' + encodeURIComponent(id) + '/',
    html,
    draft: data.draft === true || data.hidden === true,
    aliases: validateAliases(data.aliases, filename)
  };
}

async function markdownFiles(directory) {
  let entries;
  try { entries = await readdir(directory, { withFileTypes: true }); }
  catch (error) { if (error.code === 'ENOENT') return []; throw error; }
  const files = [];
  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...await markdownFiles(fullPath));
    else if (entry.isFile() && /\.(?:md|markdown)$/i.test(entry.name)) files.push(fullPath);
  }
  return files;
}

async function fallbackFileDate(filename, root) {
  try {
    const { stdout } = await execFileAsync('git', ['log', '--follow', '--diff-filter=A', '--format=%aI', '--', path.relative(root, filename)], { cwd: root });
    const dates = stdout.trim().split('\n').filter(Boolean);
    if (dates.length) return dates.at(-1);
  } catch { /* Local uploads outside a repository use their saved timestamp. */ }
  return (await stat(filename)).mtime;
}

export async function buildArticles(postsDir, { root = path.resolve(postsDir, '../..') } = {}) {
  const articles = [];
  const ids = new Set();
  for (const filename of await markdownFiles(postsDir)) {
    if ((await stat(filename)).size > MAX_POST_SIZE) throw new Error(filename + ': Markdown exceeds the 2 MB limit. Store images in public/uploads/.');
    const article = parseArticle(await readFile(filename, 'utf8'), { filename, fallbackDate: await fallbackFileDate(filename, root) });
    if (ids.has(article.id)) throw new Error(filename + ': duplicate slug "' + article.id + '". Every post, including drafts, needs a unique slug.');
    ids.add(article.id);
    if (!article.draft) articles.push(article);
  }
  return articles.sort((a, b) => b.date.localeCompare(a.date) || a.id.localeCompare(b.id));
}

function redirectHtml(url, title) {
  return '<!doctype html><html lang="zh-CN"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="refresh" content="0;url=' + escapeHtml(url) + '"><link rel="canonical" href="' + escapeHtml(url) + '"><title>' + escapeHtml(title) + '</title></head><body><p>文章已迁移，<a href="' + escapeHtml(url) + '">点击阅读 ' + escapeHtml(title) + '</a>。</p></body></html>\n';
}

export function articlePage(template, article, url) {
  const content = '<div class="reading-toolbar"><a href="/">← 返回全部文章</a></div><article class="article-panel"><header class="article-header"><span class="post-category">' + escapeHtml(article.category) + '</span><h1>' + escapeHtml(article.title) + '</h1><div class="article-meta"><time datetime="' + article.date + '">' + article.date.replaceAll('-', ' / ') + '</time><span>' + article.minutes + ' 分钟阅读</span></div></header><div class="article-body" id="article-body">' + article.html + '</div><footer class="article-end">记录于 ' + article.date + '</footer></article>';
  if (!/<main\b[^>]*>[\s\S]*?<\/main>/i.test(template)) throw new Error('web/index.html must contain a main element.');
  return template
    .replace(/<title>[\s\S]*?<\/title>/i, () => '<title>' + escapeHtml(article.title) + ' · Will\'s blog</title>')
    .replace(/<meta\s+name="description"\s+content="[^"]*"\s*\/?>/i, () => '<meta name="description" content="' + escapeHtml(article.description) + '">')
    .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, () => '<link rel="canonical" href="' + escapeHtml(url) + '">')
    .replace(/(<main\b[^>]*>)[\s\S]*?(<\/main>)/i, (_match, open, close) => open + content + close);
}

export async function buildSite({ root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), siteUrl = process.env.SITE_URL || DEFAULT_URL } = {}) {
  const base = new URL(siteUrl);
  if (base.protocol !== 'https:' && base.hostname !== 'localhost') throw new Error('SITE_URL must use HTTPS.');
  const origin = base.href.replace(/\/$/, '');
  const articles = await buildArticles(path.join(root, 'content/posts'), { root });
  const dist = path.join(root, 'dist');
  await rm(dist, { recursive: true, force: true });
  await mkdir(dist, { recursive: true });
  // The template is required: a missing frontend must fail a deployment.
  await cp(path.join(root, 'web'), dist, { recursive: true });
  const template = await readFile(path.join(root, 'web/index.html'), 'utf8');
  try { await cp(path.join(root, 'public'), dist, { recursive: true }); }
  catch (error) { if (error.code !== 'ENOENT') throw error; }
  await mkdir(path.join(dist, 'assets'), { recursive: true });
  const publishedArticles = articles.map(({ draft, aliases, ...article }) => article);
  await writeFile(path.join(dist, 'assets/articles.json'), JSON.stringify(publishedArticles, null, 2) + '\n');
  await writeFile(path.join(dist, '.nojekyll'), '');
  for (const [route, title] of [['archives', '文章归档'], ['search', '搜索笔记'], ['links', '常用链接']]) {
    const directory = path.join(dist, route);
    await mkdir(directory, { recursive: true });
    await writeFile(path.join(directory, 'index.html'), redirectHtml(origin + '/#/' + route, title));
  }
  const notFound = template
    .replace(/<title>[\s\S]*?<\/title>/i, '<title>页面未找到 · Will\'s blog</title>')
    .replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, '<meta name="robots" content="noindex">')
    .replace(/(<main\b[^>]*>)[\s\S]*?(<\/main>)/i, '$1<header class="main-intro"><h1>这页笔记不在这里。</h1><p>链接可能已经更新。<a href="/">返回首页</a>，或<a href="/#/search">搜索笔记</a>。</p></header>$2');
  await writeFile(path.join(dist, '404.html'), notFound);
  const aliasOwners = new Map();
  for (const article of articles) aliasOwners.set('/p/' + article.id + '/', article.id);
  for (const article of articles) {
    const canonicalPath = '/p/' + article.id + '/';
    const url = origin + '/p/' + encodeURIComponent(article.id) + '/';
    const articleFile = path.join(dist, canonicalPath, 'index.html');
    await mkdir(path.dirname(articleFile), { recursive: true });
    await writeFile(articleFile, articlePage(template, article, url));
    const aliases = new Set(article.aliases);
    for (const alias of aliases) {
      if (alias === canonicalPath) continue;
      if (aliasOwners.has(alias) && aliasOwners.get(alias) !== article.id) throw new Error('Duplicate article alias: ' + alias);
      aliasOwners.set(alias, article.id);
      const destination = path.join(dist, alias, 'index.html');
      await mkdir(path.dirname(destination), { recursive: true });
      await writeFile(destination, redirectHtml(url, article.title));
    }
  }
  const rssItems = articles.map(article => '<item><title>' + xml(article.title) + '</title><link>' + xml(origin + '/p/' + encodeURIComponent(article.id) + '/') + '</link><guid isPermaLink="true">' + xml(origin + '/p/' + encodeURIComponent(article.id) + '/') + '</guid><pubDate>' + new Date(article.date + 'T00:00:00Z').toUTCString() + '</pubDate><description>' + xml(article.description) + '</description><content:encoded>' + xml(article.html) + '</content:encoded></item>').join('\n');
  await writeFile(path.join(dist, 'rss.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0" xmlns:content="http://purl.org/rss/1.0/modules/content/"><channel><title>Will\'s blog</title><link>' + xml(origin) + '/</link><description>一些学习，一些记录。</description><language>zh-CN</language>' + rssItems + '</channel></rss>\n');
  // Keep the previous Hugo feed URL working too.
  await cp(path.join(dist, 'rss.xml'), path.join(dist, 'index.xml'));
  const sitemapEntries = ['<url><loc>' + xml(origin) + '/</loc></url>', ...articles.map(article => '<url><loc>' + xml(origin + '/p/' + encodeURIComponent(article.id) + '/') + '</loc><lastmod>' + article.date + '</lastmod></url>')];
  await writeFile(path.join(dist, 'sitemap.xml'), '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">' + sitemapEntries.join('') + '</urlset>\n');
  await writeFile(path.join(dist, 'robots.txt'), 'User-agent: *\nAllow: /\nDisallow: /admin/\nSitemap: ' + origin + '/sitemap.xml\n');
  console.log('Built ' + articles.length + ' published posts → ' + dist);
  return publishedArticles;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  buildSite().catch(error => { console.error('Build failed: ' + error.message); process.exitCode = 1; });
}
