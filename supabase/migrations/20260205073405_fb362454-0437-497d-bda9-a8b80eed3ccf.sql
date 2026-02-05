-- Update the get_quiz_questions_for_attempt function to exclude archived questions
CREATE OR REPLACE FUNCTION public.get_quiz_questions_for_attempt(p_quiz_id uuid)
 RETURNS TABLE(id uuid, quiz_id uuid, question_text text, option_a text, option_b text, option_c text, option_d text, marks integer, difficulty difficulty_level, order_index integer, created_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  AND qq.is_archived = false
  ORDER BY qq.order_index;
$function$;