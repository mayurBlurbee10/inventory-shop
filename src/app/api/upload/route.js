import { logApiCall } from '@/app/lib/api-log-middleware';
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

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Create a unique filename
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1E9)}`;
    const filename = `logo-${uniqueSuffix}${path.extname(file.name)}`;
    
    // Save to public directory so it's accessible via URL
    const filepath = path.join(process.cwd(), 'public/uploads', filename);
    
    await writeFile(filepath, buffer);
    
    // Return the public URL
    return NextResponse.json({ 
      url: `/api/upload/${filename}`
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json(
      { error: 'Error uploading file' },
      { status: 500 }
    );
  }
}
