import yaml from 'js-yaml';

// Markdown metadata is data. Never dispatch to a language-specific evaluator.
export function parseYamlFrontmatter(source) {
  if (typeof source !== 'string') throw new TypeError('Markdown must be text.');
  const text = source.replace(/^\uFEFF/, '').replace(/\r\n?/g, '\n');
  const lines = text.split('\n');
  const header = lines[0];
  const yamlHeader = /^---(?:[\t ]*(?:yaml|yml))?[\t ]*$/i.test(header);
  if (!yamlHeader) {
    if (/^---[\t ]*[^\s-]/.test(header)) {
      throw new Error('Only YAML frontmatter is supported; executable metadata is forbidden.');
    }
    return { data: {}, content: text };
  }
  const closingLine = lines.findIndex((line, index) => index > 0 && /^---[\t ]*$/.test(line));
  if (closingLine < 0) throw new Error('YAML frontmatter must end with a separate --- line.');
  return {
    data: yaml.load(lines.slice(1, closingLine).join('\n'), { schema: yaml.JSON_SCHEMA }) ?? {},
    content: lines.slice(closingLine + 1).join('\n')
  };
}
