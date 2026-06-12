export type Team = {
  id: number;
  name: string;
  code: string;
  logo?: string;
};

export type MatchStatus = "LIVE" | "UPCOMING" | "FINISHED";
export type FixtureDataMode = "demo" | "open" | "football-data";

export type Match = {
  id: number;
  stage: string;
  group: string;
  kickoff: string;
  venue: string;
  status: MatchStatus;
  elapsed?: number;
  home: Team;
  away: Team;
  homeScore: number | null;
  awayScore: number | null;
  crowd: {
    home: number;
    draw: number;
    away: number;
    predictions: number;
    poolPoints: number;
  };
};

export type SessionUser = {
  id: string;
  provider?: "datagsm" | "google";
  refCode?: string;
  name: string;
  email?: string;
  avatar?: string;
  grade?: number;
  classNumber?: number;
  number?: number;
};

export type Prediction = {
  home: number;
  away: number;
  wager: number;
  updatedAt: string;
};

export type RankingEntry = {
  rank: number;
  name: string;
  detail: string;
  points: number;
  hitRate: number;
  predictions: number;
};

export type UserStats = {
  predictions: number;
  scoredPredictions: number;
  correctPredictions: number;
  hitRate: number;
  points: number;
  balance: number;
};

export type UserPredictionEntry = {
  id: string;
  matchId: number;
  stage: string;
  group: string;
  kickoff: string;
  venue: string;
  status: MatchStatus;
  home: Team;
  away: Team;
  prediction: {
    home: number;
    away: number;
    wager: number;
  };
  result: {
    home: number | null;
    away: number | null;
  };
  outcomeCorrect: boolean;
  exactScore: boolean;
  payoutPoints: number;
  scoredAt?: string;
  updatedAt: string;
};

export type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  isMine: boolean;
  user: {
    name: string;
    grade?: number;
    classNumber?: number;
  };
};
