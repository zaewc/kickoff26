"use client";

import {
  ArrowRight,
  BarChart3,
  CalendarDays,
  Check,
  ChevronDown,
  CircleUserRound,
  Clock3,
  Coins,
  Flame,
  LogOut,
  MapPin,
  Minus,
  Plus,
  Radio,
  ShieldCheck,
  Sparkles,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import {
  Match,
  Prediction,
  RankingEntry,
  SessionUser,
  UserStats,
  FixtureDataMode,
} from "@/lib/types";
import { FloatingChat } from "@/components/floating-chat";
import { syncMatchClock } from "@/lib/match-clock";

type DashboardProps = {
  initialMatches: Match[];
  initialPredictions: Record<number, Prediction>;
  initialRankings: RankingEntry[];
  initialUserStats: UserStats;
  dataMode: FixtureDataMode;
  user: SessionUser | null;
};

const formatKickoff = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "short",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(new Date(value));

// KST 기준 날짜 키 ("YYYY-MM-DD") — 날짜별 탭 그룹핑/선택에 사용
const kstDateKey = (value: string) =>
  new Intl.DateTimeFormat("en-CA", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Seoul",
  }).format(new Date(value));

const formatDateTab = (key: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "numeric",
    day: "numeric",
    weekday: "short",
    timeZone: "Asia/Seoul",
  }).format(new Date(`${key}T12:00:00+09:00`));

const numberFormat = new Intl.NumberFormat("ko-KR");

function TeamMark({
  code,
  logo,
  name,
  size = "md",
}: {
  code: string;
  logo?: string;
  name?: string;
  size?: "sm" | "md";
}) {
  const palettes: Record<string, string> = {
    MEX: "from-[#0b704c] to-[#06412f] text-white",
    RSA: "from-[#ffce24] to-[#e7a900] text-[#163f2c]",
    KOR: "from-[#ff5b61] to-[#db1f36] text-white",
    DEN: "from-[#d70a36] to-[#920021] text-white",
    ARG: "from-[#8bd3ff] to-[#f4fbff] text-[#155184]",
    ALG: "from-[#fff] to-[#e3eee8] text-[#13724b]",
    ESP: "from-[#ee3324] to-[#a91016] text-[#ffd731]",
    CPV: "from-[#174c9d] to-[#082c65] text-white",
    CAN: "from-[#f23838] to-[#be0f1b] text-white",
    SUI: "from-[#e82222] to-[#ae0e0e] text-white",
  };
  const dimension = size === "sm" ? "size-9 text-[10px]" : "size-14 text-xs";

  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={logo}
        alt={name ? `${name} 국기` : code}
        loading="lazy"
        className={`${dimension} shrink-0 rounded-full border-2 border-white bg-white object-cover shadow-[0_5px_14px_rgba(20,38,32,0.16)]`}
      />
    );
  }

  return (
    <span
      className={`${dimension} display grid shrink-0 place-items-center rounded-full border-2 border-white bg-gradient-to-br font-bold tracking-[0.08em] shadow-[0_5px_14px_rgba(20,38,32,0.16)] ${palettes[code] ?? "from-slate-500 to-slate-800 text-white"}`}
    >
      {code}
    </span>
  );
}

function ScoreControl({
  value,
  onChange,
  label,
}: {
  value: number;
  onChange: (value: number) => void;
  label: string;
}) {
  return (
    <div className="flex items-center gap-1.5 rounded-xl border border-[#dce2dc] bg-[#f7f8f4] p-1">
      <button
        aria-label={`${label} 점수 내리기`}
        className="grid size-7 place-items-center rounded-lg text-[#6e7b74] transition hover:bg-white hover:text-[#173f31]"
        onClick={() => onChange(Math.max(0, value - 1))}
        type="button"
      >
        <Minus size={14} />
      </button>
      <span className="display w-8 text-center text-2xl font-bold tabular-nums">
        {value}
      </span>
      <button
        aria-label={`${label} 점수 올리기`}
        className="grid size-7 place-items-center rounded-lg bg-[#e9f0e4] text-[#174a37] transition hover:bg-[#dce8d6]"
        onClick={() => onChange(Math.min(20, value + 1))}
        type="button"
      >
        <Plus size={14} />
      </button>
    </div>
  );
}

function WagerControl({
  value,
  onChange,
}: {
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex items-center gap-1 rounded-xl border border-[#dce2dc] bg-white p-1">
      <button
        aria-label="베팅 포인트 내리기"
        className="grid size-7 place-items-center rounded-lg text-[#6e7b74] hover:bg-[#f3f5f1]"
        onClick={() => onChange(Math.max(10, value - 10))}
        type="button"
      >
        <Minus size={13} />
      </button>
      <span className="display min-w-14 text-center text-sm font-bold tabular-nums">
        {value}P
      </span>
      <button
        aria-label="베팅 포인트 올리기"
        className="grid size-7 place-items-center rounded-lg bg-[#e9f0e4] text-[#174a37] hover:bg-[#dce8d6]"
        onClick={() => onChange(Math.min(500, value + 10))}
        type="button"
      >
        <Plus size={13} />
      </button>
    </div>
  );
}

function MatchCard({
  match,
  prediction,
  onPredict,
  onSave,
  saving,
}: {
  match: Match;
  prediction: Prediction;
  onPredict: (prediction: Prediction) => void;
  onSave: () => void;
  saving: boolean;
}) {
  const isLive = match.status === "LIVE";
  const isFinished = match.status === "FINISHED";
  const showScore = isLive || isFinished;
  const canPredict = match.status === "UPCOMING";

  return (
    <article
      className={`overflow-hidden rounded-[22px] border bg-white shadow-[0_10px_40px_rgba(28,48,40,0.06)] transition hover:-translate-y-0.5 hover:shadow-[0_16px_50px_rgba(28,48,40,0.1)] ${
        isLive ? "border-[#b9d8c6]" : "border-[#e1e6df]"
      }`}
    >
      <div className="flex items-center justify-between border-b border-[#edf0eb] px-5 py-3.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-[#6f7c75]">
          {isLive ? (
            <>
              <span className="live-dot size-2 rounded-full bg-[#ff5c41]" />
              <span className="text-[#e94d35]">LIVE · {match.elapsed}&apos;</span>
            </>
          ) : isFinished ? (
            <span className="rounded-full bg-[#e7ebe6] px-2 py-0.5 text-[10px] font-bold text-[#5a665e]">
              종료
            </span>
          ) : (
            <Clock3 size={13} />
          )}
          <span>{showScore ? match.stage : formatKickoff(match.kickoff)}</span>
        </div>
        <span className="rounded-full bg-[#f0f3ed] px-2.5 py-1 text-[10px] font-bold text-[#506057]">
          {match.group}
        </span>
      </div>

      <div className="px-5 pb-5 pt-4">
        <div className="mb-4 flex items-center justify-center gap-4">
          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
            <TeamMark code={match.home.code} logo={match.home.logo} name={match.home.name} />
            <span className="line-clamp-1 text-sm font-bold">{match.home.name}</span>
          </div>

          {showScore ? (
            <div className="display flex items-center gap-2 text-4xl font-bold tracking-tight">
              <span
                className={
                  isFinished &&
                  (match.homeScore ?? 0) < (match.awayScore ?? 0)
                    ? "text-[#b3bbb5]"
                    : ""
                }
              >
                {match.homeScore}
              </span>
              <span className="text-lg text-[#a6aea9]">:</span>
              <span
                className={
                  isFinished &&
                  (match.awayScore ?? 0) < (match.homeScore ?? 0)
                    ? "text-[#b3bbb5]"
                    : ""
                }
              >
                {match.awayScore}
              </span>
            </div>
          ) : (
            <div className="display rounded-full bg-[#f1f3ee] px-3 py-1.5 text-xs font-bold text-[#738078]">
              VS
            </div>
          )}

          <div className="flex min-w-0 flex-1 flex-col items-center gap-2 text-center">
            <TeamMark code={match.away.code} logo={match.away.logo} name={match.away.name} />
            <span className="line-clamp-1 text-sm font-bold">{match.away.name}</span>
          </div>
        </div>

        <div className="mb-4">
          <div className="mb-1.5 flex justify-between text-[10px] font-bold">
            <span className="text-[#176547]">홈 {match.crowd.home}%</span>
            <span className="text-[#7b827e]">무 {match.crowd.draw}%</span>
            <span className="text-[#ce5338]">원정 {match.crowd.away}%</span>
          </div>
          <div className="flex h-1.5 gap-0.5 overflow-hidden rounded-full bg-[#e8ebe6]">
            <span
              className="bg-[#1e7455]"
              style={{ width: `${match.crowd.home}%` }}
            />
            <span
              className="bg-[#aeb7b1]"
              style={{ width: `${match.crowd.draw}%` }}
            />
            <span
              className="bg-[#f06b46]"
              style={{ width: `${match.crowd.away}%` }}
            />
          </div>
          <p className="mt-1.5 text-right text-[10px] text-[#8b9690]">
            {numberFormat.format(match.crowd.predictions)}명 · 풀{" "}
            <b className="text-[#536159]">
              {numberFormat.format(match.crowd.poolPoints)}P
            </b>
          </p>
        </div>

        <div className="rounded-2xl bg-[#f6f7f3] p-3">
          <div className="mb-2.5 flex items-center justify-between">
            <span className="text-xs font-bold text-[#405048]">
              {canPredict ? "내 점수 예측" : "예측 마감"}
            </span>
            {prediction.updatedAt && (
              <span className="flex items-center gap-1 text-[10px] font-semibold text-[#2e7457]">
                <Check size={11} /> 저장됨
              </span>
            )}
          </div>
          {canPredict ? (
            <div className="space-y-2.5">
              <div className="flex items-center justify-between gap-2">
                <ScoreControl
                  label={match.home.name}
                  value={prediction.home}
                  onChange={(home) =>
                    onPredict({ ...prediction, home, updatedAt: "" })
                  }
                />
                <span className="text-xs font-bold text-[#abb2ad]">:</span>
                <ScoreControl
                  label={match.away.name}
                  value={prediction.away}
                  onChange={(away) =>
                    onPredict({ ...prediction, away, updatedAt: "" })
                  }
                />
              </div>
              <div className="flex items-center justify-between gap-2">
                <WagerControl
                  value={prediction.wager}
                  onChange={(wager) =>
                    onPredict({ ...prediction, wager, updatedAt: "" })
                  }
                />
                <button
                  className="rounded-xl bg-[#123f30] px-4 py-2.5 text-xs font-bold text-white transition hover:bg-[#0a2d22] disabled:opacity-60"
                  disabled={saving}
                  onClick={onSave}
                  type="button"
                >
                  {saving ? "저장 중" : "베팅 저장"}
                </button>
              </div>
            </div>
          ) : (
            <p className="text-xs leading-5 text-[#7c8781]">
              경기 시작 이후에는 점수 예측을 새로 저장하거나 수정할 수 없습니다.
            </p>
          )}
        </div>
      </div>
    </article>
  );
}

function FeaturedMatch({
  match,
  prediction,
  onPredict,
  onSave,
  saving,
}: {
  match: Match;
  prediction: Prediction;
  onPredict: (prediction: Prediction) => void;
  onSave: () => void;
  saving: boolean;
}) {
  return (
    <section className="noise relative overflow-hidden rounded-[28px] bg-[#073f30] px-6 py-6 text-white shadow-[0_24px_70px_rgba(7,63,48,0.22)] md:px-9 md:py-8">
      <div className="absolute -right-12 -top-24 size-72 rounded-full border-[44px] border-white/[0.04]" />
      <div className="absolute -bottom-28 left-1/3 size-72 rounded-full border-[38px] border-[#c9ff3d]/[0.05]" />

      <div className="relative z-10">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="live-dot size-2 rounded-full bg-[#ff7048]" />
              <span className="text-xs font-bold tracking-[0.15em] text-[#ff9678]">
                LIVE NOW
              </span>
              <span className="text-xs text-white/50">· {match.elapsed}&apos;</span>
            </div>
            <p className="text-xs font-medium text-white/55">
              {match.stage} · {match.group}
            </p>
          </div>
          <div className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 text-[11px] text-white/70">
            <MapPin size={12} />
            <span className="max-w-48 truncate">{match.venue}</span>
          </div>
        </div>

        <div className="my-7 grid grid-cols-[1fr_auto_1fr] items-center gap-3 md:my-8 md:gap-8">
          <div className="flex flex-col items-center gap-3 text-center md:flex-row md:text-left">
            <TeamMark code={match.home.code} logo={match.home.logo} name={match.home.name} />
            <div>
              <p className="text-xs text-white/45">{match.home.code}</p>
              <h2 className="display text-lg font-bold md:text-2xl">
                {match.home.name}
              </h2>
            </div>
          </div>

          <div className="text-center">
            <div className="display flex items-center gap-2 text-5xl font-bold tracking-tight md:text-7xl">
              <span>{match.homeScore}</span>
              <span className="text-2xl text-white/25">:</span>
              <span>{match.awayScore}</span>
            </div>
            <span className="mt-1 inline-block rounded-full bg-[#c9ff3d] px-2.5 py-1 text-[9px] font-extrabold text-[#163b2d]">
              후반전
            </span>
          </div>

          <div className="flex flex-col-reverse items-center gap-3 text-center md:flex-row md:justify-end md:text-right">
            <div>
              <p className="text-xs text-white/45">{match.away.code}</p>
              <h2 className="display text-lg font-bold md:text-2xl">
                {match.away.name}
              </h2>
            </div>
            <TeamMark code={match.away.code} logo={match.away.logo} name={match.away.name} />
          </div>
        </div>

        <div className="grid gap-3 border-t border-white/10 pt-5 md:grid-cols-[1fr_auto] md:items-center">
          <div>
            <div className="mb-2 flex items-center justify-between text-[10px] font-bold text-white/55">
              <span>승 {match.crowd.home}%</span>
              <span>무 {match.crowd.draw}%</span>
              <span>승 {match.crowd.away}%</span>
            </div>
            <div className="flex h-2 gap-0.5 overflow-hidden rounded-full bg-white/10">
              <span
                className="bg-[#c9ff3d]"
                style={{ width: `${match.crowd.home}%` }}
              />
              <span
                className="bg-white/35"
                style={{ width: `${match.crowd.draw}%` }}
              />
              <span
                className="bg-[#ff754f]"
                style={{ width: `${match.crowd.away}%` }}
              />
            </div>
            <p className="mt-2 text-right text-[10px] font-semibold text-white/50">
              전체 베팅 풀 {numberFormat.format(match.crowd.poolPoints)}P
            </p>
          </div>

          {match.status === "UPCOMING" ? (
            <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl bg-white/10 p-2 md:justify-start">
              <ScoreControl
                label={match.home.name}
                value={prediction.home}
                onChange={(home) =>
                  onPredict({ ...prediction, home, updatedAt: "" })
                }
              />
              <span className="font-bold text-white/35">:</span>
              <ScoreControl
                label={match.away.name}
                value={prediction.away}
                onChange={(away) =>
                  onPredict({ ...prediction, away, updatedAt: "" })
                }
              />
              <WagerControl
                value={prediction.wager}
                onChange={(wager) =>
                  onPredict({ ...prediction, wager, updatedAt: "" })
                }
              />
              <button
                className="rounded-xl bg-[#c9ff3d] px-4 py-3 text-xs font-extrabold text-[#123a2c] transition hover:bg-[#d7ff70]"
                disabled={saving}
                onClick={onSave}
                type="button"
              >
                {saving ? "저장 중" : "예측하기"}
              </button>
            </div>
          ) : (
            <div className="rounded-2xl bg-white/10 px-4 py-3 text-center text-xs font-bold text-white/65">
              경기가 시작되어 예측이 마감되었습니다.
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

export function Dashboard({
  initialMatches,
  initialPredictions,
  initialRankings,
  initialUserStats,
  dataMode,
  user,
}: DashboardProps) {
  const [matches, setMatches] = useState(initialMatches);
  const [predictions, setPredictions] =
    useState<Record<number, Prediction>>(initialPredictions);
  const [savedWagers, setSavedWagers] = useState<Record<number, number>>(
    Object.fromEntries(
      Object.entries(initialPredictions).map(([id, prediction]) => [
        Number(id),
        prediction.wager,
      ]),
    ),
  );
  const [userStats, setUserStats] = useState(initialUserStats);
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [toast, setToast] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [savingMatchId, setSavingMatchId] = useState<number | null>(null);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2600);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => {
    const syncClock = () => {
      const now = new Date();
      setMatches((current) =>
        current.map((match) => syncMatchClock(match, now)),
      );
    };
    const timer = window.setInterval(syncClock, 30_000);
    return () => window.clearInterval(timer);
  }, []);

  const liveMatch = matches.find((match) => match.status === "LIVE");
  const defaultPrediction = (id: number): Prediction =>
    predictions[id] ?? { home: 0, away: 0, wager: 100, updatedAt: "" };

  // 경기가 있는 날짜(KST) 목록 — 오름차순
  const matchDates = useMemo(() => {
    const keys = Array.from(
      new Set(matches.map((match) => kstDateKey(match.kickoff))),
    );
    keys.sort();
    return keys;
  }, [matches]);

  // 기본 선택 날짜(props 기반, SSR 안전): 진행 중 경기 날짜 → 가장 가까운 예정 → 첫 날짜
  const defaultDate = useMemo(() => {
    if (!matchDates.length) return "";
    const upcoming = matches.find((match) => match.status === "UPCOMING");
    return (
      (liveMatch && kstDateKey(liveMatch.kickoff)) ||
      (upcoming && kstDateKey(upcoming.kickoff)) ||
      matchDates[0]
    );
  }, [matchDates, matches, liveMatch]);

  const activeDate =
    selectedDate && matchDates.includes(selectedDate)
      ? selectedDate
      : defaultDate;

  const visibleMatches = useMemo(
    () =>
      matches.filter(
        (match) =>
          match.id !== liveMatch?.id &&
          kstDateKey(match.kickoff) === activeDate,
      ),
    [matches, liveMatch?.id, activeDate],
  );

  const updatePrediction = (id: number, prediction: Prediction) => {
    setPredictions((current) => ({ ...current, [id]: prediction }));
  };

  const savePrediction = async (id: number) => {
    if (!user) {
      setShowLoginPrompt(true);
      return;
    }
    const draft = defaultPrediction(id);
    const wasSaved = savedWagers[id] !== undefined;
    const previousWager = savedWagers[id] ?? 0;
    setSavingMatchId(id);

    try {
      const response = await fetch(`/api/predictions/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          homeScore: draft.home,
          awayScore: draft.away,
          wagerPoints: draft.wager,
        }),
      });
      const payload = (await response.json()) as {
        prediction?: Prediction;
        balance?: number;
        error?: string;
      };
      if (!response.ok || !payload.prediction) {
        throw new Error(payload.error || "예측 저장에 실패했습니다.");
      }

      setPredictions((current) => ({
        ...current,
        [id]: payload.prediction!,
      }));
      setSavedWagers((current) => ({
        ...current,
        [id]: payload.prediction!.wager,
      }));
      setMatches((current) =>
        current.map((match) =>
          match.id === id
            ? {
                ...match,
                crowd: {
                  ...match.crowd,
                  predictions:
                    match.crowd.predictions + (wasSaved ? 0 : 1),
                  poolPoints:
                    match.crowd.poolPoints +
                    payload.prediction!.wager -
                    previousWager,
                },
              }
            : match,
        ),
      );
      if (!wasSaved) {
        setUserStats((current) => ({
          ...current,
          predictions: current.predictions + 1,
        }));
      }
      if (typeof payload.balance === "number") {
        setUserStats((current) => ({
          ...current,
          balance: payload.balance!,
        }));
      }
      setToast("예측이 DB에 저장되었습니다. 경기 시작 전까지 수정할 수 있어요.");
    } catch (error) {
      setToast(
        error instanceof Error ? error.message : "예측 저장에 실패했습니다.",
      );
    } finally {
      setSavingMatchId(null);
    }
  };

  const savedCount = Object.values(predictions).filter(
    (prediction) => prediction.updatedAt,
  ).length;

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-[#dde3dc]/80 bg-[#f4f5f0]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-[1240px] items-center justify-between px-4 md:px-7">
          <a className="flex items-center gap-2.5" href="#">
            <span className="grid size-9 rotate-3 place-items-center rounded-xl bg-[#0b4b38] text-[#c9ff3d] shadow-md">
              <Trophy size={18} strokeWidth={2.5} />
            </span>
            <span className="display text-lg font-extrabold tracking-[-0.04em]">
              KICKOFF <span className="text-[#ff6137]">26</span>
            </span>
          </a>

          <nav className="hidden items-center gap-7 text-sm font-semibold text-[#6e7973] md:flex">
            <a className="text-[#143d30]" href="#matches">
              경기
            </a>
            <a className="transition hover:text-[#143d30]" href="#ranking">
              랭킹
            </a>
            <a className="transition hover:text-[#143d30]" href="#my">
              내 예측
            </a>
          </nav>

          {user ? (
            <div className="flex items-center gap-2">
              <div className="hidden text-right sm:block">
                <p className="text-xs font-bold">{user.name}</p>
              </div>
              <span className="grid size-9 place-items-center rounded-full bg-[#dcebdd] text-[#174b37]">
                <CircleUserRound size={19} />
              </span>
              <a
                aria-label="로그아웃"
                className="grid size-9 place-items-center rounded-full text-[#7a8580] hover:bg-white"
                href="/api/auth/logout"
              >
                <LogOut size={17} />
              </a>
            </div>
          ) : (
            <a
              className="flex items-center gap-2 rounded-full bg-[#113e2f] px-4 py-2.5 text-xs font-bold text-white shadow-sm transition hover:bg-[#082b20]"
              href="/api/auth/login"
            >
              <ShieldCheck size={15} />
              DataGSM 로그인
            </a>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-[1240px] px-4 pb-16 pt-8 md:px-7 md:pt-12">
        <section className="mb-8 flex flex-col justify-between gap-5 md:mb-10 md:flex-row md:items-end">
          <div>
            <div className="mb-3 flex items-center gap-2 text-xs font-extrabold text-[#167052]">
              <span className="rounded-full bg-[#dff0dc] px-2.5 py-1">2026</span>
              <span>CANADA · MEXICO · USA</span>
            </div>
            <h1 className="display max-w-2xl text-[2.5rem] font-extrabold leading-[1.04] tracking-[-0.055em] md:text-[4.2rem]">
              도박이 아닙니다.
              <br />
              <span className="text-[#0b5941]">예측입니다.</span>
            </h1>
            <p className="mt-4 max-w-xl text-sm leading-6 text-[#758078] md:text-base">
              2026 월드컵의 모든 경기를 예측하고 상품을 받아가세요.
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 rounded-2xl border border-[#dfe4de] bg-white p-2 shadow-sm">
            <div className="rounded-xl bg-[#f1f4ee] px-4 py-3 text-center">
              <p className="display text-xl font-bold">104</p>
              <p className="mt-0.5 text-[10px] font-semibold text-[#839087]">전체 경기</p>
            </div>
            <div className="rounded-xl px-4 py-3 text-center">
              <p className="display text-xl font-bold text-[#ff6137]">
                {matches.filter((match) => match.status === "LIVE").length}
              </p>
              <p className="mt-0.5 text-[10px] font-semibold text-[#839087]">진행 중</p>
            </div>
            <div className="rounded-xl px-4 py-3 text-center">
              <p className="display text-xl font-bold">{savedCount}</p>
              <p className="mt-0.5 text-[10px] font-semibold text-[#839087]">내 예측</p>
            </div>
          </div>
        </section>

        {liveMatch && (
          <FeaturedMatch
            match={liveMatch}
            prediction={defaultPrediction(liveMatch.id)}
            onPredict={(prediction) =>
              updatePrediction(liveMatch.id, prediction)
            }
            onSave={() => savePrediction(liveMatch.id)}
            saving={savingMatchId === liveMatch.id}
          />
        )}

        <div className="mt-9 grid gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <section id="matches">
            <div className="mb-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="display text-2xl font-bold tracking-[-0.03em]">
                    경기 일정
                  </h2>
                  <p className="mt-1 text-xs text-[#7f8a84]">
                    모든 시간은 한국 표준시(KST) 기준입니다.
                  </p>
                </div>
              </div>
              {matchDates.length > 0 && (
                <div className="-mx-1 mt-3 flex gap-1.5 overflow-x-auto px-1 pb-1">
                  {matchDates.map((date) => (
                    <button
                      className={`shrink-0 whitespace-nowrap rounded-full border px-3.5 py-2 text-xs font-bold transition ${
                        activeDate === date
                          ? "border-[#153f31] bg-[#153f31] text-white"
                          : "border-[#dfe4de] bg-white text-[#7a8580] hover:text-[#153f31]"
                      }`}
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      type="button"
                    >
                      {formatDateTab(date)}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {visibleMatches.length ? (
              <div className="grid gap-4 md:grid-cols-2">
                {visibleMatches.map((match) => (
                  <MatchCard
                    key={match.id}
                    match={match}
                    prediction={defaultPrediction(match.id)}
                    onPredict={(prediction) =>
                      updatePrediction(match.id, prediction)
                    }
                    onSave={() => savePrediction(match.id)}
                    saving={savingMatchId === match.id}
                  />
                ))}
              </div>
            ) : (
              <div className="rounded-3xl border border-dashed border-[#d4dbd4] py-16 text-center">
                <Radio className="mx-auto mb-3 text-[#9ca69f]" size={28} />
                <p className="text-sm font-bold text-[#536159]">
                  이 날짜에 표시할 경기가 없습니다.
                </p>
              </div>
            )}
          </section>

          <aside className="space-y-5" id="ranking">
            <section className="overflow-hidden rounded-[22px] border border-[#dfe4de] bg-white">
              <div className="flex items-center justify-between border-b border-[#edf0eb] px-5 py-4">
                <div className="flex items-center gap-2">
                  <Flame className="text-[#ff6137]" size={18} />
                  <h2 className="display font-bold">랭킹</h2>
                </div>
                <button
                  className="flex items-center gap-1 text-[10px] font-bold text-[#748078]"
                  type="button"
                >
                  전체 <ChevronDown size={12} />
                </button>
              </div>
              <div className="px-3 py-2">
                {initialRankings.map((item) => (
                  <div
                    className="grid grid-cols-[30px_1fr_auto] items-center gap-2 rounded-xl px-2 py-3 hover:bg-[#f5f7f2]"
                    key={item.rank}
                  >
                    <span
                      className={`display text-center text-sm font-bold ${
                        item.rank === 1 ? "text-[#ff6137]" : "text-[#8b9690]"
                      }`}
                    >
                      {item.rank}
                    </span>
                    <div className="flex items-center gap-2.5">
                      <span className="grid size-8 place-items-center rounded-full bg-[#e5eee3] text-[10px] font-extrabold text-[#23533f]">
                        {item.name.slice(0, 1)}
                      </span>
                      <div>
                        <p className="text-xs font-bold">{item.name}</p>
                        <p className="text-[9px] text-[#909a94]">{item.detail}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="display text-xs font-bold">
                        {numberFormat.format(item.points)} P
                      </p>
                      <p className="text-[9px] font-semibold text-[#2c795a]">
                        적중 {item.hitRate}%
                      </p>
                    </div>
                  </div>
                ))}
                {initialRankings.length === 0 && (
                  <div className="px-4 py-10 text-center">
                    <Trophy className="mx-auto mb-2 text-[#b5bdb8]" size={22} />
                    <p className="text-xs font-bold text-[#66736c]">
                      아직 채점된 예측이 없습니다.
                    </p>
                    <p className="mt-1 text-[10px] text-[#98a19c]">
                      첫 경기 종료 후 랭킹이 열립니다.
                    </p>
                  </div>
                )}
              </div>
              <button
                className="flex w-full items-center justify-center gap-1 border-t border-[#edf0eb] py-3.5 text-[11px] font-bold text-[#526159] hover:bg-[#fafbf8]"
                type="button"
              >
                전체 랭킹 보기 <ArrowRight size={12} />
              </button>
            </section>

            <section
              className="noise overflow-hidden rounded-[22px] bg-[#d7ff69] p-5"
              id="my"
            >
              <div className="mb-5 flex items-start justify-between">
                <div>
                  <p className="mb-1 text-[10px] font-extrabold tracking-[0.12em] text-[#386047]">
                    MY RECORD
                  </p>
                  <h3 className="display text-xl font-bold tracking-tight">
                    {user ? `${user.name}님의 기록` : "첫 예측을 남겨보세요"}
                  </h3>
                </div>
                <span className="grid size-9 place-items-center rounded-xl bg-[#173f31] text-[#d7ff69]">
                  <BarChart3 size={18} />
                </span>
              </div>
              <div className="grid grid-cols-3 gap-1.5">
                <div className="rounded-xl bg-white/55 px-2 py-3 text-center">
                  <p className="display text-lg font-bold">
                    {userStats.predictions}
                  </p>
                  <p className="text-[9px] font-semibold text-[#52685a]">참여</p>
                </div>
                <div className="rounded-xl bg-white/55 px-2 py-3 text-center">
                  <p className="display text-lg font-bold">
                    {userStats.scoredPredictions ? `${userStats.hitRate}%` : "-"}
                  </p>
                  <p className="text-[9px] font-semibold text-[#52685a]">적중률</p>
                </div>
                <div className="rounded-xl bg-white/55 px-2 py-3 text-center">
                  <p className="display text-lg font-bold">
                    {numberFormat.format(userStats.balance)} P
                  </p>
                  <p className="text-[9px] font-semibold text-[#52685a]">보유 포인트</p>
                </div>
              </div>
              {!user && (
                <a
                  className="mt-4 flex items-center justify-center gap-2 rounded-xl bg-[#143e30] py-3 text-xs font-bold text-white"
                  href="/api/auth/login"
                >
                  <ShieldCheck size={14} /> DataGSM으로 시작
                </a>
              )}
            </section>

            <div className="flex items-center gap-3 rounded-2xl border border-[#dfe4de] bg-white px-4 py-3.5 text-[10px] leading-4 text-[#78847d]">
              <Coins className="shrink-0 text-[#47705d]" size={17} />
              <p>
                전체 베팅 풀의 <b className="text-[#31483d]">70%</b>는 정확한
                스코어, <b className="text-[#31483d]">30%</b>는 승무패
                적중자에게 베팅액 비례로 분배됩니다.
              </p>
            </div>
          </aside>
        </div>
      </main>

      <footer className="border-t border-[#dde3dc] py-7">
        <div className="mx-auto flex max-w-[1240px] flex-col items-center justify-between gap-3 px-5 text-[10px] text-[#8c9690] sm:flex-row md:px-7">
          <p>© 2026 KICKOFF 26. 비공식 월드컵 승부예측 서비스</p>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1">
              <CalendarDays size={11} /> KST 기준
            </span>
            <span className="flex items-center gap-1">
              <ShieldCheck size={11} /> DataGSM OAuth
            </span>
          </div>
        </div>
      </footer>

      <FloatingChat user={user} />

      {toast && (
        <div className="fixed bottom-5 left-1/2 z-50 flex -translate-x-1/2 items-center gap-2 rounded-full bg-[#123f30] px-5 py-3 text-xs font-bold text-white shadow-2xl">
          <Check size={15} className="text-[#c9ff3d]" />
          {toast}
        </div>
      )}

      {showLoginPrompt && (
        <div
          className="fixed inset-0 z-50 grid place-items-center bg-[#0c211a]/55 px-4 backdrop-blur-sm"
          onMouseDown={(event) => {
            if (event.currentTarget === event.target) setShowLoginPrompt(false);
          }}
        >
          <div className="w-full max-w-sm rounded-[26px] bg-white p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between">
              <span className="grid size-11 place-items-center rounded-2xl bg-[#e2f1df] text-[#174c37]">
                <ShieldCheck size={22} />
              </span>
              <button
                aria-label="닫기"
                className="grid size-8 place-items-center rounded-full text-[#87918b] hover:bg-[#f1f3ee]"
                onClick={() => setShowLoginPrompt(false)}
                type="button"
              >
                <X size={17} />
              </button>
            </div>
            <h2 className="display text-2xl font-bold tracking-tight">
              예측을 기록할까요?
            </h2>
            <p className="mt-2 text-sm leading-6 text-[#758078]">
              DataGSM 계정으로 로그인하면 예측 기록과 교내 랭킹을 안전하게
              관리할 수 있습니다.
            </p>
            <a
              className="mt-6 flex items-center justify-center gap-2 rounded-2xl bg-[#123f30] py-3.5 text-sm font-bold text-white transition hover:bg-[#082d22]"
              href="/api/auth/login"
            >
              <ShieldCheck size={16} />
              DataGSM으로 계속하기
            </a>
            <button
              className="mt-2 w-full py-2 text-xs font-semibold text-[#849089]"
              onClick={() => setShowLoginPrompt(false)}
              type="button"
            >
              나중에 할게요
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
