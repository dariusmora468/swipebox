import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const PROMO_FILE = path.join(process.cwd(), 'data', 'promo-codes.json');

// Default promo codes — these are created on first run
const DEFAULT_CODES = [
  { code: 'TEST', active: true, description: 'Internal testing code' },
  { code: 'BETA2026', active: true, description: 'General beta invite' },
  { code: 'FRIENDS', active: true, description: 'Friends & family invite' },
  { code: 'SWIPEBOX', active: true, description: 'Early access code' },
];

function ensureDataDir() {
  const dir = path.dirname(PROMO_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function getPromoCodes() {
  ensureDataDir();
  let fileCodes = [];
  if (fs.existsSync(PROMO_FILE)) {
    try {
      fileCodes = JSON.parse(fs.readFileSync(PROMO_FILE, 'utf8'));
    } catch {
      fileCodes = [];
    }
  }
  // Always merge defaults — ensures new codes are available even if file was created earlier
  const existingCodeSet = new Set(fileCodes.map(c => c.code));
  const merged = [...fileCodes];
  for (const def of DEFAULT_CODES) {
    if (!existingCodeSet.has(def.code)) {
      merged.push(def);
    }
  }
  // Save merged list back
  fs.writeFileSync(PROMO_FILE, JSON.stringify(merged, null, 2));
  return merged;
}

export async function POST(request) {
  try {
    const { code } = await request.json();

    if (!code || typeof code !== 'string') {
      return NextResponse.json({ error: 'Please enter an invite code.', valid: false }, { status: 400 });
    }

    const normalizedCode = code.trim().toUpperCase();
    const codes = getPromoCodes();
    const match = codes.find(c => c.code === normalizedCode && c.active);

    if (match) {
      return NextResponse.json({
        valid: true,
        message: 'Welcome to SwipeBox!',
      });
    }

    return NextResponse.json({
      valid: false,
      error: 'That code doesn\'t look right. Check with whoever gave it to you!',
    }, { status: 400 });
  } catch (err) {
    console.error('Promo validation error:', err);
    return NextResponse.json({ error: 'Could not verify code. Please try again.', valid: false }, { status: 500 });
  }
}
