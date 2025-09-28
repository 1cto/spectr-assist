-- Fix chat histories security: Add user_id column and proper RLS policies

-- Add user_id column to associate chats with authenticated users
ALTER TABLE public.n8n_chat_histories 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop the overly restrictive policy
DROP POLICY IF EXISTS "Restrict access to chat histories" ON public.n8n_chat_histories;

-- Create proper RLS policies for authenticated access
CREATE POLICY "Users can view their own chat history" 
ON public.n8n_chat_histories 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own chat messages" 
ON public.n8n_chat_histories 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own chat messages" 
ON public.n8n_chat_histories 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own chat messages" 
ON public.n8n_chat_histories 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);

-- Also fix the feature history table to have proper authentication
ALTER TABLE public.n8n_storymapper_feature_history 
ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- Drop overly restrictive policy for feature history
DROP POLICY IF EXISTS "Restrict access to feature history" ON public.n8n_storymapper_feature_history;

-- Create proper RLS policies for feature history
CREATE POLICY "Users can view their own feature history" 
ON public.n8n_storymapper_feature_history 
FOR SELECT 
TO authenticated 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own feature history" 
ON public.n8n_storymapper_feature_history 
FOR INSERT 
TO authenticated 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own feature history" 
ON public.n8n_storymapper_feature_history 
FOR UPDATE 
TO authenticated 
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own feature history" 
ON public.n8n_storymapper_feature_history 
FOR DELETE 
TO authenticated 
USING (auth.uid() = user_id);