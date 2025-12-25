-- Fix: Protect quiz answer keys from students
-- Create a public-facing view that excludes correct_option
-- Only creators can access the full table with correct_option

-- Step 1: Create a view without the correct_option column for students
CREATE OR REPLACE VIEW public.quiz_questions_public AS
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

-- Step 2: Enable RLS on the view (views inherit table RLS but we need explicit policy)
-- Note: Views in Supabase use the policies of the underlying table when SECURITY INVOKER (default)
-- We need to revoke direct access to quiz_questions for anonymous users
-- and only allow access through the view

-- Step 3: Drop the overly permissive SELECT policy that exposes correct_option
DROP POLICY IF EXISTS "Questions viewable during published quiz" ON public.quiz_questions;

-- Step 4: Create a new policy that only allows creators to see full question data (including correct_option)
-- This is for quiz creation/editing
CREATE POLICY "Creators can view questions for their quizzes"
ON public.quiz_questions
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.quizzes q
    WHERE q.id = quiz_questions.quiz_id
    AND q.creator_id = auth.uid()
  )
);

-- Step 5: Grant SELECT on the view to both anon and authenticated users
-- The view doesn't include correct_option, so it's safe
GRANT SELECT ON public.quiz_questions_public TO anon, authenticated;

-- Step 6: Create an RLS-like function to control view access
-- Since views don't support RLS directly, we create a security definer function
CREATE OR REPLACE FUNCTION public.get_quiz_questions_for_attempt(p_quiz_id uuid)
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
  ORDER BY qq.order_index;
$$;