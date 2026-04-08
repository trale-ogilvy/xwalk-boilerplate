import {
  formatRichText,
  loadSwiper,
  getBasePathBasedOnEnv,
  disableScroll,
} from "./utils.js";

/**
 * Creates and manages modal functionality with Swiper integration
 * @param {HTMLElement} container - The container element to append the modal to
 * @param {string} modalId - Unique ID for the modal
 * @param {Array} slideData - Array of slide data objects
 * @param {Function} parseSlideFunction - Function to parse individual slide data
 * @param {Function} openNextModal - Callback to open the next item's modal
 * @returns {Object} Modal management object with methods
 */
export function createCarouselModal(
  container,
  modalId,
  slideData,
  parseSlideFunction,
  openNextModal,
  isLastItem = false,
  nextSlideContent,
) {
  // Create modal element
  const modalElement = document.createElement("dialog");
  modalElement.id = modalId;
  modalElement.className = "carousel-modal-gallery";
  modalElement.removeAttribute("open");

  // Store original slide data to prevent nesting issues on resize
  const originalSlideData = slideData.map((slideRow) => {
    const slide = parseSlideFunction(slideRow);
    // Clone the text content to avoid modifying the original
    const textClone = slide.text ? slide.text.cloneNode(true) : null;
    return {
      ...slide,
      originalText: textClone,
    };
  });

  // Function to generate slides with mobile split layout support
  const generateSlides = () => {
    const isMobile = window.innerWidth <= 767;
    return originalSlideData
      .map((slideData, slideIdx) => {
        // Use the original text clone and format it fresh each time
        const textToFormat = slideData.originalText
          ? slideData.originalText.cloneNode(true)
          : null;
        if (textToFormat) {
          formatRichText(textToFormat, "slide-text", "");
        }

        const layoutClass = slideData.slideFormat.includes("Split Layout")
          ? "split-layout"
          : "fullscreen-layout";
        const imageOrderClass = slideData.imageRight ? "image-right" : "";

        if (slideData.cta.primaryCta) {
          if (slideData.cta.primaryCta.children[0]) {
            slideData.cta.primaryCta.children[0].className = "cta-button";
          }
        }
        if (slideData.cta.secondaryCta) {
          if (slideData.cta.secondaryCta.children[0]) {
            slideData.cta.secondaryCta.children[0].className =
              "cta-link animate-underline text-text-white";
          }
        }

        // For mobile split layout, create two separate slides
        if (isMobile && slideData.slideFormat.includes("Split Layout")) {
          if (slideIdx === originalSlideData.length - 1 && !isLastItem) {
            // If this is the last slide, add the Next Item box after content
            return `
              <div class="carousel-modal-swiper-slide swiper-slide carousel-modal-split-layout-mobile-image">
                <div class="carousel-modal-slide-image">${slideData.image}</div>
              </div>
              <div class="carousel-modal-swiper-slide swiper-slide carousel-modal-split-layout-mobile-content">
                <div class="carousel-modal-slide-content">
                  ${textToFormat ? textToFormat.innerHTML : ""}
                  <div class="carousel-modal-slide-cta-wrapper">
                    ${
                      slideData.cta.primaryCta
                        ? slideData.cta.primaryCta.innerHTML
                        : ""
                    }
                    ${
                      slideData.cta.secondaryCta
                        ? slideData.cta.secondaryCta.innerHTML
                        : ""
                    }
                  </div>
                  <div class="carousel-modal-next-item-card">
                    <div class="image-wrapper">${
                      nextSlideContent.itemImage
                    }</div>
                    <div class="content-wrapper">
                      <p class="text-l2 text-text-white">Up Next</p>
                      <p class="text-p1 text-text-white">${
                        nextSlideContent.itemUpNextText
                      }</p>
                    </div>
                  </div>
                </div>
              </div>
            `;
          }
        } else {
          if (slideIdx === originalSlideData.length - 1 && !isLastItem) {
            // If this is the last slide, add the Next Item box
            return `
              <div class="carousel-modal-swiper-slide swiper-slide ${layoutClass} ${imageOrderClass}">
                <div class="carousel-modal-slide-image">${slideData.image}</div>
                <div class="carousel-modal-slide-content">
                  ${textToFormat ? textToFormat.innerHTML : ""}
                  <div class="carousel-modal-slide-cta-wrapper">
                    ${
                      slideData.cta.primaryCta
                        ? slideData.cta.primaryCta.innerHTML
                        : ""
                    }
                    ${
                      slideData.cta.secondaryCta
                        ? slideData.cta.secondaryCta.innerHTML
                        : ""
                    }
                  </div>
                  </div>
                  <div class="carousel-modal-next-item-card">
                       <div class="image-wrapper">${
                         nextSlideContent.itemImage
                       }</div>
                          <div class="content-wrapper">
                            <p class="text-l2 text-text-white">Up Next</p>
                            <p class="text-p1 text-text-white">${
                              nextSlideContent.itemUpNextText
                            }</p>
                        </div>
                     </div>
              </div>
            `;
          }
        }
        // Normal slide rendering
        return !isMobile || !slideData.slideFormat.includes("Split Layout")
          ? `<div class="carousel-modal-swiper-slide swiper-slide ${layoutClass} ${imageOrderClass}">
              <div class="carousel-modal-slide-image">${slideData.image}</div>
              <div class="carousel-modal-slide-content">
                ${textToFormat ? textToFormat.innerHTML : ""}
                <div class="carousel-modal-slide-cta-wrapper">
                  ${
                    slideData.cta.primaryCta
                      ? slideData.cta.primaryCta.innerHTML
                      : ""
                  }
    
                  ${
                    slideData.cta.secondaryCta
                      ? slideData.cta.secondaryCta.innerHTML
                      : ""
                  }
                </div>
              </div>
            </div>`
          : `
            <div class="carousel-modal-swiper-slide swiper-slide carousel-modal-split-layout-mobile-image">
              <div class="carousel-modal-slide-image">${slideData.image}</div>
            </div>
            <div class="carousel-modal-swiper-slide swiper-slide carousel-modal-split-layout-mobile-content">
              <div class="carousel-modal-slide-content">
                ${textToFormat ? textToFormat.innerHTML : ""}
                <div class="carousel-modal-slide-cta-wrapper">
                  ${
                    slideData.cta.primaryCta
                      ? slideData.cta.primaryCta.innerHTML
                      : ""
                  }
            
                  ${
                    slideData.cta.secondaryCta
                      ? slideData.cta.secondaryCta.outerHTML
                      : ""
                  }
                </div>
              </div>
            </div>`;
      })
      .join("");
  };

  // Calculate total slides for mobile (split layouts count as 2)
  const getTotalSlides = () => {
    const isMobile = window.innerWidth <= 767;
    return originalSlideData.reduce((total, slideData) => {
      return (
        total +
        (isMobile && slideData.slideFormat.includes("Split Layout") ? 2 : 1)
      );
    }, 0);
  };
  // Create modal HTML structure
  modalElement.innerHTML = `
    <div class="carousel-modal-content">
      <div class="carousel-modal-header">
        <button class="carousel-modal-close-button text-b close-icon icon-left text-text-white"><span class="animate-underline">CLOSE</span></button>
        <div class="header-right">
        <div class="pause-icon"></div>
        <div class="audio-icon"></div>
        <div class="carousel-modal-slide-counter text-b text-text-white">
          <span class="carousel-modal-current-slide">1</span> / <span class="carousel-modal-total-slides">${getTotalSlides()}</span>
        </div>
      </div>
      </div>
      <div class="carousel-modal-swiper-container swiper">
        <div class="carousel-modal-swiper-wrapper swiper-wrapper">
          ${generateSlides()}
        </div>
        <div class="carousel-modal-swiper-pagination swiper-pagination"></div>
        <div class="carousel-modal-swiper-button-next swiper-button-next"></div>
        <div class="carousel-modal-swiper-button-prev swiper-button-prev"></div>
      </div>
    </div>
  `;

  container.appendChild(modalElement);

  // Event delegation for audio button: always toggle the currently visible video
  modalElement.addEventListener("click", function (e) {
    const audioBtn = e.target.closest(".audio-icon");
    if (audioBtn) {
      // Find the currently visible video in the modal
      const video = modalElement.querySelector(
        ".swiper-slide-active video, .carousel-modal-swiper-slide.active video, video:visible"
      );
      if (video) {
        video.muted = !video.muted;
        audioBtn.classList.toggle("audio-on", !video.muted);
        audioBtn.classList.toggle("audio-off", video.muted);
        // Update the icon SVG
        if (video.muted) {
          audioBtn.innerHTML = `<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_8333_91024" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="25"><rect x="0.046875" y="0.00292969" width="24" height="24" fill="#D9D9D9"/></mask><g mask="url(#mask0_8333_91024)"><path d="M15.1414 15.6568L14.0876 14.6031L16.6876 12.0031L14.0876 9.40309L15.1414 8.34934L17.7414 10.9493L20.3414 8.34934L21.3951 9.40309L18.7951 12.0031L21.3951 14.6031L20.3414 15.6568L17.7414 13.0568L15.1414 15.6568ZM3.70312 14.5031V9.50309H7.41462L11.7029 5.21484V18.7913L7.41462 14.5031H3.70312ZM10.2029 8.85309L8.05288 11.0031H5.20287V13.0031H8.05288L10.2029 15.1531V8.85309Z" fill="white"/></g></svg>`;
        } else {
          audioBtn.innerHTML = `<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg"><mask id="mask0_8333_91024" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="25"><rect x="0.046875" y="0.00292969" width="24" height="24" fill="#D9D9D9"/></mask><g mask="url(#mask0_8333_91024)"><path d="M5 9V15H8.586L13 19.414V4.586L8.586 9H5ZM15 12C15 10.34 13.66 9 12 9V15C13.66 15 15 13.66 15 12Z" fill="white"/></g></svg>`;
        }
      }
    }
  });

  // Function to attach next item event listener after slides are rendered
  function attachNextBtnListener() {
    const nextBtn = modalElement.querySelector(
      ".carousel-modal-next-item-card"
    );
    if (nextBtn && typeof openNextModal === "function") {
      nextBtn.onclick = (e) => {
        e.preventDefault();
        openNextModal();
        setTimeout(() => {
          closeModal();
        }, 400);
      };
    }
  }

  // Function to initialize or reinitialize swiper
  const initSwiper = async () => {
    // Ensure Swiper is loaded before initializing
    await loadSwiper();

    // Destroy existing swiper if it exists
    if (modalElement.swiper && modalElement.swiper.destroy) {
      modalElement.swiper.destroy(true, true);
    }

    // Regenerate slides and total count for current screen size
    const swiperWrapper = modalElement.querySelector(
      ".carousel-modal-swiper-wrapper"
    );
    const totalSlidesEl = modalElement.querySelector(
      ".carousel-modal-total-slides"
    );

    swiperWrapper.innerHTML = generateSlides();
    totalSlidesEl.textContent = getTotalSlides();
    attachNextBtnListener(); // Attach after every render
    injectPlayButtonsForAllVideos(modalElement); // Inject play buttons after slides are rendered

    // Initialize new swiper
    modalElement.swiper = new Swiper(
      modalElement.querySelector(".carousel-modal-swiper-container"),
      {
        allowTouchMove: true,
        speed: 800,
        keyboard: {
          enabled: true,
          onlyInViewport: false,
        },
        pagination: {
          el: modalElement.querySelector(".carousel-modal-swiper-pagination"),
          clickable: true,
        },
        navigation: {
          nextEl: modalElement.querySelector(
            ".carousel-modal-swiper-button-next"
          ),
          prevEl: modalElement.querySelector(
            ".carousel-modal-swiper-button-prev"
          ),
        },
        on: {
          slideChange: function () {
            const currentSlideEl = modalElement.querySelector(
              ".carousel-modal-current-slide"
            );
            if (currentSlideEl) {
              currentSlideEl.textContent = this.realIndex + 1;
            }

            const slides = modalElement.querySelectorAll(
              ".carousel-modal-swiper-slide"
            );

            slides.forEach((slide, idx) => {
              const video = slide.querySelector("video");
              if (video) {
                video.pause();
                // Only reset currentTime if video has been played (has been loaded/started)
                // This preserves the poster image for unplayed videos
                if (
                  video.readyState > 0 &&
                  video.dataset.hasBeenPlayed === "true"
                ) {
                  video.currentTime = 1;
                }
              }

              // Reset next item card animation for all slides
              const nextItemCard = slide.querySelector(
                ".carousel-modal-next-item-card"
              );
              if (nextItemCard) {
                nextItemCard.classList.remove("animate-fade-in-up");
              }
            });

            // Trigger fade-in-up animation for next item card in active slide with 2s delay
            const activeSlide = this.slides[this.activeIndex];
            if (activeSlide) {
              const nextItemCard = activeSlide.querySelector(
                ".carousel-modal-next-item-card"
              );
              if (nextItemCard) {
                setTimeout(() => {
                  nextItemCard.classList.add("animate-fade-in-up");
                  nextItemCard.style.pointerEvents = "auto";
                }, 500);
              }
            }
          },
          init: function () {
            const slides = modalElement.querySelectorAll(
              ".carousel-modal-swiper-slide"
            );
            slides.forEach((slide) => {
              const video = slide.querySelector("video");
              if (video) {
                // Don't modify currentTime during init to preserve poster image
                // Mark video as not played initially
                video.dataset.hasBeenPlayed = "false";

                // Add event listeners to track when video actually starts playing
                video.addEventListener(
                  "play",
                  function () {
                    this.dataset.hasBeenPlayed = "true";
                  },
                  { once: false }
                );

                // No need to play/pause during init - let poster image stay
              }
            });

            // Trigger initial animation for the first slide's next item card
            const firstSlide = this.slides[0];
            if (firstSlide) {
              const nextItemCard = firstSlide.querySelector(
                ".carousel-modal-next-item-card"
              );
              if (nextItemCard) {
                setTimeout(() => {
                  nextItemCard.classList.add("animate-fade-in-up");
                }, 500);
              }
            }
          },
        },
      }
    );
  };

  modalElement.addEventListener("click", function (e) {
    const pauseBtn = e.target.closest(".pause-icon");
    if (pauseBtn) {
      // Find the currently visible video in the modal
      const video = modalElement.querySelector(
        ".swiper-slide-active video, .carousel-modal-swiper-slide.active video"
      );
      if (video && !video.paused) {
        video.pause();
      }
    }
  });

  // Close modal function
  const closeModal = () => {
    // Restore scroll when modal closes
    if (restoreScroll) {
      restoreScroll();
      restoreScroll = null;
    }

    // Remove the visible attribute to trigger fade out
    delete modalElement.dataset.visible; 

    // Close the modal after the transition completes
    setTimeout(() => {
      modalElement.close();
      document.removeEventListener("keydown", handleEscClose);

      // Cleanup resize listener
      if (modalElement.resizeHandler) {
        window.removeEventListener("resize", modalElement.resizeHandler);
        modalElement.resizeHandler = null;
      }

      // Destroy swiper instance to ensure clean state for next opening
      if (modalElement.swiper && modalElement.swiper.destroy) {
        modalElement.swiper.destroy(true, true);
        modalElement.swiper = null;
      }
      // Pause any playing videos in the modal when closing
      const videos = modalElement.querySelectorAll("video");
      videos.forEach((video) => {
        if (!video.paused) {
          video.pause();
        }
      });

      const currentSlideEl = modalElement.querySelector(
        ".carousel-modal-current-slide"
      );
      if (currentSlideEl) {
        currentSlideEl.textContent = "1";
      }
    }, 600); // Match the CSS transition duration
  };

  // ESC key handler for smooth close
  const handleEscClose = (e) => {
    if (e.key === "Escape" && modalElement.open) {
      e.preventDefault();
      closeModal();
    }
  };

  // Add close button event listener
  const closeButton = modalElement.querySelector(
    ".carousel-modal-close-button"
  );
  if (closeButton) {
    closeButton.addEventListener("click", (e) => {
      e.stopPropagation();
      closeModal();
    });
  }

  // Store restore scroll function for cleanup
  let restoreScroll = null;

  // Open modal function
  const openModal = async () => {
    // Disable scroll when modal opens
    restoreScroll = disableScroll("modal");

    // Show modal but keep it invisible initially
    modalElement.showModal();

    // Force a reflow to ensure the initial hidden state is applied
    modalElement.offsetHeight;

    // Add the open class to trigger the transition
    setTimeout(() => {
      modalElement.dataset.visible = "true";
    }, 10);

    // Add ESC key handler
    document.addEventListener("keydown", handleEscClose);

    // Always reinitialize swiper to ensure fresh event listeners and functionality
    await initSwiper();

    // Eagerly load all video sources in the modal so the player is ready before play is clicked
    const videos = modalElement.querySelectorAll("video");
    videos.forEach((videoEl) => {
      const sources = videoEl.querySelectorAll("source[data-src]");
      let needsLoad = false;
      sources.forEach((source) => {
        if (!source.src || source.src !== source.dataset.src) {
          source.src = source.dataset.src;
          needsLoad = true;
        }
      });
      if (needsLoad) {
        videoEl.load();
      }
    });

    // Add resize listener to reinitialize swiper on mobile/desktop switch
    const handleResize = async () => {
      await initSwiper();
      // After reinit, reload video sources again
      const videos = modalElement.querySelectorAll("video");
      videos.forEach((videoEl) => {
        const sources = videoEl.querySelectorAll("source[data-src]");
        let needsLoad = false;
        sources.forEach((source) => {
          if (!source.src || source.src !== source.dataset.src) {
            source.src = source.dataset.src;
            needsLoad = true;
          }
        });
        if (needsLoad) {
          videoEl.load();
        }
      });
    };

    // Clean up any existing resize handler first
    if (modalElement.resizeHandler) {
      window.removeEventListener("resize", modalElement.resizeHandler);
    }

    // Store resize handler for cleanup
    modalElement.resizeHandler = handleResize;
    window.addEventListener("resize", handleResize);
  };

  // Utility to inject custom play button overlay for video
  function injectCustomPlayButton(videoEl) {
    if (!videoEl) return;
    // Create overlay
    const overlay = document.createElement("div");
    overlay.className = "custom-video-play-overlay";
    overlay.innerHTML = `
      <button class="custom-video-play-btn" aria-label="Play video">
        <span class="custom-video-play-icon"></span>
      </button>
    `;
    // Insert overlay into video parent
    videoEl.parentElement.style.position = "relative";
    videoEl.parentElement.appendChild(overlay);
    // Show/hide overlay on play/pause
    function updateOverlay() {
      if (videoEl.paused) {
        overlay.classList.add("visible");
        overlay.classList.remove("hidden");
      } else {
        overlay.classList.add("hidden");
        overlay.classList.remove("visible");
      }
    }
    videoEl.addEventListener("play", updateOverlay);
    videoEl.addEventListener("pause", updateOverlay);

    // Prevent autoplay when video ends - disable loop, reset to start, and restore poster
    videoEl.addEventListener("ended", () => {
      videoEl.loop = false;
      videoEl.currentTime = 0;
      videoEl.load();
      videoEl.dataset.hasBeenPlayed = "false";
    });

    // Initial state
    updateOverlay();

    // Pause video when clicking anywhere on the video while playing
    videoEl.addEventListener("click", (e) => {
      if (!videoEl.paused) {
        videoEl.pause();
      } else {
        // Ensure all <source> elements have src set from data-src before playing
        const sources = videoEl.querySelectorAll("source[data-src]");
        let needsLoad = false;
        sources.forEach((source) => {
          if (!source.src || source.src !== source.dataset.src) {
            source.src = source.dataset.src;
            needsLoad = true;
          }
        });
        if (needsLoad) {
          videoEl.load();
        }
        if (window.innerWidth > 767) {
          setTimeout(() => {
            // Hide navigation arrows, pagination, close button, slide number when video is played
            const modal = videoEl.closest("dialog.carousel-modal-gallery");
            if (!modal) return;
            const navNext = modal.querySelector(
              ".carousel-modal-swiper-button-next"
            );
            const navPrev = modal.querySelector(
              ".carousel-modal-swiper-button-prev"
            );
            const pagination = modal.querySelector(
              ".carousel-modal-swiper-pagination"
            );
            const header = modal.querySelector(".carousel-modal-header");

            const controls = [navNext, navPrev, pagination, header];

            let hideTimeout;

            function hideControls() {
              controls.forEach((el) => {
                if (el) {
                  el.style.opacity = "0";
                  el.style.transition = "opacity 0.4s";
                }
              });
            }

            function showControls() {
              controls.forEach((el) => {
                if (el) {
                  el.style.opacity = "";
                  el.style.transition = "opacity 0.4s";
                }
              });
              clearTimeout(hideTimeout);
              hideTimeout = setTimeout(hideControls, 3000);
            }

            // Initial hide
            hideControls();

            // Listen for mousemove to show controls and restart timer
            function onMouseMove() {
              showControls();
            }

            window.addEventListener("mousemove", onMouseMove);

            // Clean up on video pause or modal close
            videoEl.addEventListener(
              "pause",
              () => {
                showControls();
                window.removeEventListener("mousemove", onMouseMove);
                clearTimeout(hideTimeout);
              },
              { once: true }
            );

            modal.addEventListener(
              "close",
              () => {
                window.removeEventListener("mousemove", onMouseMove);
                clearTimeout(hideTimeout);
              },
              { once: true }
            );

            // Start initial hide timer
            hideTimeout = setTimeout(hideControls, 3000);
          }, 3000);
        }
        e.stopPropagation();
        if (videoEl.currentTime === 1) {
          // Fade to black before playing from 0
          const fadeOverlay = document.createElement("div");
          fadeOverlay.className = "custom-video-fade-overlay";
          videoEl.parentElement.appendChild(fadeOverlay);
          // Animate fade in for overlay and play button
          requestAnimationFrame(() => {
            fadeOverlay.classList.add("fading");
            overlay.classList.add("fading");
          });
          setTimeout(() => {
            videoEl.currentTime = 0;
            videoEl.play();

            // Fade out overlay and restore play button after play starts
            fadeOverlay.classList.remove("fading");
            overlay.classList.remove("fading");
            setTimeout(() => {
              fadeOverlay.remove();
            }, 400);
          }, 400);
        } else {
          videoEl.play();
        }
      }
    });

    // Show/hide pause and audio icons in modal header when video plays/pauses
    function updateHeaderIcons() {
      // Find the closest modal dialog
      const modal = videoEl.closest("dialog.carousel-modal-gallery");
      if (!modal) return;
      const pauseIcon = modal.querySelector(".pause-icon");
      const audioIcon = modal.querySelector(".audio-icon");
      if (!pauseIcon || !audioIcon) return;

      if (
        document.querySelectorAll(
          "dialog.carousel-modal-gallery[data-visible='true']"
        ).length === 0
      ) {
        pauseIcon.innerHTML = "";
        pauseIcon.style.display = "none";
        audioIcon.innerHTML = "";
        audioIcon.style.display = "none";
        return;
      }
      if (!videoEl.paused) {
        pauseIcon.innerHTML = `<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <mask id="mask0_8333_91014" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="25">
      <rect x="0.046875" y="0.00292969" width="24" height="24" fill="#D9D9D9"/>
      </mask>
      <g mask="url(#mask0_8333_91014)">
      <path d="M13.2969 18.5029V5.50293H18.5469V18.5029H13.2969ZM5.54688 18.5029V5.50293H10.7969V18.5029H5.54688ZM14.7969 17.0029H17.0469V7.00293H14.7969V17.0029ZM7.04688 17.0029H9.29688V7.00293H7.04688V17.0029Z" fill="white"/>
      </g>
      <mask id="mask1_8333_91014" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="25">
      <rect x="0.046875" y="0.00292969" width="24" height="24" fill="#D9D9D9"/>
      </mask>
      <g mask="url(#mask1_8333_91014)">
      <path d="M13.2969 18.5029V5.50293H18.5469V18.5029H13.2969ZM5.54688 18.5029V5.50293H10.7969V18.5029H5.54688ZM14.7969 17.0029H17.0469V7.00293H14.7969V17.0029ZM7.04688 17.0029H9.29688V7.00293H7.04688V17.0029Z" fill="white"/>
      </g>
      </svg>`;
        pauseIcon.style.display = "flex";
        audioIcon.innerHTML = `<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <mask id="mask0_8333_91024" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="25">
      <rect x="0.046875" y="0.00292969" width="24" height="24" fill="#D9D9D9"/>
      </mask>
      <g mask="url(#mask0_8333_91024)">
      <path d="M15.1414 15.6568L14.0876 14.6031L16.6876 12.0031L14.0876 9.40309L15.1414 8.34934L17.7414 10.9493L20.3414 8.34934L21.3951 9.40309L18.7951 12.0031L21.3951 14.6031L20.3414 15.6568L17.7414 13.0568L15.1414 15.6568ZM3.70312 14.5031V9.50309H7.41462L11.7029 5.21484V18.7913L7.41462 14.5031H3.70312ZM10.2029 8.85309L8.05288 11.0031H5.20287V13.0031H8.05288L10.2029 15.1531V8.85309Z" fill="white"/>
      </g>
      </svg>`;
        audioIcon.style.display = "flex";
        // Add event listener to toggle video audio on click
        audioIcon.onclick = (e) => {
          e.stopPropagation();
          if (videoEl.muted) {
            videoEl.muted = false;
            audioIcon.classList.add("audio-on");
            audioIcon.classList.remove("audio-off");
            // Set to unmuted icon (same as before)
            audioIcon.innerHTML = `<svg width="25" height="24" viewBox="0 0 25 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <mask id="mask0_8333_91024" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="25">
            <rect x="0.046875" y="0.00292969" width="24" height="24" fill="#D9D9D9"/>
            </mask>
            <g mask="url(#mask0_8333_91024)">
            <path d="M15.1414 15.6568L14.0876 14.6031L16.6876 12.0031L14.0876 9.40309L15.1414 8.34934L17.7414 10.9493L20.3414 8.34934L21.3951 9.40309L18.7951 12.0031L21.3951 14.6031L20.3414 15.6568L17.7414 13.0568L15.1414 15.6568ZM3.70312 14.5031V9.50309H7.41462L11.7029 5.21484V18.7913L7.41462 14.5031H3.70312ZM10.2029 8.85309L8.05288 11.0031H5.20287V13.0031H8.05288L10.2029 15.1531V8.85309Z" fill="white"/>
            </g>
            </svg>`;
          } else {
            videoEl.muted = true;
            audioIcon.classList.add("audio-off");
            audioIcon.classList.remove("audio-on");
            // Set to muted icon
            audioIcon.innerHTML = `<svg width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
<mask id="mask0_8866_92769" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="25">
<rect x="0.046875" y="0.567871" width="24" height="24" fill="#D9D9D9"/>
</mask>
<g mask="url(#mask0_8866_92769)">
<path d="M15.8708 13.3181V11.8181H19.4861V13.3181H15.8708ZM17.0131 20.0488L14.1208 17.8796L15.0323 16.6836L17.9246 18.8526L17.0131 20.0488ZM14.9938 8.41433L14.0823 7.21808L16.9746 5.04883L17.8861 6.24508L14.9938 8.41433ZM3.60156 15.0681V10.0681H7.31306L11.6016 5.77983V19.3563L7.31306 15.0681H3.60156ZM10.1016 9.41808L7.95156 11.5681H5.10156V13.5681H7.95156L10.1016 15.7181V9.41808Z" fill="white"/>
</g>
</svg>
`;
          }
        };
      } else {
        pauseIcon.innerHTML = "";
        pauseIcon.style.display = "none";
        audioIcon.innerHTML = "";
        audioIcon.style.display = "none";
      }
    }

    videoEl.addEventListener("play", updateHeaderIcons);
    videoEl.addEventListener("pause", updateHeaderIcons);
    videoEl.addEventListener("ended", updateHeaderIcons);
    // Initial state
    updateHeaderIcons();

    // Style play icon: ensure SVG is present
    const icon = overlay.querySelector(".custom-video-play-icon");
    icon.innerHTML = `<svg width="24" height="24" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><polygon points="6,4 20,12 6,20" fill="#222"/></svg>`;
  }

  // After modal slides are rendered, inject play button overlays for all videos
  function injectPlayButtonsForAllVideos(modalEl) {
    const videos = modalEl.querySelectorAll("video");
    videos.forEach((video) => {
      injectCustomPlayButton(video);
    });
  }

  // Return modal management object
  return {
    element: modalElement,
    open: openModal,
    close: closeModal,
    initSwiper,
    generateSlides,
    getTotalSlides,
  };
}

/**
 * Parses the content of a single modal slide from its AEM row structure.
 * @param {HTMLElement} slideRow - The div element representing a row for a modal slide.
 * @returns {Object} Parsed slide data object
 */
export function parseModalSlide(slideRow) {
  const cells = slideRow.querySelectorAll(":scope > div");
  const slideFormat = cells[0]?.textContent.trim() || "fullscreenImageText";
  const imageRight = cells[1]?.textContent.trim() === "true";
  // Try to get video first
  const video = slideRow.querySelector('a[href*="/content/dam"]');

  let videoHTML = null;
  if (video) {
    const coverPicture = slideRow.querySelector("picture img");
    videoHTML = document.createElement("video");
    // videoHTML.src = getBasePathBasedOnEnv() + video.innerText.trim();
    videoHTML.playsInline = true;
    videoHTML.autoplay = false;
    videoHTML.preload = "auto";
    videoHTML.style.width = "100%";
    videoHTML.style.height = "auto";
    videoHTML.style.opacity = "1";
    videoHTML.setAttribute("aria-label", "Video player");
    videoHTML.muted = false;

    videoHTML.poster =
      coverPicture?.src?.replace(/width=\d+/, "width=2000") || "";

    // // Lazy
    videoHTML.classList.add("lazy"); // needed for LazyLoad
    videoHTML.setAttribute("data-autoplay", ""); // LazyLoad handles autoplay

    const href = video.innerText.trim();
    const basePath = getBasePathBasedOnEnv();
    const baseName = href.replace(/\.[^/.]+$/, ""); // Remove extension

    // WebM source
    // const webmSource = document.createElement("source");
    // // if (lazy) {
    // webmSource.setAttribute("data-src", basePath + baseName + ".webm");
    // // } else {
    // // webmSource.src = basePath + baseName + ".webm";
    // // }
    // webmSource.type = "video/webm";

    // MP4 source (fallback)
    const mp4Source = document.createElement("source");
    // if (lazy) {
    mp4Source.setAttribute("data-src", basePath + baseName + ".mp4");
    // } else {
    // mp4Source.src = basePath + baseName + ".mp4";
    // }
    mp4Source.type = "video/mp4";

    // videoHTML.appendChild(webmSource);
    videoHTML.appendChild(mp4Source);

    video.parentElement.remove();
  }
  // If video exists, use it, else use image
  let media = videoHTML
    ? videoHTML.outerHTML
    : slideRow.querySelector("picture")?.outerHTML || "";

  const text = cells[3];
  const primaryCtaContainer = cells[4];
  const secondaryCtaContainer = cells[5];
  let cta = {};
  if (primaryCtaContainer || secondaryCtaContainer) {
    const primaryCta = primaryCtaContainer?.children[0] || null;
    const secondaryCta = secondaryCtaContainer?.children[0] || null;
    cta = { primaryCta, secondaryCta };
  }

  return { slideFormat, imageRight, image: media, text, cta };
}
