import { createTextImageModal } from "../../scripts/delayed.js";
import { loadSwiper } from "../../scripts/utils.js";

export default async function decorate(block) {
  const textCol = document.createElement("div");
  textCol.className = "text-image-with-carousel__text-column";

  const imageCol = document.createElement("div");
  imageCol.className = "text-image-with-carousel__image-column";

  const rows = [...block.children];

  const titleRow = rows[0];
  const descRow = rows[1];
  const carouselImage1Row = rows[2];
  const carouselImage2Row = rows[3];
  const carouselImage3Row = rows[4];
  const carouselImage4Row = rows[5];
  const carouselImage5Row = rows[6];
  const positionRow = rows[7];
  const floorButtonTextRow = rows[8];
  const floorButtonLinkRow = rows[9];
  const galleryButtonTextRow = rows[10];
  const galleryButtonLinkRow = rows[11];
  const isTnc = rows[12];
  const tncContent = rows[13];

  const imageRight = positionRow?.textContent.trim().toLowerCase() === "right";
  const title =
    titleRow?.textContent
      .trim()
      .replace(/&amp;nbsp;/g, " ")
      .replace(/&lt;\/?p&gt;/g, "") || "";
  const descriptionContent =
    descRow?.querySelector("div")?.cloneNode(true) || descRow?.cloneNode(true);

  const contentWrapper = document.createElement("div");
  contentWrapper.className = "text-image-with-carousel__content-wrapper";

  if (title) {
    const titleEl = document.createElement("div");
    titleEl.className = "text-image-with-carousel__title text-t5";
    titleEl.textContent = title;
    textCol.append(titleEl);
  }

  if (descriptionContent) {
    const links = descriptionContent.querySelectorAll("a");
    links.forEach((link) => {
      if (
        link.getAttribute("title") &&
        link.getAttribute("title") !== link.getAttribute("title").toUpperCase()
      ) {
        const span = document.createElement("span");
        span.className = "text-text-black normal-link text-p1";
        span.textContent = link.textContent;
        link.innerHTML = "";
        link.append(span);
        return;
      }
      if (!link.querySelector("span")) {
        const span = document.createElement("span");
        span.className = "cta-link animate-underline text-text-black";
        span.textContent = link.textContent;
        link.innerHTML = "";
        link.append(span);
      } else {
        const currentSpan = link.querySelector("span");
        const extraSpan = document.createElement("span");
        extraSpan.className = "cta-link animate-underline text-text-black";
        extraSpan.textContent = link.textContent;
        link.innerHTML = "";
        link.append(extraSpan);
        link.appendChild(currentSpan);
      }
    });

    const paragraphs = descriptionContent.querySelectorAll("p");
    paragraphs.forEach((p) => {
      if (p.querySelector("a")) {
        if (p.innerHTML.includes(" | ")) {
          const parts = p.innerHTML.split(" | ");
          p.innerHTML = "";
          parts.forEach((part, idx) => {
            if (idx > 0) {
              const separator = document.createElement("div");
              separator.className = "cta-separator";
              p.appendChild(separator);
            }
            const span = document.createElement("span");
            span.innerHTML = part;
            p.appendChild(span);
          });
        } else if (p.innerHTML.includes("img")) {
          const parts = p.innerHTML;
          const span = document.createElement("span");
          span.innerHTML = parts;
          p.innerHTML = "";
          p.appendChild(span);
        }

        const a = p.querySelector("a");
        const titleAttr = a?.getAttribute("title");
        if (titleAttr && titleAttr === titleAttr.toUpperCase()) {
          p.classList.add("cta-wrapper");
        }
      }

      const iconElements = p.querySelectorAll(".icon");
      if (iconElements.length > 0) {
        const fragment = document.createDocumentFragment();
        let currentIconWrapper = null;

        const childNodes = Array.from(p.childNodes);
        childNodes.forEach((node) => {
          if (
            node.nodeType === Node.ELEMENT_NODE &&
            node.classList.contains("icon")
          ) {
            currentIconWrapper = document.createElement("div");
            currentIconWrapper.className = "icon-text-wrapper";
            currentIconWrapper.appendChild(node.cloneNode(true));
            fragment.appendChild(currentIconWrapper);
          } else if (
            currentIconWrapper &&
            node.nodeType === Node.TEXT_NODE &&
            node.textContent.trim()
          ) {
            const textNode = document.createTextNode(node.textContent);
            currentIconWrapper.appendChild(textNode);
          } else if (
            node.nodeType === Node.ELEMENT_NODE &&
            node.tagName === "BR"
          ) {
            currentIconWrapper = null;
          } else if (currentIconWrapper) {
            currentIconWrapper.appendChild(node.cloneNode(true));
          } else {
            fragment.appendChild(node.cloneNode(true));
          }
        });

        p.innerHTML = "";
        p.appendChild(fragment);
      } else {
        const brElements = p.querySelectorAll("br");
        brElements.forEach((br) => br.remove());
      }
    });

    const descEl = document.createElement("div");
    descEl.className = "text-image-with-carousel__description text-p1";
    while (descriptionContent.firstChild) {
      descEl.appendChild(descriptionContent.firstChild);
    }
    contentWrapper.append(descEl);
  }

  const buttonData = [];
  if (
    floorButtonTextRow?.textContent.trim() &&
    floorButtonLinkRow?.querySelector("a.button")
  ) {
    buttonData.push({
      text: floorButtonTextRow.textContent.trim(),
      link: floorButtonLinkRow.querySelector("a.button"),
    });
  }
  if (
    galleryButtonTextRow?.textContent.trim() &&
    galleryButtonLinkRow?.querySelector("a.button")
  ) {
    buttonData.push({
      text: galleryButtonTextRow.textContent.trim(),
      link: galleryButtonLinkRow.querySelector("a.button"),
    });
  }

  if (buttonData.length > 0) {
    const buttonsWrapper = document.createElement("div");
    buttonsWrapper.className = "text-image-with-carousel__buttons-wrapper";
    buttonData.forEach((data, index) => {
      const newButton = data.link.cloneNode(true);
      newButton.innerHTML = "";
      newButton.classList.add("button-styled");

      const textSpan = document.createElement("span");
      const textElement = document.createElement("p");
      textElement.className = "text-b";
      textElement.textContent = data.text;
      textSpan.appendChild(textElement);
      newButton.append(textSpan);

      if (buttonData.length === 1) {
        const icon = document.createElement("div");
        icon.className = "button-icon";
        icon.setAttribute("aria-hidden", "true");
        newButton.append(icon);
      }

      buttonsWrapper.append(newButton);

      if (buttonData.length === 2 && index === 0) {
        const separator = document.createElement("div");
        separator.className = "button-separator";
        buttonsWrapper.append(separator);
      }
    });
    contentWrapper.append(buttonsWrapper);
  }

  textCol.append(contentWrapper);
  block.innerHTML = "";

  if (imageRight) {
    block.classList.add("image-right");
  }

  /* ------------------------------- Modal ------------------------------- */
  if (isTnc?.textContent.trim() === "true" && tncContent) {
    createTextImageModal(block, tncContent, "/tnc");
  }

  const carouselImageRows = [
    carouselImage1Row,
    carouselImage2Row,
    carouselImage3Row,
    carouselImage4Row,
    carouselImage5Row,
  ];

  const pictures = [];
  carouselImageRows.forEach((row) => {
    if (row) {
      const picture = row.querySelector("picture");
      if (picture) {
        pictures.push(picture);
      }
    }
  });

  console.log("Found carousel images:", pictures.length);

  if (pictures.length > 0) {
    await loadSwiper();

    const carouselContainer = document.createElement("div");
    carouselContainer.className =
      "text-image-with-carousel__carousel-container";

    const swiperContainer = document.createElement("div");
    swiperContainer.className = "swiper";

    const swiperWrapper = document.createElement("div");
    swiperWrapper.className = "swiper-wrapper";

    pictures.forEach((pic) => {
      const slide = document.createElement("div");
      slide.className = "swiper-slide";
      slide.append(pic.cloneNode(true));
      swiperWrapper.append(slide);
    });

    swiperContainer.append(swiperWrapper);

    const nextButton = document.createElement("div");
    nextButton.className = "swiper-button-next";
    const prevButton = document.createElement("div");
    prevButton.className = "swiper-button-prev";

    const pagination = document.createElement("div");
    pagination.className = "swiper-pagination";

    swiperContainer.append(prevButton, nextButton, pagination);
    carouselContainer.append(swiperContainer);
    imageCol.append(carouselContainer);

    setTimeout(() => {
      new window.Swiper(swiperContainer, {
        loop: pictures.length > 1,
        navigation: {
          nextEl: nextButton,
          prevEl: prevButton,
        },
        pagination: {
          el: pagination,
          clickable: true,
        },
      });
    }, 100);
  }

  block.append(imageCol, textCol);
}
