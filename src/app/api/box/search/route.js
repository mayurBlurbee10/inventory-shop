// src/app/api/box/search/route.js
import { NextResponse } from 'next/server';
import { searchBoxAppUserContent } from '@/lib/box';  // Updated import name
import { logApiCall } from '@/app/lib/api-log-middleware';

export async function GET(request) {
  try {
    await logApiCall(request);
    const authHeader = request.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'No authorization header' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const userId = searchParams.get('userId'); // Make sure to get userId

    const data = await searchBoxAppUserContent(token, userId, query);  // Updated function call
    return NextResponse.json(data.entries);
  } catch (error) {
    console.error('Search error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: error.message.includes('token') ? 401 : 500 }
    );
  }
}