import { createOptimizedPicture } from "../../scripts/aem.js";

/**
 * Processes the primary section data and formats it properly
 * @param {HTMLElement} primarySection The primary section element
 * @returns {string} Formatted HTML string
 */
export function processPrimarySection(primarySection) {
  let contactHTML = "";
  let primaryColumns = [];

  // First, check for default-content-wrapper (contains H3 and potential P/button pairs)
  const defaultContentWrapper = primarySection.querySelector(
    ".default-content-wrapper"
  );
  if (defaultContentWrapper) {
    const children = Array.from(defaultContentWrapper.children);

    for (let i = 0; i < children.length; i++) {
      const el = children[i];

      // If it's an <h3>, make it its own column
      if (el.tagName === "H3") {
        // First, wrap and add any accumulated primary columns
        if (primaryColumns.length > 0) {
          contactHTML += `<div class="footer-primary-container">${primaryColumns.join(
            ""
          )}</div>`;
          primaryColumns = [];
        }

        contactHTML += `
          <div class="column-heading">
            <h3 class="footer-heading text-h3">${el.textContent.trim()}</h3>
          </div>`;
        continue;
      }

      // Process as heading + one or more button-container(s) after a <p>
      if (
        el.tagName === "P" &&
        children[i + 1] &&
        children[i + 1].classList.contains("button-container")
      ) {
        const heading = el;
        const headingText = heading.textContent.trim();
        let links = [];
        let j = i + 1;

        // Collect all consecutive button-containers after the heading
        while (
          children[j] &&
          children[j].classList.contains("button-container")
        ) {
          const link = children[j].querySelector("a");
          if (link) {
            const href = link.getAttribute("href");
            let linkText = link.textContent.trim();

            // Format email addresses for desktop (break after @)
            let desktopLinkText = linkText;
            if (
              typeof window !== "undefined" &&
              window.innerWidth >= 768 &&
              href &&
              href.startsWith("mailto:") &&
              linkText.includes("@")
            ) {
              const [localPart, domainPart] = linkText.split("@");
              desktopLinkText = `${localPart}<br>@${domainPart}`;
            }

            links.push(`
              <a href="${href}">
                <p class="footer-link animate-underline text-p2">${desktopLinkText}</p>
              </a>
            `);
          }
          j++;
        }

        primaryColumns.push(`
          <div class="footer-primary-column">
            <p class="footer-heading text-l3 text-text-black-700">${headingText}</p>
            ${links.join("")}
          </div>
        `);

        i = j - 1; // Skip processed elements
      }
    }

    // Add any remaining primary columns
    if (primaryColumns.length > 0) {
      contactHTML += `<div class="footer-primary-container">${primaryColumns.join(
        ""
      )}</div>`;
    }
  }

  // Then, check for cards-wrapper
  const cardsWrapper = primarySection.querySelector(".cards-wrapper");
  if (cardsWrapper) {
    const cardsBlock = cardsWrapper.querySelector(".cards");
    if (cardsBlock) {
      const cardItems = cardsBlock.querySelectorAll("li");

      // Start cards container
      let cardsHTML = '<div class="footer-cards-container">';

      // Process each card
      cardItems.forEach((card) => {
        const cardImage = card.querySelector(".cards-card-image");
        const cardBodies = card.querySelectorAll(".cards-card-body");

        if (cardBodies.length >= 1) {
          const titleElement = cardBodies[0].querySelector("p");
          const linkElement = cardBodies[1]
            ? cardBodies[1].querySelector("a")
            : null;

          if (titleElement) {
            const title = titleElement.textContent.trim();
            let cardContent = "";

            // Add image if present
            if (cardImage) {
              const img = cardImage.children[0];
              console.log(img);
              if (img) {
                // Check if it's already a picture element (AEM optimized)
                if (img.tagName === 'PICTURE') {
                  // Extract the base image URL from the existing picture element
                  const imgElement = img.querySelector('img');
                  if (imgElement && imgElement.src) {
                    // Create additional optimization with 660px width on top of existing AEM optimization
                    const additionalOptimizedPicture = createOptimizedPicture(
                      imgElement.src.split('?')[0], // Remove existing query params
                      imgElement.alt || "",
                      false, // not eager loading
                      [
                        { media: "(min-width: 600px)", width: "500" },
                        { width: "300" }
                      ]
                    );
                    cardContent += `
                      <div class="footer-card-image">
                        ${additionalOptimizedPicture.outerHTML}
                      </div>`;
                  } else {
                    // Fallback to original if no img found inside picture
                    cardContent += `
                      <div class="footer-card-image">
                        ${img.outerHTML}
                      </div>`;
                  }
                } else if (img.src) {
                  // If it's a regular img element, optimize it
                  const optimizedPicture = createOptimizedPicture(
                    img.src,
                    img.alt || "",
                    false,
                    [
                      { media: "(min-width: 600px)", width: "500" },
                      { width: "300" }
                    ]
                  );
                  cardContent += `
                    <div class="footer-card-image">
                      ${optimizedPicture.outerHTML}
                    </div>`;
                }
              }
            }

            // Check if card has a link
            if (linkElement) {
              // Card is clickable
              const href = linkElement.getAttribute("href");
              cardContent += `<p class="footer-heading text-p2">${title}</p>`;

              cardsHTML += `
                <div class="footer-primary-column footer-card-column">
                  <a href="${href}" class="footer-card-link">
                    ${cardContent}
                  </a>
                </div>`;
            } else {
              // Card is not clickable, grey out text
              cardContent += `<p class="footer-heading text-p2">${title}</p>`;

              cardsHTML += `
                <div class="footer-primary-column footer-card-column footer-card-disabled">
                  ${cardContent}
                </div>`;
            }
          }
        }
      });

      // Close cards container
      cardsHTML += "</div>";

      // Add cards to contact HTML
      contactHTML += cardsHTML;
    }
  }

  return contactHTML;
}

/**
 * Processes the secondary section data and formats it into columns for the footer
 * @param {HTMLElement} secondaryWrapper The secondary section wrapper
 * @returns {string} Formatted HTML string for all columns
 */
export function processFooterSecondarySection(secondaryWrapper) {
  const children = Array.from(secondaryWrapper.children);
  const columns = [];
  let currentHeading = null;
  let currentLinks = [];

  // Helper to push a column if valid
  function pushColumn() {
    if (currentHeading && currentLinks.length) {
      columns.push({ heading: currentHeading, links: currentLinks });
    }
    currentHeading = null;
    currentLinks = [];
  }

  for (let i = 0; i < children.length; i++) {
    const el = children[i];

    // If it's an <h3>, make it its own column
    if (el.tagName === "H3") {
      pushColumn(); // Push any existing column first
      columns.push({ heading: el.textContent.trim(), links: [], isH3: true });
      continue;
    }

    if (el.tagName === "P" && !el.classList.contains("button-container")) {
      // New heading found
      pushColumn();
      currentHeading = el.textContent.trim();
    } else if (el.classList.contains("button-container")) {
      const link = el.querySelector("a");
      if (link && link.textContent.trim()) {
        currentLinks.push({
          href: link.getAttribute("href"),
          text: link.textContent.trim(),
        });
      }
    }
  }
  pushColumn(); // Push last column

  // Now build the HTML for each column
  let result = "";
  let regularColumns = [];

  columns.forEach(({ heading, links, isH3 }) => {
    // If it's an H3, add it directly and flush any accumulated regular columns
    if (isH3) {
      // First, wrap and add any accumulated regular columns
      if (regularColumns.length > 0) {
        result += `<div class="footer-secondary-container">${regularColumns.join(
          ""
        )}</div>`;
        regularColumns = [];
      }

      // Add the heading column
      result += `
        <div class="column-heading">
          <h3 class="footer-heading text-h3">${heading}</h3>
        </div>`;
    } else {
      // Accumulate regular columns
      const desktopLinks = links
        .map(
          (l) =>
            `<a href="${l.href}"><p class="footer-link animate-underline text-p2">${l.text}</p></a>`
        )
        .join("");
      const mobileLinks = links
        .map(
          (l) =>
            `<a href="${l.href}"><p class="footer-link text-p2">${l.text}</p></a>`
        )
        .join("");

      regularColumns.push(`
        <div class="footer-secondary-column">
          <div class="footer-desktop-links">
            <p class="footer-heading-subtle text-l3 text-text-black-700">${heading}</p>
            ${desktopLinks}
          </div>
          <div class="footer-mobile-accordion">
            <button class="accordion-trigger" aria-expanded="false"><p class="text-text-black-700 text-l3">${heading}</p><svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#666666" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"></path><path d="M12 5v14"></path></svg></button>
            <div class="accordion-content" hidden>
              <div class="accordion-inner">
                ${mobileLinks}
              </div>
            </div>
          </div>
        </div>
      `);
    }
  });

  // Add any remaining regular columns
  if (regularColumns.length > 0) {
    result += `<div class="footer-secondary-container">${regularColumns.join(
      ""
    )}</div>`;
  }

  return result;
}

/**
 * Processes the legal links section and formats it for the footer
 * @param {HTMLElement} legalsWrapper The legal links section wrapper
 * @returns {string} Formatted HTML string for legal links
 */
export function processFooterLegalLinksSection(legalsWrapper) {
  const legals = legalsWrapper[legalsWrapper.length - 1];
  const logoWithLink = Array.from(legalsWrapper).slice(0, -1);
  const logoWithLinkHTML = logoWithLink
    .map((el) => {
      const picture = el.querySelector("picture");
      const link = el.querySelector("a");
      if (link && picture) {
        return `<div class="footer-logo-wrapper"><a href="${link.getAttribute(
          "href"
        )}" target="_blank">${picture.outerHTML}</a></div>`;
      }
      if (picture) {
        return `<div class="footer-logo-wrapper">${picture.outerHTML}</div>`;
      }
      return "";
    })
    .join("");

  const legalsLinks = Array.from(legals.children)
    .map((el) => {
      if (el.classList.contains("button-container")) {
        const link = el.querySelector("a");
        if (!link || !link.textContent.trim()) return "";
        const href = link.getAttribute("href");
        const text = link.textContent.trim();
        const linkClass = href === "/cookie" ? 'class="cookieLink"' : "";
        return `<a href="${href}" ${linkClass}><p class="footer-link-subtle text-l2 animate-underline text-text-grey">${text}</p></a>`;
      }
      return "";
    })
    .join("");

  return (
    (logoWithLinkHTML
      ? `<div class="footer-logo-container">${logoWithLinkHTML}</div>`
      : "") + legalsLinks
  );
}

/**
 * Processes the socials section and formats it for the footer
 * @param {HTMLElement} socialsWrapper The socials section wrapper
 * @returns {string} Formatted HTML string for social icons
 */
export function processFooterSocialsSection(socialsWrapper) {
  const children = Array.from(socialsWrapper.children);
  return children
    .map((el) => {
      if (el.classList.contains("button-container")) {
        const link = el.querySelector("a");
        const title = link.getAttribute("title").toLocaleLowerCase();
        if (link && link.textContent.trim()) {
          const href = link.getAttribute("href");
          let html = "";
          if (
            title === "facebook" ||
            title === "linkedin" ||
            title === "instagram" ||
            title === "wechat"
          ) {
            html = `<img src="/icons/${
              title === "wechat" ? title + "-grey" : title
            }.svg" alt="${title}" />`;
            return `<a href="${href}" rel="noopener noreferrer">${html}</a>`;
          } else {
            html = `${link.textContent.trim()}<div class="exit-icon"></div>`;
            return `<a href="${href}" rel="noopener noreferrer">${html}</a>`;
          }
        }
      }
      return "";
    })
    .join("");
}
/**
 * Decorates the footer.
 * @param {HTMLElement} block The footer block element.
 */
export default async function decorate(block) {
  const navMeta = getMetadata("footer");
  const navPath = navMeta ? new URL(navMeta).pathname : "/osaka/footer";
  const fragment = await loadFragment(navPath);
  const sections = fragment.children;
  const [
    contactSection,
    linksSection,
    copyrightSection,
    socialsSection,
    legalsSection,
  ] = sections;

  block.textContent = ""; // Clear existing content

  // Process contact section data
  const processedContactHTML = processContactSection(
    contactSection.children[0]
  );
  // Process links section data
  const processedLinksHTML = processFooterSecondarySection(
    linksSection.children[0]
  );
  // Process legal links section data
  const processedLegalLinksHTML = processFooterLegalLinksSection(
    legalsSection.children[0]
  );
  // Process social icons section data
  const processedSocialsHTML = processFooterSocialsSection(
    socialsSection.children[0]
  );

  const footerHTML = `
    <div class="footer-content">
      <section class="footer-section footer-contact">
        <div class="footer-contact-wrapper">
          ${processedContactHTML}
        </div>
      </section>

      <section class="footer-section footer-secondary">
        <div class="footer-secondary-wrapper">
          ${processedLinksHTML}
        </div>
      </section>

      <section class="footer-section footer-legal">
        <div class="footer-legal-top">
          <p class="footer-copyright text-l3 text-text-black-700">${copyrightSection.children[0].textContent.trim()}</p>
          <div class="footer-socials">
            ${processedSocialsHTML}
          </div>
        </div>
        <div class="footer-legal-bottom">
          <div class="footer-legal-links">
            ${processedLegalLinksHTML}
          </div>
               <div class="footer-socials-mobile">
            ${processedSocialsHTML}
          </div>
          <button class="footer-scroll-top" aria-label="Scroll to top">
            <img src="/icons/arrow-circular.svg" alt="Scroll to top" />
          </button>
        </div>
      </section>
    </div>
  `;

  block.innerHTML = footerHTML;

  // Add accordion functionality
  block.querySelectorAll(".accordion-trigger").forEach((button) => {
    button.addEventListener("click", () => toggleAccordion(button));
  });

  // Add scroll to top functionality
  block.querySelector(".footer-scroll-top").addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

export function handleAuthoringEnv() {
  const wrappers = document.querySelectorAll(".default-content-wrapper");
  [...wrappers].slice(0, 2).forEach((wrapper) => {
    let group = [];
    const richTextDiv = wrapper.children[0];
    const children = Array.from(richTextDiv.children);

    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      if (
        child.className === "" &&
        child.tagName === "P" &&
        child.textContent.trim() !== ""
      ) {
        child.classList.add("title");
        group = [child];
        // Collect subsequent button-containers
        let j = i + 1;
        while (
          j < children.length &&
          (children[j].classList.contains("button-container") ||
            children[j].tagName === "A")
        ) {
          group.push(children[j]);
          j++;
        }
        const div = document.createElement("div");
        div.classList.add("group");
        group.forEach((el) => div.appendChild(el));
        richTextDiv.appendChild(div);
        i = j - 1;
      }
    }
  });
}
