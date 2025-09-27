-- Fix function search path security issues by setting search_path for existing functions
ALTER FUNCTION public.match_features(vector, integer, jsonb) SET search_path = public;
ALTER FUNCTION public.match_documents(vector, integer, jsonb) SET search_path = public;
ALTER FUNCTION public.match_gherkin_syntax(vector, integer, jsonb) SET search_path = public;
ALTER FUNCTION public.match_gherkin_best_practices(vector, integer, jsonb) SET search_path = public;