import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

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
