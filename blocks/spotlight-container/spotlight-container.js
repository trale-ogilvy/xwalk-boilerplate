import { moveInstrumentation } from "../../scripts/scripts.js";

export default function decorate(block) {
  const leftCol = document.createElement("div");
  leftCol.className = "three-image-grid__left-col";

  const rightCol = document.createElement("div");
  rightCol.className = "three-image-grid__right-col";

  const imageContainers = [...block.children].filter((child) =>
    child.querySelector("picture, img")
  );

  imageContainers.forEach((container, index) => {
    const card = document.createElement("div");
    card.className = "three-image-grid__card";
    moveInstrumentation(container, card);

    const imageDiv = container.querySelector(":scope > div:first-child");
    const captionDiv = container.querySelector(":scope > div:nth-child(2)");

    const imageContainer = document.createElement("div");
    imageContainer.className = "three-image-grid__image";
    if (imageDiv?.querySelector("picture, img")) {
      const imgOrPic = imageDiv.querySelector("picture, img").cloneNode(true);
      imageContainer.append(imgOrPic);
      moveInstrumentation(imageDiv, imageContainer);
    }

    const captionContainer = document.createElement("div");
    captionContainer.className = "text-p2 three-card-description";
    if (captionDiv) {
      captionContainer.innerHTML = captionDiv.innerHTML;
      moveInstrumentation(captionDiv, captionContainer);

      const h2Element = captionContainer.querySelector("h2");
      if (h2Element) {
        h2Element.classList.add("text-h4");
        h2Element.style.paddingBottom = "var(--space-xs)";
      }
    }

    card.append(imageContainer);
    card.append(captionContainer);

    if (index === 0) {
      leftCol.append(card);
    } else if (index === 1) {
      const cardWrapper = document.createElement("div");
      cardWrapper.className = "three-image-grid__card-wrapper--staggered";
      cardWrapper.append(card);
      leftCol.append(cardWrapper);
    } else if (index === 2) {
      rightCol.append(card);
    }
  });

  block.innerHTML = "";
  block.className = "three-image-grid";
  block.append(leftCol, rightCol);
}
