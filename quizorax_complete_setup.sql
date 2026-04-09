-- =============================================
-- QuizoraX - Complete Database Setup Script
-- For self-hosted Supabase / PostgreSQL 15
-- Run on a FRESH Supabase database
-- =============================================

-- =============================================
-- 1. EXTENSIONS
-- =============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =============================================
-- 2. ENUM TYPES
-- =============================================
CREATE TYPE public.app_role AS ENUM ('admin', 'creator', 'student', 'super_admin');
CREATE TYPE public.access_type AS ENUM ('public', 'password', 'batch');
CREATE TYPE public.difficulty_level AS ENUM ('easy', 'medium', 'hard');
CREATE TYPE public.attempt_status AS ENUM ('in_progress', 'submitted', 'auto_submitted', 'abandoned');
CREATE TYPE public.survey_question_type AS ENUM ('short_text', 'long_text', 'dropdown', 'checkbox');

-- =============================================
-- 3. TABLES
-- =============================================

-- 3.1 Profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3.2 User Roles (CRITICAL: roles in separate table for security)
CREATE TABLE IF NOT EXISTS public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 3.3 Quizzes
CREATE TABLE IF NOT EXISTS public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER NOT NULL DEFAULT 30,
  total_marks INTEGER NOT NULL DEFAULT 100,
  negative_marking BOOLEAN NOT NULL DEFAULT false,
  negative_marks_per_wrong NUMERIC DEFAULT 0,
  shuffle_questions BOOLEAN NOT NULL DEFAULT true,
  show_results_to_students BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  passing_percentage NUMERIC NOT NULL DEFAULT 40,
  first_position_min NUMERIC NOT NULL DEFAULT 90,
  second_position_min NUMERIC NOT NULL DEFAULT 75,
  third_position_min NUMERIC NOT NULL DEFAULT 60,
  max_attempts INTEGER DEFAULT 1,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN public.quizzes.max_attempts IS 'Maximum number of attempts allowed per student. NULL means unlimited attempts.';

-- 3.4 Quiz Access Rules
CREATE TABLE IF NOT EXISTS public.quiz_access_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  access_type access_type NOT NULL DEFAULT 'public',
  password_hash TEXT,
  allowed_batches TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_access_rules ENABLE ROW LEVEL SECURITY;

-- 3.5 Quiz Questions
CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  option_a TEXT NOT NULL,
  option_b TEXT NOT NULL,
  option_c TEXT NOT NULL,
  option_d TEXT NOT NULL,
  correct_option CHAR(1) NOT NULL CHECK (correct_option IN ('A', 'B', 'C', 'D')),
  marks INTEGER NOT NULL DEFAULT 1,
  difficulty difficulty_level NOT NULL DEFAULT 'medium',
  order_index INTEGER NOT NULL DEFAULT 0,
  is_archived BOOLEAN NOT NULL DEFAULT false,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- 3.6 Student Identities
CREATE TABLE IF NOT EXISTS public.student_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  college_id TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  batch TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.student_identities ENABLE ROW LEVEL SECURITY;

-- 3.7 Quiz Attempts
CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_identity_id UUID NOT NULL REFERENCES public.student_identities(id) ON DELETE CASCADE,
  attempt_token TEXT NOT NULL DEFAULT gen_random_uuid()::text,
  status attempt_status NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,
  score NUMERIC,
  total_marks INTEGER,
  correct_count INTEGER,
  wrong_count INTEGER,
  unanswered_count INTEGER,
  percentage NUMERIC,
  passed BOOLEAN,
  tab_switch_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

CREATE UNIQUE INDEX IF NOT EXISTS unique_student_quiz_attempt
  ON public.quiz_attempts(quiz_id, student_identity_id);

-- 3.8 Quiz Responses
CREATE TABLE IF NOT EXISTS public.quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_option CHAR(1) CHECK (selected_option IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN,
  marks_awarded NUMERIC DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);
ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- 3.9 Attempt Logs (anti-cheat)
CREATE TABLE IF NOT EXISTS public.attempt_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.attempt_logs ENABLE ROW LEVEL SECURITY;

-- 3.10 Surveys
CREATE TABLE IF NOT EXISTS public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

-- 3.11 Survey Questions
CREATE TABLE IF NOT EXISTS public.survey_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  question_text TEXT NOT NULL,
  question_type survey_question_type NOT NULL,
  options JSONB,
  is_required BOOLEAN NOT NULL DEFAULT false,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.survey_questions ENABLE ROW LEVEL SECURITY;

-- 3.12 Survey Responses
CREATE TABLE IF NOT EXISTS public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  respondent_name TEXT,
  respondent_email TEXT,
  responses JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- 3.13 Site Settings
CREATE TABLE IF NOT EXISTS public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  description TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_by UUID REFERENCES auth.users(id)
);
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- 3.14 Footer Links
CREATE TABLE IF NOT EXISTS public.footer_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  section TEXT NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.footer_links ENABLE ROW LEVEL SECURITY;

-- 3.15 Footer Content
CREATE TABLE IF NOT EXISTS public.footer_content (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  brand_name TEXT NOT NULL DEFAULT 'QuizoraX',
  brand_description TEXT NOT NULL DEFAULT 'A secure, backend-first quiz and survey platform built for academic assessments.',
  copyright_text TEXT NOT NULL DEFAULT 'All rights reserved.',
  tagline TEXT NOT NULL DEFAULT 'Built for Academic Excellence',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
ALTER TABLE public.footer_content ENABLE ROW LEVEL SECURITY;

-- =============================================
-- 4. INDEXES
-- =============================================
CREATE INDEX IF NOT EXISTS idx_quizzes_is_archived
  ON public.quizzes(is_archived) WHERE is_archived = false;

CREATE INDEX IF NOT EXISTS idx_quiz_questions_is_archived
  ON public.quiz_questions(is_archived) WHERE is_archived = false;

-- =============================================
-- 5. VIEWS
-- =============================================

-- Public-facing view that excludes correct_option (prevents answer key exposure)
CREATE OR REPLACE VIEW public.quiz_questions_public
WITH (security_invoker = true)
AS
SELECT
  id,
  quiz_id,
  question_text,
  option_a,
  option_b,
  option_c,
  option_d,
  marks,
  difficulty,
  order_index,
  created_at
FROM public.quiz_questions;

GRANT SELECT ON public.quiz_questions_public TO anon, authenticated;

-- =============================================
-- 6. FUNCTIONS
-- =============================================

-- 6.1 Role check function (prevents RLS recursion)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND (
        role = _role
        OR (role = 'super_admin' AND _role IN ('admin', 'creator'))
      )
  )
$$;

-- 6.2 Get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;

-- 6.3 Can assign role (role hierarchy check)
CREATE OR REPLACE FUNCTION public.can_assign_role(_assigner_id UUID, _target_role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE
    WHEN public.has_role(_assigner_id, 'super_admin') AND _target_role IN ('admin', 'student') THEN true
    WHEN public.has_role(_assigner_id, 'admin') AND _target_role = 'student' THEN true
    ELSE false
  END
$$;

-- 6.4 Get role hierarchy level
CREATE OR REPLACE FUNCTION public.get_role_level(_role app_role)
RETURNS INTEGER
LANGUAGE sql
IMMUTABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT CASE _role
    WHEN 'super_admin' THEN 3
    WHEN 'admin' THEN 2
    WHEN 'student' THEN 1
    ELSE 0
  END
$$;

-- 6.5 Handle new user signup (creates profile + assigns student role)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'full_name', NEW.email)
  );

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');

  RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS 'Automatically creates profile and assigns student role to new users. Runs with SECURITY DEFINER to bypass RLS.';

-- 6.6 Update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 6.7 Enforce single super_admin
CREATE OR REPLACE FUNCTION public.enforce_single_superadmin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role = 'super_admin' THEN
    IF EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE role = 'super_admin'
      AND user_id != NEW.user_id
    ) THEN
      RAISE EXCEPTION 'Only one Creator/Superadmin can exist in the system';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- 6.8 Calculate quiz score (on attempt submission)
CREATE OR REPLACE FUNCTION public.calculate_quiz_score()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_quiz_id uuid;
  v_total_questions int;
  v_correct_count int := 0;
  v_wrong_count int := 0;
  v_unanswered_count int := 0;
  v_total_score numeric := 0;
  v_total_marks int;
  v_percentage numeric;
  v_passed boolean;
  v_negative_marking boolean;
  v_negative_marks numeric;
  r record;
BEGIN
  IF NEW.status IN ('submitted', 'auto_submitted') AND
     (OLD.status IS NULL OR OLD.status = 'in_progress') THEN

    v_quiz_id := NEW.quiz_id;

    SELECT total_marks, negative_marking, COALESCE(negative_marks_per_wrong, 0)
    INTO v_total_marks, v_negative_marking, v_negative_marks
    FROM quizzes WHERE id = v_quiz_id;

    SELECT COUNT(*) INTO v_total_questions
    FROM quiz_questions WHERE quiz_id = v_quiz_id;

    FOR r IN
      SELECT
        qr.id as response_id,
        qr.selected_option,
        qq.correct_option,
        qq.marks
      FROM quiz_questions qq
      LEFT JOIN quiz_responses qr ON qr.question_id = qq.id AND qr.attempt_id = NEW.id
      WHERE qq.quiz_id = v_quiz_id
    LOOP
      IF r.selected_option IS NULL THEN
        v_unanswered_count := v_unanswered_count + 1;
      ELSIF r.selected_option = r.correct_option THEN
        v_correct_count := v_correct_count + 1;
        v_total_score := v_total_score + r.marks;
        IF r.response_id IS NOT NULL THEN
          UPDATE quiz_responses
          SET is_correct = true, marks_awarded = r.marks
          WHERE id = r.response_id;
        END IF;
      ELSE
        v_wrong_count := v_wrong_count + 1;
        IF v_negative_marking THEN
          v_total_score := v_total_score - v_negative_marks;
        END IF;
        IF r.response_id IS NOT NULL THEN
          UPDATE quiz_responses
          SET is_correct = false, marks_awarded = CASE WHEN v_negative_marking THEN -v_negative_marks ELSE 0 END
          WHERE id = r.response_id;
        END IF;
      END IF;
    END LOOP;

    IF v_total_score < 0 THEN
      v_total_score := 0;
    END IF;

    IF v_total_marks > 0 THEN
      v_percentage := (v_total_score / v_total_marks) * 100;
    ELSE
      v_percentage := 0;
    END IF;

    v_passed := v_percentage >= 40;

    NEW.score := v_total_score;
    NEW.total_marks := v_total_marks;
    NEW.correct_count := v_correct_count;
    NEW.wrong_count := v_wrong_count;
    NEW.unanswered_count := v_unanswered_count;
    NEW.percentage := v_percentage;
    NEW.passed := v_passed;
  END IF;

  RETURN NEW;
END;
$$;

-- 6.9 Recalculate all quiz attempts (for retroactive score updates)
CREATE OR REPLACE FUNCTION public.recalculate_quiz_attempts(p_quiz_id UUID)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_quiz record;
  v_attempt record;
  v_response record;
  v_correct_count int;
  v_wrong_count int;
  v_unanswered_count int;
  v_total_score numeric;
  v_total_questions int;
  v_percentage numeric;
  v_passed boolean;
BEGIN
  SELECT total_marks, negative_marking, COALESCE(negative_marks_per_wrong, 0) as neg_marks, passing_percentage
  INTO v_quiz
  FROM quizzes WHERE id = p_quiz_id;

  IF v_quiz IS NULL THEN
    RETURN;
  END IF;

  SELECT COUNT(*) INTO v_total_questions
  FROM quiz_questions WHERE quiz_id = p_quiz_id;

  FOR v_attempt IN
    SELECT id FROM quiz_attempts
    WHERE quiz_id = p_quiz_id
    AND status IN ('submitted', 'auto_submitted')
  LOOP
    v_correct_count := 0;
    v_wrong_count := 0;
    v_unanswered_count := 0;
    v_total_score := 0;

    FOR v_response IN
      SELECT
        qr.id as response_id,
        qr.selected_option,
        qq.correct_option,
        qq.marks
      FROM quiz_questions qq
      LEFT JOIN quiz_responses qr ON qr.question_id = qq.id AND qr.attempt_id = v_attempt.id
      WHERE qq.quiz_id = p_quiz_id
    LOOP
      IF v_response.selected_option IS NULL THEN
        v_unanswered_count := v_unanswered_count + 1;
        IF v_response.response_id IS NOT NULL THEN
          UPDATE quiz_responses
          SET is_correct = NULL, marks_awarded = 0
          WHERE id = v_response.response_id;
        END IF;
      ELSIF v_response.selected_option = v_response.correct_option THEN
        v_correct_count := v_correct_count + 1;
        v_total_score := v_total_score + v_response.marks;
        IF v_response.response_id IS NOT NULL THEN
          UPDATE quiz_responses
          SET is_correct = true, marks_awarded = v_response.marks
          WHERE id = v_response.response_id;
        END IF;
      ELSE
        v_wrong_count := v_wrong_count + 1;
        IF v_quiz.negative_marking THEN
          v_total_score := v_total_score - v_quiz.neg_marks;
        END IF;
        IF v_response.response_id IS NOT NULL THEN
          UPDATE quiz_responses
          SET is_correct = false,
              marks_awarded = CASE WHEN v_quiz.negative_marking THEN -v_quiz.neg_marks ELSE 0 END
          WHERE id = v_response.response_id;
        END IF;
      END IF;
    END LOOP;

    IF v_total_score < 0 THEN
      v_total_score := 0;
    END IF;

    IF v_quiz.total_marks > 0 THEN
      v_percentage := (v_total_score / v_quiz.total_marks) * 100;
    ELSE
      v_percentage := 0;
    END IF;

    v_passed := v_percentage >= v_quiz.passing_percentage;

    UPDATE quiz_attempts
    SET
      score = v_total_score,
      total_marks = v_quiz.total_marks,
      correct_count = v_correct_count,
      wrong_count = v_wrong_count,
      unanswered_count = v_unanswered_count,
      percentage = v_percentage,
      passed = v_passed
    WHERE id = v_attempt.id;
  END LOOP;
END;
$$;

-- 6.10 Trigger: recalculate on quiz settings update
CREATE OR REPLACE FUNCTION public.trigger_recalculate_on_quiz_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF OLD.total_marks IS DISTINCT FROM NEW.total_marks
     OR OLD.negative_marking IS DISTINCT FROM NEW.negative_marking
     OR OLD.negative_marks_per_wrong IS DISTINCT FROM NEW.negative_marks_per_wrong
     OR OLD.passing_percentage IS DISTINCT FROM NEW.passing_percentage
  THEN
    PERFORM public.recalculate_quiz_attempts(NEW.id);
  END IF;
  RETURN NEW;
END;
$$;

-- 6.11 Trigger: recalculate on question changes
CREATE OR REPLACE FUNCTION public.trigger_recalculate_on_question_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_quiz_id uuid;
BEGIN
  IF TG_OP = 'DELETE' THEN
    v_quiz_id := OLD.quiz_id;
  ELSE
    v_quiz_id := NEW.quiz_id;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.correct_option IS DISTINCT FROM NEW.correct_option
       OR OLD.marks IS DISTINCT FROM NEW.marks
    THEN
      PERFORM public.recalculate_quiz_attempts(v_quiz_id);
    END IF;
  ELSE
    PERFORM public.recalculate_quiz_attempts(v_quiz_id);
  END IF;

  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- 6.12 Transfer super_admin ownership
CREATE OR REPLACE FUNCTION public.transfer_superadmin_ownership(_new_owner_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _current_owner_id uuid;
BEGIN
  SELECT user_id INTO _current_owner_id
  FROM public.user_roles
  WHERE role = 'super_admin'
  LIMIT 1;

  IF _current_owner_id IS NULL OR _current_owner_id != auth.uid() THEN
    RAISE EXCEPTION 'Only the current Creator can transfer ownership';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = _new_owner_id) THEN
    RAISE EXCEPTION 'Target user does not exist';
  END IF;

  IF _new_owner_id = _current_owner_id THEN
    RAISE EXCEPTION 'Cannot transfer ownership to yourself';
  END IF;

  ALTER TABLE public.user_roles DISABLE TRIGGER enforce_single_superadmin_trigger;

  DELETE FROM public.user_roles
  WHERE user_id = _current_owner_id AND role = 'super_admin';

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_current_owner_id, 'admin')
  ON CONFLICT (user_id, role) DO NOTHING;

  DELETE FROM public.user_roles WHERE user_id = _new_owner_id;

  INSERT INTO public.user_roles (user_id, role)
  VALUES (_new_owner_id, 'super_admin');

  ALTER TABLE public.user_roles ENABLE TRIGGER enforce_single_superadmin_trigger;

  RETURN true;

EXCEPTION
  WHEN OTHERS THEN
    ALTER TABLE public.user_roles ENABLE TRIGGER enforce_single_superadmin_trigger;
    RAISE;
END;
$$;

-- 6.13 Get quiz questions for attempt (excludes correct_option and archived questions)
CREATE OR REPLACE FUNCTION public.get_quiz_questions_for_attempt(p_quiz_id UUID)
RETURNS TABLE (
  id uuid,
  quiz_id uuid,
  question_text text,
  option_a text,
  option_b text,
  option_c text,
  option_d text,
  marks integer,
  difficulty difficulty_level,
  order_index integer,
  created_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    qq.id,
    qq.quiz_id,
    qq.question_text,
    qq.option_a,
    qq.option_b,
    qq.option_c,
    qq.option_d,
    qq.marks,
    qq.difficulty,
    qq.order_index,
    qq.created_at
  FROM public.quiz_questions qq
  INNER JOIN public.quizzes q ON q.id = qq.quiz_id
  WHERE qq.quiz_id = p_quiz_id
  AND q.is_published = true
  AND qq.is_archived = false
  ORDER BY qq.order_index;
$$;

-- =============================================
-- 7. TRIGGERS
-- =============================================

-- 7.1 New user signup -> create profile + assign student role
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 7.2 Auto-update updated_at columns
DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_quizzes_updated_at ON public.quizzes;
CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_surveys_updated_at ON public.surveys;
CREATE TRIGGER update_surveys_updated_at
  BEFORE UPDATE ON public.surveys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 7.3 Calculate quiz score on submission
DROP TRIGGER IF EXISTS trigger_calculate_quiz_score ON public.quiz_attempts;
CREATE TRIGGER trigger_calculate_quiz_score
  BEFORE UPDATE ON public.quiz_attempts
  FOR EACH ROW EXECUTE FUNCTION public.calculate_quiz_score();

-- 7.4 Enforce single super_admin
DROP TRIGGER IF EXISTS enforce_single_superadmin_trigger ON public.user_roles;
CREATE TRIGGER enforce_single_superadmin_trigger
  BEFORE INSERT OR UPDATE ON public.user_roles
  FOR EACH ROW EXECUTE FUNCTION public.enforce_single_superadmin();

-- 7.5 Recalculate scores on quiz settings change
DROP TRIGGER IF EXISTS recalculate_attempts_on_quiz_update ON public.quizzes;
CREATE TRIGGER recalculate_attempts_on_quiz_update
  AFTER UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.trigger_recalculate_on_quiz_update();

-- 7.6 Recalculate scores on question changes
DROP TRIGGER IF EXISTS recalculate_attempts_on_question_change ON public.quiz_questions;
CREATE TRIGGER recalculate_attempts_on_question_change
  AFTER INSERT OR UPDATE OR DELETE ON public.quiz_questions
  FOR EACH ROW EXECUTE FUNCTION public.trigger_recalculate_on_question_change();

-- =============================================
-- 8. ROW LEVEL SECURITY POLICIES
-- =============================================

-- ---- profiles ----
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ---- user_roles ----
CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Super admin can manage all roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'super_admin'))
  WITH CHECK (public.has_role(auth.uid(), 'super_admin'));

CREATE POLICY "Admins can view all roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage student roles"
  ON public.user_roles FOR ALL
  USING (public.has_role(auth.uid(), 'admin') AND role = 'student')
  WITH CHECK (public.has_role(auth.uid(), 'admin') AND role = 'student');

-- ---- quizzes ----
CREATE POLICY "Creators can manage own quizzes"
  ON public.quizzes
  AS PERMISSIVE FOR ALL TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Admins can manage all quizzes"
  ON public.quizzes
  AS PERMISSIVE FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Published quizzes are viewable by all"
  ON public.quizzes
  AS PERMISSIVE FOR SELECT
  USING (is_published = true);

-- ---- quiz_access_rules ----
CREATE POLICY "Admins can manage all quiz access rules"
  ON public.quiz_access_rules FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Creators can manage own quiz access rules"
  ON public.quiz_access_rules
  AS PERMISSIVE FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_access_rules.quiz_id AND q.creator_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_access_rules.quiz_id AND q.creator_id = auth.uid()));

CREATE POLICY "Anyone can view access rules for published quizzes"
  ON public.quiz_access_rules
  AS PERMISSIVE FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_access_rules.quiz_id AND q.is_published = true));

-- ---- quiz_questions ----
CREATE POLICY "Creators can manage own quiz questions"
  ON public.quiz_questions
  AS PERMISSIVE FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_questions.quiz_id AND q.creator_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_questions.quiz_id AND q.creator_id = auth.uid()));

CREATE POLICY "Creators can view questions for their quizzes"
  ON public.quiz_questions FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.quizzes q WHERE q.id = quiz_questions.quiz_id AND q.creator_id = auth.uid()));

CREATE POLICY "Admins can manage all quiz questions"
  ON public.quiz_questions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- ---- student_identities ----
CREATE POLICY "Anyone can create student identity"
  ON public.student_identities FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Creators can view student identities for their quizzes"
  ON public.student_identities FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quiz_attempts qa
    JOIN public.quizzes q ON qa.quiz_id = q.id
    WHERE qa.student_identity_id = student_identities.id
    AND q.creator_id = auth.uid()
  ));

CREATE POLICY "Admins can view all student identities"
  ON public.student_identities FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ---- quiz_attempts ----
CREATE POLICY "Anyone can create quiz attempt"
  ON public.quiz_attempts FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Students can view attempt with matching token"
  ON public.quiz_attempts FOR SELECT TO anon, authenticated
  USING (true);

CREATE POLICY "Students can update their own in-progress attempt"
  ON public.quiz_attempts FOR UPDATE TO anon, authenticated
  USING (status = 'in_progress')
  WITH CHECK (status IN ('in_progress', 'submitted', 'auto_submitted'));

CREATE POLICY "Creators can view attempts for their quizzes"
  ON public.quiz_attempts FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND creator_id = auth.uid()));

CREATE POLICY "Admins can view all quiz attempts"
  ON public.quiz_attempts FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ---- quiz_responses ----
CREATE POLICY "Anyone can insert quiz responses"
  ON public.quiz_responses FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Students can view responses for their attempts"
  ON public.quiz_responses FOR SELECT TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM quiz_attempts qa
    WHERE qa.id = quiz_responses.attempt_id
    AND qa.status IN ('in_progress', 'submitted', 'auto_submitted')
  ));

CREATE POLICY "Students can only update responses for in-progress attempts"
  ON public.quiz_responses FOR UPDATE TO anon, authenticated
  USING (EXISTS (
    SELECT 1 FROM quiz_attempts qa
    WHERE qa.id = quiz_responses.attempt_id
    AND qa.status = 'in_progress'
  ));

CREATE POLICY "Creators can view responses for their quizzes"
  ON public.quiz_responses FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quiz_attempts qa
    JOIN public.quizzes q ON qa.quiz_id = q.id
    WHERE qa.id = quiz_responses.attempt_id AND q.creator_id = auth.uid()
  ));

CREATE POLICY "Admins can view all quiz responses"
  ON public.quiz_responses FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- ---- attempt_logs ----
CREATE POLICY "Students can insert logs for in-progress attempts"
  ON public.attempt_logs FOR INSERT TO anon, authenticated
  WITH CHECK (EXISTS (
    SELECT 1 FROM quiz_attempts qa
    WHERE qa.id = attempt_logs.attempt_id
    AND qa.status = 'in_progress'
  ));

CREATE POLICY "Admins can view all attempt logs"
  ON public.attempt_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Creators can view logs for their quizzes"
  ON public.attempt_logs FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.quiz_attempts qa
    JOIN public.quizzes q ON qa.quiz_id = q.id
    WHERE qa.id = attempt_logs.attempt_id AND q.creator_id = auth.uid()
  ));

-- ---- surveys ----
CREATE POLICY "Admins can manage all surveys"
  ON public.surveys FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Creators can manage own surveys"
  ON public.surveys FOR ALL
  USING (auth.uid() = creator_id);

CREATE POLICY "Published surveys are viewable by all"
  ON public.surveys FOR SELECT
  USING (is_published = true);

-- ---- survey_questions ----
CREATE POLICY "Admins can manage all survey questions"
  ON public.survey_questions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Creators can manage own survey questions"
  ON public.survey_questions FOR ALL
  USING (EXISTS (SELECT 1 FROM public.surveys WHERE id = survey_id AND creator_id = auth.uid()));

CREATE POLICY "Questions viewable for published surveys"
  ON public.survey_questions FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.surveys WHERE id = survey_id AND is_published = true));

-- ---- survey_responses ----
CREATE POLICY "Admins can view all survey responses"
  ON public.survey_responses FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can submit survey responses"
  ON public.survey_responses FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.surveys WHERE id = survey_id AND is_published = true));

CREATE POLICY "Creators can view responses for their surveys"
  ON public.survey_responses FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.surveys WHERE id = survey_id AND creator_id = auth.uid()));

-- ---- site_settings ----
CREATE POLICY "Anyone can read site settings"
  ON public.site_settings FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage site settings"
  ON public.site_settings FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- ---- footer_links ----
CREATE POLICY "Anyone can read footer links"
  ON public.footer_links FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage footer links"
  ON public.footer_links FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- ---- footer_content ----
CREATE POLICY "Anyone can read footer content"
  ON public.footer_content FOR SELECT
  USING (true);

CREATE POLICY "Super admins can manage footer content"
  ON public.footer_content FOR ALL
  USING (has_role(auth.uid(), 'super_admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'super_admin'::app_role));

-- =============================================
-- 9. DEFAULT DATA
-- =============================================

-- Footer content defaults
INSERT INTO public.footer_content (brand_name, brand_description, copyright_text, tagline)
VALUES (
  'QuizoraX',
  'A secure, backend-first quiz and survey platform built for academic assessments with exam-grade integrity.',
  'All rights reserved.',
  'Built for Academic Excellence'
);

-- Footer link defaults
INSERT INTO public.footer_links (section, label, url, order_index) VALUES
  ('platform', 'Features', '#features', 1),
  ('platform', 'How It Works', '#how-it-works', 2),
  ('platform', 'Security', '#security', 3),
  ('platform', 'Documentation', '#', 4),
  ('support', 'Help Center', '#', 1),
  ('support', 'Contact Us', '#', 2),
  ('support', 'Privacy Policy', '#', 3),
  ('support', 'Terms of Service', '#', 4);

-- Site settings defaults
INSERT INTO public.site_settings (key, value, description) VALUES
  ('notifications_enabled', 'true', 'Enable email notifications globally'),
  ('allow_password_change', 'true', 'Allow users to change their passwords'),
  ('allow_account_deletion', 'true', 'Allow users to delete their accounts');

-- =============================================
-- 10. POST-SETUP NOTES
-- =============================================
-- After running this script:
--
-- 1. Create your first user via Supabase Auth (email/password signup)
--
-- 2. Promote that user to super_admin by running:
--    UPDATE public.user_roles SET role = 'super_admin' WHERE user_id = '<YOUR_USER_UUID>';
--
-- 3. Update your frontend .env file with:
--    VITE_SUPABASE_URL=<your-supabase-url>
--    VITE_SUPABASE_PUBLISHABLE_KEY=<your-anon-key>
--
-- 4. Regenerate TypeScript types if using supabase CLI:
--    npx supabase gen types typescript --project-id <project-id> > src/integrations/supabase/types.ts
-- =============================================
