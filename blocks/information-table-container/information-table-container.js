import { moveInstrumentation } from "../../scripts/scripts.js";

export default function decorate(block) {
  const infoCardWrapper = document.createElement("div");
  infoCardWrapper.className = "infromation-tabel-container-wrapper";

  [...block.children].forEach((row) => {
    const infoCard = document.createElement("div");
    infoCard.className = "info-card";

    moveInstrumentation(row, infoCard);

    const sectionDiv = document.createElement("div");
    sectionDiv.className = "info-card-section";

    while (row.firstElementChild) {
      sectionDiv.append(row.firstElementChild);
    }

    const children = [...sectionDiv.children];

    if (children.length > 0) {
      const titlePara = children[0].querySelector("p");
      if (titlePara) {
        const titleDiv = document.createElement("div");
        titleDiv.className = "info-card-title";
        titleDiv.append(titlePara);
        sectionDiv.prepend(titleDiv);
      }
    }

    if (children.length > 1) {
      const descContentDiv = children[1];
      const descDiv = document.createElement("div");
      descDiv.className = "info-card-description";

      descDiv.append(descContentDiv);
      const paragraph = descContentDiv.querySelector("p");
      if (paragraph) {
        const fragments = paragraph.innerHTML.split(/<br\s*\/?>/i);
        paragraph.textContent = "";
        fragments.forEach((fragment) => {
          const span = document.createElement("span");
          span.innerHTML = fragment.trim();
          paragraph.append(span);
        });
      }

      // const link = descDiv.querySelector("a");

      // if (link && link.getAttribute("href")) {
      //   const href = link.getAttribute("href");
      //   link.classList.add("info-card-description-url");

      //   if (href.startsWith("http://") || href.startsWith("https://")) {
      //     link.classList.add("is-external-link");
      //     link.target = "_blank";
      //     link.rel = "noopener noreferrer";
      //   } else if (href.startsWith("mailto:")) {
      //     link.classList.add("is-mailto-link");
      //   } else {
      //     link.classList.add("is-internal-link");
      //   }
      // }

      sectionDiv.append(descDiv);
    }

    if (children.length > 2) {
      const featuresDiv = document.createElement("div");
      featuresDiv.className = "info-card-features";

      for (let i = 2; i < children.length; i++) {
        const child = children[i];
        const picture = child.querySelector("picture");
        const para = child.querySelector("p");

        if (picture && para) {
          const featureDiv = document.createElement("div");
          featureDiv.className = "info-card-feature";

          const iconDiv = document.createElement("div");
          iconDiv.className = "info-card-feature-icon";
          iconDiv.append(picture);

          const textDiv = document.createElement("div");
          textDiv.className = "info-card-feature-text";
          textDiv.append(para);

          featureDiv.append(iconDiv);
          featureDiv.append(textDiv);
          featuresDiv.append(featureDiv);
        }
      }

      if (featuresDiv.children.length > 0) {
        sectionDiv.append(featuresDiv);
      }
    }

    infoCard.append(sectionDiv);
    infoCardWrapper.append(infoCard);
  });

  block.textContent = "";
  block.append(infoCardWrapper);
}
