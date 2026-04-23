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

    if (response.status === 401) {
      let loginPath = "/login";
      if (portal && portal !== "default") {
        try {
          // Use raw fetch instead of fetchWrapper to avoid infinite recursion on 401
          const portalResponse = await fetch(
            `${process.env.NEXT_PUBLIC_BACKEND_URL}/api/portal?id=${portal}`,
            {
              headers: {
                Authorization: `Bearer ${getClientToken()}`,
              },
            }
          );

          if (portalResponse.ok) {
            const result = await portalResponse.json();
            const portalData = result?.data;
            // Use slug if available, fallback to sanitized legalName
            const slug = portalData?.slug || (portalData?.legalName ? portalData.legalName.trim().toLowerCase().replace(/\s+/g, "-") : null);
            if (slug && slug !== "default") {
              loginPath = `/${slug}/login`;
            }
          }
        } catch (error) {
          console.warn("Failed to fetch portal details for redirect:", error.message);
        }
      }
      localStorage.clear();

      if (typeof window !== "undefined") {
        window.location.href = loginPath;
      }
    }
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
