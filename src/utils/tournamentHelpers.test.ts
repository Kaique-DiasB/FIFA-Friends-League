import { describe, it, expect } from 'vitest';
import {
  previousPowerOfTwo,
  standardSeedOrder,
  computeBracketPlan,
  buildStageLadder,
  generateRoundRobinFixture,
  generateCrossoverPairings,
  getMatchWinner,
  getTwoLegAggregateResult,
  buildMatchId,
  resolveKnockoutSeedPool,
  advanceKnockoutStages,
  generateChampionshipConfig,
  generateParticipants,
  migrateLegacyState,
  calculateStandings,
} from './tournamentHelpers';
import { Match, Participant, Standing } from '../types/tournament';

// ---------- previousPowerOfTwo / standardSeedOrder ----------

describe('previousPowerOfTwo', () => {
  it.each([
    [2, 2], [3, 2], [4, 4], [5, 4], [6, 4], [7, 4], [8, 8], [10, 8], [16, 16],
  ])('previousPowerOfTwo(%i) === %i', (n, expected) => {
    expect(previousPowerOfTwo(n)).toBe(expected);
  });
});

describe('standardSeedOrder', () => {
  it('matches the classic tennis-style seeding order', () => {
    expect(standardSeedOrder(2)).toEqual([1, 2]);
    expect(standardSeedOrder(4)).toEqual([1, 4, 2, 3]);
    expect(standardSeedOrder(8)).toEqual([1, 8, 4, 5, 2, 7, 3, 6]);
  });
});

// ---------- computeBracketPlan / buildStageLadder ----------

describe('computeBracketPlan', () => {
  it.each([
    [2, { bracketSize: 2, prelimMatches: 0 }],
    [3, { bracketSize: 2, prelimMatches: 1 }],
    [5, { bracketSize: 4, prelimMatches: 1 }],
    [6, { bracketSize: 4, prelimMatches: 2 }],
    [7, { bracketSize: 4, prelimMatches: 3 }],
    [8, { bracketSize: 8, prelimMatches: 0 }],
    [10, { bracketSize: 8, prelimMatches: 2 }],
    [16, { bracketSize: 16, prelimMatches: 0 }],
  ])('computeBracketPlan(%i)', (n, expected) => {
    expect(computeBracketPlan(n)).toEqual(expected);
  });
});

describe('buildStageLadder', () => {
  it('N=8: quarterfinals -> semifinals -> final, no prelim', () => {
    const stages = buildStageLadder(8);
    expect(stages.map(s => s.id)).toEqual(['quarterfinals', 'semifinals', 'final']);
    expect(stages.map(s => s.slotCount)).toEqual([4, 2, 1]);
  });

  it('N=6: prelim -> semifinals -> final', () => {
    const stages = buildStageLadder(6);
    expect(stages.map(s => s.id)).toEqual(['prelim', 'semifinals', 'final']);
    expect(stages.map(s => s.slotCount)).toEqual([2, 2, 1]);
  });

  it('N=16: round_of_16 -> quarterfinals -> semifinals -> final', () => {
    const stages = buildStageLadder(16);
    expect(stages.map(s => s.id)).toEqual(['round_of_16', 'quarterfinals', 'semifinals', 'final']);
    expect(stages.map(s => s.slotCount)).toEqual([8, 4, 2, 1]);
  });

  it('N=2: final only', () => {
    expect(buildStageLadder(2).map(s => s.id)).toEqual(['final']);
  });

  it('N=3: prelim -> final', () => {
    const stages = buildStageLadder(3);
    expect(stages.map(s => s.id)).toEqual(['prelim', 'final']);
    expect(stages.map(s => s.slotCount)).toEqual([1, 1]);
  });
});

// ---------- generateRoundRobinFixture ----------

function assertRoundRobinIsComplete(groupSize: number) {
  const { matches, byeByRound, rounds } = generateRoundRobinFixture(groupSize);
  const seenPairs = new Set<string>();
  matches.forEach(m => {
    const key = [m.homeIdx, m.awayIdx].sort((a, b) => a - b).join('-');
    expect(seenPairs.has(key)).toBe(false); // no pair should repeat
    seenPairs.add(key);
  });

  const expectedPairCount = (groupSize * (groupSize - 1)) / 2;
  expect(seenPairs.size).toBe(expectedPairCount);

  if (groupSize % 2 !== 0) {
    // odd size: exactly one bye per round, and every player gets exactly one bye overall
    expect(Object.keys(byeByRound).length).toBe(rounds);
    const byeCounts: Record<number, number> = {};
    Object.values(byeByRound).forEach(idx => {
      byeCounts[idx] = (byeCounts[idx] ?? 0) + 1;
    });
    Object.values(byeCounts).forEach(count => expect(count).toBe(1));
    expect(Object.keys(byeCounts).length).toBe(groupSize);
  } else {
    expect(Object.keys(byeByRound).length).toBe(0);
  }
}

describe('generateRoundRobinFixture', () => {
  it('N=5 (odd): 5 rounds, 2 matches/round, 1 bye/round, full round-robin', () => {
    const { matches, rounds } = generateRoundRobinFixture(5);
    expect(rounds).toBe(5);
    expect(matches.length).toBe(10);
    assertRoundRobinIsComplete(5);
  });

  it('N=4 (even): 3 rounds, 2 matches/round, no byes', () => {
    const { matches, rounds, byeByRound } = generateRoundRobinFixture(4);
    expect(rounds).toBe(3);
    expect(matches.length).toBe(6);
    expect(byeByRound).toEqual({});
    assertRoundRobinIsComplete(4);
  });

  it.each([3, 4, 5, 6, 7, 8])('is a complete round-robin for group size %i', (n) => {
    assertRoundRobinIsComplete(n);
  });
});

// ---------- generateCrossoverPairings ----------

describe('generateCrossoverPairings', () => {
  it('interleaves group ranks A1,B1,A2,B2,...', () => {
    expect(generateCrossoverPairings(4)).toEqual([
      { group: 'A', rank: 1 }, { group: 'B', rank: 1 },
      { group: 'A', rank: 2 }, { group: 'B', rank: 2 },
      { group: 'A', rank: 3 }, { group: 'B', rank: 3 },
      { group: 'A', rank: 4 }, { group: 'B', rank: 4 },
    ]);
  });

  it('combined with standardSeedOrder(8), reproduces the legacy 1stA-4thB crossover pairing set for Q=4', () => {
    const seeds = generateCrossoverPairings(4); // index0 = seed1 ... index7 = seed8
    const order = standardSeedOrder(8);
    const pairs = new Set<string>();
    for (let i = 0; i < order.length; i += 2) {
      const a = seeds[order[i] - 1];
      const b = seeds[order[i + 1] - 1];
      const key = [`${a.group}${a.rank}`, `${b.group}${b.rank}`].sort().join('-');
      pairs.add(key);
    }
    expect(pairs).toEqual(new Set(['A1-B4', 'A3-B2', 'A4-B1', 'A2-B3']));
  });
});

// ---------- getMatchWinner / getTwoLegAggregateResult ----------

function makeMatch(overrides: Partial<Match>): Match {
  return {
    id: 'm', stage: 'quarterfinals', round: 1, slot: 1, leg: 1,
    homeId: 'home', awayId: 'away', completed: false,
    ...overrides,
  };
}

describe('getMatchWinner', () => {
  it('returns null when not completed', () => {
    expect(getMatchWinner(makeMatch({ completed: false }))).toBeNull();
  });

  it('decides by score', () => {
    expect(getMatchWinner(makeMatch({ completed: true, homeScore: 2, awayScore: 1 }))).toBe('home');
    expect(getMatchWinner(makeMatch({ completed: true, homeScore: 1, awayScore: 2 }))).toBe('away');
  });

  it('falls back to penalties on a draw', () => {
    expect(getMatchWinner(makeMatch({
      completed: true, homeScore: 1, awayScore: 1, homePenalties: 4, awayPenalties: 3,
    }))).toBe('home');
  });
});

describe('getTwoLegAggregateResult', () => {
  it('team1 (home in leg1) wins on aggregate', () => {
    const leg1 = makeMatch({ id: 'l1', leg: 1, homeId: 't1', awayId: 't2', completed: true, homeScore: 3, awayScore: 1 });
    const leg2 = makeMatch({ id: 'l2', leg: 2, homeId: 't2', awayId: 't1', completed: true, homeScore: 1, awayScore: 0 });
    const result = getTwoLegAggregateResult(leg1, leg2, 't1', 't2');
    expect(result.team1Agg).toBe(3); // 3 (leg1 home) + 0 (leg2 away)
    expect(result.team2Agg).toBe(2); // 1 (leg1 away) + 1 (leg2 home)
    expect(result.winnerId).toBe('t1');
  });

  it('resolves a tie via leg2 penalties', () => {
    const leg1 = makeMatch({ id: 'l1', leg: 1, homeId: 't1', awayId: 't2', completed: true, homeScore: 1, awayScore: 0 });
    const leg2 = makeMatch({
      id: 'l2', leg: 2, homeId: 't2', awayId: 't1', completed: true, homeScore: 1, awayScore: 0,
      homePenalties: 3, awayPenalties: 5,
    });
    const result = getTwoLegAggregateResult(leg1, leg2, 't1', 't2');
    expect(result.isTied).toBe(true);
    expect(result.winnerId).toBe('t1'); // t1's penalties = leg2.awayPenalties = 5 > t2's 3
  });
});

// ---------- advanceKnockoutStages: end-to-end scenarios ----------

function buildParticipants(count: number, groupCount: 0 | 1 | 2): Participant[] {
  return generateParticipants(
    Array.from({ length: count }, (_, i) => ({ name: `Jogador ${i + 1}` })),
    groupCount
  );
}

describe('advanceKnockoutStages: N=10, 2 groups of 5, single-leg knockout', () => {
  const participants = buildParticipants(10, 2);
  const config = generateChampionshipConfig(10, {
    hasGroupStage: true, groupCount: 2, qualifiersPerGroup: 4, legs: 1, hasThirdPlace: true,
  });
  const completedGroupMatches: Match[] = [makeMatch({ id: 'g1', stage: 'groups', completed: true })];

  const standingsByGroup: Record<'A' | 'B', Standing[]> = {
    A: ['p1', 'p3', 'p5', 'p7', 'p9'].map(id => ({
      participantId: id, games: 4, wins: 3, draws: 0, losses: 1, goalsFor: 10, goalsAgainst: 4, goalDifference: 6, points: 9,
    })),
    B: ['p2', 'p4', 'p6', 'p8', 'p10'].map(id => ({
      participantId: id, games: 4, wins: 3, draws: 0, losses: 1, goalsFor: 10, goalsAgainst: 4, goalDifference: 6, points: 9,
    })),
  };

  it('generates 4 quarterfinal matches from group qualifiers, nothing beyond', () => {
    const pool = resolveKnockoutSeedPool(config, participants, completedGroupMatches, standingsByGroup);
    expect(pool).toHaveLength(8);

    const knockoutMatches = advanceKnockoutStages(config, pool, []);
    const byStage = (stage: string) => knockoutMatches.filter(m => m.stage === stage);
    expect(byStage('quarterfinals')).toHaveLength(4);
    expect(byStage('semifinals')).toHaveLength(0);
    expect(byStage('final')).toHaveLength(0);
    expect(byStage('third_place')).toHaveLength(0);
  });

  it('cascades to semifinals once QFs complete, preserving no stray scores', () => {
    const pool = resolveKnockoutSeedPool(config, participants, completedGroupMatches, standingsByGroup);
    let knockoutMatches = advanceKnockoutStages(config, pool, []);

    knockoutMatches = knockoutMatches.map(m =>
      m.stage === 'quarterfinals' ? { ...m, homeScore: 2, awayScore: 0, completed: true } : m
    );
    knockoutMatches = advanceKnockoutStages(config, pool, knockoutMatches);

    const sf = knockoutMatches.filter(m => m.stage === 'semifinals');
    expect(sf).toHaveLength(2);
    expect(knockoutMatches.filter(m => m.stage === 'final')).toHaveLength(0);
    expect(knockoutMatches.filter(m => m.stage === 'third_place')).toHaveLength(0);
  });

  it('cascades to final + third place once SFs complete, and re-running with identical pairings keeps prior scores', () => {
    const pool = resolveKnockoutSeedPool(config, participants, completedGroupMatches, standingsByGroup);
    let knockoutMatches = advanceKnockoutStages(config, pool, []);
    knockoutMatches = knockoutMatches.map(m =>
      m.stage === 'quarterfinals' ? { ...m, homeScore: 2, awayScore: 0, completed: true } : m
    );
    knockoutMatches = advanceKnockoutStages(config, pool, knockoutMatches);
    knockoutMatches = knockoutMatches.map(m =>
      m.stage === 'semifinals' ? { ...m, homeScore: 1, awayScore: 0, completed: true } : m
    );
    knockoutMatches = advanceKnockoutStages(config, pool, knockoutMatches);

    expect(knockoutMatches.filter(m => m.stage === 'final')).toHaveLength(1);
    expect(knockoutMatches.filter(m => m.stage === 'third_place')).toHaveLength(1);

    // Re-running with the exact same pool/prev matches must not wipe already-entered scores.
    const again = advanceKnockoutStages(config, pool, knockoutMatches);
    const qfBefore = knockoutMatches.filter(m => m.stage === 'quarterfinals');
    const qfAfter = again.filter(m => m.stage === 'quarterfinals');
    expect(qfAfter).toEqual(qfBefore);
  });
});

describe('advanceKnockoutStages: N=6, no group stage, preliminary round', () => {
  const participants = buildParticipants(6, 0);
  const config = generateChampionshipConfig(6, {
    hasGroupStage: false, groupCount: 0, qualifiersPerGroup: 0, legs: 1, hasThirdPlace: false,
  });

  it('pairs the two weakest seeds against the next-weakest pair in the prelim round', () => {
    const pool = resolveKnockoutSeedPool(config, participants, [], {});
    expect(pool).toEqual(['p1', 'p2', 'p3', 'p4', 'p5', 'p6']);

    const knockoutMatches = advanceKnockoutStages(config, pool, []);
    const prelim = knockoutMatches.filter(m => m.stage === 'prelim');
    expect(prelim).toHaveLength(2);
    expect([prelim[0].homeId, prelim[0].awayId].sort()).toEqual(['p3', 'p6']);
    expect([prelim[1].homeId, prelim[1].awayId].sort()).toEqual(['p4', 'p5']);
    expect(knockoutMatches.filter(m => m.stage === 'semifinals')).toHaveLength(0);
  });

  it('seeds p1/p2 (byes) against prelim winners once prelim completes', () => {
    const pool = resolveKnockoutSeedPool(config, participants, [], {});
    let knockoutMatches = advanceKnockoutStages(config, pool, []);
    knockoutMatches = knockoutMatches.map(m => {
      if (m.stage !== 'prelim') return m;
      // p3 beats p6, p4 beats p5
      const homeWins = m.homeId === 'p3' || m.homeId === 'p4';
      return { ...m, homeScore: homeWins ? 1 : 0, awayScore: homeWins ? 0 : 1, completed: true };
    });
    knockoutMatches = advanceKnockoutStages(config, pool, knockoutMatches);

    const sf = knockoutMatches.filter(m => m.stage === 'semifinals');
    expect(sf).toHaveLength(2);
    const sfPairs = sf.map(m => [m.homeId, m.awayId].sort().join('-')).sort();
    expect(sfPairs).toEqual(['p1-p4', 'p2-p3'].sort());
  });
});

describe('advanceKnockoutStages: N=8, no group stage, two-leg globally (including final)', () => {
  const participants = buildParticipants(8, 0);
  const config = generateChampionshipConfig(8, {
    hasGroupStage: false, groupCount: 0, qualifiersPerGroup: 0, legs: 2, hasThirdPlace: true,
  });

  it('generates 2 legs per quarterfinal slot, with home/away swapped on leg 2', () => {
    const pool = resolveKnockoutSeedPool(config, participants, [], {});
    const knockoutMatches = advanceKnockoutStages(config, pool, []);
    const qf = knockoutMatches.filter(m => m.stage === 'quarterfinals');
    expect(qf).toHaveLength(8); // 4 slots x 2 legs

    const bySlot = new Map<number, Match[]>();
    qf.forEach(m => {
      const list = bySlot.get(m.slot!) ?? [];
      list.push(m);
      bySlot.set(m.slot!, list);
    });
    bySlot.forEach(legs => {
      const leg1 = legs.find(m => m.leg === 1)!;
      const leg2 = legs.find(m => m.leg === 2)!;
      expect(leg1.homeId).toBe(leg2.awayId);
      expect(leg1.awayId).toBe(leg2.homeId);
    });
  });

  it('third place is two-leg-free (always single match) even though the global toggle is two-leg', () => {
    const pool = resolveKnockoutSeedPool(config, participants, [], {});
    let knockoutMatches = advanceKnockoutStages(config, pool, []);
    // Home team of leg1 wins both legs on aggregate: leg1 home=2/away=0, leg2 (home/away
    // swapped) home=0/away=2 — so the leg1-home side scores 2+2=4 on aggregate vs 0.
    const completeStage = (stage: string, matches: Match[]): Match[] =>
      matches.map(m => {
        if (m.stage !== stage) return m;
        return m.leg === 2
          ? { ...m, homeScore: 0, awayScore: 2, completed: true }
          : { ...m, homeScore: 2, awayScore: 0, completed: true };
      });

    knockoutMatches = completeStage('quarterfinals', knockoutMatches);
    knockoutMatches = advanceKnockoutStages(config, pool, knockoutMatches);
    knockoutMatches = completeStage('semifinals', knockoutMatches);
    knockoutMatches = advanceKnockoutStages(config, pool, knockoutMatches);

    expect(knockoutMatches.filter(m => m.stage === 'final')).toHaveLength(2); // two-leg final
    expect(knockoutMatches.filter(m => m.stage === 'third_place')).toHaveLength(1); // always single match
  });
});

// ---------- Regression: score preservation across slot renumbering ----------

describe('advanceKnockoutStages: preserves scores when the same pairing lands on a different slot number', () => {
  it('carries scores by (stage, leg, homeId, awayId) rather than by match id', () => {
    const config = generateChampionshipConfig(10, {
      hasGroupStage: true, groupCount: 2, qualifiersPerGroup: 4, legs: 1, hasThirdPlace: false,
    });
    // Interleaved seed pool matching generateCrossoverPairings(4): A1,B1,A2,B2,A3,B3,A4,B4
    const pool = ['a1', 'b1', 'a2', 'b2', 'a3', 'b3', 'a4', 'b4'];

    // A legacy-shaped quarterfinal set (qf1..qf4, sequential slot numbers) with the same
    // four pairings the new engine will derive from `pool`, but assigned to DIFFERENT
    // slots than the new standardSeedOrder-based numbering produces (verified: slots 3
    // and 4 end up swapped between the two numbering schemes for this exact pool).
    const legacyQf: Match[] = [
      { id: buildMatchId('quarterfinals', 1, 1), stage: 'quarterfinals', round: 1, slot: 1, leg: 1, homeId: 'a1', awayId: 'b4', homeScore: 3, awayScore: 1, completed: true },
      { id: buildMatchId('quarterfinals', 2, 1), stage: 'quarterfinals', round: 1, slot: 2, leg: 1, homeId: 'b2', awayId: 'a3', homeScore: 2, awayScore: 0, completed: true },
      { id: buildMatchId('quarterfinals', 3, 1), stage: 'quarterfinals', round: 1, slot: 3, leg: 1, homeId: 'a2', awayId: 'b3', homeScore: 1, awayScore: 0, completed: true },
      { id: buildMatchId('quarterfinals', 4, 1), stage: 'quarterfinals', round: 1, slot: 4, leg: 1, homeId: 'b1', awayId: 'a4', homeScore: 0, awayScore: 2, completed: true },
    ];

    const recomputed = advanceKnockoutStages(config, pool, legacyQf);
    const qf = recomputed.filter(m => m.stage === 'quarterfinals');
    expect(qf).toHaveLength(4);

    // Every one of the four original pairings must still carry its original score,
    // regardless of which slot number it landed on this time.
    const byPairing = new Map(qf.map(m => [`${m.homeId}-${m.awayId}`, m]));
    expect(byPairing.get('a1-b4')).toMatchObject({ homeScore: 3, awayScore: 1, completed: true });
    expect(byPairing.get('b2-a3')).toMatchObject({ homeScore: 2, awayScore: 0, completed: true });
    expect(byPairing.get('a2-b3')).toMatchObject({ homeScore: 1, awayScore: 0, completed: true });
    expect(byPairing.get('b1-a4')).toMatchObject({ homeScore: 0, awayScore: 2, completed: true });

    // Sanity: at least one pairing actually moved slots (otherwise this test wouldn't
    // exercise the renumbering case at all).
    const slotByPairing = new Map(qf.map(m => [`${m.homeId}-${m.awayId}`, m.slot]));
    expect(slotByPairing.get('a2-b3')).not.toBe(3);
  });
});

// ---------- migrateLegacyState ----------

describe('migrateLegacyState', () => {
  const legacyState = {
    participants: Array.from({ length: 10 }, (_, i) => ({
      id: i < 5 ? `a${i + 1}` : `b${i - 4}`,
      name: `Jogador ${i + 1}`,
      groupId: (i < 5 ? 'A' : 'B') as 'A' | 'B',
    })),
    groupMatches: [makeMatch({ id: 'group_a_r1_m1', stage: 'groups', completed: true })],
    qfMatches: [
      makeMatch({ id: 'qf1', stage: 'quarterfinals', homeId: 'a1', awayId: 'b4', completed: true, homeScore: 3, awayScore: 1 }),
      makeMatch({ id: 'qf2', stage: 'quarterfinals', homeId: 'b2', awayId: 'a3', completed: true, homeScore: 2, awayScore: 2, homePenalties: 5, awayPenalties: 4 }),
      makeMatch({ id: 'qf3', stage: 'quarterfinals', homeId: 'a2', awayId: 'b3', completed: false }),
      makeMatch({ id: 'qf4', stage: 'quarterfinals', homeId: 'b1', awayId: 'a4', completed: false }),
    ],
    sfMatches: [
      makeMatch({ id: 'sf1_ida', stage: 'semifinals', homeId: 'a1', awayId: 'b2', completed: false }),
      makeMatch({ id: 'sf1_volta', stage: 'semifinals', homeId: 'b2', awayId: 'a1', completed: false }),
      makeMatch({ id: 'sf2_ida', stage: 'semifinals', homeId: 'b1', awayId: 'a2', completed: false }),
      makeMatch({ id: 'sf2_volta', stage: 'semifinals', homeId: 'a2', awayId: 'b1', completed: false }),
    ],
    finalMatch: null,
    thirdPlaceMatch: null,
    championId: null,
  };

  it('synthesizes the legacy config (10 participants, 2 groups of 5, Q=4)', () => {
    const migrated = migrateLegacyState(legacyState);
    expect(migrated.config?.version).toBe(1);
    expect(migrated.config?.hasGroupStage).toBe(true);
    expect(migrated.config?.groupCount).toBe(2);
    expect(migrated.config?.qualifiersPerGroup).toBe(4);
  });

  it('preserves scores/penalties/completed while remapping ids', () => {
    const migrated = migrateLegacyState(legacyState);
    const qf1 = migrated.knockoutMatches!.find(m => m.id === buildMatchId('quarterfinals', 1, 1));
    expect(qf1).toMatchObject({ homeId: 'a1', awayId: 'b4', homeScore: 3, awayScore: 1, completed: true });

    const qf2 = migrated.knockoutMatches!.find(m => m.id === buildMatchId('quarterfinals', 2, 1));
    expect(qf2).toMatchObject({ homePenalties: 5, awayPenalties: 4 });

    const sf1Leg2 = migrated.knockoutMatches!.find(m => m.id === buildMatchId('semifinals', 1, 2));
    expect(sf1Leg2).toMatchObject({ homeId: 'b2', awayId: 'a1' });
  });

  it('is idempotent', () => {
    const once = migrateLegacyState(legacyState);
    const twice = migrateLegacyState(once);
    expect(twice).toEqual(once);
  });
});

// ---------- calculateStandings regression (behavior must not change) ----------

describe('calculateStandings', () => {
  it('orders by points, then goal difference, then goals for', () => {
    const participants: Participant[] = [
      { id: 'a1', name: 'Um', groupId: 'A', seed: 1 },
      { id: 'a2', name: 'Dois', groupId: 'A', seed: 2 },
      { id: 'a3', name: 'Três', groupId: 'A', seed: 3 },
    ];
    const matches: Match[] = [
      makeMatch({ id: 'm1', stage: 'groups', groupId: 'A', homeId: 'a1', awayId: 'a2', completed: true, homeScore: 3, awayScore: 0 }),
      makeMatch({ id: 'm2', stage: 'groups', groupId: 'A', homeId: 'a2', awayId: 'a3', completed: true, homeScore: 1, awayScore: 1 }),
      makeMatch({ id: 'm3', stage: 'groups', groupId: 'A', homeId: 'a3', awayId: 'a1', completed: true, homeScore: 0, awayScore: 2 }),
    ];
    const standings = calculateStandings('A', participants, matches);
    expect(standings.map(s => s.participantId)).toEqual(['a1', 'a3', 'a2']);
    expect(standings[0].points).toBe(6);
  });
});
