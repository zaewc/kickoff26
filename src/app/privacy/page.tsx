import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "개인정보처리방침 | KICKOFF 26",
  description: "KICKOFF 26 개인정보처리방침 및 쿠키·광고 안내",
};

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-[760px] px-5 py-12 text-[#2b3a32] md:px-7">
      <Link
        href="/"
        className="text-xs font-bold text-[#4b5a51] hover:underline"
      >
        ← KICKOFF 26으로 돌아가기
      </Link>

      <h1 className="display mt-4 text-3xl font-bold tracking-tight">
        개인정보처리방침
      </h1>
      <p className="mt-2 text-xs text-[#7f8a84]">최종 업데이트: 2026-06-12</p>

      <div className="mt-8 space-y-8 text-sm leading-7 text-[#3f4d45]">
        <section>
          <h2 className="display text-lg font-bold text-[#1c3328]">
            1. 수집하는 정보
          </h2>
          <p className="mt-2">
            KICKOFF 26(이하 &ldquo;서비스&rdquo;)은 로그인 제공자를 통해 다음
            정보를 수집합니다.
          </p>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            <li>
              <b>DataGSM 로그인</b>: 식별자, 이름, 이메일, 학년·반·번호(교내
              랭킹 표시용).
            </li>
            <li>
              <b>Google 로그인</b>: Google 계정 식별자(sub), 이름, 이메일,
              프로필 사진.
            </li>
            <li>
              서비스 이용 데이터: 경기 예측, 베팅 포인트 내역, 채팅 메시지.
            </li>
          </ul>
        </section>

        <section>
          <h2 className="display text-lg font-bold text-[#1c3328]">
            2. 이용 목적
          </h2>
          <p className="mt-2">
            로그인 및 계정 식별, 예측·포인트·랭킹 기능 제공, 서비스 운영 및
            개선을 위해 사용합니다. 수집한 정보를 제3자에게 판매하지 않습니다.
          </p>
        </section>

        <section>
          <h2 className="display text-lg font-bold text-[#1c3328]">
            3. 쿠키 및 광고 (Google AdSense)
          </h2>
          <p className="mt-2">
            본 서비스는 로그인 세션 유지를 위한 쿠키를 사용합니다. 또한 광고
            게재를 위해 Google AdSense를 사용할 수 있으며, Google을 포함한
            제3자 공급업체는 쿠키를 사용해 사용자의 본 사이트 및 다른 사이트
            방문 기록에 기반한 광고를 게재합니다.
          </p>
          <p className="mt-2">
            사용자는{" "}
            <a
              className="text-[#1f6b4d] underline"
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noopener noreferrer"
            >
              Google 광고 설정
            </a>
            에서 맞춤 광고를 비활성화할 수 있으며,{" "}
            <a
              className="text-[#1f6b4d] underline"
              href="https://www.aboutads.info/choices"
              target="_blank"
              rel="noopener noreferrer"
            >
              aboutads.info
            </a>
            에서 제3자 공급업체의 쿠키 사용을 거부할 수 있습니다.
          </p>
        </section>

        <section>
          <h2 className="display text-lg font-bold text-[#1c3328]">
            4. 보관 및 삭제
          </h2>
          <p className="mt-2">
            계정 정보는 서비스 이용 기간 동안 보관되며, 계정 삭제 요청 시
            관련 데이터를 삭제합니다.
          </p>
        </section>

        <section>
          <h2 className="display text-lg font-bold text-[#1c3328]">
            5. 문의
          </h2>
          <p className="mt-2">
            개인정보 관련 문의는 서비스 운영자에게 연락해 주세요. 본 방침은
            관련 법령 및 정책 변경에 따라 업데이트될 수 있습니다.
          </p>
        </section>
      </div>
    </main>
  );
}
