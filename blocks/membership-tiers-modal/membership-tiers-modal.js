import { formatRichText } from "../../scripts/utils.js";
import { isUniversalEditor } from "../../scripts/aem.js";

export default function decorate(block) {
  if (isUniversalEditor()) {
    return;
  }

  const rows = [...block.children];
  const mainContentRows = rows.slice(0, 2);
  const cardRows = rows.slice(2);

  const headerText = mainContentRows[0].textContent.trim();
  formatRichText(mainContentRows[1].children[0], "", "");

  // Extract all tiers and their data
  const tiers = cardRows.map((row) => {
    const items = [...row.children];
    return {
      picture: items[0],
      cardTier: items[1],
      benefitsAvailability: items[2],
      benefits: items[3],
    };
  });

  // Get all unique benefit labels across all tiers, and track label->raws for {} text
  const benefitMap = new Map(); // label -> Set of raw labels
  tiers.forEach((tier) => {
    const items = tier.benefits.querySelectorAll("li");
    items.forEach((li) => {
      const raw = li.textContent.trim();
      // Remove {text} for label
      const label = raw.replace(/\s*\{[^}]+\}/g, "").trim();
      if (!benefitMap.has(label)) benefitMap.set(label, new Set());
      benefitMap.get(label).add(raw);
    });
  });
  const benefitLabels = Array.from(benefitMap.keys());

  // Assign a color for each card (tier)
  const circleColors = ["#A2D3D4", "#9C856B", "#6E6E6E", "#333333"];

  // Build table header: first column is benefit, then one for each tier
  const tableHeader = `
    <tr>
      <th></th>
      ${tiers
        .map(
          (tier, idx) =>
            `<th>
              <div class="image-wrapper">${tier.picture.innerHTML}</div>
              <div class="card-desc">
                <p class="text-p1">${tier.cardTier.textContent.trim()}</p>
                <p class="text-l2">${tier.benefitsAvailability.textContent.trim()}</p>
              </div>
            </th>`
        )
        .join("")}
    </tr>
  `;

  // Build table body: each row is a unique benefit, first cell is label, then one cell per tier (circle or empty)
  const tableBody = benefitLabels
    .map((label) => {
      return `
        <tr>
          <td class="text-p2">${label}</td>
          ${tiers
            .map((tier, idx) => {
              // Find a benefit in this tier that matches the label (ignoring {text})
              const benefitItems = Array.from(
                tier.benefits.querySelectorAll("li")
              ).map((li) => li.textContent.trim());
              // Find the benefit for this label (may have {text})
              const match = benefitItems.find(
                (raw) => raw.replace(/\s*\{[^}]+\}/g, "").trim() === label
              );
              if (match) {
                // If match has {text}, extract and show it
                const curly = match.match(/\{([^}]+)\}/);
                if (curly) {
                  return `<td class="text-l2" >${curly[1]}</td>`;
                } else {
                  return `<td class="text-p2" style="text-align:center;vertical-align:middle;"><span class="membership-benefit-circle" style="display:inline-block;width:18px;height:18px;border-radius:50%;background:${
                    circleColors[idx % circleColors.length]
                  };"></span></td>`;
                }
              } else {
                return `<td class="text-p2"></td>`;
              }
            })
            .join("")}
        </tr>
      `;
    })
    .join("");

  // Mobile: render a stack of cards, each with its own benefit list
  const mobileStack = `
    <div class="membership-tiers-modal-mobile-stack">
      ${tiers
        .map((tier, idx) => {
          // Build benefit list for this card
          const benefitItems = Array.from(tier.benefits.querySelectorAll("li"));
          const benefitsText = Array.from(tier.benefits.querySelectorAll("p"));
          const benefitList = benefitItems
            .map((li) => {
              const raw = li.textContent.trim();
              const curly = raw.match(/\{([^}]+)\}/);
              if (curly) {
                return `<li class="text-p2">${raw.replace(
                  /\{([^}]+)\}/,
                  "$1"
                )}</li>`;
              }
              const label = raw.replace(/\s*\{[^}]+\}/g, "").trim();
              return `<li class="text-p2">${label}</li>`;
            })
            .join("");

          const benefitsTextList = benefitsText.map((p) => {
            return `<p class="text-p2 text-text-black">${p.innerHTML}</p>`;
          });
          return `
            <div class="membership-tiers-modal-mobile-card">
                <div class="image-wrapper">${tier.picture.innerHTML}</div>
                <div class="card-desc">
                  <h5 class="text-h5">${tier.cardTier.textContent.trim()}</h5>
                  <p class="text-l2">${tier.benefitsAvailability.textContent.trim()}</p>
                </div>
                <ul>${benefitList}</ul>
                <div class="benefits-notes">${benefitsTextList.join("")}</div>
              </div>
          `;
        })
        .join("")}
    </div>
  `;

  block.innerHTML = `
  <div class="container" data-lenis-prevent>
    <h2 class="text-h1">${headerText}</h2>
    <div class="membership-tiers-modal-table-wrapper">
      <table class="membership-tiers-modal-table">
        <thead>${tableHeader}</thead>
        <tbody>${tableBody}</tbody>
      </table>
    </div>
    ${mobileStack}
    <div class="footer">${mainContentRows[1].children[0].innerHTML.replace(
      /split-text/g,
      ""
    )}</div>

    </div>
  `;
}
