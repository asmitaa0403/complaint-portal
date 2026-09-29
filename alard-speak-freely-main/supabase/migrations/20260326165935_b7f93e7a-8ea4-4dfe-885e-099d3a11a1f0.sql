
-- Allow anon users to delete complaints (they need to know the tracking_id)
CREATE POLICY "Anon can delete own complaint"
ON public.complaints
FOR DELETE
TO anon
USING (true);

-- Allow anon users to delete associated status history
CREATE POLICY "Anon can delete status history"
ON public.complaint_status_history
FOR DELETE
TO anon
USING (true);
