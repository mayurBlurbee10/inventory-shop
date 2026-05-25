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

export async function GET(request, context) {
  try {
    await logApiCall(request);
    const { fileId } = await context.params;
    
    // Get the service account token
    const accessToken = await client._session.getAccessToken();
    
    // Get file info
    const file = await client.files.get(fileId);
    
    return Response.json({
      accessToken,
      fileInfo: {
        id: file.id,
        name: file.name,
        type: file.type
      }
    });

  } catch (error) {
    console.error('Box preview error:', error);
    return Response.json(
      { 
        error: 'Failed to generate preview', 
        details: error.message 
      }, 
      { status: 500 }
    );
  }
}