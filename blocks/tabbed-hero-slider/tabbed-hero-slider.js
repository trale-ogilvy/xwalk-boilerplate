import { moveInstrumentation } from "../../scripts/scripts.js";
import {
  loadSwiper,
  getBasePathBasedOnEnv,
  handleMediaBlocks,
} from "../../scripts/utils.js";
import {
  isUniversalEditor,
  loadCSS,
  createOptimizedPicture,
} from "../../scripts/aem.js";
import { fetchPlaceholders } from "../../scripts/utils.js"; // Add this import

function handleMedia(mediaDiv, targetElement, instructionSource, posterImage) {
  const mediaBtn = mediaDiv?.querySelector("a");
  const mediaHref = mediaBtn?.getAttribute("href") || "";
  const imgEl = mediaDiv?.querySelector("img");

  // Video handling
  if (
    mediaHref &&
    (mediaHref.includes(".mp4") || mediaHref.includes(".webm"))
  ) {
    let posterSrc = "/img/poster.jpg";
    if (posterImage) {
      posterSrc = posterImage?.querySelector("img").src || "";
    }

    const video = document.createElement("video");
    video.className = "slide-video";
    video.playsInline = true;
    video.autoplay = true;
    video.muted = true;
    video.loop = true;
    // video.preload = "auto";
    video.style.width = "100%";
    video.style.height = "auto";
    video.style.opacity = "1";
    video.setAttribute("aria-label", "Video player");
    video.controls = false;
    video.setAttribute("muted", "");
    video.muted = true;
    video.classList.add("eager");
    video.poster = posterSrc;

    const anchor = mediaDiv.querySelector("a");
    const href = anchor.innerText.trim();
    const basePath = getBasePathBasedOnEnv();
    const baseName = href.replace(/\.[^/.]+$/, ""); // Remove extension
    let sources = [];

    const mp4Source = document.createElement("source");
    mp4Source.src = basePath + baseName + ".mp4";
    mp4Source.type = "video/mp4";
    sources.push(mp4Source);

    sources.forEach((source) => video.appendChild(source));

    if (anchor) anchor.parentElement.remove();
    targetElement.appendChild(video);

    video.addEventListener("canplay", () => {
      video.style.opacity = "1";
    });
    video.addEventListener("loadeddata", () => {
      setTimeout(() => {
        video.style.opacity = "1";
      }, 100);
    });

    if (instructionSource) moveInstrumentation(instructionSource, video);
    targetElement.appendChild(video);

    // Attempt to play for authoring view or autoplay-blocked browsers
    video.play().catch(() => {});
  } else if (imgEl) {
    // Image handling with createOptimizedPicture
    const breakpoints = [
      { media: "(min-width: 1600px)", width: "1600" },
      { media: "(min-width: 1200px)", width: "1200" },
      { width: "1000" },
    ];
    const optimizedPicture = createOptimizedPicture(
      imgEl.src,
      imgEl.alt,
      true, // eager loading for hero images
      breakpoints
    );
    optimizedPicture.className = "slide-image";
    optimizedPicture.style.opacity = "0";

    const imgElement = optimizedPicture.querySelector("img");
    imgElement.addEventListener("load", () => {
      optimizedPicture.style.opacity = "1";
    });
    if (imgElement.complete) optimizedPicture.style.opacity = "1";

    if (instructionSource)
      moveInstrumentation(instructionSource, optimizedPicture);
    targetElement.appendChild(optimizedPicture);
  }
}

// Function to get tab name with placeholder replacement
async function getTabName(originalName) {
  try {
    const placeholders = await fetchPlaceholders();

    const nameMappings = {
      MALDIVES: "tabbedHeroMaldives",
      OSAKA: "tabbedHeroOsaka",
      TIANJIN: "tabbedHeroTianjin",
      SANYA: "tabbedHeroSanya",
    };

    const upperName = originalName.toUpperCase();
    for (const [key, placeholderKey] of Object.entries(nameMappings)) {
      if (upperName.includes(key)) {
        return placeholders[placeholderKey] || originalName;
      }
    }

    return originalName;
  } catch (error) {
    console.error("Error fetching placeholders for tab name:", error);
    return originalName;
  }
}

export default async function decorate(block) {
  if (isUniversalEditor()) {
    handleAuthoringEnvironment(block);
    return;
  }

  if (block.dataset.tabbedHeroProcessed) {
    return;
  }

  const parent = block.parentElement.parentElement;
  const allWrappers = [...parent.children].filter((child) =>
    child.querySelector(".tabbed-hero-slider.block")
  );

  allWrappers.forEach((w) => {
    const b = w.querySelector(".tabbed-hero-slider.block");
    if (b) b.dataset.tabbedHeroProcessed = true;
  });

  const mainContainer = allWrappers[0];

  await handleLiveEnvironment(mainContainer, allWrappers);
}

async function handleAuthoringEnvironment(block) {
  loadCSS(
    `${window.hlx.codeBasePath}/blocks/tabbed-hero-slider/tabbed-hero-slider-author.css`
  );

  const media = block.children[1].children;
  handleMediaBlocks([...media], "", block);

  const tabsContent = [];
  const container = document.querySelector(
    ".section.tabbed-hero-slider-container"
  );
  [...container.children].forEach((item) => {
    const tabItems = item.children[0].children[0].textContent;
    tabsContent.push(tabItems);
  });

  // Group text content
  const containerDiv = document.createElement("div");
  containerDiv.className = "tabbed-hero-text-content";
  const textLabel = block.children[2]?.children[0];
  const textTitle = block.children[3]?.children[0];
  const textCta = block.children[4]?.children[0];

  if (textLabel) containerDiv.appendChild(textLabel.cloneNode(true));
  if (textTitle) containerDiv.appendChild(textTitle.cloneNode(true));
  if (textCta) containerDiv.appendChild(textCta.cloneNode(true));

  // Handle Label Tab
  const tabList = document.createElement("div");
  tabList.className = "tabbed-hero-label-list";
  tabsContent.forEach((tab) => {
    const tabDiv = document.createElement("div");
    tabDiv.className = "tabbed-hero-label";
    tabDiv.textContent = tab;
    tabList.appendChild(tabDiv);
  });

  block.appendChild(containerDiv);
  block.appendChild(tabList);
}

async function handleLiveEnvironment(mainContainer, allWrappers) {
  const sliderContainer = document.createElement("div");
  sliderContainer.className = "slider-content swiper";

  const swiperWrapper = document.createElement("div");
  swiperWrapper.className = "swiper-wrapper";

  const tabNav = document.createElement("div");
  tabNav.className = "tab-nav";

  const tabHighlight = document.createElement("div");
  tabHighlight.className = "tab-highlight";
  tabNav.appendChild(tabHighlight);

  const indicatorsContainer = document.createElement("div");
  indicatorsContainer.className = "slider-indicators";

  let slides = [];
  let swiperInstance = null;

  for (const w of allWrappers) {
    const blockEl = w.querySelector(".tabbed-hero-slider.block");
    const rawSlides = Array.from(blockEl.children);
    const slideData = rawSlides.slice(0, 7);

    const originalTabName = slideData[0]
      ?.querySelector("p")
      ?.textContent.trim();

    const tabName = await getTabName(originalTabName);

    const labelEl = slideData[2]?.querySelector("p");
    const titleEl = slideData[3]?.querySelector("p");
    const ctaLink = slideData[4]?.querySelector("p")?.innerHTML || "";
    const ctaOriginal = slideData[5]?.querySelector(".button");
    const mediaBtn = slideData[1]?.querySelector("a");
    const lastDiv = rawSlides[rawSlides.length - 1];
    let previewImageValue = "";
    if (lastDiv.querySelector("picture")) {
      previewImageValue = lastDiv;
    }

    const slideEl = document.createElement("div");
    slideEl.className = "hero-slide swiper-slide";
    moveInstrumentation(blockEl, slideEl);

    const dimmingOverlay = document.createElement("div");
    dimmingOverlay.className = "slide-dim-overlay";
    slideEl.appendChild(dimmingOverlay);

    handleMedia(slideData[1], slideEl, mediaBtn, previewImageValue);

    const overlay = document.createElement("div");
    overlay.className = "slide-overlay";
    if (labelEl) {
      const labelDiv = document.createElement("div");
      labelDiv.className = "tabbed-hero-label";
      labelDiv.innerHTML = labelEl.innerHTML;
      moveInstrumentation(labelEl, labelDiv);
      overlay.appendChild(labelDiv);
    }
    if (titleEl) {
      const titleDiv = document.createElement("div");
      titleDiv.className = "tabbed-hero-title";
      titleDiv.innerHTML = titleEl.innerHTML;
      moveInstrumentation(titleEl, titleDiv);
      overlay.appendChild(titleDiv);
    }
    if (ctaOriginal) {
      const ctaAnchor = document.createElement("a");
      ctaAnchor.href = ctaOriginal.href;
      ctaAnchor.title = ctaLink.replace(/<[^>]+>/g, "").trim();
      ctaAnchor.className = "cta-btn text-b";
      moveInstrumentation(ctaOriginal, ctaAnchor);
      ctaAnchor.innerHTML = `<div class="cta-content"><div class="cta-text">${ctaLink}</div><img src="/icons/exit-black.svg" alt="" class="cta-icon"></div>`;
      overlay.appendChild(ctaAnchor);
    }
    slideEl.appendChild(overlay);
    swiperWrapper.appendChild(slideEl);
    slides.push(slideEl);

    const tabBtn = document.createElement("button");
    tabBtn.className = "tab-btn text-b";
    tabBtn.textContent = tabName;
    tabNav.appendChild(tabBtn);

    const indicator = document.createElement("button");
    indicator.className = "slider-indicator";
    indicatorsContainer.appendChild(indicator);
  }

  sliderContainer.append(swiperWrapper);

  const updateHighlightPosition = (index) => {
    const tabButtons = tabNav.querySelectorAll(".tab-btn");
    const activeTab = tabButtons[index];
    if (activeTab && tabHighlight) {
      let leftPosition = 0;
      for (let i = 0; i < index; i++) {
        leftPosition += tabButtons[i].offsetWidth;
        if (i < index) leftPosition += 16;
      }
      const width = activeTab.offsetWidth;
      tabHighlight.style.transform = `translateX(${leftPosition}px)`;
      tabHighlight.style.width = `${width}px`;
    }
  };

  const updateActiveState = (index) => {
    tabNav
      .querySelectorAll(".tab-btn")
      .forEach((btn, i) => btn.classList.toggle("active", i === index));
    indicatorsContainer
      .querySelectorAll(".slider-indicator")
      .forEach((ind, i) => ind.classList.toggle("active", i === index));
    updateHighlightPosition(index);
    if (window.innerWidth > 768) {
      slides.forEach((slide, i) => {
        slide.style.display = i === index ? "block" : "none";
      });
    }
  };

  const setupEventListeners = () => {
    tabNav.querySelectorAll(".tab-btn").forEach((btn, idx) => {
      btn.addEventListener("click", () => {
        if (swiperInstance) swiperInstance.slideTo(idx);
        else updateActiveState(idx);
      });
    });
    indicatorsContainer
      .querySelectorAll(".slider-indicator")
      .forEach((ind, idx) => {
        ind.addEventListener("click", () => {
          if (swiperInstance) swiperInstance.slideTo(idx);
          else updateActiveState(idx);
        });
      });
  };

  const setupSwiper = async () => {
    await loadSwiper();
    swiperInstance = new Swiper(sliderContainer, {
      slidesPerView: 1,
      spaceBetween: 0,
      loop: false,
      grabCursor: true,
      keyboard: { enabled: true },
      pagination: {
        el: indicatorsContainer,
        clickable: true,
        bulletClass: "slider-indicator",
        bulletActiveClass: "active",
      },
      on: {
        slideChange: (swiper) => updateActiveState(swiper.activeIndex),
      },
    });
  };

  const destroySwiper = () => {
    if (swiperInstance) {
      swiperInstance.destroy(true, true);
      swiperInstance = null;
    }
  };

  const handleResize = () => {
    const isMobile = window.innerWidth <= 768;
    if (isMobile && !swiperInstance) {
      slides.forEach((slide) => {
        slide.style.display = "";
      });
      setupSwiper();
    } else if (!isMobile && swiperInstance) {
      destroySwiper();
      updateActiveState(swiperInstance.realIndex || 0);
    } else if (!isMobile) {
      setTimeout(() => {
        const activeIndex = Array.from(
          tabNav.querySelectorAll(".tab-btn")
        ).findIndex((btn) => btn.classList.contains("active"));
        updateHighlightPosition(activeIndex >= 0 ? activeIndex : 0);
      }, 100);
    }
  };

  // Final DOM assembly
  const sliderAndIndicatorsContainer = document.createElement("div");
  sliderAndIndicatorsContainer.className = "slider-and-indicators-container";
  const newBlock = document.createElement("div");
  newBlock.className = "tabbed-hero-slider block";

  newBlock.appendChild(sliderContainer);
  sliderAndIndicatorsContainer.appendChild(newBlock);
  sliderAndIndicatorsContainer.appendChild(indicatorsContainer);

  mainContainer.innerHTML = "";
  mainContainer.appendChild(sliderAndIndicatorsContainer);
  mainContainer.appendChild(tabNav);

  allWrappers.slice(1).forEach((w) => w.remove());

  setupEventListeners();
  handleResize();
  window.addEventListener("resize", handleResize);
  updateActiveState(0);
  setTimeout(() => updateHighlightPosition(0), 100);
}
