-- Create property_access table to manage access to properties
CREATE TABLE IF NOT EXISTS public.property_access (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  property_id UUID NOT NULL REFERENCES public.properties(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  access_level TEXT NOT NULL CHECK (access_level IN ('viewer', 'editor', 'admin')),
  granted_by UUID NOT NULL REFERENCES public.profiles(id),
  UNIQUE (property_id, user_id)
);

-- Add a trigger to update the updated_at column
CREATE TRIGGER set_property_access_updated_at
BEFORE UPDATE ON public.property_access
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for faster lookups
CREATE INDEX property_access_property_id_idx ON public.property_access(property_id);
CREATE INDEX property_access_user_id_idx ON public.property_access(user_id);

-- Enable RLS for property_access table
ALTER TABLE public.property_access ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for property_access

-- Policy: Users can see their own access entries
CREATE POLICY "Users can view their own access entries"
  ON public.property_access
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Property owners can see all access entries for their properties 
CREATE POLICY "Property owners can view all access entries for their properties"
  ON public.property_access
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_access.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Policy: Admin users can see all access entries for properties they have admin access to
CREATE POLICY "Admins can view all access entries for properties they admin"
  ON public.property_access
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.property_access pa
      WHERE pa.property_id = property_access.property_id
      AND pa.user_id = auth.uid()
      AND pa.access_level = 'admin'
    )
  );

-- Policy: Property owners can insert access entries for their properties
CREATE POLICY "Property owners can grant access to their properties"
  ON public.property_access
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_access.property_id
      AND properties.owner_id = auth.uid()
    )
    AND auth.uid() = granted_by
  );

-- Policy: Admin users can insert access entries for properties they have admin access to
CREATE POLICY "Admins can grant access to properties they admin"
  ON public.property_access
  FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.property_access pa
      WHERE pa.property_id = property_access.property_id
      AND pa.user_id = auth.uid()
      AND pa.access_level = 'admin'
    )
    AND auth.uid() = granted_by
  );

-- Policy: Property owners can delete access entries for their properties
CREATE POLICY "Property owners can remove access to their properties"
  ON public.property_access
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.properties
      WHERE properties.id = property_access.property_id
      AND properties.owner_id = auth.uid()
    )
  );

-- Policy: Admin users can delete access entries for properties they have admin access to
CREATE POLICY "Admins can remove access to properties they admin"
  ON public.property_access
  FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.property_access pa
      WHERE pa.property_id = property_access.property_id
      AND pa.user_id = auth.uid()
      AND pa.access_level = 'admin'
    )
  );

-- Create a function to get all properties for a team
CREATE OR REPLACE FUNCTION public.get_team_properties(team_id UUID)
RETURNS SETOF public.properties
LANGUAGE SQL
SECURITY DEFINER
SET search_path = public
AS $$
  -- Get properties owned by members of the team
  SELECT p.* FROM public.properties p
  JOIN public.team_members tm ON p.owner_id = tm.user_id
  WHERE tm.team_id = $1
  UNION
  -- Get properties explicitly shared with the team (could be implemented via a team_property_access table)
  SELECT p.* FROM public.properties p
  WHERE p.team_id = $1;
$$; 