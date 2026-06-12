-- 레퍼럴(친구 초대) 추적: 이 사용자를 초대한 사람의 식별자. 가입 시 1회만 설정.
ALTER TABLE "User" ADD COLUMN "referredBy" TEXT;
