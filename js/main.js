// js/main.js - Core Application Logic

class ArtisanConnect {
    constructor() {
        this.init();
    }

    init() {
        console.log('ArtisanConnect initialized successfully');
        
        // Initialize common components
        this.initCommon();
        
        // Initialize page-specific functionality
        this.initPageSpecific();
        
        // Initialize event listeners
        this.initEventListeners();
    }

    initCommon() {
        // Set current year in footer
        this.setCurrentYear();
        
        // Initialize mobile menu
        this.initMobileMenu();
        
        // Initialize back to top button
        this.initBackToTop();
        
        // Initialize search functionality
        this.initSearch();
    }

    initPageSpecific() {
        const bodyClass = document.body.className;
        
        if (bodyClass.includes('about-page')) {
            this.initAboutPage();
        } else if (bodyClass.includes('artisans-page')) {
            this.initArtisansPage();
        } else if (bodyClass.includes('profile-page')) {
            this.initProfilePage();
        } else if (bodyClass.includes('join-page')) {
            this.initJoinPage();
        }
    }

    initEventListeners() {
        // Header scroll effect
        window.addEventListener('scroll', () => {
            const header = document.querySelector('.main-header');
            if (window.scrollY > 50) {
                header.classList.add('scrolled');
            } else {
                header.classList.remove('scrolled');
            }
        });
    }

    setCurrentYear() {
        const yearElements = document.querySelectorAll('#currentYear');
        yearElements.forEach(el => {
            el.textContent = new Date().getFullYear();
        });
    }

    initMobileMenu() {
        const menuToggle = document.getElementById('menuToggle');
        const mainNav = document.getElementById('mainNav');
        
        if (menuToggle && mainNav) {
            menuToggle.addEventListener('click', () => {
                mainNav.classList.toggle('active');
                menuToggle.classList.toggle('active');
                document.body.style.overflow = mainNav.classList.contains('active') ? 'hidden' : '';
            });

            // Close menu when clicking outside
            document.addEventListener('click', (e) => {
                if (!mainNav.contains(e.target) && !menuToggle.contains(e.target)) {
                    mainNav.classList.remove('active');
                    menuToggle.classList.remove('active');
                    document.body.style.overflow = '';
                }
            });

            // Close menu when clicking on a link
            const navLinks = mainNav.querySelectorAll('.nav-link');
            navLinks.forEach(link => {
                link.addEventListener('click', () => {
                    mainNav.classList.remove('active');
                    menuToggle.classList.remove('active');
                    document.body.style.overflow = '';
                });
            });
        }
    }

    initBackToTop() {
        const backToTop = document.getElementById('backToTop');
        
        if (backToTop) {
            window.addEventListener('scroll', () => {
                if (window.pageYOffset > 300) {
                    backToTop.classList.add('visible');
                } else {
                    backToTop.classList.remove('visible');
                }
            });
            
            backToTop.addEventListener('click', () => {
                window.scrollTo({ top: 0, behavior: 'smooth' });
            });
        }
    }

    initSearch() {
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.querySelector('.search-input');
        
        if (searchBtn && searchInput) {
            searchBtn.addEventListener('click', () => {
                if (searchInput.value.trim()) {
                    window.location.href = `artisans.html?search=${encodeURIComponent(searchInput.value)}`;
                }
            });
            
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter' && searchInput.value.trim()) {
                    window.location.href = `artisans.html?search=${encodeURIComponent(searchInput.value)}`;
                }
            });
        }
    }

    initAboutPage() {
        // FAQ Accordion
        const faqItems = document.querySelectorAll('.faq-item');
        
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            
            question.addEventListener('click', () => {
                // Close other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // Toggle current item
                item.classList.toggle('active');
            });
        });
    }

    initArtisansPage() {
        // View toggle
        const viewToggles = document.querySelectorAll('.view-toggle');
        const artisansContainer = document.getElementById('artisansContainer');
        
        viewToggles.forEach(toggle => {
            toggle.addEventListener('click', () => {
                const view = toggle.dataset.view;
                
                // Update active state
                viewToggles.forEach(t => t.classList.remove('active'));
                toggle.classList.add('active');
                
                // Change view class
                if (artisansContainer) {
                    artisansContainer.classList.remove('view-grid', 'view-list');
                    artisansContainer.classList.add(`view-${view}`);
                }
            });
        });

        // Map toggle
        const mapToggle = document.getElementById('mapToggle');
        const mapView = document.getElementById('mapView');
        
        if (mapToggle && mapView) {
            mapToggle.addEventListener('click', () => {
                const isVisible = mapView.style.display === 'block';
                mapView.style.display = isVisible ? 'none' : 'block';
                mapToggle.innerHTML = isVisible ? 
                    '<i class="fas fa-map"></i> Show Map' : 
                    '<i class="fas fa-list"></i> Hide Map';
                
                // Hide/show artisans container
                if (artisansContainer) {
                    artisansContainer.style.display = isVisible ? 'block' : 'none';
                }
            });
        }
    }

    initProfilePage() {
        // Contact modal
        const contactBtn = document.getElementById('contactBtn');
        const contactModal = document.getElementById('contactModal');
        const modalClose = document.getElementById('modalClose');
        
        if (contactBtn && contactModal && modalClose) {
            contactBtn.addEventListener('click', () => {
                contactModal.classList.add('active');
            });
            
            modalClose.addEventListener('click', () => {
                contactModal.classList.remove('active');
            });
            
            // Close modal when clicking outside
            contactModal.addEventListener('click', (e) => {
                if (e.target === contactModal) {
                    contactModal.classList.remove('active');
                }
            });
            
            // Contact form submission
            const contactForm = document.getElementById('contactForm');
            if (contactForm) {
                contactForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    // Add your form submission logic here
                    alert('Message sent successfully!');
                    contactModal.classList.remove('active');
                    contactForm.reset();
                });
            }
        }
    }

    initJoinPage() {
        // Choice selection
        const choiceSelects = document.querySelectorAll('.choice-select');
        const formsSection = document.getElementById('formsSection');
        const artisanForm = document.getElementById('artisanForm');
        const supporterForm = document.getElementById('supporterForm');
        
        choiceSelects.forEach(select => {
            select.addEventListener('click', () => {
                const type = select.dataset.type;
                
                // Show appropriate form
                if (artisanForm && supporterForm) {
                    artisanForm.style.display = type === 'artisan' ? 'block' : 'none';
                    supporterForm.style.display = type === 'supporter' ? 'block' : 'none';
                }
                
                // Scroll to forms section
                if (formsSection) {
                    formsSection.scrollIntoView({ behavior: 'smooth' });
                }
            });
        });
        
        // Multi-step form
        const nextSteps = document.querySelectorAll('.next-step');
        const prevSteps = document.querySelectorAll('.prev-step');
        const steps = document.querySelectorAll('.form-step');
        
        nextSteps.forEach(button => {
            button.addEventListener('click', () => {
                const nextStep = button.dataset.next;
                const currentStep = button.closest('.form-step').dataset.step;
                
                // Validate current step
                if (this.validateStep(currentStep)) {
                    this.goToStep(nextStep);
                }
            });
        });
        
        prevSteps.forEach(button => {
            button.addEventListener('click', () => {
                const prevStep = button.dataset.prev;
                this.goToStep(prevStep);
            });
        });
        
        // Form submission
        const artisanRegistrationForm = document.getElementById('artisanRegistrationForm');
        const supporterRegistrationForm = document.getElementById('supporterRegistrationForm');
        const successMessage = document.getElementById('successMessage');
        
        if (artisanRegistrationForm) {
            artisanRegistrationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.validateForm(artisanRegistrationForm)) {
                    this.showSuccessMessage(artisanRegistrationForm, successMessage);
                }
            });
        }
        
        if (supporterRegistrationForm) {
            supporterRegistrationForm.addEventListener('submit', (e) => {
                e.preventDefault();
                if (this.validateForm(supporterRegistrationForm)) {
                    this.showSuccessMessage(supporterRegistrationForm, successMessage);
                }
            });
        }
        
        // FAQ Accordion
        const faqItems = document.querySelectorAll('.faq-item');
        
        faqItems.forEach(item => {
            const question = item.querySelector('.faq-question');
            
            question.addEventListener('click', () => {
                // Close other items
                faqItems.forEach(otherItem => {
                    if (otherItem !== item && otherItem.classList.contains('active')) {
                        otherItem.classList.remove('active');
                    }
                });
                
                // Toggle current item
                item.classList.toggle('active');
            });
        });
    }

    validateStep(step) {
        // Get all required fields in current step
        const currentStep = document.querySelector(`.form-step[data-step="${step}"]`);
        if (!currentStep) return true;
        
        const requiredFields = currentStep.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            } else {
                field.classList.remove('error');
            }
        });
        
        return isValid;
    }

    goToStep(stepNumber) {
        const steps = document.querySelectorAll('.form-step');
        const stepElements = document.querySelectorAll('.step');
        const progressFill = document.querySelector('.progress-fill');
        
        // Update step visibility
        steps.forEach(step => {
            step.classList.remove('active');
            if (step.dataset.step === stepNumber) {
                step.classList.add('active');
            }
        });
        
        // Update progress bar
        stepElements.forEach((stepEl, index) => {
            stepEl.classList.remove('active', 'completed');
            const stepNum = parseInt(stepEl.dataset.step);
            
            if (stepNum < stepNumber) {
                stepEl.classList.add('completed');
            } else if (stepNum == stepNumber) {
                stepEl.classList.add('active');
            }
        });
        
        // Update progress bar width
        if (progressFill) {
            const percentage = ((stepNumber - 1) / (stepElements.length - 1)) * 100;
            progressFill.style.width = `${percentage}%`;
        }
        
        // Scroll to top of form
        const form = document.querySelector('.registration-form');
        if (form) {
            form.scrollTop = 0;
        }
    }

    validateForm(form) {
        const requiredFields = form.querySelectorAll('[required]');
        let isValid = true;
        
        requiredFields.forEach(field => {
            if (!field.value.trim()) {
                field.classList.add('error');
                isValid = false;
            } else {
                field.classList.remove('error');
            }
            
            // Email validation
            if (field.type === 'email' && field.value) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(field.value)) {
                    field.classList.add('error');
                    isValid = false;
                }
            }
        });
        
        return isValid;
    }

    showSuccessMessage(form, successMessage) {
        if (form && successMessage) {
            form.style.display = 'none';
            successMessage.style.display = 'block';
            
            // Scroll to success message
            successMessage.scrollIntoView({ behavior: 'smooth' });
        }
    }

    // Utility function to show notifications
    showNotification(message, type = 'info') {
        if (typeof Components !== 'undefined' && Components.showNotification) {
            Components.showNotification(message, type);
        } else {
            // Fallback notification
            const notification = document.createElement('div');
            notification.className = `notification notification-${type}`;
            notification.innerHTML = `
                <div class="notification-content">
                    <i class="fas fa-info-circle"></i>
                    <span>${message}</span>
                </div>
            `;
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.remove();
            }, 3000);
        }
    }
}

// Initialize the app when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.App = new ArtisanConnect();
});

// Export the classes and utilities
export { ArtisanConnect };

// Utility functions
export const Utils = {
    showNotification: (message, type = 'info') => {
        if (typeof Components !== 'undefined' && Components.showNotification) {
            Components.showNotification(message, type);
        } else {
            // Fallback
            alert(message);
        }
    },
    
    toggleLoading: (show, message = 'Loading...') => {
        if (show) {
            Components?.showLoading(message);
        } else {
            Components?.hideLoading();
        }
    },
    
    showLoading: (show, message) => {
        if (show) {
            Components?.showLoading(message);
        } else {
            Components?.hideLoading();
        }
    },
    
    formatDate: (date) => {
        return new Date(date).toLocaleDateString();
    }
};