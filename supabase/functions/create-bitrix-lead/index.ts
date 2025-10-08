import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email, name } = await req.json();

    console.log('Creating Bitrix24 lead for:', email);

    // Call Bitrix24 API to create a lead
    const bitrixResponse = await fetch(
      'https://storymapper.bitrix24.com/rest/26/rum8iq0umq5uix6g/crm.lead.add.json',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fields: {
            TITLE: `New Registration: ${email}`,
            NAME: name || email.split('@')[0],
            EMAIL: [{ VALUE: email, VALUE_TYPE: 'WORK' }],
            SOURCE_ID: 'WEB',
            STATUS_ID: 'NEW',
            OPENED: 'Y',
            ASSIGNED_BY_ID: 1,
          }
        }),
      }
    );

    const bitrixData = await bitrixResponse.json();

    if (!bitrixResponse.ok) {
      console.error('Bitrix24 API error:', bitrixData);
      throw new Error('Failed to create lead in Bitrix24');
    }

    console.log('Bitrix24 lead created successfully:', bitrixData);

    return new Response(
      JSON.stringify({ success: true, leadId: bitrixData.result }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );
  } catch (error) {
    console.error('Error in create-bitrix-lead function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
