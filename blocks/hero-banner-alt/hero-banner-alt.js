const BLOCK_CLASS_NAME = "hero-banner-alt";

export default async function decorate(block) {
  const getElements = (selectors) =>
    Object.fromEntries(
      selectors.map(({ key, sel }) => [key, block.querySelectorAll(sel)])
    );

  const selectors = [
    {
      key: "upperHeroText",
      sel: `.${BLOCK_CLASS_NAME} > div:nth-child(1) > div > p`,
    },
    {
      key: "lowerHeroText",
      sel: `.${BLOCK_CLASS_NAME} > div:nth-child(2) > div > p`,
    },
    {
      key: "description",
      sel: `.${BLOCK_CLASS_NAME} > div:nth-child(3) > div > p`,
    },
    {
      key: "firstCtaText",
      sel: `.${BLOCK_CLASS_NAME} > div:nth-child(4) > div > p`,
    },
    {
      key: "firstCtaUrl",
      sel: `.${BLOCK_CLASS_NAME} > div:nth-child(5) > div > p`,
    },
    {
      key: "secondCtaText",
      sel: `.${BLOCK_CLASS_NAME} > div:nth-child(6) > div > p`,
    },
    {
      key: "secondCtaUrl",
      sel: `.${BLOCK_CLASS_NAME} > div:nth-child(7) > div > p`,
    },
  ];

  const elements = getElements(selectors);
  const {
    upperHeroText,
    lowerHeroText,
    description,
    firstCtaText,
    firstCtaUrl,
    secondCtaText,
    secondCtaUrl,
  } = elements;

  /* -------------------------- Styling the elements -------------------------- */
  let heroH1 = document.createElement("h1");
  heroH1.classList.add("text-t1");
  if (upperHeroText[0]) {
    const upperSpan = document.createElement("span");
    upperSpan.textContent = upperHeroText[0].textContent;
    upperSpan.className = "upper-hero-text";
    heroH1.appendChild(upperSpan);
    upperHeroText[0].remove();
  }
  if (lowerHeroText[0]) {
    const lowerSpan = document.createElement("span");
    lowerSpan.textContent = lowerHeroText[0].textContent;
    lowerSpan.className = "lower-hero-text";
    heroH1.appendChild(lowerSpan);
    lowerHeroText[0].remove();
  }
  description[0]?.classList.add("text-p1", "split-text");

  let firstAnchor, secondAnchor;

  if (firstCtaText[0] && firstCtaUrl[0]) {
    firstAnchor = document.createElement("a");
    firstAnchor.href = firstCtaUrl[0].textContent.trim();
    firstAnchor.textContent = firstCtaText[0].textContent.trim();
    firstAnchor.classList.add(
      "cta-link",
      "animate-underline",
      "split-text",
      "chevron-right",
      "icon-black"
    );
    firstCtaText[0].replaceWith(firstAnchor);
    firstCtaUrl[0].style.display = "none";
  }

  if (secondCtaText[0] && secondCtaUrl[0]) {
    secondAnchor = document.createElement("a");
    secondAnchor.href = secondCtaUrl[0].textContent.trim();
    secondAnchor.classList.add("cta-link", "split-text", "animate-underline");

    const span = document.createElement("span");
    span.textContent = secondCtaText[0].textContent.trim();

    secondAnchor.appendChild(span);
    secondCtaText[0].replaceWith(secondAnchor);
    secondCtaUrl[0].style.display = "none";
  }

  /* -------------------------- Structuring the block ------------------------- */
  const section = document.createElement("section");
  section.className = "content-wrapper";

  const heroTextDiv = document.createElement("div");
  heroTextDiv.className = "hero-text";

  // Add single h1 with two spans
  heroTextDiv.appendChild(heroH1);

  // Description
  const descriptionDiv = document.createElement("div");
  descriptionDiv.className = "description";
  if (description[0]) {
    descriptionDiv.appendChild(description[0]);
  }

  // CTA buttons
  const ctaButtonsDiv = document.createElement("div");
  ctaButtonsDiv.className = "cta-buttons";

  if (firstCtaText[0] && firstCtaUrl[0]) {
    const firstCtaDiv = document.createElement("div");
    firstCtaDiv.className = "first-cta";
    if (firstCtaText[0]) {
      firstCtaDiv.appendChild(firstAnchor);
    }
    ctaButtonsDiv.appendChild(firstCtaDiv);
  }

  if (secondCtaText[0] && secondCtaUrl[0]) {
    const secondCtaDiv = document.createElement("div");
    secondCtaDiv.className = "second-cta";
    if (secondCtaText[0]) {
      secondCtaDiv.appendChild(secondAnchor);
    }
    ctaButtonsDiv.appendChild(secondCtaDiv);
  }

  // Assemble section
  section.appendChild(heroTextDiv);
  section.appendChild(descriptionDiv);
  section.appendChild(ctaButtonsDiv);

  // Replace block content
  block.innerHTML = "";
  block.appendChild(section);

  /* ------------------------------ Add animation ----------------------------- */
  if (window.gsap) {
    gsap.fromTo(
      section.querySelector(".upper-hero-text"),
      { x: "-5%", opacity: 0 },
      { x: 0, opacity: 1, duration: 1.5, ease: "power2.out" }
    );
    gsap.fromTo(
      section.querySelector(".lower-hero-text"),
      { x: "5%", opacity: 0 },
      { x: 0, opacity: 1, duration: 1.5, ease: "power2.out" }
    );
  }
}
