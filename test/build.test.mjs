import test from 'node:test';
import assert from 'node:assert/strict';
import { access, mkdtemp, mkdir, readFile, readdir, rm, symlink, writeFile } from 'node:fs/promises';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import os from 'node:os';
import path from 'node:path';
import { articlePage, buildArticles, buildSite, parseArticle, renderMarkdown } from '../scripts/build.mjs';

const exec = promisify(execFile);
const post = (metadata, body = '# Body\n\nAn article.') => '---\n' + metadata + '\n---\n' + body;
const options = { filename: '2026-10-18-my-first-note.md', fallbackDate: new Date('2026-10-18T05:00:00Z') };

async function fixture(t) {
  const directory = await mkdtemp(path.join(os.tmpdir(), 'blog-build-'));
  t.after(() => rm(directory, { recursive: true, force: true }));
  await mkdir(path.join(directory, 'content/posts'), { recursive: true });
  return directory;
}

async function bundle(directory, name, metadata = '', body = '', images = {}) {
  const postDirectory = path.join(directory, 'content/posts', name);
  await mkdir(path.join(postDirectory, 'images'), { recursive: true });
  await writeFile(path.join(postDirectory, 'index.md'), post(metadata, body));
  for (const [assetPath, contents] of Object.entries(images)) {
    const filename = path.join(postDirectory, 'images', assetPath);
    await mkdir(path.dirname(filename), { recursive: true });
    await writeFile(filename, contents);
  }
  return postDirectory;
}

async function frontend(directory) {
  await mkdir(path.join(directory, 'web'), { recursive: true });
  await writeFile(path.join(directory, 'web/index.html'), '<!doctype html><html><head><base href="/"><title>Blog</title><meta name="description" content="Blog"><link rel="canonical" href="https://eigenwill.github.io/"></head><body><main id="main">Loading…</main></body></html>');
}

test('a plain uploaded Markdown file works without frontmatter', () => {
  const article = parseArticle('# 我的第一篇笔记\n\nSome text.', options);
  assert.equal(article.title, '我的第一篇笔记');
  assert.equal(article.id, 'my-first-note');
  assert.equal(article.date, '2026-10-18');
  assert.equal(article.category, '随笔');
  assert.deepEqual(article.tags, []);
  assert.match(article.html, /<h1 id="我的第一篇笔记">/);
  assert.equal(parseArticle('No heading.', options).title, 'my first note');
});

test('frontmatter overrides inferred values and preserves local calendar dates', () => {
  const article = parseArticle(post('title: 自定义标题\nslug: custom-note\ndate: 2024-04-08T00:59:09+08:00\ncategory: Linux\ntags: [Arch, Gnome]\ndescription: 一句话介绍'), options);
  assert.equal(article.title, '自定义标题');
  assert.equal(article.id, 'custom-note');
  assert.equal(article.date, '2024-04-08');
  assert.equal(article.description, '一句话介绍');
  assert.equal(article.originalUrl, 'https://eigenwill.github.io/p/custom-note/');
});

test('an optional blank CMS slug falls back to the article filename', () => {
  for (const metadata of ['slug: ""', 'slug:', 'slug: "   "']) {
    assert.equal(parseArticle(post(metadata), options).id, 'my-first-note');
  }
});

test('bundle index filenames infer their parent folder while retaining headings and explicit metadata', () => {
  for (const extension of ['md', 'markdown']) {
    const filename = 'content/posts/my-first-note/index.' + extension;
    assert.equal(parseArticle('No heading.', { ...options, filename }).id, 'my-first-note');
    assert.equal(parseArticle('No heading.', { ...options, filename }).title, 'my first note');
    assert.equal(parseArticle('# A heading', { ...options, filename }).title, 'A heading');
    const explicit = parseArticle(post('slug: custom-slug\ntitle: Custom title'), { ...options, filename });
    assert.equal(explicit.id, 'custom-slug');
    assert.equal(explicit.title, 'Custom title');
  }
});

test('Markdown tables, fenced code, and duplicate heading anchors are supported', () => {
  const source = '# Topic\n\n## Topic\n\n| A | B |\n| - | - |\n| 1 | 2 |\n\n~~~bash\nprintf "<hello>"\n~~~';
  const html = renderMarkdown(source);
  assert.match(html, /<table>/);
  assert.match(html, /id="topic"/);
  assert.match(html, /id="topic-2"/);
  assert.match(html, /<code class="language-bash">printf "&lt;hello&gt;"/);
});

test('TeX escapes and double-backslash matrix rows survive Markdown and sanitation', () => {
  const inline = '$\\begin{aligned}f_1(E)&=1\\\\&=0\\end{aligned}$';
  const block = '$$\\begin{matrix}a & b\\\\c & d\\end{matrix}$$';
  const bracketed = '\\(\\alpha_i\\\\\\beta_i\\)';
  const html = renderMarkdown(inline + '\n\n' + block + '\n\n' + bracketed);
  assert.ok(html.includes('\\begin{aligned}f_1(E)&amp;=1\\\\&amp;=0\\end{aligned}'));
  assert.ok(html.includes('\\begin{matrix}a &amp; b\\\\c &amp; d\\end{matrix}'));
  assert.ok(html.includes(bracketed));
});

test('unsafe HTML, event handlers and script URLs are removed but useful HTML remains', () => {
  const html = renderMarkdown('<script>alert(1)</script>\n<img src="/uploads/image.png" onerror="alert(2)"><img src="javascript:alert(3)">\n<a href="javascript:alert(4)" onclick="alert(5)">text</a>\n<details><summary>Read</summary>Safe</details>');
  assert.doesNotMatch(html, /<script|alert\(|onerror|onclick|javascript:/);
  assert.match(html, /src="\/uploads\/image.png"/);
  assert.match(html, /<details><summary>Read<\/summary>Safe<\/details>/);
});

test('invalid dates, metadata types, YAML and unsafe slugs fail with clear errors', () => {
  for (const metadata of ['date: 2024-02-30', 'date: not-a-date', 'date: 2024-01-01T99:00:00Z', 'title: [a, b]', 'title: ""', 'tags: tag', 'tags: [ok, 1]', 'draft: yes', 'draft: "false"', 'category: { a: b }', 'slug: ../admin', 'slug: two words', 'aliases: [/admin/]', 'aliases: [/assets/thing/]', 'unknown: 42', 'originalUrl: javascript:alert(1)', 'title: [broken']) {
    assert.throws(() => parseArticle(post(metadata), options), /my-first-note\.md:/, metadata);
  }
});

test('drafts and hidden posts are excluded; .markdown uploads and order work', async t => {
  const directory = await fixture(t);
  const posts = path.join(directory, 'content/posts');
  await writeFile(path.join(posts, 'old.md'), post('date: 2024-01-01'));
  await writeFile(path.join(posts, 'new.markdown'), post('date: 2026-01-01'));
  await writeFile(path.join(posts, 'draft.md'), post('date: 2026-05-01\ndraft: true'));
  await writeFile(path.join(posts, 'hidden.md'), post('date: 2026-05-01\nhidden: true'));
  assert.deepEqual((await buildArticles(posts)).map(article => article.id), ['new', 'old']);
});

test('duplicate slugs fail even when one post is a draft', async t => {
  const directory = await fixture(t);
  const posts = path.join(directory, 'content/posts');
  await writeFile(path.join(posts, 'one.md'), post('slug: duplicate'));
  await writeFile(path.join(posts, 'two.md'), post('slug: duplicate\ndraft: true'));
  await assert.rejects(buildArticles(posts), /duplicate slug "duplicate"/);
});

test('bundle Markdown, references, HTML and image links use encoded public image paths', async t => {
  const directory = await fixture(t);
  const body = [
    '![Markdown](<./images/实验 图.png>)',
    '![Reference][plot]',
    '[plot]: images/nested/curve.svg?width=2#detail',
    '<img src="images/实验 图.png?size=large#plot" alt="HTML">',
    '[Full size](<./images/实验 图.png>)',
    '![CMS](/content/posts/source-folder/images/实验%20图.png)',
    '![Remote](https://example.com/photo.png)',
    '![Legacy](/uploads/legacy.png)',
    '[Ordinary link](guide.html)',
    '[Repository source](/content/posts/other/index.md)'
  ].join('\n\n');
  await bundle(directory, 'source-folder', 'slug: public-slug', body, { '实验 图.png': 'png', 'nested/curve.svg': '<svg />' });
  const [article] = await buildArticles(path.join(directory, 'content/posts'));
  const imagePath = '/p/public-slug/images/' + encodeURIComponent('实验 图.png');
  assert.ok(article.html.includes('src="' + imagePath + '"'));
  assert.ok(article.html.includes('src="' + imagePath + '?size=large#plot"'));
  assert.ok(article.html.includes('href="' + imagePath + '"'));
  assert.match(article.html, /src="\/p\/public-slug\/images\/nested\/curve\.svg\?width=2#detail"/);
  assert.match(article.html, /src="https:\/\/example.com\/photo.png"/);
  assert.match(article.html, /src="\/uploads\/legacy.png"/);
  assert.match(article.html, /href="guide.html"/);
  assert.match(article.html, /href="\/content\/posts\/other\/index.md"/);
  assert.doesNotMatch(article.html, /source-folder|src="\.\/images/);
});

test('a root index cannot silently hide the existing bundles or legacy posts', async t => {
  for (const extension of ['md', 'markdown']) {
    const directory = await fixture(t);
    await bundle(directory, 'existing', '', '# Existing article');
    await writeFile(path.join(directory, 'content/posts/legacy.md'), '# Legacy article');
    await writeFile(path.join(directory, 'content/posts/index.' + extension), '# Accidental root upload');
    await assert.rejects(buildArticles(path.join(directory, 'content/posts')), /put index.md or index.markdown inside an article subdirectory/);
  }
});

test('bundle assets are isolated, drafts and sidecar Markdown never publish, and RSS images are absolute', async t => {
  const directory = await fixture(t);
  await frontend(directory);
  const first = await bundle(directory, 'first-folder', 'slug: first', '![First](./images/result.png)', { 'result.png': 'first image', 'notes.md': '# Private source' });
  await writeFile(path.join(first, 'sidecar.md'), '# This is not another post');
  await bundle(directory, 'second', '', '![Second](./images/result.png)', { 'result.png': 'second image' });
  await bundle(directory, 'draft', 'draft: true', '![Unfinished](./images/missing.png)', { 'secret.png': 'draft image' });
  const articles = await buildSite({ root: directory, siteUrl: 'https://blog.example' });
  assert.deepEqual(articles.map(article => article.id).sort(), ['first', 'second']);
  assert.equal(await readFile(path.join(directory, 'dist/p/first/images/result.png'), 'utf8'), 'first image');
  assert.equal(await readFile(path.join(directory, 'dist/p/second/images/result.png'), 'utf8'), 'second image');
  await assert.rejects(access(path.join(directory, 'dist/p/draft')), { code: 'ENOENT' });
  const generatedFiles = await readdir(path.join(directory, 'dist'), { recursive: true });
  assert.equal(generatedFiles.some(filename => /\.(?:md|markdown)$/i.test(filename)), false);
  const json = await readFile(path.join(directory, 'dist/assets/articles.json'), 'utf8');
  assert.match(json, /\/p\/first\/images\/result.png/);
  assert.doesNotMatch(json, /content\/posts|Private source|first-folder|secret.png/);
  const rss = await readFile(path.join(directory, 'dist/rss.xml'), 'utf8');
  assert.match(rss, /https:\/\/blog.example\/p\/first\/images\/result.png/);
  assert.match(rss, /https:\/\/blog.example\/p\/second\/images\/result.png/);
  assert.match(await readFile(path.join(directory, 'dist/p/first/index.html'), 'utf8'), /src="\/p\/first\/images\/result.png"/);
});

test('missing, unsupported and escaping bundle image paths stop the build clearly', async t => {
  for (const imagePath of ['images/missing.png', '../outside.png', 'images/../../outside.png', 'images/%2e%2e/outside.png', 'images/note.md', 'photo.png']) {
    const directory = await fixture(t);
    await bundle(directory, 'unsafe', '', '![](' + imagePath + ')');
    await assert.rejects(buildArticles(path.join(directory, 'content/posts')), /unsafe\/index.md: (?:image not found|image path must stay inside|local images must use)/, imagePath);
  }
});

test('symlinks in bundle images cannot publish files outside the bundle', async t => {
  for (const linkType of ['file', 'directory', 'images-root']) {
    const directory = await fixture(t);
    const postDirectory = await bundle(directory, 'linked', '', '# Article');
    const outsideDirectory = path.join(directory, 'private');
    await mkdir(outsideDirectory);
    await writeFile(path.join(outsideDirectory, 'secret.png'), 'private');
    if (linkType === 'images-root') {
      await rm(path.join(postDirectory, 'images'), { recursive: true });
      await symlink(outsideDirectory, path.join(postDirectory, 'images'));
    } else {
      await symlink(linkType === 'file' ? path.join(outsideDirectory, 'secret.png') : outsideDirectory, path.join(postDirectory, 'images', linkType === 'file' ? 'secret.png' : 'nested'));
    }
    await assert.rejects(buildArticles(path.join(directory, 'content/posts')), /symbolic links are not allowed/);
  }
});

test('plain Markdown dates use first Git addition rather than checkout time', async t => {
  const directory = await fixture(t);
  const filename = path.join(directory, 'content/posts/tracked.md');
  await exec('git', ['init', '-q'], { cwd: directory });
  await writeFile(filename, '# Tracked note');
  await exec('git', ['add', '.'], { cwd: directory });
  await exec('git', ['-c', 'user.name=Blog test', '-c', 'user.email=blog@example.invalid', 'commit', '-qm', 'Add note'], {
    cwd: directory,
    env: { ...process.env, GIT_AUTHOR_DATE: '2024-04-08T21:59:09+08:00', GIT_COMMITTER_DATE: '2024-04-08T21:59:09+08:00' }
  });
  await writeFile(filename, '# Updated note');
  const [article] = await buildArticles(path.join(directory, 'content/posts'), { root: directory });
  assert.equal(article.date, '2024-04-08');
});

test('build emits crawlable articles, legacy redirects, full RSS, copied admin, and no drafts', async t => {
  const directory = await fixture(t);
  await mkdir(path.join(directory, 'web/admin'), { recursive: true });
  await mkdir(path.join(directory, 'public/uploads'), { recursive: true });
  const template = '<!doctype html><html><head><base href="/"><title>Blog</title><meta name="description" content="Blog"><link rel="canonical" href="https://eigenwill.github.io/"></head><body><main id="main">Loading…</main></body></html>';
  await writeFile(path.join(directory, 'web/index.html'), template);
  await writeFile(path.join(directory, 'web/admin/index.html'), '<p>CMS</p>');
  await writeFile(path.join(directory, 'public/google-test.html'), 'verification');
  await writeFile(path.join(directory, 'content/posts/example.md'), post('title: Example\ndate: 2026-10-18\naliases: [/p/旧地址/]', '## The body\n\nFull article.'));
  await writeFile(path.join(directory, 'content/posts/draft.md'), post('draft: true'));
  const articles = await buildSite({ root: directory });
  assert.equal(articles.length, 1);
  assert.match(await readFile(path.join(directory, 'dist/p/example/index.html'), 'utf8'), /<title>Example · Will's blog<\/title>.*<article class="article-panel">/);
  assert.match(await readFile(path.join(directory, 'dist/p/example/index.html'), 'utf8'), /id="the-body"/);
  assert.match(await readFile(path.join(directory, 'dist/p/旧地址/index.html'), 'utf8'), /https:\/\/eigenwill.github.io\/p\/example\//);
  assert.match(await readFile(path.join(directory, 'dist/index.xml'), 'utf8'), /&lt;h2 id=&quot;the-body&quot;&gt;/);
  assert.doesNotMatch(await readFile(path.join(directory, 'dist/assets/articles.json'), 'utf8'), /"draft"/);
  assert.equal(await readFile(path.join(directory, 'dist/admin/index.html'), 'utf8'), '<p>CMS</p>');
  assert.equal(await readFile(path.join(directory, 'dist/google-test.html'), 'utf8'), 'verification');
  assert.equal(await readFile(path.join(directory, 'dist/.nojekyll'), 'utf8'), '');
  assert.match(await readFile(path.join(directory, 'dist/archives/index.html'), 'utf8'), /https:\/\/eigenwill.github.io\/#\/archives/);
  assert.match(await readFile(path.join(directory, 'dist/404.html'), 'utf8'), /这页笔记不在这里/);
});

test('article metadata containing dollar replacement syntax is rendered literally', () => {
  const article = parseArticle(post('title: "$&"\ndescription: "$\\u0026"'), options);
  const html = articlePage('<title>Old</title><meta name="description" content="old"><link rel="canonical" href="old"><main></main>', article, 'https://eigenwill.github.io/p/test/');
  assert.match(html, /<title>\$&amp; · Will's blog<\/title>/);
});
