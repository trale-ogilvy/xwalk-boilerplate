const TYPE_PILL_CLASS = "type-filter-pill";
const TYPE_DROPDOWN_CLASS = "type-filter-dropdown";

let currentOpenDropdown = null;

export function createTypesFilter({
  allTypes = [],
  activeType,
  defaultLabel = "All Types",
  onFilterChange = () => {},
}) {
  const filterState = {
    all: [defaultLabel.toLowerCase(), ...allTypes.map((t) => t.toLowerCase())],
    active: (activeType || defaultLabel).toLowerCase(),
  };

  const buttonWrapper = document.createElement("div");
  buttonWrapper.className = "type-filter-button-wrapper";

  const pillButton = document.createElement("button");
  pillButton.className = TYPE_PILL_CLASS;
  pillButton.type = "button";
  pillButton.setAttribute("aria-expanded", "false");

  const pillText = document.createElement("span");
  pillText.className = "type-filter-pill-text";

  const pillIcon = document.createElement("span");
  pillIcon.className = "type-filter-pill-icon";
  pillIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;

  pillButton.append(pillText, pillIcon);
  buttonWrapper.append(pillButton);

  function formatTypeName(text) {
    if (typeof text !== "string" || !text) return "";
    if (text.toLowerCase() === defaultLabel.toLowerCase()) return defaultLabel;
    const lowercased = text.toLowerCase();
    return lowercased.charAt(0).toUpperCase() + lowercased.slice(1);
  }

  function updatePillText() {
    pillText.textContent = formatTypeName(filterState.active);
  }

  function closeDropdown() {
    const dropdown = buttonWrapper.querySelector(`.${TYPE_DROPDOWN_CLASS}`);
    if (!dropdown) return;
    dropdown.setAttribute("aria-open", "false");
    pillButton.setAttribute("aria-expanded", "false");
    setTimeout(() => dropdown.remove(), 350);

    if (currentOpenDropdown === buttonWrapper) {
      currentOpenDropdown = null;
    }
  }

  function toggleDropdown() {
    let dropdown = buttonWrapper.querySelector(`.${TYPE_DROPDOWN_CLASS}`);

    if (dropdown) {
      closeDropdown();
      return;
    }

    if (currentOpenDropdown && currentOpenDropdown !== buttonWrapper) {
      const otherPillButton = currentOpenDropdown.querySelector(
        `.${TYPE_PILL_CLASS}`
      );
      const otherDropdown = currentOpenDropdown.querySelector(
        `.${TYPE_DROPDOWN_CLASS}`
      );

      if (otherDropdown && otherPillButton) {
        otherDropdown.setAttribute("aria-open", "false");
        otherPillButton.setAttribute("aria-expanded", "false");
        setTimeout(() => otherDropdown.remove(), 350);
      }
    }

    currentOpenDropdown = buttonWrapper;

    dropdown = document.createElement("div");
    dropdown.className = TYPE_DROPDOWN_CLASS;
    dropdown.setAttribute("aria-open", "false");

    [defaultLabel, ...allTypes].forEach((displayText) => {
      const typeValue = displayText.toLowerCase();
      const item = document.createElement("button");
      item.className = "type-filter-item";
      item.textContent = formatTypeName(displayText);

      if (typeValue === filterState.active) {
        item.classList.add("active");
      }

      item.addEventListener("click", () => {
        filterState.active = typeValue;
        onFilterChange(displayText);
        updatePillText();
        closeDropdown();
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
    if (!e.target.closest(".type-filter-button-wrapper")) {
      if (currentOpenDropdown === buttonWrapper) {
        closeDropdown();
      }
    }
  });

  updatePillText();
  return buttonWrapper;
}
