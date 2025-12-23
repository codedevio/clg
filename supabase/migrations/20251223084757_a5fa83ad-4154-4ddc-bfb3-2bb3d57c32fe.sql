-- Create function to calculate quiz scores when attempt is submitted
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
  -- Only calculate when status changes to 'submitted' or 'auto_submitted'
  IF NEW.status IN ('submitted', 'auto_submitted') AND 
     (OLD.status IS NULL OR OLD.status = 'in_progress') THEN
    
    v_quiz_id := NEW.quiz_id;
    
    -- Get quiz settings
    SELECT total_marks, negative_marking, COALESCE(negative_marks_per_wrong, 0)
    INTO v_total_marks, v_negative_marking, v_negative_marks
    FROM quizzes WHERE id = v_quiz_id;
    
    -- Get total questions count
    SELECT COUNT(*) INTO v_total_questions
    FROM quiz_questions WHERE quiz_id = v_quiz_id;
    
    -- Evaluate each response and update quiz_responses
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
        -- Unanswered
        v_unanswered_count := v_unanswered_count + 1;
      ELSIF r.selected_option = r.correct_option THEN
        -- Correct answer
        v_correct_count := v_correct_count + 1;
        v_total_score := v_total_score + r.marks;
        
        -- Update response record
        IF r.response_id IS NOT NULL THEN
          UPDATE quiz_responses 
          SET is_correct = true, marks_awarded = r.marks
          WHERE id = r.response_id;
        END IF;
      ELSE
        -- Wrong answer
        v_wrong_count := v_wrong_count + 1;
        
        -- Apply negative marking if enabled
        IF v_negative_marking THEN
          v_total_score := v_total_score - v_negative_marks;
        END IF;
        
        -- Update response record
        IF r.response_id IS NOT NULL THEN
          UPDATE quiz_responses 
          SET is_correct = false, marks_awarded = CASE WHEN v_negative_marking THEN -v_negative_marks ELSE 0 END
          WHERE id = r.response_id;
        END IF;
      END IF;
    END LOOP;
    
    -- Ensure score doesn't go below 0
    IF v_total_score < 0 THEN
      v_total_score := 0;
    END IF;
    
    -- Calculate percentage
    IF v_total_marks > 0 THEN
      v_percentage := (v_total_score / v_total_marks) * 100;
    ELSE
      v_percentage := 0;
    END IF;
    
    -- Determine pass/fail (40% passing threshold)
    v_passed := v_percentage >= 40;
    
    -- Update the attempt with calculated values
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

-- Create trigger on quiz_attempts
DROP TRIGGER IF EXISTS trigger_calculate_quiz_score ON quiz_attempts;
CREATE TRIGGER trigger_calculate_quiz_score
  BEFORE UPDATE ON quiz_attempts
  FOR EACH ROW
  EXECUTE FUNCTION public.calculate_quiz_score();