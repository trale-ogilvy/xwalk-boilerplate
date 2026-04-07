export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const cell = (rowIndex) => rows[rowIndex]?.children[0]?.textContent?.trim() || '';

  const tag = (cell(0) || 'h2').toLowerCase();
  const allowedTags = ['h1', 'h2', 'h3'];
  const headingTag = allowedTags.includes(tag) ? tag : 'h2';

  const heading = document.createElement(headingTag);
  heading.textContent = cell(1);

  const fontSize = cell(2);

  if (fontSize) heading.style.fontSize = fontSize;

  block.replaceChildren(heading);
}
