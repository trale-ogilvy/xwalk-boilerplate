export default function decorate(block) {
    const mainContainer = document.createElement("div");
    const cardsData = [];
  
    Array.from(block.children).forEach((card) => {
      cardsData.push({
        element: card,
      });
    });
  
    const galleryContainer = document.createElement("div");
    galleryContainer.className = "column-tile-container-col";
  
    const galleryWrapper = document.createElement("div");
    galleryWrapper.className = "column-tile-wrapper-col";
    galleryContainer.appendChild(galleryWrapper);
  
    cardsData.forEach((cardData) => {
      const card = cardData.element;
      const hasContent = card.textContent.trim() !== "" || card.querySelector("picture");
      if (!hasContent) return;
  
      const galleryCard = document.createElement("div");
      galleryCard.className = "column-tile-card";
  
      const image = card.querySelector("picture");
      if (image) {
        const imageWrapper = document.createElement("div");
        imageWrapper.className = "column-tile-images";
        imageWrapper.appendChild(image.cloneNode(true));
        galleryCard.appendChild(imageWrapper);
      }
  
      const contentContainer = document.createElement("div");
      contentContainer.className = "column-tile-content";
  
      const cardSections = Array.from(card.children);
  
      // LEFT COLUMN
      const leftColumn = document.createElement("div");
      leftColumn.className = "column-tile-left";
  
      if (cardSections[1]?.textContent.trim()) {
        const label = document.createElement("p");
        label.className = "column-tile-label";
        label.textContent = cardSections[1].textContent.trim();
        leftColumn.appendChild(label);
      }
  
      const secondaryLink = document.createElement("a");
      secondaryLink.href = cardSections[2]?.querySelector("a")?.getAttribute("href") || "#";
      secondaryLink.className = "column-tile-sub-link";
  
      if (cardSections[3]?.textContent.trim()) {
        const subDescription = document.createElement("p");
        subDescription.className = "column-tile-sub-description";
        subDescription.textContent = cardSections[3].textContent.trim();
        secondaryLink.appendChild(subDescription);
      }
  
      if (secondaryLink.children.length > 0) {
        leftColumn.appendChild(secondaryLink);
      }
  
      // RIGHT COLUMN
      const rightColumn = document.createElement("div");
      rightColumn.className = "column-tile-right";
  
      const featuresContainer = document.createElement("div");
      featuresContainer.className = "column-tile-features";
  
      for (let i = 7; i < cardSections.length; i += 2) {
        if (i + 1 < cardSections.length) {
          const featureItem = document.createElement("div");
          featureItem.className = "column-tile-feature";
  
          const icon = cardSections[i].querySelector("picture")?.cloneNode(true);
          if (icon) {
            const iconWrapper = document.createElement("div");
            iconWrapper.className = "column-tile-feature-icon";
            iconWrapper.appendChild(icon);
            featureItem.appendChild(iconWrapper);
          }
  
          const text = document.createElement("div");
          text.className = "column-tile-feature-text";
          text.textContent = cardSections[i + 1].textContent.trim();
          featureItem.appendChild(text);
  
          featuresContainer.appendChild(featureItem);
        }
      }
  
      if (cardSections[6]?.textContent.trim()) {
        const rightDescription = document.createElement("p");
        rightDescription.className = "column-tile-supporting-text";
        rightDescription.textContent = cardSections[6].textContent.trim();
        rightColumn.appendChild(rightDescription);
      }
  
      if (featuresContainer.children.length > 0) {
        rightColumn.appendChild(featuresContainer);
      }
  
      // NEW WRAPPER for LEFT + RIGHT columns
      const contentMain = document.createElement("div");
      contentMain.className = "column-tile-content-main";
  
      if (leftColumn.children.length > 0) {
        contentMain.appendChild(leftColumn);
      }
  
      if (rightColumn.children.length > 0) {
        contentMain.appendChild(rightColumn);
      }
  
      if (contentMain.children.length > 0) {
        contentContainer.appendChild(contentMain);
      }
  
      // LINK SECTION
      const contentLink = document.createElement("div");
      contentLink.className = "column-tile-content-link";
  
      const link = document.createElement("a");
      link.href = cardSections[4]?.querySelector("a")?.getAttribute("href") || "#";
      link.className = "column-tile-link";
  
      if (cardSections[5]?.textContent.trim()) {
        const description = document.createElement("p");
        description.className = "column-tile-description";
  
        const textSpan = document.createElement("span");
        textSpan.className = "description-text";
        textSpan.textContent = cardSections[5].textContent.trim();
        description.appendChild(textSpan);
  
        const svg = document.createElement("img");
        svg.src = "/icons/chevron_forward.svg";
        svg.alt = "Arrow";
        svg.className = "column-tile-description-icon";
        description.appendChild(svg);
  
        link.appendChild(description);
      }
  
      if (link.children.length > 0) {
        contentLink.appendChild(link);
        contentContainer.appendChild(contentLink);
      }
  
      if (contentContainer.children.length > 0) {
        galleryCard.appendChild(contentContainer);
      }
  
      galleryWrapper.appendChild(galleryCard);
    });
  
    mainContainer.appendChild(galleryContainer);
    block.innerHTML = "";
    block.appendChild(mainContainer);
  }