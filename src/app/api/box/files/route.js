// src/app/api/box/files/route.js
import { NextResponse } from 'next/server';
import { getBoxAppUserContent } from '@/lib/box';  // Updated import name
import BoxSDK from 'box-node-sdk';
import { Readable } from 'stream';
import { logApiCall } from '@/app/lib/api-log-middleware';

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
const accessToken = await client._session.getAccessToken();
const newClient = sdk.getBasicClient(accessToken);


export async function GET(request) {
  try {
    await logApiCall(request, ()=>{});
    // Get the service account token
    const accessToken = await client._session.getAccessToken();
    
    const { searchParams } = new URL(request.url);
    const folderId = searchParams.get('folderId') || '0';

    const data = await getBoxAppUserContent(accessToken, folderId);  // Updated function call
    return NextResponse.json(data.entries);
  } catch (error) {
    console.error('Files error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('token') ? 401 : 500 }
    );
  }
}

export async function POST(req) {
  try {
    await logApiCall(req, ()=>{});
    // Process the multipart request
    const formData = await req.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const fileName = file.name;
    const fileBuffer = buffer;
    const boxFolderId = formData.get('boxFolderId') || '0';
    const email = formData.get('email') || '';

    // Convert the buffer into a readable stream
    const fileStream = new Readable();
    fileStream.push(fileBuffer);
    fileStream.push(null);

    // Upload the file to Box
    const uploadedFile = await newClient.files.uploadFile(boxFolderId, fileName, fileStream, {description:email});

    return NextResponse.json({
      message: 'File uploaded successfully',
      file: uploadedFile.entries[0],
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.response?.statusCode || 500 }
    );
  }
}

export async function DELETE(req) {
  try{
    await logApiCall(req, ()=>{});
    const { searchParams } = new URL(req.url);
    const fileId = searchParams.get('fileId');

    if (!fileId) {
      return NextResponse.json({ error: 'No fileId provided' }, { status: 400 });
    }

    await newClient.files.delete(fileId);

    return NextResponse.json({
      message: 'File deleted successfully',
      fileId: fileId,
    });

  }catch (error) { 
    console.error('Error deleting file:', error);
    return NextResponse.json(
      { error: error.response?.body.message, details: error.message },
      { status: error.response?.statusCode || 500 }
    );
  }
}