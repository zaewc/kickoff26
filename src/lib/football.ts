import { Match, MatchStatus } from "@/lib/types";

const API_BASE_URL = "https://v3.football.api-sports.io";

type ApiFixture = {
  fixture: {
    id: number;
    date: string;
    venue?: { name?: string; city?: string };
    status: { short: string; elapsed?: number };
  };
  league: { round?: string };
  teams: {
    home: { id: number; name: string; logo?: string };
    away: { id: number; name: string; logo?: string };
  };
  goals: { home: number | null; away: number | null };
};

const teamCode = (name: string) => {
  const codes: Record<string, string> = {
    Mexico: "MEX",
    "South Africa": "RSA",
    "Korea Republic": "KOR",
    Denmark: "DEN",
    Argentina: "ARG",
    Algeria: "ALG",
    Spain: "ESP",
    "Cape Verde": "CPV",
    Canada: "CAN",
    Switzerland: "SUI",
  };

  return codes[name] ?? name.slice(0, 3).toUpperCase();
};

const statusFromApi = (status: string): MatchStatus => {
  if (["1H", "HT", "2H", "ET", "P", "BT", "LIVE"].includes(status)) {
    return "LIVE";
  }
  if (["FT", "AET", "PEN"].includes(status)) {
    return "FINISHED";
  }
  return "UPCOMING";
};

const crowdFor = (id: number) => {
  const home = 31 + (id % 27);
  const draw = 18 + (id % 13);
  const away = 100 - home - draw;
  return { home, draw, away, predictions: 1240 + (id % 2700) };
};

const normalizeFixture = (item: ApiFixture): Match => {
  const round = item.league.round ?? "Group Stage";
  const groupMatch = round.match(/Group [A-L]/i);

  return {
    id: item.fixture.id,
    stage: round.includes("Group") ? "그룹 스테이지" : round,
    group: groupMatch?.[0]?.replace("Group", "조") ?? round,
    kickoff: item.fixture.date,
    venue:
      [item.fixture.venue?.name, item.fixture.venue?.city]
        .filter(Boolean)
        .join(", ") || "경기장 미정",
    status: statusFromApi(item.fixture.status.short),
    elapsed: item.fixture.status.elapsed,
    home: {
      id: item.teams.home.id,
      name: item.teams.home.name,
      code: teamCode(item.teams.home.name),
      logo: item.teams.home.logo,
    },
    away: {
      id: item.teams.away.id,
      name: item.teams.away.name,
      code: teamCode(item.teams.away.name),
      logo: item.teams.away.logo,
    },
    homeScore: item.goals.home,
    awayScore: item.goals.away,
    crowd: crowdFor(item.fixture.id),
  };
};

const demoMatches: Match[] = [
  {
    id: 26061101,
    stage: "그룹 스테이지",
    group: "A조",
    kickoff: "2026-06-12T04:00:00+09:00",
    venue: "Estadio Azteca, Mexico City",
    status: "LIVE",
    elapsed: 67,
    home: { id: 1, name: "Mexico", code: "MEX" },
    away: { id: 2, name: "South Africa", code: "RSA" },
    homeScore: 1,
    awayScore: 0,
    crowd: { home: 54, draw: 27, away: 19, predictions: 4281 },
  },
  {
    id: 26061202,
    stage: "그룹 스테이지",
    group: "H조",
    kickoff: "2026-06-12T20:00:00+09:00",
    venue: "BC Place, Vancouver",
    status: "UPCOMING",
    home: { id: 3, name: "Korea Republic", code: "KOR" },
    away: { id: 4, name: "Denmark", code: "DEN" },
    homeScore: null,
    awayScore: null,
    crowd: { home: 48, draw: 29, away: 23, predictions: 3814 },
  },
  {
    id: 26061303,
    stage: "그룹 스테이지",
    group: "J조",
    kickoff: "2026-06-13T07:00:00+09:00",
    venue: "MetLife Stadium, New York/New Jersey",
    status: "UPCOMING",
    home: { id: 5, name: "Argentina", code: "ARG" },
    away: { id: 6, name: "Algeria", code: "ALG" },
    homeScore: null,
    awayScore: null,
    crowd: { home: 68, draw: 20, away: 12, predictions: 5122 },
  },
  {
    id: 26061304,
    stage: "그룹 스테이지",
    group: "B조",
    kickoff: "2026-06-13T10:00:00+09:00",
    venue: "SoFi Stadium, Los Angeles",
    status: "UPCOMING",
    home: { id: 7, name: "Spain", code: "ESP" },
    away: { id: 8, name: "Cape Verde", code: "CPV" },
    homeScore: null,
    awayScore: null,
    crowd: { home: 72, draw: 18, away: 10, predictions: 2930 },
  },
  {
    id: 26061405,
    stage: "그룹 스테이지",
    group: "F조",
    kickoff: "2026-06-14T04:00:00+09:00",
    venue: "BMO Field, Toronto",
    status: "UPCOMING",
    home: { id: 9, name: "Canada", code: "CAN" },
    away: { id: 10, name: "Switzerland", code: "SUI" },
    homeScore: null,
    awayScore: null,
    crowd: { home: 39, draw: 31, away: 30, predictions: 2251 },
  },
];

export async function getWorldCupMatches(): Promise<{
  matches: Match[];
  mode: "live" | "demo";
}> {
  const apiKey = process.env.API_FOOTBALL_KEY;

  if (!apiKey) {
    return { matches: demoMatches, mode: "demo" };
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/fixtures?league=1&season=2026`,
      {
        headers: { "x-apisports-key": apiKey },
        next: { revalidate: 30 },
      },
    );

    if (!response.ok) {
      throw new Error(`Football API responded with ${response.status}`);
    }

    const payload = (await response.json()) as {
      response?: ApiFixture[];
      errors?: Record<string, string>;
    };

    if (!payload.response?.length) {
      throw new Error("Football API returned no fixtures");
    }

    const sorted = payload.response
      .map(normalizeFixture)
      .sort((a, b) => {
        const statusWeight = { LIVE: 0, UPCOMING: 1, FINISHED: 2 };
        const statusDiff = statusWeight[a.status] - statusWeight[b.status];
        return statusDiff || Date.parse(a.kickoff) - Date.parse(b.kickoff);
      });

    return { matches: sorted, mode: "live" };
  } catch (error) {
    console.error("Falling back to demo World Cup data:", error);
    return { matches: demoMatches, mode: "demo" };
  }
}
