import { logApiCall } from '@/app/lib/api-log-middleware';
import { uploadToAzureBlob } from '@/app/lib/blobStorage';
import { writeFile } from 'fs/promises';
import { NextResponse } from 'next/server';
import path from 'path';

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
