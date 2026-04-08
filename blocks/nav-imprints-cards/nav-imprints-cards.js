import { getElements } from "../../scripts/utils.js";

export default function decorate(block) {
  // Use getElements for proper selection
  const elements = getElements(block, [
    { key: "textRows", sel: ":scope > div" },
    { key: "pictures", sel: "picture" },
    { key: "buttons", sel: ".button-container a" },
  ]);

  const textRow = elements.textRows[1];
  // Extract content from the structured rows
  const description = textRow.textContent || "";

  // Get images, anchor link, and new window setting
  const images = [...elements.pictures];
  const anchorLink = elements.buttons[0];

  // Extract the 4th div content to determine if link opens in new window
  const fourthDiv = elements.textRows[3];
  const openInNewWindow =
    fourthDiv?.querySelector("p")?.textContent?.trim().toLowerCase() ===
      "true" || false;

  // Remove the original content
  block.innerHTML = "";

  // Create the new structure for the block with anchor wrapper
  const anchorUrl = anchorLink?.href || "#";
  const hasAnchor = anchorLink && anchorUrl !== "#";
  const targetAttribute = openInNewWindow
    ? ' target="_blank" rel="noopener noreferrer"'
    : "";

  block.innerHTML = `
  <section class="nav-imprints-cards">
    ${
      hasAnchor
        ? `<a href="${anchorUrl}" class="nav-imprints-card-link"${targetAttribute}>`
        : ""
    }
      <div class="nav-imprints-header">
        <div class="nav-imprints-header-image">${images[0].innerHTML}</div>
        <p class="text-text-grey-600 text-l2">${description}</p>
      </div>
      <div class="nav-imprints-cards-images">
        ${images
          .slice(1, 4)
          .map((img) => {
            return `
                <picture class="nav-imprints-image">
                  ${img.innerHTML}
                </picture>
            `;
          })
          .join("")}
      </div>
    ${hasAnchor ? "</a>" : ""}
  </section>  
  `;
}
