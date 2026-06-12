export type Team = {
  id: number;
  name: string;
  code: string;
  logo?: string;
};

export type MatchStatus = "LIVE" | "UPCOMING" | "FINISHED";

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
  };
};

export type SessionUser = {
  id: string;
  name: string;
  email?: string;
  grade?: number;
  classNumber?: number;
  number?: number;
};

export type Prediction = {
  home: number;
  away: number;
  updatedAt: string;
};
