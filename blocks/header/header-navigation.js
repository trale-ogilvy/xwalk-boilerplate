/**
 * Navigation functionality for header component
 */

import { createOptimizedPicture } from "../../scripts/aem.js";

/**
 * Creates dropdown navigation structure from AEM content
 */
export function createDropdownNavigation(
  mainNavUl,
  cardsWrapper,
  mainLinks,
  nav
) {
  if (!mainNavUl) return null;

  // Create dropdown structure for items with <strong>
  const dropdownItems = [];
  const regularItems = [];

  mainNavUl.querySelectorAll("li").forEach((li) => {
    const strongElement = li.querySelector("strong");
    if (strongElement) {
      // This is a dropdown item
      dropdownItems.push({
        element: li,
        title: strongElement.textContent.trim(),
      });
    } else {
      // Regular nav item
      regularItems.push(li);
    }
  });

  // Create new navigation structure
  const newNavUl = document.createElement("ul");

  // Add dropdown items first
  dropdownItems.forEach((dropdownItem) => {
    const dropdownLi = document.createElement("li");
    dropdownLi.className = "nav-dropdown-item";

    const dropdownButton = document.createElement("button");
    dropdownButton.className =
      "text-h4 nav-link nav-dropdown-toggle animate-underline";
    dropdownButton.textContent = dropdownItem.title;
    dropdownButton.setAttribute("aria-expanded", "false");

    dropdownLi.appendChild(dropdownButton);
    newNavUl.appendChild(dropdownLi);
  });

  // Add regular items
  regularItems.forEach((li) => {
    const a = li.querySelector("a");
    if (a) {
      a.classList.add("text-h4", "nav-link");
    }
    newNavUl.appendChild(li);
  });

  mainLinks.appendChild(newNavUl);

  // Create dropdown content area
  if (cardsWrapper && dropdownItems.length > 0) {
    const dropdownContent = createDropdownContent(cardsWrapper);
    mainLinks.appendChild(dropdownContent);

    // Setup dropdown functionality
    setupDropdownFunctionality(newNavUl, dropdownContent, nav);
  }

  return newNavUl;
}

/**
 * Creates dropdown content from cards wrapper
 */
function createDropdownContent(cardsWrapper) {
  const dropdownContent = document.createElement("div");
  dropdownContent.className = "nav-dropdown-content";

  // Clone and restructure the cards wrapper
  const clonedCardsWrapper = cardsWrapper.cloneNode(true);

  // Restructure cards to wrap in anchors with URLs
  const cardsItems = clonedCardsWrapper.querySelectorAll("li");
  cardsItems.forEach((item) => {
    const imageDiv = item.querySelector(".cards-card-image");
    const bodyDivs = item.querySelectorAll(".cards-card-body");

    if (imageDiv && bodyDivs.length >= 2) {
      const titleText = bodyDivs[0].querySelector("p")?.textContent?.trim();
      const urlLink = bodyDivs[1].querySelector("a");
      const urlText =
        urlLink?.getAttribute("href") || urlLink?.textContent?.trim();

      if (titleText && urlText) {
        // Create anchor wrapper
        const cardAnchor = document.createElement("a");
        cardAnchor.href = urlText;
        cardAnchor.className = "nav-dropdown-card-link";

        // Clear the item and rebuild structure
        item.innerHTML = "";

        // Add image with additional optimization
        const clonedImage = imageDiv.cloneNode(true);
        
        // Check if the cloned image contains a picture element (AEM optimized)
        const pictureElement = clonedImage.querySelector('picture');
        if (pictureElement) {
          const imgElement = pictureElement.querySelector('img');
          if (imgElement && imgElement.src) {
            // Extract base URL and create additional optimization with 660px width
            const baseImageUrl = imgElement.src.split('?')[0];
            const additionalOptimizedPicture = createOptimizedPicture(
              baseImageUrl,
              imgElement.alt || "",
              false, // not eager loading
              [
                { media: "(min-width: 600px)", width: "400" },
                { width: "300" }
              ]
            );
            
            // Replace the picture element with the newly optimized one
            clonedImage.innerHTML = '';
            clonedImage.appendChild(additionalOptimizedPicture);
          }
        }
        
        cardAnchor.appendChild(clonedImage);

        // Add text content
        const textWrapper = document.createElement("div");
        textWrapper.className = "cards-card-body";

        const titlePara = document.createElement("p");
        titlePara.className = "text-h5";
        titlePara.textContent = titleText;
        textWrapper.appendChild(titlePara);

        cardAnchor.appendChild(textWrapper);
        item.appendChild(cardAnchor);
      }
    }
  });

  dropdownContent.appendChild(clonedCardsWrapper);
  return dropdownContent;
}

/**
 * Sets up dropdown functionality with vanilla CSS/JS animations
 */
export function setupDropdownFunctionality(newNavUl, dropdownContent, nav) {
  const bottomLinks = nav.querySelector(".bottom-links");
  const hamburger = nav.querySelector(".hamburger-react");
  const menuTextButton = nav.querySelector(".menu-text-button");

  // Use event delegation to always handle the latest dropdown toggle
  newNavUl.addEventListener("click", function (e) {
    const dropdownToggle = e.target.closest(".nav-dropdown-toggle");
    if (!dropdownToggle) return;

    const otherNavItems = newNavUl.querySelectorAll(
      "li:not(.nav-dropdown-item)"
    );
    const isExpanded = dropdownToggle.getAttribute("aria-expanded") === "true";

    if (isExpanded) {
      closeDropdown(
        dropdownToggle,
        dropdownContent,
        bottomLinks,
        hamburger,
        menuTextButton,
        otherNavItems
      );
    } else {
      openDropdown(
        dropdownToggle,
        dropdownContent,
        bottomLinks,
        hamburger,
        menuTextButton,
        otherNavItems
      );
    }
  });
}

/**
 * Opens dropdown with vanilla CSS/JS animation
 */
function openDropdown(
  dropdownToggle,
  dropdownContent,
  bottomLinks,
  hamburger,
  menuTextButton,
  otherNavItems
) {
  dropdownToggle.setAttribute("aria-expanded", "true");
  // Add class to nav-menu for desktop fade-out effect
  const navMenu = document.querySelector(".nav-menu");
  if (navMenu) {
    navMenu.classList.add("dropdown-active");
  }

  // Calculate the target position (24px above dropdown content)
  // First, get the dropdown content position (it's positioned at 50% of viewport)
  const dropdownContentTop = window.innerHeight * 0.5; // 50% from top where dropdown appears
  const targetTop = dropdownContentTop - 250; // 24px above dropdown content
  const currentRect = dropdownToggle.getBoundingClientRect();
  const currentTop = currentRect.top;
  const translateY = targetTop - currentTop;
  if (window.innerWidth < 767) {
    dropdownToggle.style.transform = `translateY(${translateY - 40}px)`;
  } else {
    // Apply the transform to move button 24px above dropdown content
    dropdownToggle.style.transform = `translateY(${translateY}px)`;
  }

  // Fade out other elements first
  bottomLinks.style.transition = "opacity 0.5s ease, transform 0.5s ease";
  bottomLinks.style.opacity = "0";
  bottomLinks.style.transform = "translateY(-20px)";

  hamburger.style.transition = "opacity 0.5s ease";
  hamburger.style.opacity = "0";

  menuTextButton.style.transition = "opacity 0.5s ease";
  menuTextButton.style.opacity = "0";

  // Hide other navigation items
  otherNavItems.forEach((item, index) => {
    setTimeout(() => {
      item.style.opacity = "0";
      item.style.transform = "translateY(-20px)";
    }, index * 30);
  });

  setTimeout(() => {
    // Hide elements with opacity and disable interactions
    bottomLinks.style.opacity = "0";
    bottomLinks.style.pointerEvents = "none";
    hamburger.style.opacity = "0";
    hamburger.style.pointerEvents = "none";
    menuTextButton.style.opacity = "0";
    menuTextButton.style.pointerEvents = "none";
    otherNavItems.forEach((item) => {
      item.style.opacity = "0";
      item.style.pointerEvents = "none";
    });

    // Show and animate dropdown content
    setTimeout(() => {
      dropdownContent.classList.add("nav-dropdown-active");
    }, 50);
  }, 300);
}

/**
 * Closes dropdown with vanilla CSS/JS animation
 */
function closeDropdown(
  dropdownToggle,
  dropdownContent,
  bottomLinks,
  hamburger,
  menuTextButton,
  otherNavItems
) {
  dropdownToggle.setAttribute("aria-expanded", "false");
  dropdownContent.classList.remove("nav-dropdown-active");

  // Remove class from nav-menu for desktop fade-out effect
  const navMenu = document.querySelector(".nav-menu");
  if (navMenu) {
    navMenu.classList.remove("dropdown-active");
  }

  const bookBtn = document.querySelector(".no-hide");
  if (bookBtn) {
    bookBtn.classList.remove("no-hide");
  }

  // Reset the dropdown toggle position smoothly
  dropdownToggle.style.transform = "";

  // Fade out dropdown content first
  setTimeout(() => {
    // Re-enable other elements
    bottomLinks.style.pointerEvents = "auto";
    hamburger.style.pointerEvents = "auto";
    menuTextButton.style.pointerEvents = "auto";
    otherNavItems.forEach((item) => {
      item.style.pointerEvents = "auto";
    });

    setTimeout(() => {
      bottomLinks.style.opacity = "1";
      bottomLinks.style.transform = "translateY(0)";

      hamburger.style.opacity = "1";

      menuTextButton.style.opacity = "1";

      // Show other navigation items with fade in
      otherNavItems.forEach((item, index) => {
        setTimeout(() => {
          item.style.opacity = "1";
          item.style.transform = "translateY(0)";
        }, index * 50);
      });
    }, 50);
  }, 300);
}
