import {
  CalendarDays,
  CheckCircle2,
  CircleDot,
  Clock3,
  Coins,
  ListChecks,
  ShieldCheck,
  Target,
  XCircle,
} from "lucide-react";
import { DatabaseSetup } from "@/components/database-setup";
import { FloatingChat } from "@/components/floating-chat";
import { SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/auth";
import { isPersistentDatabaseConfigured } from "@/lib/db";
import {
  getPredictionListForUser,
  getUserStats,
} from "@/lib/predictions";
import { MatchStatus, Team, UserPredictionEntry } from "@/lib/types";

export const dynamic = "force-dynamic";

const numberFormat = new Intl.NumberFormat("ko-KR");

const formatKickoff = (value: string) =>
  new Intl.DateTimeFormat("ko-KR", {
    month: "long",
    day: "numeric",
    weekday: "short",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
    timeZone: "Asia/Seoul",
  }).format(new Date(value));

const statusLabel: Record<MatchStatus, string> = {
  UPCOMING: "예정",
  LIVE: "진행 중",
  FINISHED: "종료",
};

const statusStyle: Record<MatchStatus, string> = {
  UPCOMING: "bg-[#edf1eb] text-[#6d7972]",
  LIVE: "bg-[#ffe4db] text-[#d14f2d]",
  FINISHED: "bg-[#dff0e7] text-[#256247]",
};

function TeamMark({ team }: { team: Team }) {
  if (team.logo) {
    return (
      // API에서 제공되는 국기 URL은 도메인이 일정하지 않아 일반 img로 표시한다.
      // eslint-disable-next-line @next/next/no-img-element
      <img
        alt=""
        className="size-9 rounded-full object-contain sm:size-11"
        src={team.logo}
      />
    );
  }

  return (
    <span className="display grid size-9 place-items-center rounded-full bg-[#edf1eb] text-[10px] font-extrabold text-[#355345] sm:size-11">
      {team.code.slice(0, 3)}
    </span>
  );
}

function ResultBadge({ entry }: { entry: UserPredictionEntry }) {
  if (entry.status !== "FINISHED" || !entry.scoredAt) {
    return null;
  }

  if (entry.exactScore) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#d7ff69] px-2.5 py-1 text-[10px] font-extrabold text-[#244433]">
        <Target size={11} /> 스코어 적중
      </span>
    );
  }

  if (entry.outcomeCorrect) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-[#dff0e7] px-2.5 py-1 text-[10px] font-extrabold text-[#256247]">
        <CheckCircle2 size={11} /> 승무패 적중
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-[#f2f0ed] px-2.5 py-1 text-[10px] font-extrabold text-[#7b7d78]">
      <XCircle size={11} /> 미적중
    </span>
  );
}

export default async function MyPredictionsPage() {
  if (!isPersistentDatabaseConfigured) {
    return <DatabaseSetup />;
  }

  const user = await getSession();

  if (!user) {
    return (
      <div className="min-h-screen">
        <SiteHeader currentPath="/my-predictions" user={null} />
        <main className="grid min-h-[calc(100dvh-7rem)] place-items-center px-4 py-12">
          <section className="w-full max-w-lg rounded-[28px] border border-[#dfe4de] bg-white p-7 text-center shadow-[0_20px_70px_rgba(20,61,48,0.08)] sm:p-10">
            <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-[#dff1d7] text-[#174b38]">
              <ListChecks size={25} />
            </span>
            <h1 className="display mt-5 text-2xl font-bold tracking-tight">
              내 예측을 확인하려면 로그인하세요
            </h1>
            <p className="mt-3 text-sm leading-6 text-[#738078]">
              저장한 경기 예측과 적중 결과, 획득 포인트를 한곳에서 확인할 수
              있습니다.
            </p>
            <div className="mt-6 grid gap-2 sm:grid-cols-2">
              <a
                className="rounded-xl border border-[#dce2dc] px-4 py-3 text-xs font-bold text-[#44534b]"
                href="/api/auth/google/login"
              >
                Google 로그인
              </a>
              <a
                className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-[#173f31] px-4 py-3 text-xs font-bold text-white"
                href="/api/auth/login"
              >
                <ShieldCheck size={14} /> DataGSM 로그인
              </a>
            </div>
          </section>
        </main>
        <FloatingChat user={null} />
      </div>
    );
  }

  const [predictions, stats] = await Promise.all([
    getPredictionListForUser(user),
    getUserStats(user),
  ]);

  return (
    <div className="min-h-screen">
      <SiteHeader currentPath="/my-predictions" user={user} />

      <main className="mx-auto w-full max-w-[1000px] px-3 py-7 sm:px-5 sm:py-10 md:px-7">
        <section className="noise overflow-hidden rounded-[28px] bg-[#d7ff69] p-5 sm:p-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.16em] text-[#386047]">
                MY PREDICTIONS
              </p>
              <h1 className="display mt-2 text-3xl font-bold tracking-tight">
                {user.name}님의 예측
              </h1>
              <p className="mt-2 text-sm text-[#4f6959]">
                지금까지 저장한 모든 경기 예측을 확인하세요.
              </p>
            </div>
            <div className="grid grid-cols-3 gap-2 sm:min-w-80">
              <div className="rounded-2xl bg-white/60 px-3 py-3 text-center">
                <p className="display text-xl font-bold">{stats.predictions}</p>
                <p className="text-[10px] font-semibold text-[#58705f]">참여</p>
              </div>
              <div className="rounded-2xl bg-white/60 px-3 py-3 text-center">
                <p className="display text-xl font-bold">
                  {stats.scoredPredictions ? `${stats.hitRate}%` : "-"}
                </p>
                <p className="text-[10px] font-semibold text-[#58705f]">적중률</p>
              </div>
              <div className="rounded-2xl bg-white/60 px-3 py-3 text-center">
                <p className="display text-xl font-bold">
                  {numberFormat.format(stats.balance)}
                </p>
                <p className="text-[10px] font-semibold text-[#58705f]">보유 P</p>
              </div>
            </div>
          </div>
        </section>

        {predictions.length ? (
          <section className="mt-5 space-y-3">
            {predictions.map((entry) => (
              <article
                className="overflow-hidden rounded-[22px] border border-[#dfe4de] bg-white"
                key={entry.id}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-[#edf0eb] px-4 py-3 sm:px-5">
                  <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold text-[#7c8881]">
                    <span
                      className={`rounded-full px-2.5 py-1 font-extrabold ${statusStyle[entry.status]}`}
                    >
                      {entry.status === "LIVE" && (
                        <CircleDot className="mr-1 inline" size={10} />
                      )}
                      {statusLabel[entry.status]}
                    </span>
                    <span>{entry.stage}</span>
                    {entry.group && <span>{entry.group}</span>}
                  </div>
                  <span className="flex items-center gap-1 text-[10px] font-semibold text-[#78847d]">
                    <CalendarDays size={11} />
                    {formatKickoff(entry.kickoff)}
                  </span>
                </div>

                <div className="grid gap-5 px-4 py-5 sm:grid-cols-[1fr_auto] sm:items-center sm:px-6">
                  <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="flex min-w-0 flex-col items-center text-center">
                      <TeamMark team={entry.home} />
                      <p className="mt-2 max-w-full truncate text-xs font-bold sm:text-sm">
                        {entry.home.name}
                      </p>
                    </div>
                    <div className="text-center">
                      <p className="text-[9px] font-bold tracking-[0.14em] text-[#8e9993]">
                        MY PICK
                      </p>
                      <p className="display mt-1 whitespace-nowrap text-3xl font-bold tracking-tight sm:text-4xl">
                        {entry.prediction.home}
                        <span className="mx-2 text-[#b1b9b4]">:</span>
                        {entry.prediction.away}
                      </p>
                    </div>
                    <div className="flex min-w-0 flex-col items-center text-center">
                      <TeamMark team={entry.away} />
                      <p className="mt-2 max-w-full truncate text-xs font-bold sm:text-sm">
                        {entry.away.name}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#f5f7f2] px-4 py-3 sm:min-w-48 sm:block sm:text-right">
                    <div>
                      <p className="text-[9px] font-bold text-[#8a958f]">
                        베팅 포인트
                      </p>
                      <p className="display mt-0.5 text-sm font-bold">
                        {numberFormat.format(entry.prediction.wager)} P
                      </p>
                    </div>
                    {entry.scoredAt && (
                      <div className="sm:mt-3">
                        <ResultBadge entry={entry} />
                        <p className="mt-1 text-[10px] font-bold text-[#2c795a]">
                          {entry.payoutPoints > 0
                            ? `+${numberFormat.format(entry.payoutPoints)} P`
                            : "획득 포인트 없음"}
                        </p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 bg-[#fafbf8] px-4 py-3 text-[10px] text-[#7d8982] sm:px-5">
                  <span className="flex items-center gap-1">
                    <Clock3 size={11} />
                    {entry.venue || "경기장 미정"}
                  </span>
                  {entry.status === "FINISHED" &&
                    entry.result.home !== null &&
                    entry.result.away !== null && (
                      <span className="font-bold text-[#46564d]">
                        실제 결과 {entry.result.home} : {entry.result.away}
                      </span>
                    )}
                </div>
              </article>
            ))}
          </section>
        ) : (
          <section className="mt-5 rounded-[24px] border border-dashed border-[#d4dbd4] bg-white/60 px-5 py-20 text-center">
            <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#eef2eb] text-[#849088]">
              <Coins size={22} />
            </span>
            <h2 className="mt-4 text-sm font-bold">아직 저장한 예측이 없습니다</h2>
            <p className="mt-2 text-xs text-[#89938d]">
              경기 스코어와 베팅 포인트를 입력해 첫 예측을 남겨보세요.
            </p>
            <a
              className="mt-5 inline-flex rounded-xl bg-[#173f31] px-4 py-3 text-xs font-bold text-white"
              href="/"
            >
              경기 예측하러 가기
            </a>
          </section>
        )}
      </main>

      <FloatingChat user={user} />
    </div>
  );
}
