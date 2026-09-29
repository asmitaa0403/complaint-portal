
-- Create comments table for public discussion on complaints
CREATE TABLE public.complaint_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  complaint_id uuid NOT NULL REFERENCES public.complaints(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT 'Anonymous Student',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Validate content length
CREATE OR REPLACE FUNCTION public.validate_comment_content()
RETURNS trigger
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  IF length(NEW.content) < 1 OR length(NEW.content) > 1000 THEN
    RAISE EXCEPTION 'Comment must be between 1 and 1000 characters';
  END IF;
  IF length(NEW.author_name) < 1 OR length(NEW.author_name) > 50 THEN
    RAISE EXCEPTION 'Author name must be between 1 and 50 characters';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER validate_comment_before_insert
  BEFORE INSERT ON public.complaint_comments
  FOR EACH ROW EXECUTE FUNCTION public.validate_comment_content();

ALTER TABLE public.complaint_comments ENABLE ROW LEVEL SECURITY;

-- Anyone can read comments
CREATE POLICY "Anyone can read comments"
ON public.complaint_comments FOR SELECT TO anon, authenticated
USING (true);

-- Anyone can post comments
CREATE POLICY "Anyone can post comments"
ON public.complaint_comments FOR INSERT TO anon, authenticated
WITH CHECK (true);

-- Admins can delete comments
CREATE POLICY "Admins can delete comments"
ON public.complaint_comments FOR DELETE TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));
