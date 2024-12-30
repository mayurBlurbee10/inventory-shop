import { fetchWrapper } from "./fetchWrapper";

const BOX_API_URL = "https://api.box.com/2.0";

export async function getBoxAppUserContent(token, folderId = "0") {
  const response = await fetchWrapper(
    `${BOX_API_URL}/folders/${folderId}/items`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "folder-items"
  );

  if (!response.ok) {
    throw new Error("Failed to fetch user content");
  }

  return response.json();
}

export async function searchBoxAppUserContent(token, userId, query) {
  // Use Box search API with ancestor_folder_ids to limit to user's content
  const response = await fetchWrapper(
    `${BOX_API_URL}/search?query=${encodeURIComponent(
      query
    )}&ancestor_folder_ids=${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "search-content"
  );

  if (!response.ok) {
    throw new Error("Search failed");
  }

  return response.json();
}

// Update the files API route to use the app user-specific function
export async function getBoxAppUser(token, userId) {
  const response = await fetchWrapper(
    `${BOX_API_URL}/users/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    },
    "get-box-user"
  );

  if (!response.ok) {
    throw new Error("Failed to fetch user information");
  }

  return response.json();
}
