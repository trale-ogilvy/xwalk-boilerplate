export default function decorate(block) {
  block.classList.add("file-download-container");
  const wrapper = document.createElement("div");
  wrapper.className = "file-download-wrapper";

  const isEmpty = (element) => {
    if (!element) return true;
    const textContent = element.textContent?.trim();
    const hasImages = element.querySelector("img");
    const hasLinks = element.querySelector("a");
    return !textContent && !hasImages && !hasLinks;
  };

  Array.from(block.children).forEach((fileItem) => {
    fileItem.classList.add("file-item");
    const sections = Array.from(fileItem.children);

    const itemContent = document.createElement("div");
    itemContent.className = "file-item-content";

    const leftContent = document.createElement("div");
    leftContent.className = "file-item-left";

    const rightContent = document.createElement("div");
    rightContent.className = "file-item-right";

    sections.forEach((section, sectionIndex) => {
      switch (sectionIndex) {
        case 0:
          // File icon - commented out for now
          // if (section && !isEmpty(section)) {
          //   section.classList.add("file-icon");
          //   leftContent.appendChild(section);
          // }
          break;

        case 1:
          if (section && !isEmpty(section)) {
            section.classList.add("file-title");
            leftContent.appendChild(section);
          }
          break;

        case 2:
          if (section && !isEmpty(section)) {
            section.classList.add("file-type");
            leftContent.appendChild(section);
          } else if (section) {
            section.style.display = "none";
          }
          break;

        case 3:
          if (section && !isEmpty(section)) {
            section.classList.add("file-description");
            leftContent.appendChild(section);
          }
          break;

        case 4:
        case 5:
        case 6:
          break;

        default:
          if (sectionIndex > 6) {
            section.remove();
          }
          break;
      }
    });

    const downloadContainer = document.createElement("div");
    downloadContainer.className = "file-download-area";

    let downloadUrl = null;
    let isCtaLink = false;

    const ctaLinkSection = sections[6];
    if (ctaLinkSection && !isEmpty(ctaLinkSection)) {
      const linkText = ctaLinkSection.textContent?.trim();
      const linkElement = ctaLinkSection.querySelector("a");

      if (linkElement && linkElement.href) {
        downloadUrl = linkElement.href;
        isCtaLink = true;
      } else if (linkText && linkText.startsWith("http")) {
        downloadUrl = linkText;
        isCtaLink = true;
      }
    }

    if (!downloadUrl) {
      const fileUploadSection = sections[4];
      if (fileUploadSection && !isEmpty(fileUploadSection)) {
        const fileLink = fileUploadSection.querySelector("a");
        if (fileLink && fileLink.href) {
          downloadUrl = fileLink.href;
          isCtaLink = false;
        }
      }
    }

    if (downloadUrl) {
      downloadContainer.onclick = () => {
          window.open(downloadUrl, "_blank");
      };
      downloadContainer.style.cursor = "pointer";
    } else {
      downloadContainer.style.cursor = "default";
      downloadContainer.onclick = null;
    }

    const descriptionSection = sections[3];
    if (descriptionSection && !isEmpty(descriptionSection)) {
      const downloadText =
        descriptionSection.querySelector("p") || descriptionSection;
      downloadText.classList.add("file-download-text");
      downloadText.classList.add("text-b");

      if (!downloadUrl) {
        downloadText.style.color = "var(--Brand-brand-grey, #6E6E6E)";
        downloadText.classList.add("no-underline");
      }

      downloadContainer.appendChild(downloadText);
    }

    const iconDescSection = sections[5];
    if (iconDescSection && !isEmpty(iconDescSection)) {
      const arrowIcon = iconDescSection.querySelector("img");
      if (arrowIcon) {
        arrowIcon.classList.add("file-download-arrow");
        downloadContainer.appendChild(arrowIcon);
      }
    }

    if (downloadContainer.children.length > 0) {
      rightContent.appendChild(downloadContainer);
    }

    itemContent.appendChild(leftContent);
    itemContent.appendChild(rightContent);

    fileItem.textContent = "";
    fileItem.appendChild(itemContent);
    wrapper.appendChild(fileItem);
  });

  block.textContent = "";
  block.appendChild(wrapper);
}
