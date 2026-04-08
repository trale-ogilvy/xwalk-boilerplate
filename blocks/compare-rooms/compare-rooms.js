import { isUniversalEditor, loadCSS } from "../../scripts/aem.js";
import { createCustomDropdown } from "../../scripts/utils.js";
import { fetchPlaceholders } from "../../scripts/utils.js";

export default async function decorate(block) {
  if (isUniversalEditor()) {
    loadCSS(
      `${window.hlx.codeBasePath}/blocks/compare-rooms/compare-rooms-author.css`
    );
    return;
  }

  const placeholders = await fetchPlaceholders();

  const cards = [...block.children];
  const cardTitles = cards.map((card) => {
    const firstRow = card.children[0];
    const lastIndex = firstRow.children.length - 1;
    const title = firstRow && [...firstRow.children].slice(2, lastIndex - 1);
    return title ? title.map((t) => t.textContent).join(" ") : "";
  });

  const cardHTMLs = cards.map((card) => {
    /* -------------------------------- First Row ------------------------------- */
    const firstRow = card.children[0];
    const lastIndex = firstRow.children.length - 1;
    const imageContainer = firstRow.children[0];
    const label = firstRow.children[1];
    const title = [...firstRow.children].slice(2, lastIndex - 1);
    const price = firstRow?.children[lastIndex - 1];
    const mainCta = firstRow.children[lastIndex]?.children[0];
    /* ------------------------------- Second Row ------------------------------- */
    const secondRow = card.children[1];
    const secondRowTitle = secondRow.querySelector("p");
    const secondRowDetails = secondRow.querySelector("ul");
    const floorplanLink = secondRow.querySelector("a") || null;
    /* -------------------------------- Third Row ------------------------------- */
    const thirdRow = card.children[2];
    const thirdRowTitle = thirdRow.querySelector("p");
    const thirdRowDetails = thirdRow.querySelector("ul");
    const thirdRowCta = thirdRow.querySelector("a");

    return `
      <div class="compare-rooms-card">
        <div class="image-wrapper">
        ${imageContainer ? imageContainer.innerHTML : ""}
          <!-- <button class="remove-icon-button">
            <img src="/icons/close-icon.svg" alt="Remove Room" class="remove-icon">
          </button> -->
        </div>
        <div class="content-container">
        <div class="first-row">
        <div class="header-content">
          <p class="label text-l2">${label ? label.textContent : ""}</p>
          <h4 class="title text-h4">${
            title
              ? title.length !== 1
                ? title.map((t) => t.textContent).join("<br>")
                : title[0].innerHTML
              : ""
          }</h4>
          ${
            price.textContent !== "0" &&
            price.textContent !== "" &&
            price.textContent !== 0
              ? `<h5 class="cost text-h5">
          From $${new Intl.NumberFormat().format(price.textContent)} /night
          </h5>`
              : ""
          }
          </div>
          <a
          href="${mainCta ? mainCta.getAttribute("href") : "#"}"
          class="chevron-right icon-black cta-link"
          >
          <span class="animate-underline">
            ${mainCta ? mainCta.textContent : "Book Now"}
          </span>
          </a>
        </div>
        <div class="second-row">
          <p class="text-l2 label">
          ${secondRowTitle ? secondRowTitle.textContent : ""}
          </p>
          <ul class="text-p2 details">
          ${secondRowDetails ? secondRowDetails.innerHTML : ""}
          </ul>
          <button class="cta-link floorplan animate-underline" data-floorplan-link="${
            floorplanLink ? floorplanLink.getAttribute("href") : ""
          }">
          ${placeholders.floorplanButtonText || "VIEW FLOORPLAN"}
          </button>
        </div>
        <div class="third-row">
          <p class="text-l2 label">
          ${thirdRowTitle ? thirdRowTitle.textContent : ""}
          </p>
          <ul class="text-p2 details">
          ${thirdRowDetails ? thirdRowDetails.innerHTML : ""}
          </ul>
              ${
                thirdRowCta
                  ? `<a
          href="${thirdRowCta.getAttribute("href")}"
          class="chevron-right icon-black cta-link"
          >
          <span class="animate-underline">
            ${thirdRowCta.textContent}
          </span>
          </a>`
                  : ""
              }
        </div>
        </div>
      </div>
    `;
  });

  // Clear block and render columns with dropdowns
  block.innerHTML = "";
  for (const [colIndex, _] of cards.slice(0, 3).entries()) {
    const column = document.createElement("div");
    column.className = "compare-rooms-column";

    // Use helper for dropdown
    const cardContainer = document.createElement("div");
    cardContainer.className = "card-container";
    cardContainer.innerHTML = cardHTMLs[colIndex];
    cardContainer.style.transition = "opacity 0.4s cubic-bezier(0.4,0,0.2,1)";
    cardContainer.style.opacity = "1";

    const dropdown = createCustomDropdown({
      options: cardTitles,
      selectedIndex: colIndex,
      dropdownName: `room-dropdown-${colIndex}`,
      onSelect: (selectedIdx) => {
        cardContainer.style.opacity = "0";
        setTimeout(() => {
          cardContainer.innerHTML = cardHTMLs[selectedIdx];
          cardContainer.style.opacity = "1";
          attachFloorplanModal(cardContainer, placeholders);
          // attachRemoveCard(cardContainer, dropdown, colIndex);
        }, 400);
      },
    });

    column.appendChild(dropdown);
    column.appendChild(cardContainer);
    block.appendChild(column);
    attachFloorplanModal(cardContainer, placeholders);
    // attachRemoveCard(cardContainer, dropdown, colIndex);
  }

  // Track which card index is displayed in each column
  let displayedIndices = [0, 1, 2];

  function renderAllColumns() {
    block.innerHTML = "";
    for (const [colIndex, _] of cards.slice(0, 3).entries()) {
      const column = document.createElement("div");
      column.className = "compare-rooms-column";

      // Use helper for dropdown
      const cardContainer = document.createElement("div");
      cardContainer.className = "card-container";
      cardContainer.innerHTML = cardHTMLs[displayedIndices[colIndex]];
      cardContainer.style.transition = "opacity 0.4s cubic-bezier(0.4,0,0.2,1)";
      cardContainer.style.opacity = "0";

      // Array of all currently displayed card indices
      const displayed = displayedIndices.filter((idx) => idx !== -1);

      const dropdown = createCustomDropdown({
        options: cardTitles,
        selectedIndex: displayedIndices[colIndex],
        dropdownName: `room-dropdown-${colIndex}`,
        onSelect: (selectedIdx) => {
          // If selected card is already displayed in another column, swap
          const swapCol = displayedIndices.findIndex(
            (idx, i) => idx === selectedIdx && i !== colIndex
          );
          if (swapCol !== -1) {
            // Fade out both columns
            const thisCard =
              block.children[colIndex]?.querySelector(".card-container");
            const otherCard =
              block.children[swapCol]?.querySelector(".card-container");
            if (thisCard) thisCard.style.opacity = "0";
            if (otherCard) otherCard.style.opacity = "0";
            setTimeout(() => {
              [displayedIndices[colIndex], displayedIndices[swapCol]] = [
                displayedIndices[swapCol],
                displayedIndices[colIndex],
              ];
              // Only update the two swapped columns
              updateColumn(colIndex);
              updateColumn(swapCol);
            }, 400);
            return;
          }
          if (displayedIndices.includes(selectedIdx)) return;
          const cardContainer =
            block.children[colIndex]?.querySelector(".card-container");
          if (cardContainer) cardContainer.style.opacity = "0";
          setTimeout(() => {
            displayedIndices[colIndex] = selectedIdx;
            updateColumn(colIndex);
          }, 400);
        },
        customRadioState: (i) => {
          const isDisplayed =
            displayed.includes(i) && displayedIndices[colIndex] !== i;
          return {
            checked: displayedIndices[colIndex] === i,
            disabled: isDisplayed,
            labelClass: isDisplayed ? "dropdown-option-disabled" : "",
          };
        },
      });

      column.appendChild(dropdown);
      column.appendChild(cardContainer);
      block.appendChild(column);
      attachFloorplanModal(cardContainer, placeholders);
    }
    // Fade in all card containers after DOM update
    requestAnimationFrame(() => {
      for (const el of block.querySelectorAll(".card-container")) {
        el.style.opacity = "1";
      }
    });
  }

  // Update only a single column (for fade in)
  function updateColumn(colIndex) {
    const column = block.children[colIndex];
    if (!column) return;
    const cardContainer = column.querySelector(".card-container");
    cardContainer.innerHTML = cardHTMLs[displayedIndices[colIndex]];
    cardContainer.style.transition = "opacity 0.4s cubic-bezier(0.4,0,0.2,1)";
    cardContainer.style.opacity = "0";
    const displayed = displayedIndices.filter((idx) => idx !== -1);
    const newDropdown = createCustomDropdown({
      options: cardTitles,
      selectedIndex: displayedIndices[colIndex],
      dropdownName: `room-dropdown-${colIndex}`,
      onSelect: (selectedIdx) => {
        const swapCol = displayedIndices.findIndex(
          (idx, i) => idx === selectedIdx && i !== colIndex
        );
        if (swapCol !== -1) {
          const thisCard =
            block.children[colIndex]?.querySelector(".card-container");
          const otherCard =
            block.children[swapCol]?.querySelector(".card-container");
          if (thisCard) thisCard.style.opacity = "0";
          if (otherCard) otherCard.style.opacity = "0";
          setTimeout(() => {
            [displayedIndices[colIndex], displayedIndices[swapCol]] = [
              displayedIndices[swapCol],
              displayedIndices[colIndex],
            ];
            updateColumn(colIndex);
            updateColumn(swapCol);
          }, 400);
          return;
        }
        if (displayedIndices.includes(selectedIdx)) return;
        const cardContainer =
          block.children[colIndex]?.querySelector(".card-container");
        if (cardContainer) cardContainer.style.opacity = "0";
        setTimeout(() => {
          displayedIndices[colIndex] = selectedIdx;
          updateColumn(colIndex);
        }, 400);
      },
      customRadioState: (i) => {
        const isDisplayed =
          displayed.includes(i) && displayedIndices[colIndex] !== i;
        return {
          checked: displayedIndices[colIndex] === i,
          disabled: isDisplayed,
          labelClass: isDisplayed ? "dropdown-option-disabled" : "",
        };
      },
    });
    const oldDropdown = column.querySelector(".pill-dropdown-wrapper");
    if (oldDropdown) oldDropdown.replaceWith(newDropdown);
    attachFloorplanModal(cardContainer, placeholders);
    requestAnimationFrame(() => {
      cardContainer.style.opacity = "1";
    });
  }
  renderAllColumns();
}

function attachFloorplanModal(container, placeholders) {
  // Remove any previous listeners to avoid duplicates
  const floorplanBtns = container.querySelectorAll(".floorplan");
  for (const btn of floorplanBtns) {
    btn.removeEventListener("click", btn._floorplanHandler);
    btn._floorplanHandler = function (e) {
      const link = btn.dataset.floorplanLink;
      if (!link) return;
      e.preventDefault();
      showFloorplanModal(link, placeholders);
    };
    btn.addEventListener("click", btn._floorplanHandler);
  }
}

function showFloorplanModal(src, placeholders) {
  // Create overlay
  const overlay = document.createElement("div");
  overlay.className = "floorplan-modal-overlay";

  // Create modal
  const modal = document.createElement("div");
  modal.className = "floorplan-modal";

  // Close button
  const closeBtn = document.createElement("button");
  closeBtn.className = "floorplan-modal-close text-b close-icon icon-left";
  closeBtn.textContent = placeholders?.globalClose || "CLOSE";

  // Iframe
  const iframe = document.createElement("iframe");
  iframe.src = src;
  iframe.setAttribute("allowfullscreen", "");

  modal.appendChild(closeBtn);
  modal.appendChild(iframe);
  overlay.appendChild(modal);
  document.body.appendChild(overlay);

  // Fade in
  requestAnimationFrame(() => {
    overlay.style.opacity = "1";
    modal.style.opacity = "1";
    modal.style.transform = "scale(1)";
  });

  // Close logic
  function closeModal() {
    overlay.style.opacity = "0";
    modal.style.opacity = "0";
    modal.style.transform = "scale(0.98)";
    setTimeout(() => {
      if (overlay.parentNode) overlay.parentNode.removeChild(overlay);
    }, 400);
  }
  closeBtn.addEventListener("click", closeModal);
  overlay.addEventListener("mousedown", (e) => {
    if (e.target === overlay) closeModal();
  });
  // ESC key
  document.addEventListener("keydown", function escHandler(e) {
    if (e.key === "Escape") {
      closeModal();
      document.removeEventListener("keydown", escHandler);
    }
  });
}
