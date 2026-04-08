const TOPICS_PILL_CLASS = "topics-filter-pill";
const TOPICS_DROPDOWN_CLASS = "topics-filter-dropdown";

/**
 * Creates a generic dropdown filter component.
 * @param {object} options
 * @param {string[]} [options.allTopics=[]] - The list of available filter options.
 * @param {string} [options.activeTopic] - The initially selected topic.
 * @param {string} [options.defaultLabel='All Topics'] - The label for the "all" state.
 * @param {function} [options.onFilterChange=()=>{}] - Callback function.
 * @returns {HTMLElement} The filter component's root element.
 */
export function createTopicsFilter({
  allTopics = [],
  activeTopic,
  defaultLabel = "All Topics",
  onFilterChange = () => {},
  allFiltersContainer,
}) {
  const filterState = {
    all: [defaultLabel, ...allTopics],
    active: activeTopic || defaultLabel,
  };

  const buttonWrapper = document.createElement("div");
  buttonWrapper.className = "topics-filter-button-wrapper";

  const pillButton = document.createElement("button");
  pillButton.className = TOPICS_PILL_CLASS;
  pillButton.type = "button";

  const pillText = document.createElement("span");
  pillText.className = "topics-filter-pill-text";

  const pillIcon = document.createElement("span");
  pillIcon.className = "topics-filter-pill-icon";
  pillIcon.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m6 9 6 6 6-6"/></svg>`;

  pillButton.append(pillText, pillIcon);
  buttonWrapper.append(pillButton);

  function formatTopicName(text) {
    if (typeof text !== "string" || !text) return "";

    if (text === defaultLabel) return text;
    const lowercased = text.toLowerCase();
    return lowercased.charAt(0).toUpperCase() + lowercased.slice(1);
  }

  function updatePillText() {
    pillText.textContent = formatTopicName(filterState.active);
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
    // First, check if this dropdown is already open
    let dropdown = buttonWrapper.querySelector(`.${TOPICS_DROPDOWN_CLASS}`);
    if (dropdown) {
      closeDropdown(dropdown);
      return;
    }

    // Close all other dropdowns in the container before opening this one
    allFiltersContainer
      .querySelectorAll(`.${TOPICS_DROPDOWN_CLASS}`)
      .forEach((otherDropdown) => {
        // Find the pill button that owns this dropdown
        const dropdownParent = otherDropdown.closest(
          ".topics-filter-button-wrapper"
        );
        if (dropdownParent) {
          const otherPillButton = dropdownParent.querySelector(
            `.${TOPICS_PILL_CLASS}`
          );
          if (otherPillButton) {
            otherPillButton.setAttribute("aria-expanded", "false");
          }
        }
        otherDropdown.setAttribute("aria-open", "false");
        otherDropdown.remove();
      });

    // Now create and open the new dropdown
    dropdown = document.createElement("div");
    dropdown.className = TOPICS_DROPDOWN_CLASS;
    dropdown.setAttribute("aria-open", "false");

    filterState.all.forEach((topic) => {
      const item = document.createElement("button");
      item.className = "topics-filter-item";
      item.textContent = formatTopicName(topic);

      if (topic === filterState.active) {
        item.classList.add("active");
      }

      item.addEventListener("click", () => {
        filterState.active = topic;
        onFilterChange(topic);
        updatePillText();
        closeDropdown(dropdown);
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

  document.addEventListener("click", () => {
    const dropdown = buttonWrapper.querySelector(`.${TOPICS_DROPDOWN_CLASS}`);
    if (dropdown) {
      closeDropdown(dropdown);
    }
  });

  updatePillText();
  return buttonWrapper;
}
