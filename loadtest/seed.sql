SET client_encoding = 'UTF8';
-- team-caltalk 부하 테스트 사전 데이터
-- 경고: 모든 데이터를 삭제한다. 부하 테스트 전용 DB(team-caltalk-load)에만 적용한다.
-- backend/db/schema.sql을 먼저 적용해야 한다.
-- 날짜는 current_date 기준이므로 부하 테스트 직전에 적용한다.
-- 모든 사용자 평문 비밀번호: test1234
-- 적용: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f loadtest/seed.sql   (PGCLIENTENCODING=UTF8)

TRUNCATE users, categories, todos, refresh_tokens RESTART IDENTITY;

INSERT INTO users (email, password_hash, name)
SELECT 'load' || i || '@example.com', '$2a$10$gPOLp9ng0awehLmHLyni6u1OtieFONaCdgdMRD4dhS4DyVXnnk8sa', '부하' || i
FROM generate_series(1, 1000) AS i;

INSERT INTO categories (user_id, name, is_default)
SELECT id, '기본', true FROM users;

-- 날짜: current_date - 60 ~ + 59 범위의 시작일, 기간 0~6일
INSERT INTO todos (user_id, category_id, title, start_date, end_date, is_completed)
SELECT c.user_id, c.id, '부하 할일 ' || n, s.start_date, s.start_date + (n % 7), n % 4 = 0
FROM categories c
CROSS JOIN generate_series(1, 100) AS n
CROSS JOIN LATERAL (SELECT current_date - 60 + ((n * 7 + c.user_id::int) % 120) AS start_date) s;

ANALYZE;
