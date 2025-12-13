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
  
  // Replace this with your own webhook URL or backend endpoint.
  // Do not commit real/temporary URLs; keep this placeholder and set it per environment.
  const WEBHOOK_URL = 'https://webhook.site/f80f7d25-34c8-48d0-b163-2a9b2f8b0197';
  
  // Set to true to enable console logging for debugging
  const DEBUG = true;
  
  // Set to true to enable test mode (logs data to console even without webhook)
  const TEST_MODE = true;

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
    const payload = {
      event: 'profile_view',
      data: data
    };

    // In test mode, always log the data to console
    if (TEST_MODE) {
      console.log('📊 Tracking Data Collected:', payload);
    }

    // Don't send if webhook URL is not configured
    if (!WEBHOOK_URL || WEBHOOK_URL === 'YOUR_WEBHOOK_URL_HERE') {
      if (DEBUG || TEST_MODE) {
        console.warn('⚠️ Webhook URL not configured. Tracking data collected but not sent.');
        console.info('💡 To enable tracking, set WEBHOOK_URL in tracking.js');
        console.info('   Options: webhook.site, Formspree, or your own backend endpoint');
      }
      return;
    }

    // Send data to webhook endpoint
    fetch(WEBHOOK_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    })
    .then(response => {
      if (response.ok) {
        if (DEBUG) console.log('✅ Tracking data sent successfully');
        return response;
      } else {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    })
    .catch(error => {
      if (DEBUG) console.error('❌ Error sending tracking data:', error);
    });
  }

  // ============================================================================
  // INITIALIZE TRACKING
  // ============================================================================

  // Initialize tracking
  if (DEBUG || TEST_MODE) {
    console.log('🔍 Tracking script loaded and initialized');
  }

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
      
      if (TEST_MODE) {
        console.log('📊 Page Return Event:', returnData);
      }
      
      if (WEBHOOK_URL && WEBHOOK_URL !== 'YOUR_WEBHOOK_URL_HERE') {
        fetch(WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ event: 'page_return', data: returnData })
        })
        .then(response => {
          if (DEBUG && response.ok) console.log('✅ Page return tracked');
        })
        .catch(error => {
          if (DEBUG) console.error('❌ Error tracking page return:', error);
        });
      }
    }
  });

  // Track time spent on page (send when user leaves)
  let startTime = Date.now();
  window.addEventListener('beforeunload', function() {
    const timeSpent = Math.round((Date.now() - startTime) / 1000); // in seconds
    const exitData = {
      event: 'page_exit',
      data: {
        timestamp: new Date().toISOString(),
        timeSpentSeconds: timeSpent,
        url: window.location.href
      }
    };
    
    if (TEST_MODE) {
      // Log to console (may not always show due to page unload)
      console.log('📊 Page Exit Event:', exitData);
    }
    
    if (WEBHOOK_URL && WEBHOOK_URL !== 'YOUR_WEBHOOK_URL_HERE') {
      // Use sendBeacon for more reliable delivery on page unload
      const data = JSON.stringify(exitData);
      // Wrap in Blob so sendBeacon sends it as application/json
      const blob = new Blob([data], { type: 'application/json' });
      navigator.sendBeacon(WEBHOOK_URL, blob);
    }
  });

})();

