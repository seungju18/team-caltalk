-- team-caltalk DDL (PostgreSQL 17)
-- 근거: docs/7-erd.md v0.2
-- 적용: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -1 -f backend/db/schema.sql   (빈 DB 기준, PGCLIENTENCODING=UTF8)

CREATE TABLE users (
    id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    email         varchar(254) NOT NULL UNIQUE,  -- BR-02, BR-16
    password_hash varchar(60)  NOT NULL,         -- NFR-07 bcrypt
    name          varchar(30)  NOT NULL,
    created_at    timestamptz  NOT NULL DEFAULT now()
);

CREATE TABLE categories (
    id         bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id    bigint      NOT NULL REFERENCES users (id),
    name       varchar(20) NOT NULL,
    is_default boolean     NOT NULL DEFAULT false,  -- BR-05, BR-17
    UNIQUE (user_id, name)
);

-- BR-05: 사용자당 기본 카테고리 1개
CREATE UNIQUE INDEX categories_user_id_default_key ON categories (user_id) WHERE is_default;

CREATE TABLE todos (
    id           bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id      bigint        NOT NULL REFERENCES users (id),
    category_id  bigint        NOT NULL REFERENCES categories (id) ON DELETE RESTRICT,  -- BR-18
    title        varchar(100)  NOT NULL,
    description  varchar(1000),
    start_date   date          NOT NULL,
    end_date     date          NOT NULL,
    is_completed boolean       NOT NULL DEFAULT false,
    created_at   timestamptz   NOT NULL DEFAULT now(),
    updated_at   timestamptz   NOT NULL DEFAULT now(),  -- 트리거 없음. UPDATE 쿼리가 now() 직접 설정
    CHECK (end_date >= start_date)  -- BR-08
);

-- NFR-04, OI-09
CREATE INDEX todos_user_id_end_date_idx ON todos (user_id, end_date);

CREATE TABLE refresh_tokens (
    jti        uuid        PRIMARY KEY,
    user_id    bigint      NOT NULL REFERENCES users (id) ON DELETE CASCADE,
    expires_at timestamptz NOT NULL
);

CREATE INDEX refresh_tokens_user_id_idx ON refresh_tokens (user_id);
