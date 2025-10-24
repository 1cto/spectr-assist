import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.58.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    if (!email) {
      console.error("No email provided");
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Updating lead status for email:", email);
    // Search for Lead by Email
    const searchUrl = `${BITRIX_WEBHOOK_URL_BASE}crm.lead.list.json`;
    const searchBody = {
      filter: {
        "EMAIL.VALUE": email,
      },
      select: ["ID"],
    };

    console.log("Searching for lead with email:", email);

    const searchResponse = await fetch(searchUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(searchBody),
    });

    const searchData = await searchResponse.json();

    if (!searchResponse.ok || searchData.error) {
      console.error("CRM search error:", searchData);
      throw new Error(`CRM search failed: ${searchData.error_description || JSON.stringify(searchData)}`);
    }
    const searchData = await searchResponse.json();

    if (searchData.result) {
      const leadId = searchData.result[0].ID;
      console.log("Found lead ID:", leadId);
      const updateUrl = `${BITRIX_WEBHOOK_URL_BASE}crm.lead.update.json`;

      const updateResponse = await fetch(updateUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: leadId,
          fields: updateFields,
        }),
      });

      const updateData = await updateResponse.json();

      if (!updateResponse.ok || updateData.error) {
        console.error("CRM API update error:", updateData);
        throw new Error(`CRM update failed: ${updateData.error_description || JSON.stringify(updateData)}`);
      }

      console.log(`CRM lead ID ${leadId} updated successfully with new UTMs.`);

      return new Response(JSON.stringify({ success: true, leadId: leadId, result: updateData.result }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    } else {
      console.error("No lead with such email:  ", email);
      throw new Error(`No lead with such email: ${email}`);
    }
  } catch (error) {
    console.error("Error in upd_lead_status function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
