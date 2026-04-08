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
  return input;
}

export function createSalutationDropdown(placeholders) {
  const SALUTATION_PILL_CLASS = "general-modal-salutation-pill";
  const SALUTATION_DROPDOWN_CLASS = "general-modal-salutation-dropdown";
  const SALUTATION_ITEM_CLASS = "general-modal-salutation-item";

  const salutations = ["Mr.", "Mrs.", "Ms.", "Dr.", "Prof."];
  const defaultLabel =
    placeholders.generalenquirySalutation ||
    placeholders.weddingenquirySalutation ||
    "Salutation*";

  let activeSalutation = "";

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

  function closeDropdown(dropdown) {
    if (!dropdown) return;
    dropdown.setAttribute("aria-open", "false");
    pillButton.setAttribute("aria-expanded", "false");
    setTimeout(() => {
      dropdown.remove();
    }, 350);
  }

  function toggleDropdown() {
    let dropdown = buttonWrapper.querySelector(`.${SALUTATION_DROPDOWN_CLASS}`);
    if (dropdown) {
      closeDropdown(dropdown);
      return;
    }

    dropdown = document.createElement("div");
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

      item.addEventListener("click", () => {
        activeSalutation = salutation;
        updatePillText();
        closeDropdown(dropdown);
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

  pillButton.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  document.addEventListener("click", (e) => {
    if (!buttonWrapper.contains(e.target)) {
      const dropdown = buttonWrapper.querySelector(
        `.${SALUTATION_DROPDOWN_CLASS}`
      );
      if (dropdown) {
        closeDropdown(dropdown);
      }
    }
  });

  updatePillText();
  return buttonWrapper;
}

export function createEnquiryTypeDropdown(placeholders) {
  const ENQUIRY_PILL_CLASS = "general-modal-enquiry-pill";
  const ENQUIRY_DROPDOWN_CLASS = "general-modal-enquiry-dropdown";
  const ENQUIRY_ITEM_CLASS = "general-modal-enquiry-item";

  const enquiryTypes = [
    {
      value: "restaurant",
      label: placeholders.enquiryDining || "Dining Reservations",
    },
    { value: "event", label: placeholders.enquiryEvents || "Events" },
    { value: "general", label: placeholders.enquiryFeedback || "Feedback" },
    { value: "general", label: placeholders.enquiryMedia || "Media Enquiry" },
    {
      value: "general",
      label: placeholders.enquiryHotel || "Hotel Activities",
    },
    { value: "wedding", label: placeholders.enquiryWeddings || "Weddings" },
    {
      value: "wellness",
      label: placeholders.enquiryWellness || "Wellness & Membership",
    },
    {
      value: "restaurant",
      label: placeholders.enquiryReservations || "Reservations",
    },
    { value: "general", label: placeholders.enquiryOther || "Other" },
  ];

  const defaultLabel = placeholders.generalenquiryType;
  let activeEnquiryType = "";
  let activeEnquiryLabel = "";

  const buttonWrapper = document.createElement("div");
  buttonWrapper.className = "general-modal-enquiry-wrapper";

  const pillButton = document.createElement("button");
  pillButton.className = ENQUIRY_PILL_CLASS;
  pillButton.type = "button";
  pillButton.setAttribute("aria-expanded", "false");

  const pillText = document.createElement("span");
  pillText.className = "general-modal-enquiry-pill-text text-l2";

  const pillIcon = document.createElement("span");
  pillIcon.className = "general-modal-enquiry-pill-icon";
  pillIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;

  pillButton.append(pillText, pillIcon);
  buttonWrapper.append(pillButton);

  const hiddenInput = document.createElement("input");
  hiddenInput.type = "hidden";
  hiddenInput.name = "enquiryType";
  hiddenInput.value = "";
  hiddenInput.required = true;
  buttonWrapper.appendChild(hiddenInput);

  function updatePillText() {
    pillText.textContent = activeEnquiryLabel || defaultLabel;
    pillText.style.color = activeEnquiryType ? "#000000" : "#757575";
    hiddenInput.value = activeEnquiryType;
  }

  function closeDropdown(dropdown) {
    if (!dropdown) return;
    dropdown.setAttribute("aria-open", "false");
    pillButton.setAttribute("aria-expanded", "false");
    setTimeout(() => {
      dropdown.remove();
    }, 350);
  }

  function toggleDropdown() {
    let dropdown = buttonWrapper.querySelector(`.${ENQUIRY_DROPDOWN_CLASS}`);
    if (dropdown) {
      closeDropdown(dropdown);
      return;
    }

    dropdown = document.createElement("div");
    dropdown.className = ENQUIRY_DROPDOWN_CLASS;
    dropdown.setAttribute("aria-open", "false");

    enquiryTypes.forEach((enquiry) => {
      const item = document.createElement("button");
      item.className = ENQUIRY_ITEM_CLASS;
      item.textContent = enquiry.label;
      item.type = "button";

      if (
        enquiry.value === activeEnquiryType &&
        enquiry.label === activeEnquiryLabel
      ) {
        item.classList.add("active");
      }

      item.addEventListener("click", () => {
        activeEnquiryType = enquiry.value;
        activeEnquiryLabel = enquiry.label;
        updatePillText();
        closeDropdown(dropdown);
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

  pillButton.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  document.addEventListener("click", (e) => {
    if (!buttonWrapper.contains(e.target)) {
      const dropdown = buttonWrapper.querySelector(
        `.${ENQUIRY_DROPDOWN_CLASS}`
      );
      if (dropdown) {
        closeDropdown(dropdown);
      }
    }
  });

  updatePillText();

  return buttonWrapper;
}

export async function createPhoneInput(placeholders) {
  const PHONE_CODE_PILL_CLASS = "general-modal-phone-code-pill";
  const PHONE_CODE_DROPDOWN_CLASS = "general-modal-phone-code-dropdown";
  const PHONE_CODE_ITEM_CLASS = "general-modal-phone-code-item";
  const PHONE_CODE_SEARCH_CLASS = "general-modal-phone-code-search";

  let codes = [];
  let filteredCodes = [];
  let activeCountryCode = "+60";
  let isLoading = true;

  const container = document.createElement("div");
  container.className = "general-modal__phone-input-container";

  const phoneLabel = document.createElement("span");
  phoneLabel.className = "general-modal__phone-label text-l2";
  phoneLabel.textContent =
    placeholders.generalenquiryPhone ||
    placeholders.weddingenquiryPhone ||
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

      item.addEventListener("click", () => {
        activeCountryCode = code;
        updateCountryCodePillText();
        closeCountryCodeDropdown(dropdown);
        hiddenCountryCodeInput.dispatchEvent(
          new Event("change", { bubbles: true })
        );
      });

      itemsContainer.appendChild(item);
    });
  }

  function closeCountryCodeDropdown(dropdown) {
    if (!dropdown) return;
    dropdown.setAttribute("aria-open", "false");
    countryCodePill.setAttribute("aria-expanded", "false");
    setTimeout(() => {
      dropdown.remove();
    }, 350);
  }

  function toggleCountryCodeDropdown() {
    if (isLoading) return;

    let dropdown = countryCodeWrapper.querySelector(
      `.${PHONE_CODE_DROPDOWN_CLASS}`
    );
    if (dropdown) {
      closeCountryCodeDropdown(dropdown);
      return;
    }

    dropdown = document.createElement("div");
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

    filterCountries("");
    renderDropdownItems(dropdown, searchInput);

    countryCodeWrapper.appendChild(dropdown);

    setTimeout(() => {
      dropdown.setAttribute("aria-open", "true");
      countryCodePill.setAttribute("aria-expanded", "true");

      searchInput.focus();
    }, 10);
  }

  countryCodePill.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleCountryCodeDropdown();
  });

  document.addEventListener("click", (e) => {
    if (!countryCodeWrapper.contains(e.target)) {
      const dropdown = countryCodeWrapper.querySelector(
        `.${PHONE_CODE_DROPDOWN_CLASS}`
      );
      if (dropdown) {
        closeCountryCodeDropdown(dropdown);
      }
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
            `Default country code ${activeCountryCode} not found, using first available`
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

export function createCalendarInput(placeholders) {
  const wrapper = document.createElement("div");
  wrapper.className = "general-modal__calendar-wrapper";
  const pillButton = document.createElement("button");
  pillButton.className = "calendar-filter-button";
  pillButton.setAttribute("type", "button");
  pillButton.setAttribute("aria-expanded", "false");
  const buttonText = document.createElement("span");
  buttonText.className = "calendar-filter-button-text text-l2";
  buttonText.textContent =
    placeholders.weddingenquiryDate ||
    placeholders.eventsenquiryDate ||
    placeholders.restaurantenquiryDate ||
    placeholders.wellnessenquiryDate ||
    "Select Date";
  const buttonIcon = document.createElement("span");
  buttonIcon.className = "calendar-filter-button-icon";

  buttonIcon.innerHTML = `<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
  pillButton.append(buttonText, buttonIcon);
  const hiddenInput = document.createElement("input");
  hiddenInput.type = "hidden";
  hiddenInput.name = "bookingDate";
  wrapper.append(pillButton, hiddenInput);

  const dropdownContainer = document.createElement("div");
  dropdownContainer.className = "calendar-dropdown-container";
  wrapper.appendChild(dropdownContainer);

  const closeCalendar = () => {
    pillButton.setAttribute("aria-expanded", "false");
    dropdownContainer.style.display = "none";
    dropdownContainer.innerHTML = "";
  };

  pillButton.addEventListener("click", (e) => {
    e.stopPropagation();
    const isExpanded = pillButton.getAttribute("aria-expanded") === "true";
    if (isExpanded) {
      closeCalendar();
    } else {
      pillButton.setAttribute("aria-expanded", "true");
      dropdownContainer.style.display = "block";
      const calendarBoard = createCalendarBoard({
        onSelect: (selection) => {
          buttonText.textContent =
            selection.display ||
            placeholders.weddingenquiryDate ||
            placeholders.eventsenquiryDate ||
            placeholders.restaurantenquiryDate ||
            placeholders.wellnessenquiryDate ||
            "Select Date";
          buttonText.style.color = selection.display ? "#000000" : "#757575";
          hiddenInput.value = selection.value || "";
        },
        onDone: closeCalendar,
      });
      dropdownContainer.appendChild(calendarBoard);
    }
  });

  document.addEventListener("click", (e) => {
    if (!wrapper.contains(e.target)) {
      closeCalendar();
    }
  });

  return wrapper;
}

export function createRestaurantDropdown(placeholders) {
  const RESTAURANT_PILL_CLASS = "general-modal-restaurant-pill";
  const RESTAURANT_DROPDOWN_CLASS = "general-modal-restaurant-dropdown";
  const RESTAURANT_ITEM_CLASS = "general-modal-restaurant-item";

  const restaurants = ["Restaurant A", "Restaurant B", "Restaurant C"];
  const defaultLabel =
    placeholders.restaurantenquirySelect || "Select Restaurant";
  let activeRestaurant = "";

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

  function closeDropdown(dropdown) {
    if (!dropdown) return;
    dropdown.setAttribute("aria-open", "false");
    pillButton.setAttribute("aria-expanded", "false");
    setTimeout(() => {
      dropdown.remove();
    }, 350);
  }

  function toggleDropdown() {
    let dropdown = buttonWrapper.querySelector(`.${RESTAURANT_DROPDOWN_CLASS}`);
    if (dropdown) {
      closeDropdown(dropdown);
      return;
    }

    dropdown = document.createElement("div");
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

      item.addEventListener("click", () => {
        activeRestaurant = restaurant;
        updatePillText();
        closeDropdown(dropdown);
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

  pillButton.addEventListener("click", (e) => {
    e.stopPropagation();
    toggleDropdown();
  });

  document.addEventListener("click", (e) => {
    if (!buttonWrapper.contains(e.target)) {
      const dropdown = buttonWrapper.querySelector(
        `.${RESTAURANT_DROPDOWN_CLASS}`
      );
      if (dropdown) {
        closeDropdown(dropdown);
      }
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

export function validateForm(data, placeholders = {}) {
  const errors = {};
  const { enquiryType } = data;

  const textInputRegex = /^[a-zA-Z0-9\s.'-]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const phoneRegex = /^\d{6,17}$/;

  if (!data.firstName)
    errors.firstName =
      placeholders.firstNameValidation || "First name is required.";
  else if (!textInputRegex.test(data.firstName))
    errors.firstName =
      placeholders.firstNameInvalidValidation ||
      "Invalid characters in first name.";

  if (!data.lastName)
    errors.lastName =
      placeholders.lastNameValidation || "Last name is required.";
  else if (!textInputRegex.test(data.lastName))
    errors.lastName =
      placeholders.lastNameInvalidValidation ||
      "Invalid characters in last name.";

  if (!data.email)
    errors.email = placeholders.emailValidation || "Email is required.";
  else if (!emailRegex.test(data.email))
    errors.email =
      placeholders.emailInvalidValidation || "Invalid email format.";

  if (!data.captchaValue)
    errors.captchaValue =
      placeholders.captchaValidation || "Please complete the reCAPTCHA.";

  if (!data.property)
    errors.property =
      placeholders.propertyValidation || "Property is required.";

  if (!data.enquiryType)
    errors.enquiryType =
      placeholders.enquiryValidation || "Enquiry type is required.";

  if (data.phone && !phoneRegex.test(data.phone)) {
    errors.phone =
      placeholders.phoneInvalidValidation ||
      "Phone number must be 6-15 digits.";
  }

  if (data.description && data.description.length > 1000)
    errors.description =
      placeholders.descriptionLengthValidation ||
      "Description cannot exceed 1000 characters.";

  return errors;
}

export function displayErrors(form, errors) {
  const errorTargetSelectors = {
    phone: ".general-modal__phone-input-container",
    bookingDate: ".calendar-filter-button",
    salutation: ".general-modal-salutation-pill",
    restaurantName: ".general-modal-restaurant-pill",
    enquiryType: ".general-modal-enquiry-pill",
  };

  function appendErrorMessage(container, message) {
    if (!container || container.querySelector(".error-message")) return;
    const errorEl = document.createElement("div");
    errorEl.className = "error-message";

    const errorIcon = document.createElement("img");
    errorIcon.className = "error-icon";
    errorIcon.src = "/icons/error.svg";
    errorIcon.alt = "Error";

    const errorText = document.createElement("span");
    errorText.textContent = message;

    errorEl.append(errorIcon, errorText);
    container.appendChild(errorEl);
  }

  Object.entries(errors).forEach(([fieldName, message]) => {
    // Skip country code: it is handled implicitly via phone UI
    if (fieldName === "countryCode") return;

    // Captcha has a dedicated wrapper
    if (fieldName === "captchaValue") {
      const captchaWrapper = form.querySelector(
        ".general-modal__recaptcha-wrapper"
      );
      appendErrorMessage(captchaWrapper, message);
      return;
    }

    const field = form.querySelector(`[name="${fieldName}"]`);
    const targetSelector = errorTargetSelectors[fieldName];
    const target = targetSelector ? form.querySelector(targetSelector) : field;

    // Add visual error state to the appropriate element if present
    if (target) {
      target.classList.add("has-error");
    }

    // Attach the error message in the field's wrapper if available
    const wrapper = field
      ? field.closest(".general-modal__field-wrapper")
      : null;
    if (wrapper) {
      appendErrorMessage(wrapper, message);
    } else if (fieldName === "enquiryType" && !target) {
      // Preserve original logging when the enquiry pill could not be found
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

export async function createFormField(
  placeholders,
  type,
  name,
  contextPrefix = "generalenquiry"
) {
  const placeholderKey = `${contextPrefix}${
    name.charAt(0).toUpperCase() + name.slice(1)
  }`;
  const placeholder = placeholders[placeholderKey] || name;

  switch (type) {
    case "input":
      return createInputField(placeholder, name);
    case "email":
      return createInputField(placeholder, name, "email");
    case "number":
      return createNumberField(placeholder, name);
    case "phone":
      return createPhoneInput(placeholders);
    case "calendar":
      return createCalendarInput(placeholders);
    case "salutation":
      return createSalutationDropdown(placeholders);
    case "enquiryType":
      return createEnquiryTypeDropdown(placeholders);
    case "restaurant":
      return createRestaurantDropdown(placeholders);
    default:
      return createInputField(placeholder, name);
  }
}

export function getModalTitle(placeholders, context) {
  const titleMap = {
    wedding: placeholders.weddingenquiryTitle,
    events: placeholders.eventsenquiryTitle,
    restaurant: placeholders.restaurantenquiryTitle,
    wellness: placeholders.wellnessenquiryTitle,
    general: placeholders.generalenquiryTitle,
  };

  return (
    titleMap[context] || placeholders.generalEnquiryTitle || "Let us help you"
  );
}

export function getSubmitButtonText(placeholders, context) {
  const submitMap = {
    wedding: placeholders.weddingenquirySubmit,
    events: placeholders.eventsenquirySubmit,
    restaurant: placeholders.restaurantenquirySubmit,
    wellness: placeholders.wellnessenquirySubmit,
    general: placeholders.generalenquirySubmit,
  };

  return submitMap[context] || placeholders.generalenquirySubmit || "SUBMIT";
}

export function getDescriptionPlaceholder(placeholders, context) {
  const descriptionMap = {
    wedding: placeholders.weddingenquiryDetails,
    events: placeholders.eventsenquiryDetails,
    restaurant: placeholders.restaurantenquiryDetails,
    wellness: placeholders.wellnessenquiryDetails,
    general: placeholders.generalenquiryDetails,
  };

  return (
    descriptionMap[context] ||
    placeholders.generalEnquiryDetails ||
    "Please provide details about your enquiry"
  );
}

export function getUpdatesText(placeholders, context) {
  if (window.EnquirySectionManager?.enquiryTerms?.EN) {
    return window.EnquirySectionManager.enquiryTerms.EN;
  }

  const updatesMap = {
    wedding: placeholders.weddingenquiryUpdates,
    events: placeholders.eventsenquiryUpdates,
    restaurant: placeholders.restaurantenquiryUpdates,
    wellness: placeholders.wellnessenquiryUpdates,
    general: placeholders.generalenquiryUpdates,
  };

  return (
    updatesMap[context] ||
    placeholders.generalEnquiryUpdates ||
    "I would like to receive updates and offers from Capella Hotel Group via email or other electronic channels."
  );
}
