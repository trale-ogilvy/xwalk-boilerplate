// newsletter-modal-utils.js
// Utility functions for newsletter modal

export function showFieldError(form, name, message) {
  const field = form.querySelector(`[name="${name}"]`);
  if (!field) return;
  let error = field.parentElement.querySelector(".field-error");
  if (!error) {
    error = document.createElement("div");
    // Create image element for the error icon
    const errorIcon = document.createElement("img");
    errorIcon.src = "/icons/error.svg";
    errorIcon.alt = "Error"; // Accessibility: Provide a description for the icon
    const text = document.createElement("span");
    text.className = "text-p3";
    text.textContent = message;

    error.className = "field-error";
    error.appendChild(errorIcon);
    error.appendChild(text);
    field.parentElement.appendChild(error);
  } else {
    error.querySelector(".text-p3").textContent = message;
  }
}

export function clearAllErrors(form) {
  form.querySelectorAll(".field-error").forEach((e) => e.remove());
}

export function addFieldErrorListeners(form, clearAllErrorsFn) {
  [
    "salutation",
    "firstName",
    "lastName",
    "email",
    "country",
    "captchaValue",
  ].forEach((name) => {
    const field = form.querySelector(`[name="${name}"]`);
    if (field) {
      field.addEventListener("input", () => {
        clearAllErrorsFn();
      });
      field.addEventListener("change", () => {
        clearAllErrorsFn();
      });
    }
  });
}

// Add global cache for countries
let countriesCache = null;
let countriesLoadingPromise = null;

// Modified function to support caching and return a promise
export function populateCountrySelect(select) {
  // If we have cached data, use it immediately
  if (countriesCache) {
    populateSelectFromCache(select, countriesCache);
    return Promise.resolve(countriesCache);
  }

  // If already loading, return the existing promise
  if (countriesLoadingPromise) {
    countriesLoadingPromise.then(() => {
      if (select && countriesCache) {
        populateSelectFromCache(select, countriesCache);
      }
    });
    return countriesLoadingPromise;
  }

  // Start loading countries
  countriesLoadingPromise = fetch("https://restcountries.com/v3.1/all?fields=name,cca2,translations")
    .then((res) => res.json())
    .then((data) => {
      const sortedCountries = data
        .map((country) => ({
          value: country.cca2,
          en: country.name.common,
          label: country.name.common,
        }))
        .sort((a, b) => a.en.localeCompare(b.en));
      
      // Cache the data
      countriesCache = sortedCountries;
      
      // Populate the select if provided
      if (select) {
        populateSelectFromCache(select, sortedCountries);
      }
      
      return sortedCountries;
    })
    .catch((error) => {
      console.error('Failed to load countries:', error);
      countriesLoadingPromise = null; // Reset so it can be retried
      return [];
    });

  return countriesLoadingPromise;
}

// Helper function to populate select from cached data
function populateSelectFromCache(select, countries) {
  if (!select || !countries) return;
  
  // Clear existing options except the first placeholder
  const placeholder = select.querySelector('option[value=""]');
  select.innerHTML = '';
  
  // Re-add placeholder if it existed
  if (placeholder) {
    select.appendChild(placeholder);
  }
  
  // Add countries
  countries.forEach((country) => {
    const opt = document.createElement("option");
    opt.value = country.value;
    opt.textContent = country.label;
    select.appendChild(opt);
  });
}

// New function to preload countries without a select element
export function preloadCountries() {
  return populateCountrySelect(null);
}

// Function to get cached countries
export function getCachedCountries() {
  return countriesCache;
}
