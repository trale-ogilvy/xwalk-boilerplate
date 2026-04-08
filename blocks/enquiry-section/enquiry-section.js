import { fetchPlaceholders } from "../../scripts/utils.js";
import {
  createInputField,
  createPhoneInput,
  createRecaptchaField,
  createEnquiryTypeDropdown,
  validateForm,
  displayErrors,
  clearAllErrors,
  getDestinationFromUrl,
  getDescriptionPlaceholder,
  getSubmitButtonText,
} from "./enquiry-section-utils.js";
import { submitEnquiry } from "../general-modal/general-modal-api.js";
import {
  showSuccessModal,
  showErrorModal,
} from "../success-modal/success-modal.js";

export default async function decorate(block) {
  const placeholders = await fetchPlaceholders();

  // Initialize and store enquiry terms
  const enquiryTerms = extractEnquiryTerms(block);
  window.EnquirySectionManager = window.EnquirySectionManager || {};
  window.EnquirySectionManager.enquiryTerms = enquiryTerms;

  block.innerHTML = "";

  const form = createEnquiryForm(placeholders);
  block.appendChild(form);

  waitForRecaptchaAndRender();
}

function createEnquiryForm(placeholders) {
  const form = document.createElement("form");
  form.className = "general-modal-form";

  // Contact Details Section
  const contactTitle = document.createElement("h4");
  contactTitle.className = "general-modal__section-title";
  contactTitle.textContent =
    placeholders.generalenquiryContact || "Your Contact Details";
  form.appendChild(contactTitle);

  const row1 = document.createElement("div");
  row1.className = "general-modal__row";
  row1.appendChild(
    createFieldWrapper(
      createInputField(
        placeholders.generalenquiryFirstname || "First Name*",
        "firstName"
      )
    )
  );
  row1.appendChild(
    createFieldWrapper(
      createInputField(
        placeholders.generalenquiryLastname || "Last Name*",
        "lastName"
      )
    )
  );
  form.appendChild(row1);

  const row2 = document.createElement("div");
  row2.className = "general-modal__row";
  row2.appendChild(
    createFieldWrapper(
      createInputField(
        placeholders.generalenquiryEmail || "Email Address*",
        "email",
        "email"
      )
    )
  );

  createPhoneInput(placeholders).then((phoneInputElement) => {
    row2.appendChild(createFieldWrapper(phoneInputElement));
  });
  form.appendChild(row2);

  // Query Section
  const queryTitle = document.createElement("h4");
  queryTitle.className = "general-modal__section-title";
  queryTitle.textContent = placeholders.generalenquiryYourquery || "Your Query";
  form.appendChild(queryTitle);

  const enquiryDropdownElement = createEnquiryTypeDropdown(placeholders);
  form.appendChild(createFieldWrapper(enquiryDropdownElement));

  const propertyInput = document.createElement("input");
  propertyInput.type = "hidden";
  propertyInput.name = "property";
  propertyInput.value = getDestinationFromUrl();
  form.appendChild(propertyInput);

  const details = document.createElement("textarea");
  details.className = "general-modal__textarea text-l2";
  details.name = "description";
  details.placeholder =
    getDescriptionPlaceholder(placeholders, "general") || "Enquiry Details*";
  details.required = true;
  form.appendChild(createFieldWrapper(details));

  // Subscription opt-in
  form.appendChild(createSubscriptionOptin(placeholders));

  // reCAPTCHA
  form.appendChild(createRecaptchaField());

  // Submit button
  const submitBtn = document.createElement("button");
  submitBtn.className = "general-modal__submit-btn";
  submitBtn.type = "button";
  submitBtn.textContent =
    getSubmitButtonText(placeholders, "general") || "Submit";
  form.appendChild(submitBtn);

  submitBtn.addEventListener("click", async (e) => {
    e.preventDefault();
    clearAllErrors(form);

    let captchaValue = "";
    if (
      window.grecaptcha &&
      typeof window.grecaptcha.getResponse === "function"
    ) {
      const recaptchaEl = document.getElementById("general-modal-recaptcha");
      if (recaptchaEl && recaptchaEl.dataset.widgetId) {
        captchaValue = window.grecaptcha.getResponse(
          recaptchaEl.dataset.widgetId
        );
      }
    }

    const formData = new FormData(form);
    const data = Object.fromEntries(formData.entries());
    data.captchaValue = captchaValue;

    const errors = validateForm(data, placeholders);

    if (Object.keys(errors).length > 0) {
      displayErrors(form, errors);
      return;
    }

    // Format phone number with country code
    if (data.countryCode && data.phone) {
      data.phone = data.countryCode + data.phone;
      delete data.countryCode;
    } else if (data.countryCode && !data.phone) {
      delete data.countryCode;
    }

    try {
      const apiFormData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        apiFormData.append(key, value);
      });

      await submitEnquiry(apiFormData);
      const destination = getDestinationFromUrl() || "";

      showSuccessModal(data.enquiryType, destination, placeholders);
      form.reset();
    } catch (error) {
      console.error("ERROR IN FORM SUBMISSION:", error);
      const destination = getDestinationFromUrl() || "";

      showErrorModal(destination, placeholders);
    }
  });

  return form;
}

function createFieldWrapper(fieldElement) {
  const wrapper = document.createElement("div");
  wrapper.className = "general-modal__field-wrapper";
  wrapper.appendChild(fieldElement);
  return wrapper;
}

function createSubscriptionOptin(placeholders) {
  const div = document.createElement("div");
  div.className = "general-modal__subscription-optin";

  const checkbox = document.createElement("input");
  checkbox.type = "checkbox";
  checkbox.id = "subscribeOptin";
  checkbox.name = "subscribeOptin";
  checkbox.className = "general-modal__checkbox";

  const textContainer = document.createElement("div");
  textContainer.className = "general-modal__subscription-text";

  const defaultText =
    window.EnquirySectionManager?.enquiryTerms?.EN ||
    placeholders.generalenquiryUpdates ||
    "I would like to receive updates and offers from Capella Hotel Group via email or other electronic channels.";

  // Format initial content with checkbox
  textContainer.innerHTML = formatSubscriptionContent(defaultText, checkbox.id);

  div.appendChild(textContainer);

  applyRegionalTermsForEnquiry(textContainer, checkbox.id);

  return div;
}

function formatSubscriptionContent(termsText, checkboxId) {
  if (
    termsText.includes("<br>") ||
    termsText.includes("<br/>") ||
    termsText.includes("<br />")
  ) {
    const processedText = termsText;

    const doubleBreakIndex = processedText.indexOf("<br><br>");

    if (doubleBreakIndex !== -1) {
      const firstPart = processedText.substring(0, doubleBreakIndex).trim();
      const secondPart = processedText.substring(doubleBreakIndex + 8).trim(); // +8 for '<br><br>'

      return `
        <div class="subscription-paragraph">${firstPart}</div>
        <div class="subscription-checkbox-container">
          <input type="checkbox" id="${checkboxId}" name="subscribeOptin" class="general-modal__checkbox">
          <div class="subscription-paragraph">
            <label for="${checkboxId}" class="checkbox-wrapper">
              <span class="custom-checkbox"></span>
            </label>
            ${secondPart}
          </div>
        </div>
      `;
    } else {
      const singleBreakIndex = processedText.indexOf("<br>");
      if (singleBreakIndex !== -1) {
        const firstPart = processedText.substring(0, singleBreakIndex).trim();
        const secondPart = processedText.substring(singleBreakIndex + 4).trim(); // +4 for '<br>'

        return `
          <div class="subscription-paragraph">${firstPart}</div>
          <div class="subscription-checkbox-container">
            <input type="checkbox" id="${checkboxId}" name="subscribeOptin" class="general-modal__checkbox">
            <div class="subscription-paragraph">
              <label for="${checkboxId}" class="checkbox-wrapper">
                <span class="custom-checkbox"></span>
              </label>
              ${secondPart}
            </div>
          </div>
        `;
      } else {
        return `
          <div class="subscription-checkbox-container">
            <input type="checkbox" id="${checkboxId}" name="subscribeOptin" class="general-modal__checkbox">
            <div class="subscription-paragraph">
              <label for="${checkboxId}" class="checkbox-wrapper">
                <span class="custom-checkbox"></span>
              </label>
              ${processedText}
            </div>
          </div>
        `;
      }
    }
  } else if (termsText.includes("&lt;br&gt;")) {
    // Handle encoded <br> tags - convert to actual <br> and process again
    const processedText = termsText.replace(/&lt;br&gt;/g, "<br>");
    return formatSubscriptionContent(processedText, checkboxId);
  } else {
    // No <br> tags - single paragraph with checkbox
    return `
      <div class="subscription-checkbox-container">
        <input type="checkbox" id="${checkboxId}" name="subscribeOptin" class="general-modal__checkbox">
        <div class="subscription-paragraph">
          <label for="${checkboxId}" class="checkbox-wrapper">
            <span class="custom-checkbox"></span>
          </label>
          ${termsText}
        </div>
      </div>
    `;
  }
}

async function applyRegionalTermsForEnquiry(textContainer, checkboxId) {
  const defaultText =
    "I would like to receive updates and offers from Capella Hotel Group via email or other electronic channels.";

  if (window.adobe && window.adobe.target) {
    return new Promise((resolve) => {
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

          const termsText =
            window.EnquirySectionManager?.enquiryTerms?.[region] ||
            window.EnquirySectionManager?.enquiryTerms?.EN ||
            defaultText;

          textContainer.innerHTML = formatSubscriptionContent(
            termsText,
            checkboxId
          );

          resolve();
        },
        error: function (err) {
          console.warn("Enquiry Section - Target getOffer error", err);

          const fallbackText =
            window.EnquirySectionManager?.enquiryTerms?.EN || defaultText;
          textContainer.innerHTML = formatSubscriptionContent(
            fallbackText,
            checkboxId
          );
          resolve();
        },
      });
    });
  } else {
    const fallbackText =
      window.EnquirySectionManager?.enquiryTerms?.EN || defaultText;
    textContainer.innerHTML = formatSubscriptionContent(
      fallbackText,
      checkboxId
    );
  }
}

function waitForRecaptchaAndRender() {
  const recaptchaEl = document.getElementById("general-modal-recaptcha");
  if (!recaptchaEl) return;

  function renderRecaptcha() {
    if (window.grecaptcha && window.grecaptcha.render) {
      if (!recaptchaEl.dataset.widgetId) {
        const widgetId = window.grecaptcha.render(recaptchaEl, {
          sitekey: "6LfpYh8rAAAAAPaE-icNeXk4b8ktPXqLKwHhqp6d",
          theme: "light",
        });
        recaptchaEl.dataset.widgetId = widgetId;
      }
    } else {
      setTimeout(renderRecaptcha, 100);
    }
  }

  renderRecaptcha();
}

function extractEnquiryTerms(block) {
  const enquiryTerms = {};
  const liElements = block.querySelectorAll("li");

  liElements.forEach((li) => {
    const text = li.textContent;
    const languageMatch = text.match(/^([A-Z]{2,3}):/);

    if (languageMatch) {
      const languageCode = languageMatch[1];

      const tempDiv = document.createElement("div");
      tempDiv.innerHTML = li.innerHTML;

      // Style links to be underlined and inherit color
      const links = tempDiv.querySelectorAll("a");
      links.forEach((link) => {
        link.style.textDecoration = "underline";
        link.style.color = "inherit";
      });

      const content = tempDiv.innerHTML.replace(`${languageCode}:`, "").trim();
      enquiryTerms[languageCode] = content;
    }
  });

  return enquiryTerms;
}
