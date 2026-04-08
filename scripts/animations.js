// animations.js
// Global animation utilities for all components
// Import GSAP and plugins as needed

/**
 * Initializes GSAP SplitText/ScrollTrigger animations for headings using custom osmo-ease and responsive matchMedia.
 */
export function initTextSplitAnimation() {
  if (
    !window.gsap ||
    !window.ScrollTrigger ||
    !window.SplitText ||
    !window.CustomEase
  )
    return;
  // Register the GSAP plugins
  gsap.registerPlugin(SplitText, ScrollTrigger, CustomEase);

  // Create the custom ease function from the original Pen
  CustomEase.create("osmo-ease", "0.625, 0.05, 0, 1");

  // Use ScrollTrigger.matchMedia() to create responsive animations.
  ScrollTrigger.matchMedia({
    "(min-width: 1px)": function () {
      const headings = document.querySelectorAll(".split-text");
      headings.forEach((heading) => {
        // Split the text for the current heading. Because this is inside matchMedia, it will be re-done on resize.
        const split = SplitText.create(heading, {
          type: "lines",
          mask: "lines",
          linesClass: "line",
        });
        // Set the initial hidden state for the lines.
        gsap.set(split.lines, { yPercent: 110 });
        // Create a unique ScrollTrigger for each heading.
        ScrollTrigger.create({
          trigger: heading,
          start: "top 85%",
          onEnter: () => {
            gsap.to(split.lines, {
              yPercent: 0,
              duration: 0.8,
              stagger: 0.08,
              ease: "osmo-ease",
            });
          },
          // onLeaveBack: () => {
          //   gsap.to(split.lines, {
          //     yPercent: 110,
          //     duration: 0.8,
          //     stagger: 0.08,
          //     ease: "osmo-ease",
          //   });
          // },
        });
      });
      // Return a cleanup function. GSAP will call this when the media query no longer matches (or before re-running the setup).
      return () => {
        // Revert all SplitText instances to avoid issues.
        const allSplits = SplitText.getAll();
        allSplits.forEach((split) => split.revert());
      };
    },
  });
}

/**
 * Animates children of elements with .animate-stagger class to fade in and up one by one on scroll into view.
 */
export function initStaggerAnimations() {
  if (!window.gsap || !window.ScrollTrigger) return;
  gsap.registerPlugin(ScrollTrigger);
  const staggerParents = document.querySelectorAll(".animate-stagger");
  staggerParents.forEach((parent) => {
    const children = Array.from(parent.children);

    gsap.set(children, { opacity: 0, y: 50 });
    ScrollTrigger.create({
      trigger: parent,
      start: "top 80%",
      once: true,
      onEnter: () => {
        gsap.to(children, {
          opacity: 1,
          y: 0,
          duration: 2,
          ease: "power3.out",
          stagger: 0.3,
        });
      },
    });
  });
}

// Smooth scrolling with Lenis
// const lenis = new Lenis({
//   autoRaf: true,
// });

export function parallaxSection(section) {
  const speed = 0.2; // Parallax speed
  const offsetTop = 0; // px or string, e.g. "100px"
  const zIndex = 1; // z-index value

  if (section) {
    section.style.zIndex = zIndex;
    section.style.top =
      typeof offsetTop === "number" ? offsetTop + "px" : offsetTop;
    section.style.position = "sticky";
    section.style.height = "100vh";

    gsap.registerPlugin(ScrollTrigger);
    gsap.to(section, {
      y: () => window.innerHeight * speed,
      ease: "none",
      scrollTrigger: {
        trigger: section,
        start: "top top",
        end: "bottom top",
        scrub: true,
      },
    });
  }
}

/**
 * Animates the children of a given parent element to fade in and move up one by one.
 * @param {HTMLElement} parent - The parent element whose children will be animated.
 * @param {Object} options - Optional GSAP animation options.
 */
export function animateChildrenTextSplitStagger(parent, options = {}) {
  if (!window.gsap || !window.SplitText || !window.CustomEase) return;

  gsap.registerPlugin(SplitText, CustomEase);
  CustomEase.create("osmo-ease", "0.625, 0.05, 0, 1");

  // Revert any previous splits on this parent and its children
  Array.from(parent.children).forEach((child) => {
    if (child._gsSplit) {
      child._gsSplit.revert();
      delete child._gsSplit;
    }
  });

  const children = Array.from(parent.children);

  // Store split instances for each child and keep a reference for cleanup
  const splits = children.map((child) => {
    const split = SplitText.create(child, {
      type: "lines",
      mask: "lines",
      linesClass: "line",
    });
    child._gsSplit = split;
    gsap.set(split.lines, { yPercent: 110 });
    return split;
  });

  // Animate all lines of all children in a staggered sequence
  const allLines = splits.flatMap((split) => split.lines);

  gsap.to(allLines, {
    yPercent: 0,
    duration: 0.6,
    stagger: 0.1,
    ease: "cubic-bezier(0.4, 0, 0.2, 1)",
    ...options,
  });

  gsap.to(allLines, {
    yPercent: 0,
    duration: 0.6,
    stagger: 0.1,
    ease: "cubic-bezier(0.4, 0, 0.2, 1)",

    ...options,
    onComplete: () => {
      splits.forEach((split) => {
        split.lines.forEach((line) => {
          const mask = line.parentElement;
          if (mask && mask.classList.contains("line-mask")) {
            mask.style.overflow = "";
            mask.style.clipPath = "";
          }
        });
      });
    },
  });
}
