import { createTextImageModal } from "../../scripts/delayed.js";

export default function decorate(block) {
  [...block.children].forEach((modal) => {
    const triggerText =
      modal.children[1].children[0].children[0].getAttribute("href");
    const modalContent = modal.children[2];

    createTextImageModal(document, modalContent, triggerText);
  });
}
