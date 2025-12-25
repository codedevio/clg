-- Fix the security definer view warning
-- Change view to explicitly use SECURITY INVOKER (the safe option)
-- This ensures the view respects the caller's permissions

-- Recreate view with explicit SECURITY INVOKER
DROP VIEW IF EXISTS public.quiz_questions_public;

CREATE VIEW public.quiz_questions_public
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

-- Grant SELECT on the view
GRANT SELECT ON public.quiz_questions_public TO anon, authenticated;