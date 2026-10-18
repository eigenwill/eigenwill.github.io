import test from 'node:test';
import assert from 'node:assert/strict';
import { checkBundle, checkMarkdown } from '../web/admin/article-check.js';

const markdown = (body, slug = 'my-post') => `---\ntitle: "文章"\nslug: "${slug}"\ndate: "2026-10-18"\ndraft: false\n---\n\n${body}`;
function file(relativePath, content = '') {
  return { name: relativePath.split('/').at(-1), webkitRelativePath: relativePath, size: Buffer.byteLength(content), text: async () => content };
}

test('local directory preflight finds its article and a relative image', async () => {
  const checked = await checkBundle([
    file('my-post/index.md', markdown('![实验结果](./images/result.png)')),
    file('my-post/images/result.png', 'image'),
  ]);
  assert.deepEqual(checked.errors, []);
  assert.ok(checked.rows.some(row => row[1] === 'content/posts/my-post/'));
});

test('preflight reports missing image with exact case and keeps independent article files apart', async () => {
  const checked = await checkBundle([
    file('my-post/index.md', markdown('![结果](./images/Result.png)')),
    file('my-post/images/result.png', 'image'),
  ]);
  assert.ok(checked.errors.some(message => message.includes('Result.png')));
});

test('preflight requires the selected folder to contain index.md directly', async () => {
  const checked = await checkBundle([file('posts/my-post/index.md', markdown('正文'))]);
  assert.ok(checked.errors.some(message => message.includes('缺少 posts/index.md')));
});

test('different stable slug and source folder remain valid', async () => {
  const checked = await checkBundle([file('my-post/index.md', markdown('正文', 'published-link'))]);
  assert.deepEqual(checked.errors, []);
  assert.ok(checked.notes.some(message => message.includes('published-link')));
});

test('preflight permits encoded filenames and ignores image examples in code blocks', async () => {
  const body = '![结果](./images/a%20b.png)\n\n```markdown\n![示例](./images/not-a-real-image.png)\n```';
  const checked = await checkBundle([file('my-post/index.md', markdown(body)), file('my-post/images/a b.png', 'image')]);
  assert.deepEqual(checked.errors, []);
});

test('preflight permits remote and legacy public images without selected local files', async () => {
  const checked = await checkBundle([file('my-post/index.md', markdown('![远程](https://example.com/a.png)\n![旧图片](/uploads/a.png)'))]);
  assert.deepEqual(checked.errors, []);
});

test('preflight rejects a local image escaping its article directory', async () => {
  const checked = await checkBundle([file('my-post/index.md', markdown('![图片](../other/images/a.png)'))]);
  assert.ok(checked.errors.some(message => message.includes('当前文章目录内')));
});

test('standalone Markdown preflight remains available and flags invalid draft', async () => {
  const checked = await checkMarkdown(file('old-post.md', '---\ntitle: "旧文章"\ndraft: "false"\n---\n正文'));
  assert.ok(checked.errors.some(message => message.includes('draft')));
});
