-- Fix quiz sharing: ensure published quizzes can be opened without login by making quiz-related RLS policies PERMISSIVE

-- public.quizzes
DROP POLICY IF EXISTS "Creators can manage own quizzes" ON public.quizzes;
CREATE POLICY "Creators can manage own quizzes"
ON public.quizzes
AS PERMISSIVE
FOR ALL
TO authenticated
USING (auth.uid() = creator_id)
WITH CHECK (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Admins can manage all quizzes" ON public.quizzes;
CREATE POLICY "Admins can manage all quizzes"
ON public.quizzes
AS PERMISSIVE
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Published quizzes are viewable by all" ON public.quizzes;
CREATE POLICY "Published quizzes are viewable by all"
ON public.quizzes
AS PERMISSIVE
FOR SELECT
USING (is_published = true);


-- public.quiz_questions
DROP POLICY IF EXISTS "Creators can manage own quiz questions" ON public.quiz_questions;
CREATE POLICY "Creators can manage own quiz questions"
ON public.quiz_questions
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.quizzes q
    WHERE q.id = quiz_questions.quiz_id
      AND q.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.quizzes q
    WHERE q.id = quiz_questions.quiz_id
      AND q.creator_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Questions viewable during published quiz" ON public.quiz_questions;
CREATE POLICY "Questions viewable during published quiz"
ON public.quiz_questions
AS PERMISSIVE
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.quizzes q
    WHERE q.id = quiz_questions.quiz_id
      AND q.is_published = true
  )
);


-- public.quiz_access_rules
DROP POLICY IF EXISTS "Creators can manage own quiz access rules" ON public.quiz_access_rules;
CREATE POLICY "Creators can manage own quiz access rules"
ON public.quiz_access_rules
AS PERMISSIVE
FOR ALL
TO authenticated
USING (
  EXISTS (
    SELECT 1
    FROM public.quizzes q
    WHERE q.id = quiz_access_rules.quiz_id
      AND q.creator_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM public.quizzes q
    WHERE q.id = quiz_access_rules.quiz_id
      AND q.creator_id = auth.uid()
  )
);

DROP POLICY IF EXISTS "Anyone can view access rules for published quizzes" ON public.quiz_access_rules;
CREATE POLICY "Anyone can view access rules for published quizzes"
ON public.quiz_access_rules
AS PERMISSIVE
FOR SELECT
USING (
  EXISTS (
    SELECT 1
    FROM public.quizzes q
    WHERE q.id = quiz_access_rules.quiz_id
      AND q.is_published = true
  )
);
