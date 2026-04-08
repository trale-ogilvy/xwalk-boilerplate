import { getBasePathBasedOnEnv } from "../../scripts/utils.js";

/**
 * Submits the enquiry form data to the AEM endpoint.
 * @param {FormData} formData - The form data to submit.
 * @returns {Promise<object>} A promise that resolves with the server's response.
 */
export async function submitEnquiry(formData) {
  const API_ENDPOINT = getBasePathBasedOnEnv() + "/bin/chg/enquiry.json";

  try {
    const response = await fetch(API_ENDPOINT, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Network response was not ok: ${response.statusText}`);
    }

    // AEM servlets might return an empty response on success, which is not valid JSON.
    const responseText = await response.text();

    if (responseText) {
      const jsonResponse = JSON.parse(responseText);

      if (
        jsonResponse.error ||
        jsonResponse.status === "error" ||
        jsonResponse.success === false
      ) {
        throw new Error(
          jsonResponse.message ||
            jsonResponse.error ||
            "Server returned an error"
        );
      }

      if (jsonResponse.errorMessage || jsonResponse.errorCode) {
        throw new Error(
          jsonResponse.errorMessage || `Error code: ${jsonResponse.errorCode}`
        );
      }

      return jsonResponse;
    }

    // Assume success if the response is empty, and return a success status.
    return { status: "success" };
  } catch (error) {
    console.error("Enquiry submission error:", error);
    // Re-throw the error so it can be caught by the form submission handler.
    throw error;
  }
}
