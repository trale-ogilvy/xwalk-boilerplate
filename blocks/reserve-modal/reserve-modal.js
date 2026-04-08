import { isUniversalEditor } from "../../scripts/aem.js";
import { fetchPlaceholders } from "../../scripts/utils.js";

const ReserveModalManager = {
  scrollY: 0,
  isScrollLocked: false,
  modalWrapper: null,
  scrollCleanup: null,
  isInitialized: false,
  isModalClosing: false,

  init() {
    if (this.isInitialized) return;
    this.addGlobalEventListeners();
    this.isInitialized = true;
  },

  addGlobalEventListeners() {
    document.body.addEventListener("click", (e) => {
      const link = e.target.closest("a[href]");

      if (link) {
        const href = link.getAttribute("href");
        let path;
        try {
          const url = new URL(href, window.location.origin);
          path = url.pathname;
        } catch (e) {
          path = href.split("?")[0].split("#")[0];
        }

        const normalizedPath = path.replace(/^\/|\/$/g, "");
        if (normalizedPath === "reserveModal") {
          e.preventDefault();
          e.stopPropagation();
          if (e.srcElement.textContent === "reserve your stay") {
            //TODO INTERIM - Open newsletter in the dialog that is clicked for carousel slide in imprints
            const slide =
              e.srcElement.parentElement.parentElement.parentElement
                .parentElement.parentElement.parentElement.parentElement;
            // Store the original parent and next sibling to restore later
            this._originalParent = this.modalWrapper.parentElement;
            this._originalNextSibling = this.modalWrapper.nextSibling;

            // When closing, move modal back to original parent
            const originalCloseModal = this.closeModal.bind(this);
            this.closeModal = () => {
              if (
                this._originalParent &&
                this.modalWrapper &&
                this.modalWrapper.parentElement !== this._originalParent
              ) {
                this._originalParent.insertBefore(
                  this.modalWrapper,
                  this._originalNextSibling
                );
              }
              originalCloseModal();
            };
            // Append the modal container to the slide so it appears within the clicked carousel slide
            if (slide && !slide.contains(this.modalWrapper)) {
              slide.appendChild(this.modalWrapper);
              this.openModal();
            }
          }
          this.openModal();
        }
      }
    });
  },

  openModal() {
    if (!this.modalWrapper) {
      this.modalWrapper = document.querySelector(".reserve-modal-container");
    }

    if (this.modalWrapper) {
      this.disableBodyScroll(true);
      this.modalWrapper.style.display = "flex";

      requestAnimationFrame(() => {
        this.modalWrapper.classList.add("is-visible");
      });
      this.modalWrapper.focus();

      const scrollableElement = this.modalWrapper.querySelector(
        ".reserve-modal-wrapper"
      );
      if (scrollableElement) {
        this.scrollCleanup = this.setupScrollHide(
          this.modalWrapper,
          scrollableElement
        );
      }
    } else {
      console.warn("Reserve Modal block not found or decorated on the page.");
    }
  },

  closeModal() {
    if (this.isModalClosing) return;

    this.isModalClosing = true;

    if (!this.modalWrapper) return;

    this.modalWrapper.classList.remove("is-visible");

    if (this.scrollCleanup) {
      this.scrollCleanup();
      this.scrollCleanup = null;
    }

    const handleTransitionEnd = () => {
      this.modalWrapper.style.display = "none";
      this.modalWrapper.removeEventListener(
        "transitionend",
        handleTransitionEnd
      );

      this.disableBodyScroll(false);

      setTimeout(() => {
        this.isModalClosing = false;
      }, 100);
    };

    this.modalWrapper.addEventListener("transitionend", handleTransitionEnd);
  },

  disableBodyScroll(lock) {
    if (lock && !this.isScrollLocked) {
      this.scrollY = window.scrollY;
      this.isScrollLocked = true;
      document.body.style.position = "fixed";
      document.body.style.top = `-${this.scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
    } else if (!lock && this.isScrollLocked) {
      this.isScrollLocked = false;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      window.scrollTo(0, this.scrollY);
    }
  },

  setupScrollHide(containerToHide, scrollableElement) {
    let lastScrollTop = 0;
    const scrollThreshold = 50;
    let isHeaderHidden = false;

    const handleScroll = () => {
      const currentScrollTop = scrollableElement.scrollTop;
      const scrollDifference = Math.abs(currentScrollTop - lastScrollTop);

      if (scrollDifference < scrollThreshold) return;

      const isScrollingDown = currentScrollTop > lastScrollTop;
      const isAtTop = currentScrollTop <= scrollThreshold;

      if (isAtTop && isHeaderHidden) {
        containerToHide.classList.remove("is-scroll-hide");
        isHeaderHidden = false;
      } else if (
        isScrollingDown &&
        currentScrollTop > scrollThreshold &&
        !isHeaderHidden
      ) {
        containerToHide.classList.add("is-scroll-hide");
        isHeaderHidden = true;
      } else if (!isScrollingDown && !isAtTop && isHeaderHidden) {
        containerToHide.classList.remove("is-scroll-hide");
        isHeaderHidden = false;
      }
      lastScrollTop = currentScrollTop;
    };

    scrollableElement.addEventListener("scroll", handleScroll);

    return () => {
      scrollableElement.removeEventListener("scroll", handleScroll);
    };
  },

  async decorate(block) {
    if (isUniversalEditor()) return;

    // Fetch placeholders
    const placeholders = await fetchPlaceholders();
    const closeText = placeholders?.newsletterSuccessClose || "CLOSE";

    this.modalWrapper = document.createElement("div");
    this.modalWrapper.className = "reserve-modal-container";
    this.modalWrapper.style.display = "none";
    this.modalWrapper.tabIndex = -1;

    const modalInnerWrapper = document.createElement("div");
    modalInnerWrapper.className = "reserve-modal-wrapper";

    // Create the header for the modal (contains close button and logo)
    const modalHeader = document.createElement("div");
    modalHeader.className = "reserve-modal-header";

    const closeBtn = document.createElement("button");
    closeBtn.className = "reserve-modal-close";
    closeBtn.innerHTML = `<span class="close-symbol">×</span> <span class="text-b">${closeText}</span>`;
    closeBtn.onclick = () => {
      this.closeModal();
    };

    const modalLogoWrapper = document.createElement("div");
    modalLogoWrapper.className = "reserve-modal-logo-wrapper";
    modalLogoWrapper.style.cursor = "pointer";

    modalLogoWrapper.addEventListener("click", () => {
      window.location.href = "/";
    });

    const modalLogo = document.createElement("div");
    modalLogo.className = "reserve-modal-logo";
    modalLogo.innerHTML = `<img src="/icons/patina-full-logo.svg" alt="Patina Green Logo" />`;

    modalLogoWrapper.appendChild(modalLogo);

    modalHeader.appendChild(closeBtn);
    modalHeader.appendChild(modalLogoWrapper);

    document.addEventListener("keydown", (e) => {
      if (
        this.modalWrapper &&
        this.modalWrapper.style.display === "flex" &&
        e.key === "Escape"
      ) {
        this.closeModal();
      }
    });

    block.classList.add("destinations-layout");

    const title = block.querySelector("div:first-child");
    if (title) {
      title.classList.add("reserve-modal-title", "text-h2");
    }

    const cards = block.querySelectorAll("div:not(:first-child)");

    cards.forEach((card, index) => {
      card.classList.add("reserve-modal-card");
      card.classList.add(`reserve-modal-card-${index + 1}`);

      const imageContainer = card.querySelector("div:first-child");
      if (imageContainer) {
        imageContainer.classList.add("reserve-modal-card-image");
      }

      const titleContainer = card.querySelector("div:nth-child(2)");
      if (titleContainer) {
        titleContainer.classList.add("reserve-modal-card-title", "text-h4");
      }

      const ctaContainer = card.querySelector("div:nth-child(3)");
      if (ctaContainer) {
        ctaContainer.classList.add("reserve-modal-card-cta");
      }

      const link = card.querySelector("a");
      if (link) {
        link.classList.add("reserve-modal-card-link");

        card.addEventListener("click", (e) => {
          if (e.target.tagName !== "A") {
            e.preventDefault();
            card.classList.add("is-active");
            setTimeout(() => {
              card.classList.remove("is-active");
            }, 200);

            window.location.href = link.href;
          }
        });

        card.addEventListener("mouseenter", () => {
          card.classList.add("is-hovered");
        });
        card.addEventListener("mouseleave", () => {
          card.classList.remove("is-hovered");
        });
      }

      const destination = titleContainer?.textContent?.trim().toLowerCase();
      if (destination) {
        card.dataset.destination = destination;
      }
    });

    cards.forEach((card) => {
      const img = card.querySelector("img");
      if (img) {
        card.classList.add("is-loading");
        img.addEventListener("load", () => {
          card.classList.remove("is-loading");
        });
        img.addEventListener("error", () => {
          card.classList.remove("is-loading");
          card.classList.add("is-error");
        });
      }
    });

    this.modalWrapper.appendChild(modalHeader);
    modalInnerWrapper.appendChild(block);
    this.modalWrapper.appendChild(modalInnerWrapper);
    document.body.appendChild(this.modalWrapper);

    block.classList.add("decorated");
  },
};

if (!window.ReserveModalManager) {
  window.ReserveModalManager = ReserveModalManager;
  window.ReserveModalManager.init();
}

export default async function decorate(block) {
  await window.ReserveModalManager.decorate(block);
}
