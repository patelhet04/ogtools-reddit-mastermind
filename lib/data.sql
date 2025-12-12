-- ============================================
-- OGTOOL DATABASE SCHEMA
-- ============================================

-- 1. COMPANIES
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  website_url TEXT,
  value_props TEXT[] DEFAULT '{}',
  pain_points TEXT[] DEFAULT '{}',
  target_audience TEXT,
  posts_per_week INTEGER DEFAULT 3,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PERSONAS
CREATE TABLE personas (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  username TEXT NOT NULL,
  bio TEXT,
  role TEXT, -- 'poster' or 'commenter'
  personality TEXT,
  writing_style TEXT,
  expertise_areas TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_personas_company ON personas(company_id);

-- 3. SUBREDDITS
CREATE TABLE subreddits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(company_id, name)
);

CREATE INDEX idx_subreddits_company ON subreddits(company_id);

-- 4. TARGET KEYWORDS
CREATE TABLE target_keywords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  keyword_code TEXT NOT NULL, -- K1, K2, etc.
  keyword TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_keywords_company ON target_keywords(company_id);

-- 5. CONTENT CALENDARS
CREATE TABLE content_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID REFERENCES companies(id) ON DELETE CASCADE,
  week_of DATE NOT NULL,
  status TEXT DEFAULT 'draft',
  quality_score JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  approved_at TIMESTAMPTZ,
  UNIQUE(company_id, week_of)
);

CREATE INDEX idx_calendars_company ON content_calendars(company_id);

-- 6. CALENDAR ITEMS (Posts & Comments)
CREATE TABLE calendar_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID REFERENCES content_calendars(id) ON DELETE CASCADE,
  item_code TEXT, -- P1, P2, C1, C2, etc.
  type TEXT NOT NULL, -- 'post' or 'comment'
  persona_id UUID REFERENCES personas(id),
  subreddit TEXT,
  scheduled_at TIMESTAMPTZ NOT NULL,
  title TEXT, -- posts only
  body TEXT NOT NULL,
  parent_item_id UUID REFERENCES calendar_items(id) ON DELETE CASCADE,
  keyword_ids TEXT[], -- ['K1', 'K14', 'K4']
  status TEXT DEFAULT 'pending',
  reddit_post_id TEXT,
  posted_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_items_calendar ON calendar_items(calendar_id);
CREATE INDEX idx_items_parent ON calendar_items(parent_item_id);
CREATE INDEX idx_items_scheduled ON calendar_items(scheduled_at);

-- AUTO UPDATE TIMESTAMP
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER companies_updated_at
  BEFORE UPDATE ON companies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();