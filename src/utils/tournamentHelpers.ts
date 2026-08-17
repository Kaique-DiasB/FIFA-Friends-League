import { Participant, Match, Standing, TournamentState, StageId, StageDef, ChampionshipConfig } from '../types/tournament';

export function calculateStandings(
  groupId: 'A' | 'B',
  participants: Participant[],
  matches: Match[]
): Standing[] {
  const groupParticipants = participants.filter(p => p.groupId === groupId);
  const groupMatches = matches.filter(m => m.groupId === groupId);

  const standingsMap: Record<string, Standing> = {};

  groupParticipants.forEach(p => {
    standingsMap[p.id] = {
      participantId: p.id,
      games: 0,
      wins: 0,
      draws: 0,
      losses: 0,
      goalsFor: 0,
      goalsAgainst: 0,
      goalDifference: 0,
      points: 0,
    };
  });

  groupMatches.forEach(m => {
    if (!m.completed) return;
    const home = standingsMap[m.homeId];
    const away = standingsMap[m.awayId];

    if (!home || !away) return;

    const hs = m.homeScore ?? 0;
    const as = m.awayScore ?? 0;

    home.games += 1;
    away.games += 1;

    home.goalsFor += hs;
    home.goalsAgainst += as;
    away.goalsFor += as;
    away.goalsAgainst += hs;

    if (hs > as) {
      home.wins += 1;
      home.points += 3;
      away.losses += 1;
    } else if (as > hs) {
      away.wins += 1;
      away.points += 3;
      home.losses += 1;
    } else {
      home.draws += 1;
      home.points += 1;
      away.draws += 1;
      away.points += 1;
    }
  });

  // Calculate goal difference
  Object.values(standingsMap).forEach(s => {
    s.goalDifference = s.goalsFor - s.goalsAgainst;
  });

  const namesMap: Record<string, string> = {};
  participants.forEach(p => {
    namesMap[p.id] = p.name;
  });

  // Sort standings
  return Object.values(standingsMap).sort((a, b) => {
    // 1. Points
    if (b.points !== a.points) return b.points - a.points;
    // 2. Goal Difference
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    // 3. Goals For (Goals marked)
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    // 4. Wins
    if (b.wins !== a.wins) return b.wins - a.wins;

    // 5. Head-to-head (confronto direto)
    const directMatch = groupMatches.find(
      m =>
        m.completed &&
        ((m.homeId === a.participantId && m.awayId === b.participantId) ||
         (m.homeId === b.participantId && m.awayId === a.participantId))
    );
    if (directMatch) {
      const aIsHome = directMatch.homeId === a.participantId;
      const scoreA = aIsHome ? directMatch.homeScore : directMatch.awayScore;
      const scoreB = aIsHome ? directMatch.awayScore : directMatch.homeScore;
      if (scoreA !== undefined && scoreA !== null && scoreB !== undefined && scoreB !== null) {
        if (scoreA !== scoreB) {
          return scoreB - scoreA; // higher score gets first
        }
      }
    }

    // 6. Alphabetical
    const nameA = namesMap[a.participantId] || '';
    const nameB = namesMap[b.participantId] || '';
    return nameA.localeCompare(nameB, 'pt', { sensitivity: 'base' });
  });
}

export function checkGroupStageComplete(matches: Match[]): boolean {
  const groupMatches = matches.filter(m => m.stage === 'groups');
  return groupMatches.length > 0 && groupMatches.every(m => m.completed);
}

export function encodeState(state: TournamentState): string {
  try {
    const json = JSON.stringify(state);
    const utf8Bytes = new TextEncoder().encode(json);
    let binary = '';
    const len = utf8Bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(utf8Bytes[i]);
    }
    return btoa(binary)
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');
  } catch (e) {
    console.error(e);
    return '';
  }
}

export function decodeState(str: string): TournamentState | null {
  try {
    let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
    while (base64.length % 4) {
      base64 += '=';
    }
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    const json = new TextDecoder().decode(bytes);
    return JSON.parse(json) as TournamentState;
  } catch (e) {
    console.error(e);
    return null;
  }
}

export interface LeaderboardEntry {
  participantId: string;
  rank: number;
  stageLabel: string; // human-readable badge text, e.g. "Campeão", "Eliminado (Quartas de Final)"
  tier: number; // internal ranking weight (higher = went further); exposed mainly for tests
  points: number;
  goalDifference: number;
  goalsFor: number;
}

export interface StageOutcome {
  winners: string[];
  losers: string[];
}

// Reads (doesn't generate) the winner/loser of every slot already played in a stage —
// used by calculateLeaderboard, generateSummaryText, and the bracket/podium UI.
export function resolveStageOutcomes(stageDef: StageDef, matches: Match[]): StageOutcome {
  const bySlot = new Map<number, Match[]>();
  matches
    .filter(m => m.stage === stageDef.id)
    .forEach(m => {
      const list = bySlot.get(m.slot) ?? [];
      list.push(m);
      bySlot.set(m.slot, list);
    });

  const winners: string[] = [];
  const losers: string[] = [];

  bySlot.forEach(legs => {
    if (stageDef.legs === 2) {
      const leg1 = legs.find(m => m.leg === 1);
      const leg2 = legs.find(m => m.leg === 2);
      if (!leg1 || !leg2) return;
      const result = getTwoLegAggregateResult(leg1, leg2, leg1.homeId, leg1.awayId);
      if (result.winnerId) {
        winners.push(result.winnerId);
        losers.push(result.winnerId === leg1.homeId ? leg1.awayId : leg1.homeId);
      }
    } else {
      const m = legs[0];
      if (!m) return;
      const winner = getMatchWinner(m);
      if (winner) {
        winners.push(winner);
        losers.push(winner === m.homeId ? m.awayId : m.homeId);
      }
    }
  });

  return { winners, losers };
}

export function calculateLeaderboard(state: TournamentState): LeaderboardEntry[] {
  const config = state.config;
  const groups: ('A' | 'B')[] = config.groupCount === 2 ? ['A', 'B'] : config.groupCount === 1 ? ['A'] : [];
  const standingsMap = new Map<string, Standing>();
  groups.forEach(g => {
    calculateStandings(g, state.participants, state.groupMatches).forEach(s => standingsMap.set(s.participantId, s));
  });

  const knockoutStages = getVisibleStages(config).filter(s => s.id !== 'third_place');
  const finalStage = knockoutStages.find(s => s.id === 'final') ?? null;
  const nonFinalStages = knockoutStages.filter(s => s.id !== 'final');
  const thirdPlaceStage = config.stages.find(s => s.id === 'third_place') ?? null;

  const STEP = 10;
  const tierInfo = new Map<string, { tier: number; label: string }>();
  const setIfHigher = (id: string, entry: { tier: number; label: string }) => {
    const existing = tierInfo.get(id);
    if (!existing || entry.tier > existing.tier) {
      tierInfo.set(id, entry);
    }
  };

  nonFinalStages.forEach(stageDef => {
    const { winners, losers } = resolveStageOutcomes(stageDef, state.knockoutMatches);
    const base = (stageDef.order + 1) * STEP;
    winners.forEach(id => setIfHigher(id, { tier: base + 1, label: `Avançou (${stageDef.label})` }));
    losers.forEach(id => setIfHigher(id, { tier: base, label: `Eliminado (${stageDef.label})` }));
  });

  if (finalStage) {
    const { winners, losers } = resolveStageOutcomes(finalStage, state.knockoutMatches);
    const base = (finalStage.order + 1) * STEP;
    winners.forEach(id => setIfHigher(id, { tier: base + STEP, label: 'Campeão' }));
    losers.forEach(id => setIfHigher(id, { tier: base, label: 'Vice-campeão' }));

    if (winners.length === 0) {
      state.knockoutMatches
        .filter(m => m.stage === 'final')
        .forEach(m => {
          setIfHigher(m.homeId, { tier: base, label: 'Finalista' });
          setIfHigher(m.awayId, { tier: base, label: 'Finalista' });
        });
    }
  }

  if (thirdPlaceStage && finalStage) {
    const { winners, losers } = resolveStageOutcomes(thirdPlaceStage, state.knockoutMatches);
    const base = (finalStage.order + 1) * STEP - STEP / 2;
    winners.forEach(id => setIfHigher(id, { tier: base + 1, label: '3º Lugar' }));
    losers.forEach(id => setIfHigher(id, { tier: base, label: '4º Lugar' }));
  }

  const entries: LeaderboardEntry[] = state.participants.map(p => {
    const s = standingsMap.get(p.id);
    const info = tierInfo.get(p.id) ?? { tier: 0, label: 'Fase de Grupos' };
    return {
      participantId: p.id,
      rank: 0,
      stageLabel: info.label,
      tier: info.tier,
      points: s?.points ?? 0,
      goalDifference: s?.goalDifference ?? 0,
      goalsFor: s?.goalsFor ?? 0,
    };
  });

  entries.sort((a, b) => {
    if (b.tier !== a.tier) return b.tier - a.tier;
    if (b.points !== a.points) return b.points - a.points;
    if (b.goalDifference !== a.goalDifference) return b.goalDifference - a.goalDifference;
    if (b.goalsFor !== a.goalsFor) return b.goalsFor - a.goalsFor;
    return a.participantId.localeCompare(b.participantId);
  });

  entries.forEach((entry, idx) => {
    entry.rank = idx + 1;
  });

  return entries;
}

export function generateSummaryText(
  state: TournamentState,
  namesMap: Record<string, string>
): string {
  const config = state.config;
  const groups: ('A' | 'B')[] = config.groupCount === 2 ? ['A', 'B'] : config.groupCount === 1 ? ['A'] : [];

  let text = `=== CAMPEONATO DE FIFA - RESUMO DO TORNEIO ===\n\n`;

  text += `PARTICIPANTES:\n`;
  if (groups.length > 0) {
    groups.forEach(g => {
      text += `Grupo ${g}:\n`;
      state.participants.filter(p => p.groupId === g).forEach(p => {
        text += ` - ${p.name}${p.team ? ` (${p.team})` : ''}\n`;
      });
    });
  } else {
    [...state.participants].sort((a, b) => a.seed - b.seed).forEach(p => {
      text += ` - ${p.name}${p.team ? ` (${p.team})` : ''}\n`;
    });
  }
  text += `\n`;

  if (groups.length > 0) {
    const renderStandingRow = (s: Standing, rank: number) => {
      const name = namesMap[s.participantId] || '';
      return `${rank}º ${name.padEnd(20)} | PTS: ${s.points} | J: ${s.games} | V: ${s.wins} | E: ${s.draws} | D: ${s.losses} | GP: ${s.goalsFor} | GC: ${s.goalsAgainst} | SG: ${s.goalDifference}\n`;
    };

    text += `CLASSIFICAÇÃO:\n`;
    groups.forEach(g => {
      text += `Grupo ${g}:\n`;
      calculateStandings(g, state.participants, state.groupMatches).forEach((s, i) => {
        text += renderStandingRow(s, i + 1);
      });
    });
    text += `\n`;

    text += `RESULTADOS DA FASE DE GRUPOS:\n`;
    const rounds = Array.from(new Set(state.groupMatches.map(m => m.round))).sort((a, b) => a - b);
    rounds.forEach(r => {
      text += `Rodada ${r}:\n`;
      groups.forEach(g => {
        text += ` Grupo ${g}:\n`;
        state.groupMatches.filter(m => m.groupId === g && m.round === r).forEach(m => {
          const home = namesMap[m.homeId] || '';
          const away = namesMap[m.awayId] || '';
          const score = m.completed ? `${m.homeScore} x ${m.awayScore}` : 'Pendente';
          text += `   ${home} ${score} ${away}\n`;
        });
      });
    });
    text += `\n`;
  }

  getVisibleStages(config).forEach(stageDef => {
    const stageMatches = state.knockoutMatches.filter(m => m.stage === stageDef.id);
    if (stageMatches.length === 0) return;

    text += `${stageDef.label.toUpperCase()}:\n`;

    const bySlot = new Map<number, Match[]>();
    stageMatches.forEach(m => {
      const list = bySlot.get(m.slot) ?? [];
      list.push(m);
      bySlot.set(m.slot, list);
    });

    Array.from(bySlot.keys()).sort((a, b) => a - b).forEach(slot => {
      const legs = (bySlot.get(slot) ?? []).sort((a, b) => a.leg - b.leg);
      legs.forEach(m => {
        const home = namesMap[m.homeId] || '';
        const away = namesMap[m.awayId] || '';
        const score = m.completed ? `${m.homeScore} x ${m.awayScore}` : 'Pendente';
        const legLabel = stageDef.legs === 2 ? (m.leg === 1 ? ' (Ida)' : ' (Volta)') : '';
        text += `   Jogo ${slot}${legLabel}: ${home} ${score} ${away}\n`;
      });

      if (stageDef.legs === 2 && legs.length === 2) {
        const result = getTwoLegAggregateResult(legs[0], legs[1], legs[0].homeId, legs[0].awayId);
        if (result.winnerId) {
          const penText = result.isTied ? ` (Pênaltis: ${result.team2Pen} x ${result.team1Pen})` : '';
          text += `   Classificado: ${namesMap[result.winnerId] || result.winnerId}${penText}\n`;
        }
      } else {
        const m = legs[0];
        if (m?.completed) {
          const winner = getMatchWinner(m);
          const penText = m.homeScore === m.awayScore && m.homePenalties != null && m.awayPenalties != null
            ? ` (Pênaltis: ${m.homePenalties} x ${m.awayPenalties})`
            : '';
          if (winner) {
            text += `   Vencedor: ${namesMap[winner] || winner}${penText}\n`;
          }
        }
      }
    });
    text += `\n`;
  });

  if (state.championId) {
    text += `🏆 CAMPEÃO: ${namesMap[state.championId] || state.championId} 🏆\n`;
  }

  return text;
}

// =====================================================================================
// Generic tournament engine (additive) — supports arbitrary participant counts, ≤2
// groups, single/two-leg knockout stages and a preliminary (play-in) round when the
// entrant count doesn't fill a clean power-of-two bracket. See tournamentHelpers.test.ts
// for worked examples of every function below.
// =====================================================================================

// ---------- Bracket-size math ----------

// Avoids Math.log2/Math.floor, which can misround exact powers of two (e.g. log2(8)
// sometimes evaluates to 2.9999999999996 due to floating point).
export function previousPowerOfTwo(n: number): number {
  let p = 1;
  while (p * 2 <= n) {
    p *= 2;
  }
  return p;
}

export interface BracketPlan {
  bracketSize: number;
  prelimMatches: number;
}

export function computeBracketPlan(n: number): BracketPlan {
  const bracketSize = previousPowerOfTwo(n);
  return { bracketSize, prelimMatches: n - bracketSize };
}

// Standard recursive tournament seeding order (e.g. size 8 -> [1,8,4,5,2,7,3,6]), so
// round-1 pairs are (seed1,seed8), (seed4,seed5), (seed2,seed7), (seed3,seed6).
export function standardSeedOrder(size: number): number[] {
  if (size <= 1) return [1];
  const half = standardSeedOrder(size / 2);
  const result: number[] = [];
  half.forEach(s => {
    result.push(s, size + 1 - s);
  });
  return result;
}

const STAGE_LADDER_BY_BRACKET_SIZE: Record<number, { id: StageId; label: string }[]> = {
  2: [{ id: 'final', label: 'Final' }],
  4: [
    { id: 'semifinals', label: 'Semifinal' },
    { id: 'final', label: 'Final' },
  ],
  8: [
    { id: 'quarterfinals', label: 'Quartas de Final' },
    { id: 'semifinals', label: 'Semifinal' },
    { id: 'final', label: 'Final' },
  ],
  16: [
    { id: 'round_of_16', label: 'Oitavas de Final' },
    { id: 'quarterfinals', label: 'Quartas de Final' },
    { id: 'semifinals', label: 'Semifinal' },
    { id: 'final', label: 'Final' },
  ],
};

// Which knockout stages are reachable for a given number of entrants, prefixed with a
// 'prelim' stage when the entrant count doesn't fill a clean power-of-two bracket.
export function buildStageLadder(entrantCount: number): StageDef[] {
  const { bracketSize, prelimMatches } = computeBracketPlan(entrantCount);
  const base = STAGE_LADDER_BY_BRACKET_SIZE[bracketSize];
  if (!base) {
    throw new Error(`Bracket size ${bracketSize} is not supported (entrantCount=${entrantCount})`);
  }

  const stages: StageDef[] = [];
  let order = 0;

  if (prelimMatches > 0) {
    stages.push({ id: 'prelim', label: 'Rodada Preliminar', order: order++, slotCount: prelimMatches, legs: 1 });
  }

  base.forEach((s, idx) => {
    stages.push({
      id: s.id,
      label: s.label,
      order: order++,
      slotCount: bracketSize / Math.pow(2, idx + 1),
      legs: 1,
    });
  });

  return stages;
}

// ---------- Group round-robin fixture (circle method) ----------

export interface RoundRobinFixture {
  matches: { round: number; homeIdx: number; awayIdx: number }[];
  byeByRound: Record<number, number>; // round -> 1-based index of the idle player (odd group sizes only)
  rounds: number;
}

// Odd group sizes get one extra virtual "bye" seat so every player still gets a game
// every round except one; even group sizes need no byes. Both cases fall out of the
// same rotation naturally once the bye seat is added.
export function generateRoundRobinFixture(groupSize: number): RoundRobinFixture {
  if (groupSize < 2) {
    return { matches: [], byeByRound: {}, rounds: 0 };
  }

  const isOdd = groupSize % 2 !== 0;
  const seats = isOdd ? groupSize + 1 : groupSize;
  const BYE = isOdd ? seats : null;
  const rounds = seats - 1;
  const half = seats / 2;

  let arr = Array.from({ length: seats }, (_, i) => i + 1);
  const matches: { round: number; homeIdx: number; awayIdx: number }[] = [];
  const byeByRound: Record<number, number> = {};

  for (let r = 1; r <= rounds; r++) {
    for (let i = 0; i < half; i++) {
      const a = arr[i];
      const b = arr[seats - 1 - i];
      if (BYE !== null && (a === BYE || b === BYE)) {
        byeByRound[r] = a === BYE ? b : a;
        continue;
      }
      const home = r % 2 === 1 ? a : b;
      const away = r % 2 === 1 ? b : a;
      matches.push({ round: r, homeIdx: home, awayIdx: away });
    }

    const fixedFirst = arr[0];
    const rest = arr.slice(1);
    rest.unshift(rest.pop()!);
    arr = [fixedFirst, ...rest];
  }

  return { matches, byeByRound, rounds };
}

export function generateGroupStageMatches(groupId: 'A' | 'B', participantIds: string[]): Match[] {
  const { matches } = generateRoundRobinFixture(participantIds.length);
  const countByRound: Record<number, number> = {};
  return matches.map((f) => {
    countByRound[f.round] = (countByRound[f.round] ?? 0) + 1;
    return {
      id: `group_${groupId.toLowerCase()}_r${f.round}_m${countByRound[f.round]}`,
      stage: 'groups',
      groupId,
      round: f.round,
      slot: countByRound[f.round],
      leg: 1,
      homeId: participantIds[f.homeIdx - 1],
      awayId: participantIds[f.awayIdx - 1],
      completed: false,
    };
  });
}

// ---------- Cross-group qualifier seeding (≤2 groups) ----------

export interface QualifierSeed {
  group: 'A' | 'B';
  rank: number; // 1-based, 1 = best in group
}

// Interleaving group qualifiers by rank (A1,B1,A2,B2,...) and then laying out the
// bracket with standardSeedOrder reproduces the classic "1st vs 4th of the other
// group, 2nd vs 3rd of the other group" crossover for any qualifier count, not just 4.
export function generateCrossoverPairings(qualifiersPerGroup: number): QualifierSeed[] {
  const seeds: QualifierSeed[] = [];
  for (let rank = 1; rank <= qualifiersPerGroup; rank++) {
    seeds.push({ group: 'A', rank });
    seeds.push({ group: 'B', rank });
  }
  return seeds;
}

// ---------- Single-match / two-leg winner resolution (stage-agnostic) ----------

export function getMatchWinner(match: Match): string | null {
  if (!match.completed) return null;
  const hs = match.homeScore ?? 0;
  const as = match.awayScore ?? 0;
  if (hs > as) return match.homeId;
  if (as > hs) return match.awayId;

  const hp = match.homePenalties;
  const ap = match.awayPenalties;
  if (hp !== null && hp !== undefined && ap !== null && ap !== undefined) {
    if (hp > ap) return match.homeId;
    if (ap > hp) return match.awayId;
  }
  return null;
}

export interface TwoLegResult {
  winnerId: string | null;
  team1Id: string;
  team2Id: string;
  team1Agg: number;
  team2Agg: number;
  isTied: boolean;
  team1Pen?: number | null;
  team2Pen?: number | null;
}

// team1 is home in leg1 (ida) and away in leg2 (volta); team2 the reverse.
export function getTwoLegAggregateResult(
  leg1: Match,
  leg2: Match,
  team1Id: string,
  team2Id: string
): TwoLegResult {
  const result: TwoLegResult = {
    winnerId: null,
    team1Id,
    team2Id,
    team1Agg: 0,
    team2Agg: 0,
    isTied: false,
  };

  if (!leg1 || !leg2 || !leg1.completed || !leg2.completed) {
    return result;
  }

  const h1 = leg1.homeScore ?? 0;
  const a1 = leg1.awayScore ?? 0;
  const h2 = leg2.homeScore ?? 0;
  const a2 = leg2.awayScore ?? 0;

  const team1Agg = h1 + a2;
  const team2Agg = a1 + h2;

  result.team1Agg = team1Agg;
  result.team2Agg = team2Agg;

  if (team1Agg > team2Agg) {
    result.winnerId = team1Id;
  } else if (team2Agg > team1Agg) {
    result.winnerId = team2Id;
  } else {
    result.isTied = true;
    const team1Pen = leg2.awayPenalties;
    const team2Pen = leg2.homePenalties;
    result.team1Pen = team1Pen;
    result.team2Pen = team2Pen;

    if (team1Pen !== undefined && team1Pen !== null && team2Pen !== undefined && team2Pen !== null) {
      if (team1Pen > team2Pen) {
        result.winnerId = team1Id;
      } else if (team2Pen > team1Pen) {
        result.winnerId = team2Id;
      }
    }
  }

  return result;
}

export function buildMatchId(stage: StageId, slot: number, leg: 1 | 2 = 1): string {
  return `${stage}_slot${slot}_leg${leg}`;
}

// ---------- Generic knockout advancement ----------

type CarryFn = (id: string, stage: StageId, slot: number, leg: 1 | 2, homeId: string, awayId: string) => Match;

function resolveSlotMatches(
  stageDef: StageDef,
  slot: number,
  home: string | null,
  away: string | null,
  carry: CarryFn
): { matches: Match[]; winner: string | null; loser: string | null } {
  if (!home || !away) return { matches: [], winner: null, loser: null };

  if (stageDef.legs === 2) {
    const leg1 = carry(buildMatchId(stageDef.id, slot, 1), stageDef.id, slot, 1, home, away);
    const leg2 = carry(buildMatchId(stageDef.id, slot, 2), stageDef.id, slot, 2, away, home);
    const aggregate = getTwoLegAggregateResult(leg1, leg2, home, away);
    const winner = aggregate.winnerId;
    const loser = winner ? (winner === home ? away : home) : null;
    return { matches: [leg1, leg2], winner, loser };
  }

  const match = carry(buildMatchId(stageDef.id, slot, 1), stageDef.id, slot, 1, home, away);
  const winner = getMatchWinner(match);
  const loser = winner ? (winner === home ? away : home) : null;
  return { matches: [match], winner, loser };
}

// Resolves the ordered list of participant ids feeding the knockout stage: the seeded
// participant list when there's no group stage, or the crossover-seeded group
// qualifiers once the group stage has finished (empty array if not ready yet).
export function resolveKnockoutSeedPool(
  config: ChampionshipConfig,
  participants: Participant[],
  groupMatches: Match[],
  standingsByGroup: Partial<Record<'A' | 'B', Standing[]>>
): string[] {
  if (!config.hasGroupStage) {
    return [...participants].sort((a, b) => (a.seed ?? 0) - (b.seed ?? 0)).map(p => p.id);
  }

  if (!checkGroupStageComplete(groupMatches)) return [];

  if (config.groupCount === 1) {
    return (standingsByGroup.A ?? []).slice(0, config.qualifiersPerGroup).map(s => s.participantId);
  }

  const seeds = generateCrossoverPairings(config.qualifiersPerGroup);
  return seeds
    .map(seed => (standingsByGroup[seed.group] ?? [])[seed.rank - 1]?.participantId)
    .filter((id): id is string => !!id);
}

// The single engine that (re)generates every knockout match from a seeded entrant pool.
// Only the first real stage (prelim, or the first bracket round if there's no prelim)
// needs seeding-aware pairing — every stage after that just pairs adjacent slots
// (2j-1, 2j) of the previous stage, which is the standard bracket-advancement rule.
export function advanceKnockoutStages(
  config: ChampionshipConfig,
  seededPoolIds: string[],
  prevKnockoutMatches: Match[]
): Match[] {
  const stages = config.stages.filter(s => s.id !== 'third_place');
  const thirdPlaceStage = config.stages.find(s => s.id === 'third_place') ?? null;
  if (stages.length === 0 || seededPoolIds.length === 0) return [];

  // Keyed by (stage, leg, homeId, awayId) rather than match id — slot numbers can shift
  // between recomputations (e.g. a legacy-migrated bracket renumbered by the generic
  // seeding scheme), but the same two participants meeting again should still keep
  // their score.
  const prevByPairing = new Map<string, Match>();
  prevKnockoutMatches.forEach(m => {
    prevByPairing.set(`${m.stage}|${m.leg}|${m.homeId}|${m.awayId}`, m);
  });
  const carry: CarryFn = (id, stage, slot, leg, homeId, awayId) => {
    const prev = prevByPairing.get(`${stage}|${leg}|${homeId}|${awayId}`);
    return {
      id,
      stage,
      round: 1,
      slot,
      leg,
      homeId,
      awayId,
      homeScore: prev?.homeScore ?? null,
      awayScore: prev?.awayScore ?? null,
      homePenalties: prev?.homePenalties ?? null,
      awayPenalties: prev?.awayPenalties ?? null,
      completed: prev?.completed ?? false,
    };
  };

  const result: Match[] = [];
  let pool: (string | null)[] = seededPoolIds;
  let firstStage = true;
  let loserPoolForThirdPlace: (string | null)[] | null = null;

  for (let s = 0; s < stages.length; s++) {
    const stageDef = stages[s];
    const winners: (string | null)[] = [];
    const losers: (string | null)[] = [];

    if (firstStage && stageDef.id === 'prelim') {
      const n = pool.length;
      const { bracketSize, prelimMatches } = computeBracketPlan(n);
      const byedCount = bracketSize - prelimMatches;
      const prelimPool = pool.slice(byedCount);
      const advancing: (string | null)[] = pool.slice(0, byedCount);

      for (let i = 0; i < prelimMatches; i++) {
        const home = prelimPool[i] ?? null;
        const away = prelimPool[prelimPool.length - 1 - i] ?? null;
        const { matches, winner } = resolveSlotMatches(stageDef, i + 1, home, away, carry);
        result.push(...matches);
        advancing.push(winner);
      }

      pool = advancing;
      continue; // next iteration still uses seeding-aware pairing (firstStage stays true)
    }

    if (firstStage) {
      const n = pool.length;
      const { bracketSize } = computeBracketPlan(n);
      const order = standardSeedOrder(bracketSize);

      for (let j = 0; j < stageDef.slotCount; j++) {
        const seedA = order[j * 2];
        const seedB = order[j * 2 + 1];
        const home = pool[seedA - 1] ?? null;
        const away = pool[seedB - 1] ?? null;
        const { matches, winner, loser } = resolveSlotMatches(stageDef, j + 1, home, away, carry);
        result.push(...matches);
        winners.push(winner);
        losers.push(loser);
      }
      firstStage = false;
    } else {
      for (let j = 0; j < stageDef.slotCount; j++) {
        const home = pool[j * 2] ?? null;
        const away = pool[j * 2 + 1] ?? null;
        const { matches, winner, loser } = resolveSlotMatches(stageDef, j + 1, home, away, carry);
        result.push(...matches);
        winners.push(winner);
        losers.push(loser);
      }
    }

    if (thirdPlaceStage && stages[s + 1]?.id === 'final') {
      loserPoolForThirdPlace = losers;
    }

    if (!winners.every(w => w !== null)) {
      pool = [];
      break;
    }
    pool = winners;
  }

  if (thirdPlaceStage) {
    const home = loserPoolForThirdPlace?.[0] ?? null;
    const away = loserPoolForThirdPlace?.[1] ?? null;
    const { matches } = resolveSlotMatches(thirdPlaceStage, 1, home, away, carry);
    result.push(...matches);
  }

  return result;
}

// ---------- Wizard-facing generators ----------

export interface WizardParticipantInput {
  name: string;
  team?: string;
}

export interface WizardFormatInput {
  hasGroupStage: boolean;
  groupCount: 0 | 1 | 2;
  qualifiersPerGroup: number;
  legs: 1 | 2; // global toggle applied to every generated stage except prelim/third_place
  hasThirdPlace: boolean;
}

export function generateParticipants(entries: WizardParticipantInput[], groupCount: 0 | 1 | 2): Participant[] {
  return entries.map((e, idx) => {
    const seed = idx + 1;
    let groupId: 'A' | 'B' | null = null;
    if (groupCount === 1) groupId = 'A';
    else if (groupCount === 2) groupId = idx % 2 === 0 ? 'A' : 'B';
    return { id: `p${seed}`, name: e.name, team: e.team, groupId, seed };
  });
}

export function generateChampionshipConfig(
  participantCount: number,
  format: WizardFormatInput
): ChampionshipConfig {
  const effectiveGroupCount = format.hasGroupStage ? format.groupCount : 0;
  const knockoutEntrantCount = format.hasGroupStage
    ? format.qualifiersPerGroup * effectiveGroupCount
    : participantCount;

  const ladder = buildStageLadder(knockoutEntrantCount);
  const stages: StageDef[] = ladder.map(s => (s.id === 'prelim' ? s : { ...s, legs: format.legs }));

  if (format.hasThirdPlace) {
    const finalStage = stages.find(s => s.id === 'final');
    const preFinalStage = stages[stages.length - 2];
    if (finalStage && preFinalStage && preFinalStage.slotCount === 2) {
      stages.push({
        id: 'third_place',
        label: 'Disputa de 3º Lugar',
        order: finalStage.order,
        slotCount: 1,
        legs: 1,
      });
    }
  }

  return {
    version: 1,
    participantCount,
    hasGroupStage: format.hasGroupStage,
    groupCount: effectiveGroupCount,
    qualifiersPerGroup: format.hasGroupStage ? format.qualifiersPerGroup : 0,
    stages,
  };
}

// Generates the initial knockoutMatches when there's no group stage (the knockout pool
// is known immediately). When there IS a group stage, knockout matches only appear once
// the group stage completes, so this correctly returns [] until then.
export function generateKnockoutSkeleton(config: ChampionshipConfig, participants: Participant[]): Match[] {
  const pool = resolveKnockoutSeedPool(config, participants, [], {});
  return advanceKnockoutStages(config, pool, []);
}

export function generateGroupMatchesForConfig(config: ChampionshipConfig, participants: Participant[]): Match[] {
  if (!config.hasGroupStage) return [];
  const groups: ('A' | 'B')[] = config.groupCount === 1 ? ['A'] : ['A', 'B'];
  return groups.flatMap(g => {
    const ids = participants
      .filter(p => p.groupId === g)
      .sort((a, b) => a.seed - b.seed)
      .map(p => p.id);
    return generateGroupStageMatches(g, ids);
  });
}

// The single entry point the setup wizard uses to turn a confirmed config + participant
// list into a fully playable TournamentState (group fixtures generated, first knockout
// stage generated when there's no group stage to wait on).
export function buildInitialTournamentState(config: ChampionshipConfig, participants: Participant[]): TournamentState {
  return {
    config,
    participants,
    groupMatches: generateGroupMatchesForConfig(config, participants),
    knockoutMatches: generateKnockoutSkeleton(config, participants),
    championId: null,
  };
}

export function getVisibleStages(config: ChampionshipConfig): StageDef[] {
  return [...config.stages].sort((a, b) => a.order - b.order);
}

// ---------- Legacy-state migration ----------

// Loose shape of a pre-wizard TournamentState JSON blob (the fixed 4-array bracket
// model this app used before the generic engine existed).
interface LegacyTournamentState {
  config?: ChampionshipConfig;
  participants?: (Partial<Participant> & { id: string; name: string; groupId: 'A' | 'B' | null })[];
  groupMatches?: Match[];
  qfMatches?: Match[];
  sfMatches?: Match[];
  finalMatch?: Match | null;
  thirdPlaceMatch?: Match | null;
  championId?: string | null;
}

// Detects the pre-wizard TournamentState shape (no config.version) and maps it onto the
// new generic model, preserving every score/penalty/completed flag verbatim. Idempotent:
// input that's already in the new shape is returned unchanged. Caller is expected to
// have already confirmed a tournament exists (i.e. raw is not null/undefined).
export function migrateLegacyState(raw: LegacyTournamentState): TournamentState {
  if (raw.config?.version === 1) {
    return raw as TournamentState;
  }
  const state = raw;

  const participants: Participant[] = (state.participants ?? []).map((p, idx) => ({
    id: p.id,
    name: p.name,
    team: p.team,
    groupId: p.groupId,
    seed: p.seed ?? idx + 1,
  }));

  const stages: StageDef[] = [
    { id: 'quarterfinals', label: 'Quartas de Final', order: 0, slotCount: 4, legs: 1 },
    { id: 'semifinals', label: 'Semifinal', order: 1, slotCount: 2, legs: 2 },
    { id: 'final', label: 'Final', order: 2, slotCount: 1, legs: 1 },
    { id: 'third_place', label: 'Disputa de 3º Lugar', order: 2, slotCount: 1, legs: 1 },
  ];

  const config: ChampionshipConfig = {
    version: 1,
    participantCount: participants.length,
    hasGroupStage: true,
    groupCount: 2,
    qualifiersPerGroup: 4,
    stages,
  };

  const knockoutMatches: Match[] = [];

  (state.qfMatches ?? []).forEach((m, idx) => {
    knockoutMatches.push({ ...m, id: buildMatchId('quarterfinals', idx + 1, 1), stage: 'quarterfinals', slot: idx + 1, leg: 1 });
  });

  const sfSlotByLegacyId: Record<string, { slot: number; leg: 1 | 2 }> = {
    sf1_ida: { slot: 1, leg: 1 },
    sf1_volta: { slot: 1, leg: 2 },
    sf2_ida: { slot: 2, leg: 1 },
    sf2_volta: { slot: 2, leg: 2 },
  };
  (state.sfMatches ?? []).forEach((m) => {
    const mapping = sfSlotByLegacyId[m.id];
    if (!mapping) return;
    knockoutMatches.push({ ...m, id: buildMatchId('semifinals', mapping.slot, mapping.leg), stage: 'semifinals', slot: mapping.slot, leg: mapping.leg });
  });

  if (state.finalMatch) {
    knockoutMatches.push({ ...state.finalMatch, id: buildMatchId('final', 1, 1), stage: 'final', slot: 1, leg: 1 });
  }

  if (state.thirdPlaceMatch) {
    knockoutMatches.push({ ...state.thirdPlaceMatch, id: buildMatchId('third_place', 1, 1), stage: 'third_place', slot: 1, leg: 1 });
  }

  return {
    config,
    participants,
    groupMatches: state.groupMatches ?? [],
    knockoutMatches,
    championId: state.championId ?? null,
  };
}
