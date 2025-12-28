-- Add admin policy to quiz_responses so admins can view all responses
CREATE POLICY "Admins can view all quiz responses"
ON public.quiz_responses
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin policy to quiz_attempts so admins can view all attempts
CREATE POLICY "Admins can view all quiz attempts"
ON public.quiz_attempts
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin policy to student_identities so admins can view all student info
CREATE POLICY "Admins can view all student identities"
ON public.student_identities
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Add admin policy to quiz_questions so admins can view all questions (including correct answers)
CREATE POLICY "Admins can view all quiz questions"
ON public.quiz_questions
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));