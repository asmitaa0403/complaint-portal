
-- Allow admins to delete complaints
CREATE POLICY "Admins can delete complaints"
ON public.complaints
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Allow admins to delete complaint status history
CREATE POLICY "Admins can delete status history"
ON public.complaint_status_history
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'admin') OR has_role(auth.uid(), 'moderator'));

-- Allow anon to insert status history (for initial submission)
CREATE POLICY "Anon can insert initial status history"
ON public.complaint_status_history
FOR INSERT
TO anon
WITH CHECK (true);
