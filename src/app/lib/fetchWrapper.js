import { getUserData } from "@/lib/auth";

export const fetchWrapper = async (url, options = {}, type) => {

  // Get dynamic header values (e.g., from localStorage, cookies, or a session)
  const user = getUserData() || {
    id: null,
  };
  const portal = localStorage.getItem("portal");

   let portalId = "admin"; // default
  
  if (options.body && typeof options.body === "string") {
    try {
      const parsedBody = JSON.parse(options.body);
      portalId = user?.portalId || parsedBody.portalid || "admin";
    } catch (error) {
      console.warn("Failed to parse body for portalid:", error);
      portalId = user?.portalId || "admin";
    }
  } else if (options.body && typeof options.body === "object") {
    portalId = user?.portalId || options.body.portalid || "admin";
  } else {
    portalId = user?.portalId || "admin";
  }


  // Default headers
  const defaultHeaders = {
    "x-user-id": user.id,
    "x-portal-id": portalId,
    "x-api-type": type, // Replace with your API type logic
  };

  // Merge headers
  options.headers = {
    ...defaultHeaders,
    ...(options.headers || {}),
  };

  try {
    // Make the fetch call
    // console.log(`🛠️ API Call from fetchWrapper → URL: ${url} | Type: ${type}`);
    // console.trace();  // This prints the function call stack
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
