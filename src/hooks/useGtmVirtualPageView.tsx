import { useEffect } from 'react';
import { useLocation } from 'react-router-dom'; // Assuming you are using 'react-router-dom'

// Define the structure of the global dataLayer (if not already defined)
declare global {
  interface Window {
    dataLayer: any[];
  }
}

/**
 * Custom hook to push a 'virtual_page_view' event to the GTM Data Layer 
 * whenever the URL path changes.
 */
const useGtmVirtualPageView = () => {
  const location = useLocation();

  useEffect(() => {
    // Ensure the dataLayer is present before attempting to push
    if (window.dataLayer) {
      // Log the event to the console for debugging
      console.log('GTM: Pushing virtual_page_view for:', location.pathname);

      // Push the custom event to the Data Layer
      window.dataLayer.push({
        event: 'virtual_page_view', // The custom event name GTM will listen for
        pagePath: location.pathname + location.search, // The new URL path and query string
        pageTitle: document.title, // You can send the current page title
        // Add any other relevant data layer variables here (e.g., 'userStatus': 'authenticated')
      });
    }
  }, [location.pathname, location.search]); // Depend on path and search params

  return null; // The hook doesn't render anything
};

export default useGtmVirtualPageView;
