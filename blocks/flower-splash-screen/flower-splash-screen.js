import {
  formatRichText,
  getElements,
  getBasePathBasedOnEnv,
} from "../../scripts/utils.js";
import { isUniversalEditor, loadCSS } from "../../scripts/aem.js";

const BLOCK_CLASS_NAME = "flower-splash-screen";

export default function decorate(block) {
  if (isUniversalEditor()) {
    loadCSS(
      `${window.hlx.codeBasePath}/blocks/flower-splash-screen/flower-splash-screen-author.css`
    );
    return;
  }

  const selectors = [
    {
      key: "mainText",
      sel: `.${BLOCK_CLASS_NAME} > div:nth-child(1) > div`,
    },
  ];

  const elements = getElements(block, selectors);
  const { mainText } = elements;
  if (!mainText || !mainText[0]) return;

  formatRichText(mainText[0], "main-text", "text-t4");

  // Build the splash HTML using the block's content
  block.innerHTML = `<div
    id="banner-flower-root"
    class="flower-splash-container"
    style="visibility: hidden"
  >
    <div
      class="flower-splash-image-wrapper"
      id="banner-flower-image-wrapper"
    >
      <img
        id="banner-flower-image"
        class="flower-splash-image"
        src="${getBasePathBasedOnEnv()}/content/dam/patina/patina-hotels-brand/1-patina-brand-homepage/flower-mask-logo.svg"
        alt="Decorative Image"
        fetchpriority="high"
      />
    </div>
    <div id="banner-flower-bg" class="flower-splash-bg"></div>
    <div
      id="banner-flower-text-wrapper"
      class="flower-splash-text-wrapper"
    >
      <div class="flower-splash-text-inner">
          ${mainText[0].innerHTML.trim()}
      </div>
    </div>
  </div>`;

  (() => {
    // Only show splash if not already played this session
    if (localStorage.getItem("flowerSplashPlayed") === "true") {
      const root = document.getElementById("banner-flower-root");
      if (root) root.style.display = "none";
      return;
    }
    if (typeof gsap === "undefined" || typeof ScrollTrigger === "undefined")
      return;

    const root = document.getElementById("banner-flower-root");
    if (!root) return;

    const image = document.getElementById("banner-flower-image");
    const bg = document.getElementById("banner-flower-bg");
    const textWrapper = document.getElementById("banner-flower-text-wrapper");

    let isMobile = window.innerWidth <= 768;
    let imageLoaded = false;
    let animationTimeline = null;
    let isCleaningUp = false;

    const unlockScrollAndCleanup = () => {
      if (isCleaningUp) return;
      isCleaningUp = true;
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
      document.body.style.height = "";
      document.documentElement.style.height = "";
      document.body.style.pointerEvents = "";
      if (animationTimeline) {
        animationTimeline.kill();
        animationTimeline = null;
      }
      root.style.visibility = "hidden";
      isCleaningUp = false;
    };

    const startAnimation = () => {
      // Mark as played in localStorage
      localStorage.setItem("flowerSplashPlayed", "true");
      if (!imageLoaded) return;
      root.style.visibility = "visible";
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      document.body.style.height = "100vh";
      document.documentElement.style.height = "100vh";
      document.body.style.pointerEvents = "none";

      gsap.set([root, textWrapper, image], {
        visibility: "visible",
        willChange: "transform, opacity",
      });

      animationTimeline = gsap.timeline({
        onComplete: unlockScrollAndCleanup,
        onReverseComplete: unlockScrollAndCleanup,
        onInterrupt: unlockScrollAndCleanup,
      });
      animationTimeline.fromTo(
        root,
        { opacity: 0 },
        {
          opacity: 1,
          duration: 0.3,
          ease: "power2.out",
        }
      );
      animationTimeline
        .to(textWrapper, {
          opacity: 0,
          y: 0.01,
          duration: 1.5,
          height: "0px",
          transformOrigin: "bottom",
          delay: 2,
          ease: "power4.inOut",
        })
        .to(
          bg,
          {
            y: "-100%",
            duration: 1.5,
            ease: "power4.inOut",
          },
          "-=1.5"
        )
        .to(
          image,
          {
            top: "0%",
            backgroundColor: "rgba(255,255,255,0)",
            duration: 1.5,
            ease: "power4.inOut",
            transformOrigin: "center",
          },
          "-=1.5"
        )
        .to(image, {
          scale: isMobile ? 8 : 5,
          duration: isMobile ? 3 : 2.5,
          ease: "power3.out",
          transformOrigin: "center center",
          onStart: () => {
            document.documentElement.style.overflow = "";
            document.body.style.overflow = "";
            document.body.style.height = "";
            document.documentElement.style.height = "";
            document.body.style.pointerEvents = "";
          },
        })
        .to(
          image,
          {
            filter: "blur(5px)",
            duration: 1,
            ease: "sine.out",
            transformOrigin: "center center",
            overwrite: "auto",
            force3D: true,
          },
          isMobile ? "-=3" : "-=2"
        );
    };

    image.onload = () => {
      imageLoaded = true;
      startAnimation();
    };

    if (image.complete) {
      imageLoaded = true;
      startAnimation();
    }

    window.addEventListener("DOMContentLoaded", () => {
      if (image.complete && !imageLoaded) {
        imageLoaded = true;
        startAnimation();
      }
    });

    window.addEventListener("beforeunload", unlockScrollAndCleanup);
  })();
}
