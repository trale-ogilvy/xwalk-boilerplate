export default function decorate(block) {
  console.log('Decorating head block', block);
  const rows = [...block.children];
  console.log('Block rows:', rows);
  if (!rows.length) return;

  const cell = (rowIndex) => rows[rowIndex]?.children[0]?.textContent?.trim() || '';
  console.log('Cell values:', cell())

  const tag = (cell(0) || 'h2').toLowerCase();
  const allowedTags = ['h1', 'h2', 'h3'];
  const headingTag = allowedTags.includes(tag) ? tag : 'h2';

  const heading = document.createElement(headingTag);
  heading.textContent = cell(1);

  const fontSize = cell(2);

  if (fontSize) heading.style.fontSize = fontSize;

  console.log('Created heading:', heading);

  block.replaceChildren(heading);
}
