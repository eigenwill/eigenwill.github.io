// A local preflight, not a Markdown/YAML parser. The production build is authoritative.
export const validSlug = value => typeof value === 'string' && value.length <= 100 && /^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(value);

function scalar(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try { return JSON.parse(trimmed); } catch { return trimmed.slice(1, -1); }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1).replace(/''/g, "'");
  return trimmed.replace(/\s+#.*$/, '').trim();
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) return false;
  const parsed = new Date(`${value.slice(0, 10)}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === value.slice(0, 10);
}

export async function checkMarkdown(file, folder = '') {
  const errors = [], notes = [], values = {}, rawValues = {};
  if (!/\.(md|markdown)$/i.test(file.name)) return { errors: ['请选择 .md 或 .markdown 文件。'], notes, rows: [] };
  if (file.size > 2 * 1024 * 1024) return { errors: ['正文超过 2 MB，请检查是否误选了其他文件。'], notes, rows: [] };
  const text = (await file.text()).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  if (!text.trim()) return { errors: ['正文文件是空的。'], notes, rows: [] };
  let body = text;
  if (/^---\s*\n/.test(text)) {
    const match = text.match(/^---[^\S\n]*\n([\s\S]*?)\n---[^\S\n]*(?:\n|$)/);
    if (!match) return { errors: ['开头的 YAML 信息区没有结束，请在末尾另起一行写 ---。'], notes, rows: [] };
    body = text.slice(match[0].length);
    for (const line of match[1].split('\n')) {
      const field = line.match(/^(title|date|description|category|tags|slug|draft)\s*:\s*(.*)$/);
      if (field) {
        values[field[1]] = scalar(field[2]);
        rawValues[field[1]] = field[2].trim().replace(/\s+#.*$/, '').trim();
      }
    }
    if (Object.values(values).some(value => value === '|' || value === '>')) notes.push('含有多行 YAML，当前预览仅识别单行字段，请以构建结果为准。');
  } else notes.push('没有 YAML 信息区，构建时会推断基本信息；建议使用模板明确标题、日期和 slug。');
  if (values.date && !validDate(values.date)) notes.push('日期可能有误，请使用 YYYY-MM-DD，例如 2026-10-18。');
  if (values.slug && !validSlug(values.slug)) errors.push('slug 需为 1–100 个字母或数字，以单个连字符分隔；不可含空格或路径。');
  if (folder && values.slug && values.slug !== folder) notes.push(`slug 与目录名不同：源目录是 ${folder}，文章地址使用 ${values.slug}。新文章建议保持一致，已发布文章请保留原 slug。`);
  if (Object.hasOwn(values, 'draft') && !/^(true|false)$/i.test(rawValues.draft)) errors.push('draft 只能填写不带引号的 true 或 false。');
  if (!body.trim()) errors.push('文章正文为空。');
  const isDraft = /^true$/i.test(rawValues.draft || '');
  const heading = body.match(/^#\s+(.+?)\s*#*\s*$/m)?.[1];
  const rows = [
    ['标题', values.title || heading || folder || file.name.replace(/\.(md|markdown)$/i, '')],
    ['日期', values.date || '未填写，构建时自动补全'],
    ['分类', values.category || '未填写，使用默认分类'],
    ['状态', isDraft ? '草稿 · 不公开发布' : '发布文章'],
  ];
  if (isDraft) notes.push('将 draft 改为 false 后，文章才会出现在博客中。');
  return { errors, notes, rows, body };
}

export async function checkBundle(fileList) {
  const files = Array.from(fileList);
  const paths = files.map(file => file.webkitRelativePath || '');
  const roots = new Set(paths.map(value => value.split('/')[0]));
  if (!files.length || paths.some(value => !value.includes('/')) || roots.size !== 1) {
    return { errors: ['请选择一个完整的文章目录，里面应有 index.md 和 images/。'], notes: [], rows: [] };
  }
  const folder = paths[0].split('/')[0];
  if (!validSlug(folder)) return { errors: ['文章目录名需为 1–100 个字母或数字，以单个连字符分隔，例如 my-new-post。'], notes: [], rows: [] };
  const index = files.find(file => file.webkitRelativePath === `${folder}/index.md`);
  if (!index) return { errors: [`缺少 ${folder}/index.md。请选择文章目录本身，不要选择外层 posts 或 images 目录。`], notes: [], rows: [] };
  const checked = await checkMarkdown(index, folder);
  checked.rows.unshift(['文章目录', `content/posts/${folder}/`], ['文件数量', String(files.length)]);
  if (files.length > 100) checked.notes.push('GitHub 网页每次最多上传 100 个文件；请分批提交或使用 GitHub Desktop。');
  for (const file of files) if (file.size > 25 * 1024 * 1024) checked.errors.push(`${file.name} 超过 GitHub 网页每文件 25 MiB 的上传上限。`);
  if (checked.body) {
    // Only the usual ![alt](./images/file.png) form is checked here. Full syntax is validated by the build.
    const prose = checked.body.replace(/^ {0,3}(`{3,}|~{3,})[^\n]*\n[\s\S]*?^ {0,3}\1[^\n]*$/gm, '').replace(/`[^`\n]*`/g, '');
    const relativePaths = new Set(paths.map(value => value.slice(folder.length + 1)));
    for (const match of prose.matchAll(/!\[[^\]\n]*\]\(\s*<?([^\s)>]+)>?(?:\s+["'][^\n]*?["'])?\s*\)/g)) {
      const target = match[1];
      if (/^(?:[a-z][a-z0-9+.-]*:|\/|#)/i.test(target)) continue;
      let decoded;
      try { decoded = decodeURIComponent(target.split(/[?#]/)[0]); }
      catch { checked.notes.push(`图片路径的编码可能有误：${target}`); continue; }
      const parts = [];
      let escaped = false;
      for (const part of decoded.split('/')) {
        if (!part || part === '.') continue;
        if (part === '..') {
          if (!parts.length) { escaped = true; break; }
          parts.pop();
        } else parts.push(part);
      }
      if (escaped) checked.errors.push(`图片请放在当前文章目录内：${target}`);
      else if (!relativePaths.has(parts.join('/'))) checked.errors.push(`未找到图片：${target}（文件名与大小写需一致）。`);
    }
  }
  checked.notes.push('只预检常见行内图片写法；引用式图片、HTML 和复杂 Markdown 请以 GitHub 构建结果为准。');
  checked.notes.push(`上传时拖入整个 ${folder} 文件夹，确认 GitHub 列表中保留 ${folder}/index.md 和 ${folder}/images/…，再提交。`);
  return checked;
}
