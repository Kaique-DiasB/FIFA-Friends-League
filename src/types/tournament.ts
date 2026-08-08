export interface Participant {
  id: string; // 'a1'..'a5', 'b1'..'b5'
  name: string;
  groupId: 'A' | 'B';
}

export interface Match {
  id: string; // e.g., 'group_a_r1_m1', 'sf1_ida', 'final'
  stage: 'groups' | 'quarterfinals' | 'semifinals' | 'final' | 'third_place';
  groupId?: 'A' | 'B' | null;
  round: number; // 1-5 for groups, 1 (ida) or 2 (volta) for SF, 1 for final
  homeId: string; // participant ID
  awayId: string; // participant ID
  homeScore?: number | null;
  awayScore?: number | null;
  homePenalties?: number | null;
  awayPenalties?: number | null;
  completed: boolean;
}

export interface Standing {
  participantId: string;
  games: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  goalDifference: number;
  points: number;
}

export interface TournamentState {
  participants: Participant[];
  groupMatches: Match[];
  qfMatches: Match[]; // length 4
  sfMatches: Match[]; // length 4: sf1_ida, sf1_volta, sf2_ida, sf2_volta
  finalMatch: Match | null; // length 1
  thirdPlaceMatch: Match | null;
  championId: string | null;
}
