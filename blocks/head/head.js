export default function decorate(block) {
  console.log('Decorating head block', block);
  const rows = [...block.children];
  if (!rows.length) return;

  const cells = [...rows[0].children];
  const [tagCell, textCell, fontSizeCell, fontWeightCell, textAlignCell, colorCell] = cells;

  const tag = (tagCell?.textContent?.trim() || 'h2').toLowerCase();
  const allowedTags = ['h1', 'h2', 'h3'];
  const headingTag = allowedTags.includes(tag) ? tag : 'h2';

  const heading = document.createElement(headingTag);
  heading.textContent = textCell?.textContent?.trim() || '';

  const fontSize = fontSizeCell?.textContent?.trim();
  const fontWeight = fontWeightCell?.textContent?.trim();
  const textAlign = textAlignCell?.textContent?.trim();
  const color = colorCell?.textContent?.trim();

  if (fontSize) heading.style.fontSize = fontSize;
  if (fontWeight) heading.style.fontWeight = fontWeight;
  if (textAlign) heading.style.textAlign = textAlign;
  if (color) heading.style.color = color;

  block.replaceChildren(heading);
}
