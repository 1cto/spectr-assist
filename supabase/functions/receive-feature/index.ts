import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Only accept POST requests
    if (req.method !== 'POST') {
      return new Response(
        JSON.stringify({ error: 'Method not allowed' }), 
        { 
          status: 405, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Parse the incoming feature text
    const featureData = await req.json();
    
    console.log('Received feature:', featureData);

    // Extract sessionId for targeted broadcasting
    const sessionId = featureData.sessionId;
    if (!sessionId) {
      throw new Error('sessionId is required for feature updates');
    }

    // Broadcast the feature to session-specific channel via Supabase Realtime
    const channel = supabase.channel(`feature-updates-${sessionId}`);
    
    // Subscribe and wait for the channel to be ready
    await new Promise((resolve, reject) => {
      const timeout = setTimeout(() => reject(new Error('Channel subscription timeout')), 5000);
      
      channel.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          clearTimeout(timeout);
          resolve(null);
        }
      });
    });
    
    console.log('Channel subscribed, sending broadcast...');
    
    // Send the feature to session-specific subscribers
    await channel.send({
      type: 'broadcast',
      event: 'feature-update',
      payload: {
        timestamp: new Date().toISOString(),
        sessionId,
        ...featureData
      }
    });

    console.log('Feature broadcasted successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Feature received and broadcasted',
        receivedAt: new Date().toISOString()
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in receive-feature function:', error);
    
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error', 
        details: error instanceof Error ? error.message : 'Unknown error'
      }), 
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});