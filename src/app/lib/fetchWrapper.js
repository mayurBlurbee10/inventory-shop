export const fetchWrapper = async (url, options = {}, type) => {

  // Get dynamic header values (e.g., from localStorage, cookies, or a session)
  const user = JSON.parse(localStorage.getItem("user")) || {
    id: "defaultUser",
  };
  const portal = localStorage.getItem("portal");

  // Default headers
  const defaultHeaders = {
    "x-user-id": user.id,
    "x-portal-id": portal,
    "x-api-type": type, // Replace with your API type logic
  };

  // Merge headers
  options.headers = {
    ...defaultHeaders,
    ...(options.headers || {}),
  };

  try {
    // Make the fetch call
    const response = await fetch(url, options);
    // Handle non-OK responses
    // if (!response.ok) {
    //   throw new Error(`HTTP error! status: ${response.status}`);
    // }

    // Return JSON response
    return response;
  } catch (error) {
    console.error("Fetch error:", error.message);
    throw error;
  }
};
