import { Database, ExternalLink } from "lucide-react";

export function DatabaseSetup() {
  return (
    <main className="grid min-h-screen place-items-center bg-[#f3f5ef] px-5 py-12 text-[#173d30]">
      <section className="w-full max-w-xl rounded-[28px] border border-[#dce4da] bg-white p-7 shadow-[0_24px_80px_rgba(24,61,48,0.12)] md:p-10">
        <span className="grid size-12 place-items-center rounded-2xl bg-[#dff1d7] text-[#174b38]">
          <Database size={22} />
        </span>
        <p className="mt-6 text-xs font-bold uppercase tracking-[0.18em] text-[#6f7d74]">
          Database setup required
        </p>
        <h1 className="display mt-2 text-3xl font-bold tracking-tight">
          배포용 데이터베이스 연결이 필요합니다
        </h1>
        <p className="mt-4 text-sm leading-6 text-[#68756e]">
          Vercel의 로컬 파일은 영구 저장되지 않습니다. Turso 데이터베이스를
          만든 뒤 아래 환경 변수를 Vercel 프로젝트에 추가하고 다시
          배포하세요.
        </p>
        <div className="mt-6 space-y-2 rounded-2xl bg-[#112f25] p-4 font-mono text-xs text-[#d9f7cf]">
          <p>DATABASE_URL=libsql://...</p>
          <p>TURSO_AUTH_TOKEN=...</p>
        </div>
        <a
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#174b38] px-4 py-3 text-xs font-bold text-white transition hover:bg-[#0d3427]"
          href="https://turso.tech/"
          rel="noreferrer"
          target="_blank"
        >
          Turso에서 무료 DB 만들기
          <ExternalLink size={14} />
        </a>
      </section>
    </main>
  );
}
