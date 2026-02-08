// ===== ARTISAN PROFILE PAGE =====
// Enhanced profile functionality with better UI/UX

import { Components, Utils } from './components.js';
import { artisanDB, userDB, reviewDB, messageDB } from './database.js';

class ArtisanProfile {
    constructor() {
        this.artisanId = this.getArtisanIdFromURL();
        this.currentUser = null;
        this.artisanData = null;
        this.isFavorite = false;
        this.isLoading = false;
        this.reviews = [];
        
        this.init();
    }

    async init() {
        try {
            // Get current user
            this.currentUser = JSON.parse(localStorage.getItem('currentUser'));
            
            // Load all data
            await this.loadAllData();
            
            // Initialize UI
            this.initUI();
            this.setupEventListeners();
            
            // Load initial reviews
            await this.loadReviews();
            
        } catch (error) {
            console.error('Error initializing profile:', error);
            Components.showNotification('Failed to load artisan profile', 'error', 5000);
        }
    }

    async loadAllData() {
        this.isLoading = true;
        Components.showLoading(true, 'Loading artisan profile...');
        
        try {
            // Load artisan data from Firebase
            if (this.artisanId) {
                this.artisanData = await artisanDB.getArtisanById(this.artisanId);
                
                if (!this.artisanData) {
                    // Fallback to sample data if not in Firebase
                    this.artisanData = await this.getSampleArtisanData();
                }
            } else {
                this.artisanData = await this.getSampleArtisanData();
            }
            
            // Increment view count in Firebase
            if (this.artisanId) {
                await artisanDB.incrementViewCount(this.artisanId);
            }
            
            // Check if favorite (from Firebase or localStorage)
            await this.checkIfFavorite();
            
            // Update UI
            this.updateProfileUI();
            
            // Initialize map
            this.initMap();
            
        } catch (error) {
            console.error('Error loading data:', error);
            this.artisanData = await this.getSampleArtisanData();
            this.updateProfileUI();
        } finally {
            this.isLoading = false;
            Components.showLoading(false);
        }
    }

    getArtisanIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        const id = urlParams.get('id');
        
        if (!id) {
            console.warn('No artisan ID in URL, using default');
            return '1'; // Default sample artisan
        }
        
        return id;
    }

    async getSampleArtisanData() {
        // Extended sample data with more details
        const artisans = [
            {
                id: '1',
                name: 'Rajesh Kumar',
                craft: 'Pottery',
                specialty: 'Terracotta & Blue Pottery',
                description: 'Master potter with 15+ years of experience in traditional Indian pottery techniques. Specializes in terracotta and blue pottery with intricate hand-painted designs. Each piece is unique and crafted with precision.',
                location: {
                    city: 'Delhi',
                    state: 'Delhi',
                    address: 'Craft Street, Artisan Colony, New Delhi 110001',
                    latitude: 28.6139,
                    longitude: 77.2090
                },
                experience: 15,
                rating: 4.8,
                reviewCount: 124,
                viewCount: 345,
                featured: true,
                verified: true,
                imageUrl: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                tags: ['Handmade', 'Terracotta', 'Blue Pottery', 'Traditional', 'Eco-friendly'],
                skills: ['Pottery Wheel', 'Hand Building', 'Glazing', 'Firing', 'Design'],
                contact: {
                    phone: '+91 98765 43210',
                    email: 'rajesh@artisanconnect.com',
                    availability: 'Mon-Sat, 10AM-6PM'
                },
                social: {
                    instagram: 'https://instagram.com/rajeshpottery',
                    facebook: 'https://facebook.com/rajeshpottery'
                },
                gallery: [
                    'https://images.unsplash.com/photo-1574732011388-8e9d1ef52d5b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1559056199-641a0ac8b55e?ixlib=rb-4.0.3&auto=format&fit=crop&w-800&q=80',
                    'https://images.unsplash.com/photo-1581655353564-df123a1eb820?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                    'https://images.unsplash.com/photo-1513475382585-d06e58bcb0e0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80'
                ],
                awards: ['National Craft Award 2020', 'State Excellence Award 2021'],
                languages: ['Hindi', 'English', 'Punjabi']
            }
        ];
        
        return artisans.find(a => a.id === this.artisanId) || artisans[0];
    }

    async checkIfFavorite() {
        if (!this.currentUser) {
            // Check localStorage if not logged in
            const favorites = JSON.parse(localStorage.getItem('artisanFavorites')) || [];
            this.isFavorite = favorites.includes(this.artisanId);
            return;
        }
        
        try {
            // Check Firebase for logged in users
            const result = await userDB.isFavorite(this.currentUser.uid, this.artisanId);
            this.isFavorite = result.isFavorite;
        } catch (error) {
            console.warn('Could not check favorites from Firebase:', error);
            // Fallback to localStorage
            const favorites = JSON.parse(localStorage.getItem('artisanFavorites')) || [];
            this.isFavorite = favorites.includes(this.artisanId);
        }
    }

    initUI() {
        // Initialize all UI elements
        this.elements = {
            profileMain: document.getElementById('profileMain'),
            contactBtn: document.getElementById('contactBtn'),
            callBtn: document.getElementById('callBtn'),
            whatsappBtn: document.getElementById('whatsappBtn'),
            saveArtisanBtn: document.getElementById('saveArtisanBtn'),
            contactModal: document.getElementById('contactModal'),
            contactForm: document.getElementById('contactForm'),
            modalClose: document.querySelectorAll('.modal-close'),
            map: document.getElementById('map'),
            galleryGrid: document.getElementById('galleryGrid'),
            reviewsList: document.getElementById('reviewsList'),
            loadMoreReviews: document.getElementById('loadMoreReviews'),
            tabs: document.querySelectorAll('.tab-btn'),
            tabContents: document.querySelectorAll('.tab-content'),
            reviewForm: document.getElementById('reviewForm'),
            submitReviewBtn: document.getElementById('submitReviewBtn'),
            ratingStars: document.querySelectorAll('.rating-star'),
            galleryModal: document.getElementById('galleryModal'),
            galleryModalImage: document.getElementById('galleryModalImage'),
            galleryModalClose: document.getElementById('galleryModalClose')
        };
    }

    setupEventListeners() {
        // Contact buttons
        this.elements.contactBtn?.addEventListener('click', () => this.showContactModal());
        document.getElementById('contactProfileBtn')?.addEventListener('click', () => this.showContactModal());

        // Call button
        this.elements.callBtn?.addEventListener('click', () => {
            if (this.artisanData?.contact?.phone) {
                window.location.href = `tel:${this.artisanData.contact.phone}`;
            }
        });

        // WhatsApp button
        this.elements.whatsappBtn?.addEventListener('click', () => {
            if (this.artisanData?.contact?.phone) {
                const message = `Hi ${this.artisanData.name}, I'm interested in your ${this.artisanData.craft} work!`;
                window.open(`https://wa.me/${this.artisanData.contact.phone.replace('+', '')}?text=${encodeURIComponent(message)}`, '_blank');
            }
        });

        // Save artisan buttons
        this.elements.saveArtisanBtn?.addEventListener('click', () => this.toggleFavorite());
        document.getElementById('saveProfileBtn')?.addEventListener('click', () => this.toggleFavorite());

        // Contact form
        this.elements.contactForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitContactForm();
        });

        // Modal close buttons
        this.elements.modalClose?.forEach(btn => {
            btn.addEventListener('click', () => {
                this.hideContactModal();
                this.hideGalleryModal();
            });
        });

        // Close modals on overlay click
        document.querySelectorAll('.modal-overlay').forEach(overlay => {
            overlay.addEventListener('click', (e) => {
                if (e.target === overlay) {
                    this.hideContactModal();
                    this.hideGalleryModal();
                }
            });
        });

        // Tabs
        this.elements.tabs?.forEach(tab => {
            tab.addEventListener('click', () => this.switchTab(tab.dataset.tab));
        });

        // Reviews
        this.elements.loadMoreReviews?.addEventListener('click', () => this.loadMoreReviews());
        
        // Review form
        this.elements.reviewForm?.addEventListener('submit', (e) => {
            e.preventDefault();
            this.submitReview();
        });

        // Rating stars
        this.elements.ratingStars?.forEach(star => {
            star.addEventListener('click', () => this.setRating(parseInt(star.dataset.rating)));
            star.addEventListener('mouseover', () => this.hoverRating(parseInt(star.dataset.rating)));
        });

        // Gallery images
        this.setupGalleryEvents();
    }

    setupGalleryEvents() {
        // Gallery image click
        document.addEventListener('click', (e) => {
            const galleryItem = e.target.closest('.gallery-item img');
            if (galleryItem) {
                this.showGalleryModal(galleryItem.src);
            }
        });

        // Gallery modal close
        this.elements.galleryModalClose?.addEventListener('click', () => this.hideGalleryModal());
        
        // Close gallery modal on overlay click
        this.elements.galleryModal?.addEventListener('click', (e) => {
            if (e.target === this.elements.galleryModal) {
                this.hideGalleryModal();
            }
        });
    }

    updateProfileUI() {
        if (!this.artisanData || !this.elements.profileMain) return;

        // Enhanced profile header with better layout
        const profileHTML = `
            <div class="profile-header">
                <div class="profile-image-container">
                    <div class="profile-image">
                        <img src="${this.artisanData.imageUrl || 'images/default-artisan.jpg'}" 
                             alt="${this.artisanData.name}"
                             class="profile-img">
                        ${this.artisanData.verified ? 
                            '<div class="verification-badge" title="Verified Artisan"><i class="fas fa-check-circle"></i></div>' : ''}
                        ${this.artisanData.featured ? 
                            '<div class="featured-badge" title="Featured Artisan"><i class="fas fa-star"></i></div>' : ''}
                    </div>
                    <div class="profile-actions-mobile">
                        <button class="btn btn-primary btn-icon" id="mobileContactBtn">
                            <i class="fas fa-envelope"></i>
                        </button>
                        <button class="btn btn-outline btn-icon ${this.isFavorite ? 'active' : ''}" id="mobileSaveBtn">
                            <i class="fas fa-heart"></i>
                        </button>
                        <button class="btn btn-outline btn-icon" id="mobileShareBtn">
                            <i class="fas fa-share-alt"></i>
                        </button>
                    </div>
                </div>
                
                <div class="profile-info">
                    <div class="profile-header-top">
                        <div>
                            <h1 class="profile-name">${this.artisanData.name}</h1>
                            <div class="profile-meta">
                                <span class="profile-craft">
                                    <i class="fas fa-palette"></i>
                                    ${this.artisanData.craft}
                                </span>
                                <span class="profile-specialty">
                                    <i class="fas fa-award"></i>
                                    ${this.artisanData.specialty}
                                </span>
                            </div>
                        </div>
                        <div class="profile-rating-large">
                            <div class="rating-display">
                                <div class="rating-value">${this.artisanData.rating}</div>
                                ${Components.generateStarRating(this.artisanData.rating, true)}
                                <div class="rating-count">(${this.artisanData.reviewCount} reviews)</div>
                            </div>
                        </div>
                    </div>
                    
                    <p class="profile-location">
                        <i class="fas fa-map-marker-alt"></i>
                        ${this.artisanData.location?.city}, ${this.artisanData.location?.state}
                        <span class="profile-distance">• 2.5 km away</span>
                    </p>
                    
                    <p class="profile-description">
                        ${this.artisanData.description}
                    </p>
                    
                    <div class="profile-stats">
                        <div class="profile-stat">
                            <div class="stat-icon">
                                <i class="fas fa-calendar-alt"></i>
                            </div>
                            <div class="stat-content">
                                <span class="number">${this.artisanData.experience}+</span>
                                <span class="label">Years Experience</span>
                            </div>
                        </div>
                        <div class="profile-stat">
                            <div class="stat-icon">
                                <i class="fas fa-eye"></i>
                            </div>
                            <div class="stat-content">
                                <span class="number">${this.artisanData.viewCount || 0}</span>
                                <span class="label">Profile Views</span>
                            </div>
                        </div>
                        <div class="profile-stat">
                            <div class="stat-icon">
                                <i class="fas fa-medal"></i>
                            </div>
                            <div class="stat-content">
                                <span class="number">${this.artisanData.awards?.length || 0}</span>
                                <span class="label">Awards</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="profile-tags">
                        ${(this.artisanData.tags || []).map(tag => `
                            <span class="tag">${tag}</span>
                        `).join('')}
                    </div>
                </div>
                
                <div class="profile-actions-desktop">
                    <button class="btn btn-primary" id="contactProfileBtn">
                        <i class="fas fa-envelope"></i> Contact Artisan
                    </button>
                    <button class="btn btn-outline ${this.isFavorite ? 'active' : ''}" id="saveProfileBtn">
                        <i class="fas fa-heart"></i> ${this.isFavorite ? 'Saved' : 'Save'}
                    </button>
                    <button class="btn btn-outline" id="shareProfileBtn">
                        <i class="fas fa-share-alt"></i> Share
                    </button>
                </div>
            </div>
        `;

        this.elements.profileMain.innerHTML = profileHTML;
        
        // Update all other sections
        this.updateAboutSection();
        this.updateGallery();
        this.updateSaveButton();
        this.updateTabs();
        
        // Setup mobile event listeners
        this.setupMobileEvents();
    }

    setupMobileEvents() {
        // Mobile contact button
        document.getElementById('mobileContactBtn')?.addEventListener('click', () => {
            this.showContactModal();
        });

        // Mobile save button
        document.getElementById('mobileSaveBtn')?.addEventListener('click', () => {
            this.toggleFavorite();
        });

        // Mobile share button
        document.getElementById('mobileShareBtn')?.addEventListener('click', () => {
            this.shareProfile();
        });
    }

    updateAboutSection() {
        // Update skills
        const skillsElement = document.getElementById('skillsList');
        if (skillsElement && this.artisanData.skills) {
            skillsElement.innerHTML = this.artisanData.skills
                .map(skill => `
                    <div class="skill-item">
                        <i class="fas fa-check-circle"></i>
                        <span>${skill}</span>
                    </div>
                `)
                .join('');
        }

        // Update contact info
        const contactElement = document.getElementById('contactInfo');
        if (contactElement && this.artisanData.contact) {
            contactElement.innerHTML = `
                <div class="contact-details">
                    <div class="contact-item">
                        <div class="contact-icon">
                            <i class="fas fa-phone"></i>
                        </div>
                        <div class="contact-content">
                            <div class="contact-label">Phone</div>
                            <a href="tel:${this.artisanData.contact.phone}" class="contact-value">
                                ${this.artisanData.contact.phone || 'Not provided'}
                            </a>
                        </div>
                    </div>
                    <div class="contact-item">
                        <div class="contact-icon">
                            <i class="fas fa-envelope"></i>
                        </div>
                        <div class="contact-content">
                            <div class="contact-label">Email</div>
                            <a href="mailto:${this.artisanData.contact.email}" class="contact-value">
                                ${this.artisanData.contact.email || 'Not provided'}
                            </a>
                        </div>
                    </div>
                    ${this.artisanData.contact.availability ? `
                    <div class="contact-item">
                        <div class="contact-icon">
                            <i class="fas fa-clock"></i>
                        </div>
                        <div class="contact-content">
                            <div class="contact-label">Availability</div>
                            <div class="contact-value">${this.artisanData.contact.availability}</div>
                        </div>
                    </div>
                    ` : ''}
                </div>
            `;
        }

        // Update languages
        const languagesElement = document.getElementById('languagesList');
        if (languagesElement && this.artisanData.languages) {
            languagesElement.innerHTML = this.artisanData.languages
                .map(lang => `<span class="language-tag">${lang}</span>`)
                .join('');
        }

        // Update awards
        const awardsElement = document.getElementById('awardsList');
        if (awardsElement && this.artisanData.awards) {
            awardsElement.innerHTML = this.artisanData.awards
                .map(award => `
                    <div class="award-item">
                        <i class="fas fa-trophy"></i>
                        <span>${award}</span>
                    </div>
                `)
                .join('');
        }
    }

    updateGallery() {
        if (!this.elements.galleryGrid || !this.artisanData.gallery) return;
        
        const galleryItems = this.artisanData.gallery.slice(0, 6);
        const galleryHTML = galleryItems
            .map((img, index) => `
                <div class="gallery-item ${index === 0 ? 'featured' : ''}">
                    <img src="${img}" 
                         alt="Artisan work ${index + 1}" 
                         loading="lazy"
                         class="gallery-img">
                    ${index === 0 ? '<span class="gallery-badge">Featured</span>' : ''}
                    <div class="gallery-overlay">
                        <i class="fas fa-search-plus"></i>
                    </div>
                </div>
            `)
            .join('');
        
        this.elements.galleryGrid.innerHTML = galleryHTML;
    }

    async loadReviews() {
        try {
            if (!this.artisanId) return;
            
            Components.showLoading(true, 'Loading reviews...');
            
            // Load reviews from Firebase
            this.reviews = await reviewDB.getArtisanReviews(this.artisanId, 5);
            this.displayReviews();
            
        } catch (error) {
            console.error('Error loading reviews:', error);
            this.displayReviews([]);
        } finally {
            Components.showLoading(false);
        }
    }

    async loadMoreReviews() {
        try {
            Components.showLoading(true, 'Loading more reviews...');
            
            // Load next batch from Firebase
            const moreReviews = await reviewDB.getArtisanReviews(this.artisanId, 5, this.reviews.length);
            
            if (moreReviews.length > 0) {
                this.reviews = [...this.reviews, ...moreReviews];
                this.displayReviews();
            } else {
                Components.showNotification('No more reviews to load', 'info');
                this.elements.loadMoreReviews?.classList.add('hidden');
            }
            
        } catch (error) {
            console.error('Error loading more reviews:', error);
            Components.showNotification('Failed to load more reviews', 'error');
        } finally {
            Components.showLoading(false);
        }
    }

    displayReviews() {
        if (!this.elements.reviewsList) return;
        
        if (this.reviews.length === 0) {
            this.elements.reviewsList.innerHTML = `
                <div class="no-reviews">
                    <i class="fas fa-comment-slash"></i>
                    <h3>No reviews yet</h3>
                    <p>Be the first to review this artisan!</p>
                    ${this.currentUser ? 
                        '<button class="btn btn-primary" id="writeFirstReview">Write First Review</button>' : 
                        '<p>Login to write a review</p>'
                    }
                </div>
            `;
            
            document.getElementById('writeFirstReview')?.addEventListener('click', () => {
                document.getElementById('writeReviewBtn')?.click();
            });
            
            return;
        }
        
        const reviewsHTML = this.reviews
            .map(review => `
                <div class="review-item">
                    <div class="review-header">
                        <div class="reviewer-info">
                            <div class="reviewer-avatar ${review.reviewerAvatar ? '' : 'default'}">
                                ${review.reviewerAvatar ? 
                                    `<img src="${review.reviewerAvatar}" alt="${review.reviewerName}">` : 
                                    `<i class="fas fa-user-circle"></i>`
                                }
                            </div>
                            <div class="reviewer-details">
                                <div class="reviewer-name">${review.reviewerName || 'Anonymous'}</div>
                                <div class="review-meta">
                                    <span class="review-date">${Utils.formatDate(review.createdAt)}</span>
                                    <span class="review-location">${review.reviewerLocation || ''}</span>
                                </div>
                            </div>
                        </div>
                        <div class="review-rating">
                            ${Components.generateStarRating(review.rating)}
                            <span class="rating-number">${review.rating.toFixed(1)}</span>
                        </div>
                    </div>
                    <div class="review-content">
                        <h4 class="review-title">${review.title || 'Great experience!'}</h4>
                        <p>${review.comment || 'No comment provided.'}</p>
                    </div>
                    ${review.images?.length > 0 ? `
                    <div class="review-images">
                        ${review.images.slice(0, 3).map(img => `
                            <img src="${img}" alt="Review image" class="review-image">
                        `).join('')}
                        ${review.images.length > 3 ? 
                            `<div class="review-image-more">+${review.images.length - 3} more</div>` : ''
                        }
                    </div>
                    ` : ''}
                </div>
            `)
            .join('');
        
        this.elements.reviewsList.innerHTML = reviewsHTML;
        
        // Show/hide load more button
        if (this.elements.loadMoreReviews) {
            this.elements.loadMoreReviews.classList.toggle('hidden', this.reviews.length < 5);
        }
    }

    async submitReview() {
        if (!this.currentUser) {
            Components.showNotification('Please login to submit a review', 'warning');
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            return;
        }
        
        const rating = document.querySelector('.rating-star.active')?.dataset.rating;
        const comment = document.getElementById('reviewComment').value;
        const title = document.getElementById('reviewTitle').value;
        
        if (!rating) {
            Components.showNotification('Please select a rating', 'warning');
            return;
        }
        
        if (!comment.trim()) {
            Components.showNotification('Please write a review comment', 'warning');
            return;
        }
        
        const reviewData = {
            artisanId: this.artisanId,
            userId: this.currentUser.uid,
            userName: this.currentUser.name || this.currentUser.email,
            userAvatar: this.currentUser.photoURL,
            rating: parseInt(rating),
            comment: comment.trim(),
            title: title.trim(),
            createdAt: new Date().toISOString(),
            helpfulCount: 0
        };
        
        try {
            Components.showLoading(true, 'Submitting review...');
            
            // Save to Firebase
            const result = await reviewDB.addReview(reviewData);
            
            if (result.success) {
                Components.showNotification('Review submitted successfully!', 'success');
                
                // Refresh reviews
                await this.loadReviews();
                
                // Clear form
                document.getElementById('reviewForm').reset();
                this.resetRating();
                
                // Close review modal if exists
                const reviewModal = document.getElementById('reviewModal');
                if (reviewModal) {
                    reviewModal.classList.remove('active');
                }
            } else {
                Components.showNotification('Failed to submit review', 'error');
            }
            
        } catch (error) {
            console.error('Error submitting review:', error);
            Components.showNotification('Failed to submit review', 'error');
        } finally {
            Components.showLoading(false);
        }
    }

    setRating(rating) {
        if (!this.elements.ratingStars) return;
        
        this.elements.ratingStars.forEach(star => {
            const starRating = parseInt(star.dataset.rating);
            star.classList.toggle('active', starRating <= rating);
        });
        
        // Update rating display
        const ratingValue = document.querySelector('.selected-rating');
        if (ratingValue) {
            ratingValue.textContent = rating;
        }
    }

    hoverRating(rating) {
        if (!this.elements.ratingStars) return;
        
        this.elements.ratingStars.forEach(star => {
            const starRating = parseInt(star.dataset.rating);
            star.classList.toggle('hover', starRating <= rating);
        });
    }

    resetRating() {
        if (!this.elements.ratingStars) return;
        
        this.elements.ratingStars.forEach(star => {
            star.classList.remove('active', 'hover');
        });
        
        const ratingValue = document.querySelector('.selected-rating');
        if (ratingValue) {
            ratingValue.textContent = '0';
        }
    }

      initMap() {
    // Check if map container exists in your HTML
    const mapContainer = document.getElementById('map');
    if (!mapContainer || !this.artisanData.location) {
        console.warn('Map container not found or no location data');
        return;
    }
    
    const location = this.artisanData.location;
    
    // YOUR GEOAPIFY API KEY
    const apiKey = 'd995f6e9e9094d6185e3b3fbc2754d9c';
    
    // Get the static map image URL
    const staticMapUrl = this.generateGeoapifyStaticMap(location, apiKey);
    
    // Create the complete location section HTML
    const locationHTML = `
        <div class="studio-location-section">
            <div class="location-header">
                <h2><i class="fas fa-map-marker-alt"></i> Studio Location</h2>
                <div class="location-badges">
                    <span class="badge badge-parking"><i class="fas fa-parking"></i> Parking Available</span>
                    <span class="badge badge-access"><i class="fas fa-wheelchair"></i> Wheelchair Access</span>
                    <span class="badge badge-wifi"><i class="fas fa-wifi"></i> Free WiFi</span>
                </div>
            </div>
            
            <div class="location-details">
                <div class="address-card">
                    <div class="address-header">
                        <h3>${this.artisanData.name} ${this.artisanData.craft} Studio</h3>
                        <button class="btn-copy-address" id="copyFullAddressBtn" title="Copy Address">
                            <i class="fas fa-copy"></i>
                        </button>
                    </div>
                    
                    <div class="address-content">
                        <div class="address-line">
                            <i class="fas fa-map-pin"></i>
                            <span>${location.address || 'C-24, Pottery Lane, Chandni Chowk, Delhi - 110006'}</span>
                        </div>
                        <div class="address-line">
                            <i class="fas fa-city"></i>
                            <span>${location.city}, ${location.state}</span>
                        </div>
                        ${this.artisanData.contact?.phone ? `
                        <div class="address-line">
                            <i class="fas fa-phone"></i>
                            <span><a href="tel:${this.artisanData.contact.phone}">${this.artisanData.contact.phone}</a></span>
                        </div>
                        ` : ''}
                    </div>
                    
                    <div class="address-actions">
                        <button class="btn btn-primary" id="directionsBtn">
                            <i class="fas fa-directions"></i> Get Directions
                        </button>
                        <button class="btn btn-outline" id="openMapBtn">
                            <i class="fas fa-map"></i> View on Map
                        </button>
                        <button class="btn btn-outline" id="shareLocationBtn">
                            <i class="fas fa-share-alt"></i> Share
                        </button>
                    </div>
                </div>
                
                <div class="map-container">
                    <div class="map-wrapper">
                        <div class="map-loading" id="mapLoading">
                            <div class="loading-spinner">
                                <i class="fas fa-map-marked-alt"></i>
                            </div>
                            <p>Loading Interactive Map...</p>
                        </div>
                        
                        <div class="static-map" id="staticMap" style="display: none;">
                            <a href="https://maps.google.com/?q=${encodeURIComponent(location.address || `${location.city}, ${location.state}`)}" 
                               target="_blank" 
                               rel="noopener noreferrer"
                               class="map-link">
                                <img src="${staticMapUrl}" 
                                     alt="Map showing ${this.artisanData.name}'s studio location"
                                     class="map-image"
                                     onload="document.getElementById('mapLoading').style.display='none'; document.getElementById('staticMap').style.display='block';"
                                     onerror="this.onerror=null; this.src='images/map-fallback.jpg'; this.classList.add('map-fallback');">
                                <div class="map-overlay">
                                    <i class="fas fa-search-plus"></i>
                                    <span>Click to view in Google Maps</span>
                                </div>
                            </a>
                            <div class="map-marker">
                                <i class="fas fa-map-pin"></i>
                                <span class="marker-label">Studio Here</span>
                            </div>
                        </div>
                    </div>
                    
                    <div class="map-controls">
                        <button class="map-control-btn" id="zoomInBtn" title="Zoom In">
                            <i class="fas fa-plus"></i>
                        </button>
                        <button class="map-control-btn" id="zoomOutBtn" title="Zoom Out">
                            <i class="fas fa-minus"></i>
                        </button>
                        <button class="map-control-btn" id="locateBtn" title="My Location">
                            <i class="fas fa-location-arrow"></i>
                        </button>
                        <button class="map-control-btn" id="refreshMapBtn" title="Refresh Map">
                            <i class="fas fa-redo"></i>
                        </button>
                    </div>
                    
                    <div class="map-info">
                        <div class="info-item">
                            <i class="fas fa-clock"></i>
                            <div>
                                <div class="info-label">Open Hours</div>
                                <div class="info-value">${this.artisanData.contact?.availability || 'Mon-Sat: 9:00 AM - 7:00 PM'}</div>
                            </div>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-subway"></i>
                            <div>
                                <div class="info-label">Nearest Metro</div>
                                <div class="info-value">Chandni Chowk Metro Station (400m)</div>
                            </div>
                        </div>
                        <div class="info-item">
                            <i class="fas fa-car"></i>
                            <div>
                                <div class="info-label">Parking</div>
                                <div class="info-value">Free parking available on-site</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="location-tips">
                <h4><i class="fas fa-lightbulb"></i> Visiting Tips</h4>
                <ul>
                    <li>Best time to visit: Weekday mornings (less crowded)</li>
                    <li>Free pottery demonstration every Saturday at 3 PM</li>
                    <li>Bring cash for better deals on pottery items</li>
                    <li>Parking available in the lane behind the studio</li>
                </ul>
            </div>
        </div>
    `;
    
    // Insert the location HTML into the map container
    mapContainer.innerHTML = locationHTML;
    
    // Initialize all location section functionality
    this.initLocationFunctionality(location);
}

// Helper method to generate Geoapify static map URL
generateGeoapifyStaticMap(location, apiKey) {
    const { latitude, longitude } = location;
    
    // Default coordinates if not provided (Chandni Chowk, Delhi)
    const lat = latitude || 28.6517;
    const lng = longitude || 77.2219;
    
    const params = new URLSearchParams({
        style: 'osm-bright',
        width: '800',
        height: '400',
        format: 'png',
        scale: '2',
        center: `lonlat:${lng},${lat}`,
        zoom: '16', // Closer zoom for studio location
        marker: `lonlat:${lng},${lat};color:%23DC2626;size:large;type:material`,
        apiKey: apiKey
    });
    
    return `https://maps.geoapify.com/v1/staticmap?${params.toString()}`;
}

// Initialize all location section functionality
initLocationFunctionality(location) {
    // 1. Copy Address Button
    document.getElementById('copyFullAddressBtn')?.addEventListener('click', () => {
        const address = location.address || `${location.city}, ${location.state}`;
        this.copyToClipboard(address, 'Address copied to clipboard!');
    });
    
    // 2. Get Directions Button
    document.getElementById('directionsBtn')?.addEventListener('click', () => {
        this.getDirections(location);
    });
    
    // 3. Open Map Button
    document.getElementById('openMapBtn')?.addEventListener('click', () => {
        this.openMapExternal(location);
    });
    
    // 4. Share Location Button
    document.getElementById('shareLocationBtn')?.addEventListener('click', () => {
        this.shareStudioLocation(location);
    });
    
    // 5. Map Control Buttons
    let zoomLevel = 16;
    
    // Zoom In
    document.getElementById('zoomInBtn')?.addEventListener('click', () => {
        zoomLevel = Math.min(zoomLevel + 1, 20);
        this.updateMapZoom(location, zoomLevel);
    });
    
    // Zoom Out
    document.getElementById('zoomOutBtn')?.addEventListener('click', () => {
        zoomLevel = Math.max(zoomLevel - 1, 10);
        this.updateMapZoom(location, zoomLevel);
    });
    
    // Locate (Get User Location)
    document.getElementById('locateBtn')?.addEventListener('click', () => {
        this.getUserLocation(location);
    });
    
    // Refresh Map
    document.getElementById('refreshMapBtn')?.addEventListener('click', () => {
        this.refreshMap(location);
    });
    
    // 6. Map Image Error Handling
    const mapImage = document.querySelector('.map-image');
    if (mapImage) {
        mapImage.addEventListener('error', () => {
            mapImage.src = 'https://via.placeholder.com/800x400/3B82F6/FFFFFF?text=Map+Unavailable';
            mapImage.classList.add('map-error');
        });
    }
}

// Helper Methods for Location Functionality
copyToClipboard(text, successMessage) {
    navigator.clipboard.writeText(text).then(() => {
        Components.showNotification(successMessage, 'success');
        
        // Visual feedback for copy button
        const copyBtn = document.getElementById('copyFullAddressBtn');
        if (copyBtn) {
            const originalHTML = copyBtn.innerHTML;
            copyBtn.innerHTML = '<i class="fas fa-check"></i>';
            copyBtn.classList.add('copied');
            
            setTimeout(() => {
                copyBtn.innerHTML = originalHTML;
                copyBtn.classList.remove('copied');
            }, 2000);
        }
    }).catch(err => {
        console.error('Failed to copy:', err);
        Components.showNotification('Failed to copy to clipboard', 'error');
    });
}

getDirections(location) {
    const address = encodeURIComponent(location.address || `${location.city}, ${location.state}`);
    const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${address}`;
    window.open(directionsUrl, '_blank', 'noopener,noreferrer');
}

openMapExternal(location) {
    const address = encodeURIComponent(location.address || `${location.city}, ${location.state}`);
    const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${address}`;
    window.open(mapsUrl, '_blank', 'noopener,noreferrer');
}

shareStudioLocation(location) {
    const studioName = `${this.artisanData.name}'s ${this.artisanData.craft} Studio`;
    const address = location.address || `${location.city}, ${location.state}`;
    const text = `📍 ${studioName}\n\n${address}\n\nView on ArtisanConnect: ${window.location.href}`;
    
    if (navigator.share) {
        navigator.share({
            title: studioName,
            text: text,
            url: window.location.href
        }).catch(err => {
            console.log('Share cancelled:', err);
        });
    } else {
        this.copyToClipboard(text, 'Location details copied to clipboard!');
    }
}

updateMapZoom(location, zoomLevel) {
    const apiKey = 'd995f6e9e9094d6185e3b3fbc2754d9c';
    const { latitude, longitude } = location;
    const lat = latitude || 28.6517;
    const lng = longitude || 77.2219;
    
    const params = new URLSearchParams({
        style: 'osm-bright',
        width: '800',
        height: '400',
        format: 'png',
        scale: '2',
        center: `lonlat:${lng},${lat}`,
        zoom: zoomLevel.toString(),
        marker: `lonlat:${lng},${lat};color:%23DC2626;size:large`,
        apiKey: apiKey
    });
    
    const newMapUrl = `https://maps.geoapify.com/v1/staticmap?${params.toString()}`;
    
    const mapImage = document.querySelector('.map-image');
    if (mapImage) {
        mapImage.src = newMapUrl;
        Components.showNotification(`Map zoom: ${zoomLevel}x`, 'info', 1000);
    }
}

getUserLocation(location) {
    if (navigator.geolocation) {
        Components.showNotification('Getting your location...', 'info');
        
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const userLat = position.coords.latitude;
                const userLng = position.coords.longitude;
                
                // Calculate distance
                const distance = this.calculateDistance(
                    userLat, 
                    userLng, 
                    location.latitude || 28.6517, 
                    location.longitude || 77.2219
                );
                
                Components.showNotification(
                    `You're ${distance.toFixed(1)} km from the studio`, 
                    'success'
                );
                
                // Show route on map (simplified version)
                this.showRoute(userLat, userLng, location);
            },
            (error) => {
                console.error('Geolocation error:', error);
                Components.showNotification('Unable to get your location', 'error');
            }
        );
    } else {
        Components.showNotification('Geolocation is not supported by your browser', 'error');
    }
}

refreshMap(location) {
    const mapImage = document.querySelector('.map-image');
    if (mapImage) {
        // Add timestamp to force refresh
        const timestamp = new Date().getTime();
        const currentSrc = mapImage.src.split('?')[0];
        mapImage.src = `${currentSrc}?refresh=${timestamp}`;
        
        Components.showNotification('Map refreshed', 'success', 1000);
    }
}

// Utility function to calculate distance between coordinates
calculateDistance(lat1, lon1, lat2, lon2) {
    const R = 6371; // Earth's radius in km
    const dLat = this.deg2rad(lat2 - lat1);
    const dLon = this.deg2rad(lon2 - lon1);
    
    const a = 
        Math.sin(dLat/2) * Math.sin(dLat/2) +
        Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * 
        Math.sin(dLon/2) * Math.sin(dLon/2);
    
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
}

deg2rad(deg) {
    return deg * (Math.PI/180);
}

// Simplified route display (just shows both points on map)
showRoute(userLat, userLng, location) {
    const apiKey = 'd995f6e9e9094d6185e3b3fbc2754d9c';
    const studioLat = location.latitude || 28.6517;
    const studioLng = location.longitude || 77.2219;
    
    // Show both markers on map
    const params = new URLSearchParams({
        style: 'osm-bright',
        width: '800',
        height: '400',
        format: 'png',
        center: `lonlat:${studioLng},${studioLat}`,
        zoom: '13',
        marker: `lonlat:${userLng},${userLat};color:%233B82F6;size:medium||lonlat:${studioLng},${studioLat};color:%23DC2626;size:large`,
        apiKey: apiKey
    });
    
    const routeMapUrl = `https://maps.geoapify.com/v1/staticmap?${params.toString()}`;
    
    const mapImage = document.querySelector('.map-image');
    if (mapImage) {
        mapImage.src = routeMapUrl;
    }
}

    switchTab(tabId) {
        // Update active tab
        this.elements.tabs?.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.tab === tabId);
        });
        
        // Show active content
        this.elements.tabContents?.forEach(content => {
            content.classList.toggle('active', content.id === tabId);
        });
    }

    updateTabs() {
        // Set initial active tab
        const firstTab = this.elements.tabs?.[0];
        if (firstTab) {
            this.switchTab(firstTab.dataset.tab);
        }
    }

    updateSaveButton() {
        const saveButtons = [
            document.getElementById('saveProfileBtn'),
            document.getElementById('saveArtisanBtn'),
            document.getElementById('mobileSaveBtn')
        ];
        
        saveButtons.forEach(btn => {
            if (btn) {
                btn.innerHTML = `<i class="fas fa-heart"></i> ${this.isFavorite ? 'Saved' : 'Save'}`;
                btn.classList.toggle('active', this.isFavorite);
            }
        });
    }

    showContactModal() {
        if (!this.currentUser) {
            Components.showNotification('Please login to contact artisans', 'warning');
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            return;
        }
        
        if (this.elements.contactModal) {
            this.elements.contactModal.classList.add('active');
            document.body.style.overflow = 'hidden';
            
            // Pre-fill form if user data exists
            if (this.currentUser) {
                const nameInput = document.getElementById('contactName');
                const emailInput = document.getElementById('contactEmail');
                
                if (nameInput && this.currentUser.name) {
                    nameInput.value = this.currentUser.name;
                }
                if (emailInput && this.currentUser.email) {
                    emailInput.value = this.currentUser.email;
                }
            }
        }
    }

    hideContactModal() {
        if (this.elements.contactModal) {
            this.elements.contactModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    showGalleryModal(imageSrc) {
        if (this.elements.galleryModal && this.elements.galleryModalImage) {
            this.elements.galleryModalImage.src = imageSrc;
            this.elements.galleryModal.classList.add('active');
            document.body.style.overflow = 'hidden';
        }
    }

    hideGalleryModal() {
        if (this.elements.galleryModal) {
            this.elements.galleryModal.classList.remove('active');
            document.body.style.overflow = '';
        }
    }

    async submitContactForm() {
        const form = this.elements.contactForm;
        if (!form || !this.currentUser || !this.artisanId) return;
        
        const formData = new FormData(form);
        const messageData = {
            name: formData.get('contactName'),
            email: formData.get('contactEmail'),
            message: formData.get('contactMessage'),
            purpose: formData.get('contactPurpose'),
            timestamp: new Date().toISOString(),
            userId: this.currentUser.uid,
            artisanId: this.artisanId,
            artisanName: this.artisanData.name,
            status: 'unread',
            read: false
        };
        
        try {
            Components.showLoading(true, 'Sending message...');
            
            // Save to Firebase
            const result = await messageDB.sendMessage(this.artisanId, messageData);
            
            if (result.success) {
                Components.showNotification('Message sent successfully! The artisan will contact you soon.', 'success', 5000);
                this.hideContactModal();
                form.reset();
                
                // Send email notification (if you have backend)
                // await this.sendEmailNotification(messageData);
            } else {
                Components.showNotification('Failed to send message', 'error');
            }
            
        } catch (error) {
            console.error('Error sending message:', error);
            Components.showNotification('Failed to send message', 'error');
        } finally {
            Components.showLoading(false);
        }
    }

    async toggleFavorite() {
        if (!this.currentUser) {
            Components.showNotification('Please login to save artisans', 'warning');
            window.location.href = 'login.html?redirect=' + encodeURIComponent(window.location.href);
            return;
        }
        
        try {
            // Use Firebase for logged in users
            const result = await userDB.toggleFavorite(this.currentUser.uid, this.artisanId);
            
            if (result.success) {
                this.isFavorite = result.isFavorite;
                this.updateSaveButton();
                
                Components.showNotification(
                    this.isFavorite ? 
                        '✓ Added to favorites!' : 
                        'Removed from favorites',
                    this.isFavorite ? 'success' : 'info'
                );
            }
        } catch (error) {
            console.error('Error toggling favorite:', error);
            
            // Fallback to localStorage
            this.handleLocalStorageFavorite();
        }
    }

    handleLocalStorageFavorite() {
        const favorites = JSON.parse(localStorage.getItem('artisanFavorites')) || [];
        const index = favorites.indexOf(this.artisanId);
        
        if (index > -1) {
            favorites.splice(index, 1);
            this.isFavorite = false;
        } else {
            favorites.push(this.artisanId);
            this.isFavorite = true;
        }
        
        localStorage.setItem('artisanFavorites', JSON.stringify(favorites));
        this.updateSaveButton();
        
        Components.showNotification(
            this.isFavorite ? 
                '✓ Added to favorites!' : 
                'Removed from favorites',
            this.isFavorite ? 'success' : 'info'
        );
    }

    shareProfile() {
        const profileUrl = window.location.href;
        const message = `Check out ${this.artisanData.name}'s amazing ${this.artisanData.craft} work on ArtisanConnect! ✨`;
        const title = `${this.artisanData.name} - ArtisanConnect`;
        
        if (navigator.share) {
            navigator.share({
                title: title,
                text: message,
                url: profileUrl
            }).catch(err => {
                console.log('Share cancelled:', err);
            });
        } else {
            // Fallback: Copy to clipboard
            navigator.clipboard.writeText(`${message}\n${profileUrl}`).then(() => {
                Components.showNotification('Profile link copied to clipboard!', 'success');
            }).catch(err => {
                // Final fallback: Open mailto
                const subject = encodeURIComponent(`ArtisanConnect: ${this.artisanData.name}`);
                const body = encodeURIComponent(`${message}\n\nView profile: ${profileUrl}`);
                window.location.href = `mailto:?subject=${subject}&body=${body}`;
            });
        }
    }
}

// ===== INITIALIZE PROFILE PAGE =====
document.addEventListener('DOMContentLoaded', () => {
    // Check if user is logged in
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    
    // Show login prompt if not logged in
    if (!currentUser && !window.location.pathname.includes('login')) {
        const loginPrompt = document.createElement('div');
        loginPrompt.className = 'login-prompt';
        loginPrompt.innerHTML = `
            <div class="login-prompt-content">
                <p>Login to save artisans, write reviews, and send messages</p>
                <a href="login.html?redirect=${encodeURIComponent(window.location.href)}" class="btn btn-sm btn-primary">
                    Login / Sign Up
                </a>
            </div>
        `;
        document.body.appendChild(loginPrompt);
        
        setTimeout(() => {
            loginPrompt.classList.add('show');
        }, 1000);
    }
    
    // Initialize profile
    new ArtisanProfile();
});

// Export for module usage
export { ArtisanProfile };