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

async function getChildFolderByName(parentId, name, userClient) {
  if (userClient) {
    const items = await userClient.folders.getItems(parentId, {
      fields: "name,id,type",
    });
    return items.entries.find(
      (item) =>
        item.type === "folder" && item.name.toLowerCase() === name.toLowerCase()
    );
  }
  const items = await client.folders.getItems(parentId, {
    fields: "name,id,type",
  });
  return items.entries.find(
    (item) =>
      item.type === "folder" && item.name.toLowerCase() === name.toLowerCase()
  );
}

async function createFolderIfNotExists(parentId, name, userClient) {
  if (userClient) {
    const existing = await getChildFolderByName(parentId, name, userClient);
    if (existing) return existing.id;
    const created = await userClient.folders.create(parentId, name);
    return created.id;
  }
  const existing = await getChildFolderByName(parentId, name, userClient);
  if (existing) return existing.id;
  const created = await client.folders.create(parentId, name);
  return created.id;
}

async function ensureFolderPath(rootId, pathSegments, userClient = null) {
  let parentId = rootId;
  let rasId = null;
  for (const segment of pathSegments) {
    parentId = await createFolderIfNotExists(parentId, segment, userClient);
    if (segment?.toLowerCase() === "ras") {
      rasId = parentId;
    }
  }
  return { parentId: parentId, rasId: rasId };
}

const listUserRootFolders = async (userId) => {
  const userClient = sdk.getAppAuthClient("user", userId);

  const segments = ["RAS", "Clients"];
  const parentItem = await ensureFolderPath("0", segments, userClient);

  const items = await userClient.folders.getItems(parentItem?.parentId, {
    fields: "name,type,id,created_by",
    limit: 100,
  });

  return { rootItems: items.entries, rasId: parentItem?.rasId };
};

export default {
  listUserRootFolders
};