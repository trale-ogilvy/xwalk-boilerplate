import {
  loadSwiper,
  handleMediaBlocks,
  formatDateBox,
} from "../../scripts/utils.js";

/* ---------------------------------- Init ---------------------------------- */

export async function initializeWidgetSwipers() {
  try {
    await loadSwiper();
    const swiperEl = document.querySelector(
      ".slider-widget.highlight-experience"
    );
    new Swiper(swiperEl, {
      loop: false,
      autoplay: false,
      slidesPerView: 1,
      spaceBetween: 0,
      mousewheel: { forceToAxis: true },
      keyboard: { enabled: true },
      pagination: {
        el: ".highlight-experience-pagination",
        clickable: true,
        bulletClass: "swiper-pagination-bullet",
        bulletActiveClass: "swiper-pagination-bullet-active",
      },
    });
  } catch (error) {
    console.error("Failed to initialize widget swipers:", error);
  }
}

/* -------------------------- Process Widget Items -------------------------- */

export function processHighlightExperience(content) {
  const media = content.children[1].children;
  const startDate = content.children[2]?.children[0]?.textContent;
  const endDate = content.children[2]?.children[1]?.textContent;
  const label = content.children[3].children[0].textContent.trim();
  const title = content.children[3].children[1].textContent.trim();
  const link = content.children[4].textContent.trim();

  const mediaSection = document.createElement("div");
  handleMediaBlocks([...media], "", mediaSection);

  const dateBoxComponent = startDate ? formatDateBox(startDate, endDate) : "";

  return `
   <div class="swiper-slide">
          <a href="${link}">
            <div class="media-wrapper">
              ${mediaSection.innerHTML}
            </div>
            ${startDate ? dateBoxComponent : ""}
            <div class="content-wrapper">
              <p class="text-l3">${label}</p>
              <p class="text-p2">${title}</p>
            </div>
          </a>
        </div>`;
}

export function processQuickLink(content) {
  const link = content.children[1].querySelector("a");
  const isExternalLink =
    link?.getAttribute("href") &&
    !link.getAttribute("href").startsWith("/") &&
    !link.getAttribute("href").startsWith("#");
  const icon = content.children[2].children[0];

  return `
  <div class="widget-item ai">
  <a href="${link.href}" target="${isExternalLink ? "_blank" : "_self"}">
  <div class="content-wrapper">
    <p class="text-p2">${link.textContent.trim()}</p>
  </div>
  <div class="image-wrapper icon">
    ${icon.outerHTML}
  </div>
  </a>
</div>
`;
}

/* ---------------------------- Render Components --------------------------- */

export function renderWidgetButton(widgetIcon, widgetText, widget) {
  const widgetButton = document.createElement("div");
  widgetButton.className = "widget-button";

  const textLength = widgetText.length;
  const marqueeItem = document.querySelector(".marquee__item");
  const duration = textLength / 5;
  if (marqueeItem) {
    marqueeItem.style.animationDuration = duration;
  }

  widgetButton.innerHTML = `
    ${widgetIcon ? widgetIcon.outerHTML : ""}
    ${
      widgetText
        ? `   <div class="marquee">
          <div class="marquee__item text-b">${widgetText}</div>
          <div class="marquee__item text-b">${widgetText}</div>
        </div>`
        : ""
    }
    `;

  const widgetButtonImg = widgetButton.querySelector("img");

  widgetButton.addEventListener("click", () => {
    const isOpen = widget.classList.toggle("open");
    if (isOpen) {
      widgetButtonImg.src = "/icons/close-icon.svg";
      widgetButton.style.backgroundColor = "#fff";
      widgetButton.style.transform = "scale(0.7)";
      widgetButtonImg.style.transform = "scale(0.7)";
    } else {
      widgetButtonImg.src = widgetIcon.querySelector("img").src;
      widgetButton.style.backgroundColor = "";
      widgetButton.style.transform = "";
      widgetButtonImg.style.transform = "";
    }
  });

  return widgetButton;
}

export function renderWidgetContainer(highlightExperiences, quickLinks) {
  const widgetContainer = document.createElement("div");
  widgetContainer.className = "widget-container";
  widgetContainer.innerHTML = `
    <div class="widget-item slider-widget highlight-experience swiper">
      <div class="swiper-wrapper">
        ${highlightExperiences.join("")}
        </div>
        <div class="swiper-pagination highlight-experience-pagination"></div>
    </div>
    ${
      quickLinks.length
        ? `<div class="quick-links">
      ${quickLinks.join("")}
    </div>`
        : ""
    }
    `;
  return widgetContainer;
}

/* --------------------------- Editor Environment --------------------------- */

export function handleEditorEnv(block) {
  const widgetItems = [...block.children].slice(2);
  const highlightExperiences = document.createElement("section");
  block.appendChild(highlightExperiences);

  widgetItems.forEach((item) => {
    const widgetItemType = item.children[0].textContent.trim();
    switch (widgetItemType) {
      case "highlight-experience": {
        item.classList.add("highlight-experience");
        highlightExperiences.appendChild(item);
        break;
      }
      case "quick-link": {
        item.classList.add("quick-link");
        break;
      }
    }
  });
}

/* ----------------------- Handle Visibility on Scroll ---------------------- */

export function handleVisibilityOnScroll(widget) {
  const heroSection = document.querySelector(".section.hero-container");
  const threshold = 64;

  function applyScrollHandler() {
    if (window.innerWidth < 768 && heroSection) {
      widget.style.transition = "opacity 0.3s, visibility 0.3s, transform 0.3s";
      widget.style.opacity = "0";
      widget.style.visibility = "hidden";
      widget.style.transform = "translateY(100%)";

      function onScroll() {
        if (window.innerWidth > 768) return;
        const scrollY = window.scrollY || window.pageYOffset;
        if (scrollY >= threshold) {
          widget.style.opacity = "1";
          widget.style.visibility = "visible";
          widget.style.transform = "translateY(0)";
        } else {
          widget.style.opacity = "0";
          widget.style.visibility = "hidden";
          widget.style.transform = "translateY(20%)";
        }
      }

      window.addEventListener("scroll", onScroll);
      onScroll();

      // Clean up on resize
      widget._onScrollHandler = onScroll;
    } else {
      widget.style.opacity = "1";
      widget.style.visibility = "visible";
      widget.style.transform = "translateY(0)";
      if (widget._onScrollHandler) {
        window.removeEventListener("scroll", widget._onScrollHandler);
        widget._onScrollHandler = null;
      }
    }
  }

  window.addEventListener("resize", applyScrollHandler);
  applyScrollHandler();
}

/* ----------------------- Handle Visibility on Load ------------------------ */
export function handleVisibilityOnLoad(widget) {
  setTimeout(() => {
    widget.style.opacity = "1";
  }, 1000);
}
