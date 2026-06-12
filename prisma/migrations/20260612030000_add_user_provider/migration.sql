-- 외부 로그인 제공자 구분 컬럼. 기존 행은 모두 DataGSM 사용자로 간주.
ALTER TABLE "User" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'datagsm';
