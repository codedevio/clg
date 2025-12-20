-- =============================================
-- QuizoraX Database Schema
-- =============================================

-- 1. Create app_role enum for role-based access
CREATE TYPE public.app_role AS ENUM ('admin', 'creator', 'student');

-- 2. Create profiles table for user information
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 3. Create user_roles table (CRITICAL: roles in separate table for security)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role app_role NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. Create security definer function to check roles (prevents RLS recursion)
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
      AND role = _role
  )
$$;

-- 5. Create quizzes table
CREATE TABLE public.quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  time_limit_minutes INTEGER NOT NULL DEFAULT 30,
  total_marks INTEGER NOT NULL DEFAULT 100,
  negative_marking BOOLEAN NOT NULL DEFAULT false,
  negative_marks_per_wrong NUMERIC(4,2) DEFAULT 0,
  shuffle_questions BOOLEAN NOT NULL DEFAULT true,
  show_results_to_students BOOLEAN NOT NULL DEFAULT false,
  is_published BOOLEAN NOT NULL DEFAULT false,
  starts_at TIMESTAMPTZ,
  ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quizzes ENABLE ROW LEVEL SECURITY;

-- 6. Create quiz_access_rules table
CREATE TYPE public.access_type AS ENUM ('public', 'password', 'batch');

CREATE TABLE public.quiz_access_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  access_type access_type NOT NULL DEFAULT 'public',
  password_hash TEXT,
  allowed_batches TEXT[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_access_rules ENABLE ROW LEVEL SECURITY;

-- 7. Create quiz_questions table
CREATE TYPE public.difficulty_level AS ENUM ('easy', 'medium', 'hard');

CREATE TABLE public.quiz_questions (
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
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;

-- 8. Create student_identities table (for quiz attempts)
CREATE TABLE public.student_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name TEXT NOT NULL,
  college_id TEXT NOT NULL,
  roll_number TEXT NOT NULL,
  batch TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.student_identities ENABLE ROW LEVEL SECURITY;

-- 9. Create quiz_attempts table
CREATE TYPE public.attempt_status AS ENUM ('in_progress', 'submitted', 'auto_submitted', 'abandoned');

CREATE TABLE public.quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  quiz_id UUID NOT NULL REFERENCES public.quizzes(id) ON DELETE CASCADE,
  student_identity_id UUID NOT NULL REFERENCES public.student_identities(id) ON DELETE CASCADE,
  attempt_token TEXT UNIQUE NOT NULL DEFAULT gen_random_uuid()::text,
  status attempt_status NOT NULL DEFAULT 'in_progress',
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  submitted_at TIMESTAMPTZ,
  time_spent_seconds INTEGER,
  score NUMERIC(6,2),
  total_marks INTEGER,
  correct_count INTEGER,
  wrong_count INTEGER,
  unanswered_count INTEGER,
  percentage NUMERIC(5,2),
  passed BOOLEAN,
  tab_switch_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Unique constraint: one attempt per college_id per quiz
CREATE UNIQUE INDEX unique_student_quiz_attempt ON public.quiz_attempts(quiz_id, student_identity_id);

-- 10. Create quiz_responses table
CREATE TABLE public.quiz_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES public.quiz_questions(id) ON DELETE CASCADE,
  selected_option CHAR(1) CHECK (selected_option IN ('A', 'B', 'C', 'D')),
  is_correct BOOLEAN,
  marks_awarded NUMERIC(4,2) DEFAULT 0,
  answered_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(attempt_id, question_id)
);

ALTER TABLE public.quiz_responses ENABLE ROW LEVEL SECURITY;

-- 11. Create attempt_logs table (for anti-cheat)
CREATE TABLE public.attempt_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attempt_id UUID NOT NULL REFERENCES public.quiz_attempts(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL,
  event_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.attempt_logs ENABLE ROW LEVEL SECURITY;

-- 12. Create surveys table
CREATE TABLE public.surveys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  is_published BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.surveys ENABLE ROW LEVEL SECURITY;

-- 13. Create survey_questions table
CREATE TYPE public.survey_question_type AS ENUM ('short_text', 'long_text', 'dropdown', 'checkbox');

CREATE TABLE public.survey_questions (
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

-- 14. Create survey_responses table
CREATE TABLE public.survey_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  survey_id UUID NOT NULL REFERENCES public.surveys(id) ON DELETE CASCADE,
  respondent_name TEXT,
  respondent_email TEXT,
  responses JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.survey_responses ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies
-- =============================================

-- Profiles policies
CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

-- User roles policies
CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- Quizzes policies
CREATE POLICY "Creators can manage own quizzes" ON public.quizzes
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Admins can manage all quizzes" ON public.quizzes
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Published quizzes are viewable by all" ON public.quizzes
  FOR SELECT USING (is_published = true);

-- Quiz access rules policies
CREATE POLICY "Creators can manage own quiz access rules" ON public.quiz_access_rules
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND creator_id = auth.uid())
  );

CREATE POLICY "Anyone can view access rules for published quizzes" ON public.quiz_access_rules
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND is_published = true)
  );

-- Quiz questions policies
CREATE POLICY "Creators can manage own quiz questions" ON public.quiz_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND creator_id = auth.uid())
  );

CREATE POLICY "Questions viewable during published quiz" ON public.quiz_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND is_published = true)
  );

-- Student identities policies (allow insert for quiz attempts)
CREATE POLICY "Anyone can create student identity" ON public.student_identities
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Creators can view student identities for their quizzes" ON public.student_identities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts qa
      JOIN public.quizzes q ON qa.quiz_id = q.id
      WHERE qa.student_identity_id = student_identities.id
      AND q.creator_id = auth.uid()
    )
  );

-- Quiz attempts policies
CREATE POLICY "Anyone can create quiz attempt" ON public.quiz_attempts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update their own attempt by token" ON public.quiz_attempts
  FOR UPDATE USING (true);

CREATE POLICY "Anyone can view their own attempt by token" ON public.quiz_attempts
  FOR SELECT USING (true);

CREATE POLICY "Creators can view attempts for their quizzes" ON public.quiz_attempts
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.quizzes WHERE id = quiz_id AND creator_id = auth.uid())
  );

-- Quiz responses policies
CREATE POLICY "Anyone can insert quiz responses" ON public.quiz_responses
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Anyone can update their responses" ON public.quiz_responses
  FOR UPDATE USING (true);

CREATE POLICY "Creators can view responses for their quizzes" ON public.quiz_responses
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts qa
      JOIN public.quizzes q ON qa.quiz_id = q.id
      WHERE qa.id = attempt_id AND q.creator_id = auth.uid()
    )
  );

-- Attempt logs policies
CREATE POLICY "Anyone can insert attempt logs" ON public.attempt_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Creators can view logs for their quizzes" ON public.attempt_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.quiz_attempts qa
      JOIN public.quizzes q ON qa.quiz_id = q.id
      WHERE qa.id = attempt_id AND q.creator_id = auth.uid()
    )
  );

-- Surveys policies
CREATE POLICY "Creators can manage own surveys" ON public.surveys
  FOR ALL USING (auth.uid() = creator_id);

CREATE POLICY "Published surveys are viewable by all" ON public.surveys
  FOR SELECT USING (is_published = true);

-- Survey questions policies
CREATE POLICY "Creators can manage own survey questions" ON public.survey_questions
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.surveys WHERE id = survey_id AND creator_id = auth.uid())
  );

CREATE POLICY "Questions viewable for published surveys" ON public.survey_questions
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.surveys WHERE id = survey_id AND is_published = true)
  );

-- Survey responses policies
CREATE POLICY "Anyone can submit survey responses" ON public.survey_responses
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.surveys WHERE id = survey_id AND is_published = true)
  );

CREATE POLICY "Creators can view responses for their surveys" ON public.survey_responses
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.surveys WHERE id = survey_id AND creator_id = auth.uid())
  );

-- =============================================
-- Functions and Triggers
-- =============================================

-- Function to handle new user signup
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
  
  -- Assign default 'creator' role to new users
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'creator');
  
  RETURN NEW;
END;
$$;

-- Trigger for new user signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_quizzes_updated_at
  BEFORE UPDATE ON public.quizzes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_surveys_updated_at
  BEFORE UPDATE ON public.surveys
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to get user role
CREATE OR REPLACE FUNCTION public.get_user_role(_user_id UUID)
RETURNS app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = _user_id LIMIT 1
$$;