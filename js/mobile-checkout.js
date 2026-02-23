/**
 * MEATAHOLIC - Mobile Checkout Module
 * P3 Implementation: Sticky Order Summary on Mobile
 * 
 * Features:
 * - Sticky mobile order summary
 * - Expandable/collapsible summary
 * - Touch-optimized interactions
 * - Safe area support for notched devices
 * 
 * @author Farhan (CTO)
 * @version 1.0.0
 */

(function() {
  'use strict';

  const CHECKOUT_CONFIG = {
    stickyBreakpoint: 768,  // Switch to sticky below this width
    animationDuration: 300,
    scrollOffset: 100       // Offset for scroll position checks
  };

  /**
   * Mobile Checkout Manager
   */
  class MobileCheckoutManager {
    constructor(container, options = {}) {
      this.container = typeof container === 'string' 
        ? document.querySelector(container) 
        : container;
      
      this.options = { ...CHECKOUT_CONFIG, ...options };
      this.state = {
        isExpanded: false,
        isSticky: false,
        scrollPosition: 0
      };

      if (this.container) {
        this.init();
      }
    }

    init() {
      this.cacheElements();
      this.bindEvents();
      this.handleResize();
    }

    /**
     * Cache DOM elements
     */
    cacheElements() {
      this.summary = this.container.querySelector('.order-summary');
      this.toggleBtn = this.container.querySelector('.order-summary__toggle');
      this.items = this.container.querySelector('.order-summary__items');
      this.form = this.container.querySelector('form') || document.querySelector('form');
    }

    /**
     * Bind event listeners
     */
    bindEvents() {
      // Toggle summary on mobile
      if (this.toggleBtn) {
        this.toggleBtn.addEventListener('click', () => this.toggleSummary());
      }

      // Handle window resize
      let resizeTimer;
      window.addEventListener('resize', () => {
        clearTimeout(resizeTimer);
        resizeTimer = setTimeout(() => this.handleResize(), 100);
      });

      // Handle scroll for sticky behavior
      window.addEventListener('scroll', () => this.handleScroll(), { passive: true });

      // Handle form submission
      if (this.form) {
        this.form.addEventListener('submit', (e) => this.handleSubmit(e));
      }
    }

    /**
     * Handle window resize
     */
    handleResize() {
      const isMobile = window.innerWidth < this.options.stickyBreakpoint;
      
      if (isMobile && !this.state.isSticky) {
        this.enableSticky();
      } else if (!isMobile && this.state.isSticky) {
        this.disableSticky();
      }
    }

    /**
     * Enable sticky summary
     */
    enableSticky() {
      this.state.isSticky = true;
      
      if (this.summary) {
        this.summary.classList.add('order-summary--sticky');
        this.addToggleButton();
      }

      // Add spacer to prevent content jump
      this.addSpacer();
    }

    /**
     * Disable sticky summary
     */
    disableSticky() {
      this.state.isSticky = false;
      this.state.isExpanded = false;
      
      if (this.summary) {
        this.summary.classList.remove('order-summary--sticky');
      }

      if (this.items) {
        this.items.classList.remove('order-summary__items--expanded');
      }

      this.removeSpacer();
    }

    /**
     * Add toggle button if not exists
     */
    addToggleButton() {
      if (!this.toggleBtn && this.summary) {
        const header = this.summary.querySelector('.order-summary__header');
        if (header) {
          const toggle = document.createElement('button');
          toggle.type = 'button';
          toggle.className = 'order-summary__toggle';
          toggle.innerHTML = 'Show details';
          header.appendChild(toggle);
          this.toggleBtn = toggle;
          this.toggleBtn.addEventListener('click', () => this.toggleSummary());
        }
      }
    }

    /**
     * Toggle summary expansion
     */
    toggleSummary() {
      this.state.isExpanded = !this.state.isExpanded;
      
      if (this.items) {
        this.items.classList.toggle('order-summary__items--expanded', this.state.isExpanded);
      }

      if (this.toggleBtn) {
        this.toggleBtn.textContent = this.state.isExpanded ? 'Hide details' : 'Show details';
        this.toggleBtn.setAttribute('aria-expanded', this.state.isExpanded);
      }

      // Track event
      this.trackEvent('order_summary_toggle', { expanded: this.state.isExpanded });
    }

    /**
     * Handle scroll
     */
    handleScroll() {
      if (!this.state.isSticky) return;

      const scrollY = window.scrollY;
      const shouldShow = scrollY > this.options.scrollOffset;

      if (this.summary) {
        this.summary.style.transform = shouldShow 
          ? 'translateY(0)' 
          : 'translateY(100%)';
      }
    }

    /**
     * Add spacer element
     */
    addSpacer() {
      if (!this.spacer) {
        this.spacer = document.createElement('div');
        this.spacer.className = 'order-summary-spacer';
        this.spacer.style.height = '0px';
        this.container.insertBefore(this.spacer, this.summary);
      }
    }

    /**
     * Remove spacer element
     */
    removeSpacer() {
      if (this.spacer) {
        this.spacer.remove();
        this.spacer = null;
      }
    }

    /**
     * Handle form submission
     */
    handleSubmit(e) {
      const submitBtn = e.target.querySelector('[type="submit"]');
      
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.dataset.originalText = submitBtn.textContent;
        submitBtn.textContent = 'Processing...';
        
        // Re-enable after timeout (fallback)
        setTimeout(() => {
          submitBtn.disabled = false;
          submitBtn.textContent = submitBtn.dataset.originalText;
        }, 10000);
      }

      // Track conversion
      this.trackEvent('checkout_submit', {
        value: this.getOrderValue(),
        currency: 'BDT'
      });
    }

    /**
     * Get order value for analytics
     */
    getOrderValue() {
      const totalEl = this.container.querySelector('.order-summary__total');
      if (totalEl) {
        return parseFloat(totalEl.textContent.replace(/[^\d.]/g, '')) || 0;
      }
      return 0;
    }

    /**
     * Track analytics events
     */
    trackEvent(event, data) {
      if (window.gtag) {
        gtag('event', event, data);
      }
      if (window.fbq) {
        fbq('trackCustom', event, data);
      }
    }
  }

  /**
   * Checkout Progress Manager
   */
  class CheckoutProgressManager {
    constructor(container) {
      this.container = typeof container === 'string' 
        ? document.querySelector(container) 
        : container;
      
      this.steps = [];
      this.currentStep = 0;

      if (this.container) {
        this.init();
      }
    }

    init() {
      this.cacheElements();
      this.updateDisplay();
    }

    cacheElements() {
      this.steps = Array.from(this.container.querySelectorAll('.progress-step'));
    }

    /**
     * Go to specific step
     */
    goToStep(stepIndex) {
      this.currentStep = stepIndex;
      this.updateDisplay();
    }

    /**
     * Mark step as completed
     */
    completeStep(stepIndex) {
      const step = this.steps[stepIndex];
      if (step) {
        step.classList.add('progress-step--completed');
        step.classList.remove('progress-step--active');
      }
    }

    /**
     * Update visual display
     */
    updateDisplay() {
      this.steps.forEach((step, index) => {
        step.classList.remove('progress-step--active', 'progress-step--completed');
        
        if (index < this.currentStep) {
          step.classList.add('progress-step--completed');
        } else if (index === this.currentStep) {
          step.classList.add('progress-step--active');
        }
      });
    }

    /**
     * Get current step
     */
    getCurrentStep() {
      return this.currentStep;
    }
  }

  /**
   * Payment Method Selector
   */
  class PaymentMethodSelector {
    constructor(container) {
      this.container = typeof container === 'string' 
        ? document.querySelector(container) 
        : container;
      
      this.methods = [];

      if (this.container) {
        this.init();
      }
    }

    init() {
      this.methods = Array.from(this.container.querySelectorAll('[data-payment-method]'));
      this.bindEvents();
    }

    bindEvents() {
      this.methods.forEach(method => {
        method.addEventListener('click', () => this.selectMethod(method));
      });
    }

    selectMethod(selectedMethod) {
      this.methods.forEach(method => {
        method.classList.remove('payment-method--selected');
        method.setAttribute('aria-selected', 'false');
      });

      selectedMethod.classList.add('payment-method--selected');
      selectedMethod.setAttribute('aria-selected', 'true');

      // Show/hide method-specific fields
      const methodId = selectedMethod.dataset.paymentMethod;
      this.toggleMethodFields(methodId);

      // Track selection
      if (window.gtag) {
        gtag('event', 'select_payment_method', { method: methodId });
      }
    }

    toggleMethodFields(methodId) {
      document.querySelectorAll('[data-payment-fields]').forEach(el => {
        el.style.display = el.dataset.paymentFields === methodId ? 'block' : 'none';
      });
    }
  }

  // Initialize on DOM ready
  function init() {
    // Initialize mobile checkout
    const checkoutContainers = document.querySelectorAll('[data-checkout]');
    checkoutContainers.forEach(container => {
      new MobileCheckoutManager(container);
    });

    // Initialize progress bars
    const progressContainers = document.querySelectorAll('[data-checkout-progress]');
    progressContainers.forEach(container => {
      new CheckoutProgressManager(container);
    });

    // Initialize payment selectors
    const paymentContainers = document.querySelectorAll('[data-payment-selector]');
    paymentContainers.forEach(container => {
      new PaymentMethodSelector(container);
    });

    // Expose to global scope
    window.MobileCheckoutManager = MobileCheckoutManager;
    window.CheckoutProgressManager = CheckoutProgressManager;
    window.PaymentMethodSelector = PaymentMethodSelector;
    window.meataholicCheckout = {
      MobileCheckoutManager,
      CheckoutProgressManager,
      PaymentMethodSelector
    };
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
