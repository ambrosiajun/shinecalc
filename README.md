# Shine Calc

Shine 정산 계산기 (Next.js 14 + React + Postgres), Vercel 배포용.

```
Shine 합계 − Fixed Salary = 차액
차액 − Driver total      = 총받을돈
```

- 가격표(`shine_prices`)와 Fixed Salary(`shine_settings`)는 DB 테이블 — 우측 상단 ⚙️ 에서 수정
- 저장하면 날짜 + 계산 결과 전체를 JSON 으로 `shine_history.data` 에 저장
  (당시 Fixed / 가격 / 횟수 스냅샷 포함 → 나중에 가격이 바뀌어도 기록은 그대로)
- 우측 History 패널 (모바일에선 🕘 버튼 → 드로어), JSON 보기 / 삭제
- 우측 하단 플로팅 계산기 (invoice-system 의 FloatingCalculator)
- 비밀번호 로그인 (쿠키 30일)

## Env

| 이름 | 설명 |
| --- | --- |
| `APP_PASSWORD` | 페이지 접속 비밀번호 |
| `DATABASE_URL` | Postgres 연결 문자열 (Neon / Supabase / Vercel Postgres 등) |

테이블은 첫 요청 때 자동 생성되고 스프레드시트 값으로 시드됩니다 (`schema.sql` 참고).

## 개발

```bash
cp .env.example .env.local
npm install
npm run dev
```

## Vercel

1. Vercel 에서 이 repo import (Framework: Next.js)
2. Environment Variables 에 `APP_PASSWORD`, `DATABASE_URL` 추가
3. Deploy
