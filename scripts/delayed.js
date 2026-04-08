import { disableScroll, fetchPlaceholders } from "./utils.js";
import { sampleRUM } from "./aem.js";

sampleRUM("cwv");

// Helper to create a text-image modal
export function createTextImageModal(block, modalContent, triggerText) {
  setTimeout(async () => {
    const trigger = Array.from(block.querySelectorAll("a")).find(
      (el) => el.getAttribute("href") === triggerText
    );

    if (!trigger) return;

    // Fetch placeholders
    let placeholders;
    try {
      placeholders = await fetchPlaceholders();
    } catch (error) {
      console.warn("Could not fetch placeholders, using default text:", error);
      placeholders = { globalClose: "CLOSE" };
    }

    // Create modal dialog
    const modalId = `text-image-modal-${Math.random()
      .toString(36)
      .substr(2, 9)}`;
    const dialog = document.createElement("dialog");
    dialog.className = "text-image-modal";
    dialog.id = modalId;

    // Modal content wrapper (text-image-modal-content)
    const contentDiv = document.createElement("div");
    contentDiv.className = "text-image-modal-content";

    // Extract image (first <picture> in modalContent)
    let imageEl = null;
    let textHeading = null;
    let textContent = document.createElement("div");
    const textWrapper = document.createElement("div");
    textWrapper.className = "text-image-modal-text-wrapper";
    textContent.className = "text-image-modal-text";

    // ADD: Make content div focusable for trackpad scrolling
    contentDiv.setAttribute("tabindex", "0");

    // Clone modalContent to avoid modifying the original
    const tempDiv = document.createElement("div");
    while (modalContent.firstChild) {
      tempDiv.appendChild(modalContent.firstChild);
    }

    // Find first <picture> (possibly wrapped in <p>)
    imageEl = tempDiv.querySelector("picture");
    let textImageImageDiv = document.createElement("div");
    textImageImageDiv.className = "text-image-modal-image";
    if (imageEl) {
      textImageImageDiv.appendChild(imageEl.cloneNode(true));
      // Remove the <picture> (and its parent <p> if present) from tempDiv
      const parentP = imageEl.closest("p");
      if (parentP && parentP.parentElement) {
        parentP.parentElement.removeChild(parentP);
      } else {
        imageEl.remove();
      }
    }

    // Find heading: <h2>, <strong>, or first text node
    let headingNode = tempDiv.querySelector("h2, strong");
    let ul = tempDiv.querySelector("ul");
    const a = tempDiv.querySelector("a");
    if (a) {
      a.classList.add("cta-link", "animate-underline");
    }
    if (ul) {
      ul.classList.add("text-p2");
    }
    if (headingNode) {
      textHeading = headingNode.cloneNode(true);
      headingNode.remove();
    } else {
      // Try to use first <p> as heading if it only contains text
      let firstP = tempDiv.querySelector("p");
      if (
        firstP &&
        firstP.childNodes.length === 1 &&
        firstP.childNodes[0].nodeType === Node.TEXT_NODE
      ) {
        textHeading = document.createElement("h2");
        textHeading.textContent = firstP.textContent;
        firstP.remove();
      }
    }
    if (textHeading) {
      textHeading.classList.add(
        "text-image-text-content",
        "text-text-black",
        "text-h2"
      );
    }

    // The rest is text content
    // Move all remaining children into textWrapper
    while (tempDiv.firstChild) {
      textWrapper.appendChild(tempDiv.firstChild);
    }
    // Insert heading at the top of textWrapper if present
    if (textHeading)
      textWrapper.insertBefore(textHeading, textWrapper.firstChild);
    // Place textWrapper inside textContent
    textContent.appendChild(textWrapper);

    // Compose modal structure
    if (textImageImageDiv.childNodes.length)
      contentDiv.appendChild(textImageImageDiv);
    contentDiv.appendChild(textContent);

    // Close button
    const closeBtn = document.createElement("button");
    closeBtn.className = "text-image-modal-close text-b close-icon icon-left";
    closeBtn.setAttribute(
      "aria-label",
      placeholders.globalClose || "Close modal"
    );
    const closeSpan = document.createElement("span");
    closeSpan.className = "animate-underline";
    closeSpan.textContent = placeholders.globalClose || "CLOSE";
    closeBtn.appendChild(closeSpan);

    // --- Scroll lock integration ---
    let restoreScroll = null;
    let scrollY = 0;

    // ADD: Enhanced scroll handling for entire modal content
    function setupScrollHandling() {
      // Prevent scroll events from bubbling up from the modal overlay
      dialog.addEventListener(
        "wheel",
        function (e) {
          if (e.target === dialog) {
            e.preventDefault();
            return;
          }

          const rect = contentDiv.getBoundingClientRect();
          const isOverScrollable =
            e.clientX >= rect.left &&
            e.clientX <= rect.right &&
            e.clientY >= rect.top &&
            e.clientY <= rect.bottom;

          if (!isOverScrollable) {
            e.preventDefault();
          }
        },
        { passive: false }
      );

      // Handle trackpad/wheel events on the entire content area
      contentDiv.addEventListener(
        "wheel",
        function (e) {
          const element = e.currentTarget;
          const atTop = element.scrollTop === 0;
          const atBottom =
            element.scrollTop >= element.scrollHeight - element.clientHeight;

          // Prevent event bubbling when we can still scroll
          if ((!atTop && e.deltaY < 0) || (!atBottom && e.deltaY > 0)) {
            e.stopPropagation();
          }
        },
        { passive: false }
      );
    }

    // Fade out and remove modal
    function fadeOutAndRemove() {
      if (dialog.classList.contains("fade-out")) return; // Prevent double fade
      dialog.classList.remove("fade-in");
      dialog.classList.add("fade-out");
      dialog.addEventListener(
        "animationend",
        () => {
          dialog.close();
          dialog.remove();
          if (typeof restoreScroll === "function") restoreScroll();
          // Always restore scroll position
          window.scrollTo(0, scrollY);
        },
        { once: true }
      );
    }

    // Close modal on button click
    closeBtn.addEventListener("click", fadeOutAndRemove);

    // Intercept Escape key to fade out before closing
    dialog.addEventListener("cancel", (e) => {
      e.preventDefault();
      fadeOutAndRemove();
    });

    contentDiv.appendChild(closeBtn);
    dialog.appendChild(contentDiv);

    // Open modal on trigger click
    trigger.style.cursor = "pointer";
    trigger.addEventListener("click", (event) => {
      event.preventDefault();
      if (!document.body.contains(dialog)) {
        document.body.appendChild(dialog);
      }
      if (typeof dialog.open === "boolean" && !dialog.open) {
        // Save scroll position before locking
        scrollY = window.scrollY;
        dialog.showModal();
        dialog.classList.remove("fade-out");
        // Force reflow to restart animation
        dialog.offsetWidth;
        dialog.classList.add("fade-in");
        // Lock scroll
        restoreScroll = disableScroll();

        // UPDATED: Setup scroll handling and focus entire content area
        setupScrollHandling();
        setTimeout(() => {
          contentDiv.focus({ preventScroll: true });
          contentDiv.scrollTop = 0;
        }, 100);
      }
    });

    // Also close modal on backdrop click
    dialog.addEventListener("click", (e) => {
      if (e.target === dialog) {
        fadeOutAndRemove();
      }
    });

    // Clean up classes on close
    dialog.addEventListener("close", () => {
      dialog.classList.remove("fade-in", "fade-out");
      if (typeof restoreScroll === "function") restoreScroll();
      // Always restore scroll position
      window.scrollTo(0, scrollY);
    });
  }, 100);
}

export async function createSignOutDialog({
  trigger,
  onConfirm,
  onClose,
} = {}) {
  const placeholders = await fetchPlaceholders();
  const signOutDialog = document.createElement("dialog");
  signOutDialog.className = "sign-out-dialog fade";
  signOutDialog.innerHTML = `
      <div class="container">
        <button class="close-icon"></button>
        <h4 class="text-h4">${
          placeholders.signOutDialogHeader ||
          "Are you sure you want to sign out?"
        }</h4>
        <button class="cta-button">${
          placeholders.signOutDialogConfirmButtonText || "Confirm"
        }</button>
      </div>
    `;
  document.body.appendChild(signOutDialog);

  // Hide by default (opacity 0)
  signOutDialog.classList.add("fade");

  // Open dialog with fade in
  if (trigger) {
    trigger.addEventListener("click", () => {
      signOutDialog.showModal();
      setTimeout(() => signOutDialog.classList.remove("fade"), 10);
    });
  }

  // Fade out and close helper
  function fadeOutAndCloseDialog() {
    signOutDialog.classList.add("fading-out");
    setTimeout(() => {
      signOutDialog.classList.add("fade");
      signOutDialog.classList.remove("fading-out");
      signOutDialog.close();
      if (typeof onClose === "function") onClose();
    }, 300);
  }

  // Handle closing the sign out dialog when clicking the close icon
  signOutDialog
    .querySelector(".close-icon")
    .addEventListener("click", fadeOutAndCloseDialog);

  // Close dialog when clicking outside the modal content
  signOutDialog.addEventListener("click", (e) => {
    if (e.target === signOutDialog) {
      fadeOutAndCloseDialog();
    }
  });

  // Close dialog when pressing Escape
  signOutDialog.addEventListener("keydown", (e) => {
    if (e.key === "Escape") {
      fadeOutAndCloseDialog();
    }
  });

  // Handle confirm button in dialog
  const confirmBtn = signOutDialog.querySelector(".cta-button");
  if (confirmBtn) {
    confirmBtn.addEventListener("click", () => {
      if (typeof onConfirm === "function") {
        fadeOutAndCloseDialog();
        localStorage.removeItem("gha_token");
        onConfirm();
      } else {
        localStorage.removeItem("gha_token");
        window.location.href =
          placeholders.signOutRedirectUrl || "/gha-discovery";
      }
    });
  }

  return signOutDialog;
}

/* -------------------------------- Lazy Load ------------------------------- */
function initLazyVideos({ fallbackDelay = 6000 } = {}) {
  if (typeof LazyLoad === "undefined") {
    document.querySelectorAll("video.lazy").forEach((video) => {
      const sources = video.querySelectorAll("source[data-src]");
      sources.forEach((source) => {
        source.src = source.dataset.src;
        delete source.dataset.src;
      });
      video.load();
    });
    return;
  }

  // Create LazyLoad instance
  const lazyLoadInstance = new LazyLoad({
    elements_selector: "video.lazy",
    threshold: 400,

    callback_enter: (video) => {
      // Load sources when in viewport
      const sources = video.querySelectorAll("source[data-src]");
      sources.forEach((source) => {
        source.src = source.dataset.src;
        delete source.dataset.src;
      });
      video.load();
    },
  });

  const safeUpdate = () => {
    if (lazyLoadInstance?.update) lazyLoadInstance.update();
  };

  // Minimal retries for delayed DOM injection
  if (typeof window.requestIdleCallback === "function") {
    window.requestIdleCallback(() => safeUpdate());
  } else {
    setTimeout(safeUpdate, 0);
  }
  setTimeout(safeUpdate, 1500);

  // MutationObserver for dynamically added videos
  const observer = new MutationObserver((mutations) => {
    let needsUpdate = false;
    for (const m of mutations) {
      if (m.addedNodes.length > 0) {
        needsUpdate = true;
        break;
      }
    }
    if (needsUpdate) safeUpdate();
  });

  observer.observe(document.body, { childList: true, subtree: true });

  // Force update once on first interaction only
  ["scroll", "resize", "click"].forEach((evt) =>
    window.addEventListener(evt, safeUpdate, { once: true })
  );
  //! Fallback: force-load only *unloaded* videos after a delay
  if (fallbackDelay > 0) {
    setTimeout(() => {
      document.querySelectorAll("video").forEach((video) => {
        const sources = video.querySelectorAll("source[data-src]");
        if (sources.length > 0) {
          sources.forEach((source) => {
            source.src = source.dataset.src;
            delete source.dataset.src;
          });
          video.load();
        }
      });
    }, fallbackDelay);
  }

  return lazyLoadInstance;
}
initLazyVideos();

/* -------------------------- Cookie Text Injection ------------------------- */
// cookieText[region][language]
const cookieText = {
  VN: {
    EN: `
      <p>
        I agree that Capella will process my personal information for the purpose stated in the
        <a
          href="https://capellahotelgroup.com/privacy-policy/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Capella Hotel Group Privacy Policy
        </a>.
      </p>
      <p>
      I acknowledge and consent that Capella may transfer my Personal Data to recipients located in countries outside of my country of residence, including those with different data protection standards, for the purposes described in the 
      <a
          href="https://capellahotelgroup.com/privacy-policy/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Capella Hotel Group Privacy Policy
        </a>.
      </p>
    `,
    VN: `
      <p>
        I agree that Capella will process my personal information for the purpose stated in the
        <a
          href="https://capellahotelgroup.com/privacy-policy/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Capella Hotel Group Privacy Policy
        </a>.
      </p>
      <p>
      I acknowledge and consent that Capella may transfer my Personal Data to recipients located in countries outside of my country of residence, including those with different data protection standards, for the purposes described in the 
      <a
          href="https://capellahotelgroup.com/privacy-policy/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Capella Hotel Group Privacy Policy
        </a>.
      </p>
    `,
  },
  ZH: {
    EN: `
      <p>
        I agree that Patina will process my personal information for the purposes stated in the
        <a
          href="https://capellahotelgroup.com/china-privacy-policy/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Capella Hotel Group Mainland China Privacy Policy
        </a>.
      </p>
      <p>
        I specifically and separately consent to Patina’s processing of my sensitive personal information and to the cross-border transfer of my personal information to recipients located within and outside Mainland China, as described in the
        <a
          href="https://capellahotelgroup.com/china-privacy-policy/"
          target="_blank"
          rel="noopener noreferrer"
        >
          Capella Hotel Group Mainland China Privacy Policy
        </a>.
      </p>
    `,
    ZH: `
      <p>
        我同意柏典将根据
        <a
          href="https://capellahotelgroup.com/china-privacy-policy/"
          target="_blank"
          rel="noopener noreferrer"
        >
          中国大陆隐私政策
        </a>
        中所述的目的处理我的个人信息。
      </p>
      <p>
        我明确并单独同意柏典处理我的敏感个人信息，并同意将我的个人信息跨境传输至位于中国大陆境内外的接收方如
        <a
          href="https://capellahotelgroup.com/china-privacy-policy/"
          target="_blank"
          rel="noopener noreferrer"
        >
          中国大陆隐私政策
        </a>
        中所述。
      </p>
    `,
  },
};

const language = document.documentElement.lang.toUpperCase() || "EN";

if (window.adobe && window.adobe.target) {
  adobe.target.getOffer({
    mbox: "newsletter_modal_mbox",
    params: {
      // optional: custom param you want to pass
    },
    success: function (offer) {
      function updateCookieText() {
        let regionVal = offer[0]?.content || "EN";
        try {
          regionVal =
            typeof regionVal === "string" ? JSON.parse(regionVal) : regionVal;
        } catch {}
        const region = regionVal[0].code || "EN";
        if (
          region === "EN" ||
          !cookieText[region] ||
          !cookieText[region][language]
        )
          return true;

        const target = document.querySelector(".cookiefirst-root .cfEa3L > p");
        if (target) {
          target.outerHTML = cookieText[region][language];
          return true;
        }
        return false;
      }
      // Run immediately
      if (!updateCookieText()) {
        // Wait for cookie banner to load
        const observer = new MutationObserver(() => {
          if (updateCookieText()) {
            observer.disconnect();
          }
        });

        observer.observe(document.body, { childList: true, subtree: true });
      }
    },
    error: function (err) {
      console.warn("Target modal getOffer error", err);
    },
  });
}
