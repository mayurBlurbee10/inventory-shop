import BoxSDK from "box-node-sdk";

const sdk = new BoxSDK({
  clientID: process.env.BOX_CLIENT_ID,
  clientSecret: process.env.BOX_CLIENT_SECRET,
  appAuth: {
    keyID: process.env.BOX_PUBLIC_KEY_ID,
    privateKey: process.env.BOX_PRIVATE_KEY?.replace(/\\n/g, "\n"),
    passphrase: process.env.BOX_PASSPHRASE,
  },
});

const client = sdk.getAppAuthClient(
  "enterprise",
  process.env.BOX_ENTERPRISE_ID
);

/**
 * Creates or resolves a Box app user and their root folder (same behavior as POST /api/box/create-user).
 * @param {{ userName: string, externalId: string }} params
 * @returns {Promise<{ userId: string, name: string, login: string, folderId: string }>}
 */
export async function createBoxAppUser({ userName, externalId }) {
  const user = await client.enterprise.getUsers({
    filter_term: userName,
    fields: "id,name,login",
  });

  if (user?.entries.length > 0) {
    const folder = await client.search.query(`"${userName}'s Files"`, {
      type: "folder",
      fields: "id",
    });

    if (!folder?.entries.length > 0) {
      const newfolder = await client.folders.create("0", `${userName}'s Files`);

      return {
        userId: user?.entries[0].id,
        name: user?.entries[0].name,
        login: user?.entries[0].login,
        folderId: newfolder.id,
      };
    }

    return {
      userId: user?.entries[0].id,
      name: user?.entries[0].name,
      login: user?.entries[0].login,
      folderId: folder?.entries[0].id,
    };
  }

  const appUser = await client.enterprise.addAppUser(userName, {
    external_app_user_id: externalId,
    is_platform_access_only: true,
  });

  const folder = await client.folders.create("0", `${appUser.name}'s Files`);

  await client.collaborations.createWithUserID(
    appUser.id,
    folder.id,
    client.collaborationRoles.EDITOR
  );

  return {
    userId: appUser.id,
    name: appUser.name,
    login: appUser.login,
    folderId: folder.id,
  };
}
