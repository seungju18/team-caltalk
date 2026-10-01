SET client_encoding = 'UTF8';
-- team-caltalk 개발용 시드 (개발 DB 전용. 재적용 시 모든 데이터를 초기화한다)
-- 적용: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f backend/db/seed.sql
-- 근거: docs/1-domain-definition.md 5.2 예시 데이터
-- 모든 사용자 평문 비밀번호: test1234 (개발용)

TRUNCATE users, categories, todos, refresh_tokens RESTART IDENTITY;

INSERT INTO users (email, password_hash, name) VALUES
    ('me@example.com',    '$2a$10$gPOLp9ng0awehLmHLyni6u1OtieFONaCdgdMRD4dhS4DyVXnnk8sa', '본인'),
    ('other@example.com', '$2a$10$gPOLp9ng0awehLmHLyni6u1OtieFONaCdgdMRD4dhS4DyVXnnk8sa', '다른사용자');

INSERT INTO categories (user_id, name, is_default)
SELECT id, '기본', true FROM users;

INSERT INTO categories (user_id, name)
SELECT id, '업무' FROM users WHERE email = 'me@example.com';

INSERT INTO todos (user_id, category_id, title, start_date, end_date, is_completed)
SELECT u.id, c.id, v.title, v.start_date::date, v.end_date::date, v.is_completed
FROM (VALUES
    ('me@example.com',    '업무', '할일 A',           '2026-09-25', '2026-09-28', false),
    ('me@example.com',    '업무', '할일 B',           '2026-09-30', '2026-10-02', false),
    ('me@example.com',    '기본', '할일 C',           '2026-10-01', '2026-10-01', false),
    ('me@example.com',    '기본', '할일 D',           '2026-10-05', '2026-10-06', false),
    ('me@example.com',    '기본', '할일 E',           '2026-10-05', '2026-10-06', true),
    ('me@example.com',    '기본', '할일 F',           '2026-09-20', '2026-09-25', true),
    ('other@example.com', '기본', '다른 사용자 할일', '2026-10-01', '2026-10-01', false)
) AS v (email, category, title, start_date, end_date, is_completed)
JOIN users u ON u.email = v.email
JOIN categories c ON c.user_id = u.id AND c.name = v.category
ORDER BY u.id, v.title;  -- id 순서: A~F(1~6), 다른 사용자 할일(7)
