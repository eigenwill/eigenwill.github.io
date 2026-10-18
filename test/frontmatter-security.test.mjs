import test from 'node:test';
import assert from 'node:assert/strict';
import { parseArticle } from '../scripts/build.mjs';
import { parseYamlFrontmatter } from '../scripts/frontmatter.mjs';

const options = { filename: 'security-note.md', fallbackDate: new Date('2026-10-18T00:00:00Z') };

test('metadata never invokes JavaScript or another frontmatter engine', () => {
  const marker = '__eigenwillFrontmatterSecurityTest';
  delete globalThis[marker];
  const payload = `({title:(globalThis.${marker}=true,"Probe"),date:"2026-10-18"})`;
  for (const language of ['javascript', ' javascript', 'js', 'json', 'toml']) {
    assert.throws(() => parseArticle(`---${language}\n${payload}\n---\n# Note`, options), /Only YAML frontmatter/);
    assert.equal(globalThis[marker], undefined);
  }
});

test('YAML object tags cannot construct executable values', () => {
  assert.throws(() => parseArticle('---\ntitle: !!js/function >\n  function () { return "Probe"; }\n---\n# Note', options), /unknown tag/);
});

test('plain and explicit YAML frontmatter retain normal Markdown and Windows uploads', () => {
  for (const header of ['---', '---yaml', '--- yaml', '---yml']) {
    const article = parseArticle(`\uFEFF${header}\r\ntitle: 安全的笔记\r\ndate: 2024-04-23\r\n---\r\n## 正文\r\n\r\n$\\alpha_1$`, options);
    assert.equal(article.title, '安全的笔记');
    assert.equal(article.date, '2024-04-23');
    assert.match(article.html, /\\alpha_1/);
  }
});

test('missing metadata delimiter fails clearly and normal Markdown rules remain text', () => {
  assert.throws(() => parseArticle('---\ntitle: Note\n# Missing closing delimiter', options), /must end with a separate --- line/);
  const parsed = parseYamlFrontmatter('----\n\nA Markdown horizontal rule.');
  assert.deepEqual(parsed.data, {});
  assert.equal(parsed.content, '----\n\nA Markdown horizontal rule.');
});
