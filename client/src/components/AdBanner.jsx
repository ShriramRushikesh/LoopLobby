import React, { useEffect } from 'react';

/**
 * Reusable AdSense Component
 * @param {string} slot - The data-ad-slot ID from Google AdSense
 * @param {string} format - The data-ad-format (default: 'auto')
 * @param {object} style - Inline style overrides
 */
export default function AdBanner({ slot, format = 'auto', style = { display: 'block' } }) {
  useEffect(() => {
    try {
      // Ensure AdSense script is loaded and the push is called only once per component mount
      if (window.adsbygoogle) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (e) {
      console.warn('AdSense error:', e.message);
    }
  }, []);

  return (
    <div className="w-full flex flex-col items-center my-8 overflow-hidden">
      <span className="text-[10px] uppercase tracking-widest text-zinc-600 mb-2 font-medium">
        Advertisement
      </span>
      <div className="w-full bg-white/5 border border-white/5 rounded-2xl p-2 min-h-[100px] flex items-center justify-center relative overflow-hidden">
        {/* AdSense Placeholder */}
        <ins
          className="adsbygoogle"
          style={style}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX" // Placeholder as requested
          data-ad-slot={slot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
        
        {/* Fallback visual for dev or if ads are blocked */}
        <div className="absolute inset-0 -z-10 flex items-center justify-center italic text-zinc-700 text-xs">
          Loading sync-vibe ads...
        </div>
      </div>
    </div>
  );
}
