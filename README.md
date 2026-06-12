# KICKOFF 26

2026 FIFA 월드컵 경기 현황과 교내 승부예측을 한 화면에서 제공하는
Next.js 서비스입니다.

## 실행

```bash
cp .env.example .env
npm install
npm run db:migrate
npm run dev
```

`http://localhost:3000`에서 확인할 수 있습니다. 최초 실행 시 DB가 비어
있으면 데모 경기 5개를 자동으로 넣습니다. 아래 일정 동기화를 한 번 실행하면
openfootball의 실제 2026 월드컵 104경기로 교체됩니다.

## DataGSM OAuth 설정

1. [DataGSM Client](https://www.datagsm.kr/client)에서 OAuth 클라이언트를 생성합니다.
2. 리다이렉트 URI에 `http://localhost:3000/api/auth/callback`을 정확히 등록합니다.
3. `.env.local`에 `DATAGSM_CLIENT_ID`, `DATAGSM_REDIRECT_URI`,
   `SESSION_SECRET`을 설정합니다.

로그인은 Authorization Code + PKCE(S256) 방식이며 `state`를 검증합니다.
DataGSM 액세스 토큰은 사용자 정보를 조회한 뒤 폐기하며 브라우저에 저장하지
않습니다.

## 환경 변수

| 이름 | 설명 |
| --- | --- |
| `DATAGSM_CLIENT_ID` | DataGSM OAuth Client ID |
| `DATAGSM_REDIRECT_URI` | 사전 등록한 OAuth 콜백 URI |
| `SESSION_SECRET` | 세션 쿠키 서명용 32자 이상 임의 문자열 |
| `DATABASE_URL` | SQLite 경로, 기본값 `file:./dev.db` |
| `FOOTBALL_DATA_API_KEY` | football-data.org 무료 결과 갱신 키, 선택 |
| `CRON_SECRET` | 경기 데이터 동기화 API 인증값 |

## 무료 경기 일정 적재

openfootball의 CC0 공개 JSON을 사용하므로 API 키나 결제가 필요 없습니다.

```bash
curl -X POST http://localhost:3000/api/admin/fixtures/sync \
  -H "Authorization: Bearer $CRON_SECRET"
```

이 요청은 2026 월드컵 104경기를 DB에 upsert하고 기존 데모 일정을
제거합니다. 일반 페이지 요청은 외부 API를 호출하지 않고 DB만 읽습니다.

## 무료 결과 갱신

[football-data.org](https://www.football-data.org/)에서 무료 키를 발급한 뒤
`FOOTBALL_DATA_API_KEY`를 설정합니다. 무료 플랜의 결과는 지연될 수 있습니다.

```bash
curl -X POST http://localhost:3000/api/admin/fixtures/results \
  -H "Authorization: Bearer $CRON_SECRET"
```

외부 결과가 늦거나 누락된 경우 관리자가 직접 결과를 확정할 수 있습니다.
확정 즉시 베팅 풀이 정산됩니다.

```bash
curl -X PUT http://localhost:3000/api/admin/fixtures/20260001/result \
  -H "Authorization: Bearer $CRON_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"homeScore":2,"awayScore":1}'
```

## DB 구조

- `User`: DataGSM 사용자, 학년·반, 포인트 지갑
- `Fixture`: 2026 월드컵 일정, 상태, 실제 스코어
- `Prediction`: 사용자별 경기 점수 예측, 베팅액, 배당 결과
- `PredictionRevision`: 예측 생성·수정·삭제 이력
- `PointTransaction`: 베팅 차감·환불·배당 포인트 원장

신규 사용자는 1,000P로 시작하며 경기당 10P부터 500P까지 베팅할 수
있습니다. 경기 시작 후 예측 변경은 서버에서 차단됩니다. 종료 경기 동기화
시 전체 베팅 풀의 70%는 정확한 스코어 적중자, 30%는 승무패만 적중한
사용자에게 각 베팅액 비율대로 분배됩니다. 한 그룹에 적중자가 없으면 해당
몫은 다른 적중 그룹으로 넘어가며, 적중자가 전혀 없으면 전원 환불됩니다.

```bash
npm run db:migrate  # 미적용 SQL 마이그레이션 적용
npm run db:studio   # DB 확인
npm run db:generate # Prisma Client 재생성
```

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
