import BoxSDK from 'box-node-sdk';

const sdkConfig = {
  clientID: process.env.BOX_CLIENT_ID,
  clientSecret: process.env.BOX_CLIENT_SECRET,
  appAuth: {
    keyID: process.env.BOX_PUBLIC_KEY_ID,
    privateKey: process.env.BOX_PRIVATE_KEY.replace(/\\n/g, '\n'),
    passphrase: process.env.BOX_PASSPHRASE,
  },
  enterpriseID: process.env.BOX_ENTERPRISE_ID,
};

export async function GET(req, res) {
  const fileId = req.nextUrl.searchParams.get('fileId');
  if (!fileId) {
    return Response.json({ error: 'File ID is required' });
  }

  try {
    const sdk = new BoxSDK(sdkConfig);
    const client = sdk.getAppAuthClient('enterprise');

    const file = await client.files.get(fileId);

    const stream = await client.files.getReadStream(fileId);

    const readableStream = new ReadableStream({
        start(controller) {
          stream.on('data', (chunk) => {
            controller.enqueue(chunk);
          });
  
          stream.on('end', () => {
            controller.close();
          });
  
          stream.on('error', (err) => {
            console.error('Stream error:', err);
            controller.error(err);
          });
        },
      });
  
      return new Response(readableStream, {
        headers: {
          'Content-Type': file.file_version.content_type || 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${file.name}"`,
        },
      });
  } catch (error) {
    console.error('Error downloading file from Box:', error);
    return Response.json(
        { error: 'Failed to download file' },
        { status: error.response?.statusCode || 500 }
    );
  }
}