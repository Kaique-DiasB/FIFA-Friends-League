import { NextResponse } from 'next/server';
import { getTournamentState, saveTournamentState } from '@/utils/db';

export async function GET() {
  try {
    const stateStr = getTournamentState();
    if (!stateStr) {
      return NextResponse.json({ state: null });
    }
    return NextResponse.json({ state: JSON.parse(stateStr) });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to read database' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { state } = await req.json();
    if (!state) {
      return NextResponse.json({ error: 'Missing state body' }, { status: 400 });
    }
    saveTournamentState(JSON.stringify(state));
    return NextResponse.json({ success: true });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to save database' }, { status: 500 });
  }
}
