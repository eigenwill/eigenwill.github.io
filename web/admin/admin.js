import { checkBundle, checkMarkdown } from './article-check.js';

const fileInput = document.querySelector('#markdown-file');
const directoryInput = document.querySelector('#article-directory');
const result = document.querySelector('#check-result');

// Selected files stay in this browser. This page never uploads files or stores credentials.
function textElement(tag, value, className) {
  const element = document.createElement(tag);
  element.textContent = value;
  if (className) element.className = className;
  return element;
}

async function showCheck(files, directory) {
  if (!files.length) return;
  try {
    const checked = directory ? await checkBundle(files) : await checkMarkdown(files[0]);
    result.replaceChildren(textElement('h3', checked.errors.length ? '有内容需要检查' : '本地预检已完成', checked.errors.length ? 'result-error' : 'result-ok'));
    const details = document.createElement('dl');
    for (const [label, value] of checked.rows) details.append(textElement('dt', label), textElement('dd', value));
    result.append(details);
    const notes = document.createElement('ul');
    for (const message of checked.errors) notes.append(textElement('li', message, 'result-error'));
    for (const message of checked.notes) notes.append(textElement('li', message));
    if (!directory) notes.append(textElement('li', '单文件预检不会检查本地图片。带图片文章请将正文命名为 index.md，与 images/ 一起放进文章目录，再选择「检查文章目录」。'));
    notes.append(textElement('li', '文件尚未上传。发布仍需在 GitHub 提交，最终以构建结果为准。'));
    result.append(notes);
    result.hidden = false;
  } catch {
    result.replaceChildren(textElement('p', '无法读取文件，请重新选择 UTF-8 编码的文章目录或 Markdown 文件。', 'result-error'));
    result.hidden = false;
  }
}

document.querySelector('#choose-directory').addEventListener('click', () => directoryInput.click());
directoryInput.addEventListener('change', () => showCheck(directoryInput.files, true));
document.querySelector('#choose-file').addEventListener('click', () => fileInput.click());
fileInput.addEventListener('change', () => showCheck(fileInput.files, false));
