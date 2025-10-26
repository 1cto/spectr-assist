-- Create table to track user Jira connection requests
CREATE TABLE IF NOT EXISTS public.user_jira_connections (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  connected_at timestamp with time zone DEFAULT now() NOT NULL,
  UNIQUE(user_id)
);

-- Enable RLS
ALTER TABLE public.user_jira_connections ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own connection status
CREATE POLICY "Users can view their own Jira connection status"
  ON public.user_jira_connections
  FOR SELECT
  USING (auth.uid() = user_id);

-- Policy: Users can insert their own connection record
CREATE POLICY "Users can insert their own Jira connection"
  ON public.user_jira_connections
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_user_jira_connections_user_id ON public.user_jira_connections(user_id);