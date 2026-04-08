import { isUniversalEditor } from "../../scripts/aem.js";
import {
  handleMediaBlocks,
  createCategoryTabs,
  loadSwiper,
} from "../../scripts/utils.js";
import { parallaxSection } from "../../scripts/animations.js";

export default function decorate(block) {
  if (isUniversalEditor()) return;

  const prevUrl = document.referrer;
  let swiperInstance;
  const parallaxWrapper = document.createElement("section");
  parallaxWrapper.className = "parallax-container";
  const parallaxContent = document.createElement("div");
  parallaxContent.className = "parallax-content";
  parallaxWrapper.appendChild(parallaxContent);

  const media = [];
  const titles = [];
  const iframes = [];

  [...block.children].forEach((slide) => {
    const { mediaSection, title, iframe } = getSlideContent(slide);

    media.push(mediaSection.innerHTML);
    titles.push(title);
    iframes.push(iframe);
  });

  parallaxContent.innerHTML = `
    <div class="music-carousel swiper">
      <div class="swiper-wrapper">
        ${media
          .map(
            (mediaHtml, i) => `
          <div class="swiper-slide">
            <div class="media">${mediaHtml}</div>
            <section class="center-content">
              <div class="category-title mobile">
                <h2>Patina</h2>
                <h2>Sounds</h2>
              </div>
              <div class="iframe">${iframes[i]}</div>
            </section>
          </div>
        `
          )
          .join("")}
      </div>

      <div class="category-title desktop">
          <h2>Patina</h2>
          <h2>Sounds</h2>
      </div>
    </div>
  `;

  block.innerHTML = "";
  block.append(parallaxWrapper);

  // Add category tabs and swipe to slide on tab click
  createCategoryTabs(
    parallaxContent,
    titles.map((title) => {
      return { value: title, label: title };
    }),
    (selectedCategory) => {
      // Find the index of the selected tab
      const idx = titles.findIndex((t) => t === selectedCategory);
      if (swiperInstance && idx !== -1) {
        swiperInstance.slideTo(idx);
      }
    },
    prevUrl.includes("osaka") ? "Osaka" : "Maldives"
  );

  // Setup Swiper after DOM is ready
  const setupSwiper = async () => {
    await loadSwiper();
    swiperInstance = new Swiper(
      document.querySelector(".music-carousel.swiper"),
      {
        slidesPerView: 1,
        allowTouchMove: false,
        keyboard: { enabled: true, onlyInViewport: true },
        on: {
          slideChange: function () {
            // Sync the active tab with the current slide
            const idx = swiperInstance.activeIndex;
            const tabButtons = block.querySelectorAll(".category-tab");
            tabButtons.forEach((btn, i) => {
              if (i === idx) {
                btn.classList.add("active");
              } else {
                btn.classList.remove("active");
              }
            });
            // Move the slider bar if present
            const slider = block.querySelector(".category-slider");
            const activeTab = block.querySelector(".category-tab.active");
            if (slider && activeTab) {
              slider.style.left = `${activeTab.offsetLeft}px`;
              slider.style.width = `${activeTab.offsetWidth}px`;
            }
          },
        },
      }
    );
  };

  setupSwiper();
  setTimeout(() => parallaxSection(parallaxWrapper), 100);
}

function getSlideContent(slide) {
  const media = slide.children[0];
  const title = slide.children[1].textContent.trim();
  const iframe = slide.children[2].textContent.trim().slice(1, -1);

  const mediaSection = document.createElement("div");
  handleMediaBlocks([media], "", mediaSection);

  return { mediaSection, title, iframe };
}