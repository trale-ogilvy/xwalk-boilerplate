import { languages, countries } from "./dropdown-items.js";
import { getGhaProfile } from "../../scripts/scripts.js";
import { createSignOutDialog } from "../../scripts/delayed.js";
import {
  disableCreateAccountNextButton,
  setupSignInHandler,
  addPasswordToggleButtons,
} from "./gha-banner-utils.js";
import { isUniversalEditor, loadCSS } from "../../scripts/aem.js";
import {
  getBasePathBasedOnEnv,
  fetchPlaceholders,
} from "../../scripts/utils.js";

/*
type
0 - Signed In
1 - Sign In
2 - Create Account
3 - Success
4 - Account Exists
*/
const RECAPTCHA_SITE_KEY = "6LfpYh8rAAAAAPaE-icNeXk4b8ktPXqLKwHhqp6d";

const CREATE_ACCOUNT_API_URL =
  getBasePathBasedOnEnv() + "/bin/chg/member/signup.json";
let type = 1;
let step = 1;
let originalRows = null;
let onload = true;
let region = "EN";

export default async function decorate(block) {
  if (isUniversalEditor()) {
    loadCSS(
      `${window.hlx.codeBasePath}/blocks/gha-banner/gha-banner-author.css`
    );
    return;
  }
  const placeholders = await fetchPlaceholders();

  // Wait for Adobe Target offer before continuing
  if (window.adobe && window.adobe.target) {
    await new Promise((resolve) => {
      adobe.target.getOffer({
        mbox: "newsletter_modal_mbox",
        params: {
          // optional: custom param you want to pass
        },
        success: function (offer) {
          let regionVal = offer[0]?.content || "EN";
          try {
            regionVal =
              typeof regionVal === "string" ? JSON.parse(regionVal) : regionVal;
          } catch {}
          console.log(
            "Target API response:",
            regionVal,
            "Region set to:",
            region
          );
          region = regionVal[0].code || "EN";
          resolve();
        },
        error: function (err) {
          console.warn("Target modal getOffer error", err);
          resolve();
        },
      });
    });
  }

  if (onload) {
    const profileData = await getGhaProfile();
    console.log("Profile data:", profileData);
    sessionStorage.removeItem("gha_step1_cache");

    // If they are signed in, set type to 0
    if (profileData) {
      type = 0;
      step = 1;
    } else {
      type = 1;
      step = 1;
    }
    onload = false;
    console.log("After profile check - type:", type, "step:", step);
  }

  // Cache the original rows on first call
  if (!originalRows) {
    originalRows = [...block.children].map((row) => row.cloneNode(true));
  }
  const rows = originalRows.map((row) => row.cloneNode(true));

  const bannerImage = rows[0].querySelector("picture");
  const modal = document.createElement("div");
  modal.className = "modal-container";

  /* ------------------------------ Sign In Type ----------------------------- */
  const signInFields = rows[1];
  if (type === 0) {
    modal.innerHTML = `
    <div class="signed-in-modal">
      <h2 class="text-h2">${
        placeholders.signedInHeader || "You are currently signed in"
      }</h2>
      <p class="text-p1">${
        placeholders.signedInMessage ||
        "Welcome back to Patina DISCOVERY. Unlock a world of rewards and exclusive experiences today"
      }</p>
      <div class="button-container">
        <button class="cta-link animate-underline sign-out-button">${
          placeholders.globalSignoutButtonText || "SIGN OUT"
        }</button>
        <a href="${
          placeholders.goToProfileButtonLink || "/gha-discovery/profile"
        }" class="cta-button">${
      placeholders.goToProfileButtonText || "GO TO PROFILE"
    }</a>
      </div>
    </div>
    `;
  }

  if (type === 1) {
    const pChildren = Array.from(
      signInFields?.querySelectorAll("p") || []
    ).slice(1);

    let privacyText = "";
    pChildren.forEach((p, idx) => {
      console.log(`pChildren[${idx}]:`, p);
    });

    // Find all paragraphs for the current region
    let regionPrefix = region || "EN";
    privacyText = "";
    let collecting = false;
    let regionParagraphs = [];
    for (let i = 0; i < pChildren.length; i++) {
      const pText = pChildren[i].innerText.trim();
      if (/^[A-Z]{2}:$/.test(pText)) {
        if (pText === `${regionPrefix}:`) {
          collecting = true;
          continue;
        } else if (collecting) {
          // Reached next region, stop collecting
          break;
        }
      }
      if (collecting) {
        regionParagraphs.push(pChildren[i].innerHTML);
      }
    }
    // If nothing found, fallback to EN
    if (regionParagraphs.length === 0) {
      collecting = false;
      for (let i = 0; i < pChildren.length; i++) {
        const pText = pChildren[i].innerText.trim();
        if (/^[A-Z]{2}:$/.test(pText)) {
          if (pText === "EN:") {
            collecting = true;
            continue;
          } else if (collecting) {
            break;
          }
        }
        if (collecting) {
          regionParagraphs.push(pChildren[i].innerHTML);
        }
      }
    }
    // If still nothing found, fallback to first non-prefix paragraph(s)
    if (regionParagraphs.length === 0) {
      for (let i = 0; i < pChildren.length; i++) {
        const pText = pChildren[i].innerText.trim();
        if (!/^[A-Z]{2}:$/.test(pText)) {
          regionParagraphs.push(pChildren[i].innerHTML);
        }
      }
    }
    privacyText = regionParagraphs.join("<br><br>");
    modal.innerHTML = `
      <div class="sign-in-modal">
        <div class="container" data-lenis-prevent>
          <div class="header">
            <h4 class="text-h4">${
              signInFields.querySelector("p").innerText
            }</h4>
          </div>
          <form class="input-fields">
            <div class="input-wrapper">
              <input
                class="pill-dropdown-button"
                autocomplete="email"
                type="email"
                placeholder="${
                  placeholders.signInEmailPlaceholder || "Username or Email*"
                }*"
              />
              <p class="text-l3 error-msg">${
                placeholders.signInEmailErrorText ||
                "Please enter a valid email address."
              }</p>
            </div>
            <div class="input-wrapper">
              <input
              class="pill-dropdown-button"
              autocomplete="current-password"
              type="password"
              placeholder="${
                placeholders.signInPasswordPlaceholder || "Password*"
              }"
              />
              <p class="text-l3 error-msg">${
                placeholders.signInPasswordErrorText ||
                "Please enter a valid password."
              }</p>
            </div>
          </form>
          <a
          href=${
            placeholders.resetPasswordLink ||
            "https://www.ghadiscovery.com/member/forgot_password"
          }
          class="text-l3 text-text-grey-800 animate-underline forgot-password"
          >${placeholders.forgotPasswordLinkText || "Forgot your password?"}</a
          >
          <div class="captcha">
            <div id="html_element1" name="captchaValue"></div>
            <p class="text-l3 error-msg captcha-error-msg">
              ${
                placeholders.captchaErrorText ||
                "Please complete the reCAPTCHA."
              }
            </p>
          </div>
          <div class="button-container">
            <button class="cta-button">${
              placeholders.signInButtonText || "Sign In"
            }</button>
            <button class="cta-link animate-underline create-account-btn">
              ${placeholders.createAccountButtonText || "Create Account"}
            </button>
          </div>
          <div class="privacy-policy">
            <p class="text-l2 text-text-grey-800">
              ${privacyText || ""}
            </p>
          </div>
        </div>
      </div>
    `;

    // Setup sign in handler after rendering
    setTimeout(() => {
      setupSignInHandler(block, placeholders);
    }, 0);

    addPasswordToggleButtons(modal);
  }

  /* -------------------------- Create Account Items -------------------------- */
  const accountFields = rows[2];
  const contentContainer = document.createElement("section");
  contentContainer.className = "content-container";

  if (step === 1) {
    const step1Cache = JSON.parse(
      sessionStorage.getItem("gha_step1_cache") || "{}"
    );

    contentContainer.innerHTML = `
      <div class="step-content step-one">
        <div class="header">
          <p class="text-l2 text-text-grey-700">1/2</p>
          <h4 class="text-h4">${
            accountFields?.querySelector("p").innerText
          }</h4>
        </div>
        <form class="input-fields">

        ${/* First Name Input */ ""}
          <div class="split-layout">
            <div class="input-wrapper">
              <input
                class="pill-dropdown-button"
                type="firstName"
                placeholder="${
                  placeholders?.createAccountFirstNamePlaceholder ||
                  "First Name*"
                }"
                value="${step1Cache.firstName || ""}"
              />
              <p class="text-l3 error-msg">
                ${
                  placeholders?.createAccountFirstNameErrorText ||
                  "Please enter a valid first name."
                }
              </p>
            </div>

            ${/* Last Name Input */ ""}
            <div class="input-wrapper">
              <input
                class="pill-dropdown-button"
                type="lastName"
                placeholder="${
                  placeholders?.createAccountLastNamePlaceholder || "Last Name*"
                }"
                value="${step1Cache.lastName || ""}"
              />
              <p class="text-l3 error-msg">
                ${
                  placeholders?.createAccountLastNameErrorText ||
                  "Please enter a valid last name."
                }
              </p>
            </div>
          </div>

          ${/* Email Input */ ""}
          <div class="input-wrapper">
            <input
              class="pill-dropdown-button"
              type="email"
              autocomplete="email"
              placeholder="${
                placeholders?.createAccountEmailPlaceholder || "Email Address*"
              }"
              value="${step1Cache.email || ""}"
            />
            <p class="text-l3 error-msg">${
              placeholders?.createAccountEmailErrorText ||
              "Please enter a valid email address."
            }</p>
          </div>

          ${/* City Input */ ""}
          <div class="split-layout">

   ${/* Country Input */ ""}
            <div>
              <select class="pill-dropdown-button" name="country">
                <option value="" disabled ${
                  step1Cache.country ? "" : "selected"
                }>
                  ${placeholders?.createAccountCountryPlaceholder || "Country"}
                </option>
                ${countries
                  .map(
                    (country) =>
                      `<option value="${country.id}" ${
                        country.id === step1Cache.country ? "selected" : ""
                      }>${country.name}</option>`
                  )
                  .join("")}
              </select>
              <p class="text-l3 error-msg">
                ${
                  placeholders?.createAccountCountryErrorText ||
                  "Please select a country."
                }
              </p>
            </div>

           <div class="input-wrapper">
              <input
                class="pill-dropdown-button"
                type="city"
                placeholder="${
                  placeholders?.createAccountCityPlaceholder || "City*"
                }"
                value="${step1Cache.city || ""}"
              />
              <p class="text-l3 error-msg">${
                placeholders?.createAccountCityErrorText ||
                "Please enter a valid city."
              }</p>
            </div>

         
          </div>

          ${/* Language Input */ ""}
           <div>
              <select class="pill-dropdown-button" name="language">
                <option value="" disabled ${
                  step1Cache.language ? "" : "selected"
                }>
                  ${
                    placeholders?.createAccountLanguagePlaceholder || "Language"
                  }
                </option>
                ${languages
                  .map(
                    (language) =>
                      `<option value="${language.id}" ${
                        language.id === step1Cache.language ? "selected" : ""
                      }>${language.name}</option>`
                  )
                  .join("")}
              </select>
            </div>
          <p class="text-l3 text-text-grey notes">
            ${
              placeholders?.createAccountLanguageNote ||
              "Selecting a language helps us personalize your experience."
            }
          </p>

          ${/* Password Input */ ""}
          <div class="split-layout password">
            <div class="input-wrapper">
              <input
                class="pill-dropdown-button"
                type="password"
                name="password"
                autocomplete="new-password"
                placeholder="${
                  placeholders?.createAccountPasswordPlaceholder || "Password*"
                }"
                value="${step1Cache.password || ""}"
              />
              <p class="text-l3 error-msg">
                ${
                  placeholders?.createAccountPasswordErrorText ||
                  "Password must be at least 8 characters, at least one letter, at least one number and at least one symbol."
                }
              </p>
            </div>

            ${/* Confirm Password Input */ ""}
            <div class="input-wrapper">
              <input
                class="pill-dropdown-button"
                type="password"
                autocomplete="new-password"
                name="confirmPassword"
                placeholder="${
                  placeholders?.createAccountConfirmPasswordPlaceholder ||
                  "Confirm Password*"
                }"
                value="${step1Cache.confirmPassword || ""}"
              />
              <p class="text-l3 error-msg">
                ${
                  placeholders?.createAccountConfirmPasswordErrorText ||
                  "Passwords do not match. Please re-enter your password."
                }
              </p>
            </div>
          </div>
          <p class="text-l3 text-text-grey notes password">
            ${
              placeholders?.createAccountPasswordNotesText ||
              "Password must be at least 8 characters, at least one letter, at least one number and at least one symbol."
            }
          </p>
        </form>

        ${/* Submit Button */ ""}
        <div class="button-container">
          <button class="cta-button next-step ${
            step1Cache.firstName ? "" : "inactive"
          }">${placeholders?.nextButtonText || "Next"}</button>
        </div>
      </div>
    `;
  } else if (step === 2) {
    const ul = accountFields?.querySelector("ul");
    const mainText = accountFields?.querySelector("p:nth-child(3)");
    // Get all <p> children from 5th onwards
    const pChildren = Array.from(
      accountFields?.querySelectorAll("p") || []
    ).slice(3);
    // Filter paragraphs by region prefix, then remove the prefix
    let agree = "";
    pChildren.forEach((p, idx) => {
      console.log(`pChildren[${idx}]:`, p);
    });

    // Find all paragraphs for the current region
    let regionPrefix = region || "EN";
    agree = "";
    let collecting = false;
    let regionParagraphs = [];
    for (let i = 0; i < pChildren.length; i++) {
      const pText = pChildren[i].innerText.trim();
      if (/^[A-Z]{2}:$/.test(pText)) {
        if (pText === `${regionPrefix}:`) {
          collecting = true;
          continue;
        } else if (collecting) {
          // Reached next region, stop collecting
          break;
        }
      }
      if (collecting) {
        regionParagraphs.push(pChildren[i].innerHTML);
      }
    }
    // If nothing found, fallback to EN
    if (regionParagraphs.length === 0) {
      collecting = false;
      for (let i = 0; i < pChildren.length; i++) {
        const pText = pChildren[i].innerText.trim();
        if (/^[A-Z]{2}:$/.test(pText)) {
          if (pText === "EN:") {
            collecting = true;
            continue;
          } else if (collecting) {
            break;
          }
        }
        if (collecting) {
          regionParagraphs.push(pChildren[i].innerHTML);
        }
      }
    }
    // If still nothing found, fallback to first non-prefix paragraph(s)
    if (regionParagraphs.length === 0) {
      for (let i = 0; i < pChildren.length; i++) {
        const pText = pChildren[i].innerText.trim();
        if (!/^[A-Z]{2}:$/.test(pText)) {
          regionParagraphs.push(pChildren[i].innerHTML);
        }
      }
    }
    agree = regionParagraphs.join("<br><br>");

    let checkboxHtml = "";
    if (ul) {
      checkboxHtml = `<ul class="checkbox-list">`;
      [...ul.children].forEach((li, idx) => {
        checkboxHtml += `
      <li class="text-l2">
      <label>
      <input type="checkbox" name="termsCheckbox" value="option${idx}" />
      <span>${li.innerHTML}</span>
      </label>
      </li>
      `;
      });
      checkboxHtml += `</ul>`;
    }

    contentContainer.innerHTML = `
      <div class="step-content step-two">
        <div class="header">
          <p class="text-l2 text-text-grey-700">2/2</p>
          <h4 class="text-h4">${
            placeholders?.termsAndConditionsTitle || "Terms & Conditions"
          }</h4>
        </div>
        <section class="checkbox-container">
        <p class="text-l2">${mainText?.innerHTML || ""}</p>
          ${checkboxHtml}
          <p class="text-l2 privacy-text">${agree || ""}</p>
           <div class="captcha">
        <div id="html_element_two" name="captchaValue"></div>
        <p class="text-l3 error-msg captcha-error-msg">${
          placeholders?.captchaErrorText || "Please complete the reCAPTCHA."
        }</p>
      </div>
        </section>
        <div class="button-container">
              <button class="cta-button become-member-btn" data-callback="onSubmit">${
                placeholders?.registerButtonText || "REGISTER"
              }</button>
        </div>
      </div>
    `;
  }

  if (type === 2) {
    modal.innerHTML = `
      <div class="create-account-modal">
      <button class="chevron-left back-button cta-link"><span class="animate-underline">${
        placeholders?.backButtonText || "Back"
      }</span></button>
        <section class="image">
          ${accountFields?.querySelector("picture")?.outerHTML || ""}
        </section>
        <section class="content-container" data-lenis-prevent>
          ${contentContainer.innerHTML}
        </section>
      </div>
    `;
    addPasswordToggleButtons(modal);
  }

  /* ------------------------------ Success Items ----------------------------- */
  const successFields = rows[3];
  setTimeout(() => disableCreateAccountNextButton(block), 0);

  if (type === 3) {
    modal.innerHTML = `
      <div class="success-modal">
      <section class="image">
        ${successFields?.querySelector("picture")?.outerHTML || ""}
      </section>

      <section class="content-container">
      <div class="content-wrapper">

        <h4 class="text-h4">${
          successFields?.querySelector("p:nth-child(1)").innerHTML
        }</h4>
        <p class="text-p1 text-text-grey">${
          successFields?.querySelector("p:nth-child(2)").innerHTML
        }</p>
        </div>
        <div class="button-container">
  <a href=${
    placeholders?.ghaSuccessButtonLink || "/gha-discovery/profile"
  } class="cta-button">${
      placeholders?.ghaSuccessButtonText || "Go to dashboard"
    }</a>
  </div>
      </section>

      </div>`;
  }
  /* ----------------------------- Existing Email ----------------------------- */
  if (type === 4) {
    modal.innerHTML = `
    <div class="existing-email-modal">
      <h4 class="text-h4">${
        placeholders?.existingAccountTitle || "Account Found"
      }</h4>
      <p class="text-p1">${
        placeholders?.existingAccountMessage ||
        "There is already an existing account with this information. Please go back to sign-in or reset your password using your email address."
      }</p>
      <div class="button-container">
        <a href=${
          placeholders?.resetPasswordLink ||
          "https://www.ghadiscovery.com/member/forgot_password"
        } class="cta-link animate-underline">${
      placeholders?.resetPasswordText || "Reset Password"
    }</a>
        <button class="cta-button back-to-login">
        ${placeholders?.backToLoginText || "Back to login"}
        </button>
      </div>
    </div>
            `;
  }

  /* ------------------------------- Main HTML ------------------------------- */
  block.innerHTML = `
    <div class="gha-banner-image">
      ${bannerImage ? bannerImage.outerHTML : ""}
    </div>
    ${modal.outerHTML}
  `;

  const signOutBtn = block.querySelector(".sign-out-button");
  if (signOutBtn) {
    createSignOutDialog({
      trigger: signOutBtn,
      onConfirm: () => {
        fadeSwitch({
          block,
          selector: ".modal-container",
          before: () => {
            type = 1;
            step = 1;
          },
        });
      },
    });
  }
}

/* -------------------------- Handle Type and Steps ------------------------- */

function fadeSwitch({
  block,
  selector,
  before,
  after,
  fadeClass = "fade-out",
  fadeInClass = "fade-in",
  duration = 300,
}) {
  const el = block?.querySelector(selector);
  if (el) {
    setTimeout(() => {
      el.classList.add(fadeClass);
      setTimeout(() => {
        if (before) before();
        decorate(block);
        const newEl = block.querySelector(selector);
        if (newEl) {
          // Start new element hidden
          newEl.style.opacity = "0";
          // Force reflow
          newEl.offsetWidth;
          if (after) after(newEl);
          newEl.classList.add(fadeInClass);
          // Remove opacity after animation completes
          setTimeout(() => {
            newEl.classList.remove(fadeInClass);
            newEl.style.opacity = "";
          }, duration);
        }
      }, duration);
    }, 100);
  } else {
    if (before) before();
    if (block) decorate(block);
  }
}

function becomeAMember() {
  const block = document.querySelector(".gha-banner");
  if (!block) return;

  // Become a Member Button Click Handler (type=1, step=2)
  fadeSwitch({
    block,
    selector: ".modal-container",
    before: () => {
      type = 3;
      step = 1;
    },
  });
}

document.addEventListener("click", (e) => {
  const block = document.querySelector(".gha-banner");

  if (e.target.matches(".back-to-login")) {
    fadeSwitch({
      block,
      selector: ".modal-container",
      before: () => {
        type = 1;
        step = 1;
      },
    });
    return;
  }

  // Create Account Button Click Handler
  if (e.target.matches(".create-account-btn")) {
    fadeSwitch({
      block,
      selector: ".modal-container",
      before: () => {
        type = 2;
        step = 1;
      },
    });
  }

  // Back Button Click Handler (type=1, step=1)
  if (
    e.target.matches(".back-button .animate-underline") &&
    type === 2 &&
    step === 1
  ) {
    fadeSwitch({
      block,
      selector: ".modal-container",
      before: () => {
        type = 1;
        step = 1;
      },
    });
  }

  // Back Button Click Handler (type=1, step=2)
  if (
    e.target.matches(".back-button .animate-underline") &&
    type === 2 &&
    step === 2
  ) {
    fadeSwitch({
      block,
      selector: ".create-account-modal .content-container",
      before: () => {
        step = 1;
      },
    });
  }

  // Next Step Button Click Handler (type=2, step=1)
  if (e.target.matches(".next-step") && type === 2 && step === 1) {
    // Cache step 1 values before switching to step 2
    const modal = document.querySelector(".create-account-modal");
    const firstName =
      modal.querySelector('input[type="firstName"]')?.value.trim() || "";
    const lastName =
      modal.querySelector('input[type="lastName"]')?.value.trim() || "";
    const email =
      modal.querySelector('input[type="email"]')?.value.trim() || "";
    const city = modal.querySelector('input[type="city"]')?.value.trim() || "";
    const password =
      modal.querySelector('input[name="password"]')?.value.trim() || "";
    const confirmPassword =
      modal.querySelector('input[name="confirmPassword"]')?.value.trim() || "";
    const country =
      modal.querySelector("select.pill-dropdown-button")?.value || "";
    const language =
      modal.querySelectorAll("select.pill-dropdown-button")[1]?.value || "";

    const step1Cache = {
      firstName,
      lastName,
      email,
      city,
      password,
      confirmPassword,
      country,
      language,
    };
    sessionStorage.setItem("gha_step1_cache", JSON.stringify(step1Cache));

    fadeSwitch({
      block,
      selector: ".create-account-modal .content-container",
      before: () => {
        step = 2;
      },
      after: () => {
        setTimeout(() => {
          const success = setupCreateAccountHandler(block);
          if (success) {
            becomeAMember();
          }
        }, 0);
      },
    });
  }
});

if (!document.getElementById("gha-banner-fade-style")) {
  const style = document.createElement("style");
  style.id = "gha-banner-fade-style";
  style.textContent = `
    .modal-container.fade-in,
    .content-container.fade-in {
      opacity: 0;
      animation: ghaFadeIn 0.3s forwards;
    }
    .modal-container.fade-out,
    .content-container.fade-out {
      opacity: 1;
      animation: ghaFadeOut 0.3s forwards;
    }
    @keyframes ghaFadeIn {
      from { opacity: 0; }
      to { opacity: 1; }
    }
    @keyframes ghaFadeOut {
      from { opacity: 1; }
      to { opacity: 0; }
    }
  `;
  document.head.appendChild(style);
}

// --- Create Account Handler ---
export function setupCreateAccountHandler(block) {
  setTimeout(() => {
    function attemptRecaptchaRender(attempts = 0) {
      const element = document.querySelector("#html_element_two");
      const recaptchaReady =
        typeof grecaptcha !== "undefined" && grecaptcha.render;

      if (element && recaptchaReady) {
        grecaptcha.render(element, {
          sitekey: RECAPTCHA_SITE_KEY,
          theme: "light",
          size: "normal",
        });
        return;
      }

      if (attempts >= 10) {
        return;
      }

      setTimeout(() => {
        attemptRecaptchaRender(attempts + 1);
      }, attempts * 1000);
    }
    attemptRecaptchaRender();
  }, 1000);

  setTimeout(() => {
    const becomeMemberBtn = block.querySelector(".become-member-btn");
    if (!becomeMemberBtn) {
      return;
    }

    const checkboxList = block.querySelectorAll(
      '.checkbox-list input[type="checkbox"]'
    );
    let selectedCheckbox = null;
    checkboxList.forEach((checkbox) => {
      checkbox.addEventListener("change", () => {
        selectedCheckbox = Array.from(checkboxList)
          .filter((cb) => cb.checked)
          .map((cb) => cb.value);
      });
    });

    // Update label text

    if (name === "terms") {
      checkbox.addEventListener("change", () => {
        if (!checkbox.checked) {
          becomeMemberBtn.classList.add("inactive");
        } else {
          becomeMemberBtn.classList.remove("inactive");
        }
      });
    }

    becomeMemberBtn.addEventListener("click", async (e) => {
      e.preventDefault();
      const captchaError = block.querySelector(".captcha-error-msg");
      captchaError.classList.remove("active");
      becomeMemberBtn.classList.add("loading");

      // Get captcha value
      let captchaValue = "";
      if (typeof grecaptcha !== "undefined") {
        captchaValue = grecaptcha.getResponse();
      }
      if (!captchaValue) {
        captchaError.classList.add("active");
        becomeMemberBtn.classList.remove("loading");
        return;
      }

      // Use cached step 1 values
      // Get step 1 values from sessionStorage
      const { firstName, lastName, email, password, country, language, city } =
        JSON.parse(sessionStorage.getItem("gha_step1_cache") || "{}");

      // Build FormData
      const formData = new FormData();
      formData.append("firstName", firstName);
      formData.append("lastName", lastName);
      formData.append("email", email);
      formData.append("password", password);
      if (city) formData.append("city", city);
      if (country) formData.append("country", country);
      if (language) formData.append("language", language);
      formData.append("captchaValue", captchaValue);
      // Append termsCheckbox only if selectedCheckbox is "option0"
      if (selectedCheckbox && selectedCheckbox.includes("option0")) {
        formData.append("ghaEmailMarketing", true);
      }
      if (selectedCheckbox && selectedCheckbox.includes("option1")) {
        formData.append("emailMarketing", true);
      }

      try {
        const res = await fetch(CREATE_ACCOUNT_API_URL, {
          method: "POST",
          body: formData,
        });
        const data = await res.json();

        if (data) {
          if (
            data.message &&
            data.message.includes("Reset password for email")
          ) {
            sessionStorage.removeItem("gha_step1_cache");
            fadeSwitch({
              block,
              selector: ".modal-container",
              before: () => {
                type = 4; // Existing Email
                step = 1;
              },
            });
            return false;
          } else if (data.data.token) {
            localStorage.setItem("gha_token", data.data.token);
            const now = new Date();
            localStorage.setItem("gha_token_created_at", now.toISOString());
            fadeSwitch({
              block,
              selector: ".modal-container",
              before: () => {
                type = 3; // Success
                step = 1;
              },
            });
            return true;
          }
        } else {
          return false;
        }
      } catch (err) {
        alert("Account creation error.");
        return false;
      }
    });
  }, 1000);
}
