import { logApiCall } from '@/app/lib/api-log-middleware';
import BoxSDK from 'box-node-sdk';

const sdk = new BoxSDK({
  clientID: process.env.BOX_CLIENT_ID,
  clientSecret: process.env.BOX_CLIENT_SECRET,
  appAuth: {
    keyID: process.env.BOX_PUBLIC_KEY_ID,
    privateKey: process.env.BOX_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    passphrase: process.env.BOX_PASSPHRASE,
    enterpriseID: process.env.BOX_ENTERPRISE_ID
  }
});

const client = sdk.getAppAuthClient('enterprise', process.env.BOX_ENTERPRISE_ID);

export async function POST(request, { params }) {
  try {
    await logApiCall(request);
    const { folderId } = params;
    
    // Create a shared link for the folder
    const shared = await client.folders.update(folderId, {
      shared_link: {
        access: 'open',
        permissions: {
          can_preview: true,
          can_download: true
        }
      }
    });
    
    return Response.json({ shared_link: shared.shared_link });
  } catch (error) {
    console.error('Error sharing folder:', error);
    return Response.json(
      { error: 'Failed to share folder' }, 
      { status: 500 }
    );
  }
}