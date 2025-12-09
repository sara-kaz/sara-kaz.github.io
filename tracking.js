/**
 * Visitor Tracking System
 * Tracks who viewed the profile, from where, when, etc.
 * 
 * To use this, you need to set up a webhook endpoint to receive the data.
 * Options:
 * 1. Use webhook.site (free, temporary): https://webhook.site
 * 2. Use Formspree (free tier available): https://formspree.io
 * 3. Set up your own backend API endpoint
 * 
 * Replace the WEBHOOK_URL below with your endpoint URL.
 */

(function() {
  'use strict';

  // ============================================================================
  // CONFIGURATION
  // ============================================================================
  
  // Replace this with your webhook URL or API endpoint
  // For testing, you can use: https://webhook.site/your-unique-id
  const WEBHOOK_URL = 'https://webhook.site/c8c2c1eb-f3f8-43ae-858a-cde6d5ca03ab';
  
  // Set to true to enable console logging for debugging
  const DEBUG = true;

  // ============================================================================
  // TRACKING FUNCTION
  // ============================================================================

  async function trackVisitor() {
    try {
      // Collect basic visitor information
      const visitorData = {
        timestamp: new Date().toISOString(),
        url: window.location.href,
        referrer: document.referrer || 'Direct',
        userAgent: navigator.userAgent,
        language: navigator.language,
        screenResolution: `${window.screen.width}x${window.screen.height}`,
        viewportSize: `${window.innerWidth}x${window.innerHeight}`,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        cookieEnabled: navigator.cookieEnabled,
        onlineStatus: navigator.onLine
      };

      // Try to get IP and location information
      try {
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        visitorData.ipAddress = ipData.ip;

        // Get location data based on IP
        try {
          const locationResponse = await fetch(`https://ipapi.co/${ipData.ip}/json/`);
          const locationData = await locationResponse.json();
          
          visitorData.location = {
            city: locationData.city || 'Unknown',
            region: locationData.region || 'Unknown',
            country: locationData.country_name || 'Unknown',
            countryCode: locationData.country_code || 'Unknown',
            latitude: locationData.latitude || null,
            longitude: locationData.longitude || null,
            timezone: locationData.timezone || visitorData.timezone,
            isp: locationData.org || 'Unknown'
          };
        } catch (locationError) {
          if (DEBUG) console.warn('Could not fetch location data:', locationError);
          visitorData.location = { error: 'Location data unavailable' };
        }
      } catch (ipError) {
        if (DEBUG) console.warn('Could not fetch IP address:', ipError);
        visitorData.ipAddress = 'Unknown';
      }

      // Try to get geolocation if user allows (more accurate but requires permission)
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          function(position) {
            visitorData.geolocation = {
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
              accuracy: position.coords.accuracy
            };
            sendTrackingData(visitorData);
          },
          function(error) {
            // User denied or error occurred, send without geolocation
            if (DEBUG) console.log('Geolocation not available:', error.message);
            sendTrackingData(visitorData);
          },
          { timeout: 5000 }
        );
      } else {
        // Geolocation not supported, send data without it
        sendTrackingData(visitorData);
      }

    } catch (error) {
      if (DEBUG) console.error('Error in tracking:', error);
    }
  }

  // ============================================================================
  // SEND DATA TO WEBHOOK
  // ============================================================================

  function sendTrackingData(data) {
    // Don't send if webhook URL is not configured
    if (!WEBHOOK_URL || WEBHOOK_URL === 'YOUR_WEBHOOK_URL_HERE') {
      if (DEBUG) console.warn('Webhook URL not configured. Please set WEBHOOK_URL in tracking.js');
      return;
    }

    // Send data to webhook endpoint
    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        event: 'profile_view',
        data: data
      })
    })
    .then(response => {
      if (DEBUG) console.log('Tracking data sent successfully:', response);
    })
    .catch(error => {
      if (DEBUG) console.error('Error sending tracking data:', error);
    });
  }

  // ============================================================================
  // INITIALIZE TRACKING
  // ============================================================================

  // Track when page loads
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', trackVisitor);
  } else {
    trackVisitor();
  }

  // Track page visibility changes (when user switches tabs and comes back)
  document.addEventListener('visibilitychange', function() {
    if (!document.hidden) {
      // User returned to the page, track again
      const returnData = {
        timestamp: new Date().toISOString(),
        event: 'page_return',
        url: window.location.href
      };
      if (WEBHOOK_URL && WEBHOOK_URL !== 'YOUR_WEBHOOK_URL_HERE') {
        fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'page_return', data: returnData })
        });
      }
    }
  });

  // Track time spent on page (send when user leaves)
  let startTime = Date.now();
  window.addEventListener('beforeunload', function() {
    const timeSpent = Math.round((Date.now() - startTime) / 1000); // in seconds
    if (WEBHOOK_URL && WEBHOOK_URL !== 'YOUR_WEBHOOK_URL_HERE') {
      // Use sendBeacon for more reliable delivery on page unload
      const data = JSON.stringify({
        event: 'page_exit',
        data: {
          timestamp: new Date().toISOString(),
          timeSpentSeconds: timeSpent,
          url: window.location.href
        }
      });
      navigator.sendBeacon(WEBHOOK_URL, data);
    }
  });

})();

