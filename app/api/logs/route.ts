import { NextResponse } from 'next/server';
import { getLogs, clearLogs } from '@/lib/store';

export async function GET() {
  return NextResponse.json(getLogs());
}

export async function DELETE() {
  clearLogs();
  return NextResponse.json({ success: true });
}
