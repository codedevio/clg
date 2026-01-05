-- Add passing percentage and position thresholds to quizzes table
ALTER TABLE public.quizzes 
ADD COLUMN passing_percentage numeric NOT NULL DEFAULT 40,
ADD COLUMN first_position_min numeric NOT NULL DEFAULT 90,
ADD COLUMN second_position_min numeric NOT NULL DEFAULT 75,
ADD COLUMN third_position_min numeric NOT NULL DEFAULT 60;