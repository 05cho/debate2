-- ==========================================================
-- 우리들의 생각 공장 - 무기명 토론 (School Anonymous Debate)
-- Supabase Table Schema & Realtime Setup Script
-- ==========================================================
-- Supabase 콘솔 > SQL Editor에 복사하여 붙여넣고 [Run]을 누르세요.

-- 1. discussions 테이블 (현재 토론 주제 및 모드/단계)
CREATE TABLE IF NOT EXISTS public.discussions (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  mode TEXT NOT NULL DEFAULT 'pro_con',
  current_stage INTEGER NOT NULL DEFAULT 1,
  is_active BOOLEAN NOT NULL DEFAULT true,
  allow_submissions BOOLEAN NOT NULL DEFAULT true,
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::BIGINT,
  updated_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::BIGINT
);

-- 기본 토론 주제 데이터 삽입 (없는 경우에만)
INSERT INTO public.discussions (id, title, description, mode, current_stage, is_active, allow_submissions)
VALUES (
  'current-topic',
  '초·중·고등학교 내 스마트폰 자율 사용을 전면 허용해야 하는가?',
  '수업 시간 및 쉬는 시간 학생들의 스마트폰 소지와 자율적 디지털 학습 도구 활용에 대한 여러분의 진솔한 생각과 구체적인 근거를 나눠주세요.',
  'pro_con',
  1,
  true,
  true
)
ON CONFLICT (id) DO NOTHING;

-- 2. posts 테이블 (의견, 포스트잇, 3단계 발언 카드)
CREATE TABLE IF NOT EXISTS public.posts (
  id TEXT PRIMARY KEY,
  discussion_id TEXT NOT NULL DEFAULT 'current-topic',
  mode TEXT NOT NULL,
  author_id TEXT NOT NULL,
  anonymous_name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  content TEXT NOT NULL,
  stance TEXT,
  color TEXT,
  stage INTEGER,
  reply_to_post_id TEXT,
  reply_to_summary TEXT,
  likes INTEGER NOT NULL DEFAULT 0,
  liked_by JSONB NOT NULL DEFAULT '[]'::JSONB,
  comments_count INTEGER NOT NULL DEFAULT 0,
  is_blinded BOOLEAN NOT NULL DEFAULT false,
  is_pinned BOOLEAN NOT NULL DEFAULT false,
  student_info JSONB,
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::BIGINT
);

-- 3. comments 테이블 (댓글)
CREATE TABLE IF NOT EXISTS public.comments (
  id TEXT PRIMARY KEY,
  post_id TEXT NOT NULL,
  author_id TEXT NOT NULL,
  anonymous_name TEXT NOT NULL,
  avatar TEXT NOT NULL,
  content TEXT NOT NULL,
  student_info JSONB,
  created_at BIGINT NOT NULL DEFAULT (extract(epoch from now()) * 1000)::BIGINT
);

-- 4. RLS (Row Level Security) 설정 - 학생/교사 자유 참여 허용
ALTER TABLE public.discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow public all on discussions" ON public.discussions;
CREATE POLICY "Allow public all on discussions" ON public.discussions FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on posts" ON public.posts;
CREATE POLICY "Allow public all on posts" ON public.posts FOR ALL USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow public all on comments" ON public.comments;
CREATE POLICY "Allow public all on comments" ON public.comments FOR ALL USING (true) WITH CHECK (true);

-- 5. 실시간 리스너 (Realtime) 복제 활성화
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'discussions'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.discussions;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'posts'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.posts;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' AND tablename = 'comments'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.comments;
  END IF;
END $$;
