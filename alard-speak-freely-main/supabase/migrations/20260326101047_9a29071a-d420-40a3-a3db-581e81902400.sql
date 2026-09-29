-- Tighten the anonymous insert policy to require non-empty fields
DROP POLICY "Anyone can submit complaints" ON public.complaints;
CREATE POLICY "Anyone can submit complaints with valid data"
  ON public.complaints FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(title) > 0 AND length(title) <= 150
    AND length(description) > 0 AND length(description) <= 5000
    AND length(tracking_id) > 0
  );