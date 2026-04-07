export default function decorate(block) {
  const rows = [...block.children];
  if (!rows.length) return;

  const [tagCell, textCell] = [...rows[0].children];
  const tag = (tagCell?.textContent?.trim() || 'h2').toLowerCase();
  const allowedTags = ['h1', 'h2', 'h3'];
  const headingTag = allowedTags.includes(tag) ? tag : 'h2';

  const heading = document.createElement(headingTag);
  heading.textContent = textCell?.textContent?.trim() || '';

  block.replaceChildren(heading);
}
