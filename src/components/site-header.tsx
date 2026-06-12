import {
  CircleUserRound,
  LogOut,
  ShieldCheck,
  Trophy,
} from "lucide-react";
import Link from "next/link";
import { SessionUser } from "@/lib/types";

type SiteHeaderProps = {
  currentPath: "/" | "/rankings" | "/my-predictions";
  user: SessionUser | null;
};

const navigation = [
  { href: "/", label: "경기" },
  { href: "/rankings", label: "랭킹" },
  { href: "/my-predictions", label: "내 예측" },
] as const;

function GoogleGlyph() {
  return (
    <svg aria-hidden height="15" viewBox="0 0 48 48" width="15">
      <path
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
        fill="#EA4335"
      />
      <path
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
        fill="#4285F4"
      />
      <path
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
        fill="#FBBC05"
      />
      <path
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
        fill="#34A853"
      />
    </svg>
  );
}

export function SiteHeader({ currentPath, user }: SiteHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-[#dde3dc]/80 bg-[#f4f5f0]/90 backdrop-blur-xl">
      <div className="mx-auto flex min-h-16 max-w-[1240px] items-center justify-between gap-2 px-3 py-2 sm:px-4 md:px-7">
        <Link
          className="flex min-w-0 shrink items-center gap-2 sm:gap-2.5"
          href="/"
        >
          <span className="grid size-8 shrink-0 rotate-3 place-items-center rounded-xl bg-[#0b4b38] text-[#c9ff3d] shadow-md sm:size-9">
            <Trophy size={18} strokeWidth={2.5} />
          </span>
          <span className="display whitespace-nowrap text-base font-extrabold tracking-[-0.04em] sm:text-lg">
            KICKOFF <span className="text-[#ff6137]">26</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-7 text-sm font-semibold text-[#6e7973] md:flex">
          {navigation.map((item) => (
            <Link
              className={
                currentPath === item.href
                  ? "text-[#143d30]"
                  : "transition hover:text-[#143d30]"
              }
              href={item.href}
              key={item.href}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        {user ? (
          <div className="flex shrink-0 items-center gap-1 sm:gap-2">
            <div className="hidden text-right sm:block">
              <p className="max-w-28 truncate text-xs font-bold">{user.name}</p>
            </div>
            <span className="grid size-8 place-items-center rounded-full bg-[#dcebdd] text-[#174b37] sm:size-9">
              <CircleUserRound size={19} />
            </span>
            <a
              aria-label="로그아웃"
              className="grid size-8 place-items-center rounded-full text-[#7a8580] hover:bg-white sm:size-9"
              href="/api/auth/logout"
            >
              <LogOut size={17} />
            </a>
          </div>
        ) : (
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <a
              aria-label="Google 로그인"
              className="flex size-9 items-center justify-center rounded-full border border-[#dadce0] bg-white text-xs font-bold text-[#3c4043] shadow-sm transition hover:bg-[#f7f8f6] sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2.5"
              href="/api/auth/google/login"
            >
              <GoogleGlyph />
              <span className="hidden sm:inline">Google 로그인</span>
            </a>
            <a
              aria-label="DataGSM 로그인"
              className="flex size-9 items-center justify-center rounded-full bg-[#113e2f] text-xs font-bold text-white shadow-sm transition hover:bg-[#082b20] sm:h-auto sm:w-auto sm:gap-2 sm:px-4 sm:py-2.5"
              href="/api/auth/login"
            >
              <ShieldCheck size={15} />
              <span className="hidden sm:inline">DataGSM 로그인</span>
            </a>
          </div>
        )}
      </div>

      <nav className="mx-auto grid max-w-[1240px] grid-cols-3 border-t border-[#e5e9e4] px-3 md:hidden">
        {navigation.map((item) => (
          <Link
            className={`relative py-2.5 text-center text-xs font-bold ${
              currentPath === item.href ? "text-[#123f30]" : "text-[#89938d]"
            }`}
            href={item.href}
            key={item.href}
          >
            {item.label}
            {currentPath === item.href && (
              <span className="absolute inset-x-5 bottom-0 h-0.5 rounded-full bg-[#123f30]" />
            )}
          </Link>
        ))}
      </nav>
    </header>
  );
}
