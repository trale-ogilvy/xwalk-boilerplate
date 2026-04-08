import {
  getElements,
  createArtistCard,
  showArtistModal,
  setupArtistCardClickHandler,
} from "../../scripts/utils.js";
import { isUniversalEditor, loadCSS } from "../../scripts/aem.js";
import { handleEditorEnv } from "./double-column-cards-utils.js";

export default async function decorate(block) {
  if (isUniversalEditor()) {
    loadCSS(
      `${window.hlx.codeBasePath}/blocks/double-column-cards/double-column-cards-author.css`
    );
    const cards = [...block.children];
    handleEditorEnv(cards);
    return;
  }

  [...block.children].forEach((card, cardIndex) => {
    const artistId = `double-column-artist-${cardIndex}-${Date.now()}`;

    const selectors = [
      {
        key: "cardImage",
        sel: ":scope > div:nth-child(1) > picture ",
      },
      {
        key: "cardCta",
        sel: ":scope > div:nth-child(2) > p.button-container > a",
      },
      {
        key: "label",
        sel: ":scope > div:nth-child(3) > p",
      },
      {
        key: "title",
        sel: ":scope > div:nth-child(4) > p",
      },
      {
        key: "description",
        sel: ":scope > div:nth-child(5) > p",
      },
      {
        key: "ctaLink",
        sel: ":scope > div:nth-child(6) > p.button-container > a",
      },
      {
        key: "profileModal",
        sel: ":scope > div:nth-child(7) > p",
      },
      {
        key: "profileCardContent",
        sel: ":scope > div:nth-child(8)",
      },
      {
        key: "profileModalContent",
        sel: ":scope > div:nth-child(9)",
      },
    ];

    const elements = getElements(card, selectors);

    /* ----------------------------- Fields Content ----------------------------- */
    // Main card content with null checks
    const cardImage = elements.cardImage?.[0];
    const cardCtaElement = elements.cardCta?.[0];
    const cardCtaLink = cardCtaElement?.getAttribute("href") || "#";
    const label = elements.label?.[0]?.textContent || "";
    const title = elements.title?.[0]?.textContent || "";
    const description = elements.description?.[0]?.textContent || "";
    const ctaLinkElement = elements.ctaLink?.[0];
    const ctaLinkText = ctaLinkElement?.textContent || "";
    const ctaLink = ctaLinkElement?.getAttribute("href") || "#";
    const profileModal =
      elements.profileModal?.[0]?.textContent.trim() === "true" || false;
    // Profile card content
    const artistName =
      elements.profileCardContent?.[0]?.querySelector("p")?.textContent || "";
    const artistThumbnailImage =
      elements.profileCardContent?.[0]?.querySelector("picture") || "";

    /* ----------------------------- HTML Structure ----------------------------- */
    card.outerHTML = `
      <div class="card">
      <div class="card-image-container">
        <a href="${cardCtaLink}" class="card-image-wrapper">
        ${cardImage?.innerHTML}
        </a>
        ${
          profileModal
            ? createArtistCard(
                artistThumbnailImage?.outerHTML || "",
                artistName,
                artistId
              )
            : ""
        }
      </div>
      <div class="card-content">
        <div class="left-column">
        ${label ? `<p class="label text-l2">${label}</p>` : ""}
        <a href="${cardCtaLink}" class="title text-h2">${title}</a>
        ${
          ctaLink && ctaLinkText
            ? `<a href="${ctaLink}" class="cta-link chevron-right desktop"><span class="animate-underline">${ctaLinkText}</span></a>`
            : ""
        }
        </div>
        <div class="right-column">
        <p class="description text-p1">${description}</p>
         ${
           ctaLink && ctaLinkText
             ? `<a href="${ctaLink}" class="cta-link chevron-right mobile"><span class="animate-underline">${ctaLinkText}</span></a>`
             : ""
         }
        </div>
      </div>
      </div>
    `;

    // Create modal and set up click handler if profile modal is enabled
    let openArtistModalFn = null;
    if (profileModal && elements.profileModalContent?.[0]) {
      const artistModalData = showArtistModal(
        elements.profileModalContent[0],
        artistId
      );
      openArtistModalFn = artistModalData.openModal;

      // Set up click handler for the artist card
      setupArtistCardClickHandler(artistId, openArtistModalFn);
    }
  });
}
