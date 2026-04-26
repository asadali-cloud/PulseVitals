import { NextResponse } from 'next/server';
import { analyzeVitals } from '@/src/lib/utils';

export async function POST(req: Request) {
  const { vitals } = await req.json();
  const result = await analyzeVitals(vitals);
  return NextResponse.json(result);
}