import { isUniversalEditor } from "../../scripts/aem.js";
import {
  getLocationFromUrl,
  setupReserveBarFunctionality,
  initializeReserveUtils,
} from "./reserve-utils.js";

// Global variables to store the initialized objects
let reserveBars = {};
let occasionsMap = {};
let occasionsMapMaldives = {};

export default async function decorate(block) {
  // Initialize placeholders and get the objects
  const initialized = await initializeReserveUtils();
  reserveBars = initialized.reserveBars;
  occasionsMap = initialized.occasionsMap;
  occasionsMapMaldives = initialized.occasionsMapMaldives;

  setupInteractiveTabs(block);
}

function setupInteractiveTabs(reserveTabsBlock) {
  if (!document.querySelector(".hero-container")) {
    const hero = document.createElement("div");
    hero.className = "hero-container";
    document.body.prepend(hero);
  }

  const allParagraphs = reserveTabsBlock.querySelectorAll("p");
  const contentParagraph = allParagraphs[0];
  if (!contentParagraph || !contentParagraph.textContent) {
    return;
  }

  const tabNames = contentParagraph.textContent
    .split(",")
    .map((value) => value.trim())
    .filter((value) => value.length > 0);

  const titleParagraph = allParagraphs[1];
  const sectionTitles =
    titleParagraph && titleParagraph.textContent
      ? titleParagraph.textContent
          .split(",")
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
      : [];

  const attributeParagraph = allParagraphs[2];
  const tabAttributes =
    attributeParagraph && attributeParagraph.textContent
      ? attributeParagraph.textContent
          .split(",")
          .map((value) => value.trim())
          .filter((value) => value.length > 0)
      : [];

  if (tabNames.length === 0) {
    return;
  }

  const tabDataMap = new Map();
  tabNames.forEach((name, index) => {
    const title = sectionTitles[index] || name.replace(/-/g, " ").toUpperCase();
    const attribute = tabAttributes[index] || name;
    tabDataMap.set(name, { title, attribute });
  });

  reserveTabsBlock.innerHTML = "";

  const tabNavContainer = document.createElement("div");
  tabNavContainer.className = "reserve-tabs-nav-container";
  reserveTabsBlock.appendChild(tabNavContainer);

  const tabNav = document.createElement("div");
  tabNav.className = "reserve-tabs-nav";
  tabNavContainer.appendChild(tabNav);

  const mainTitleElement = document.createElement("h1");
  mainTitleElement.className = "reserve-tabs-main-title";
  mainTitleElement.textContent = tabDataMap.get(tabNames[0]).title;
  reserveTabsBlock.appendChild(mainTitleElement);

  const tabButtons = [];
  tabNames.forEach((name, index) => {
    const button = document.createElement("button");
    button.className = "reserve-tab-button text-b";
    button.textContent = name.replace(/-/g, " ").toUpperCase();

    button.dataset.targetSection = tabDataMap.get(name).attribute;

    if (index === 0) {
      button.classList.add("active");
    }
    tabNav.appendChild(button);
    tabButtons.push(button);

    button.addEventListener("click", () => {
      tabButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      updateSectionVisibility(tabDataMap.get(name).attribute);
      if (mainTitleElement) {
        gsap.to(mainTitleElement, {
          opacity: 0,
          y: -10,
          duration: 0.3,
          ease: "power2.in",
          onComplete: () => {
            mainTitleElement.textContent = tabDataMap.get(name).title;
            gsap.fromTo(
              mainTitleElement,
              { opacity: 0, y: 10 },
              { opacity: 1, y: 0, duration: 0.5, ease: "power2.out" }
            );
          },
        });
      }

      injectBookingBar(tabDataMap.get(name).attribute, index);
    });
  });

  function updateSectionVisibility(activeSectionAttribute) {
    if (isUniversalEditor()) {
      return;
    }

    const normalizedActiveSectionAttributeForComparison = activeSectionAttribute
      .split(" ")[0]
      .toLowerCase();

    const allSections = document.querySelectorAll("main > .section");

    const normalizedTabAttributes = Array.from(tabDataMap.values()).map(
      (data) => data.attribute.split(" ")[0].toLowerCase()
    );

    allSections.forEach((section) => {
      if (section.classList.contains("reserve-tabs-container")) return;
      const sectionClasses = Array.from(section.classList);

      const isTabSection = sectionClasses.some(
        (className) =>
          className !== "section" &&
          normalizedTabAttributes.some((attr) =>
            className.toLowerCase().startsWith(attr)
          )
      );

      const primarySectionClass = sectionClasses.find(
        (cls) => cls !== "section"
      );
      const isTargetSection =
        primarySectionClass &&
        primarySectionClass
          .toLowerCase()
          .startsWith(normalizedActiveSectionAttributeForComparison);

      if (isTabSection) {
        if (isTargetSection) {
          section.classList.remove("hidden-section");
          gsap.fromTo(
            section,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: "power2.out",
            }
          );
        } else {
          section.classList.add("hidden-section");
        }
      }
    });
  }

  function injectBookingBar(tabAttribute, tabIndex) {
    const location = getLocationFromUrl();

    const attributeToKeyMap = {
      rooms: "Rooms & Suites",
      "rooms-suites": "Rooms & Suites",
      accommodations: "Rooms & Suites",
      accommodation: "Rooms & Suites",
      Accommodations: "Rooms & Suites",
      Accommodation: "Rooms & Suites",
      wellbeing: "Wellbeing",
      "drink-dine": "Drink & Dine",
      events: "Events & Weddings",
      "events-weddings": "Events & Weddings",
    };

    const key = attributeToKeyMap[tabAttribute.toLowerCase()] || tabAttribute;

    const barHTML =
      reserveBars[location] && reserveBars[location][key]
        ? reserveBars[location][key]
        : "";

    let barContainer = document.querySelector(".reserve-tabs-booking-bar");
    if (!barContainer) {
      barContainer = document.createElement("div");
      barContainer.className = "reserve-tabs-booking-bar";

      const tabsContainer =
        document.querySelector(".reserve-tabs.block") ||
        document.querySelector(".reserve-tabs-container") ||
        reserveTabsBlock;

      if (tabsContainer) {
        tabsContainer.appendChild(barContainer);
      } else {
        console.error("Could not find tabs container for booking bar");
        return;
      }
    }

    if (typeof gsap !== "undefined") {
      gsap.set(barContainer, {
        opacity: 0,
        y: 30,
      });
    }

    barContainer.innerHTML = barHTML;

    // Add unique classes to buttons based on location and tab
    addUniqueClasses(barContainer, location, key);

    let occasionsData = [];
    if (location === "maldives" && occasionsMapMaldives[key]) {
      occasionsData = occasionsMapMaldives[key];
    } else if (occasionsMap[key]) {
      occasionsData = occasionsMap[key];
    }

    setupReserveBarFunctionality(barContainer, occasionsData);

    if (typeof gsap !== "undefined") {
      gsap.to(barContainer, {
        opacity: 1,
        y: 0,
        duration: 0.9,
        delay: 0.2,
        ease: "power2.out",
      });
    } else {
      barContainer.style.opacity = "1";
      barContainer.style.transform = "translateY(0)";
    }
  }

  function addUniqueClasses(container, location, tabKey) {
    const tabKeys = [
      "Rooms & Suites",
      "Wellbeing",
      "Drink & Dine",
      "Events & Weddings",
    ];
    const tabIndex = tabKeys.indexOf(tabKey);
    const locationMultiplier = location === "maldives" ? 4 : 0;
    const buttonNumber = locationMultiplier + tabIndex + 1;

    const submitButtons = container.querySelectorAll(
      ".reserve-submit, .reserve-submit-mobile-btn"
    );
    submitButtons.forEach((button) => {
      const uniqueClass = `reserve-submit-button-${buttonNumber}`;
      button.classList.add(uniqueClass);
    });
  }

  // Function to handle URL hash and activate corresponding tab
  function handleUrlHash() {
    const hash = window.location.hash.substring(1); // Remove the # symbol
    if (hash) {
      // Decode the hash in case it's URL encoded
      const decodedHash = decodeURIComponent(hash);
      
      // Create a normalized version for comparison (lowercase, spaces to hyphens)
      const normalizeForComparison = (str) => {
        return str.toLowerCase().replace(/\s+/g, '-').replace(/&/g, '&');
      };
      
      // Find the tab that matches the hash
      const matchingTabName = tabNames.find(name => {
        const targetSection = tabDataMap.get(name).attribute;
        
        // Try multiple matching strategies:
        // 1. Exact match with decoded hash
        if (targetSection === decodedHash || name === decodedHash) {
          return true;
        }
        
        // 2. Exact match with original hash
        if (targetSection === hash || name === hash) {
          return true;
        }
        
        // 3. Normalized comparison (case-insensitive, spaces/hyphens flexible)
        const normalizedTarget = normalizeForComparison(targetSection);
        const normalizedHash = normalizeForComparison(decodedHash);
        const normalizedOriginalHash = normalizeForComparison(hash);
        
        if (normalizedTarget === normalizedHash || normalizedTarget === normalizedOriginalHash) {
          return true;
        }
        
        // 4. Also check against the tab name itself
        const normalizedName = normalizeForComparison(name);
        if (normalizedName === normalizedHash || normalizedName === normalizedOriginalHash) {
          return true;
        }
        
        return false;
      });

      if (matchingTabName) {
        // Find the corresponding button and activate it
        const matchingButton = tabButtons.find(button => 
          button.dataset.targetSection === tabDataMap.get(matchingTabName).attribute
        );
        
        if (matchingButton) {
          // Remove active class from all buttons
          tabButtons.forEach((btn) => btn.classList.remove("active"));
          // Add active class to matching button
          matchingButton.classList.add("active");
          
          // Update the main title
          mainTitleElement.textContent = tabDataMap.get(matchingTabName).title;
          
          // Get the tab index
          const tabIndex = tabNames.indexOf(matchingTabName);
          
          // Trigger the same functionality as clicking the tab
          updateSectionVisibility(tabDataMap.get(matchingTabName).attribute);
          injectBookingBar(tabDataMap.get(matchingTabName).attribute, tabIndex);
          
          return true; // Indicate that a hash was processed
        }
      }
    }
    return false; // No hash was processed
  }

  // Check for URL hash on page load
  const hashProcessed = handleUrlHash();

  // If no hash was processed, use the default first tab
  if (!hashProcessed && tabNames.length > 0) {
    const firstTabAttribute = tabDataMap.get(tabNames[0]).attribute;
    updateSectionVisibility(firstTabAttribute);
    injectBookingBar(firstTabAttribute, 0);
    gsap.set(mainTitleElement, {
      opacity: 1,
      y: 0,
    });
  } else if (tabNames.length === 0) {
    document.querySelectorAll("main > .section").forEach((section) => {
      gsap.set(section, {
        clearProps: "all",
        display: "block",
      });
    });
  }

  // Optional: Listen for hash changes while on the page
  window.addEventListener('hashchange', handleUrlHash);
}
