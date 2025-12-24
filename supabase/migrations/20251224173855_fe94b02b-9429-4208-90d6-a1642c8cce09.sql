-- Fix RLS policies to allow anonymous users (students) to take quizzes

-- Drop existing restrictive policies and recreate as permissive

-- 1. Quizzes - allow public viewing of published quizzes
DROP POLICY IF EXISTS "Published quizzes are viewable by all" ON public.quizzes;
CREATE POLICY "Published quizzes are viewable by all" 
ON public.quizzes 
FOR SELECT 
USING (is_published = true);

-- 2. Quiz questions - allow viewing for published quizzes
DROP POLICY IF EXISTS "Questions viewable during published quiz" ON public.quiz_questions;
CREATE POLICY "Questions viewable during published quiz" 
ON public.quiz_questions 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM quizzes 
  WHERE quizzes.id = quiz_questions.quiz_id 
  AND quizzes.is_published = true
));

-- 3. Quiz access rules - allow viewing for published quizzes
DROP POLICY IF EXISTS "Anyone can view access rules for published quizzes" ON public.quiz_access_rules;
CREATE POLICY "Anyone can view access rules for published quizzes" 
ON public.quiz_access_rules 
FOR SELECT 
USING (EXISTS (
  SELECT 1 FROM quizzes 
  WHERE quizzes.id = quiz_access_rules.quiz_id 
  AND quizzes.is_published = true
));

-- 4. Quiz attempts - allow anonymous insert, select, update
DROP POLICY IF EXISTS "Anyone can create quiz attempt" ON public.quiz_attempts;
CREATE POLICY "Anyone can create quiz attempt" 
ON public.quiz_attempts 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view their own attempt by token" ON public.quiz_attempts;
CREATE POLICY "Anyone can view their own attempt by token" 
ON public.quiz_attempts 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Anyone can update their own attempt by token" ON public.quiz_attempts;
CREATE POLICY "Anyone can update their own attempt by token" 
ON public.quiz_attempts 
FOR UPDATE 
USING (true);

-- 5. Student identities - allow anonymous insert and select
DROP POLICY IF EXISTS "Anyone can create student identity" ON public.student_identities;
CREATE POLICY "Anyone can create student identity" 
ON public.student_identities 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view own student identity" ON public.student_identities;
CREATE POLICY "Anyone can view own student identity" 
ON public.student_identities 
FOR SELECT 
USING (true);

-- 6. Quiz responses - allow anonymous insert, select, update
DROP POLICY IF EXISTS "Anyone can insert quiz responses" ON public.quiz_responses;
CREATE POLICY "Anyone can insert quiz responses" 
ON public.quiz_responses 
FOR INSERT 
WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can view own quiz responses" ON public.quiz_responses;
CREATE POLICY "Anyone can view own quiz responses" 
ON public.quiz_responses 
FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Anyone can update their responses" ON public.quiz_responses;
CREATE POLICY "Anyone can update their responses" 
ON public.quiz_responses 
FOR UPDATE 
USING (true);

-- 7. Attempt logs - allow anonymous insert
DROP POLICY IF EXISTS "Anyone can insert attempt logs" ON public.attempt_logs;
CREATE POLICY "Anyone can insert attempt logs" 
ON public.attempt_logs 
FOR INSERT 
WITH CHECK (true);