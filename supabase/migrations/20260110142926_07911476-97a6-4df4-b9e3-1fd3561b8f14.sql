
-- Function to recalculate all submitted attempts for a quiz
CREATE OR REPLACE FUNCTION public.recalculate_quiz_attempts(p_quiz_id uuid)
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
  -- Get quiz settings
  SELECT total_marks, negative_marking, COALESCE(negative_marks_per_wrong, 0) as neg_marks, passing_percentage
  INTO v_quiz
  FROM quizzes WHERE id = p_quiz_id;
  
  IF v_quiz IS NULL THEN
    RETURN;
  END IF;
  
  -- Get total questions count
  SELECT COUNT(*) INTO v_total_questions
  FROM quiz_questions WHERE quiz_id = p_quiz_id;
  
  -- Loop through all submitted attempts for this quiz
  FOR v_attempt IN 
    SELECT id FROM quiz_attempts 
    WHERE quiz_id = p_quiz_id 
    AND status IN ('submitted', 'auto_submitted')
  LOOP
    v_correct_count := 0;
    v_wrong_count := 0;
    v_unanswered_count := 0;
    v_total_score := 0;
    
    -- Evaluate each response
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
    
    -- Ensure score doesn't go below 0
    IF v_total_score < 0 THEN
      v_total_score := 0;
    END IF;
    
    -- Calculate percentage
    IF v_quiz.total_marks > 0 THEN
      v_percentage := (v_total_score / v_quiz.total_marks) * 100;
    ELSE
      v_percentage := 0;
    END IF;
    
    -- Determine pass/fail based on quiz passing_percentage
    v_passed := v_percentage >= v_quiz.passing_percentage;
    
    -- Update the attempt with recalculated values
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

-- Trigger function for quiz updates
CREATE OR REPLACE FUNCTION public.trigger_recalculate_on_quiz_update()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only recalculate if relevant fields changed
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

-- Trigger function for quiz question updates
CREATE OR REPLACE FUNCTION public.trigger_recalculate_on_question_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_quiz_id uuid;
BEGIN
  -- Determine the quiz_id based on operation
  IF TG_OP = 'DELETE' THEN
    v_quiz_id := OLD.quiz_id;
  ELSE
    v_quiz_id := NEW.quiz_id;
  END IF;
  
  -- For UPDATE, only recalculate if relevant fields changed
  IF TG_OP = 'UPDATE' THEN
    IF OLD.correct_option IS DISTINCT FROM NEW.correct_option
       OR OLD.marks IS DISTINCT FROM NEW.marks
    THEN
      PERFORM public.recalculate_quiz_attempts(v_quiz_id);
    END IF;
  ELSE
    -- For INSERT or DELETE, always recalculate
    PERFORM public.recalculate_quiz_attempts(v_quiz_id);
  END IF;
  
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$;

-- Create trigger on quizzes table
DROP TRIGGER IF EXISTS recalculate_attempts_on_quiz_update ON quizzes;
CREATE TRIGGER recalculate_attempts_on_quiz_update
  AFTER UPDATE ON quizzes
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalculate_on_quiz_update();

-- Create trigger on quiz_questions table
DROP TRIGGER IF EXISTS recalculate_attempts_on_question_change ON quiz_questions;
CREATE TRIGGER recalculate_attempts_on_question_change
  AFTER INSERT OR UPDATE OR DELETE ON quiz_questions
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_recalculate_on_question_change();
