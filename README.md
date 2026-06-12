# KICKOFF 26

2026 FIFA 월드컵 경기 현황과 교내 승부예측을 한 화면에서 제공하는
Next.js 서비스입니다.

## 실행

```bash
cp .env.example .env.local
npm install
npm run dev
```

`http://localhost:3000`에서 확인할 수 있습니다. 축구 API 키가 없으면
데모 데이터를 사용하며, 키를 설정하면 API-Football의 2026 월드컵
(`league=1`, `season=2026`) 데이터로 자동 전환됩니다.

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
| `API_FOOTBALL_KEY` | API-Football API 키, 미설정 시 데모 모드 |

## 데이터와 예측

- 경기 일정/실시간 점수: API-Football, 30초 서버 캐시
- 사용자 인증: DataGSM OAuth
- MVP 예측 저장: 로그인한 브라우저의 `localStorage`

다중 기기 예측 동기화와 조작 방지가 필요한 운영 환경에서는 예측을 서버
DB에 저장하고 경기 시작 시각 이후 수정을 차단해야 합니다.

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
