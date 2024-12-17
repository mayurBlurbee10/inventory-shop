import BoxSDK from 'box-node-sdk';

// Initialize the SDK with your credentials
const sdk = new BoxSDK({
  clientID: process.env.BOX_CLIENT_ID,
  clientSecret: process.env.BOX_CLIENT_SECRET,
  appAuth: {
    keyID: process.env.BOX_PUBLIC_KEY_ID,
    privateKey: process.env.BOX_PRIVATE_KEY,
    passphrase: process.env.BOX_PASSPHRASE
  }
});

// Get the service account client
const client = sdk.getAppAuthClient('enterprise', process.env.BOX_ENTERPRISE_ID);

export async function findBoxUserByEmail(email) {
  try {
    // Search for user by email
    const users = await client.users.get({
      filter_term: email
    });

    // Find exact email match
    const user = users.entries.find(user => 
      user.login.toLowerCase() === email.toLowerCase()
    );

    return user || null;
  } catch (error) {
    console.error('Box user search error:', error);
    return null;
  }
}

export async function getBoxUserInfo(userId) {
  try {
    const user = await client.users.get(userId);
    return user;
  } catch (error) {
    console.error('Box user info error:', error);
    return null;
  }
}