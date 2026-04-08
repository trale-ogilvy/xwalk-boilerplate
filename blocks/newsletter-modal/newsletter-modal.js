import { isUniversalEditor, loadCSS } from "../../scripts/aem.js";

export function renderNewsletterModal(block) {
  // Use the global NewsletterModal component
  if (window.NewsletterModal) {
    window.NewsletterModal.setModalBlock(block);
    window.NewsletterModal.renderNewsletterModal(block);
  } else {
    console.warn("Global NewsletterModal not available");
  }
}

export function openModal() {
  if (window.NewsletterModal) {
    window.NewsletterModal.openModal();
  } else {
    console.warn("Global NewsletterModal not available");
  }
}

export function closeModal() {
  if (window.NewsletterModal) {
    window.NewsletterModal.closeModal();
  } else {
    console.warn("Global NewsletterModal not available");
  }
}

export default function decorate(block) {
  if (isUniversalEditor()) {
    loadCSS(
      `${window.hlx.codeBasePath}/blocks/newsletter-modal/newsletter-modal-author.css`
    );
    return;
  }
  // Wait for global NewsletterModal to be available
  const initModal = () => {
    if (window.NewsletterModal) {
      window.NewsletterModal.setModalBlock(block);
      renderNewsletterModal(block);
    } else {
      // Retry after a short delay
      setTimeout(initModal, 100);
    }
  };
  initModal();
}
