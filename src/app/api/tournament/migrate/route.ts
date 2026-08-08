import { NextResponse } from 'next/server';
import { getTournamentState, saveTournamentState } from '@/utils/db';

export async function POST(req: Request) {
  try {
    const { state } = await req.json();
    if (!state) {
      return NextResponse.json({ error: 'Missing state body' }, { status: 400 });
    }

    const existing = getTournamentState();
    if (!existing) {
      saveTournamentState(JSON.stringify(state));
      return NextResponse.json({ migrated: true });
    }
    return NextResponse.json({ migrated: false, reason: 'Database already has data' });
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: 'Failed to migrate' }, { status: 500 });
  }
}
