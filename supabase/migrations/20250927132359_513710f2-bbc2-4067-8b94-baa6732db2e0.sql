-- Enable Row Level Security on all public tables
ALTER TABLE public."JiraNamesMapping" ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.features ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gherkin_best_practice ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gherkin_syntax ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_chat_histories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.n8n_storymapper_feature_history ENABLE ROW LEVEL SECURITY;

-- Create restrictive policies for sensitive employee data
CREATE POLICY "Restrict access to employee mapping data" 
ON public."JiraNamesMapping" 
FOR ALL 
TO authenticated 
USING (false) 
WITH CHECK (false);

-- Create restrictive policies for business chat histories  
CREATE POLICY "Restrict access to chat histories" 
ON public.n8n_chat_histories 
FOR ALL 
TO authenticated 
USING (false) 
WITH CHECK (false);

-- Create restrictive policies for feature history
CREATE POLICY "Restrict access to feature history" 
ON public.n8n_storymapper_feature_history 
FOR ALL 
TO authenticated 
USING (false) 
WITH CHECK (false);

-- Create read-only policies for reference data (documents, features, gherkin data)
-- These can be readable by authenticated users but not writable
CREATE POLICY "Allow authenticated read access to documents" 
ON public.documents 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated read access to features" 
ON public.features 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated read access to gherkin best practices" 
ON public.gherkin_best_practice 
FOR SELECT 
TO authenticated 
USING (true);

CREATE POLICY "Allow authenticated read access to gherkin syntax" 
ON public.gherkin_syntax 
FOR SELECT 
TO authenticated 
USING (true);

-- Prevent any modifications to reference data by default
CREATE POLICY "Restrict insert to documents" 
ON public.documents 
FOR INSERT 
TO authenticated 
WITH CHECK (false);

CREATE POLICY "Restrict update to documents" 
ON public.documents 
FOR UPDATE 
TO authenticated 
USING (false) 
WITH CHECK (false);

CREATE POLICY "Restrict delete to documents" 
ON public.documents 
FOR DELETE 
TO authenticated 
USING (false);

CREATE POLICY "Restrict insert to features" 
ON public.features 
FOR INSERT 
TO authenticated 
WITH CHECK (false);

CREATE POLICY "Restrict update to features" 
ON public.features 
FOR UPDATE 
TO authenticated 
USING (false) 
WITH CHECK (false);

CREATE POLICY "Restrict delete to features" 
ON public.features 
FOR DELETE 
TO authenticated 
USING (false);

CREATE POLICY "Restrict insert to gherkin best practices" 
ON public.gherkin_best_practice 
FOR INSERT 
TO authenticated 
WITH CHECK (false);

CREATE POLICY "Restrict update to gherkin best practices" 
ON public.gherkin_best_practice 
FOR UPDATE 
TO authenticated 
USING (false) 
WITH CHECK (false);

CREATE POLICY "Restrict delete to gherkin best practices" 
ON public.gherkin_best_practice 
FOR DELETE 
TO authenticated 
USING (false);

CREATE POLICY "Restrict insert to gherkin syntax" 
ON public.gherkin_syntax 
FOR INSERT 
TO authenticated 
WITH CHECK (false);

CREATE POLICY "Restrict update to gherkin syntax" 
ON public.gherkin_syntax 
FOR UPDATE 
TO authenticated 
USING (false) 
WITH CHECK (false);

CREATE POLICY "Restrict delete to gherkin syntax" 
ON public.gherkin_syntax 
FOR DELETE 
TO authenticated 
USING (false);