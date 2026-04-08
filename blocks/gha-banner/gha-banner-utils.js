import { getBasePathBasedOnEnv } from "../../scripts/utils.js";

const RECAPTCHA_SITE_KEY = "6LfpYh8rAAAAAPaE-icNeXk4b8ktPXqLKwHhqp6d";
const SIGN_IN_API_URL = getBasePathBasedOnEnv() + "/bin/chg/member/signin.json";

// Add a variable to store widget IDs
let signInCaptchaWidgetId = null;

export function disableCreateAccountNextButton(block) {
  const nextButton = block.querySelector(".create-account-modal .cta-button");
  // Get input elements for create account step 1
  const firstNameInput = block.querySelector(
    '.create-account-modal input[type="firstName"]'
  );
  const lastNameInput = block.querySelector(
    '.create-account-modal input[type="lastName"]'
  );
  const emailInput = block.querySelector(
    '.create-account-modal input[type="email"]'
  );
  const cityInput = block.querySelector(
    '.create-account-modal input[type="city"]'
  );
  const passwordInput = block.querySelector(
    '.create-account-modal input[type="password"]'
  );
  const confirmPasswordInput = block.querySelector(
    '.create-account-modal input[name="confirmPassword"]'
  );
  const countrySelect = block.querySelector(
    '.create-account-modal select[name="country"]'
  );

  const passwordNotes = block.querySelector(".password.notes");

  const nameRegex = /^[A-Za-z\s'-]+$/;
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const passwordRegex =
    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z\d])[A-Za-z\d\S]{8,}$/;

  const allFields = [
    {
      input: firstNameInput,
      validate: () => nameRegex.test(firstNameInput.value.trim()),
    },
    {
      input: lastNameInput,
      validate: () => nameRegex.test(lastNameInput.value.trim()),
    },
    {
      input: emailInput,
      validate: () => emailRegex.test(emailInput.value.trim()),
    },
    {
      input: cityInput,
      validate: () => nameRegex.test(cityInput.value.trim()),
    },
    {
      input: passwordInput,
      validate: () => passwordRegex.test(passwordInput.value.trim()),
    },
    {
      input: confirmPasswordInput,
      validate: () =>
        confirmPasswordInput.value.trim() === passwordInput.value.trim(),
    },
    { input: countrySelect, validate: () => !!countrySelect.value },
  ];

  function showError(input, isValid) {
    const errorMsg = input?.parentElement?.querySelector(".error-msg");
    if (errorMsg) {
      // For city and country, always show error if not valid (handled by validateAll logic)
      if (input === cityInput || input === countrySelect) {
        if (isValid) {
          errorMsg.classList.remove("active");
          input.style.border = "";
        } else {
          errorMsg.classList.add("active");
          input.style.border = "1px solid rgba(156, 133, 107, 1)";
        }
      } else {
        // For other fields, don't show error if empty
        if (input.value.trim() === "") {
          errorMsg.classList.remove("active");
          input.style.border = "";
        } else if (isValid) {
          errorMsg.classList.remove("active");
          input.style.border = "";
        } else {
          errorMsg.classList.add("active");
          input.style.border = "1px solid rgba(156, 133, 107, 1)";
        }
      }
    }
  }

  function validateAll() {
    let allValid = true;
    let cityCountryValid = true;

    // Country is required. If not selected, show error and set invalid.
    if (!countrySelect.value) {
      cityCountryValid = false;
    } else {
      // If country is selected, city is required.
      if (cityInput.value.trim() === "") {
        cityCountryValid = false;
      }
    }

    // Validate all other fields
    allFields.forEach(({ input, validate }) => {
      if (input === cityInput || input === countrySelect) return;
      const isValid = validate();
      showError(input, isValid);
      if (!isValid) allValid = false;
    });
    if (!cityCountryValid) allValid = false;

    // Password notes handling
    const isPasswordValid = passwordRegex.test(passwordInput.value.trim());
    const isConfirmPasswordValid =
      confirmPasswordInput.value.trim() === passwordInput.value.trim();

    if (isPasswordValid && isConfirmPasswordValid) {
      passwordNotes.style.opacity = "1";
      passwordNotes.style.height = "auto";
      passwordNotes.style.margin = "0.5rem 0";
    } else {
      if (
        passwordInput.value.trim() !== "" ||
        confirmPasswordInput.value.trim() !== ""
      ) {
        passwordNotes.style.opacity = "0";
        passwordNotes.style.height = "0";
        passwordNotes.style.margin = "0";
      } else {
        passwordNotes.style.opacity = "1";
        passwordNotes.style.height = "auto";
        passwordNotes.style.margin = "0.5rem 0";
      }
    }

    // Enable or disable button
    if (allValid) {
      nextButton.classList.remove("inactive");
    } else {
      nextButton.classList.add("inactive");
    }
  }

  // Add listeners
  allFields.forEach(({ input }) => {
    input?.addEventListener("input", validateAll);
    input?.addEventListener("blur", validateAll);
  });
}

// --- Sign In Handler ---
export function setupSignInHandler(block, placeholders) {
  // --- Captcha error logic ---
  // Show/hide captcha error message based on validation
  function showCaptchaError(show) {
    const captchaError = block.querySelector(".captcha-error-msg");
    if (captchaError) {
      if (show) {
        captchaError.classList.add("active");
      } else {
        captchaError.classList.remove("active");
      }
    }
  }

  const signInBtn = block.querySelector(".sign-in-modal .cta-button");
  const emailInput = block.querySelector('.sign-in-modal input[type="email"]');
  const passwordInput = block.querySelector(
    '.sign-in-modal input[type="password"]'
  );
  if (!signInBtn || !emailInput || !passwordInput) return;

  // Render captcha if available and store the widget ID
  if (typeof grecaptcha !== "undefined") {
    signInCaptchaWidgetId = grecaptcha.render("html_element1", {
      sitekey: RECAPTCHA_SITE_KEY,
      theme: "light",
      size: "normal",
      tabindex: 0,
    });
  }

  emailInput.addEventListener("input", () => {
    // On blur, reset error message and border
    emailInput.addEventListener("blur", () => {
      emailInput.style.border = "";
      const errorMsg = emailInput.parentElement.querySelector(".error-msg");
      if (errorMsg) errorMsg.classList.remove("active");
    });

    if (!emailInput.value.trim() || !passwordInput.value) {
      signInBtn.classList.add("inactive");
    } else {
      signInBtn.classList.remove("inactive");
    }
  });
  passwordInput.addEventListener("input", () => {
    passwordInput.addEventListener("blur", () => {
      passwordInput.style.border = "";
      const errorMsg = passwordInput.parentElement.querySelector(".error-msg");
      if (errorMsg) errorMsg.classList.remove("active");
    });

    if (!emailInput.value.trim() || !passwordInput.value) {
      signInBtn.classList.add("inactive");
    } else {
      signInBtn.classList.remove("inactive");
    }
  });

  signInBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    const email = emailInput.value.trim();
    const password = passwordInput.value;
    let captchaValue = "";
    if (typeof grecaptcha !== "undefined" && signInCaptchaWidgetId !== null) {
      captchaValue = grecaptcha.getResponse(signInCaptchaWidgetId);
    }
    signInBtn.classList.add("loading");

    // Reset error messages
    showCaptchaError(false);
    emailInput.parentElement
      .querySelector(".error-msg")
      ?.classList.remove("active");
    passwordInput.parentElement
      .querySelector(".error-msg")
      ?.classList.remove("active");

    let hasError = false;
    // Get all error messages in the input-fields container
    const errorMsgs = block.querySelectorAll(
      ".sign-in-modal .input-fields .error-msg"
    );
    // Reset error messages
    errorMsgs.forEach((msg, idx) => {
      msg.classList.remove("active");
      // Remove red outline from corresponding input
      const input = idx === 0 ? emailInput : passwordInput;
      input.style.border = "";
      input.style.color = "";
    });

    if (!captchaValue) {
      showCaptchaError(true);
      hasError = true;
    }
    if (hasError) {
      signInBtn.classList.remove("loading");
      signInBtn.textContent = "Sign In";
      return;
    }

    try {
      const formData = new FormData();
      formData.append("email", email);
      formData.append("password", password);
      formData.append("captchaValue", captchaValue);

      const res = await fetch(SIGN_IN_API_URL, {
        method: "POST",
        body: formData,
      });

      const { data } = await res.json();
      if (data.token) {
        localStorage.setItem("gha_token", data.token);
        window.location.href =
          placeholders.signInRedirect || "/gha-discovery/profile";
      } else {
        signInBtn.classList.remove("loading");
        // Reset captcha on login failure
        if (
          typeof grecaptcha !== "undefined" &&
          signInCaptchaWidgetId !== null
        ) {
          grecaptcha.reset(signInCaptchaWidgetId);
        }
      }
    } catch (err) {
      signInBtn.classList.remove("loading");
      errorMsgs[0]?.classList.add("active");
      emailInput.style.border = "1px solid rgba(156, 133, 107, 1)";
      errorMsgs[1]?.classList.add("active");
      passwordInput.style.border = "1px solid rgba(156, 133, 107, 1)";
      // Reset captcha on error
      if (typeof grecaptcha !== "undefined" && signInCaptchaWidgetId !== null) {
        grecaptcha.reset(signInCaptchaWidgetId);
      }
    }
  });
}

export function addPasswordToggleButtons(container) {
  const passwordInputs = container.querySelectorAll('input[type="password"]');
  passwordInputs.forEach((input) => {
    // Create toggle button
    const toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.className = "password-toggle-btn";

    // SVGs for open and closed eye
    const eyeOpenSVG = `
      <svg class="eye-open" width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.6">
      <mask id="mask0_5547_67362" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="24" height="24">
      <rect x="0.578125" y="0.496094" width="24" height="24" fill="#D9D9D9"/>
      </mask>
      <g mask="url(#mask0_5547_67362)">
        <path d="M12.5782 5.05744C14.9217 5.05744 17.0351 5.7036 18.9185 6.99594C20.8018 8.28827 22.1755 9.97544 23.0397 12.0574C22.1755 14.1394 20.8018 15.8266 18.9185 17.1189C17.0351 18.4113 14.9217 19.0574 12.5782 19.0574C10.2282 19.0574 8.11478 18.4113 6.23795 17.1189C4.36095 15.8266 2.9872 14.1394 2.1167 12.0574C2.9872 9.97544 4.36095 8.28827 6.23795 6.99594C8.11478 5.7036 10.2282 5.05744 12.5782 5.05744Z" stroke="#333333" stroke-width="1.5" fill="none"/>
        <circle cx="12.5782" cy="12.0574" r="4" stroke="#333333" stroke-width="1.5" fill="none"/>
        </g>
      </g>
      </svg>
    `;
    const eyeClosedSVG = `
      <svg class="eye-closed" width="25" height="25" viewBox="0 0 25 25" fill="none" xmlns="http://www.w3.org/2000/svg">
      <g opacity="0.6">
        <mask id="mask0_5393_64714" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="25" height="25">
        <rect x="0.578125" y="0.558594" width="24" height="24" fill="#D9D9D9"/>
        </mask>
        <g mask="url(#mask0_5393_64714)">
        <path d="M16.3512 13.5304L15.2282 12.4074C15.3782 11.5793 15.142 10.8347 14.5195 10.1737C13.8971 9.51285 13.1334 9.25744 12.2282 9.40744L11.1052 8.28444C11.3309 8.1831 11.5623 8.1071 11.7994 8.05644C12.0366 8.00577 12.2962 7.98044 12.5782 7.98044C13.7129 7.98044 14.676 8.37627 15.4677 9.16794C16.2594 9.9596 16.6552 10.9228 16.6552 12.0574C16.6552 12.3394 16.6299 12.6023 16.5792 12.8459C16.5285 13.0894 16.4525 13.3176 16.3512 13.5304ZM19.532 16.6419L18.4282 15.6074C19.0615 15.1241 19.624 14.5949 20.1157 14.0199C20.6074 13.4449 21.0282 12.7908 21.3782 12.0574C20.5449 10.3741 19.349 9.0366 17.7907 8.04494C16.2324 7.05327 14.4949 6.55744 12.5782 6.55744C12.0949 6.55744 11.6199 6.59077 11.1532 6.65744C10.6865 6.7241 10.2282 6.8241 9.7782 6.95744L8.61295 5.79219C9.24495 5.54085 9.89045 5.3556 10.5494 5.23644C11.2085 5.1171 11.8847 5.05744 12.5782 5.05744C14.9217 5.05744 17.0351 5.7036 18.9185 6.99594C20.8018 8.28827 22.1755 9.97544 23.0397 12.0574C22.6692 12.9509 22.1907 13.7849 21.6042 14.5594C21.0175 15.3338 20.3268 16.0279 19.532 16.6419ZM20.3397 22.4267L16.2937 18.4112C15.7809 18.601 15.2125 18.7562 14.5887 18.8767C13.965 18.9972 13.2949 19.0574 12.5782 19.0574C10.2282 19.0574 8.11478 18.4113 6.23795 17.1189C4.36095 15.8266 2.9872 14.1394 2.1167 12.0574C2.48587 11.1741 2.96278 10.3501 3.54745 9.58544C4.13212 8.8206 4.7757 8.15744 5.4782 7.59594L2.70895 4.79594L3.76295 3.74219L21.3935 21.3727L20.3397 22.4267ZM6.5322 8.64969C6.00387 9.07019 5.49003 9.57569 4.9907 10.1662C4.49137 10.7565 4.0872 11.3869 3.7782 12.0574C4.61153 13.7408 5.80737 15.0783 7.3657 16.0699C8.92403 17.0616 10.6615 17.5574 12.5782 17.5574C13.0334 17.5574 13.4866 17.5189 13.938 17.4419C14.3891 17.3651 14.7718 17.2857 15.086 17.2037L13.8204 15.9074C13.65 15.9766 13.4525 16.0317 13.2282 16.0727C13.0039 16.1139 12.7872 16.1344 12.5782 16.1344C11.4435 16.1344 10.4804 15.7386 9.6887 14.9469C8.89703 14.1553 8.5012 13.1921 8.5012 12.0574C8.5012 11.8549 8.52178 11.6431 8.56295 11.4219C8.60395 11.2008 8.65903 10.9985 8.7282 10.8152L6.5322 8.64969Z" fill="#333333"/>
        </g>
      </g>
      </svg>
    `;

    // Both SVGs stacked, closed visible by default
    toggleBtn.innerHTML = `
      <span class="eye-icon-wrapper">
        ${eyeOpenSVG}
        ${eyeClosedSVG}
      </span>
    `;

    // Style the button inside the input wrapper
    input.parentNode.style.position = "relative";
    input.style.paddingRight = "36px";
    input.parentNode.appendChild(toggleBtn);
  });

  // Add CSS for stacking and opacity
  if (!document.getElementById("password-toggle-style")) {
    const style = document.createElement("style");
    style.id = "password-toggle-style";
    document.head.appendChild(style);
  }

  setTimeout(handlePasswordToggle, 0);
}

function handlePasswordToggle() {
  const toggleBtns = document.querySelectorAll(".password-toggle-btn");
  toggleBtns.forEach((toggleBtn) => {
    // Find the associated input (the previous sibling that is an input)
    let input = toggleBtn.previousElementSibling;
    while (input && input.tagName !== "INPUT") {
      input = input.previousElementSibling;
    }
    if (!input) return;

    // Remove any previous click handlers to avoid double binding
    toggleBtn.replaceWith(toggleBtn.cloneNode(true));
    const newToggleBtn = input.parentNode.querySelector(".password-toggle-btn");

    newToggleBtn.addEventListener("click", () => {
      if (input.type === "password") {
        input.type = "text";
        newToggleBtn.classList.add("showing");
      } else {
        input.type = "password";
        newToggleBtn.classList.remove("showing");
      }
    });
    // Ensure initial state is closed
    newToggleBtn.classList.remove("showing");
  });
}

/* ----------------- Sign up privacy content based on region ---------------- */
