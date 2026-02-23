/**
 * MEATAHOLIC - Trust Badges Module
 * P1 Implementation: Checkout Trust Badges
 * 
 * Features:
 * - Dynamic trust badge injection
 * - Checkout security indicators
 * - SSL verification display
 * - Money-back guarantee messaging
 * 
 * @author Farhan (CTO)
 * @version 1.0.0
 */

(function() {
  'use strict';

  // Trust Badge Configuration
  const TRUST_CONFIG = {
    badges: [
      {
        id: 'ssl-secure',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
          <path d="M9 12l2 2 4-4"/>
        </svg>`,
        label: 'SSL Secured',
        description: '256-bit encryption'
      },
      {
        id: 'secure-checkout',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
          <path d="M7 11V7a5 5 0 0110 0v4"/>
        </svg>`,
        label: 'Secure Checkout',
        description: 'Your data is protected'
      },
      {
        id: 'money-back',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <path d="M9 12l2 2 4-4"/>
          <path d="M8 8h.01M16 8h.01"/>
        </svg>`,
        label: 'Money-Back Guarantee',
        description: '30-day guarantee'
      },
      {
        id: 'fast-delivery',
        icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <rect x="1" y="3" width="15" height="13"/>
          <path d="M16 8h4l3 3v5h-7V8z"/>
          <circle cx="5.5" cy="18.5" r="2.5"/>
          <circle cx="18.5" cy="18.5" r="2.5"/>
        </svg>`,
        label: 'Fast Delivery',
        description: 'Same-day in Dhaka'
      }
    ],
    
    // Checkout banner text
    checkoutBanner: {
      text: '🔒 Your payment is secured with 256-bit SSL encryption',
      icon: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
      </svg>`
    }
  };

  /**
   * Trust Badges Manager
   */
  class TrustBadgeManager {
    constructor(options = {}) {
      this.config = { ...TRUST_CONFIG, ...options };
      this.instances = new Map();
    }

    /**
     * Initialize trust badges on a container
     * @param {string|HTMLElement} container - Target container
     * @param {string} variant - Badge variant (default, checkout, compact)
     */
    init(container, variant = 'default') {
      const el = typeof container === 'string' 
        ? document.querySelector(container) 
        : container;
      
      if (!el) {
        console.warn('[TrustBadges] Container not found:', container);
        return;
      }

      // Generate badges HTML
      const badgesHtml = this.generateBadges(variant);
      
      // Inject into container
      el.innerHTML = badgesHtml;
      
      // Store instance reference
      this.instances.set(el, { variant, timestamp: Date.now() });
      
      // Add checkout banner if variant is checkout
      if (variant === 'checkout') {
        this.addCheckoutBanner(el);
      }

      // Track impression
      this.trackEvent('trust_badges_shown', { variant });
    }

    /**
     * Generate badges HTML
     */
    generateBadges(variant) {
      const className = variant === 'checkout' 
        ? 'trust-badges trust-badges--checkout' 
        : 'trust-badges';

      const badgesHtml = this.config.badges.map(badge => `
        <div class="trust-badge" data-badge-id="${badge.id}">
          <div class="trust-badge__icon">${badge.icon}</div>
          <span class="trust-badge__text">${badge.label}</span>
        </div>
      `).join('');

      return `<div class="${className}">${badgesHtml}</div>`;
    }

    /**
     * Add secure checkout banner above badges
     */
    addCheckoutBanner(container) {
      const banner = document.createElement('div');
      banner.className = 'secure-checkout-banner';
      banner.innerHTML = `
        <div class="secure-checkout-banner__icon">
          ${this.config.checkoutBanner.icon}
        </div>
        <span>${this.config.checkoutBanner.text}</span>
      `;
      
      container.insertBefore(banner, container.firstChild);
    }

    /**
     * Update badge visibility based on viewport
     */
    handleResize() {
      const isMobile = window.innerWidth < 768;
      
      this.instances.forEach((data, el) => {
        const badges = el.querySelectorAll('.trust-badge');
        
        if (isMobile && data.variant !== 'checkout') {
          // Show fewer badges on mobile
          badges.forEach((badge, index) => {
            badge.style.display = index < 2 ? 'flex' : 'none';
          });
        } else {
          badges.forEach(badge => {
            badge.style.display = 'flex';
          });
        }
      });
    }

    /**
     * Track analytics events
     */
    trackEvent(event, data) {
      // Integration with analytics (GA4, Facebook Pixel, etc.)
      if (window.gtag) {
        gtag('event', event, data);
      }
      
      if (window.fbq) {
        fbq('trackCustom', event, data);
      }

      // Log for debugging
      console.log('[TrustBadges] Event:', event, data);
    }

    /**
     * Destroy instance and clean up
     */
    destroy(container) {
      const el = typeof container === 'string' 
        ? document.querySelector(container) 
        : container;
      
      if (el && this.instances.has(el)) {
        el.innerHTML = '';
        this.instances.delete(el);
      }
    }
  }

  // Initialize on DOM ready
  function init() {
    const trustManager = new TrustBadgeManager();
    
    // Auto-initialize checkout badges
    const checkoutContainers = document.querySelectorAll('[data-trust-badges="checkout"]');
    checkoutContainers.forEach(container => {
      trustManager.init(container, 'checkout');
    });

    // Auto-initialize default badges
    const defaultContainers = document.querySelectorAll('[data-trust-badges="default"]');
    defaultContainers.forEach(container => {
      trustManager.init(container, 'default');
    });

    // Handle resize
    let resizeTimer;
    window.addEventListener('resize', () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(() => trustManager.handleResize(), 250);
    });

    // Initial resize handling
    trustManager.handleResize();

    // Expose to global scope for manual initialization
    window.TrustBadgeManager = TrustBadgeManager;
    window.meataholicTrust = trustManager;
  }

  // Run initialization
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
