import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};
const BITRIX_WEBHOOK_URL_BASE = "https://storymapper.bitrix24.com/rest/26/ft3bkdlsgtrf3bpm/";
const BITRIX_WEBHOOK_URL_UPD = "https://storymapper.bitrix24.com/rest/26/htdv6akw0d2hkr26/";

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("OK", {
      headers: corsHeaders,
      status: 200, // MUST return 200 OK for preflight success
    });
  }

  // 2. Check for POST method (the actual data request)
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Invalid request method" }), {
      status: 405,
      headers: { "Content-Type": "application/json", ...corsHeaders },
    });
  }

  const updateFields: any = {};
  updateFields.STATUS_ID = "UC_0AOSV2";

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
    if (!searchResponse.ok || searchData.error) {
      console.error("CRM search error:", searchData);
      throw new Error(`CRM search failed: ${searchData.error_description || JSON.stringify(searchData)}`);
    }

    if (!searchData.result || searchData.result.length === 0) {
      console.log("Lead not found for email:", email);
      return new Response(JSON.stringify({ success: false, message: `Lead not found for email: ${email}` }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
        status: 200,
      });
    }

    const leadId = searchData.result[0].ID;
    console.log("Found lead ID:", leadId);

    // Update the Found Lead
    const updateUrl = `${BITRIX_WEBHOOK_URL_UPD}crm.lead.update.json`;

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

    return new Response(
      JSON.stringify({
        success: true,
        message: "Lead status updated successfully",
        email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
    );
  } catch (error) {
    console.error("Error in upd_lead_status function:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
