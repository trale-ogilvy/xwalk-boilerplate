import {
  resumeNewsTickerAnimation,
  pauseNewsTickerAnimation,
} from "../../scripts/utils.js";
import { createOptimizedPicture } from "../../scripts/aem.js";

export function processCard(card) {
  const imgElement = card.children[0].children[0];
  const label = card.children[1].textContent.trim();
  const description = card.children[2];
  const category = card.children[3].textContent.trim();

  // Create optimized picture element

  // If it's already a picture element, extract the img src and alt
  const img = createOptimizedPicture(
    imgElement.querySelector("img")?.src,
    imgElement.querySelector("img")?.alt,
    false,
    [
      { media: "(min-width: 1600px)", width: "1600" },
      { media: "(min-width: 1200px)", width: "1200" },
      { width: "1000" },
    ]
  );

  const labelHTML = `<h3 class="text-h3 text-text-white">${label.trim()}</h3>`;
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = description.innerHTML;

  // Add classes to specific tags
  tempDiv.querySelectorAll("p").forEach((el) => el.classList.add("text-p2"));
  tempDiv
    .querySelectorAll("h4")
    .forEach((el) => el.classList.add("text-p1", "desc"));
  tempDiv.querySelectorAll("a").forEach((el) => {
    el.classList.add("text-b", "text-text-white", "animate-underline");
  });

  const descriptionHTML = labelHTML + tempDiv.innerHTML;

  return { img, label, descriptionHTML, category };
}

// Helper functions for gallery overlay
function createOptimizedImage(cardImg, breakpoints) {
  if (cardImg.tagName === "PICTURE") {
    const originalSrc = cardImg.querySelector("img")?.src;
    const originalAlt = cardImg.querySelector("img")?.alt || "";
    return createOptimizedPicture(originalSrc, originalAlt, false, breakpoints);
  }
  return cardImg.cloneNode(true);
}

function createSwiperSlides(cards, mainSwiperWrapper, thumbsSwiperWrapper) {
  for (const c of cards) {
    // Main slide
    const slide = document.createElement("div");
    slide.className = "swiper-slide";

    const fullscreenImg = createOptimizedImage(c.img, [
      { media: "(min-width: 1600px)", width: "3200" },
      { media: "(min-width: 1200px)", width: "2400" },
      { media: "(min-width: 900px)", width: "1800" },
      { media: "(min-width: 600px)", width: "1400" },
      { width: "1200" },
    ]);

    slide.appendChild(fullscreenImg);
    mainSwiperWrapper.appendChild(slide);

    // Thumb slide
    const thumbSlide = document.createElement("div");
    thumbSlide.className = "swiper-slide";

    const thumbImg = createOptimizedImage(c.img, [{ width: "300" }]);

    thumbSlide.appendChild(thumbImg);
    thumbsSwiperWrapper.appendChild(thumbSlide);
  }
}

function createNavigationButtons() {
  const prevBtn = document.createElement("div");
  prevBtn.className = "swiper-button-prev";
  prevBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
    <mask id="mask0_4658_9569" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="25">
      <rect width="24" height="24" transform="matrix(1 0 0 -1 0.580078 24.52)" fill="#D9D9D9"></rect>
    </mask>
    <g mask="url(#mask0_4658_9569)">
      <path d="M8.42852 11.52L11.2785 8.67001C11.4785 8.47001 11.5743 8.23667 11.566 7.97001C11.5577 7.70334 11.4618 7.47001 11.2785 7.27001C11.0785 7.07001 10.841 6.96584 10.566 6.95751C10.291 6.94918 10.0535 7.04501 9.85352 7.24501L5.27852 11.82C5.07852 12.02 4.97852 12.2533 4.97852 12.52C4.97852 12.7867 5.07852 13.02 5.27852 13.22L9.85352 17.795C10.0535 17.995 10.291 18.0908 10.566 18.0825C10.841 18.0742 11.0785 17.97 11.2785 17.77C11.4618 17.57 11.5577 17.3367 11.566 17.07C11.5743 16.8033 11.4785 16.57 11.2785 16.37L8.42852 13.52H19.5785C19.8618 13.52 20.0993 13.4242 20.291 13.2325C20.4827 13.0408 20.5785 12.8033 20.5785 12.52C20.5785 12.2367 20.4827 11.9992 20.291 11.8075C20.0993 11.6158 19.8618 11.52 19.5785 11.52H8.42852Z" fill="white"></path>
    </g>
  </svg>`;

  const nextBtn = document.createElement("div");
  nextBtn.className = "swiper-button-next";
  nextBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
    <mask id="mask0_4658_9569" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="25">
      <rect width="24" height="24" transform="matrix(1 0 0 -1 0.580078 24.52)" fill="#D9D9D9"></rect>
    </mask>
    <g mask="url(#mask0_4658_9569)">
      <path d="M8.42852 11.52L11.2785 8.67001C11.4785 8.47001 11.5743 8.23667 11.566 7.97001C11.5577 7.70334 11.4618 7.47001 11.2785 7.27001C11.0785 7.07001 10.841 6.96584 10.566 6.95751C10.291 6.94918 10.0535 7.04501 9.85352 7.24501L5.27852 11.82C5.07852 12.02 4.97852 12.2533 4.97852 12.52C4.97852 12.7867 5.07852 13.02 5.27852 13.22L9.85352 17.795C10.0535 17.995 10.291 18.0908 10.566 18.0825C10.841 18.0742 11.0785 17.97 11.2785 17.77C11.4618 17.57 11.5577 17.3367 11.566 17.07C11.5743 16.8033 11.4785 16.57 11.2785 16.37L8.42852 13.52H19.5785C19.8618 13.52 20.0993 13.4242 20.291 13.2325C20.4827 13.0408 20.5785 12.8033 20.5785 12.52C20.5785 12.2367 20.4827 11.9992 20.291 11.8075C20.0993 11.6158 19.8618 11.52 19.5785 11.52H8.42852Z" fill="white"></path>
    </g>
  </svg>`;

  return { prevBtn, nextBtn };
}

function createCloseButton(onClose) {
  const closeBtn = document.createElement("button");
  const span = document.createElement("span");
  closeBtn.className = "close-button cta-link chevron-left";
  closeBtn.appendChild(span);
  span.textContent = "Back";
  span.classList.add("animate-underline");
  closeBtn.addEventListener("click", onClose);
  return closeBtn;
}

function cleanupSwipers() {
  if (window.fullscreenSwiperMain) {
    window.fullscreenSwiperMain.destroy(true, true);
    window.fullscreenSwiperMain = null;
  }
  if (window.fullscreenSwiperThumbs) {
    window.fullscreenSwiperThumbs.destroy(true, true);
    window.fullscreenSwiperThumbs = null;
  }
}

function createOverlayStructure(cards) {
  const overlay = document.createElement("div");
  overlay.className = "image-gallery-overlay-artist";

  // Swiper main container
  const mainSwiperContainer = document.createElement("div");
  mainSwiperContainer.className = "swiper mySwiper2";

  const mainSwiperWrapper = document.createElement("div");
  mainSwiperWrapper.className = "swiper-wrapper";

  // Swiper thumbs container
  const swiperContainer = document.createElement("div");
  swiperContainer.className = "thumbs-container";
  const thumbsSwiperContainer = document.createElement("div");
  thumbsSwiperContainer.className = "swiper mySwiper thumbs";
  swiperContainer.appendChild(thumbsSwiperContainer);

  thumbsSwiperContainer.setAttribute("thumbsSlider", "");
  const thumbsSwiperWrapper = document.createElement("div");
  thumbsSwiperWrapper.className = "swiper-wrapper";

  // Create slides
  createSwiperSlides(cards, mainSwiperWrapper, thumbsSwiperWrapper);

  // Caption and page indicator
  const caption = document.createElement("div");
  caption.className = "swiper-caption";
  caption.innerHTML = cards[0]?.descriptionHTML || "";

  const galleryIndicator = document.createElement("div");
  galleryIndicator.className = "gallery-indicator";

  const pageIndicator = document.createElement("div");
  pageIndicator.className = "swiper-page-indicator text-l3";
  pageIndicator.innerText = `1 / ${cards.length}`;

  // Navigation and pagination
  const { prevBtn, nextBtn } = createNavigationButtons();
  const dotPagination = document.createElement("div");
  dotPagination.className = "swiper-pagination dot-pagination";

  // Assembly
  mainSwiperContainer.appendChild(mainSwiperWrapper);
  mainSwiperContainer.appendChild(prevBtn);
  mainSwiperContainer.appendChild(nextBtn);
  mainSwiperContainer.appendChild(dotPagination);
  thumbsSwiperContainer.appendChild(thumbsSwiperWrapper);

  return {
    overlay,
    mainSwiperContainer,
    thumbsSwiperContainer,
    swiperContainer,
    caption,
    galleryIndicator,
    pageIndicator,
    prevBtn,
    nextBtn,
    dotPagination,
  };
}

function renderLimitedPagination(swiper, current, total) {
  const maxVisible = 6;
  const bullets = [];
  const start = Math.floor(current / maxVisible) * maxVisible;

  for (let i = 0; i < maxVisible && start + i < total; i++) {
    const idx = start + i;
    const active = idx === current ? " swiper-pagination-bullet-active" : "";
    bullets.push(
      `<span class="swiper-pagination-bullet${active}" data-index="${idx}"></span>`
    );
  }

  // Fill up to maxVisible for consistent UI
  while (bullets.length < maxVisible) {
    bullets.push(
      `<span class="swiper-pagination-bullet swiper-pagination-bullet-empty"></span>`
    );
  }

  return bullets.join("");
}

function setupPaginationEvents(overlay, cards, swiper) {
  const paginationEl = overlay.querySelector(".dot-pagination");
  if (!paginationEl || !swiper) return;

  paginationEl.innerHTML = renderLimitedPagination(
    swiper,
    swiper.realIndex,
    cards.length
  );

  paginationEl.querySelectorAll(".swiper-pagination-bullet").forEach((el) => {
    if (!el.classList.contains("swiper-pagination-bullet-empty")) {
      el.onclick = () => {
        swiper.slideToLoop(Number(el.dataset.index), 500, false);
      };
    }
  });
}

function initializeSwipers(elements, cards, index) {
  const {
    thumbsSwiperContainer,
    prevBtn,
    nextBtn,
    overlay,
    caption,
    pageIndicator,
  } = elements;

  // Update caption and page indicator on slide change
  function updateCaptionAndPage(swiper) {
    const realIndex = swiper.realIndex || 0;
    pageIndicator.innerText = `${realIndex + 1} / ${cards.length}`;
    caption.innerHTML =
      `<p class="text-l3">${pageIndicator.innerText}</p>` +
      (cards[realIndex]?.descriptionHTML || "");
  }

  // Initialize Swiper thumbs first
  window.fullscreenSwiperThumbs = new Swiper(thumbsSwiperContainer, {
    spaceBetween: 8,
    slidesPerView: Math.min(3, cards.length),
    freeMode: true,
    watchSlidesProgress: true,
    slideToClickedSlide: true,
    breakpoints: {
      1024: { slidesPerView: Math.min(5, cards.length) },
    },
  });

  // Initialize Swiper main
  window.fullscreenSwiperMain = new Swiper(elements.mainSwiperContainer, {
    loop: true,
    navigation: {
      nextEl: nextBtn,
      prevEl: prevBtn,
    },
    thumbs: {
      swiper: window.fullscreenSwiperThumbs,
    },
    initialSlide: index,
    centeredSlides: true,
    slidesPerView: 1,
    keyboard: {
      enabled: true,
    },
    on: {
      slideChange: function () {
        updateCaptionAndPage(this);
        setupPaginationEvents(overlay, cards, this);
      },
      afterInit: function () {
        setupPaginationEvents(overlay, cards, this);
      },
    },
    pagination: {
      el: ".dot-pagination",
      clickable: false,
      renderBullet: () => "",
    },
  });

  // Sync to initial slide
  window.fullscreenSwiperThumbs.slideToLoop(index, 0, false);
  window.fullscreenSwiperMain.slideToLoop(index, 0, false);
  updateCaptionAndPage(window.fullscreenSwiperMain);
}

// Handle card click to open fullscreen gallery
export function handleCardClick(block, cards) {
  const cardElements = block.querySelectorAll(".card");

  for (const [index, cardEl] of cardElements.entries()) {
    cardEl.addEventListener("click", () => {
      pauseNewsTickerAnimation("artist-carousel");

      // Create overlay structure
      const elements = createOverlayStructure(cards);
      const {
        overlay,
        galleryIndicator,
        pageIndicator,
        caption,
        swiperContainer,
      } = elements;

      // Handle close functionality
      const handleClose = () => {
        resumeNewsTickerAnimation("artist-carousel");
        overlay.style.opacity = 0;
        overlay.style.transform = "translateY(40px)";
        setTimeout(() => {
          if (overlay.parentNode) document.body.removeChild(overlay);
          cleanupSwipers();
        }, 400);
      };

      // Create close buttons
      const closeBtn = createCloseButton(handleClose);
      const closeBtnClone = createCloseButton(handleClose);

      // Assemble overlay
      galleryIndicator.appendChild(closeBtnClone);
      galleryIndicator.appendChild(pageIndicator);

      overlay.appendChild(galleryIndicator);
      overlay.appendChild(elements.mainSwiperContainer);
      overlay.appendChild(swiperContainer);
      overlay.appendChild(caption);
      overlay.appendChild(closeBtn);
      document.body.appendChild(overlay);

      // Fade in overlay
      setTimeout(() => {
        overlay.style.opacity = 1;
        overlay.style.transform = "translateY(0)";
      }, 10);

      // Initialize Swipers
      initializeSwipers(elements, cards, index);
    });
  }
}
