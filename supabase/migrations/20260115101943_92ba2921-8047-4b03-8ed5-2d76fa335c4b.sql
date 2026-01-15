-- Add single_attempt column to quizzes table
ALTER TABLE public.quizzes 
ADD COLUMN single_attempt boolean NOT NULL DEFAULT true;

-- Add comment for clarity
COMMENT ON COLUMN public.quizzes.single_attempt IS 'When true, students can only attempt the quiz once';