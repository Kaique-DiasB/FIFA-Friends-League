export interface Participant {
  id: string; // 'p1'..'pN'
  name: string;
  team?: string;
  groupId: 'A' | 'B' | null; // null when the championship has no group stage
  seed: number; // 1-based entry order; drives group split, bracket seeding, prelim overflow selection
}

// Generic knockout stage identifiers. 'groups' covers group-stage matches (kept on Match.stage directly).
export type StageId =
  | 'prelim'
  | 'round_of_16'
  | 'quarterfinals'
  | 'semifinals'
  | 'final'
  | 'third_place';

export interface StageDef {
  id: StageId;
  label: string; // e.g. "Quartas de Final"
  order: number; // depth in the bracket; used for UI ordering and leaderboard weighting
  slotCount: number; // number of pairings in this stage
  legs: 1 | 2; // per-stage, even though the wizard currently only exposes one global control
}

export interface ChampionshipConfig {
  version: 1; // schema tag, used by the legacy-migration shim
  participantCount: number;
  hasGroupStage: boolean;
  groupCount: 0 | 1 | 2;
  qualifiersPerGroup: number; // ignored when hasGroupStage=false
  stages: StageDef[]; // ordered ascending by `order`
}

export interface Match {
  id: string; // `${stage}_slot${slot}_leg${leg}` for knockout, `group_a_r1_m1`-style for groups
  stage: 'groups' | StageId;
  groupId?: 'A' | 'B' | null;
  round: number; // group-stage round number; always 1 for knockout matches (slot/leg address those instead)
  slot: number; // 1-based bracket position within the stage
  leg: 1 | 2; // 1 = single leg or ida; 2 = volta
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
  config: ChampionshipConfig;
  participants: Participant[];
  groupMatches: Match[];
  knockoutMatches: Match[]; // flat, filtered by stage/slot/leg — replaces the old fixed qfMatches/sfMatches/finalMatch/thirdPlaceMatch fields
  championId: string | null;
}
