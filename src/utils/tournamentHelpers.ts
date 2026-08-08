import { Participant, Match, Standing, TournamentState } from '../types/tournament';

// Static fixtures index mapping (1-based index of players in group)
export const GROUP_STAGE_FIXTURE = [
  // Round 1
  { round: 1, homeIdx: 2, awayIdx: 5, byeIdx: 1 },
  { round: 1, homeIdx: 3, awayIdx: 4, byeIdx: 1 },
  // Round 2
  { round: 2, homeIdx: 1, awayIdx: 5, byeIdx: 4 },
  { round: 2, homeIdx: 2, awayIdx: 3, byeIdx: 4 },
  // Round 3
  { round: 3, homeIdx: 1, awayIdx: 4, byeIdx: 2 },
  { round: 3, homeIdx: 5, awayIdx: 3, byeIdx: 2 },
  // Round 4
  { round: 4, homeIdx: 1, awayIdx: 3, byeIdx: 5 },
  { round: 4, homeIdx: 4, awayIdx: 2, byeIdx: 5 },
  // Round 5
  { round: 5, homeIdx: 1, awayIdx: 2, byeIdx: 3 },
  { round: 5, homeIdx: 4, awayIdx: 5, byeIdx: 3 },
];

export const DEFAULT_PARTICIPANTS: Participant[] = [
  { id: 'a1', name: 'Participante A1', groupId: 'A' },
  { id: 'a2', name: 'Participante A2', groupId: 'A' },
  { id: 'a3', name: 'Participante A3', groupId: 'A' },
  { id: 'a4', name: 'Participante A4', groupId: 'A' },
  { id: 'a5', name: 'Participante A5', groupId: 'A' },
  { id: 'b1', name: 'Participante B1', groupId: 'B' },
  { id: 'b2', name: 'Participante B2', groupId: 'B' },
  { id: 'b3', name: 'Participante B3', groupId: 'B' },
  { id: 'b4', name: 'Participante B4', groupId: 'B' },
  { id: 'b5', name: 'Participante B5', groupId: 'B' },
];

export function generateGroupMatches(group: 'A' | 'B'): Match[] {
  const matches: Match[] = [];
  GROUP_STAGE_FIXTURE.forEach((f, index) => {
    matches.push({
      id: `group_${group.toLowerCase()}_r${f.round}_m${(index % 2) + 1}`,
      stage: 'groups',
      groupId: group,
      round: f.round,
      homeId: `${group.toLowerCase()}${f.homeIdx}`,
      awayId: `${group.toLowerCase()}${f.awayIdx}`,
      completed: false,
    });
  });
  return matches;
}

export function getRoundBye(group: 'A' | 'B', round: number): string {
  const f = GROUP_STAGE_FIXTURE.find(item => item.round === round);
  if (!f) return '';
  return `${group.toLowerCase()}${f.byeIdx}`;
}

export function generateDefaultState(): TournamentState {
  const groupMatches = [
    ...generateGroupMatches('A'),
    ...generateGroupMatches('B'),
  ];
  return {
    participants: DEFAULT_PARTICIPANTS,
    groupMatches,
    qfMatches: [],
    sfMatches: [],
    finalMatch: null,
    thirdPlaceMatch: null,
    championId: null,
  };
}

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

export function initializeQuarterfinals(
  standingsA: Standing[],
  standingsB: Standing[]
): Match[] {
  if (standingsA.length < 4 || standingsB.length < 4) return [];

  const firstA = standingsA[0].participantId;
  const secondA = standingsA[1].participantId;
  const thirdA = standingsA[2].participantId;
  const fourthA = standingsA[3].participantId;

  const firstB = standingsB[0].participantId;
  const secondB = standingsB[1].participantId;
  const thirdB = standingsB[2].participantId;
  const fourthB = standingsB[3].participantId;

  return [
    // QF1: 1º Grupo A  vs  4º Grupo B
    {
      id: 'qf1',
      stage: 'quarterfinals',
      round: 1,
      homeId: firstA,
      awayId: fourthB,
      completed: false,
    },
    // QF2: 2º Grupo B  vs  3º Grupo A
    {
      id: 'qf2',
      stage: 'quarterfinals',
      round: 1,
      homeId: secondB,
      awayId: thirdA,
      completed: false,
    },
    // QF3: 2º Grupo A  vs  3º Grupo B
    {
      id: 'qf3',
      stage: 'quarterfinals',
      round: 1,
      homeId: secondA,
      awayId: thirdB,
      completed: false,
    },
    // QF4: 1º Grupo B  vs  4º Grupo A
    {
      id: 'qf4',
      stage: 'quarterfinals',
      round: 1,
      homeId: firstB,
      awayId: fourthA,
      completed: false,
    },
  ];
}

export function checkQuarterfinalsComplete(qfMatches: Match[]): boolean {
  if (qfMatches.length !== 4) return false;
  return qfMatches.every(m => {
    if (!m.completed) return false;
    const hs = m.homeScore ?? 0;
    const as = m.awayScore ?? 0;
    if (hs !== as) return true;
    
    // Check penalties if tied
    const hp = m.homePenalties;
    const ap = m.awayPenalties;
    return hp !== null && hp !== undefined && ap !== null && ap !== undefined && hp !== ap;
  });
}

export function getQuarterfinalWinner(match: Match): string | null {
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

export function getThirdPlaceWinner(match: Match | null): string | null {
  if (!match || !match.completed) return null;
  const hs = match.homeScore;
  const as = match.awayScore;
  const hp = match.homePenalties;
  const ap = match.awayPenalties;
  if (hs !== undefined && hs !== null && as !== undefined && as !== null) {
    if (hs > as) return match.homeId;
    if (as > hs) return match.awayId;
    if (hp !== undefined && hp !== null && ap !== undefined && ap !== null) {
      if (hp > ap) return match.homeId;
      if (ap > hp) return match.awayId;
    }
  }
  return null;
}

export function initializeSemifinals(
  qfMatches: Match[]
): Match[] {
  if (qfMatches.length !== 4) return [];

  const qf1Match = qfMatches.find(m => m.id === 'qf1')!;
  const qf2Match = qfMatches.find(m => m.id === 'qf2')!;
  const qf3Match = qfMatches.find(m => m.id === 'qf3')!;
  const qf4Match = qfMatches.find(m => m.id === 'qf4')!;

  if (!qf1Match || !qf2Match || !qf3Match || !qf4Match) return [];

  const w1 = getQuarterfinalWinner(qf1Match);
  const w2 = getQuarterfinalWinner(qf2Match);
  const w3 = getQuarterfinalWinner(qf3Match);
  const w4 = getQuarterfinalWinner(qf4Match);

  if (!w1 || !w2 || !w3 || !w4) return [];

  return [
    // Semifinal 1: Vencedor QF1 x Vencedor QF3
    {
      id: 'sf1_ida',
      stage: 'semifinals',
      round: 1, // Ida
      homeId: w1,
      awayId: w3,
      completed: false,
    },
    {
      id: 'sf1_volta',
      stage: 'semifinals',
      round: 2, // Volta
      homeId: w3,
      awayId: w1,
      completed: false,
    },
    // Semifinal 2: Vencedor QF4 x Vencedor QF2
    {
      id: 'sf2_ida',
      stage: 'semifinals',
      round: 1, // Ida
      homeId: w4,
      awayId: w2,
      completed: false,
    },
    {
      id: 'sf2_volta',
      stage: 'semifinals',
      round: 2, // Volta
      homeId: w2,
      awayId: w4,
      completed: false,
    },
  ];
}

export interface SemifinalResult {
  winnerId: string | null;
  team1Id: string;
  team2Id: string;
  team1Agg: number;
  team2Agg: number;
  isTied: boolean;
  team1Pen?: number | null;
  team2Pen?: number | null;
}

export function getSemifinalResult(
  ida: Match,
  volta: Match,
  team1Id: string,
  team2Id: string
): SemifinalResult {
  const result: SemifinalResult = {
    winnerId: null,
    team1Id,
    team2Id,
    team1Agg: 0,
    team2Agg: 0,
    isTied: false,
  };

  if (!ida || !volta || !ida.completed || !volta.completed) {
    return result;
  }

  const h1 = ida.homeScore ?? 0;
  const a1 = ida.awayScore ?? 0;
  const h2 = volta.homeScore ?? 0;
  const a2 = volta.awayScore ?? 0;

  // team1Id is home in ida, away in volta
  // team2Id is away in ida, home in volta
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
    const team1Pen = volta.awayPenalties; // team1 is away in volta
    const team2Pen = volta.homePenalties; // team2 is home in volta
    result.team1Pen = team1Pen;
    result.team2Pen = team2Pen;

    if (
      team1Pen !== undefined &&
      team1Pen !== null &&
      team2Pen !== undefined &&
      team2Pen !== null
    ) {
      if (team1Pen > team2Pen) {
        result.winnerId = team1Id;
      } else if (team2Pen > team1Pen) {
        result.winnerId = team2Id;
      }
    }
  }

  return result;
}

export function checkSemifinalsComplete(
  sfMatches: Match[],
  qfMatches: Match[]
): boolean {
  if (sfMatches.length !== 4) return false;
  if (!sfMatches.every(m => m.completed)) return false;

  const qf1Match = qfMatches.find(m => m.id === 'qf1')!;
  const qf2Match = qfMatches.find(m => m.id === 'qf2')!;
  const qf3Match = qfMatches.find(m => m.id === 'qf3')!;
  const qf4Match = qfMatches.find(m => m.id === 'qf4')!;

  const w1 = getQuarterfinalWinner(qf1Match);
  const w2 = getQuarterfinalWinner(qf2Match);
  const w3 = getQuarterfinalWinner(qf3Match);
  const w4 = getQuarterfinalWinner(qf4Match);

  if (!w1 || !w2 || !w3 || !w4) return false;

  const sf1Ida = sfMatches.find(m => m.id === 'sf1_ida')!;
  const sf1Volta = sfMatches.find(m => m.id === 'sf1_volta')!;
  const sf2Ida = sfMatches.find(m => m.id === 'sf2_ida')!;
  const sf2Volta = sfMatches.find(m => m.id === 'sf2_volta')!;

  const res1 = getSemifinalResult(sf1Ida, sf1Volta, w1, w3);
  const res2 = getSemifinalResult(sf2Ida, sf2Volta, w4, w2);

  return res1.winnerId !== null && res2.winnerId !== null;
}

export function generateSummaryText(
  state: TournamentState,
  namesMap: Record<string, string>
): string {
  const standingsA = calculateStandings('A', state.participants, state.groupMatches);
  const standingsB = calculateStandings('B', state.participants, state.groupMatches);

  let text = `=== CAMPEONATO DE FIFA - RESUMO DO TORNEIO ===\n\n`;

  // Participants
  text += `PARTICIPANTES:\n`;
  text += `Grupo A:\n`;
  state.participants.filter(p => p.groupId === 'A').forEach(p => {
    text += ` - ${p.name}\n`;
  });
  text += `Grupo B:\n`;
  state.participants.filter(p => p.groupId === 'B').forEach(p => {
    text += ` - ${p.name}\n`;
  });
  text += `\n`;

  // Standings
  const renderStandingRow = (s: Standing, rank: number) => {
    const name = namesMap[s.participantId] || '';
    return `${rank}º ${name.padEnd(20)} | PTS: ${s.points} | J: ${s.games} | V: ${s.wins} | E: ${s.draws} | D: ${s.losses} | GP: ${s.goalsFor} | GC: ${s.goalsAgainst} | SG: ${s.goalDifference}\n`;
  };

  text += `CLASSIFICAÇÃO:\n`;
  text += `Grupo A:\n`;
  standingsA.forEach((s, i) => {
    text += renderStandingRow(s, i + 1);
  });
  text += `\nGrupo B:\n`;
  standingsB.forEach((s, i) => {
    text += renderStandingRow(s, i + 1);
  });
  text += `\n`;

  // Group Matches
  text += `RESULTADOS DA FASE DE GRUPOS:\n`;
  for (let r = 1; r <= 5; r++) {
    text += `Rodada ${r}:\n`;
    text += ` Grupo A:\n`;
    state.groupMatches.filter(m => m.groupId === 'A' && m.round === r).forEach(m => {
      const home = namesMap[m.homeId] || '';
      const away = namesMap[m.awayId] || '';
      const score = m.completed ? `${m.homeScore} x ${m.awayScore}` : 'Pendente';
      text += `   ${home} ${score} ${away}\n`;
    });
    text += ` Grupo B:\n`;
    state.groupMatches.filter(m => m.groupId === 'B' && m.round === r).forEach(m => {
      const home = namesMap[m.homeId] || '';
      const away = namesMap[m.awayId] || '';
      const score = m.completed ? `${m.homeScore} x ${m.awayScore}` : 'Pendente';
      text += `   ${home} ${score} ${away}\n`;
    });
  }
  text += `\n`;

  // Quarterfinals
  if (state.qfMatches && state.qfMatches.length === 4) {
    text += `QUARTAS DE FINAL:\n`;
    state.qfMatches.forEach((m, idx) => {
      const home = namesMap[m.homeId] || '';
      const away = namesMap[m.awayId] || '';
      const score = m.completed ? `${m.homeScore} x ${m.awayScore}` : 'Pendente';
      const penText = m.completed && m.homeScore === m.awayScore && m.homePenalties !== null && m.awayPenalties !== null
        ? ` (Pênaltis: ${m.homePenalties} x ${m.awayPenalties})`
        : '';
      text += `   Jogo ${idx + 1}: ${home} ${score} ${away}${penText}\n`;
    });
    text += `\n`;
  }

  // Semifinals
  if (state.sfMatches.length === 4) {
    text += `SEMIFINAIS:\n`;
    const sf1Ida = state.sfMatches.find(m => m.id === 'sf1_ida')!;
    const sf1Volta = state.sfMatches.find(m => m.id === 'sf1_volta')!;
    const sf2Ida = state.sfMatches.find(m => m.id === 'sf2_ida')!;
    const sf2Volta = state.sfMatches.find(m => m.id === 'sf2_volta')!;

    const qf1Match = state.qfMatches.find(m => m.id === 'qf1')!;
    const qf2Match = state.qfMatches.find(m => m.id === 'qf2')!;
    const qf3Match = state.qfMatches.find(m => m.id === 'qf3')!;
    const qf4Match = state.qfMatches.find(m => m.id === 'qf4')!;

    const w1 = getQuarterfinalWinner(qf1Match) || 'Vencedor QF1';
    const w2 = getQuarterfinalWinner(qf2Match) || 'Vencedor QF2';
    const w3 = getQuarterfinalWinner(qf3Match) || 'Vencedor QF3';
    const w4 = getQuarterfinalWinner(qf4Match) || 'Vencedor QF4';

    const res1 = getSemifinalResult(sf1Ida, sf1Volta, w1, w3);
    const res2 = getSemifinalResult(sf2Ida, sf2Volta, w4, w2);

    text += ` Semifinal 1:\n`;
    text += `   Ida:   ${namesMap[sf1Ida.homeId] || sf1Ida.homeId} ${sf1Ida.completed ? sf1Ida.homeScore : '-'} x ${sf1Ida.completed ? sf1Ida.awayScore : '-'} ${namesMap[sf1Ida.awayId] || sf1Ida.awayId}\n`;
    text += `   Volta: ${namesMap[sf1Volta.homeId] || sf1Volta.homeId} ${sf1Volta.completed ? sf1Volta.homeScore : '-'} x ${sf1Volta.completed ? sf1Volta.awayScore : '-'} ${namesMap[sf1Volta.awayId] || sf1Volta.awayId}\n`;
    if (res1.winnerId) {
      const penText = res1.isTied ? ` (Pênaltis: ${res1.team2Pen} x ${res1.team1Pen})` : '';
      text += `   Classificado: ${namesMap[res1.winnerId]}${penText}\n`;
    }

    text += ` Semifinal 2:\n`;
    text += `   Ida:   ${namesMap[sf2Ida.homeId] || sf2Ida.homeId} ${sf2Ida.completed ? sf2Ida.homeScore : '-'} x ${sf2Ida.completed ? sf2Ida.awayScore : '-'} ${namesMap[sf2Ida.awayId] || sf2Ida.awayId}\n`;
    text += `   Volta: ${namesMap[sf2Volta.homeId] || sf2Volta.homeId} ${sf2Volta.completed ? sf2Volta.homeScore : '-'} x ${sf2Volta.completed ? sf2Volta.awayScore : '-'} ${namesMap[sf2Volta.awayId] || sf2Volta.awayId}\n`;
    if (res2.winnerId) {
      const penText = res2.isTied ? ` (Pênaltis: ${res2.team2Pen} x ${res2.team1Pen})` : '';
      text += `   Classificado: ${namesMap[res2.winnerId]}${penText}\n`;
    }
    text += `\n`;
  }

  // Third Place
  if (state.thirdPlaceMatch) {
    const f = state.thirdPlaceMatch;
    const homeName = namesMap[f.homeId] || f.homeId;
    const awayName = namesMap[f.awayId] || f.awayId;
    text += `DISPUTA DE 3º LUGAR:\n`;
    const score = f.completed ? `${f.homeScore} x ${f.awayScore}` : 'Pendente';
    const penText = f.completed && f.homeScore === f.awayScore && f.homePenalties !== null && f.awayPenalties !== null
      ? ` (Pênaltis: ${f.homePenalties} x ${f.awayPenalties})`
      : '';
    text += ` ${homeName} ${score} ${awayName}${penText}\n\n`;
  }

  // Final
  if (state.finalMatch) {
    const f = state.finalMatch;
    const homeName = namesMap[f.homeId] || f.homeId;
    const awayName = namesMap[f.awayId] || f.awayId;
    text += `FINAL:\n`;
    const score = f.completed ? `${f.homeScore} x ${f.awayScore}` : 'Pendente';
    const penText = f.completed && f.homeScore === f.awayScore && f.homePenalties !== null && f.awayPenalties !== null
      ? ` (Pênaltis: ${f.homePenalties} x ${f.awayPenalties})`
      : '';
    text += ` ${homeName} ${score} ${awayName}${penText}\n\n`;
  }

  // Champion
  if (state.championId) {
    text += `🏆 CAMPEÃO: ${namesMap[state.championId] || state.championId} 🏆\n`;
  }

  return text;
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
  stage: 'champion' | 'finalist' | 'third_place' | 'fourth_place' | 'semifinalist' | 'quarterfinalist' | 'groups';
  points: number;
  goalDifference: number;
  goalsFor: number;
}

export function calculateLeaderboard(state: TournamentState): LeaderboardEntry[] {
  const standingsA = calculateStandings('A', state.participants, state.groupMatches);
  const standingsB = calculateStandings('B', state.participants, state.groupMatches);
  
  const allStandings = [...standingsA, ...standingsB];
  const standingsMap = new Map(allStandings.map(s => [s.participantId, s]));
  
  const qfWinners = new Set<string>();
  const qfLosers = new Set<string>();
  if (state.qfMatches && state.qfMatches.length === 4) {
    state.qfMatches.forEach(m => {
      const winner = getQuarterfinalWinner(m);
      if (winner) {
        qfWinners.add(winner);
        qfLosers.add(winner === m.homeId ? m.awayId : m.homeId);
      } else {
        qfLosers.add(m.homeId);
        qfLosers.add(m.awayId);
      }
    });
  }
  
  const sfWinners = new Set<string>();
  const sfLosers = new Set<string>();
  if (state.sfMatches && state.sfMatches.length === 4 && state.qfMatches && state.qfMatches.length === 4) {
    const qf1Match = state.qfMatches.find(m => m.id === 'qf1')!;
    const qf2Match = state.qfMatches.find(m => m.id === 'qf2')!;
    const qf3Match = state.qfMatches.find(m => m.id === 'qf3')!;
    const qf4Match = state.qfMatches.find(m => m.id === 'qf4')!;

    const w1 = getQuarterfinalWinner(qf1Match) || 'Vencedor QF1';
    const w2 = getQuarterfinalWinner(qf2Match) || 'Vencedor QF2';
    const w3 = getQuarterfinalWinner(qf3Match) || 'Vencedor QF3';
    const w4 = getQuarterfinalWinner(qf4Match) || 'Vencedor QF4';

    const sf1Ida = state.sfMatches.find(m => m.id === 'sf1_ida')!;
    const sf1Volta = state.sfMatches.find(m => m.id === 'sf1_volta')!;
    const sf2Ida = state.sfMatches.find(m => m.id === 'sf2_ida')!;
    const sf2Volta = state.sfMatches.find(m => m.id === 'sf2_volta')!;

    const res1 = getSemifinalResult(sf1Ida, sf1Volta, w1, w3);
    const res2 = getSemifinalResult(sf2Ida, sf2Volta, w4, w2);

    if (res1.winnerId) {
      sfWinners.add(res1.winnerId);
      sfLosers.add(res1.winnerId === w1 ? w3 : w1);
    } else {
      sfLosers.add(w1);
      sfLosers.add(w3);
    }
    
    if (res2.winnerId) {
      sfWinners.add(res2.winnerId);
      sfLosers.add(res2.winnerId === w4 ? w2 : w4);
    } else {
      sfLosers.add(w2);
      sfLosers.add(w4);
    }
  }

  const championId = state.championId;
  let runnerUpId: string | null = null;
  if (state.finalMatch && state.finalMatch.completed) {
    if (championId) {
      runnerUpId = championId === state.finalMatch.homeId ? state.finalMatch.awayId : state.finalMatch.homeId;
    }
  }

  // 3rd place winner / loser calculation
  const thirdPlaceWinner = getThirdPlaceWinner(state.thirdPlaceMatch);
  let thirdPlaceLoser: string | null = null;
  if (state.thirdPlaceMatch && state.thirdPlaceMatch.completed && thirdPlaceWinner) {
    thirdPlaceLoser = thirdPlaceWinner === state.thirdPlaceMatch.homeId ? state.thirdPlaceMatch.awayId : state.thirdPlaceMatch.homeId;
  }
  
  const entries: LeaderboardEntry[] = state.participants.map(p => {
    const s = standingsMap.get(p.id) || { points: 0, goalDifference: 0, goalsFor: 0 };
    let stage: LeaderboardEntry['stage'] = 'groups';
    
    if (championId && p.id === championId) {
      stage = 'champion';
    } else if (runnerUpId && p.id === runnerUpId) {
      stage = 'finalist';
    } else if (state.finalMatch && (p.id === state.finalMatch.homeId || p.id === state.finalMatch.awayId)) {
      stage = 'finalist';
    } else if (thirdPlaceWinner && p.id === thirdPlaceWinner) {
      stage = 'third_place';
    } else if (thirdPlaceLoser && p.id === thirdPlaceLoser) {
      stage = 'fourth_place';
    } else if (state.thirdPlaceMatch && (p.id === state.thirdPlaceMatch.homeId || p.id === state.thirdPlaceMatch.awayId)) {
      stage = 'semifinalist';
    } else if (sfLosers.has(p.id)) {
      stage = 'semifinalist';
    } else if (sfWinners.has(p.id)) {
      stage = 'semifinalist';
    } else if (qfLosers.has(p.id)) {
      stage = 'quarterfinalist';
    } else if (qfWinners.has(p.id)) {
      stage = 'quarterfinalist';
    } else {
      stage = 'groups';
    }
    
    return {
      participantId: p.id,
      rank: 10,
      stage,
      points: s.points,
      goalDifference: s.goalDifference,
      goalsFor: s.goalsFor,
    };
  });

  const stageWeights = {
    champion: 7,
    finalist: 6,
    third_place: 5,
    fourth_place: 4,
    semifinalist: 3,
    quarterfinalist: 2,
    groups: 1,
  };

  entries.sort((a, b) => {
    const weightA = stageWeights[a.stage];
    const weightB = stageWeights[b.stage];
    if (weightB !== weightA) return weightB - weightA;
    
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
