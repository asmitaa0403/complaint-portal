
-- Make the anon insert policy more restrictive
DROP POLICY "Anon can insert initial status history" ON public.complaint_status_history;

CREATE POLICY "Anon can insert initial status history"
ON public.complaint_status_history
FOR INSERT
TO anon
WITH CHECK (status = 'received' AND note IS NULL AND changed_by IS NULL);
