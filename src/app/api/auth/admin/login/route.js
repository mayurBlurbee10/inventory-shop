import { NextResponse } from 'next/server';
import { validateAdminUser } from '@/app/lib/data';
import { logApiCall } from '@/app/lib/api-log-middleware';

export async function POST(request) {
  try {
    await logApiCall(request, ()=>{});
    const { email, password } = await request.json();
    const user = validateAdminUser(email, password);
    
    if (!user) {
      return NextResponse.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }
    
    // Don't send password back to client
    const { password: _, ...userData } = user;
    return NextResponse.json({ user: userData });
  } catch (error) {
    return NextResponse.json(
      { error: 'Login failed' },
      { status: 500 }
    );
  }
}