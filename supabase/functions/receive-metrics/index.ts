import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

interface QualityMetrics {
  "alternative scenarios"?: number;
  "alternative scenarios justification"?: string;
  "given-when-then"?: number;
  "given-when-then justification"?: string;
  "specifications"?: number;
  "specifications justification"?: string;
  "overall"?: number;
}

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

    // Parse the incoming metrics
    const data = await req.json();
    const metrics: QualityMetrics = data.metrics || data;
    const sessionId = data.sessionId;
    
    console.log('Received quality metrics:', metrics);
    console.log('Session ID:', sessionId);

    // Validate sessionId is provided
    if (!sessionId) {
      throw new Error('sessionId is required for metrics updates');
    }

    // Validate the metrics structure
    if (typeof metrics !== 'object' || metrics === null) {
      throw new Error('Invalid metrics format: expected object');
    }

    // Validate numeric values are within expected range (0-3)
    const numericFields = ['alternative scenarios', 'given-when-then', 'specifications'] as const;
    for (const field of numericFields) {
      if (metrics[field] !== undefined) {
        const value = metrics[field];
        if (typeof value !== 'number' || value < 0 || value > 3) {
          console.warn(`Invalid value for ${field}: expected number between 0-3, got ${value}`);
        }
      }
    }

    // Log the individual metrics for debugging
    console.log('Alternative Scenarios:', metrics["alternative scenarios"], '-', metrics["alternative scenarios justification"]);
    console.log('Given-When-Then:', metrics["given-when-then"], '-', metrics["given-when-then justification"]);
    console.log('Specifications:', metrics["specifications"], '-', metrics["specifications justification"]);
    console.log('Overall Score:', metrics["overall"]);

    // Broadcast the metrics to session-specific clients via Supabase Realtime
    const channel = supabase.channel(`quality-metrics-${sessionId}`);
    
    // Send the metrics to session-specific subscribers
    await channel.send({
      type: 'broadcast',
      event: 'metrics-update',
      payload: {
        timestamp: new Date().toISOString(),
        sessionId,
        ...metrics
      }
    });
    
    // Also trigger the metrics-received event for chat coordination
    const chatChannel = supabase.channel(`quality-metrics-chat-${sessionId}`);
    await chatChannel.send({
      type: 'broadcast',
      event: 'metrics-update',
      payload: {
        timestamp: new Date().toISOString(),
        sessionId,
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