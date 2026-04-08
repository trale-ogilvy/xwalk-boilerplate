import {
  resumeNewsTickerAnimation,
  pauseNewsTickerAnimation,
} from "../../scripts/utils.js";
import { createOptimizedPicture } from "../../scripts/aem.js";

export function processCard(card) {
  const imgElement = card.children[0].children[0];
  const label = card.children[1].textContent.trim();
  const category = card.children[2].textContent.trim();

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

  return { img, label, category };
}

// Handle card click to open fullscreen gallery
export function handleCardClick(block, cards, placeholders) {
  const cardElements = block.querySelectorAll(".card");

  cardElements.forEach((cardEl, index) => {
    cardEl.addEventListener("click", () => {
      pauseNewsTickerAnimation("property-gallery");
      // Create fullscreen overlay
      let overlay = document.createElement("div");
      overlay.className = "image-gallery-overlay";

      // Swiper main container
      let mainSwiperContainer = document.createElement("div");
      mainSwiperContainer.className = "swiper mySwiper2";

      let mainSwiperWrapper = document.createElement("div");
      mainSwiperWrapper.className = "swiper-wrapper";

      // Swiper thumbs container
      const swiperContainer = document.createElement("div");
      swiperContainer.className = "thumbs-container";
      let thumbsSwiperContainer = document.createElement("div");
      thumbsSwiperContainer.className = "swiper mySwiper thumbs";
      swiperContainer.appendChild(thumbsSwiperContainer);

      thumbsSwiperContainer.setAttribute("thumbsSlider", "");
      let thumbsSwiperWrapper = document.createElement("div");
      thumbsSwiperWrapper.className = "swiper-wrapper";

      // Slides
      cards.forEach((c, idx) => {
        // Main slide - use larger optimized image for fullscreen
        let slide = document.createElement("div");
        slide.className = "swiper-slide";

        // Create optimized image for fullscreen display
        let fullscreenImg;
        if (c.img.tagName === "PICTURE") {
          const originalSrc = c.img.querySelector("img")?.src;
          const originalAlt = c.img.querySelector("img")?.alt || "";
          fullscreenImg = createOptimizedPicture(
            originalSrc,
            originalAlt,
            false,
            [
              { media: "(min-width: 1600px)", width: "3200" },
              { media: "(min-width: 1200px)", width: "2400" },
              { media: "(min-width: 900px)", width: "1800" },
              { media: "(min-width: 600px)", width: "1400" },
              { width: "1200" },
            ]
          );
        } else {
          fullscreenImg = c.img.cloneNode(true);
        }

        slide.appendChild(fullscreenImg);
        mainSwiperWrapper.appendChild(slide);

        // Thumb slide - use smaller optimized image
        let thumbSlide = document.createElement("div");
        thumbSlide.className = "swiper-slide";

        let thumbImg;
        if (c.img.tagName === "PICTURE") {
          const originalSrc = c.img.querySelector("img")?.src;
          const originalAlt = c.img.querySelector("img")?.alt || "";
          thumbImg = createOptimizedPicture(originalSrc, originalAlt, false, [
            { width: "300" },
          ]);
        } else {
          thumbImg = c.img.cloneNode(true);
        }

        thumbSlide.appendChild(thumbImg);
        thumbsSwiperWrapper.appendChild(thumbSlide);
      });

      // Render caption and page indicator outside the slides
      const caption = document.createElement("div");
      caption.className = "swiper-caption text-h4";

      // Initial content
      caption.innerText = cards[0]?.label || "";

      // Update caption and page indicator on slide change
      function updateCaptionAndPage(swiper) {
        const realIndex = swiper.realIndex || 0;
        caption.innerText = cards[realIndex]?.label || "";
        pageIndicator.innerText = `${realIndex + 1} / ${cards.length}`;
      }

      mainSwiperContainer.appendChild(mainSwiperWrapper);

      // Add navigation buttons
      let prevBtn = document.createElement("div");
      prevBtn.className = "swiper-button-prev";
      prevBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
        <mask id="mask0_4658_9569" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="25">
          <rect width="24" height="24" transform="matrix(1 0 0 -1 0.580078 24.52)" fill="#D9D9D9"></rect>
        </mask>
        <g mask="url(#mask0_4658_9569)">
          <path d="M8.42852 11.52L11.2785 8.67001C11.4785 8.47001 11.5743 8.23667 11.566 7.97001C11.5577 7.70334 11.4618 7.47001 11.2785 7.27001C11.0785 7.07001 10.841 6.96584 10.566 6.95751C10.291 6.94918 10.0535 7.04501 9.85352 7.24501L5.27852 11.82C5.07852 12.02 4.97852 12.2533 4.97852 12.52C4.97852 12.7867 5.07852 13.02 5.27852 13.22L9.85352 17.795C10.0535 17.995 10.291 18.0908 10.566 18.0825C10.841 18.0742 11.0785 17.97 11.2785 17.77C11.4618 17.57 11.5577 17.3367 11.566 17.07C11.5743 16.8033 11.4785 16.57 11.2785 16.37L8.42852 13.52H19.5785C19.8618 13.52 20.0993 13.4242 20.291 13.2325C20.4827 13.0408 20.5785 12.8033 20.5785 12.52C20.5785 12.2367 20.4827 11.9992 20.291 11.8075C20.0993 11.6158 19.8618 11.52 19.5785 11.52H8.42852Z" fill="white"></path>
        </g>
      </svg>`;

      let nextBtn = document.createElement("div");
      nextBtn.className = "swiper-button-next";
      nextBtn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" viewBox="0 0 25 25" fill="none">
        <mask id="mask0_4658_9569" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="25">
          <rect width="24" height="24" transform="matrix(1 0 0 -1 0.580078 24.52)" fill="#D9D9D9"></rect>
        </mask>
        <g mask="url(#mask0_4658_9569)">
          <path d="M8.42852 11.52L11.2785 8.67001C11.4785 8.47001 11.5743 8.23667 11.566 7.97001C11.5577 7.70334 11.4618 7.47001 11.2785 7.27001C11.0785 7.07001 10.841 6.96584 10.566 6.95751C10.291 6.94918 10.0535 7.04501 9.85352 7.24501L5.27852 11.82C5.07852 12.02 4.97852 12.2533 4.97852 12.52C4.97852 12.7867 5.07852 13.02 5.27852 13.22L9.85352 17.795C10.0535 17.995 10.291 18.0908 10.566 18.0825C10.841 18.0742 11.0785 17.97 11.2785 17.77C11.4618 17.57 11.5577 17.3367 11.566 17.07C11.5743 16.8033 11.4785 16.57 11.2785 16.37L8.42852 13.52H19.5785C19.8618 13.52 20.0993 13.4242 20.291 13.2325C20.4827 13.0408 20.5785 12.8033 20.5785 12.52C20.5785 12.2367 20.4827 11.9992 20.291 11.8075C20.0993 11.6158 19.8618 11.52 19.5785 11.52H8.42852Z" fill="white"></path>
        </g>
      </svg>`;

      // Add dot pagination container
      const dotPagination = document.createElement("div");
      dotPagination.className = "swiper-pagination dot-pagination";

      mainSwiperContainer.appendChild(prevBtn);
      mainSwiperContainer.appendChild(nextBtn);
      thumbsSwiperContainer.appendChild(thumbsSwiperWrapper);

      // Add close button
      let closeBtn = document.createElement("button");
      const span = document.createElement("span");
      closeBtn.className = "close-button cta-link chevron-left";
      closeBtn.appendChild(span);
      span.textContent = placeholders?.globalBack || "Back";
      span.classList.add("animate-underline");

      // Fade out and remove overlay on close
      closeBtn.addEventListener("click", () => {
        resumeNewsTickerAnimation("property-gallery");
        overlay.style.opacity = 0;
        overlay.style.transform = "translateY(40px)";
        setTimeout(() => {
          if (overlay.parentNode) document.body.removeChild(overlay);
          if (window.fullscreenSwiperMain) {
            window.fullscreenSwiperMain.destroy(true, true);
            window.fullscreenSwiperMain = null;
          }
          if (window.fullscreenSwiperThumbs) {
            window.fullscreenSwiperThumbs.destroy(true, true);
            window.fullscreenSwiperThumbs = null;
          }
        }, 400);
      });

      const galleryIndicator = document.createElement("div");
      galleryIndicator.className = "gallery-indicator";

      const pageIndicator = document.createElement("div");
      pageIndicator.className = "swiper-page-indicator text-l3";
      pageIndicator.innerText = `1 / ${cards.length}`;

      // Clone the close button and add the same event listener
      const closeBtnClone = closeBtn.cloneNode(true);

      closeBtnClone.querySelector("span").textContent =
        placeholders?.globalBack || "Back";
      closeBtnClone.addEventListener("click", () => {
        resumeNewsTickerAnimation("property-gallery");
        overlay.style.opacity = 0;
        overlay.style.transform = "translateY(40px)";
        setTimeout(() => {
          if (overlay.parentNode) document.body.removeChild(overlay);
          if (window.fullscreenSwiperMain) {
            window.fullscreenSwiperMain.destroy(true, true);
            window.fullscreenSwiperMain = null;
          }
          if (window.fullscreenSwiperThumbs) {
            window.fullscreenSwiperThumbs.destroy(true, true);
            window.fullscreenSwiperThumbs = null;
          }
        }, 400);
      });
      galleryIndicator.appendChild(closeBtnClone);
      galleryIndicator.appendChild(pageIndicator);

      overlay.appendChild(galleryIndicator);
      mainSwiperContainer.appendChild(dotPagination);
      overlay.appendChild(mainSwiperContainer);
      overlay.appendChild(swiperContainer);
      overlay.appendChild(caption);
      overlay.appendChild(closeBtn);
      document.body.appendChild(overlay);

      // Fade in overlay
      setTimeout(() => {
        overlay.style.opacity = 1;
        overlay.style.transform = "translateY(0)";
      }, 10);

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
      // Custom pagination renderer to show only 6 bullets at a time, cycling as needed
      function renderLimitedPagination(swiper, current, total) {
        const maxVisible = 6;
        let bullets = [];
        // Calculate start index for visible bullets
        let start = Math.floor(current / maxVisible) * maxVisible;
        for (let i = 0; i < maxVisible && start + i < total; i++) {
          let idx = start + i;
          let active =
            idx === current ? " swiper-pagination-bullet-active" : "";
          bullets.push(
            `<span class="swiper-pagination-bullet${active}" data-index="${idx}"></span>`
          );
        }
        // If total < maxVisible, fill up to maxVisible for consistent UI
        while (bullets.length < maxVisible) {
          bullets.push(
            `<span class="swiper-pagination-bullet swiper-pagination-bullet-empty"></span>`
          );
        }
        return bullets.join("");
      }

      window.fullscreenSwiperMain = new Swiper(mainSwiperContainer, {
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
            // Update custom pagination
            const paginationEl = overlay.querySelector(".dot-pagination");
            if (paginationEl) {
              paginationEl.innerHTML = renderLimitedPagination(
                this,
                this.realIndex,
                cards.length
              );
              // Add click event for custom bullets
              paginationEl
                .querySelectorAll(".swiper-pagination-bullet")
                .forEach((el) => {
                  if (
                    !el.classList.contains("swiper-pagination-bullet-empty")
                  ) {
                    el.onclick = () => {
                      window.fullscreenSwiperMain.slideToLoop(
                        Number(el.dataset.index),
                        500,
                        false
                      );
                    };
                  }
                });
            }
          },
          afterInit: function () {
            // Initial render of custom pagination
            const paginationEl = overlay.querySelector(".dot-pagination");
            if (paginationEl) {
              paginationEl.innerHTML = renderLimitedPagination(
                this,
                this.realIndex,
                cards.length
              );
              paginationEl
                .querySelectorAll(".swiper-pagination-bullet")
                .forEach((el) => {
                  if (
                    !el.classList.contains("swiper-pagination-bullet-empty")
                  ) {
                    el.onclick = () => {
                      window.fullscreenSwiperMain.slideToLoop(
                        Number(el.dataset.index),
                        500,
                        false
                      );
                    };
                  }
                });
            }
          },
        },
        pagination: {
          el: ".dot-pagination",
          clickable: false, // We'll handle clicks manually
          renderBullet: () => "", // Disable default rendering
        },
      });

      // Sync to initial slide for thumbs and update caption/page
      window.fullscreenSwiperThumbs.slideToLoop(index, 0, false);
      window.fullscreenSwiperMain.slideToLoop(index, 0, false);
      updateCaptionAndPage(window.fullscreenSwiperMain);
    });
  });
}

export function handleAuthoringEnvironment(block) {
  block.classList.add("pg-authoring-container");

  const allRows = [...block.children];
  block.innerHTML = "";

  const scrollContainer = document.createElement("div");
  scrollContainer.className = "pg-authoring-scroll-container";

  allRows.forEach((row) => {
    row.classList.add("pg-authoring-card");
    scrollContainer.appendChild(row);
  });

  block.appendChild(scrollContainer);
}
