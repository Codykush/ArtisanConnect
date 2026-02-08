// js/components.js - UI Components Library

const Components = (function() {
    'use strict';
    
    // Private variables
    let notificationContainer;
    
    // Initialize components
    function init() {
        createNotificationContainer();
        initTooltips();
        initDropdowns();
        initModals();
    }
    
    // Notification System
    function createNotificationContainer() {
        notificationContainer = document.createElement('div');
        notificationContainer.className = 'notification-container';
        notificationContainer.id = 'notificationContainer';
        document.body.appendChild(notificationContainer);
    }
    
    function showNotification(message, type = 'info', duration = 3000) {
        if (!notificationContainer) {
            createNotificationContainer();
        }
        
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.setAttribute('role', 'alert');
        notification.setAttribute('aria-live', 'polite');
        
        const icon = getNotificationIcon(type);
        
        notification.innerHTML = `
            <div class="notification-content">
                <i class="fas ${icon}"></i>
                <span>${message}</span>
            </div>
            <button class="notification-close" aria-label="Close notification">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        notificationContainer.appendChild(notification);
        
        // Add close functionality
        const closeBtn = notification.querySelector('.notification-close');
        closeBtn.addEventListener('click', () => {
            notification.remove();
        });
        
        // Auto remove after duration
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, duration);
        
        return notification;
    }
    
    function getNotificationIcon(type) {
        const icons = {
            success: 'fa-check-circle',
            error: 'fa-exclamation-circle',
            warning: 'fa-exclamation-triangle',
            info: 'fa-info-circle'
        };
        return icons[type] || 'fa-info-circle';
    }
    
    // Loading Overlay
    function showLoading(message = 'Loading...') {
        let overlay = document.getElementById('loadingOverlay');
        
        if (!overlay) {
            overlay = document.createElement('div');
            overlay.id = 'loadingOverlay';
            overlay.className = 'loading-overlay';
            overlay.innerHTML = `
                <div class="spinner"></div>
                <p>${message}</p>
            `;
            document.body.appendChild(overlay);
        } else {
            overlay.querySelector('p').textContent = message;
        }
        
        overlay.style.display = 'flex';
    }
    
    function hideLoading() {
        const overlay = document.getElementById('loadingOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }
    
    // Modal System
    function showModal(options) {
        const {
            title = 'Modal',
            content = '',
            footer = '',
            size = 'md', // sm, md, lg, xl
            onClose = null,
            onConfirm = null,
            confirmText = 'Confirm',
            cancelText = 'Cancel',
            showConfirm = true,
            showCancel = true
        } = options;
        
        // Remove existing modal
        const existingModal = document.querySelector('.modal-overlay');
        if (existingModal) {
            existingModal.remove();
        }
        
        // Create modal
        const modalOverlay = document.createElement('div');
        modalOverlay.className = 'modal-overlay';
        
        const modal = document.createElement('div');
        modal.className = `modal modal-${size}`;
        
        modal.innerHTML = `
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" aria-label="Close modal">
                    <i class="fas fa-times"></i>
                </button>
            </div>
            <div class="modal-body">
                ${content}
            </div>
            ${footer || `
                <div class="modal-footer">
                    ${showCancel ? `<button class="btn btn-outline modal-cancel">${cancelText}</button>` : ''}
                    ${showConfirm ? `<button class="btn btn-primary modal-confirm">${confirmText}</button>` : ''}
                </div>
            `}
        `;
        
        modalOverlay.appendChild(modal);
        document.body.appendChild(modalOverlay);
        
        // Add event listeners
        const closeBtn = modal.querySelector('.modal-close');
        const cancelBtn = modal.querySelector('.modal-cancel');
        const confirmBtn = modal.querySelector('.modal-confirm');
        
        function closeModal() {
            modalOverlay.classList.add('closing');
            setTimeout(() => {
                modalOverlay.remove();
                if (onClose && typeof onClose === 'function') {
                    onClose();
                }
            }, 300);
        }
        
        closeBtn.addEventListener('click', closeModal);
        
        if (cancelBtn) {
            cancelBtn.addEventListener('click', closeModal);
        }
        
        if (confirmBtn && onConfirm) {
            confirmBtn.addEventListener('click', () => {
                if (typeof onConfirm === 'function') {
                    onConfirm();
                }
                closeModal();
            });
        }
        
        // Close on overlay click
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) {
                closeModal();
            }
        });
        
        // Close on escape key
        const closeOnEscape = (e) => {
            if (e.key === 'Escape') {
                closeModal();
            }
        };
        
        document.addEventListener('keydown', closeOnEscape);
        modalOverlay.addEventListener('remove', () => {
            document.removeEventListener('keydown', closeOnEscape);
        });
        
        // Focus trap
        const focusableElements = modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
        const firstFocusable = focusableElements[0];
        const lastFocusable = focusableElements[focusableElements.length - 1];
        
        if (firstFocusable) {
            firstFocusable.focus();
        }
        
        modal.addEventListener('keydown', (e) => {
            if (e.key === 'Tab') {
                if (e.shiftKey) {
                    if (document.activeElement === firstFocusable) {
                        lastFocusable.focus();
                        e.preventDefault();
                    }
                } else {
                    if (document.activeElement === lastFocusable) {
                        firstFocusable.focus();
                        e.preventDefault();
                    }
                }
            }
        });
        
        return modalOverlay;
    }
    
    // Form Validation
    function validateForm(form) {
        const inputs = form.querySelectorAll('[required]');
        let isValid = true;
        
        inputs.forEach(input => {
            if (!validateField(input)) {
                isValid = false;
            }
        });
        
        return isValid;
    }
    
    function validateField(input) {
        const value = input.value.trim();
        let isValid = true;
        let errorMessage = '';
        
        // Check required
        if (input.hasAttribute('required') && !value) {
            isValid = false;
            errorMessage = input.dataset.requiredMessage || 'This field is required';
        }
        
        // Check min length
        if (isValid && input.hasAttribute('minlength')) {
            const minLength = parseInt(input.getAttribute('minlength'));
            if (value.length < minLength) {
                isValid = false;
                errorMessage = input.dataset.minlengthMessage || `Minimum ${minLength} characters required`;
            }
        }
        
        // Check max length
        if (isValid && input.hasAttribute('maxlength')) {
            const maxLength = parseInt(input.getAttribute('maxlength'));
            if (value.length > maxLength) {
                isValid = false;
                errorMessage = input.dataset.maxlengthMessage || `Maximum ${maxLength} characters allowed`;
            }
        }
        
        // Check pattern
        if (isValid && input.hasAttribute('pattern')) {
            const pattern = new RegExp(input.getAttribute('pattern'));
            if (!pattern.test(value)) {
                isValid = false;
                errorMessage = input.dataset.patternMessage || 'Invalid format';
            }
        }
        
        // Email validation
        if (isValid && input.type === 'email' && value) {
            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!emailRegex.test(value)) {
                isValid = false;
                errorMessage = input.dataset.emailMessage || 'Please enter a valid email address';
            }
        }
        
        // Update field state
        if (isValid) {
            markFieldValid(input);
        } else {
            markFieldInvalid(input, errorMessage);
        }
        
        return isValid;
    }
    
    function markFieldValid(input) {
        input.classList.remove('error');
        input.classList.add('valid');
        
        const error = input.nextElementSibling;
        if (error && error.classList.contains('error-message')) {
            error.remove();
        }
    }
    
    function markFieldInvalid(input, message) {
        input.classList.add('error');
        input.classList.remove('valid');
        
        let error = input.nextElementSibling;
        if (!error || !error.classList.contains('error-message')) {
            error = document.createElement('div');
            error.className = 'error-message';
            input.parentNode.appendChild(error);
        }
        error.textContent = message;
    }
    
    // File Upload Preview
    function initFileUpload(input, previewId) {
        if (!input || !previewId) return;
        
        const preview = document.getElementById(previewId);
        if (!preview) return;
        
        input.addEventListener('change', function(e) {
            preview.innerHTML = '';
            
            const files = e.target.files;
            if (!files || files.length === 0) return;
            
            Array.from(files).forEach(file => {
                if (!file.type.startsWith('image/')) {
                    showNotification('Please upload image files only', 'error');
                    return;
                }
                
                const reader = new FileReader();
                
                reader.onload = function(e) {
                    const img = document.createElement('img');
                    img.src = e.target.result;
                    img.alt = 'Preview';
                    img.className = 'upload-preview-img';
                    
                    const container = document.createElement('div');
                    container.className = 'upload-preview-item';
                    container.appendChild(img);
                    
                    // Add remove button
                    const removeBtn = document.createElement('button');
                    removeBtn.className = 'remove-preview';
                    removeBtn.innerHTML = '<i class="fas fa-times"></i>';
                    removeBtn.setAttribute('aria-label', 'Remove image');
                    removeBtn.addEventListener('click', () => {
                        container.remove();
                        // Clear file input
                        input.value = '';
                    });
                    
                    container.appendChild(removeBtn);
                    preview.appendChild(container);
                };
                
                reader.readAsDataURL(file);
            });
        });
    }
    
    // Tooltips
    function initTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            const tooltipText = element.getAttribute('data-tooltip');
            const tooltipPosition = element.getAttribute('data-tooltip-position') || 'top';
            
            element.addEventListener('mouseenter', (e) => {
                const tooltip = document.createElement('div');
                tooltip.className = `tooltip tooltip-${tooltipPosition}`;
                tooltip.textContent = tooltipText;
                
                document.body.appendChild(tooltip);
                
                // Position tooltip
                const rect = element.getBoundingClientRect();
                const tooltipRect = tooltip.getBoundingClientRect();
                
                switch(tooltipPosition) {
                    case 'top':
                        tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
                        tooltip.style.top = `${rect.top - tooltipRect.height - 8}px`;
                        break;
                    case 'bottom':
                        tooltip.style.left = `${rect.left + rect.width / 2 - tooltipRect.width / 2}px`;
                        tooltip.style.top = `${rect.bottom + 8}px`;
                        break;
                    case 'left':
                        tooltip.style.left = `${rect.left - tooltipRect.width - 8}px`;
                        tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
                        break;
                    case 'right':
                        tooltip.style.left = `${rect.right + 8}px`;
                        tooltip.style.top = `${rect.top + rect.height / 2 - tooltipRect.height / 2}px`;
                        break;
                }
                
                // Add arrow
                const arrow = document.createElement('div');
                arrow.className = 'tooltip-arrow';
                tooltip.appendChild(arrow);
                
                element.dataset.tooltipId = tooltip.id;
            });
            
            element.addEventListener('mouseleave', () => {
                const tooltipId = element.dataset.tooltipId;
                if (tooltipId) {
                    const tooltip = document.getElementById(tooltipId);
                    if (tooltip) {
                        tooltip.remove();
                    }
                    delete element.dataset.tooltipId;
                }
            });
        });
    }
    
    // Dropdowns
    function initDropdowns() {
        const dropdowns = document.querySelectorAll('.dropdown');
        
        dropdowns.forEach(dropdown => {
            const toggle = dropdown.querySelector('.dropdown-toggle');
            const menu = dropdown.querySelector('.dropdown-menu');
            
            if (!toggle || !menu) return;
            
            toggle.addEventListener('click', (e) => {
                e.stopPropagation();
                
                // Close other dropdowns
                dropdowns.forEach(other => {
                    if (other !== dropdown) {
                        other.classList.remove('open');
                    }
                });
                
                // Toggle current dropdown
                dropdown.classList.toggle('open');
            });
            
            // Close when clicking outside
            document.addEventListener('click', () => {
                dropdown.classList.remove('open');
            });
            
            // Prevent closing when clicking inside menu
            menu.addEventListener('click', (e) => {
                e.stopPropagation();
            });
        });
    }
    
    // Modals
    function initModals() {
        const modalTriggers = document.querySelectorAll('[data-modal]');
        
        modalTriggers.forEach(trigger => {
            const modalId = trigger.getAttribute('data-modal');
            const modal = document.getElementById(modalId);
            
            if (!modal) return;
            
            trigger.addEventListener('click', () => {
                modal.classList.add('active');
                document.body.style.overflow = 'hidden';
            });
            
            // Close buttons
            const closeButtons = modal.querySelectorAll('.modal-close, .modal-cancel');
            closeButtons.forEach(btn => {
                btn.addEventListener('click', () => {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });
            
            // Close on overlay click
            modal.addEventListener('click', (e) => {
                if (e.target === modal) {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
            
            // Close on escape key
            document.addEventListener('keydown', (e) => {
                if (e.key === 'Escape' && modal.classList.contains('active')) {
                    modal.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });
        });
    }
    
    // Local Storage Helper
    const Storage = {
        set(key, value) {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Storage error:', e);
                showNotification('Failed to save data', 'error');
                return false;
            }
        },
        
        get(key) {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('Storage error:', e);
                return null;
            }
        },
        
        remove(key) {
            localStorage.removeItem(key);
        },
        
        clear() {
            localStorage.clear();
        }
    };
    
    // Session Storage Helper
    const Session = {
        set(key, value) {
            try {
                sessionStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.error('Session storage error:', e);
                return false;
            }
        },
        
        get(key) {
            try {
                const item = sessionStorage.getItem(key);
                return item ? JSON.parse(item) : null;
            } catch (e) {
                console.error('Session storage error:', e);
                return null;
            }
        },
        
        remove(key) {
            sessionStorage.removeItem(key);
        },
        
        clear() {
            sessionStorage.clear();
        }
    };
    
    // API Helper
    const API = {
        async request(url, options = {}) {
            const defaultOptions = {
                headers: {
                    'Content-Type': 'application/json',
                },
            };
            
            const mergedOptions = {
                ...defaultOptions,
                ...options,
                headers: {
                    ...defaultOptions.headers,
                    ...options.headers,
                },
            };
            
            try {
                showLoading();
                const response = await fetch(url, mergedOptions);
                
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                
                const data = await response.json();
                hideLoading();
                return data;
            } catch (error) {
                hideLoading();
                showNotification(error.message || 'An error occurred', 'error');
                throw error;
            }
        },
        
        async get(url, options = {}) {
            return this.request(url, { ...options, method: 'GET' });
        },
        
        async post(url, data, options = {}) {
            return this.request(url, {
                ...options,
                method: 'POST',
                body: JSON.stringify(data),
            });
        },
        
        async put(url, data, options = {}) {
            return this.request(url, {
                ...options,
                method: 'PUT',
                body: JSON.stringify(data),
            });
        },
        
        async delete(url, options = {}) {
            return this.request(url, { ...options, method: 'DELETE' });
        },
    };
    
    // Format helpers
    const Format = {
        currency(amount, currency = 'INR') {
            return new Intl.NumberFormat('en-IN', {
                style: 'currency',
                currency: currency,
                minimumFractionDigits: 0,
            }).format(amount);
        },
        
        date(date, format = 'long') {
            const dateObj = new Date(date);
            
            const formats = {
                short: {
                    dateStyle: 'short',
                    timeStyle: 'short',
                },
                medium: {
                    dateStyle: 'medium',
                    timeStyle: 'short',
                },
                long: {
                    dateStyle: 'long',
                    timeStyle: 'short',
                },
            };
            
            return new Intl.DateTimeFormat('en-IN', formats[format] || formats.long).format(dateObj);
        },
        
        relativeTime(date) {
            const now = new Date();
            const diffInSeconds = Math.floor((now - new Date(date)) / 1000);
            
            const intervals = [
                { label: 'year', seconds: 31536000 },
                { label: 'month', seconds: 2592000 },
                { label: 'week', seconds: 604800 },
                { label: 'day', seconds: 86400 },
                { label: 'hour', seconds: 3600 },
                { label: 'minute', seconds: 60 },
                { label: 'second', seconds: 1 },
            ];
            
            for (const interval of intervals) {
                const count = Math.floor(diffInSeconds / interval.seconds);
                if (count >= 1) {
                    return count === 1 ? `1 ${interval.label} ago` : `${count} ${interval.label}s ago`;
                }
            }
            
            return 'just now';
        },
        
        truncate(text, maxLength = 100) {
            if (text.length <= maxLength) return text;
            return text.substring(0, maxLength) + '...';
        },
    };
    
    // Initialize on DOM load
    document.addEventListener('DOMContentLoaded', init);
    
    // Public API
    return {
        // Core
        init,
        showNotification,
        showLoading,
        hideLoading,
        showModal,
        
        // Forms
        validateForm,
        validateField,
        initFileUpload,
        
        // Storage
        Storage,
        Session,
        
        // API
        API,
        
        // Format
        Format,
        
        // Utilities
        debounce(func, wait) {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },
        
        throttle(func, limit) {
            let inThrottle;
            return function executedFunction(...args) {
                if (!inThrottle) {
                    func(...args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        },
        
        copyToClipboard(text) {
            navigator.clipboard.writeText(text)
                .then(() => showNotification('Copied to clipboard', 'success'))
                .catch(() => showNotification('Failed to copy', 'error'));
        },
        
        generateId() {
            return 'id_' + Math.random().toString(36).substr(2, 9);
        },
        
        scrollToElement(selector, offset = 0) {
            const element = document.querySelector(selector);
            if (element) {
                const elementPosition = element.getBoundingClientRect().top;
                const offsetPosition = elementPosition + window.pageYOffset - offset;
                
                window.scrollTo({
                    top: offsetPosition,
                    behavior: 'smooth'
                });
            }
        },
    };
})();

// Make Components available globally
window.Components = Components;