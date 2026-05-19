import BoxSDK from "box-node-sdk";

const sdk = new BoxSDK({
  clientID: process.env.BOX_CLIENT_ID,
  clientSecret: process.env.BOX_CLIENT_SECRET,
  appAuth: {
    keyID: process.env.BOX_PUBLIC_KEY_ID,
    privateKey: process.env.BOX_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    passphrase: process.env.BOX_PASSPHRASE,
    enterpriseID: process.env.BOX_ENTERPRISE_ID,
  },
});

const client = sdk.getAppAuthClient(
  "enterprise",
  process.env.BOX_ENTERPRISE_ID
);

export const getBoxClient = () => client;
export const getBoxSDK = () => sdk;

const BOX_API_URL = "https://api.box.com/2.0";

export async function getBoxAppUserContent(token: string, folderId: string = "0") {
  const response = await fetch(
    `${BOX_API_URL}/folders/${folderId}/items`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch user content");
  }

  return response.json();
}

export async function searchBoxAppUserContent(token: string, userId: string, query: string) {
  const response = await fetch(
    `${BOX_API_URL}/search?query=${encodeURIComponent(
      query
    )}&ancestor_folder_ids=${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Search failed");
  }

  return response.json();
}

export async function getBoxAppUser(token: string, userId: string) {
  const response = await fetch(
    `${BOX_API_URL}/users/${userId}`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    }
  );

  if (!response.ok) {
    throw new Error("Failed to fetch user information");
  }

  return response.json();
}

