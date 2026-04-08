const SuccessModalManager = {
  scrollY: 0,
  isScrollLocked: false,
  modalWrapper: null,
  isInitialized: false,
  placeholders: null,

  async init(placeholdersData) {
    if (this.isInitialized) return;
    this.placeholders = placeholdersData;
    this.createModalStructure();
    this.updateModalTextContent();
    this.addGlobalEventListeners();
    this.isInitialized = true;
  },

  addGlobalEventListeners() {
    document.body.addEventListener("click", (e) => {
      const link = e.target.closest('a[href="/showSuccessModal"]');
      if (link) {
        e.preventDefault();
        e.stopPropagation();
        this.openModal();
      }
    });
  },

  createModalStructure() {
    if (document.querySelector(".success-modal-wrapper")) return;

    this.modalWrapper = document.createElement("div");
    this.modalWrapper.className = "success-modal-wrapper";

    const modalOverlay = document.createElement("div");
    modalOverlay.className = "success-modal-overlay";
    this.modalWrapper.appendChild(modalOverlay);

    const modalContent = document.createElement("div");
    modalContent.className = "success-modal-content";
    this.modalWrapper.appendChild(modalContent);

    const imageHeader = document.createElement("div");
    imageHeader.className = "success-modal-image-header";
    modalContent.appendChild(imageHeader);

    const textContent = document.createElement("div");
    textContent.className = "success-modal-text-content";
    modalContent.appendChild(textContent);

    const title = document.createElement("h4");
    title.className = "success-modal-title text-h4";
    title.textContent = "We've received your request";
    textContent.appendChild(title);

    const subtitle = document.createElement("p");
    subtitle.className = "success-modal-subtitle text-p1";
    subtitle.textContent = "Our team will be in touch with you shortly";
    textContent.appendChild(subtitle);

    const doneButton = document.createElement("button");
    doneButton.className = "success-modal-done-btn text-b";
    doneButton.textContent = "DONE";
    textContent.appendChild(doneButton);

    doneButton.addEventListener("click", () => this.closeModal());

    document.body.appendChild(this.modalWrapper);
  },

  updateModalTextContent() {
    if (!this.modalWrapper || !this.placeholders) return;

    const title = this.modalWrapper.querySelector(".success-modal-title");
    const subtitle = this.modalWrapper.querySelector(".success-modal-subtitle");
    const doneButton = this.modalWrapper.querySelector(
      ".success-modal-done-btn"
    );

    if (title) {
      title.textContent =
        this.placeholders.successModalDefaultTitle ||
        "We've received your request";
    }
    if (subtitle) {
      subtitle.textContent =
        this.placeholders.successModalDefaultSubtitle ||
        "Our team will be in touch with you shortly";
    }
    if (doneButton) {
      doneButton.textContent = this.placeholders.doneButton || "DONE";
    }
  },

  openModal() {
    if (this.modalWrapper) {
      this.modalWrapper.classList.add("is-open");
      this.disableBodyScroll(true);
    } else {
      console.warn("Success Modal has not been initialized yet.");
    }
  },

  closeModal() {
    if (this.modalWrapper) {
      this.modalWrapper.classList.remove("is-open");
      this.disableBodyScroll(false);
    }
  },

  disableBodyScroll(lock) {
    if (lock && !this.isScrollLocked) {
      this.scrollY = window.scrollY;
      this.isScrollLocked = true;
      document.body.style.position = "fixed";
      document.body.style.top = `-${this.scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    } else if (!lock && this.isScrollLocked) {
      this.isScrollLocked = false;
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";
      window.scrollTo(0, this.scrollY);
    }
  },

  mapDestinationToImage(destination) {
    if (!destination) return "osaka";

    const destinationLower = destination.toLowerCase();

    const destinationMap = {
      ptmal: "maldives",
      ptosa: "osaka",
      maldives: "maldives",
      osaka: "osaka",
    };

    return destinationMap[destinationLower] || "osaka";
  },

  updateModalContent(enquiryType, destination = null) {
    if (!this.modalWrapper) return;

    const title = this.modalWrapper.querySelector(".success-modal-title");
    const subtitle = this.modalWrapper.querySelector(".success-modal-subtitle");
    const imageHeader = this.modalWrapper.querySelector(
      ".success-modal-image-header"
    );
    const doneButton = this.modalWrapper.querySelector(
      ".success-modal-done-btn"
    );

    if (!title || !subtitle || !imageHeader || !doneButton) return;

    doneButton.textContent = this.placeholders?.doneButton || "DONE";

    imageHeader.className = "success-modal-image-header";

    if (enquiryType === "error") {
      const mappedDestination = this.mapDestinationToImage(destination);
      const dynamicImageClass = `success-image-general-${mappedDestination}`;
      imageHeader.classList.add(dynamicImageClass);

      title.textContent =
        this.placeholders?.errorModalTitle ||
        "We couldn't process your request";
      subtitle.textContent =
        this.placeholders?.errorModalSubtitle ||
        "Please try again or contact us directly for assistance";
      return;
    }

    let imageType = enquiryType;

    if (enquiryType === "events") {
      imageType = "event";
    } else if (enquiryType === "wellness") {
      imageType = "wellbeing";
    }

    const mappedDestination = this.mapDestinationToImage(destination);

    const dynamicImageClass = `success-image-${imageType}-${mappedDestination}`;
    imageHeader.classList.add(dynamicImageClass);

    switch (enquiryType) {
      case "wedding":
        title.textContent =
          this.placeholders?.successModalWeddingTitle ||
          "We've received your wedding enquiry";
        subtitle.textContent =
          this.placeholders?.successModalWeddingSubtitle ||
          "Our team will be in touch to help bring your celebration to life";
        break;
      case "restaurant":
        title.textContent =
          this.placeholders?.successModalRestaurantTitle ||
          "We've received your dining request";
        subtitle.textContent =
          this.placeholders?.successModalRestaurantSubtitle ||
          "Our team will reach out for confirmation shortly";
        break;
      case "events":
        title.textContent =
          this.placeholders?.successModalEventsTitle ||
          "We've received your event enquiry";
        subtitle.textContent =
          this.placeholders?.successModalEventsSubtitle ||
          "Our team will be in touch to help bring your celebration to life";
        break;
      case "wellness":
        title.textContent =
          this.placeholders?.successModalWellnessTitle ||
          "We've received your wellness enquiry";
        subtitle.textContent =
          this.placeholders?.successModalWellnessSubtitle ||
          "Our team will be in touch to guide your experience";
        break;
      default:
        title.textContent =
          this.placeholders?.successModalDefaultTitle ||
          "We've received your request";
        subtitle.textContent =
          this.placeholders?.successModalDefaultSubtitle ||
          "Our team will be in touch with you shortly";
        break;
    }
  },
};

export async function showSuccessModal(
  enquiryType = "general",
  destination = null,
  placeholdersData = null
) {
  if (!SuccessModalManager.isInitialized) {
    await SuccessModalManager.init(placeholdersData);
  }
  SuccessModalManager.updateModalContent(enquiryType, destination);
  SuccessModalManager.openModal();
}

export async function showErrorModal(
  destination = null,
  placeholdersData = null
) {
  if (!SuccessModalManager.isInitialized) {
    await SuccessModalManager.init(placeholdersData);
  }
  SuccessModalManager.updateModalContent("error", destination);
  SuccessModalManager.openModal();
}

export default function decorate(block) {
  block.style.display = "none";
}
