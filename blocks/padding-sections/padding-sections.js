/**
 * @param {HTMLElement} block
 */
export default function decorate(block) {
  const firstRow = block.children[0];

  const cssVariableName = firstRow?.children[0]?.textContent.trim();

  if (cssVariableName && cssVariableName.startsWith("--")) {
    const parentSection = block.closest(".padding-sections-wrapper");
    if (parentSection) {
      parentSection.style.setProperty(
        "padding-top",
        `var(${cssVariableName})`,
        "important"
      );
    } else {
      console.warn(" Padding not applied.");
    }
  } else {
    console.warn(`Invalid CSS  '${cssVariableName}'`);
  }

  block.innerHTML = "";

  block.style.display = "none";
}
