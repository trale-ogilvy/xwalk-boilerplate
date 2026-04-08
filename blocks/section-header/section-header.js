/**
 * Decorates the section-header block with semantic structure and classes.
 * @param {Element} block
 */
export default function decorate(block) {
  if (!block || block.children.length < 5) return;

  const [labelDiv, titleDiv, descDiv, ctaTextDiv, ctaLinkDiv] = block.children;
  const label = labelDiv?.querySelector("p");
  const title = titleDiv;
  const description = descDiv;
  const ctaText = ctaTextDiv?.querySelector("p");
  const ctaLink = ctaLinkDiv?.querySelector("a");
  const container = document.createElement("div");

  if (title) {
    const ps = Array.from(title.querySelectorAll("p"));
    if (ps.length > 1) {
      const combinedHTML = ps.map((p) => p.innerHTML).join("<br>");
      ps.forEach((p) => p.remove());
      const paragraph = document.createElement("h2");
      paragraph.className = "text-h1 split-text title";
      paragraph.innerHTML = combinedHTML;
      title.appendChild(paragraph);
    } else if (ps.length === 1) {
      ps[0].className = "text-h1 split-text title";
    } else {
      const h2p = Array.from(title.querySelectorAll("h2"));
      if (h2p.length > 0) {
        h2p.forEach((h2) => {
          h2.className = "text-h1 split-text title";
        });
      }
    }
  }

  if (description) {
    const ps = Array.from(description.querySelectorAll("p"));
    if (ps.length > 1) {
      // Add event listener for window resize to remove <br> on mobile
      const handleResize = () => {
        const isMobile = window.innerWidth <= 480;
        const descParagraph = description.querySelector(
          "p.text-p1.split-text.desc"
        );
        if (descParagraph) {
          if (isMobile) {
            descParagraph.innerHTML = descParagraph.innerHTML.replace(
              /<br\s*\/?>/gi,
              " "
            );
          } else {
            descParagraph.innerHTML = combinedHTML;
          }
        }
      };
      window.addEventListener("resize", handleResize);
      setTimeout(handleResize, 0);
      const combinedHTML = ps.map((p) => p.innerHTML).join("<br>");
      ps.forEach((p) => p.remove());
      const paragraph = document.createElement("p");
      paragraph.className = "text-p1 split-text desc";
      paragraph.innerHTML = combinedHTML;
      description.appendChild(paragraph);
    } else if (ps.length === 1) {
      ps[0].className = "text-p1 split-text desc";
    }
  }

  if (label) label.className = "text-l2 split-text label";

  // Replace CTA text with anchor if both exist
  if (ctaText && ctaLink) {
    const anchor = document.createElement("a");
    anchor.className = "cta-link animate-underline split-text";
    anchor.textContent = ctaText.textContent;
    anchor.href = ctaLink.textContent;
    ctaText.replaceWith(anchor);
    ctaText.href = anchor.href;
    ctaLink.style.display = "none";
  }
  container.append(labelDiv, titleDiv, descDiv, ctaTextDiv);

  block.innerHTML = "";
  block.appendChild(container);
}
