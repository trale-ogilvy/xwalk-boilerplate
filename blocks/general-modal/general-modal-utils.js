import { createCalendarBoard } from "./calendar-general-modal.js";

// Global dropdown manager
const DropdownManager = {
  activeDropdown: null,

  register(dropdown) {
    if (this.activeDropdown && this.activeDropdown !== dropdown) {
      this.activeDropdown.close();
    }
    this.activeDropdown = dropdown;
  },

  unregister(dropdown) {
    if (this.activeDropdown === dropdown) {
      this.activeDropdown = null;
    }
  },

  closeAll() {
    if (this.activeDropdown) {
      this.activeDropdown.close();
      this.activeDropdown = null;
    }
  },
};

function formatSubscriptionContent(termsText, checkboxId) {
  const styledText = termsText.replace(
    /<a /g,
    '<a style="color: #000000; text-decoration: underline;" '
  );

  if (
    styledText.includes("<br>") ||
    styledText.includes("<br/>") ||
    styledText.includes("<br />")
  ) {
    const doubleBreakIndex = styledText.indexOf("<br><br>");

    if (doubleBreakIndex !== -1) {
      const firstPart = styledText.substring(0, doubleBreakIndex);
      const secondPart = styledText.substring(doubleBreakIndex + 8);

      return `
        <div class="enquiry-subscription-paragraph">${firstPart}</div>
        <div class="enquiry-subscription-checkbox-container">
          <input type="checkbox" id="${checkboxId}" name="subscribeOptin" class="general-modal__checkbox">
          <div class="enquiry-subscription-paragraph">
            <label for="${checkboxId}" class="checkbox-wrapper">
              <span class="custom-checkbox"></span>
            </label>
            ${secondPart}
          </div>
        </div>
      `;
    } else {
      const singleBreakIndex = styledText.indexOf("<br>");
      if (singleBreakIndex !== -1) {
        const firstPart = styledText.substring(0, singleBreakIndex);
        const secondPart = styledText.substring(singleBreakIndex + 4);

        return `
          <div class="enquiry-subscription-paragraph">${firstPart}</div>
          <div class="enquiry-subscription-checkbox-container">
            <input type="checkbox" id="${checkboxId}" name="subscribeOptin" class="general-modal__checkbox">
            <div class="enquiry-subscription-paragraph">
              <label for="${checkboxId}" class="checkbox-wrapper">
                <span class="custom-checkbox"></span>
              </label>
              ${secondPart}
            </div>
          </div>
        `;
      } else {
        return `
          <div class="enquiry-subscription-checkbox-container">
            <input type="checkbox" id="${checkboxId}" name="subscribeOptin" class="general-modal__checkbox">
            <div class="enquiry-subscription-paragraph">
              <label for="${checkboxId}" class="checkbox-wrapper">
                <span class="custom-checkbox"></span>
              </label>
              ${styledText}
            </div>
          </div>
        `;
      }
    }
  } else if (styledText.includes("&lt;br&gt;")) {
    const processedText = styledText.replace(/&lt;br&gt;/g, "<br>");
    return formatSubscriptionContent(processedText, checkboxId);
  } else {
    return `
      <div class="enquiry-subscription-checkbox-container">
        <input type="checkbox" id="${checkboxId}" name="subscribeOptin" class="general-modal__checkbox">
        <div class="enquiry-subscription-paragraph">
          <label for="${checkboxId}" class="checkbox-wrapper">
            <span class="custom-checkbox"></span>
          </label>
          ${styledText}
        </div>
      </div>
    `;
  }
}

function applyRegionalTermsForConditionalForm(textContainer, checkboxId) {
  const defaultText =
    "I would like to receive updates and offers from Capella Hotel Group via email or other electronic channels.";

  if (window.adobe && window.adobe.target) {
    adobe.target.getOffer({
      mbox: "newsletter_modal_mbox",
      params: {},
      success: function (offer) {
        let regionVal = offer[0]?.content || "EN";
        try {
          regionVal =
            typeof regionVal === "string" ? JSON.parse(regionVal) : regionVal;
        } catch {}

        const region = regionVal[0]?.code || "EN";

        let termsText =
          window.GeneralModalManager?.enquiryTerms?.[region] ||
          window.GeneralModalManager?.enquiryTerms?.EN ||
          defaultText;

        textContainer.innerHTML = formatSubscriptionContent(
          termsText,
          checkboxId
        );
      },
      error: function (err) {
        console.warn("Target modal getOffer error", err);

        const fallbackText =
          window.GeneralModalManager?.enquiryTerms?.EN || defaultText;
        textContainer.innerHTML = formatSubscriptionContent(
          fallbackText,
          checkboxId
        );
      },
    });
  } else {
    const fallbackText =
      window.GeneralModalManager?.enquiryTerms?.EN || defaultText;
    textContainer.innerHTML = formatSubscriptionContent(
      fallbackText,
      checkboxId
    );
  }
}

export function createInputField(placeholder, name, type = "text") {
  const input = document.createElement("input");
  input.className = "general-modal__input text-l2";
  input.setAttribute("type", type);
  input.setAttribute("placeholder", placeholder);
  input.name = name;
  return input;
}

export function createNumberField(placeholder, name) {
  const input = document.createElement("input");
  input.className = "general-modal__input text-l2";
  input.setAttribute("type", "number");
  input.setAttribute("placeholder", placeholder);
  input.name = name;
  input.setAttribute("inputmode", "numeric");
  input.setAttribute("min", "1");
  input.setAttribute("step", "1");

  input.addEventListener("input", (e) => {
    if (e.target.value < 1) {
      e.target.value = "";
    }
  });

  input.addEventListener("blur", (e) => {
    if (e.target.value < 1) {
      e.target.value = "";
    }
  });

  return input;
}

export function createSalutationDropdown(placeholders = {}) {
  const SALUTATION_PILL_CLASS = "general-modal-salutation-pill";
  const SALUTATION_DROPDOWN_CLASS = "general-modal-salutation-dropdown";
  const SALUTATION_ITEM_CLASS = "general-modal-salutation-item";

  const salutations = ["Mr.", "Ms.", "Mrs.", "Dr.", "Prof."];
  const defaultLabel =
    placeholders.generalenquirySalutation ||
    placeholders.weddingenquirySalutation ||
    placeholders.eventsenquirySalutation ||
    placeholders.restaurantenquirySalutation ||
    placeholders.wellnessenquirySalutation ||
    "Salutation*";

  let activeSalutation = "";
  let isOpen = false;

  const buttonWrapper = document.createElement("div");
  buttonWrapper.className = "general-modal-salutation-wrapper";

  const pillButton = document.createElement("button");
  pillButton.className = SALUTATION_PILL_CLASS;
  pillButton.type = "button";
  pillButton.setAttribute("aria-expanded", "false");

  const pillText = document.createElement("span");
  pillText.className = "general-modal-salutation-pill-text text-l2";

  const pillIcon = document.createElement("span");
  pillIcon.className = "general-modal-salutation-pill-icon";
  pillIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

  pillButton.append(pillText, pillIcon);
  buttonWrapper.append(pillButton);

  const hiddenInput = document.createElement("input");
  hiddenInput.type = "hidden";
  hiddenInput.name = "salutation";
  hiddenInput.value = "";
  buttonWrapper.appendChild(hiddenInput);

  function updatePillText() {
    pillText.textContent = activeSalutation || defaultLabel;
    pillText.style.color = activeSalutation ? "#000000" : "#757575";
    hiddenInput.value = activeSalutation;
  }

  function closeDropdown() {
    const dropdown = buttonWrapper.querySelector(
      `.${SALUTATION_DROPDOWN_CLASS}`
    );
    if (!dropdown || !isOpen) return;

    isOpen = false;
    dropdown.setAttribute("aria-open", "false");
    pillButton.setAttribute("aria-expanded", "false");
    setTimeout(() => {
      dropdown.remove();
    }, 350);
    DropdownManager.unregister(dropdownController);
  }

  function openDropdown() {
    if (isOpen) return;

    DropdownManager.register(dropdownController);

    isOpen = true;
    const dropdown = document.createElement("div");
    dropdown.className = SALUTATION_DROPDOWN_CLASS;
    dropdown.setAttribute("aria-open", "false");

    const selectableOptions = [...salutations];

    selectableOptions.forEach((salutation) => {
      const item = document.createElement("button");
      item.className = SALUTATION_ITEM_CLASS;
      item.textContent = salutation;
      item.type = "button";

      if (salutation === activeSalutation) {
        item.classList.add("active");
      }

      item.addEventListener("click", (e) => {
        e.stopPropagation();
        activeSalutation = salutation;
        updatePillText();
        closeDropdown();
        hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
      });

      dropdown.appendChild(item);
    });

    buttonWrapper.appendChild(dropdown);

    setTimeout(() => {
      dropdown.setAttribute("aria-open", "true");
      pillButton.setAttribute("aria-expanded", "true");
    }, 10);
  }

  function toggleDropdown() {
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  const dropdownController = {
    close: closeDropdown,
    element: buttonWrapper,
  };

  pillButton.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  document.addEventListener("click", (e) => {
    if (!buttonWrapper.contains(e.target) && isOpen) {
      closeDropdown();
    }
  });

  updatePillText();
  return buttonWrapper;
}

export function createPhoneInput(placeholders = {}) {
  const PHONE_CODE_PILL_CLASS = "general-modal-phone-code-pill";
  const PHONE_CODE_DROPDOWN_CLASS = "general-modal-phone-code-dropdown";
  const PHONE_CODE_ITEM_CLASS = "general-modal-phone-code-item";
  const PHONE_CODE_SEARCH_CLASS = "general-modal-phone-code-search";

  let codes = [];
  let filteredCodes = [];
  let activeCountryCode = "+60";
  let isLoading = true;
  let isOpen = false;

  const container = document.createElement("div");
  container.className = "general-modal__phone-input-container";

  const phoneLabel = document.createElement("span");
  phoneLabel.className = "general-modal__phone-label text-l2";
  phoneLabel.textContent =
    placeholders.generalenquiryPhone ||
    placeholders.weddingenquiryPhone ||
    placeholders.eventsenquiryPhone ||
    placeholders.restaurantenquiryPhone ||
    placeholders.wellnessenquiryPhone ||
    "Phone";

  const countryCodeWrapper = document.createElement("div");
  countryCodeWrapper.className = "general-modal-phone-code-wrapper";

  const countryCodePill = document.createElement("button");
  countryCodePill.className = PHONE_CODE_PILL_CLASS;
  countryCodePill.type = "button";
  countryCodePill.setAttribute("aria-expanded", "false");
  countryCodePill.disabled = true;

  const countryCodePillText = document.createElement("span");
  countryCodePillText.className = "general-modal-phone-code-pill-text text-l2";
  countryCodePillText.textContent = "Loading...";
  countryCodePillText.style.color = "#757575";

  const countryCodePillIcon = document.createElement("span");
  countryCodePillIcon.className = "general-modal-phone-code-pill-icon";
  countryCodePillIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

  countryCodePill.append(countryCodePillText, countryCodePillIcon);
  countryCodeWrapper.append(countryCodePill);

  const hiddenCountryCodeInput = document.createElement("input");
  hiddenCountryCodeInput.type = "hidden";
  hiddenCountryCodeInput.name = "countryCode";
  hiddenCountryCodeInput.value = "";
  countryCodeWrapper.appendChild(hiddenCountryCodeInput);

  function updateCountryCodePillText() {
    const selectedCountry = codes.find((c) => c.code === activeCountryCode);
    const displayText = selectedCountry
      ? `${selectedCountry.cca2} (${selectedCountry.code})`
      : activeCountryCode;
    countryCodePillText.textContent = displayText;
    countryCodePillText.style.color = "#000000";
    hiddenCountryCodeInput.value = activeCountryCode;
  }

  function filterCountries(searchTerm) {
    const term = searchTerm.toLowerCase().trim();
    if (!term) {
      filteredCodes = [...codes];
    } else {
      filteredCodes = codes.filter((country) => {
        const nameMatch = country.name.toLowerCase().includes(term);
        const codeMatch = country.cca2.toLowerCase().includes(term);
        const phoneMatch = country.code.includes(term);
        const fullNameMatch = country.fullName
          ? country.fullName.toLowerCase().includes(term)
          : false;
        return nameMatch || codeMatch || phoneMatch || fullNameMatch;
      });
    }
  }

  function renderDropdownItems(dropdown, searchInput) {
    let itemsContainer = dropdown.querySelector(
      ".general-modal-phone-code-items-container"
    );

    if (!itemsContainer) {
      itemsContainer = document.createElement("div");
      itemsContainer.className = "general-modal-phone-code-items-container";
      dropdown.appendChild(itemsContainer);
    }

    itemsContainer.innerHTML = "";

    if (filteredCodes.length === 0) {
      const noResultsItem = document.createElement("div");
      noResultsItem.className = "general-modal-phone-code-no-results";
      noResultsItem.textContent = "No countries found";
      itemsContainer.appendChild(noResultsItem);
      return;
    }

    filteredCodes.forEach(({ code, name, cca2, fullName }) => {
      const item = document.createElement("button");
      item.className = PHONE_CODE_ITEM_CLASS;
      item.textContent = `${cca2} (${code}) ${fullName || name}`;
      item.type = "button";

      if (code === activeCountryCode) {
        item.classList.add("active");
      }

      item.addEventListener("click", (e) => {
        e.stopPropagation();
        activeCountryCode = code;
        updateCountryCodePillText();
        closeCountryCodeDropdown();
        hiddenCountryCodeInput.dispatchEvent(
          new Event("change", { bubbles: true })
        );
      });

      itemsContainer.appendChild(item);
    });
  }

  function closeCountryCodeDropdown() {
    const dropdown = countryCodeWrapper.querySelector(
      `.${PHONE_CODE_DROPDOWN_CLASS}`
    );
    if (!dropdown || !isOpen) return;

    isOpen = false;
    dropdown.setAttribute("aria-open", "false");
    countryCodePill.setAttribute("aria-expanded", "false");
    setTimeout(() => {
      dropdown.remove();
    }, 350);
    DropdownManager.unregister(dropdownController);
  }

  function openCountryCodeDropdown() {
    if (isLoading || isOpen) return;

    DropdownManager.register(dropdownController);

    isOpen = true;
    const dropdown = document.createElement("div");
    dropdown.className = PHONE_CODE_DROPDOWN_CLASS;
    dropdown.setAttribute("aria-open", "false");

    // Create search input
    const searchInput = document.createElement("input");
    searchInput.className = PHONE_CODE_SEARCH_CLASS;
    searchInput.type = "text";
    searchInput.placeholder = "Search countries...";
    searchInput.addEventListener("input", (e) => {
      filterCountries(e.target.value);
      renderDropdownItems(dropdown, searchInput);
    });

    dropdown.appendChild(searchInput);

    // Initialize filtered list
    filterCountries("");
    renderDropdownItems(dropdown, searchInput);

    countryCodeWrapper.appendChild(dropdown);

    setTimeout(() => {
      dropdown.setAttribute("aria-open", "true");
      countryCodePill.setAttribute("aria-expanded", "true");
      // Focus search input after dropdown opens
      searchInput.focus();
    }, 10);
  }

  function toggleCountryCodeDropdown() {
    if (isOpen) {
      closeCountryCodeDropdown();
    } else {
      openCountryCodeDropdown();
    }
  }

  const dropdownController = {
    close: closeCountryCodeDropdown,
    element: countryCodeWrapper,
  };

  countryCodePill.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleCountryCodeDropdown();
  });

  document.addEventListener("click", (e) => {
    if (!countryCodeWrapper.contains(e.target) && isOpen) {
      closeCountryCodeDropdown();
    }
  });

  // Fetch country codes from API
  function loadCountryCodes() {
    fetch("https://restcountries.com/v3.1/all?fields=name,idd,cca2")
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        // Process and sort countries
        const processedCountries = data
          .filter((country) => {
            const hasValidIDD =
              country.idd &&
              country.idd.root &&
              country.idd.suffixes &&
              country.idd.suffixes.length > 0;
            return hasValidIDD;
          })
          .map((country) => {
            const root = country.idd.root;
            const suffix = country.idd.suffixes[0];
            const fullCode = root + suffix;

            return {
              code: fullCode,
              name: country.cca2,
              cca2: country.cca2,
              fullName: country.name?.common || country.cca2,
            };
          })
          .sort((a, b) =>
            (a.fullName || a.name).localeCompare(b.fullName || b.name)
          );

        codes = processedCountries;
        filteredCodes = [...codes];

        const currentDestination = getDestinationFromUrl();

        // Use property codes for country code assignment
        if (currentDestination === "PTOSA") {
          activeCountryCode = "+81";
        } else if (currentDestination === "PTMAL") {
          activeCountryCode = "+960";
        } else if (
          currentDestination === "Tianjin" ||
          currentDestination === "Sanya"
        ) {
          activeCountryCode = "+86";
        } else {
          activeCountryCode = "+81";
        }

        const foundCountry = codes.find((c) => c.code === activeCountryCode);
        if (!foundCountry && codes.length > 0) {
          console.warn(
            `⚠️ Default country code ${activeCountryCode} not found, using first available`
          );
          activeCountryCode = codes[0].code;
        }

        isLoading = false;
        countryCodePill.disabled = false;
        updateCountryCodePillText();
      })
      .catch((error) => {
        console.error("❌ Error loading country codes:", error);

        // Fallback to hardcoded values if API fails
        codes = [
          { code: "+60", name: "MY", cca2: "MY", fullName: "Malaysia" },
          { code: "+65", name: "SG", cca2: "SG", fullName: "Singapore" },
          { code: "+66", name: "TH", cca2: "TH", fullName: "Thailand" },
          { code: "+852", name: "HK", cca2: "HK", fullName: "Hong Kong" },
          { code: "+1", name: "US", cca2: "US", fullName: "United States" },
          { code: "+44", name: "GB", cca2: "GB", fullName: "United Kingdom" },
          { code: "+61", name: "AU", cca2: "AU", fullName: "Australia" },
          { code: "+81", name: "JP", cca2: "JP", fullName: "Japan" },
          { code: "+82", name: "KR", cca2: "KR", fullName: "South Korea" },
          { code: "+86", name: "CN", cca2: "CN", fullName: "China" },
          { code: "+91", name: "IN", cca2: "IN", fullName: "India" },
          { code: "+49", name: "DE", cca2: "DE", fullName: "Germany" },
          { code: "+33", name: "FR", cca2: "FR", fullName: "France" },
          { code: "+960", name: "MV", cca2: "MV", fullName: "Maldives" },
        ];
        filteredCodes = [...codes];

        const currentDestination = getDestinationFromUrl();

        // Use property codes for country code assignment in fallback too
        if (currentDestination === "PTOSA") {
          activeCountryCode = "+81";
        } else if (currentDestination === "PTMAL") {
          activeCountryCode = "+960";
        } else if (
          currentDestination === "Tianjin" ||
          currentDestination === "Sanya"
        ) {
          activeCountryCode = "+86";
        } else {
          activeCountryCode = "+81";
        }

        isLoading = false;
        countryCodePill.disabled = false;
        updateCountryCodePillText();
      });
  }

  loadCountryCodes();

  const phoneInput = document.createElement("input");
  phoneInput.className = "general-modal__phone-number text-l2";
  phoneInput.setAttribute("type", "tel");
  phoneInput.setAttribute("name", "phone");
  phoneInput.setAttribute("inputmode", "numeric");
  phoneInput.setAttribute("maxlength", "17");

  phoneInput.addEventListener("input", (e) => {
    e.target.value = e.target.value.replace(/[^0-9]/g, "");

    if (e.target.value.length > 17) {
      e.target.value = e.target.value.slice(0, 17);
    }

    if (e.target.value.length > 0) {
      container.classList.add("has-input");
    } else {
      container.classList.remove("has-input");
    }
  });

  phoneInput.addEventListener("blur", () => {
    if (phoneInput.value.length === 0) {
      container.classList.remove("has-input");
    }
  });

  phoneInput.addEventListener("focus", () => {
    if (phoneInput.value.length > 0) {
      container.classList.add("has-input");
    }
  });

  container.append(phoneLabel, countryCodeWrapper, phoneInput);

  return container;
}

export function createCalendarInput(
  placeholders = {},
  enquiryType = "general"
) {
  let isOpen = false;

  const wrapper = document.createElement("div");
  wrapper.className = "general-modal__calendar-wrapper";

  const pillButton = document.createElement("button");
  pillButton.className = "calendar-filter-button";
  pillButton.setAttribute("type", "button");
  pillButton.setAttribute("aria-expanded", "false");

  const buttonText = document.createElement("span");
  buttonText.className = "calendar-filter-button-text text-l2";
  buttonText.textContent =
    placeholders[`${enquiryType}enquiryDate`] ||
    placeholders.generalenquiryDate ||
    "Select Date*";

  const buttonIcon = document.createElement("span");
  buttonIcon.className = "calendar-filter-button-icon";
  buttonIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

  pillButton.append(buttonText, buttonIcon);

  const hiddenStartDateInput = document.createElement("input");
  hiddenStartDateInput.type = "hidden";
  hiddenStartDateInput.name = "bookingDate";

  const hiddenEndDateInput = document.createElement("input");
  hiddenEndDateInput.type = "hidden";
  hiddenEndDateInput.name = "bookingEndDate";

  wrapper.append(pillButton, hiddenStartDateInput, hiddenEndDateInput);

  const dropdownContainer = document.createElement("div");
  dropdownContainer.className = "calendar-dropdown-container";
  dropdownContainer.setAttribute("aria-open", "false");
  wrapper.appendChild(dropdownContainer);

  const closeCalendar = () => {
    if (!isOpen) return;

    isOpen = false;
    dropdownContainer.setAttribute("aria-open", "false");
    pillButton.setAttribute("aria-expanded", "false");

    setTimeout(() => {
      dropdownContainer.innerHTML = "";
    }, 300);
    DropdownManager.unregister(dropdownController);
  };

  const openCalendar = () => {
    if (isOpen) return;

    DropdownManager.register(dropdownController);

    isOpen = true;
    const calendarBoard = createCalendarBoard({
      onSelect: (selection) => {
        buttonText.textContent =
          selection.display ||
          placeholders[`${enquiryType}enquiryDate`] ||
          "Select Date*";
        buttonText.style.color = selection.display ? "#000000" : "#757575";
        buttonText.dataset.hasSelectedDate = selection.display
          ? "true"
          : "false";

        const dateParts = selection.display
          ? selection.display.split(" - ")
          : [];
        if (dateParts.length === 2) {
          hiddenStartDateInput.value = selection.value.split(" - ")[0].trim();
          hiddenEndDateInput.value = selection.value.split(" - ")[1].trim();
        } else {
          hiddenStartDateInput.value = selection.value || "";
          hiddenEndDateInput.value = selection.value || "";
        }

        hiddenStartDateInput.dispatchEvent(
          new Event("change", { bubbles: true })
        );
        hiddenEndDateInput.dispatchEvent(
          new Event("change", { bubbles: true })
        );
      },
      onDone: closeCalendar,
    });

    dropdownContainer.appendChild(calendarBoard);

    setTimeout(() => {
      dropdownContainer.setAttribute("aria-open", "true");
      pillButton.setAttribute("aria-expanded", "true");
    }, 10);
  };

  const dropdownController = {
    close: closeCalendar,
    element: wrapper,
  };

  pillButton.addEventListener("click", (e) => {
    e.stopPropagation();
    if (isOpen) {
      closeCalendar();
    } else {
      openCalendar();
    }
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target) && isOpen) {
      closeCalendar();
    }
  });

  return wrapper;
}

export function createRestaurantDropdown(placeholders = {}) {
  const RESTAURANT_PILL_CLASS = "general-modal-restaurant-pill";
  const RESTAURANT_DROPDOWN_CLASS = "general-modal-restaurant-dropdown";
  const RESTAURANT_ITEM_CLASS = "general-modal-restaurant-item";

  const restaurants = [
    "Roots",
    "Portico",
    "Wok Society",
    "Fari Beach Club",
    "Koen",
    "Brasa",
    "Veli Bar",
    "Helios",
    "Farine",
    "Arabesque",
    "Fari Marina Village Dining Depot",
  ];
  const defaultLabel =
    placeholders.restaurantenquirySelect || "Select Restaurant*";
  let activeRestaurant = "";
  let isOpen = false;

  const buttonWrapper = document.createElement("div");
  buttonWrapper.className = "general-modal-restaurant-wrapper";

  const pillButton = document.createElement("button");
  pillButton.className = RESTAURANT_PILL_CLASS;
  pillButton.type = "button";
  pillButton.setAttribute("aria-expanded", "false");

  const pillText = document.createElement("span");
  pillText.className = "general-modal-restaurant-pill-text text-l2";
  pillText.textContent = defaultLabel;

  const pillIcon = document.createElement("span");
  pillIcon.className = "general-modal-restaurant-pill-icon";
  pillIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

  pillButton.append(pillText, pillIcon);
  buttonWrapper.append(pillButton);

  const hiddenInput = document.createElement("input");
  hiddenInput.type = "hidden";
  hiddenInput.name = "restaurantName";
  hiddenInput.value = "";
  buttonWrapper.appendChild(hiddenInput);

  function updatePillText() {
    pillText.textContent = activeRestaurant || defaultLabel;
    pillText.style.color = activeRestaurant ? "#000000" : "#757575";
    hiddenInput.value = activeRestaurant;
  }

  function closeDropdown() {
    const dropdown = buttonWrapper.querySelector(
      `.${RESTAURANT_DROPDOWN_CLASS}`
    );
    if (!dropdown || !isOpen) return;

    isOpen = false;
    dropdown.setAttribute("aria-open", "false");
    pillButton.setAttribute("aria-expanded", "false");
    setTimeout(() => {
      dropdown.remove();
    }, 350);
    DropdownManager.unregister(dropdownController);
  }

  function openDropdown() {
    if (isOpen) return;

    DropdownManager.register(dropdownController);

    isOpen = true;
    const dropdown = document.createElement("div");
    dropdown.className = RESTAURANT_DROPDOWN_CLASS;
    dropdown.setAttribute("aria-open", "false");

    restaurants.forEach((restaurant) => {
      const item = document.createElement("button");
      item.className = RESTAURANT_ITEM_CLASS;
      item.textContent = restaurant;
      item.type = "button";

      if (restaurant === activeRestaurant) {
        item.classList.add("active");
      }

      item.addEventListener("click", (e) => {
        e.stopPropagation();
        activeRestaurant = restaurant;
        updatePillText();
        closeDropdown();
        hiddenInput.dispatchEvent(new Event("change", { bubbles: true }));
      });

      dropdown.appendChild(item);
    });

    buttonWrapper.appendChild(dropdown);

    setTimeout(() => {
      dropdown.setAttribute("aria-open", "true");
      pillButton.setAttribute("aria-expanded", "true");
    }, 10);
  }

  function toggleDropdown() {
    if (isOpen) {
      closeDropdown();
    } else {
      openDropdown();
    }
  }

  const dropdownController = {
    close: closeDropdown,
    element: buttonWrapper,
  };

  pillButton.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  document.addEventListener("click", (e) => {
    if (!buttonWrapper.contains(e.target) && isOpen) {
      closeDropdown();
    }
  });

  updatePillText();
  return buttonWrapper;
}

// Form Utilities
export function createRecaptchaField() {
  const recaptchaWrapper = document.createElement("div");
  recaptchaWrapper.className = "general-modal__recaptcha-wrapper";
  recaptchaWrapper.style.position = "relative";

  const recaptchaElement = document.createElement("div");
  recaptchaElement.id = "general-modal-recaptcha";
  recaptchaWrapper.appendChild(recaptchaElement);

  const errorMessage = document.createElement("div");
  errorMessage.className = "error-message";
  errorMessage.style.display = "none";
  recaptchaWrapper.appendChild(errorMessage);

  return recaptchaWrapper;
}

// NEW: Conditional form creation function
export function createConditionalForm(
  enquiryType = "general",
  placeholders = {}
) {
  const form = document.createElement("form");
  form.className = "general-modal-form";
  form.dataset.enquiryType = enquiryType;

  const createFieldWrapper = (fieldElement) => {
    const wrapper = document.createElement("div");
    wrapper.className = "general-modal__field-wrapper";
    wrapper.appendChild(fieldElement);
    return wrapper;
  };

  // Row 1 - Always present (Salutation, First Name, Last Name)
  const row1 = document.createElement("div");
  row1.className = "general-modal__row";
  row1.appendChild(createFieldWrapper(createSalutationDropdown(placeholders)));
  row1.appendChild(
    createFieldWrapper(
      createInputField(
        placeholders[`${enquiryType}enquiryFirstname`] ||
          placeholders.generalenquiryFirstname ||
          "First Name*",
        "firstName"
      )
    )
  );
  row1.appendChild(
    createFieldWrapper(
      createInputField(
        placeholders[`${enquiryType}enquiryLastname`] ||
          placeholders.generalenquiryLastname ||
          "Last Name*",
        "lastName"
      )
    )
  );
  form.appendChild(row1);

  // Row 2 - Always present (Email, Phone)
  const row2 = document.createElement("div");
  row2.className = "general-modal__row";
  row2.appendChild(
    createFieldWrapper(
      createInputField(
        placeholders[`${enquiryType}enquiryEmail`] ||
          placeholders.generalenquiryEmail ||
          "Email Address*",
        "email",
        "email"
      )
    )
  );
  row2.appendChild(createFieldWrapper(createPhoneInput(placeholders)));
  form.appendChild(row2);

  // Hidden property input - Always present
  const propertyInput = document.createElement("input");
  propertyInput.type = "hidden";
  propertyInput.name = "property";
  const destination = getDestinationFromUrl();
  propertyInput.value = destination;
  form.appendChild(propertyInput);

  // Conditional complex fields (Date + Pax) - Only for wedding, events, restaurant
  const isComplexEnquiry = ["wedding", "events", "restaurant"].includes(
    enquiryType
  );
  if (isComplexEnquiry) {
    const complexRow = document.createElement("div");
    complexRow.className =
      "general-modal__row general-modal__row--conditional-complex";

    const calendarWrapper = createFieldWrapper(
      createCalendarInput(placeholders, enquiryType)
    );
    const paxWrapper = createFieldWrapper(
      createNumberField(
        placeholders[`${enquiryType}enquiryPax`] || "No of Pax*",
        "noOfPax"
      )
    );

    complexRow.appendChild(calendarWrapper);
    complexRow.appendChild(paxWrapper);
    form.appendChild(complexRow);
  }

  // Conditional restaurant dropdown - Only for restaurant enquiry
  if (enquiryType === "restaurant") {
    const restaurantRow = document.createElement("div");
    restaurantRow.className =
      "general-modal__row general-modal__row--conditional-restaurant text-l2";
    const restaurantDropdown = createRestaurantDropdown(placeholders);
    restaurantDropdown.style.flexBasis = "100%";
    restaurantRow.appendChild(createFieldWrapper(restaurantDropdown));
    form.appendChild(restaurantRow);
  }

  // Description textarea - Always present
  const row4 = document.createElement("div");
  row4.className = "general-modal__row";
  const largeInput = document.createElement("textarea");
  largeInput.className = "general-modal__textarea text-l2";

  const placeholderText =
    placeholders[`${enquiryType}enquiryDetails`] ||
    placeholders.generalenquiryDetails ||
    "Enquiry Details";

  largeInput.setAttribute("placeholder", placeholderText);
  largeInput.setAttribute("name", "description");
  row4.appendChild(createFieldWrapper(largeInput));
  form.appendChild(row4);

  // UPDATED: Subscription opt-in with br splitting concept
  const subscriptionOptinDiv = document.createElement("div");
  subscriptionOptinDiv.className = "general-modal__subscription-optin";

  const textContainer = document.createElement("div");
  textContainer.className = "general-modal__subscription-text";

  const defaultText =
    window.GeneralModalManager?.enquiryTerms?.EN ||
    placeholders[`${enquiryType}enquiryUpdates`] ||
    placeholders.generalenquiryUpdates ||
    "I would like to receive updates and offers from Capella Hotel Group via email or other electronic channels.";

  textContainer.innerHTML = formatSubscriptionContent(
    defaultText,
    "subscribeOptin"
  );

  subscriptionOptinDiv.appendChild(textContainer);

  applyRegionalTermsForConditionalForm(textContainer, "subscribeOptin");

  form.appendChild(subscriptionOptinDiv);

  // reCAPTCHA - Always present
  form.appendChild(createRecaptchaField());

  // Language input - Always present
  const languageInput = document.createElement("input");
  languageInput.type = "hidden";
  languageInput.name = "language";
  languageInput.value = "en";
  form.appendChild(languageInput);

  // Submit button - Always present
  const submitButton = document.createElement("button");
  submitButton.className = "general-modal__submit-btn";
  submitButton.textContent =
    placeholders[`${enquiryType}enquirySubmit`] ||
    placeholders.generalenquirySubmit ||
    "Submit";
  submitButton.type = "button";
  form.appendChild(submitButton);

  return form;
}

// Updated validation function for conditional fields
export function validateForm(data, placeholders = {}) {
  const errors = {};
  const { enquiryType } = data;

  const textInputRegex = /^[a-zA-Z0-9\s.'-]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{6,17}$/;
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

  // Always required fields
  if (!data.salutation) {
    errors.salutation =
      placeholders.salutationValidation || "Please enter your salutation";
  } else if (!textInputRegex.test(data.salutation)) {
    errors.salutation =
      placeholders.salutationInvalidValidation ||
      "Invalid characters in salutation.";
  }

  if (!data.firstName) {
    errors.firstName =
      placeholders.firstNameValidation || "Please enter your first name";
  } else if (!textInputRegex.test(data.firstName)) {
    errors.firstName =
      placeholders.firstNameInvalidValidation ||
      "Invalid characters in first name.";
  }

  if (!data.lastName) {
    errors.lastName =
      placeholders.lastNameValidation || "Please enter your last name";
  } else if (!textInputRegex.test(data.lastName)) {
    errors.lastName =
      placeholders.lastNameInvalidValidation ||
      "Invalid characters in last name.";
  }

  if (!data.email) {
    errors.email = placeholders.emailValidation || "Please enter your email";
  } else if (!emailRegex.test(data.email)) {
    errors.email =
      placeholders.emailInvalidValidation || "Invalid email format.";
  }

  if (!data.captchaValue) {
    errors.captchaValue =
      placeholders.captchaValidation ||
      "Please complete the reCAPTCHA verification";
  }

  if (!data.property) {
    errors.property =
      placeholders.propertyValidation || "Property is required.";
  }

  if (!data.countryCode) {
    errors.countryCode =
      placeholders.countryCodeValidation || "Please select your country";
  }

  // Optional phone validation
  if (data.phone && !phoneRegex.test(data.phone)) {
    errors.phone =
      placeholders.phoneInvalidValidation ||
      "Phone number must be 6-17 digits.";
  }

  // Optional description length validation
  if (data.description && data.description.length > 1000) {
    errors.description =
      placeholders.descriptionLengthValidation ||
      "Description cannot exceed 1000 characters.";
  }

  // Conditional validation for complex enquiries
  const isComplexEnquiry = ["wedding", "events", "restaurant"].includes(
    enquiryType
  );

  if (isComplexEnquiry) {
    if (!data.bookingDate) {
      errors.bookingDate =
        placeholders.bookingDateValidation || "Booking date is required.";
    } else if (!dateRegex.test(data.bookingDate)) {
      errors.bookingDate =
        placeholders.bookingDateInvalidValidation ||
        "Invalid start date format (YYYY-MM-DD).";
    } else {
      const startDate = new Date(data.bookingDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (startDate < today) {
        errors.bookingDate =
          placeholders.bookingDatePastValidation ||
          "Start date cannot be in the past.";
      }
    }

    if (data.bookingEndDate) {
      if (!dateRegex.test(data.bookingEndDate)) {
        errors.bookingEndDate =
          placeholders.bookingEndDateInvalidValidation ||
          "Invalid end date format (YYYY-MM-DD).";
      } else {
        const startDate = new Date(data.bookingDate);
        const endDate = new Date(data.bookingEndDate);
        if (endDate < startDate) {
          errors.bookingEndDate =
            placeholders.bookingEndDateBeforeStartValidation ||
            "End date cannot be before start date.";
        }
      }
    }

    if (!data.noOfPax) {
      errors.noOfPax =
        placeholders.noOfPaxValidation || "Number of pax is required.";
    } else if (isNaN(data.noOfPax) || Number.parseInt(data.noOfPax, 10) <= 0) {
      errors.noOfPax =
        placeholders.noOfPaxInvalidValidation ||
        "Number of pax must be a positive number.";
    }
  }

  // Restaurant-specific validation
  if (enquiryType === "restaurant") {
    if (!data.restaurantName) {
      errors.restaurantName =
        placeholders.restaurantNameValidation || "Restaurant name is required.";
    }
  }

  return errors;
}

export function displayErrors(form, errors) {
  Object.entries(errors).forEach(([fieldName, message]) => {
    const field = form.querySelector(`[name="${fieldName}"]`);
    let targetElementForErrorClass = field;

    if (fieldName === "phone") {
      targetElementForErrorClass = form.querySelector(
        ".general-modal__phone-input-container"
      );
    } else if (fieldName === "bookingDate" || fieldName === "bookingEndDate") {
      targetElementForErrorClass = form.querySelector(
        ".calendar-filter-button"
      );
    } else if (fieldName === "salutation") {
      targetElementForErrorClass = form.querySelector(
        ".general-modal-salutation-pill"
      );
    } else if (fieldName === "countryCode") {
      return;
    } else if (fieldName === "restaurantName") {
      targetElementForErrorClass = form.querySelector(
        ".general-modal-restaurant-pill"
      );
    }

    const wrapper = field
      ? field.closest(".general-modal__field-wrapper")
      : null;

    if (targetElementForErrorClass) {
      targetElementForErrorClass.classList.add("has-error");

      if (wrapper && !wrapper.querySelector(".error-message")) {
        const errorEl = document.createElement("div");
        errorEl.className = "error-message";

        const errorIcon = document.createElement("img");
        errorIcon.className = "error-icon";
        errorIcon.src = "/icons/error.svg";
        errorIcon.alt = "Error";

        const errorText = document.createElement("span");
        errorText.textContent = message;

        errorEl.append(errorIcon, errorText);
        wrapper.appendChild(errorEl);
      }
    } else if (fieldName === "captchaValue") {
      const captchaWrapper = form.querySelector(
        ".general-modal__recaptcha-wrapper"
      );
      if (captchaWrapper && !captchaWrapper.querySelector(".error-message")) {
        const errorEl = document.createElement("div");
        errorEl.className = "error-message";

        const errorIcon = document.createElement("img");
        errorIcon.className = "error-icon";
        errorIcon.src = "/icons/error.svg";
        errorIcon.alt = "Error";

        const errorText = document.createElement("span");
        errorText.textContent = message;

        errorEl.append(errorIcon, errorText);
        captchaWrapper.appendChild(errorEl);
      }
    } else if (fieldName === "enquiryType") {
      console.error(`Validation error for enquiryType: ${message}`);
    }
  });
}

export function clearAllErrors(form) {
  form
    .querySelectorAll(".has-error")
    .forEach((el) => el.classList.remove("has-error"));
  form.querySelectorAll(".error-message").forEach((el) => el.remove());
}

export function getDestinationFromUrl() {
  const currentUrl = window.location.href;
  if (currentUrl.includes("/osaka")) {
    return "PTOSA";
  } else if (currentUrl.includes("/maldives")) {
    return "PTMAL";
  } else if (currentUrl.includes("/tianjin")) {
    return "Tianjin";
  } else if (currentUrl.includes("/sanya")) {
    return "Sanya";
  } else {
    return "PTMAL";
  }
}
