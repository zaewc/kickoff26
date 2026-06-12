import { Medal, Target, Trophy, Users } from "lucide-react";
import Link from "next/link";
import { DatabaseSetup } from "@/components/database-setup";
import { FloatingChat } from "@/components/floating-chat";
import { SiteHeader } from "@/components/site-header";
import { getSession } from "@/lib/auth";
import { isPersistentDatabaseConfigured } from "@/lib/db";
import { getLeaderboard } from "@/lib/predictions";

export const dynamic = "force-dynamic";

const numberFormat = new Intl.NumberFormat("ko-KR");

const rankStyle = (rank: number) => {
  if (rank === 1) return "bg-[#173f31] text-[#d7ff69]";
  if (rank === 2) return "bg-[#dfe5df] text-[#395046]";
  if (rank === 3) return "bg-[#ffe3d4] text-[#b94b28]";
  return "bg-[#f0f2ee] text-[#77827b]";
};

export default async function RankingsPage() {
  if (!isPersistentDatabaseConfigured) {
    return <DatabaseSetup />;
  }

  const [user, rankings] = await Promise.all([
    getSession(),
    getLeaderboard(100),
  ]);
  const leader = rankings[0];

  return (
    <div className="min-h-screen">
      <SiteHeader currentPath="/rankings" user={user} />

      <main className="mx-auto w-full max-w-[1000px] px-3 py-7 sm:px-5 sm:py-10 md:px-7">
        <section className="noise overflow-hidden rounded-[28px] bg-[#123f30] px-5 py-7 text-white sm:px-8 sm:py-9">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-[11px] font-extrabold tracking-[0.18em] text-[#c9ff3d]">
                KICKOFF 26 LEADERBOARD
              </p>
              <h1 className="display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
                전체 랭킹
              </h1>
              <p className="mt-3 max-w-xl text-sm leading-6 text-white/65">
                DataGSM으로 참여한 사용자들의 포인트와 승무패 적중률을
                확인하세요.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 sm:min-w-64">
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <Users className="mb-2 text-[#c9ff3d]" size={17} />
                <p className="display text-xl font-bold">{rankings.length}</p>
                <p className="mt-0.5 text-[10px] text-white/55">랭킹 참여자</p>
              </div>
              <div className="rounded-2xl bg-white/10 px-4 py-3">
                <Trophy className="mb-2 text-[#ff8c68]" size={17} />
                <p className="display text-xl font-bold">
                  {leader ? numberFormat.format(leader.points) : 0}
                </p>
                <p className="mt-0.5 text-[10px] text-white/55">최고 포인트</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-5 overflow-hidden rounded-[24px] border border-[#dfe4de] bg-white">
          <div className="hidden grid-cols-[70px_1fr_120px_110px_130px] items-center border-b border-[#edf0eb] px-6 py-3 text-[10px] font-bold text-[#8a958f] sm:grid">
            <span className="text-center">순위</span>
            <span>사용자</span>
            <span className="text-right">예측</span>
            <span className="text-right">적중률</span>
            <span className="text-right">포인트</span>
          </div>

          {rankings.length ? (
            <div className="divide-y divide-[#edf0eb]">
              {rankings.map((entry) => (
                <article
                  className="grid grid-cols-[42px_1fr_auto] items-center gap-3 px-4 py-4 transition hover:bg-[#fafbf8] sm:grid-cols-[70px_1fr_120px_110px_130px] sm:px-6"
                  key={`${entry.rank}-${entry.name}`}
                >
                  <div className="flex justify-center">
                    <span
                      className={`display grid size-8 place-items-center rounded-xl text-xs font-extrabold sm:size-9 ${rankStyle(entry.rank)}`}
                    >
                      {entry.rank <= 3 ? (
                        <Medal size={16} strokeWidth={2.4} />
                      ) : (
                        entry.rank
                      )}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">{entry.name}</p>
                    <p className="mt-0.5 text-[10px] text-[#8b9690]">
                      {entry.detail}
                    </p>
                    <div className="mt-2 flex gap-3 text-[10px] font-semibold text-[#6f7d76] sm:hidden">
                      <span>예측 {entry.predictions}경기</span>
                      <span className="text-[#2c795a]">적중 {entry.hitRate}%</span>
                    </div>
                  </div>
                  <p className="hidden text-right text-xs font-bold text-[#66736c] sm:block">
                    {entry.predictions}경기
                  </p>
                  <p className="hidden text-right text-xs font-bold text-[#2c795a] sm:block">
                    {entry.hitRate}%
                  </p>
                  <p className="display whitespace-nowrap text-right text-sm font-bold sm:text-base">
                    {numberFormat.format(entry.points)} P
                  </p>
                </article>
              ))}
            </div>
          ) : (
            <div className="px-5 py-20 text-center">
              <span className="mx-auto grid size-12 place-items-center rounded-2xl bg-[#eef2eb] text-[#849088]">
                <Target size={22} />
              </span>
              <h2 className="mt-4 text-sm font-bold">
                아직 랭킹에 등록된 사용자가 없습니다
              </h2>
              <p className="mt-2 text-xs text-[#89938d]">
                예측을 등록하면 이곳에서 순위를 확인할 수 있습니다.
              </p>
              <Link
                className="mt-5 inline-flex rounded-xl bg-[#173f31] px-4 py-3 text-xs font-bold text-white"
                href="/"
              >
                경기 예측하러 가기
              </Link>
            </div>
          )}
        </section>
      </main>

      <FloatingChat user={user} />
    </div>
  );
}
