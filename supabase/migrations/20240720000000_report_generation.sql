-- Add report-related fields to appraisals table
ALTER TABLE IF EXISTS public.appraisals 
ADD COLUMN IF NOT EXISTS report_url TEXT,
ADD COLUMN IF NOT EXISTS report_generated_at TIMESTAMPTZ;

-- Create a trigger to update report_generated_at when report_url is updated
CREATE OR REPLACE FUNCTION public.update_report_generated_at()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.report_url IS NOT NULL AND (OLD.report_url IS NULL OR NEW.report_url != OLD.report_url) THEN
    NEW.report_generated_at := NOW();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_report_generated_at ON public.appraisals;
CREATE TRIGGER update_report_generated_at
BEFORE UPDATE ON public.appraisals
FOR EACH ROW
EXECUTE FUNCTION public.update_report_generated_at();

-- Create storage bucket for reports if it doesn't exist
-- Using DO block for anonymous code execution
DO $$
DECLARE
  bucket_id TEXT;
BEGIN
  -- Try to create the bucket
  SELECT id INTO bucket_id FROM storage.buckets WHERE name = 'reports';
  
  IF bucket_id IS NULL THEN
    -- Bucket doesn't exist, create it
    INSERT INTO storage.buckets (id, name, public, avif_autodetection, file_size_limit, allowed_mime_types)
    VALUES ('reports', 'reports', false, false, 50000000, NULL);
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    RAISE NOTICE 'Could not create reports bucket: %', SQLERRM;
END;
$$;

-- Create RLS policies for accessing reports
DROP POLICY IF EXISTS "Users can read their own reports" ON storage.objects;
CREATE POLICY "Users can read their own reports" 
ON storage.objects FOR SELECT 
USING (bucket_id = 'reports' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can upload their own reports" ON storage.objects;
CREATE POLICY "Users can upload their own reports" 
ON storage.objects FOR INSERT 
WITH CHECK (bucket_id = 'reports' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can update their own reports" ON storage.objects;
CREATE POLICY "Users can update their own reports" 
ON storage.objects FOR UPDATE
USING (bucket_id = 'reports' AND (storage.foldername(name))[1] = auth.uid()::text);

DROP POLICY IF EXISTS "Users can delete their own reports" ON storage.objects;
CREATE POLICY "Users can delete their own reports" 
ON storage.objects FOR DELETE
USING (bucket_id = 'reports' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Create index for fast lookups by report URL
CREATE INDEX IF NOT EXISTS appraisals_report_url_idx ON public.appraisals(report_url); 