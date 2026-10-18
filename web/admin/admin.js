const fileInput = document.querySelector('#markdown-file');
const dropZone = document.querySelector('#drop-zone');
const result = document.querySelector('#check-result');

// This checker reads selected files locally. It never uploads content or stores credentials.
function textElement(tag, value, className) {
  const element = document.createElement(tag);
  element.textContent = value;
  if (className) element.className = className;
  return element;
}

function scalar(value) {
  const trimmed = value.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    try { return JSON.parse(trimmed); } catch { return trimmed.slice(1, -1); }
  }
  if (trimmed.startsWith("'") && trimmed.endsWith("'")) return trimmed.slice(1, -1).replace(/''/g, "'");
  return trimmed.replace(/\s+#.*$/, '').trim();
}

function showError(message) {
  result.replaceChildren(textElement('p', message, 'result-error'));
  result.hidden = false;
}

function validDate(value) {
  if (!/^\d{4}-\d{2}-\d{2}(?:T.*)?$/.test(value)) return false;
  const datePart = value.slice(0, 10);
  const parsed = new Date(`${datePart}T00:00:00Z`);
  return !Number.isNaN(parsed.valueOf()) && parsed.toISOString().slice(0, 10) === datePart;
}

async function checkFile(file) {
  if (!file) return;
  if (!/\.(md|markdown)$/i.test(file.name)) return showError('请选择 .md 或 .markdown 文件。');
  if (file.size > 2 * 1024 * 1024) return showError('文件超过 2 MB，请检查是否误选了其他文件。');
  try {
    const text = (await file.text()).replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
    if (!text.trim()) return showError('这个文件是空的，请写好正文后再检查。');
    const values = {};
    const rawValues = {};
    const notes = [];
    let body = text;
    let hasFrontmatter = false;
    if (/^---\s*\n/.test(text)) {
      const match = text.match(/^---[^\S\n]*\n([\s\S]*?)\n---[^\S\n]*(?:\n|$)/);
      if (!match) return showError('开头的 YAML 信息区没有结束。请在信息区末尾另起一行写 ---。');
      hasFrontmatter = true;
      body = text.slice(match[0].length);
      for (const line of match[1].split('\n')) {
        const field = line.match(/^(title|date|description|category|tags|slug|draft)\s*:\s*(.*)$/);
        if (field) {
          values[field[1]] = scalar(field[2]);
          rawValues[field[1]] = field[2].trim().replace(/\s+#.*$/, '').trim();
        }
      }
      if (Object.values(values).some(value => value === '|' || value === '>')) notes.push('含有多行 YAML 写法，当前检查器仅预览单行字段；请以 GitHub 构建结果为准。');
    } else {
      notes.push('没有 YAML 信息区也可以发布，系统会从正文与文件名补全基本信息。建议使用模板填写分类和日期。');
    }
    const heading = body.match(/^#\s+(.+?)\s*#*\s*$/m)?.[1]?.replace(/[\x60*_]/g, '').replace(/<[^>]*>/g, '').trim();
    const filenameTitle = file.name.replace(/\.(md|markdown)$/i, '').replace(/^\d{4}-\d{2}-\d{2}-/, '').replace(/[-_]+/g, ' ');
    const title = values.title || heading || filenameTitle || file.name;
    if (hasFrontmatter && !values.title) notes.push('未填写 title，系统会自动推断标题。');
    if (values.date && !validDate(values.date)) notes.push('日期格式可能有误，请使用 YYYY-MM-DD，例如 2026-10-18。');
    if (values.slug && (values.slug.length > 100 || !/^[\p{L}\p{N}]+(?:-[\p{L}\p{N}]+)*$/u.test(values.slug))) notes.push('slug 需为 1–100 个字母、数字，以单个连字符分隔；可使用中文。不要填写空格、路径或完整网址。');
    const invalidDraft = Object.hasOwn(values, 'draft') && !/^(true|false)$/i.test(rawValues.draft);
    if (invalidDraft) notes.push('draft 只能填写不带引号的 true 或 false；其他写法会导致构建失败。');
    if (!body.trim()) notes.push('文章正文为空，请在 YAML 信息区后补充内容。');
    const isDraft = /^true$/i.test(rawValues.draft || '');
    if (isDraft) notes.push('这篇文章是草稿。将 draft 改为 false 后，才会出现在博客中。');
    notes.push('检查已完成，文件尚未上传。请点击上方「上传 Markdown」并在 GitHub 提交。');
    result.replaceChildren(textElement('h3', '文件已读取', 'result-ok'));
    const details = document.createElement('dl');
    const rows = [
      ['文件', file.name],
      ['标题', title],
      ['日期', values.date || '未填写，构建时自动补全'],
      ['分类', values.category || '未填写，使用默认分类'],
      ['状态', invalidDraft ? '草稿字段需要修正' : isDraft ? '草稿 · 不公开发布' : '发布文章'],
    ];
    for (const [label, value] of rows) details.append(textElement('dt', label), textElement('dd', value));
    result.append(details);
    const noteList = document.createElement('ul');
    for (const note of notes) noteList.append(textElement('li', note));
    result.append(noteList);
    result.hidden = false;
  } catch {
    showError('无法读取文件，请重新选择 UTF-8 编码的 Markdown 文件。');
  }
}

document.querySelector('#choose-file').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => checkFile(fileInput.files[0]));
dropZone.addEventListener('dragover', event => {
  event.preventDefault();
  dropZone.classList.add('dragover');
});
dropZone.addEventListener('dragleave', event => {
  if (!dropZone.contains(event.relatedTarget)) dropZone.classList.remove('dragover');
});
dropZone.addEventListener('drop', event => {
  event.preventDefault();
  dropZone.classList.remove('dragover');
  if (event.dataTransfer.files.length !== 1) return showError('请每次检查一个 Markdown 文件。');
  checkFile(event.dataTransfer.files[0]);
});
