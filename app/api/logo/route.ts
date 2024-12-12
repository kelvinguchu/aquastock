import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

let cachedLogo: string | null = null;

export async function GET() {
  try {
    // Return cached logo if available
    if (cachedLogo) {
      return NextResponse.json({ logo: cachedLogo });
    }

    const logoPath = path.join(process.cwd(), 'public', 'logo.png');
    const base64Logo = fs.readFileSync(logoPath, { encoding: 'base64' });
    const logoData = `data:image/png;base64,${base64Logo}`;
    
    // Cache the result
    cachedLogo = logoData;

    return NextResponse.json({ logo: logoData });
  } catch (error) {
    console.error('Error reading logo:', error);
    return NextResponse.json({ error: 'Failed to read logo' }, { status: 500 });
  }
} 