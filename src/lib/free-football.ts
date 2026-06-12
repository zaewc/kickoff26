import { Match, MatchStatus } from "@/lib/types";

const OPEN_FOOTBALL_URL =
  "https://raw.githubusercontent.com/openfootball/worldcup.json/master/2026/worldcup.json";
const FOOTBALL_DATA_URL =
  "https://api.football-data.org/v4/competitions/WC/matches?season=2026";

type OpenFootballMatch = {
  round: string;
  date: string;
  time: string;
  team1: string;
  team2: string;
  group?: string;
  ground: string;
  score?: {
    ft?: [number, number];
    et?: [number, number];
    p?: [number, number];
  };
};

type FootballDataMatch = {
  id: number;
  utcDate: string;
  status: string;
  stage: string;
  group?: string | null;
  venue?: string | null;
  homeTeam: {
    id: number;
    name: string;
    shortName?: string;
    tla?: string;
    crest?: string;
  };
  awayTeam: {
    id: number;
    name: string;
    shortName?: string;
    tla?: string;
    crest?: string;
  };
  score: {
    fullTime?: { home: number | null; away: number | null };
  };
};

export type FootballDataResult = {
  id: number;
  kickoff: Date;
  status: MatchStatus;
  stage: string;
  group?: string;
  venue?: string;
  home: {
    id: number;
    name: string;
    code: string;
    logo?: string;
  };
  away: {
    id: number;
    name: string;
    code: string;
    logo?: string;
  };
  homeScore: number | null;
  awayScore: number | null;
};

const stageNames: Record<string, string> = {
  "Round of 32": "32강",
  "Round of 16": "16강",
  "Quarter-final": "8강",
  "Semi-final": "준결승",
  "Match for third place": "3·4위전",
  Final: "결승",
};

function stableNumber(value: string) {
  let hash = 2166136261;
  for (const character of value) {
    hash ^= character.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return Math.abs(hash);
}

function teamCode(name: string) {
  const codes: Record<string, string> = {
    "South Korea": "KOR",
    "Korea Republic": "KOR",
    "South Africa": "RSA",
    "Czech Republic": "CZE",
    "Cape Verde": "CPV",
    "United States": "USA",
    "New Zealand": "NZL",
  };
  if (/^[WL]\d+$/.test(name)) return name;
  return codes[name] ?? name.replace(/[^A-Za-z]/g, "").slice(0, 3).toUpperCase();
}

function parseOpenFootballDate(date: string, time: string) {
  const match = time.match(/^(\d{2}):(\d{2}) UTC([+-]\d{1,2})$/);
  if (!match) throw new Error(`Unsupported openfootball time: ${time}`);

  const [, hour, minute, offset] = match;
  const utcTimestamp =
    Date.parse(`${date}T${hour}:${minute}:00Z`) -
    Number(offset) * 60 * 60 * 1000;
  return new Date(utcTimestamp);
}

function resultScore(match: OpenFootballMatch) {
  return match.score?.p ?? match.score?.et ?? match.score?.ft ?? null;
}

export async function fetchOpenFootballSchedule(): Promise<Match[]> {
  const response = await fetch(OPEN_FOOTBALL_URL, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`openfootball responded with ${response.status}`);
  }

  const payload = (await response.json()) as {
    name: string;
    matches: OpenFootballMatch[];
  };
  if (payload.matches?.length !== 104) {
    throw new Error(
      `openfootball returned ${payload.matches?.length ?? 0} fixtures, expected 104`,
    );
  }

  return payload.matches.map((item, index) => {
    const score = resultScore(item);
    const isGroupStage = Boolean(item.group);
    return {
      id: 20260001 + index,
      stage: isGroupStage
        ? "그룹 스테이지"
        : (stageNames[item.round] ?? item.round),
      group:
        item.group?.replace(/^Group ([A-L])$/, "$1조") ??
        (stageNames[item.round] ?? item.round),
      kickoff: parseOpenFootballDate(item.date, item.time).toISOString(),
      venue: item.ground,
      status: score ? "FINISHED" : "UPCOMING",
      home: {
        id: stableNumber(item.team1),
        name: item.team1,
        code: teamCode(item.team1),
      },
      away: {
        id: stableNumber(item.team2),
        name: item.team2,
        code: teamCode(item.team2),
      },
      homeScore: score?.[0] ?? null,
      awayScore: score?.[1] ?? null,
      crowd: {
        home: 0,
        draw: 0,
        away: 0,
        predictions: 0,
        poolPoints: 0,
      },
    };
  });
}

function footballDataStatus(status: string): MatchStatus {
  if (["IN_PLAY", "PAUSED"].includes(status)) return "LIVE";
  if (status === "FINISHED") return "FINISHED";
  return "UPCOMING";
}

export async function fetchFootballDataResults(): Promise<FootballDataResult[]> {
  const apiKey = process.env.FOOTBALL_DATA_API_KEY;
  if (!apiKey) {
    throw new Error("FOOTBALL_DATA_API_KEY가 설정되지 않았습니다.");
  }

  const response = await fetch(FOOTBALL_DATA_URL, {
    headers: { "X-Auth-Token": apiKey },
    cache: "no-store",
  });
  const payload = (await response.json()) as {
    message?: string;
    matches?: FootballDataMatch[];
  };
  if (!response.ok) {
    throw new Error(
      payload.message || `football-data.org responded with ${response.status}`,
    );
  }
  if (!payload.matches?.length) {
    throw new Error("football-data.org가 월드컵 경기를 반환하지 않았습니다.");
  }

  return payload.matches.map((match) => ({
    id: match.id,
    kickoff: new Date(match.utcDate),
    status: footballDataStatus(match.status),
    stage: match.stage,
    group: match.group ?? undefined,
    venue: match.venue ?? undefined,
    home: {
      id: match.homeTeam.id,
      name: match.homeTeam.shortName || match.homeTeam.name,
      code: match.homeTeam.tla || teamCode(match.homeTeam.name),
      logo: match.homeTeam.crest,
    },
    away: {
      id: match.awayTeam.id,
      name: match.awayTeam.shortName || match.awayTeam.name,
      code: match.awayTeam.tla || teamCode(match.awayTeam.name),
      logo: match.awayTeam.crest,
    },
    homeScore: match.score.fullTime?.home ?? null,
    awayScore: match.score.fullTime?.away ?? null,
  }));
}
