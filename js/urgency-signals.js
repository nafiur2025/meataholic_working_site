/**
 * MEATAHOLIC - Urgency Signals Module
 * P5 Implementation: Stock Scarcity + Live Viewers
 * 
 * Features:
 * - Real-time stock indicators
 * - Live viewer counters
 * - Dynamic urgency banners
 * - Low stock warnings
 * 
 * @author Farhan (CTO)
 * @version 1.0.0
 */

(function() {
  'use strict';

  // Urgency Configuration
  const URGENCY_CONFIG = {
    // Stock thresholds
    stock: {
      high: 50,
      medium: 20,
      low: 10,
      critical: 5
    },
    
    // Viewer display ranges
    viewers: {
      min: 12,
      max: 87,
      updateInterval: 8000  // Update every 8 seconds
    },
    
    // Messages
    messages: {
      scarcity: {
        critical: '🔥 Only {stock} left! Order now',
        low: '⚡ Only {stock} remaining',
        medium: '📦 {stock} in stock',
        high: '✓ In Stock'
      },
      viewers: '{count} people viewing this now'
    },
    
    // Animation settings
    animation: {
      pulseDuration: 2000,
      updateDuration: 500
    }
  };

  /**
   * Stock Scarcity Manager
   */
  class StockScarcityManager {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' 
        ? document.querySelector(container) 
        : container;
      
      this.options = { ...URGENCY_CONFIG, ...options };
      this.state = {
        stock: options.stock || 0,
        initialStock: options.initialStock || options.stock || 100
      };

      if (this.container) {
        this.init();
      }
    }

    init() {
      this.render();
      this.updateDisplay();
    }

    /**
     * Render stock indicator HTML
     */
    render() {
      const threshold = this.getThreshold();
      
      this.container.innerHTML = `
        <div class="stock-indicator" data-stock="${this.state.stock}" data-threshold="${threshold}">
          <div class="stock-indicator__bar">
            <div class="stock-indicator__fill stock-indicator__fill--${threshold}"></div>
          </div>
          <span class="stock-indicator__text">${this.getMessage()}</span>
        </div>
      `;
    }

    /**
     * Get current threshold level
     */
    getThreshold() {
      const stock = this.state.stock;
      const { stock: thresholds } = this.options;
      
      if (stock <= thresholds.critical) return 'critical';
      if (stock <= thresholds.low) return 'low';
      if (stock <= thresholds.medium) return 'medium';
      return 'high';
    }

    /**
     * Get display message
     */
    getMessage() {
      const threshold = this.getThreshold();
      const template = this.options.messages.scarcity[threshold];
      return template.replace('{stock}', this.state.stock);
    }

    /**
     * Update stock count
     */
    setStock(count) {
      const oldThreshold = this.getThreshold();
      this.state.stock = Math.max(0, count);
      const newThreshold = this.getThreshold();

      this.updateDisplay();

      // Trigger urgency if threshold changed to critical
      if (oldThreshold !== newThreshold && newThreshold === 'critical') {
        this.triggerUrgency();
      }

      return this;
    }

    /**
     * Decrement stock (simulation)
     */
    decrement(amount = 1) {
      return this.setStock(this.state.stock - amount);
    }

    /**
     * Update display
     */
    updateDisplay() {
      if (!this.container) return;

      const indicator = this.container.querySelector('.stock-indicator');
      const bar = this.container.querySelector('.stock-indicator__fill');
      const text = this.container.querySelector('.stock-indicator__text');
      const threshold = this.getThreshold();

      // Update classes
      indicator.setAttribute('data-threshold', threshold);
      indicator.setAttribute('data-stock', this.state.stock);
      
      // Update bar
      bar.className = `stock-indicator__fill stock-indicator__fill--${threshold}`;
      
      // Update text
      text.textContent = this.getMessage();
    }

    /**
     * Trigger urgency animation
     */
    triggerUrgency() {
      this.container.classList.add('urgency-pulse');
      
      setTimeout(() => {
        this.container.classList.remove('urgency-pulse');
      }, this.options.animation.pulseDuration);
    }
  }

  /**
   * Live Viewers Manager
   */
  class LiveViewersManager {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' 
        ? document.querySelector(container) 
        : container;
      
      this.options = { ...URGENCY_CONFIG.viewers, ...options };
      this.state = {
        count: this.options.min,
        intervalId: null
      };

      if (this.container) {
        this.init();
      }
    }

    init() {
      this.render();
      this.startUpdates();
    }

    /**
     * Render viewer counter
     */
    render() {
      this.container.innerHTML = `
        <div class="live-viewers">
          <span class="live-viewers__dot"></span>
          <span class="live-viewers__count">${this.state.count}</span>
          <span class="live-viewers__text">people viewing</span>
        </div>
      `;
    }

    /**
     * Start random updates
     */
    startUpdates() {
      this.updateViewers();
      
      this.state.intervalId = setInterval(() => {
        this.updateViewers();
      }, this.options.updateInterval);
    }

    /**
     * Update viewer count
     */
    updateViewers() {
      const { min, max } = this.options;
      const oldCount = this.state.count;
      
      // Random fluctuation (-5 to +5)
      const change = Math.floor(Math.random() * 11) - 5;
      let newCount = oldCount + change;
      
      // Keep within bounds
      newCount = Math.max(min, Math.min(max, newCount));
      
      this.state.count = newCount;
      this.animateCount(oldCount, newCount);
    }

    /**
     * Animate count change
     */
    animateCount(from, to) {
      const countEl = this.container.querySelector('.live-viewers__count');
      if (!countEl) return;

      const duration = this.options.updateDuration;
      const startTime = performance.now();

      const animate = (currentTime) => {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        
        const current = Math.round(from + (to - from) * easeOutQuart);
        countEl.textContent = current;

        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };

      requestAnimationFrame(animate);
    }

    /**
     * Stop updates
     */
    stop() {
      if (this.state.intervalId) {
        clearInterval(this.state.intervalId);
        this.state.intervalId = null;
      }
    }

    /**
     * Destroy
     */
    destroy() {
      this.stop();
    }
  }

  /**
   * Urgency Banner Manager
   */
  class UrgencyBannerManager {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' 
        ? document.querySelector(container) 
        : container;
      
      this.options = options;
      
      if (this.container) {
        this.init();
      }
    }

    init() {
      this.render();
    }

    /**
     * Render urgency banner
     */
    render() {
      const type = this.options.type || 'scarcity';
      const message = this.options.message || this.getDefaultMessage(type);

      this.container.innerHTML = `
        <div class="urgency-banner urgency-banner--${type}">
          <svg class="urgency-banner__icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            ${this.getIconSvg(type)}
          </svg>
          <span>${message}</span>
        </div>
      `;
    }

    /**
     * Get default message
     */
    getDefaultMessage(type) {
      const messages = {
        scarcity: '⚡ Limited stock available!',
        viewers: '👀 Multiple people viewing this item',
        sale: '🔥 Sale ends soon!',
        shipping: '🚚 Free shipping on orders over ৳2000'
      };
      return messages[type] || messages.scarcity;
    }

    /**
     * Get icon SVG
     */
    getIconSvg(type) {
      const icons = {
        scarcity: '<path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"/>',
        viewers: '<path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/>',
        sale: '<path d="M6 9H4.5a2.5 2.5 0 010-5H6"/><path d="M18 9h1.5a2.5 2.5 0 000-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0012 0V2z"/>',
        shipping: '<path d="M21 16V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8"/><path d="M3 16h18"/><path d="M8 20l-2-4 2-4"/><path d="M16 20l2-4-2-4"/><circle cx="7" cy="20" r="2"/><circle cx="17" cy="20" r="2"/>'
      };
      return icons[type] || icons.scarcity;
    }

    /**
     * Update message
     */
    setMessage(message) {
      const span = this.container.querySelector('.urgency-banner span');
      if (span) {
        span.textContent = message;
      }
    }
  }

  // Initialize on DOM ready
  function init() {
    // Auto-initialize stock indicators
    document.querySelectorAll('[data-stock-indicator]').forEach(el => {
      const stock = parseInt(el.dataset.stock, 10) || 15;
      const initialStock = parseInt(el.dataset.initialStock, 10) || stock;
      
      new StockScarcityManager(el, { stock, initialStock });
    });

    // Auto-initialize live viewers
    document.querySelectorAll('[data-live-viewers]').forEach(el => {
      new LiveViewersManager(el);
    });

    // Auto-initialize urgency banners
    document.querySelectorAll('[data-urgency-banner]').forEach(el => {
      const type = el.dataset.urgencyBanner || 'scarcity';
      const message = el.dataset.urgencyMessage;
      
      new UrgencyBannerManager(el, { type, message });
    });

    // Expose to global scope
    window.StockScarcityManager = StockScarcityManager;
    window.LiveViewersManager = LiveViewersManager;
    window.UrgencyBannerManager = UrgencyBannerManager;
    window.meataholicUrgency = {
      StockScarcityManager,
      LiveViewersManager,
      UrgencyBannerManager
    };
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
