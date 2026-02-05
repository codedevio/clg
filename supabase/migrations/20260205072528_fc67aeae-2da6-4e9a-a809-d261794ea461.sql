-- Replace single_attempt boolean with max_attempts integer for flexible attempt limits
-- max_attempts: 1 = single attempt, 2+ = multiple attempts, NULL = unlimited

ALTER TABLE public.quizzes 
ADD COLUMN max_attempts integer DEFAULT 1;

-- Migrate existing data: single_attempt = true means max_attempts = 1, false means unlimited (NULL)
UPDATE public.quizzes 
SET max_attempts = CASE 
  WHEN single_attempt = true THEN 1 
  ELSE NULL 
END;

-- Drop the old column
ALTER TABLE public.quizzes DROP COLUMN single_attempt;

-- Add comment for clarity
COMMENT ON COLUMN public.quizzes.max_attempts IS 'Maximum number of attempts allowed per student. NULL means unlimited attempts.';