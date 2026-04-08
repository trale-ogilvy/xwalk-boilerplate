import {
  createConditionalForm,
  validateForm,
  displayErrors,
  clearAllErrors,
  getDestinationFromUrl,
} from "./general-modal-utils.js";
import { submitEnquiry } from "./general-modal-api.js";
import {
  showSuccessModal,
  showErrorModal,
} from "../success-modal/success-modal.js";
import { fetchPlaceholders } from "../../scripts/utils.js";

const placeholders = await fetchPlaceholders();

const GeneralModalManager = {
  modalElement: null,
  isInitialized: false,
  recaptchaWidgetId: null,
  formElement: null,
  RECAPTCHA_SITE_KEY: "6LfpYh8rAAAAAPaE-icNeXk4b8ktPXqLKwHhqp6d",
  recaptchaReady: false,
  recaptchaContainer: null,
  enquiryTerms: {},

  titleMap: {
    general: placeholders.generalenquiryTitle,
    wedding: placeholders.weddingenquiryTitle,
    events: placeholders.eventsenquiryTitle,
    restaurant: placeholders.restaurantenquiryTitle,
    wellness: placeholders.wellnessenquiryTitle,
  },

  currentDestination: null,

  init() {
    if (this.isInitialized) return;
    this.waitForRecaptcha();
    this.createModalStructure();
    this.addGlobalEventListeners();
    this.currentDestination = getDestinationFromUrl();
    this.isInitialized = true;
  },

  waitForRecaptcha() {
    const checkRecaptcha = () => {
      if (
        typeof window.grecaptcha !== "undefined" &&
        window.grecaptcha.render
      ) {
        this.recaptchaReady = true;
        console.log("reCAPTCHA API ready");
      } else {
        setTimeout(checkRecaptcha, 100);
      }
    };
    checkRecaptcha();
  },

  addGlobalEventListeners() {
    document.body.addEventListener("click", (e) => {
      const selector = [
        'a[href*="/weddingEnquiry"]',
        'a[href*="/generalEnquiry"]',
        'a[href*="/eventsEnquiry"]',
        'a[href*="/restaurantEnquiry"]',
        'a[href*="/wellnessEnquiry"]',
      ].join(", ");

      const link = e.target.closest(selector);
      if (link) {
        e.preventDefault();
        e.stopPropagation();
        const href = link.getAttribute("href");
        const enquiryType = href
          .substring(1, href.indexOf("Enquiry"))
          .toLowerCase();
        this.openModal(enquiryType);
      }
    });
  },

  openModal(enquiryType) {
    if (!this.modalElement) {
      console.warn("General Modal has not been initialized yet.");
      return;
    }

    this.cleanupPreviousForm();

    this.formElement = createConditionalForm(enquiryType, placeholders);

    const modalContent = this.modalElement.querySelector(
      ".general-modal-content"
    );
    const title = modalContent.querySelector(".general-modal-title");

    title.insertAdjacentElement("afterend", this.formElement);

    if (enquiryType === "general") {
      if (window.location.href.includes(this.currentDestination)) {
        title.textContent =
          this.titleMap.general ||
          `Let us plan your experience in the ${this.currentDestination}`;
      } else {
        title.textContent = this.titleMap.general || "Enquiry Form";
      }
    } else {
      title.textContent = this.titleMap[enquiryType] || "Enquiry Form";
    }

    const submitButton = this.formElement.querySelector(
      ".general-modal__submit-btn"
    );
    if (submitButton) {
      submitButton.addEventListener("click", (e) => this.handleFormSubmit(e));
    }

    this.recaptchaContainer = this.formElement.querySelector(
      "#general-modal-recaptcha"
    );

    this.modalElement.style.display = "flex";
    setTimeout(() => {
      this.modalElement.classList.add("general-modal-open");
    }, 10);

    setTimeout(() => {
      this.initializeRecaptcha();
    }, 150);
  },

  cleanupPreviousForm() {
    this.resetRecaptchaWidget();

    if (this.formElement) {
      this.formElement.remove();
      this.formElement = null;
    }

    if (this.recaptchaObserver) {
      this.recaptchaObserver.disconnect();
      this.recaptchaObserver = null;
    }

    this.recaptchaContainer = null;
  },

  resetRecaptchaWidget() {
    if (this.recaptchaWidgetId !== null) {
      try {
        console.log(`Resetting reCAPTCHA widget ID: ${this.recaptchaWidgetId}`);
        if (
          typeof window.grecaptcha !== "undefined" &&
          window.grecaptcha.reset
        ) {
          window.grecaptcha.reset(this.recaptchaWidgetId);
        }
      } catch (error) {
        console.warn("Error resetting reCAPTCHA widget:", error);
      }

      this.recaptchaWidgetId = null;
    }
  },

  initializeRecaptcha() {
    if (!this.recaptchaContainer) {
      console.warn("reCAPTCHA container not found");
      return;
    }

    const tryInitialize = () => {
      if (
        !this.recaptchaReady ||
        typeof window.grecaptcha === "undefined" ||
        !window.grecaptcha.render
      ) {
        setTimeout(tryInitialize, 200);
        return;
      }

      try {
        this.recaptchaContainer.innerHTML = "";

        this.recaptchaWidgetId = window.grecaptcha.render(
          this.recaptchaContainer,
          {
            sitekey: this.RECAPTCHA_SITE_KEY,
            theme: "light",
            size: "normal",
            callback: (response) => {
              const errorElement =
                this.recaptchaContainer?.parentElement?.querySelector(
                  ".error-message"
                );
              if (errorElement) {
                errorElement.style.display = "none";
              }
            },
            "expired-callback": () => {},
            "error-callback": (error) => {
              this.showRecaptchaError(
                "reCAPTCHA failed to load. Please refresh the page and try again."
              );
              this.recaptchaWidgetId = null;
            },
          }
        );

        this.centerRecaptchaChallenge();
      } catch (error) {
        console.error("Error rendering reCAPTCHA:", error);

        if (
          error.message &&
          error.message.includes("reCAPTCHA has already been rendered")
        ) {
          this.forceRecaptchaCleanup();

          setTimeout(() => {
            this.initializeRecaptcha();
          }, 300);
        } else {
          this.showRecaptchaError(
            "reCAPTCHA failed to load. Please refresh the page and try again."
          );
        }
      }
    };

    tryInitialize();
  },

  centerRecaptchaChallenge() {
    const observer = new MutationObserver((mutations) => {
      const challengeFrame = document.querySelector('iframe[src*="bframe"]');
      if (challengeFrame) {
        const container = challengeFrame.parentElement;
        if (container && container.style) {
          container.style.position = "fixed";
          container.style.left = "50%";
          container.style.top = "50%";
          container.style.transform = "translate(-50%, -50%)";
          container.style.margin = "0";
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    this.recaptchaObserver = observer;
  },

  forceRecaptchaCleanup() {
    this.recaptchaWidgetId = null;

    if (this.recaptchaContainer) {
      this.recaptchaContainer.innerHTML = "";
    }

    const orphanedFrames = document.querySelectorAll(
      'iframe[src*="recaptcha"], div[id^="rc-"], div[class*="recaptcha"]:not(#general-modal-recaptcha)'
    );
    orphanedFrames.forEach((frame) => {
      if (frame.parentNode && !frame.closest("#general-modal-recaptcha")) {
        frame.parentNode.removeChild(frame);
      }
    });
  },

  showRecaptchaError(message) {
    if (this.recaptchaContainer) {
      this.recaptchaContainer.innerHTML = `
        <div style="color: red; text-align: center; padding: 10px; border: 1px solid red; border-radius: 4px; font-size: 14px;">
          ${message}
        </div>
      `;
    }
    this.recaptchaWidgetId = null;
  },

  closeModal() {
    if (this.modalElement) {
      this.modalElement.classList.remove("general-modal-open");

      setTimeout(() => {
        this.modalElement.style.display = "none";
      }, 300);

      if (this.formElement) {
        clearAllErrors(this.formElement);
        this.formElement.reset();
      }

      this.resetRecaptchaWidget();
    }
  },

  hideModal() {
    if (this.modalElement) {
      this.modalElement.classList.remove("general-modal-open");

      setTimeout(() => {
        this.modalElement.style.display = "none";
      }, 300);

      if (this.formElement) {
        clearAllErrors(this.formElement);
        this.formElement.reset();
      }

      this.resetRecaptchaWidget();
    }
  },

  createModalStructure() {
    if (document.querySelector(".general-modal-overlay")) return;

    this.modalElement = document.createElement("div");
    this.modalElement.className = "general-modal-overlay";
    this.modalElement.style.display = "none";

    const modalDialog = document.createElement("div");
    modalDialog.className = "general-modal-dialog";

    const modalContent = document.createElement("div");
    modalContent.className = "general-modal-content";
    modalDialog.appendChild(modalContent);

    const closeButton = document.createElement("button");
    closeButton.className = "general-modal-close";
    closeButton.innerHTML =
      '<span class="general-modal-close-symbol">&times;</span>';
    closeButton.setAttribute("aria-label", "Close modal");
    closeButton.setAttribute("type", "button");
    modalContent.appendChild(closeButton);

    const title = document.createElement("h2");
    title.className = "general-modal-title";
    title.textContent = "Enquiry Form";
    modalContent.appendChild(title);

    closeButton.addEventListener("click", () => this.closeModal());

    this.modalElement.addEventListener("click", (e) => {
      if (e.target === this.modalElement) {
        this.closeModal();
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape" && this.modalElement.style.display === "flex") {
        this.closeModal();
      }
    });

    this.modalElement.appendChild(modalDialog);
    document.body.appendChild(this.modalElement);
  },

  async handleFormSubmit(event) {
    event.preventDefault();

    const submitButton = event.target;
    const form = this.formElement;
    const originalButtonText = submitButton.textContent;

    submitButton.textContent = "Submitting...";
    submitButton.disabled = true;
    const spinner = document.createElement("span");
    spinner.className = "button-spinner";
    submitButton.appendChild(spinner);

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    let enquiryType = form.dataset.enquiryType;

    if (enquiryType === "events") {
      enquiryType = "event";
    }

    data.enquiryType = enquiryType;

    try {
      if (
        this.recaptchaWidgetId !== null &&
        typeof window.grecaptcha !== "undefined"
      ) {
        data.captchaValue = window.grecaptcha.getResponse(
          this.recaptchaWidgetId
        );
      } else {
        data.captchaValue = "";
        console.warn("reCAPTCHA widget not available");
      }
    } catch (error) {
      console.error("Error getting reCAPTCHA response:", error);
      data.captchaValue = "";
    }

    clearAllErrors(form);
    const errors = validateForm(data, placeholders);

    if (Object.keys(errors).length > 0) {
      displayErrors(form, errors);
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
      if (spinner.parentNode) {
        spinner.parentNode.removeChild(spinner);
      }
      return;
    }

    const countryCode = data.countryCode;
    const phoneNumber = data.phone;

    if (phoneNumber) {
      data.phone = countryCode + phoneNumber;
    } else {
      data.phone = "";
    }
    delete data.countryCode;

    try {
      const apiFormData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        apiFormData.append(key, value);
      });

      const result = await submitEnquiry(apiFormData);

      if (
        result.status === 200 ||
        result.code === 200 ||
        result.status === "success"
      ) {
        this.hideModal();
        showSuccessModal(
          form.dataset.enquiryType,
          this.currentDestination,
          placeholders
        );
      } else {
        throw new Error(
          `API returned unexpected response: ${JSON.stringify(result)}`
        );
      }
    } catch (error) {
      console.error("Submission failed:", error);
      this.hideModal();
      showErrorModal(this.currentDestination, placeholders);
    } finally {
      submitButton.textContent = originalButtonText;
      submitButton.disabled = false;
      if (spinner.parentNode) {
        spinner.parentNode.removeChild(spinner);
      }
    }
  },
};

if (!window.GeneralModalManager) {
  window.GeneralModalManager = GeneralModalManager;
  window.GeneralModalManager.init();
}

export default function decorate(block) {
  const liElements = block.querySelectorAll("li");
  liElements.forEach((li) => {
    const fullHTML = li.innerHTML;
    const text = li.textContent;
    const languageMatch = text.match(/^([A-Z]{2,3}):/);
    if (languageMatch) {
      const languageCode = languageMatch[1];

      const content = fullHTML
        .replace(new RegExp(`^\\s*${languageCode}:\\s*`), "")
        .trim();
      window.GeneralModalManager.enquiryTerms[languageCode] = content;
    }
  });

  block.style.display = "none";
}
