import {
  BoxClient,
  BoxDeveloperTokenAuth,
  BoxJwtAuth,
  JwtConfig,
} from "box-node-sdk";

let cachedClient: BoxClient | null = null;

const jwtConfig = new JwtConfig({
  clientId: process.env.BOX_CLIENT_ID!,
  clientSecret: process.env.BOX_CLIENT_SECRET!,
  privateKey: process.env.BOX_PRIVATE_KEY!.replace(/\\n/g, "\n"),
  privateKeyPassphrase: process.env.BOX_PASSPHRASE!,
  enterpriseId: process.env.BOX_ENTERPRISE_ID!,
  algorithm: "RS256",
  jwtKeyId: process.env.BOX_PUBLIC_KEY_ID!,
});

const auth = new BoxJwtAuth({ config: jwtConfig });

export function getBoxClient() {
  if (cachedClient) return cachedClient;
  cachedClient = new BoxClient({ auth });

  return cachedClient;
}

export async function getBoxClientAccessToken() {
  cachedClient = new BoxClient({ auth });
  const tokens = await auth.retrieveToken();

  return { client: cachedClient, accessToken: tokens.accessToken };
}

export function getUserBoxClient(userId: string) {
  const userAuth = auth.withUserSubject(userId);
  const userClient = new BoxClient({ auth: userAuth });
  return userClient;
}

export async function getUserBoxClientWithAccessToken(userId: string) {
  const userAuth = auth.withUserSubject(userId);
  const userClient = new BoxClient({ auth: userAuth });
  const tokens = await userAuth.retrieveToken();

  return {
    userClient,
    accessToken: tokens.accessToken,
  };
}