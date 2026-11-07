# Shine Calc

Shine 정산 계산기 (Next.js 14 + React + Postgres), Vercel 배포용.

## 메뉴

| 경로 | 내용 |
| --- | --- |
| `/` 입력 | Shine / Driver 표에 `날짜 · 고객이름 · 항목 · 가격` 줄 단위로 입력 → 저장 (한 번 저장 = 한 묶음) |
| `/history` 히스토리 | 저장한 묶음 단위로 Shine / Driver 내역 |
| `/records` 전체 내역 | 묶음과 상관없이 모든 줄. 날짜 범위 · 항목 · 고객이름 필터 |
| `/old-page` | 이전 Week1/Week2 횟수 계산기 (Fixed Salary 차감) |

- 각 표의 합계 옆 **Copy to text** 로 표 내용을 텍스트로 복사
- 항목을 고르면 가격표 가격이 들어가고, 줄마다 수정 가능. 저장 시 그 가격이 그대로 남음
- 가격표(`shine_prices`)·Fixed Salary(`shine_settings`)는 ⚙️ 에서 수정
- 새 입력 데이터: `shine_batches` (저장 묶음), `shine_entries` (줄)
- 우측 하단 플로팅 계산기, 비밀번호 로그인 (3회 틀리면 새로고침 필요)

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
