import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseAnonKey = Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;

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

    // Parse the incoming metrics
    const metrics = await req.json();
    
    console.log('Received metrics:', metrics);

    // Broadcast the metrics to all connected clients via Supabase Realtime
    const channel = supabase.channel('quality-metrics');
    
    // Send the metrics to all subscribers
    await channel.send({
      type: 'broadcast',
      event: 'metrics-update',
      payload: {
        timestamp: new Date().toISOString(),
        ...metrics
      }
    });

    console.log('Metrics broadcasted successfully');

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'Metrics received and broadcasted',
        receivedAt: new Date().toISOString()
      }), 
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Error in receive-metrics function:', error);
    
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