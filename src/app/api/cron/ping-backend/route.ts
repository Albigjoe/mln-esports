import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 'https://mln-backend-api.onrender.com';
  
  try {
    console.log(`[Cron] Pinging Render Backend: ${backendUrl}/status`);
    const start = Date.now();
    const res = await fetch(`${backendUrl}/status`, {
      method: 'GET',
      headers: {
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
      },
      next: { revalidate: 0 } // Bypass Next.js cache
    });
    
    if (!res.ok) {
      throw new Error(`Backend responded with status: ${res.status}`);
    }
    
    const data = await res.json();
    const duration = Date.now() - start;
    
    return NextResponse.json({
      success: true,
      duration: `${duration}ms`,
      data
    });
  } catch (error: any) {
    console.error(`[Cron] Backend ping failed:`, error.message);
    return NextResponse.json({
      success: false,
      error: error.message
    }, { status: 500 });
  }
}
