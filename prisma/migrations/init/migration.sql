-- ============================================================
--  GAMER SOCIAL NETWORK + MARKETPLACE  v3 (minimal)
--  PostgreSQL Schema
--  14 bảng — Messaging & Marketplace hoàn toàn hợp nhất
-- ============================================================

CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ┌──────────────────────────────────────────────────────────┐
-- │  ENUMS                                                   │
-- └──────────────────────────────────────────────────────────┘

CREATE TYPE user_role      AS ENUM ('user', 'member', 'admin');
CREATE TYPE post_status    AS ENUM ('active', 'hidden', 'deleted');
CREATE TYPE post_type      AS ENUM ('regular', 'marketplace');
CREATE TYPE listing_status AS ENUM ('pending_review', 'approved', 'rejected', 'sold');
CREATE TYPE reaction_type  AS ENUM ('like', 'love', 'haha', 'wow', 'sad', 'angry');
CREATE TYPE payment_status AS ENUM ('pending', 'confirmed', 'failed');

-- Trạng thái giao dịch — NULL nghĩa là đây chỉ là chat bình thường
CREATE TYPE tx_status AS ENUM ('initiated', 'both_confirmed', 'completed', 'cancelled');

CREATE TYPE notification_type AS ENUM (
    'post_reaction', 'post_comment', 'comment_reply',
    'new_follower', 'new_message',
    'listing_approved', 'listing_rejected',
    'tx_both_confirmed', 'tx_admin_joined',
    'tx_completed', 'tx_cancelled',
    'membership_activated', 'membership_expiring'
);

-- ============================================================
--  MODULE 1 — USERS & AUTH
-- ============================================================

CREATE TABLE users (
    id             UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    username       VARCHAR(50)  UNIQUE NOT NULL,
    email          VARCHAR(255) UNIQUE NOT NULL,
    password_hash  TEXT         NOT NULL,
    display_name   VARCHAR(100),
    avatar_url     TEXT,
    cover_url      TEXT,
    bio            TEXT,
    role           user_role    NOT NULL DEFAULT 'user',
    is_active      BOOLEAN      NOT NULL DEFAULT TRUE,
    email_verified BOOLEAN      NOT NULL DEFAULT FALSE,
    last_seen_at   TIMESTAMPTZ,
    created_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    updated_at     TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- OAuth
CREATE TABLE oauth_providers (
    id           UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    provider     VARCHAR(30)  NOT NULL,
    provider_uid VARCHAR(255) NOT NULL,
    UNIQUE (provider, provider_uid)
);

-- Thanh toán phí hội viên (30 ngày / lần)
-- Trigger tự động: khi confirmed → users.role = 'member', expires_at = confirmed_at + 30 days
-- Cron job (pg_cron hoặc app): khi expires_at < NOW() → users.role = 'user'
CREATE TABLE member_payments (
    id               UUID           PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id          UUID           NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    amount           NUMERIC(10,2)  NOT NULL,
    payment_provider VARCHAR(30)    NOT NULL,  -- 'sepay' | 'vietqr' | 'payos'
    payment_ref      VARCHAR(100)   UNIQUE,    -- mã từ cổng TT
    status           payment_status NOT NULL DEFAULT 'pending',
    confirmed_at     TIMESTAMPTZ,
    expires_at       TIMESTAMPTZ,              -- tự điền bởi trigger
    created_at       TIMESTAMPTZ    NOT NULL DEFAULT NOW()
);

-- Follow
CREATE TABLE follows (
    follower_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    following_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id),
    CHECK (follower_id <> following_id)
);

-- ============================================================
--  MODULE 2 — POSTS & SOCIAL
-- ============================================================

CREATE TABLE tags (
    id         SERIAL       PRIMARY KEY,
    name       VARCHAR(100) UNIQUE NOT NULL,
    slug       VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- Một bảng duy nhất cho cả bài đăng thường và bài đăng mua bán.
-- Cột listing_* chỉ có giá trị khi post_type = 'marketplace'.
CREATE TABLE posts (
    id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_type   post_type   NOT NULL DEFAULT 'regular',
    content     TEXT,
    media_urls  JSONB       NOT NULL DEFAULT '[]',
    status      post_status NOT NULL DEFAULT 'active',
    view_count  INT         NOT NULL DEFAULT 0,

    -- Marketplace fields (nullable khi regular)
    listing_price       NUMERIC(15,2),
    game_name           VARCHAR(100),
    listing_status      listing_status,
    listing_reviewed_by UUID REFERENCES users(id),
    listing_reviewed_at TIMESTAMPTZ,
    reject_reason       TEXT,

    search_vector TSVECTOR GENERATED ALWAYS AS (
        to_tsvector('simple',
            coalesce(content, '') || ' ' || coalesce(game_name, ''))
    ) STORED,

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_marketplace_required CHECK (
        post_type = 'regular'
        OR (listing_price IS NOT NULL AND game_name IS NOT NULL)
    )
);

CREATE TABLE post_tags (
    post_id UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    tag_id  INT  NOT NULL REFERENCES tags(id)  ON DELETE CASCADE,
    PRIMARY KEY (post_id, tag_id)
);

CREATE TABLE comments (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id    UUID        NOT NULL REFERENCES posts(id)    ON DELETE CASCADE,
    user_id    UUID        NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    parent_id  UUID        REFERENCES comments(id)          ON DELETE CASCADE,
    content    TEXT        NOT NULL,
    is_deleted BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE reactions (
    id         UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID          NOT NULL REFERENCES users(id)    ON DELETE CASCADE,
    post_id    UUID          REFERENCES posts(id)              ON DELETE CASCADE,
    comment_id UUID          REFERENCES comments(id)           ON DELETE CASCADE,
    type       reaction_type NOT NULL,
    created_at TIMESTAMPTZ   NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_one_target CHECK (
        (post_id IS NOT NULL)::int + (comment_id IS NOT NULL)::int = 1
    ),
    UNIQUE NULLS NOT DISTINCT (user_id, post_id),
    UNIQUE NULLS NOT DISTINCT (user_id, comment_id)
);

CREATE TABLE saved_posts (
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id    UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, post_id)
);

CREATE TABLE post_shares (
    id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    post_id   UUID NOT NULL REFERENCES posts(id) ON DELETE CASCADE,
    note      TEXT,
    shared_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  MODULE 3+4 — MESSAGING & MARKETPLACE (hợp nhất)
--
--  Mọi cuộc trò chuyện đều dùng chung bảng conversations.
--  Nếu tx_post_id IS NULL  → chat riêng tư bình thường
--  Nếu tx_post_id IS NOT NULL → chat gắn với bài đăng marketplace
--
--  Logic hiển thị nút (xử lý ở app layer):
--    - Nút "Liên hệ ngay" → chỉ hiện với user có role = 'member' VÀ có active membership
--    - Nút "Bắt đầu GD"   → chỉ hiện khi CẢ HAI participant đều là member đang hoạt động
--    - Admin được add vào conversation khi tx_status = 'both_confirmed'
-- ============================================================

CREATE TABLE conversations (
    id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),

    -- === Phần giao dịch (NULL = chat thường, NOT NULL = marketplace trade) ===
    tx_post_id          UUID      REFERENCES posts(id)  ON DELETE RESTRICT,
    tx_buyer_id         UUID      REFERENCES users(id)  ON DELETE RESTRICT,
    tx_seller_id        UUID      REFERENCES users(id)  ON DELETE RESTRICT,
    tx_status           tx_status,                       -- NULL khi là chat thường
    tx_buyer_confirmed_at  TIMESTAMPTZ,
    tx_seller_confirmed_at TIMESTAMPTZ,
    tx_admin_id         UUID      REFERENCES users(id),  -- admin tham gia hỗ trợ
    tx_admin_joined_at  TIMESTAMPTZ,
    tx_completed_at     TIMESTAMPTZ,
    tx_cancelled_at     TIMESTAMPTZ,
    -- =========================================================================

    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- Đảm bảo nhất quán: nếu có bài đăng thì phải có buyer + seller
    CONSTRAINT chk_tx_consistency CHECK (
        (tx_post_id IS NULL AND tx_buyer_id IS NULL AND tx_seller_id IS NULL)
        OR
        (tx_post_id IS NOT NULL AND tx_buyer_id IS NOT NULL AND tx_seller_id IS NOT NULL)
    ),
    CONSTRAINT chk_tx_parties CHECK (tx_buyer_id <> tx_seller_id OR tx_buyer_id IS NULL)
);

CREATE TABLE conversation_participants (
    conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    user_id         UUID NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    joined_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_read_at    TIMESTAMPTZ,
    PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
    id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
    conversation_id UUID        NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
    sender_id       UUID        NOT NULL REFERENCES users(id)         ON DELETE CASCADE,
    content         TEXT,
    media_urls      JSONB       NOT NULL DEFAULT '[]',
    is_deleted      BOOLEAN     NOT NULL DEFAULT FALSE,
    sent_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  MODULE 5 — NOTIFICATIONS
-- ============================================================

CREATE TABLE notifications (
    id         UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id    UUID              NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type       notification_type NOT NULL,
    title      VARCHAR(255),
    body       TEXT,
    data       JSONB,  -- {"post_id":"...", "conversation_id":"...", ...}
    is_read    BOOLEAN     NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
--  INDEXES
-- ============================================================

CREATE INDEX idx_users_role         ON users(role);
CREATE INDEX idx_users_uname_tgm    ON users USING gin(username gin_trgm_ops);

CREATE INDEX idx_posts_user_status  ON posts(user_id, status);
CREATE INDEX idx_posts_marketplace  ON posts(listing_status, created_at DESC)
    WHERE post_type = 'marketplace';
CREATE INDEX idx_posts_fts          ON posts USING gin(search_vector);
CREATE INDEX idx_post_tags_tag      ON post_tags(tag_id);

CREATE INDEX idx_comments_post      ON comments(post_id, created_at);
CREATE INDEX idx_comments_parent    ON comments(parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX idx_reactions_post     ON reactions(post_id)    WHERE post_id    IS NOT NULL;
CREATE INDEX idx_reactions_comment  ON reactions(comment_id) WHERE comment_id IS NOT NULL;

CREATE INDEX idx_conv_tx_post       ON conversations(tx_post_id)   WHERE tx_post_id  IS NOT NULL;
CREATE INDEX idx_conv_tx_status     ON conversations(tx_status)    WHERE tx_status   IS NOT NULL;
CREATE INDEX idx_conv_tx_buyer      ON conversations(tx_buyer_id)  WHERE tx_buyer_id IS NOT NULL;
CREATE INDEX idx_messages_conv      ON messages(conversation_id, sent_at DESC);
CREATE INDEX idx_participants_user  ON conversation_participants(user_id);

CREATE INDEX idx_member_pay_active  ON member_payments(user_id, expires_at)
    WHERE status = 'confirmed';
CREATE INDEX idx_follows_following  ON follows(following_id);
CREATE INDEX idx_notif_user         ON notifications(user_id, is_read, created_at DESC);

-- ============================================================
--  VIEW — kiểm tra hội viên đang còn hiệu lực
--  Dùng trong app: SELECT * FROM active_members WHERE id = $1
-- ============================================================

CREATE VIEW active_members AS
SELECT DISTINCT ON (u.id)
    u.id,
    u.username,
    u.display_name,
    u.avatar_url,
    mp.expires_at
FROM users u
JOIN member_payments mp ON mp.user_id = u.id
WHERE mp.status = 'confirmed'
  AND mp.expires_at > NOW()
ORDER BY u.id, mp.expires_at DESC;

-- ============================================================
--  TRIGGERS
-- ============================================================

-- auto updated_at
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$;

DO $$ DECLARE t TEXT; BEGIN
  FOR t IN SELECT unnest(ARRAY[
    'users','posts','comments','conversations'
  ]) LOOP
    EXECUTE format(
      'CREATE TRIGGER trg_%I_updated_at
       BEFORE UPDATE ON %I
       FOR EACH ROW EXECUTE FUNCTION set_updated_at()', t, t);
  END LOOP;
END $$;

-- Khi member_payments.status → 'confirmed':
--   1. Tính expires_at = confirmed_at + 30 ngày
--   2. Nâng role người dùng lên 'member'
CREATE OR REPLACE FUNCTION on_payment_confirmed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.status = 'confirmed' AND OLD.status <> 'confirmed' THEN
    NEW.expires_at   := NEW.confirmed_at + INTERVAL '30 days';
    UPDATE users
       SET role = 'member', updated_at = NOW()
     WHERE id = NEW.user_id AND role = 'user';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_payment_confirmed
BEFORE UPDATE ON member_payments
FOR EACH ROW EXECUTE FUNCTION on_payment_confirmed();

-- Khi cả 2 bên xác nhận → tự động chuyển tx_status = 'both_confirmed'
CREATE OR REPLACE FUNCTION on_tx_both_confirmed()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF NEW.tx_buyer_confirmed_at  IS NOT NULL
     AND NEW.tx_seller_confirmed_at IS NOT NULL
     AND NEW.tx_status = 'initiated' THEN
    NEW.tx_status := 'both_confirmed';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_tx_both_confirmed
BEFORE UPDATE ON conversations
FOR EACH ROW EXECUTE FUNCTION on_tx_both_confirmed();

-- ============================================================
--  GHI CHÚ VẬN HÀNH
-- ============================================================
-- 1. Hết hạn hội viên: dùng pg_cron hoặc cron job phía app
--    để chạy định kỳ (mỗi giờ):
--
--    UPDATE users SET role = 'user', updated_at = NOW()
--    WHERE role = 'member'
--      AND NOT EXISTS (
--        SELECT 1 FROM member_payments
--        WHERE user_id = users.id
--          AND status = 'confirmed'
--          AND expires_at > NOW()
--      );
--
-- 2. Khi tx_status chuyển sang 'both_confirmed' (app lắng nghe
--    NOTIFY hoặc polling), app sẽ:
--    a. INSERT INTO conversation_participants (conversation_id, user_id) → admin
--    b. INSERT INTO notifications → admin
--
-- 3. Nút "Liên hệ ngay": chỉ render nếu viewer có
--    id IN (SELECT id FROM active_members)
--
-- 4. Nút "Bắt đầu giao dịch": chỉ render nếu CẢ HAI user
--    trong conversation đều có id IN (SELECT id FROM active_members)
-- ============================================================

-- ============================================================
--  SAMPLE DATA
-- ============================================================

INSERT INTO tags (name, slug) VALUES
  ('MOBA',          'moba'),
  ('FPS',           'fps'),
  ('RPG',           'rpg'),
  ('Battle Royale', 'battle-royale'),
  ('MMO',           'mmo'),
  ('Esports',       'esports'),
  ('PC Gaming',     'pc-gaming'),
  ('Mobile',        'mobile'),
  ('Tips & Tricks', 'tips-tricks'),
  ('Review',        'review');