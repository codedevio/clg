-- Add soft delete columns to quizzes table
ALTER TABLE public.quizzes 
ADD COLUMN is_archived boolean NOT NULL DEFAULT false,
ADD COLUMN archived_at timestamp with time zone;

-- Add soft delete columns to quiz_questions table
ALTER TABLE public.quiz_questions 
ADD COLUMN is_archived boolean NOT NULL DEFAULT false,
ADD COLUMN archived_at timestamp with time zone;

-- Create index for faster filtering of active quizzes
CREATE INDEX idx_quizzes_is_archived ON public.quizzes(is_archived) WHERE is_archived = false;

-- Create index for faster filtering of active questions
CREATE INDEX idx_quiz_questions_is_archived ON public.quiz_questions(is_archived) WHERE is_archived = false;