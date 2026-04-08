import { isUniversalEditor } from "../../scripts/aem.js";
import {
  createTextImageModal,
  createSignOutDialog,
} from "../../scripts/delayed.js";
import { getGhaProfile } from "../../scripts/scripts.js";
import { fetchPlaceholders, getLanguage } from "../../scripts/utils.js";

// Uncomment the following lines to use hardcoded data for testing
// const data = {
//   id: 324681471,
//   firstName: "Marcellius",
//   lastName: "Marcellius",
//   email: "marcellius@aleph-labs.com",
//   membershipFrom: "2025-07-25",
//   membershipTo: "2027-12-31",
//   membershipCardNo: "8285440901",
//   membershipLevel: "SILVER",
//   earnedDollar: 0.0,
//   availableDollar: 0.0,
//   usedDollar: 0.0,
//   expiredDollar: 0.0,
//   totalNight: 0,
//   eligibleNight: 0,
// };

const membershipLevelLangMap = {
  silver: {
    en: "silver",
    zh: "白银会员",
    ja: "シルバー",
    ko: "실버",
  },
  gold: {
    en: "gold",
    zh: "黄金会员",
    ja: "ゴールド",
    ko: "골드",
  },
  platinum: {
    en: "platinum",
    zh: "铂金会员",
    ja: "プラチナ",
    ko: "플래티넘",
  },
  titanium: {
    en: "titanium",
    zh: "钛金会员",
    ja: "チタン",
    ko: "티타늄",
  },
  red: {
    en: "red",
    zh: "红卡会员",
    ja: "レッド",
    ko: "레드",
  },
};

function loadingScreen() {
  // Show loading spinner
  const spinner = document.createElement("div");
  spinner.className = "spinner";
  document.body.appendChild(spinner);
  spinner.innerHTML = `  <div class="dashboard-bg-wrapper-bg">
      <img src="/img/dashboard-bg.jpg" alt="Dashboard background" class="dashboard-bg">
    </div>
   `;
}

loadingScreen();

export default async function decorate(block) {
  if (isUniversalEditor()) return;
  const lang = getLanguage();
  const placeholders = await fetchPlaceholders();

  const currentUrl = window.location.href;
  const { data } = await getGhaProfile();
  if (!data && currentUrl.includes("/gha-discovery/profile")) {
    window.location.href = "/gha-discovery";
    return;
  }

  function formatDateShort(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    if (isNaN(date)) return "";
    const day = String(date.getDate()).padStart(2, "0");
    const month = date.toLocaleString("en-US", { month: "short" });
    const year = String(date.getFullYear()).slice(-2);
    return `${day} ${month} ${year}`;
  }

  const rows = [...block.children];
  const benefitsContent = rows[0];

  // Filter benefitsContent to only keep the <pre> and its content that matches data.membershipLevel
  if (benefitsContent) {
    // Clone to avoid mutating original
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = benefitsContent.innerHTML;
    const preBlocks = Array.from(tempDiv.querySelectorAll("pre"));
    const level = (data.membershipLevel || "").trim().toLowerCase();
    let found = false;
    preBlocks.forEach((pre) => {
      const preText = (pre.textContent || "").trim().toLowerCase();
      if (
        preText === membershipLevelLangMap[level][lang] ||
        preText === level
      ) {
        if (!found) {
          found = true;
        } else {
          // Remove duplicate matches (shouldn't happen, but just in case)
          pre.remove();
        }
      } else {
        // Remove this <pre> and the next sibling elements up to the next <pre> or end
        let el = pre;
        while (
          el &&
          el.nextElementSibling &&
          el.nextElementSibling.tagName !== "PRE"
        ) {
          el.nextElementSibling.remove();
        }
        pre.remove();
      }
    });
    // Remove the final <pre> (the one with the membership level name) from the filtered content
    const filteredPre = tempDiv.querySelector("pre");
    if (filteredPre) filteredPre.remove();
    benefitsContent.innerHTML = tempDiv.innerHTML;
  }

  // Helper to get month and year in MM/YY format (e.g., "2025-07-25" => "07/25")
  function getMonthYear(dateStr) {
    if (!dateStr) return "";
    const date = new Date(dateStr);
    const mm = String(date.getMonth() + 1).padStart(2, "0");
    const yy = String(date.getFullYear()).slice(-2);
    return `${mm}/${yy}`;
  }

  function capitalizeFirstLetter(val) {
    return (
      String(val.toLowerCase()).charAt(0).toUpperCase() +
      String(val.toLowerCase()).slice(1)
    );
  }

  // Render dashboard content after API fetch
  block.innerHTML = `
    <div class="dashboard-bg-wrapper">
      <img src="/img/dashboard-bg.jpg" alt="Dashboard background" class="dashboard-bg">
    </div>
    
    <section class="left-col">
      <div class="greeting">
        <p class="text-l2">${placeholders.ghaGreeting || "Welcome Back,"}</p>
        <h2 class="text-h1"><span>${capitalizeFirstLetter(
          data.firstName
        )}</span> <span>${capitalizeFirstLetter(data.lastName)}</span></h2>
      </div>
      <div class="details">
        <div class="details-item">
          <p class="text-l2 text-text-white-700">${
            placeholders.ghaEmailLabel || "Email"
          }</p>
          <p class="text-p1">${data.email}</p>
        </div>
        <!--
        <div class="details-item">
          <p class="text-l2 text-text-white-700">${
            placeholders.ghaDateOfBirthLabel || "Date of Birth"
          }</p>
          <p class="text-p1">${
            formatDateShort(data.dateOfBirth) || "1993-08-16"
          } </p>
        </div>
        -->
      </div>
    </section>

    <section class="right-col">
      <section class="membership-details">
        <div class="card">
          <h3 class="text-h3">${
            placeholders.ghaCardDetailsHeader || "Membership Card"
          }</h3>
          <div class="card-image-wrapper">
            <img src="/img/cards/${data.membershipLevel.toLowerCase()}-gha-card.png" alt="Membership Card" class="membership-card-image">

            <div class="card-details">
              <div class="left">
                <p>GHA DISCOVERY Member</p>
                <p>${data.membershipCardNo}</p>
              </div>
              <div class="right">
                <p>${
                  data.membershipLevel.charAt(0).toUpperCase() +
                  data.membershipLevel.slice(1).toLowerCase()
                }</p>
                <p>Expires: ${getMonthYear(data.membershipTo)}</p>
              </div>
            </div>
          </div>
          <div class="details">
            <div class="details-item">
              <p class="text-l2 text-text-white-700">${
                placeholders.ghaAvailableDollarLabel || "Available D$"
              }</p>
              <p class="text-p1">${data.availableDollar}</p>
            </div>    
            <div class="details-item">
              <p class="text-l2 text-text-white-700">${
                placeholders.ghaLifetimeEarnedLabel || "Lifetime D$ Earned"
              }</p>
              <p class="text-p1">${data.earnedDollar}</p>
            </div>    
            <div class="details-item">
              <p class="text-l2 text-text-white-700">${
                placeholders.ghaLifetimeUsedLabel || "Lifetime D$ Used"
              }</p>
              <p class="text-p1">${data.usedDollar}</p>
            </div>    
            <div class="details-item">
              <p class="text-l2 text-text-white-700">${
                placeholders.ghaTotalExpiredLabel || "Total D$ Expired"
              }</p>
              <p class="text-p1">${data.expiredDollar}</p>
            </div>    
          </div>
        </div>
  

        <div class="card">
          <h3 class="text-h3">${
            placeholders.ghaMemberDetailsHeader || "Member Balance"
          }</h3>
          <div class="details">
            <div class="details-item">
              <p class="text-l2 text-text-white-700">${
                placeholders.ghaEligibleNightsLabel || "Eligible Nights"
              }</p>
              <p class="text-p1">${data.eligibleNight}</p>
            </div>    
            ${
              data.totalNight
                ? `<div class="details-item">
              <p class="text-l2 text-text-white-700">${
                placeholders.ghaLifetimeNightsLabel || "Lifetime Nights"
              }</p>
              <p class="text-p1">${data.totalNight}</p>
            </div>`
                : ""
            }
            <div class="details-item">
              <p class="text-l2 text-text-white-700">${
                placeholders.ghaValidThroughLabel || "Valid Through"
              }</p>
              <p class="text-p1">${formatDateShort(data.membershipTo)}</p>
            </div>    
            <div class="details-item">
              <p class="text-l2 text-text-white-700">${
                placeholders.ghaMembershipSinceLabel || "Membership Since"
              }</p>
              <p class="text-p1">${formatDateShort(data.membershipFrom)}</p>
            </div>    
            <div class="details-item">
              <p class="text-l2 text-text-white-700">${
                placeholders.ghaMembershipNoLabel || "Membership No."
              }</p>
              <p class="text-p1">${data.membershipCardNo}</p>
            </div>    
          </div>    
          <a href="/benefits" class="cta-link animate-underline">${
            placeholders.ghaViewBenefitsLabel || "View my benefits"
          }</a>
        </div>    
      </section>

      <section class="experience-more">
        <section class="events">
        </section>
        <section class="offers">
        </section>
      </section>
    </section>
              <button class="cta-button sign-out-button mobile">${
                placeholders.globalSignoutButtonText || "SIGN OUT"
              }</button>
  `;

  const eventsListing = document.querySelector(".programs-listings-wrapper");
  const eventsSection = document.querySelector(".events");
  if (eventsListing && eventsSection) {
    eventsSection.replaceWith(eventsListing);
  }

  createTextImageModal(block, benefitsContent, "/benefits");

  /* ----------------------------- Sign Out Modal ----------------------------- */

  const signOutBtn = block.querySelector(".sign-out-button");
  if (signOutBtn) {
    createSignOutDialog({ trigger: signOutBtn });
  }
}
