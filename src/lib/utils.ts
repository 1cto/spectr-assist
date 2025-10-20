import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
// 🔑 Import the supabase client and the Supabase User type
import { supabase } from "@/integrations/supabase/client";
import { User } from "@supabase/supabase-js";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
// A helper function to create the lead
export const createBitrixLead = async (sessionUser: User) => {
  try {
    const utmParamsStr = sessionStorage.getItem("utm_params");
    const utmParams = utmParamsStr ? JSON.parse(utmParamsStr) : {};
    console.log("create_bitrix_lead");
    await supabase.functions.invoke("create-bitrix-lead", {
      body: {
        email: sessionUser.email,
        name: sessionUser.user_metadata?.full_name || sessionUser.user_metadata?.name,
        ...utmParams,
      },
    });
  } catch (bitrixError) {
    console.error("Failed to create CRM lead:", bitrixError);
    // Do not block auth flow if CRM fails
  } finally {
    // Clear UTM params after successful use
    sessionStorage.removeItem("utm_params");
  }
};

export function captureAndStoreUtmParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const utmParams: Record<string, string> = {};
  const paramsToCapture = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "fbclid", "landing_page"];

  paramsToCapture.forEach((param) => {
    const value = urlParams.get(param);
    if (value) {
      utmParams[param] = value;
    }
  });

  // If landing_page is not set, use current page URL
  if (!utmParams.landing_page) {
    utmParams.landing_page = window.location.hostname;
  }

  if (Object.keys(utmParams).length > 0) {
    sessionStorage.setItem("utm_params", JSON.stringify(utmParams));
  }
}
