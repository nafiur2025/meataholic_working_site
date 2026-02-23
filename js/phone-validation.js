/**
 * MEATAHOLIC - Phone Validation Module
 * Quick Win: Phone Number Validation
 * 
 * Features:
 * - Real-time Bangladesh phone validation
 * - Visual validation feedback
 * - Auto-formatting
 * - E.164 format support
 * 
 * @author Farhan (CTO)
 * @version 1.0.0
 */

(function() {
  'use strict';

  // Bangladesh phone validation rules
  const PHONE_CONFIG = {
    countryCode: '+880',
    countryCodeNoPlus: '880',
    minLength: 10,  // Without country code
    maxLength: 11,  // Without country code (with 0 prefix)
    
    // Valid operator prefixes for Bangladesh
    validPrefixes: [
      '013', '014', '015', '016', '017', '018', '019'  // Mobile operators
    ],
    
    // Regex patterns
    patterns: {
      // International format: +8801XXXXXXXXX
      international: /^\+8801[3-9]\d{8}$/,
      // Local format: 01XXXXXXXXX
      local: /^01[3-9]\d{8}$/,
      // With country code no plus: 8801XXXXXXXXX
      countryCode: /^8801[3-9]\d{8}$/,
      // Numeric only
      numeric: /^\d+$/
    }
  };

  /**
   * Phone Validator Class
   */
  class PhoneValidator {
    constructor(inputElement, options = {}) {
      this.input = typeof inputElement === 'string' 
        ? document.querySelector(inputElement) 
        : inputElement;
      
      if (!this.input) {
        console.warn('[PhoneValidator] Input not found:', inputElement);
        return;
      }

      this.options = {
        autoFormat: true,
        showValidation: true,
        validateOnBlur: true,
        validateOnInput: true,
        allowedChars: /[\d\+\s\-\(\)]/,
        ...options
      };

      this.state = {
        isValid: false,
        isTouched: false,
        formatted: '',
        e164: ''
      };

      this.init();
    }

    init() {
      // Wrap input in container if not already
      this.wrapInput();
      
      // Add validation status element
      this.addValidationUI();
      
      // Bind events
      this.bindEvents();
      
      // Store reference
      this.input._phoneValidator = this;
    }

    /**
     * Wrap input in validation container
     */
    wrapInput() {
      if (this.input.parentElement.classList.contains('phone-input-wrapper')) {
        return;
      }

      const wrapper = document.createElement('div');
      wrapper.className = 'phone-input-wrapper';
      
      // Add phone icon
      const icon = document.createElement('div');
      icon.className = 'phone-input-wrapper__icon';
      icon.innerHTML = `<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07 19.5 19.5 0 01-6-6 19.79 19.79 0 01-3.07-8.67A2 2 0 014.11 2h3a2 2 0 012 1.72 12.84 12.84 0 00.7 2.81 2 2 0 01-.45 2.11L8.09 9.91a16 16 0 006 6l1.27-1.27a2 2 0 012.11-.45 12.84 12.84 0 002.81.7A2 2 0 0122 16.92z"/>
      </svg>`;
      
      this.input.parentNode.insertBefore(wrapper, this.input);
      wrapper.appendChild(icon);
      wrapper.appendChild(this.input);
      
      // Update input classes
      this.input.classList.add('form-input');
    }

    /**
     * Add validation status UI
     */
    addValidationUI() {
      this.statusEl = document.createElement('div');
      this.statusEl.className = 'phone-validation-status';
      this.statusEl.style.display = 'none';
      
      this.input.parentElement.appendChild(this.statusEl);
    }

    /**
     * Bind input events
     */
    bindEvents() {
      // Input filtering and formatting
      if (this.options.validateOnInput) {
        this.input.addEventListener('input', (e) => this.handleInput(e));
      }

      // Validation on blur
      if (this.options.validateOnBlur) {
        this.input.addEventListener('blur', () => this.handleBlur());
        this.input.addEventListener('focus', () => this.handleFocus());
      }

      // Prevent invalid characters
      this.input.addEventListener('keypress', (e) => this.handleKeypress(e));
    }

    /**
     * Handle input event
     */
    handleInput(e) {
      let value = e.target.value;
      
      // Strip non-numeric except +
      value = value.replace(/[^\d+]/g, '');
      
      // Auto-format if enabled
      if (this.options.autoFormat) {
        value = this.formatNumber(value);
      }
      
      // Update input value
      if (value !== e.target.value) {
        e.target.value = value;
      }

      // Validate
      this.validate(value);
    }

    /**
     * Handle blur event
     */
    handleBlur() {
      this.state.isTouched = true;
      this.validate(this.input.value, true);
    }

    /**
     * Handle focus event
     */
    handleFocus() {
      this.clearError();
    }

    /**
     * Handle keypress - prevent invalid chars
     */
    handleKeypress(e) {
      if (!this.options.allowedChars.test(e.key)) {
        e.preventDefault();
      }
    }

    /**
     * Format phone number
     */
    formatNumber(value) {
      // Remove all non-digits
      const digits = value.replace(/\D/g, '');
      
      // Handle different formats
      if (digits.startsWith('880')) {
        // Already has country code
        return '+880' + digits.slice(3);
      } else if (digits.startsWith('0')) {
        // Local format with leading 0
        return digits;
      } else if (digits.startsWith('1') && digits.length <= 10) {
        // Missing leading 0
        return '0' + digits;
      }
      
      return value;
    }

    /**
     * Validate phone number
     */
    validate(value, showError = false) {
      const digits = value.replace(/\D/g, '');
      
      // Determine format and validate
      let isValid = false;
      let errorMessage = '';

      // Check length
      if (digits.length === 0) {
        errorMessage = 'Phone number is required';
      } else if (digits.startsWith('880')) {
        // International format check
        isValid = PHONE_CONFIG.patterns.countryCode.test(digits);
        if (!isValid) {
          errorMessage = 'Invalid Bangladesh number';
        }
      } else if (digits.startsWith('01')) {
        // Local format check
        if (digits.length < 11) {
          errorMessage = 'Number too short';
        } else if (digits.length > 11) {
          errorMessage = 'Number too long';
        } else {
          isValid = PHONE_CONFIG.patterns.local.test(digits);
          if (!isValid) {
            errorMessage = 'Invalid operator code';
          }
        }
      } else {
        errorMessage = 'Must start with 01 or +880';
      }

      // Check valid operator prefix
      if (isValid) {
        const prefix = digits.startsWith('880') 
          ? digits.slice(2, 5)  // 88017 -> 017
          : digits.slice(0, 3); // 017
        
        if (!PHONE_CONFIG.validPrefixes.includes(prefix)) {
          isValid = false;
          errorMessage = 'Invalid operator';
        }
      }

      // Update state
      this.state.isValid = isValid;
      this.state.formatted = this.formatForDisplay(digits);
      this.state.e164 = this.formatE164(digits);

      // Update UI
      if (showError || this.state.isTouched) {
        this.updateUI(isValid, errorMessage);
      } else {
        this.updateValidationIcon(isValid);
      }

      // Dispatch event
      this.input.dispatchEvent(new CustomEvent('phoneValidation', {
        detail: { ...this.state }
      }));

      return isValid;
    }

    /**
     * Format for display
     */
    formatForDisplay(digits) {
      if (digits.startsWith('880')) {
        const rest = digits.slice(3);
        return `+880 ${rest.slice(0, 4)}-${rest.slice(4, 7)}-${rest.slice(7)}`;
      } else if (digits.startsWith('0')) {
        return `${digits.slice(0, 5)}-${digits.slice(5, 8)}-${digits.slice(8)}`;
      }
      return digits;
    }

    /**
     * Format to E.164
     */
    formatE164(digits) {
      if (digits.startsWith('880')) {
        return '+' + digits;
      } else if (digits.startsWith('0')) {
        return '+880' + digits.slice(1);
      }
      return digits;
    }

    /**
     * Update validation UI
     */
    updateUI(isValid, errorMessage) {
      // Update input state
      this.input.classList.remove('form-input--error', 'form-input--success');
      
      if (this.state.isTouched) {
        this.input.classList.add(isValid ? 'form-input--success' : 'form-input--error');
      }

      // Update status icon
      this.updateValidationIcon(isValid);

      // Show/hide error message
      this.showError(isValid ? '' : errorMessage);
    }

    /**
     * Update validation icon
     */
    updateValidationIcon(isValid) {
      if (!this.input.value) {
        this.statusEl.style.display = 'none';
        return;
      }

      this.statusEl.style.display = 'flex';
      this.statusEl.innerHTML = isValid 
        ? `<svg class="phone-validation-status__icon phone-validation-status__icon--valid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M20 6L9 17l-5-5"/>
          </svg>`
        : `<svg class="phone-validation-status__icon phone-validation-status__icon--invalid" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>`;
    }

    /**
     * Show error message
     */
    showError(message) {
      // Remove existing error
      this.clearError();

      if (!message) return;

      // Create error element
      const errorEl = document.createElement('div');
      errorEl.className = 'form-error';
      errorEl.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <circle cx="12" cy="12" r="10"/>
          <line x1="12" y1="8" x2="12" y2="12"/>
          <line x1="12" y1="16" x2="12.01" y2="16"/>
        </svg>
        <span>${message}</span>
      `;

      this.input.parentElement.parentElement.appendChild(errorEl);
      this.errorEl = errorEl;
    }

    /**
     * Clear error message
     */
    clearError() {
      if (this.errorEl) {
        this.errorEl.remove();
        this.errorEl = null;
      }
    }

    /**
     * Get validation state
     */
    getState() {
      return { ...this.state };
    }

    /**
     * Get E.164 formatted number
     */
    getE164() {
      return this.state.e164;
    }

    /**
     * Check if valid
     */
    isValid() {
      return this.state.isValid;
    }

    /**
     * Destroy validator
     */
    destroy() {
      this.clearError();
      this.input.classList.remove('form-input--error', 'form-input--success');
      delete this.input._phoneValidator;
    }
  }

  // Auto-initialize on DOM ready
  function init() {
    // Find all phone inputs
    const phoneInputs = document.querySelectorAll(
      'input[type="tel"], input[data-validate="phone"], input[name*="phone"], input[name*="mobile"]'
    );

    phoneInputs.forEach(input => {
      if (!input._phoneValidator) {
        new PhoneValidator(input);
      }
    });

    // Expose to global scope
    window.PhoneValidator = PhoneValidator;
  }

  // Initialize
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // Re-init on dynamic content
  document.addEventListener('contentLoaded', init);

})();
