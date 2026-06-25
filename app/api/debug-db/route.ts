import { NextResponse } from 'next/server';
import { pool } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const rawUrl = process.env.DATABASE_URL || '';
    // Mask password in DATABASE_URL
    const maskedUrl = rawUrl.replace(/:([^:@]+)@/, ':****@');
    
    // Query corsair_integrations
    const res = await pool.query('SELECT name FROM corsair_integrations');
    const integrations = res.rows.map((r: any) => r.name);
    
    return NextResponse.json({
      success: true,
      databaseUrl: maskedUrl,
      integrations,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
      databaseUrl: (process.env.DATABASE_URL || '').replace(/:([^:@]+)@/, ':****@'),
    });
  }
}
