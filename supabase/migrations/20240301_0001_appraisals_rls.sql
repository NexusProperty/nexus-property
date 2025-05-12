-- Create profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  role text NOT NULL,
  name text,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create appraisals table
CREATE TABLE IF NOT EXISTS appraisals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id uuid NOT NULL,
  agent_id uuid,
  property_address text NOT NULL,
  property_details jsonb,
  status text NOT NULL DEFAULT 'draft',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT fk_customer FOREIGN KEY (customer_id) REFERENCES profiles(id),
  CONSTRAINT fk_agent FOREIGN KEY (agent_id) REFERENCES profiles(id)
);

-- Enable Row Level Security for appraisals table
ALTER TABLE appraisals ENABLE ROW LEVEL SECURITY;

-- Create policies for appraisals table

-- 1. Customers can view their own appraisals
CREATE POLICY "Customers can view their own appraisals"
ON appraisals
FOR SELECT
USING (customer_id = auth.uid());

-- 2. Customers can create appraisals
CREATE POLICY "Customers can create appraisals"
ON appraisals
FOR INSERT
WITH CHECK (customer_id = auth.uid());

-- 3. Customers can update their own appraisals (but only certain fields)
CREATE POLICY "Customers can update their own appraisals"
ON appraisals
FOR UPDATE
USING (customer_id = auth.uid())
WITH CHECK (customer_id = auth.uid());

-- 4. Agents can view appraisals they've claimed
CREATE POLICY "Agents can view appraisals they've claimed"
ON appraisals
FOR SELECT
USING (agent_id = auth.uid());

-- 5. Agents can view published appraisals (for the feed)
CREATE POLICY "Agents can view published appraisals"
ON appraisals
FOR SELECT
USING (
  status = 'published' AND
  agent_id IS NULL AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'agent'
  )
);

-- 6. Agents can claim published appraisals
CREATE POLICY "Agents can claim published appraisals"
ON appraisals
FOR UPDATE
USING (
  status = 'published' AND
  agent_id IS NULL AND
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'agent'
  )
)
WITH CHECK (
  agent_id = auth.uid() AND
  status = 'claimed'
);

-- 7. Agents can update appraisals they've claimed
CREATE POLICY "Agents can update appraisals they've claimed"
ON appraisals
FOR UPDATE
USING (agent_id = auth.uid());

-- 8. Admins can view all appraisals
CREATE POLICY "Admins can view all appraisals"
ON appraisals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 9. Admins can update all appraisals
CREATE POLICY "Admins can update all appraisals"
ON appraisals
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 10. Admins can delete appraisals
CREATE POLICY "Admins can delete appraisals"
ON appraisals
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM profiles
    WHERE id = auth.uid() AND role = 'admin'
  )
); 