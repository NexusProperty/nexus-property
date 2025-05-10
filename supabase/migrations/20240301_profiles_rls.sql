-- Enable Row Level Security for profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policies for profiles table

-- 1. Users can view their own profile
CREATE POLICY "Users can view their own profile"
ON profiles
FOR SELECT
USING (id = auth.uid());

-- 2. Users can update their own profile
CREATE POLICY "Users can update their own profile"
ON profiles
FOR UPDATE
USING (id = auth.uid());

-- 3. Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 4. Admins can update all profiles
CREATE POLICY "Admins can update all profiles"
ON profiles
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 5. Admins can delete profiles
CREATE POLICY "Admins can delete profiles"
ON profiles
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 6. Allow profile creation during signup
CREATE POLICY "Allow profile creation during signup"
ON profiles
FOR INSERT
WITH CHECK (id = auth.uid()); 