export function handleEditorEnv(cards) {
  cards.forEach((card) => {
    // Wrap image and artist divs in a container
    const imageContainer = document.createElement("div");
    imageContainer.classList.add("image-container");
    const imageDiv = card.children[0];
    const artistDiv = card.children[7];
    imageContainer.appendChild(imageDiv);
    imageContainer.appendChild(artistDiv);
    card.insertBefore(imageContainer, card.firstChild);

    // Wrap card content in a container
    const contentContainer = document.createElement("div");
    const leftContainer = document.createElement("div");
    leftContainer.classList.add("left-container");
    const rightContainer = document.createElement("div");
    rightContainer.classList.add("right-container");

    contentContainer.classList.add("card-content");
    const contentDivs = [...card.children].slice(2, 6);
    contentDivs.forEach((div, idx) => {
      if (idx === 2) {
        rightContainer.appendChild(div);
      } else {
        leftContainer.appendChild(div);
      }
    });
    contentContainer.appendChild(leftContainer);
    contentContainer.appendChild(rightContainer);
    card.insertBefore(contentContainer, card.children[1]);
  });
}
