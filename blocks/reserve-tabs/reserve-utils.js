import { createCalendar } from "../programs-listings/calendar-component.js";
import {
  getLanguage,
  getCurrencyAndLocale,
  getHotelConfig,
} from "../../scripts/utils.js";
import { fetchPlaceholders } from "../../scripts/utils.js";

let placeholders = {};

// Initialize placeholders
async function initializePlaceholders() {
  if (Object.keys(placeholders).length === 0) {
    placeholders = await fetchPlaceholders();
  }
  return placeholders;
}

function getPlaceholder(key, fallback = "") {
  return placeholders[key] || fallback;
}

function generateSynxisURL(selectedRange, adults, children, location) {
  // Parse dates
  let arrive = "";
  let depart = "";

  if (typeof selectedRange === "string" && selectedRange.includes(" - ")) {
    [arrive, depart] = selectedRange.split(" - ");
  } else if (typeof selectedRange === "string") {
    arrive = selectedRange;
    depart = selectedRange;
  }

  if (!arrive || !depart) {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    arrive = today.toISOString().split("T")[0];
    depart = tomorrow.toISOString().split("T")[0];
  }

  const currentLanguage = getLanguage();
  const { currency, locale } = getCurrencyAndLocale(currentLanguage);

  const { hotel, chain } = getHotelConfig(location);

  return `https://be.synxis.com/?adult=${adults}&arrive=${arrive}&chain=${chain}&child=${children}&currency=${currency}&depart=${depart}&hotel=${hotel}&level=hotel&locale=${locale}&productcurrency=${currency}&rooms=1`;
}

function generateReserveBars() {
  return {
    osaka: {
      "Rooms & Suites": `
        <div class="hero-reserve-bar">
          <form class="reserve-form reserve-form-rooms">
            <div class="reserve-fields">
              <button type="button" class="reserve-dates-btn reserve-mobile-btn reserve-dates-btn-rooms">
                <span class="reserve-dates-text reserve-dates-text-rooms">${getPlaceholder(
                  "bookbarArrivaldepart",
                  "Arrival / Depart"
                )}</span>
                <img class="reserve-chevron chevron-dates chevron-dates-rooms" src="/icons/chevron_down.svg" alt="Open calendar" />
              </button>
              <div class="reserve-separator"></div>
              <button type="button" class="reserve-guests-btn reserve-mobile-btn reserve-guests-btn-rooms">
                <span class="reserve-guests-text reserve-guests-text-rooms">2 ${getPlaceholder(
                  "bookbarGuest",
                  "Guests"
                )}</span>
                <img class="reserve-chevron chevron-guests chevron-guests-rooms" src="/icons/chevron_down.svg" alt="Open guests" />
              </button>
            </div>
            <button type="submit" class="reserve-submit reserve-submit-rooms">
              <span>${getPlaceholder("accomodationBook", "Book")}</span>
            </button>
          </form>
        </div>
      `,
      Wellbeing: `
        <div class="hero-reserve-bar">
          <form class="reserve-form reserve-form-wellbeing">
            <div class="reserve-fields">
              <button type="button" class="reserve-occasions-btn reserve-mobile-btn reserve-occasions-btn-wellbeing">
                <span class="reserve-occasions-text reserve-occasions-text-wellbeing">${getPlaceholder(
                  "dropdownOsakaWellbeing",
                  "All Treatments"
                )}</span>
                <img class="reserve-chevron chevron-occasions chevron-occasions-wellbeing" src="/icons/chevron_down.svg" alt="Open occasions" />
              </button>
            </div>
            <button type="submit" class="reserve-submit reserve-submit-wellbeing">
              <span>${getPlaceholder("osakaWellbeingBook", "Book")}</span>
            </button>
          </form>
        </div>
      `,
      "Drink & Dine": `
        <div class="hero-reserve-bar">
          <form class="reserve-form reserve-form-drinkdine">
            <div class="reserve-fields">
              <button type="button" class="reserve-occasions-btn reserve-mobile-btn reserve-occasions-btn-drinkdine">
                <span class="reserve-occasions-text reserve-occasions-text-drinkdine">${getPlaceholder(
                  "dropdownOsakaRestaurant",
                  "All Restaurants"
                )}</span>
                <img class="reserve-chevron chevron-occasions chevron-occasions-drinkdine" src="/icons/chevron_down.svg" alt="Open occasions" />
              </button>
            </div>
            <button type="submit" class="reserve-submit reserve-submit-drinkdine">
              <span>${getPlaceholder(
                "dropdownOsakaRestaurantBook",
                "Book"
              )}</span>
            </button>
          </form>
        </div>
      `,
      "Events & Weddings": `
        <div class="hero-reserve-bar">
          <form class="reserve-form reserve-form-events">
            <div class="reserve-fields">
              <button type="button" class="reserve-occasions-btn reserve-mobile-btn reserve-occasions-btn-events">
                <span class="reserve-occasions-text reserve-occasions-text-events">${getPlaceholder(
                  "eventsSelect",
                  "Select an Occasion"
                )}</span>
                <img class="reserve-chevron chevron-occasions chevron-occasions-events" src="/icons/chevron_down.svg" alt="Open occasions" />
              </button>
            </div>
            <button type="submit" class="reserve-submit reserve-submit-events">
              <span>${getPlaceholder("eventsEnquire", "Enquire")}</span>
            </button>
          </form>
        </div>
      `,
    },
    maldives: {
      "Rooms & Suites": `
        <div class="hero-reserve-bar">
          <form class="reserve-form reserve-form-rooms-m">
            <div class="reserve-fields">
              <button type="button" class="reserve-dates-btn reserve-mobile-btn reserve-dates-btn-rooms-m">
                <span class="reserve-dates-text reserve-dates-text-rooms-m">${getPlaceholder(
                  "bookbarArrivaldepart",
                  "Arrival / Depart"
                )}</span>
                <img class="reserve-chevron chevron-dates chevron-dates-rooms-m" src="/icons/chevron_down.svg" alt="Open calendar" />
              </button>
              <div class="reserve-separator"></div>
              <button type="button" class="reserve-guests-btn reserve-mobile-btn reserve-guests-btn-rooms-m">
                <span class="reserve-guests-text reserve-guests-text-rooms-m">2 ${getPlaceholder(
                  "bookbarGuest",
                  "Guests"
                )}</span>
                <img class="reserve-chevron chevron-guests chevron-guests-rooms-m" src="/icons/chevron_down.svg" alt="Open guests" />
              </button>
            </div>
            <button type="submit" class="reserve-submit reserve-submit-rooms-m">
              <span>${getPlaceholder("accomodationBook", "Book")}</span>
            </button>
          </form>
        </div>
      `,
      Wellbeing: `
        <div class="hero-reserve-bar">
          <form class="reserve-form">
            <div class="reserve-fields">
              <button type="button" class="reserve-link-btn reserve-mobile-btn">
                <span class="reserve-dates-text">${getPlaceholder(
                  "speakWithUsReservation",
                  "Speak with us to make a reservation"
                )}</span>
              </button>
            <button type="submit" class="reserve-submit reserve-submit-wellbeing">
              <span>${getPlaceholder(
                "wellbeingGetintouch",
                "Get in touch"
              )}</span>
            </button>
            </div>
          </form>
        </div>
      `,
      "Drink & Dine": `
        <div class="hero-reserve-bar">
          <form class="reserve-form">
            <div class="reserve-fields">
              <button type="button" class="reserve-link-btn reserve-mobile-btn">
                <span class="reserve-dates-text">${getPlaceholder(
                  "speakWithUsReservation",
                  "Speak with us to make a reservation"
                )}</span>
              </button>
              <button type="submit" class="reserve-submit reserve-submit-drinkdine">
              <span>${getPlaceholder(
                "drinkdineGetintouch",
                "Get in touch"
              )}</span>
            </button>
            </div>
          </form>
        </div>
      `,
      "Events & Weddings": `
        <div class="hero-reserve-bar">
          <form class="reserve-form reserve-form-events">
            <div class="reserve-fields">
              <button type="button" class="reserve-occasions-btn reserve-mobile-btn reserve-occasions-btn-events">
                <span class="reserve-occasions-text reserve-occasions-text-events">${getPlaceholder(
                  "eventsSelect",
                  "Select an Occasion"
                )}</span>
                <img class="reserve-chevron chevron-occasions chevron-occasions-events" src="/icons/chevron_down.svg" alt="Open occasions" />
              </button>
            </div>
            <button type="submit" class="reserve-submit reserve-submit-events">
              <span>${getPlaceholder("eventsEnquire", "Enquire")}</span>
            </button>
          </form>
        </div>
      `,
    },
  };
}

// Function to generate occasions map with placeholders
function generateOccasionsMap() {
  return {
    Wellbeing: [
      {
        image: "/img/dropdown/wellbeing/wellbeing01.png",
        title: getPlaceholder(
          "dropdownOsakaWellbeingBodytreatment",
          "Body Treatment"
        ),
        description: getPlaceholder(
          "dropdownOsakaWellbeingBodytreatmentSubtitle",
          "Skin-deep renewal"
        ),
      },
      {
        image: "/img/dropdown/wellbeing/wellbeing02.png",
        title: getPlaceholder(
          "dropdownOsakaWellbeingFacial",
          "Facial Treatment"
        ),
        description: getPlaceholder(
          "dropdownOsakaWellbeingFacialSubtitle",
          "Tailored skincare rituals"
        ),
      },
      {
        image: "/img/dropdown/wellbeing/wellbeing03.png",
        title: getPlaceholder(
          "dropdownOsakaWellbeingFitness",
          "Fitness & Mindfulness"
        ),
        description: getPlaceholder(
          "dropdownOsakaWellbeingFitnessSubtitle",
          "Balance body and mind"
        ),
      },
      {
        image: "/img/dropdown/wellbeing/wellbeing04.png",
        title: getPlaceholder(
          "dropdownOsakaWellbeingHealthtech",
          "Health-Tech Therapies"
        ),
        description: getPlaceholder(
          "dropdownOsakaWellbeingHealthtechSubtitle",
          "Tech-powered treatments"
        ),
      },
      {
        image: "/img/dropdown/wellbeing/wellbeing05.png",
        title: getPlaceholder(
          "dropdownOsakaWellbeingPackage",
          "Wellness Package"
        ),
        description: getPlaceholder(
          "dropdownOsakaWellbeingPackageSubtitle",
          "Curated wellness journeys"
        ),
      },
    ],
    "Drink & Dine": [
      {
        image: "/img/dropdown/drink-dine/drinkdine01.png",
        title: getPlaceholder("dropdownOsakaRestaurantNijiri", "Nijiri"),
        description: getPlaceholder(
          "dropdownOsakaRestaurantNijiriSubtitle",
          "Tea and light bites"
        ),
      },
      {
        image: "/img/dropdown/drink-dine/drinkdine03.png",
        title: getPlaceholder("dropdownOsakaRestaurantInaki", "IÑAKI"),
        description: getPlaceholder(
          "dropdownOsakaRestaurantInakiSubtitle",
          "Flavours of Basque tradition"
        ),
      },
      {
        image: "/img/dropdown/drink-dine/drinkdine02.png",
        title: getPlaceholder("dropdownOsakaRestaurantBarin", "Barin"),
        description: getPlaceholder(
          "dropdownOsakaRestaurantBarinSubtitle",
          "Flame-grilled premium cuts"
        ),
      },
      {
        image: "/img/dropdown/drink-dine/drinkdine04.png",
        title: getPlaceholder(
          "dropdownOsakaRestaurantSonata",
          "Sonata Bar & Lounge"
        ),
        description: getPlaceholder(
          "dropdownOsakaRestaurantSonataSubtitle",
          "Mixology meets sound"
        ),
      },
      {
        image: "/img/dropdown/drink-dine/drinkdine05.png",
        title: getPlaceholder("dropdownOsakaRestaurantP72", "P72"),
        description: getPlaceholder(
          "dropdownOsakaRestaurantP72Subtitle",
          "Farm-to-table dining"
        ),
      },
    ],
    "Events & Weddings": [
      {
        image: "/img/dropdown/wedding/wedding01.png",
        title: getPlaceholder("dropdownOsakaEventsWedding", "Weddings"),
        description: getPlaceholder(
          "dropdownOsakaEventsWeddingSubtitle",
          "Timeless sacred vows"
        ),
      },
      {
        image: "/img/dropdown/wedding/wedding02.png",
        title: getPlaceholder(
          "dropdownOsakaEventsConferences",
          "Conferences & Meetings"
        ),
        description: getPlaceholder(
          "dropdownOsakaEventsConferencesSubtitle",
          "Refined collaborative spaces"
        ),
      },
    ],
  };
}

// Function to generate occasions map for Maldives with placeholders
function generateOccasionsMapMaldives() {
  return {
    "Events & Weddings": [
      {
        image: "/img/dropdown/wedding/wedding-maldives-01.png",
        title: getPlaceholder("eventsWedding", "Weddings"),
        description: getPlaceholder(
          "eventsWeddingSubtitle",
          "Private island vows"
        ),
      },
      {
        image: "/img/dropdown/wedding/wedding-maldives-02.png",
        title: getPlaceholder("eventsCelebrations", "Celebrations"),
        description: getPlaceholder(
          "eventsCelebrationsSubtitle",
          "Oceanfront adventures"
        ),
      },
      {
        image: "/img/dropdown/wedding/wedding-maldives-03.png",
        title: getPlaceholder("eventsHoneymoons", "Honeymoons"),
        description: getPlaceholder(
          "eventsHoneymoonsSubtitle",
          "Intimate island escapes"
        ),
      },
      {
        image: "/img/dropdown/wedding/wedding-maldives-04.png",
        title: getPlaceholder("eventsCorporateretreats", "Corporate Retreats"),
        description: getPlaceholder(
          "eventsCorporateretreatsSubtitle",
          "Creative group sessions"
        ),
      },
      {
        image: "/img/dropdown/wedding/wedding-maldives-05.png",
        title: getPlaceholder("eventsWellnessevents", "Wellness Events"),
        description: getPlaceholder(
          "eventsWellnesseventsSubtitle",
          "Journeys of restoration"
        ),
      },
    ],
  };
}

export function getLocationFromUrl(url = window.location.pathname) {
  if (url.includes("/maldives/")) return "maldives";
  return "osaka";
}

// Dropdown manager class to handle multiple dropdowns
class DropdownManager {
  constructor() {
    this.activeDropdowns = new Map();
    this.transitionDuration = 300;
  }

  closeAll() {
    this.activeDropdowns.forEach(({ popup, chevron, cleanup }) => {
      // Start fade-out animation
      if (popup) {
        popup.classList.remove("visible");
        setTimeout(() => {
          if (popup && popup.parentNode) {
            popup.parentNode.removeChild(popup);
          }
        }, this.transitionDuration);
      } else {
        if (popup && popup.parentNode) {
          popup.parentNode.removeChild(popup);
        }
      }

      if (chevron) {
        chevron.classList.remove("rotated");
      }
      if (cleanup) {
        cleanup();
      }
    });
    this.activeDropdowns.clear();
  }

  closeDropdown(key) {
    const dropdown = this.activeDropdowns.get(key);
    if (dropdown) {
      const { popup, chevron, cleanup } = dropdown;

      // Start fade-out animation
      if (popup) {
        popup.classList.remove("visible");
        setTimeout(() => {
          if (popup && popup.parentNode) {
            popup.parentNode.removeChild(popup);
          }
        }, this.transitionDuration);
      } else {
        if (popup && popup.parentNode) {
          popup.parentNode.removeChild(popup);
        }
      }

      if (chevron) {
        chevron.classList.remove("rotated");
      }
      if (cleanup) {
        cleanup();
      }
      this.activeDropdowns.delete(key);
    }
  }

  openDropdown(key, popup, chevron, cleanup = null) {
    this.closeAll();

    this.activeDropdowns.set(key, { popup, chevron, cleanup });

    if (chevron) {
      chevron.classList.add("rotated");
    }

    setTimeout(() => {
      popup.classList.add("visible");
    }, 10);
  }

  isOpen(key) {
    return this.activeDropdowns.has(key);
  }
}

function detectSingleFieldReserveBar(container) {
  const reserveBars = container.querySelectorAll(".hero-reserve-bar");

  reserveBars.forEach((bar) => {
    const fields = bar.querySelectorAll(
      ".reserve-fields > *:not(.reserve-separator)"
    );
    const linkButtons = bar.querySelectorAll(".reserve-link-btn");

    bar.classList.remove("single-field", "has-link-btn");

    if (fields.length === 1 || linkButtons.length > 0) {
      bar.classList.add("single-field");

      if (linkButtons.length > 0) {
        bar.classList.add("has-link-btn");
      }
    }
  });
}

// Utility to setup dropdowns and calendar for a given container
export function setupReserveBarFunctionality(container, occasionsData = []) {
  const dropdownManager = new DropdownManager();
  // Detect and apply single-field class
  detectSingleFieldReserveBar(container);

  // Calendar
  const reserveDatesBtn =
    container.querySelector(".reserve-dates-btn-rooms") ||
    container.querySelector(".reserve-dates-btn-rooms-m") ||
    container.querySelector(".reserve-dates-btn");
  let selectedRange = null;

  if (reserveDatesBtn) {
    const calendarKey = "calendar";
    reserveDatesBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const chevron = reserveDatesBtn.querySelector(".chevron-dates");

      if (dropdownManager.isOpen(calendarKey)) {
        dropdownManager.closeDropdown(calendarKey);
        return;
      }

      const calendarPopup = createCalendar({
        onSelect: (selection) => {
          selectedRange = selection.value;
          if (selection && selection.display) {
            reserveDatesBtn.querySelector(".reserve-dates-text").textContent =
              selection.display;
          } else {
            reserveDatesBtn.querySelector(".reserve-dates-text").textContent =
              getPlaceholder("bookbarArrivaldepart", "Arrival / Depart");
          }
        },
        onDone: () => {
          dropdownManager.closeDropdown(calendarKey);
        },
        hideDoneButton: false,
        placeholders: placeholders,
      });

      reserveDatesBtn.parentNode.appendChild(calendarPopup);
      dropdownManager.openDropdown(calendarKey, calendarPopup, chevron);
    });
  }

  // Guests dropdown
  const reserveGuestsBtn =
    container.querySelector(".reserve-guests-btn-rooms") ||
    container.querySelector(".reserve-guests-btn-rooms-m") ||
    container.querySelector(".reserve-guests-btn");
  let adults = 2;
  let children = 0;

  if (reserveGuestsBtn) {
    const guestsKey = "guests";
    reserveGuestsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const chevron = reserveGuestsBtn.querySelector(".chevron-guests");

      if (dropdownManager.isOpen(guestsKey)) {
        dropdownManager.closeDropdown(guestsKey);
        return;
      }

      const guestsPopup = document.createElement("div");
      guestsPopup.className = "guests-dropdown";
      guestsPopup.innerHTML = `
      <div class="guests-row">
        <div class="guests-label">${getPlaceholder(
          "bookbarAdults",
          "Adults"
        )}</div>
        <div class="guests-controls">
          <button type="button" class="guests-minus" data-type="adults" aria-label="Decrease adults">
            <img src="/icons/minus.svg" alt="Minus" width="24" height="24" />
          </button>
          <span class="guests-count" data-type="adults">${adults}</span>
          <button type="button" class="guests-plus" data-type="adults" aria-label="Increase adults">
            <img src="/icons/add.svg" alt="Add" width="24" height="24" />
          </button>
        </div>
      </div>
      <div class="guests-row">
        <div class="guests-label">${getPlaceholder(
          "bookbarChildren",
          "Children"
        )}</div>
        <div class="guests-controls">
          <button type="button" class="guests-minus" data-type="children" aria-label="Decrease children">
            <img src="/icons/minus.svg" alt="Minus" width="24" height="24" />
          </button>
          <span class="guests-count" data-type="children">${children}</span>
          <button type="button" class="guests-plus" data-type="children" aria-label="Increase children">
            <img src="/icons/add.svg" alt="Add" width="24" height="24" />
          </button>
        </div>
      </div>
      <button type="button" class="events-filter-done-btn cta-button guests-done-btn">
        ${getPlaceholder("doneButton", "Done")}
      </button>
    `;
      reserveGuestsBtn.parentNode.appendChild(guestsPopup);

      const doneBtn = guestsPopup.querySelector(".guests-done-btn");
      doneBtn.addEventListener("click", () => {
        dropdownManager.closeDropdown(guestsKey);
      });

      guestsPopup.addEventListener("click", (ev) => {
        const btn = ev.target.closest("button");
        if (!btn) return;

        if (btn.classList.contains("guests-done-btn")) return;

        const type = btn.dataset.type;
        if (btn.classList.contains("guests-plus")) {
          if (type === "adults") adults++;
          if (type === "children") children++;
        }
        if (btn.classList.contains("guests-minus")) {
          if (type === "adults" && adults > 0) adults--;
          if (type === "children" && children > 0) children--;
        }
        guestsPopup.querySelector(
          '.guests-count[data-type="adults"]'
        ).textContent = adults;
        guestsPopup.querySelector(
          '.guests-count[data-type="children"]'
        ).textContent = children;
        const totalGuests = adults + children;
        reserveGuestsBtn.querySelector(".reserve-guests-text").textContent =
          totalGuests === 1
            ? `1 ${getPlaceholder("bookbarGuest", "Guest")}`
            : `${totalGuests} ${getPlaceholder("bookbarGuest", "Guests")}`;
      });

      function handleClickOutside(event) {
        if (
          !guestsPopup.contains(event.target) &&
          !reserveGuestsBtn.contains(event.target)
        ) {
          dropdownManager.closeDropdown(guestsKey);
          document.removeEventListener("mousedown", handleClickOutside);
        }
      }

      const cleanup = () => {
        document.removeEventListener("mousedown", handleClickOutside);
      };

      setTimeout(
        () => document.addEventListener("mousedown", handleClickOutside),
        0
      );

      dropdownManager.openDropdown(guestsKey, guestsPopup, chevron, cleanup);
    });
  }

  // Occasions dropdown
  const reserveOccasionsBtn =
    container.querySelector(".reserve-occasions-btn-wellbeing") ||
    container.querySelector(".reserve-occasions-btn-drinkdine") ||
    container.querySelector(".reserve-occasions-btn-events") ||
    container.querySelector(".reserve-occasions-btn");

  if (reserveOccasionsBtn && occasionsData.length > 0) {
    const occasionsKey = "occasions";
    reserveOccasionsBtn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const chevron = reserveOccasionsBtn.querySelector(".chevron-occasions");

      if (dropdownManager.isOpen(occasionsKey)) {
        dropdownManager.closeDropdown(occasionsKey);
        return;
      }

      const occasionsPopup = document.createElement("div");
      occasionsPopup.className = "occasions-dropdown";

      // Determine dropdown title based on button class
      let dropdownTitle = getPlaceholder("eventsSelect", "Select an Occasion");
      if (
        reserveOccasionsBtn.classList.contains(
          "reserve-occasions-btn-wellbeing"
        )
      ) {
        dropdownTitle = getPlaceholder(
          "dropdownOsakaWellbeingSelect",
          "Select a Treatment"
        );
      } else if (
        reserveOccasionsBtn.classList.contains(
          "reserve-occasions-btn-drinkdine"
        )
      ) {
        dropdownTitle = getPlaceholder(
          "dropdownOsakaRestaurantSelect",
          "Select a Restaurant"
        );
      }

      occasionsPopup.innerHTML = `
       
        <div class="occasions-items">
          ${occasionsData
            .map(
              (o) => `
            <div class="occasion-item">
              <img src="${o.image}" alt="${o.title}" class="occasion-image" />
              <div class="occasion-info">
                <div class="occasion-title ">${o.title}</div>
                <div class="occasion-description">${o.description}</div>
              </div>
            </div>
          `
            )
            .join("")}
        </div>
      `;
      reserveOccasionsBtn.parentNode.appendChild(occasionsPopup);

      const occasionItems = occasionsPopup.querySelectorAll(".occasion-item");
      occasionItems.forEach((item) => {
        item.addEventListener("click", () => {
          const title = item.querySelector(".occasion-title").textContent;
          const textSpan = reserveOccasionsBtn.querySelector(
            ".reserve-occasions-text"
          );
          if (textSpan) textSpan.textContent = title;
          dropdownManager.closeDropdown(occasionsKey);
        });
      });

      dropdownManager.openDropdown(occasionsKey, occasionsPopup, chevron);
    });
  }

  // --- Add submit handler for Rooms & Suites (Osaka) ---
  const reserveForm = container.querySelector(".reserve-form-rooms");
  if (
    reserveForm &&
    container.querySelector(".reserve-guests-btn-rooms") &&
    !container.querySelector(".reserve-occasions-btn")
  ) {
    reserveForm.addEventListener("submit", (e) => {
      e.preventDefault();

      const location = getLocationFromUrl();
      const url = generateSynxisURL(selectedRange, adults, children, location);
      window.open(url, "_blank");
    });
  }

  // --- Add submit handler for Rooms & Suites (Maldives) ---
  const reserveFormM = container.querySelector(".reserve-form-rooms-m");
  if (
    reserveFormM &&
    container.querySelector(".reserve-guests-btn-rooms-m") &&
    !container.querySelector(".reserve-occasions-btn")
  ) {
    reserveFormM.addEventListener("submit", (e) => {
      e.preventDefault();

      const location = getLocationFromUrl();
      const url = generateSynxisURL(selectedRange, adults, children, location);
      window.open(url, "_blank");
    });
  }

  // --- Add submit handler for Wellbeing Osaka ---
  const wellbeingLinks = {
    [getPlaceholder("dropdownOsakaWellbeingBodytreatment", "Body Treatment")]:
      "https://ap.spatime.com/ptosk/33467900/offering/33551264?types=1,0,4,8,16",
    [getPlaceholder("dropdownOsakaWellbeingFacial", "Facial Treatment")]:
      "https://ap.spatime.com/ptosk/33467900/offering/33640363?types=1,0,4,8,16",
    [getPlaceholder("dropdownOsakaWellbeingFitness", "Fitness & Mindfulness")]:
      "https://ap.spatime.com/ptosk/33467900/offering/33551265?types=1,0,4,8,16",
    [getPlaceholder(
      "dropdownOsakaWellbeingHealthtech",
      "Health-Tech Therapies"
    )]:
      "https://ap.spatime.com/ptosk/33467900/offering/33553826?types=1,0,4,8,16",
    [getPlaceholder("dropdownOsakaWellbeingPackage", "Wellness Package")]:
      "https://ap.spatime.com/ptosk/33467900/offering/33640364?types=1,0,4,8,16",
  };

  const reserveFormWellbeing =
    container.querySelector(".reserve-form-wellbeing") ||
    container.querySelector(".reserve-form");

  if (
    reserveFormWellbeing &&
    !container.querySelector(".reserve-guests-btn") &&
    !container.querySelector(".reserve-occasions-btn-wellbeing") &&
    container.querySelector(".reserve-submit-wellbeing")
  ) {
    reserveFormWellbeing.addEventListener("submit", (e) => {
      e.preventDefault();
      if (window.GeneralModalManager) {
        window.GeneralModalManager.openModal("wellness");
      } else {
        window.location.href = "/wellnessEnquiry";
      }
    });
  }

  if (
    reserveFormWellbeing &&
    container.querySelector(".reserve-occasions-btn-wellbeing") &&
    !container.querySelector(".reserve-guests-btn")
  ) {
    reserveFormWellbeing.addEventListener("submit", (e) => {
      e.preventDefault();

      const occasionText = container.querySelector(
        ".reserve-occasions-text-wellbeing"
      );
      const selectedOccasion = occasionText
        ? occasionText.textContent.trim()
        : "";

      const link = wellbeingLinks[selectedOccasion];
      if (!link) {
        console.warn(
          getPlaceholder("pleaseSelectTreatment", "Please select a treatment.")
        );
        return;
      }
      window.open(link, "_blank");
    });
  }

  // --- Add submit handler for Drink & Dine Osaka ---

  // Function to get language-specific drink & dine links
  function getDrinkDineLinks() {
    const lang = document.documentElement.lang || "en";

    // Default links (English)
    const defaultLinks = {
      [getPlaceholder("dropdownOsakaRestaurantBarin", "Barin")]:
        "https://www.tablecheck.com/shops/patinahotels-osaka-barin/reserve",
      ["IÑAKI"]:
        "https://www.tablecheck.com/shops/patinahotels-osaka-inaki/reserve",
      [getPlaceholder("dropdownOsakaRestaurantSonata", "Sonata Bar & Lounge")]:
        "https://www.tablecheck.com/shops/patinahotels-osaka-sonata-lounge-bar/reserve",
      [getPlaceholder("dropdownOsakaRestaurantP72", "P72")]:
        "https://www.tablecheck.com/shops/patinahotels-osaka-p72/reserve",
      [getPlaceholder("dropdownOsakaRestaurantNijiri", "Nijiri")]:
        "https://www.tablecheck.com/shops/patinahotels-osaka-nijiri/reserve",
    };

    // Language-specific link configurations
    const languageLinks = {
      ja: {
        [getPlaceholder("dropdownOsakaRestaurantBarin", "Barin")]:
          "https://www.tablecheck.com/ja/shops/patinahotels-osaka-barin/reserve",
        ["IÑAKI"]:
          "https://www.tablecheck.com/ja/shops/patinahotels-osaka-inaki/reserve",
        [getPlaceholder(
          "dropdownOsakaRestaurantSonata",
          "Sonata Bar & Lounge"
        )]:
          "https://www.tablecheck.com/ja/shops/patinahotels-osaka-sonata-lounge-bar/reserve",
        [getPlaceholder("dropdownOsakaRestaurantP72", "P72")]:
          "https://www.tablecheck.com/ja/shops/patinahotels-osaka-p72/reserve",
        [getPlaceholder("dropdownOsakaRestaurantNijiri", "Nijiri")]:
          "https://www.tablecheck.com/ja/shops/patinahotels-osaka-nijiri/reserve",
      },
      zh: {
        [getPlaceholder("dropdownOsakaRestaurantBarin", "Barin")]:
          "https://www.tablecheck.com/zh-CN/shops/patinahotels-osaka-barin/reserve",
        ["IÑAKI"]:
          "https://www.tablecheck.com/zh-CN/shops/patinahotels-osaka-inaki/reserve",
        [getPlaceholder(
          "dropdownOsakaRestaurantSonata",
          "Sonata Bar & Lounge"
        )]:
          "https://www.tablecheck.com/zh-CN/shops/patinahotels-osaka-sonata-lounge-bar/reserve",
        [getPlaceholder("dropdownOsakaRestaurantP72", "P72")]:
          "https://www.tablecheck.com/zh-CN/shops/patinahotels-osaka-p72/reserve",
        [getPlaceholder("dropdownOsakaRestaurantNijiri", "Nijiri")]:
          "https://www.tablecheck.com/zh-CN/shops/patinahotels-osaka-nijiri/reserve",
      },
      ko: {
        [getPlaceholder("dropdownOsakaRestaurantBarin", "Barin")]:
          "https://www.tablecheck.com/ko/shops/patinahotels-osaka-barin/reserve",
        ["IÑAKI"]:
          "https://www.tablecheck.com/ko/shops/patinahotels-osaka-inaki/reserve",
        [getPlaceholder(
          "dropdownOsakaRestaurantSonata",
          "Sonata Bar & Lounge"
        )]:
          "https://www.tablecheck.com/ko/shops/patinahotels-osaka-sonata-lounge-bar/reserve",
        [getPlaceholder("dropdownOsakaRestaurantP72", "P72")]:
          "https://www.tablecheck.com/ko/shops/patinahotels-osaka-p72/reserve",
        [getPlaceholder("dropdownOsakaRestaurantNijiri", "Nijiri")]:
          "https://www.tablecheck.com/ko/shops/patinahotels-osaka-nijiri/reserve",
      },
    };

    // Return language-specific links or default to English
    return languageLinks[lang] || defaultLinks;
  }

  const drinkDineLinks = getDrinkDineLinks();

  const reserveFormDrinkDine =
    container.querySelector(".reserve-form-drinkdine") ||
    container.querySelector(".reserve-form");
  if (
    reserveFormDrinkDine &&
    container.querySelector(".reserve-occasions-btn-drinkdine") &&
    !container.querySelector(".reserve-guests-btn") &&
    drinkDineLinks
  ) {
    reserveFormDrinkDine.addEventListener("submit", (e) => {
      e.preventDefault();

      const occasionText = container.querySelector(
        ".reserve-occasions-text-drinkdine"
      );
      const selectedOccasion = occasionText
        ? occasionText.textContent.trim()
        : "";

      const link = drinkDineLinks[selectedOccasion];
      if (!link) {
        console.warn(
          getPlaceholder(
            "pleaseSelectRestaurant",
            "Please select a restaurant."
          )
        );
        return;
      }
      window.open(link, "_blank");
    });
  }

  // --- Add submit handler for Maldives Drink & Dine ---
  const reserveFormMaldivesDrinkDine =
    container.querySelector(".reserve-form") &&
    !container.querySelector(".reserve-occasions-btn-drinkdine") &&
    !container.querySelector(".reserve-guests-btn") &&
    container.querySelector(".reserve-submit-drinkdine");

  if (reserveFormMaldivesDrinkDine) {
    container.querySelector(".reserve-form").addEventListener("submit", (e) => {
      e.preventDefault();
      if (window.GeneralModalManager) {
        window.GeneralModalManager.openModal("restaurant");
      } else {
        window.location.href = "/restaurantEnquiry";
      }
    });
  }

  // --- Add submit handler for Events & Weddings ---
  const eventsLinks = {
    Wedding: "/weddingEnquiry",
    Weddings: "/weddingEnquiry",

    [getPlaceholder("eventsWedding", "Weddings")]: "/weddingEnquiry",
    [getPlaceholder(
      "dropdownOsakaEventsConferences",
      "Conferences & Meetings"
    )]: "/eventsEnquiry",
    [getPlaceholder("eventsCelebrations", "Celebrations")]: "/eventsEnquiry",
    [getPlaceholder("eventsHoneymoons", "Honeymoons")]: "/eventsEnquiry",
    [getPlaceholder("eventsCorporateretreats", "Corporate Retreats")]:
      "/eventsEnquiry",
    [getPlaceholder("eventsWellnessevents", "Wellness Events")]:
      "/wellnessEnquiry",
  };

  const reserveFormEvents = container.querySelector(".reserve-form-events");
  if (
    reserveFormEvents &&
    container.querySelector(".reserve-occasions-btn-events") &&
    !container.querySelector(".reserve-guests-btn") &&
    occasionsData.length > 0 &&
    Object.keys(eventsLinks).length > 0
  ) {
    reserveFormEvents.addEventListener("submit", (e) => {
      e.preventDefault();

      const occasionText = container.querySelector(
        ".reserve-occasions-text-events"
      );
      const selectedOccasion = occasionText
        ? occasionText.textContent.trim()
        : "";

      const link = eventsLinks[selectedOccasion];
      if (!link) {
        console.warn(
          getPlaceholder("pleaseSelectOccasion", "Please select an occasion.")
        );
        return;
      }

      let anchor = document.createElement("a");
      anchor.href = link;
      anchor.style.display = "none";
      document.body.appendChild(anchor);
      anchor.click();
      document.body.removeChild(anchor);
    });
  }

  // --- CLONE SUBMIT BUTTON FOR MOBILE ---
  const reserveFormForMobile =
    container.querySelector(".reserve-form-rooms") ||
    container.querySelector(".reserve-form-rooms-m") ||
    container.querySelector(".reserve-form-wellbeing") ||
    container.querySelector(".reserve-form-drinkdine") ||
    container.querySelector(".reserve-form-events") ||
    container.querySelector(".reserve-form");
  if (reserveFormForMobile) {
    const submitBtn = reserveFormForMobile.querySelector(
      'button[type="submit"]'
    );
    if (submitBtn && !container.querySelector(".reserve-submit-mobile-btn")) {
      const mobileBtn = submitBtn.cloneNode(true);
      mobileBtn.classList.add("reserve-submit-mobile-btn");
      const newMobileBtn = mobileBtn.cloneNode(true);
      // Insert after the .hero-reserve-bar
      const heroReserveBar = container.querySelector(".hero-reserve-bar");
      if (heroReserveBar) {
        heroReserveBar.after(newMobileBtn);
      } else {
        container.appendChild(newMobileBtn);
      }
      // Attach submit logic
      newMobileBtn.addEventListener("click", (e) => {
        e.preventDefault();
        submitBtn.click();
      });
    }
  }
}

// Initialize the module with placeholders
export async function initializeReserveUtils() {
  await initializePlaceholders();

  return {
    reserveBars: generateReserveBars(),
    occasionsMap: generateOccasionsMap(),
    occasionsMapMaldives: generateOccasionsMapMaldives(),
  };
}
