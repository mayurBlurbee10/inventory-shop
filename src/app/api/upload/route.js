import { logApiCall } from '@/app/lib/api-log-middleware';
import { uploadToAzureBlob } from '@/app/lib/blobStorage';
import { writeFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function uploadLocalFileToAzure(image="MStrategy_Group.png") {
  try {
    const fileToUpload = image
    const filePath = path.join(process.cwd(), 'public', fileToUpload);
    const fileBuffer = fs.readFileSync(filePath);

    // Simulate a File object (for example, if uploadToAzureBlob expects a Blob-like structure)
    const file = {
      name: fileToUpload,
      size: fileBuffer.length,
      type: 'image/png',
      arrayBuffer: async () => fileBuffer.buffer,
      stream: () => fs.createReadStream(filePath),
    };

    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const filename = `logo-${uniqueSuffix}${path.extname(file.name)}`;

    const url = await uploadToAzureBlob(file, filename);
    return url;
  } catch (error) {
    console.error('Error uploading local file:', error);
    throw error;
  }
}

export async function POST(request) {
  try {
    await logApiCall(request);
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    // Create a unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const filename = `logo-${uniqueSuffix}${path.extname(file.name)}`;

    const url = await uploadToAzureBlob(file,filename);

    // Return the public URL
    return NextResponse.json({ url });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Error uploading file' },
      { status: 500 }
    );
  }
}
