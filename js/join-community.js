// js/join-community.js
// Professional join community functionality with Firebase integration

import { 
    db, 
    auth, 
    storage,
    collection, 
    addDoc,
    doc,
    setDoc,
    updateDoc,
    ref,
    uploadBytes,
    getDownloadURL,
    createUserWithEmailAndPassword
} from './firebase.js';

// Create Utils object
const Utils = {
    showNotification: (message, type = 'info') => {
        alert(`${type.toUpperCase()}: ${message}`);
    },
    
    toggleLoading: (show, message = 'Loading...') => {
        const loader = document.getElementById('globalLoader');
        if (loader) {
            loader.style.display = show ? 'block' : 'none';
            if (message) loader.innerHTML = message;
        }
    },
    
    showLoading: (show, message) => {
        Utils.toggleLoading(show, message);
    }
};

class JoinCommunity {
    constructor() {
        this.selectedType = null;
        this.currentStep = 1;
        this.totalSteps = 4;
        this.uploadedProfilePic = null;
        this.uploadedGalleryImages = [];
        this.artisanFormData = {};
        this.supporterFormData = {};
        
        this.init();
    }

    async init() {
        try {
            // Check URL parameters for pre-selected type
            this.checkUrlParams();
            
            // Initialize UI
            this.initUI();
            
            // Setup event listeners
            this.setupEventListeners();
            
            // Setup file uploads
            this.setupFileUploads();
            
            // Setup FAQ accordion
            this.setupFAQ();
            
            console.log('Join community page initialized');
        } catch (error) {
            console.error('Error initializing join community page:', error);
            this.showError('Failed to initialize join community page.');
        }
    }

    checkUrlParams() {
        const urlParams = new URLSearchParams(window.location.search);
        const type = urlParams.get('type');
        
        if (type === 'artisan' || type === 'supporter') {
            this.selectedType = type;
        }
    }

    initUI() {
        // Initialize UI elements
        this.elements = {
            // Choice buttons
            artisanChoice: document.querySelector('.artisan-choice .choice-select'),
            supporterChoice: document.querySelector('.supporter-choice .choice-select'),
            bothOptions: document.getElementById('bothOptions'),
            
            // Form containers
            formsSection: document.getElementById('formsSection'),
            artisanForm: document.getElementById('artisanForm'),
            supporterForm: document.getElementById('supporterForm'),
            successMessage: document.getElementById('successMessage'),
            
            // Progress elements
            progressSteps: document.querySelectorAll('.progress-steps .step'),
            progressFill: document.querySelector('.progress-fill'),
            
            // Form navigation
            nextButtons: document.querySelectorAll('.next-step'),
            prevButtons: document.querySelectorAll('.prev-step'),
            
            // Form elements
            artisanRegistrationForm: document.getElementById('artisanRegistrationForm'),
            supporterRegistrationForm: document.getElementById('supporterRegistrationForm'),
            
            // File uploads
            profilePicture: document.getElementById('profilePicture'),
            profileUpload: document.getElementById('profileUpload'),
            profilePreview: document.getElementById('profilePreview'),
            workGallery: document.getElementById('workGallery'),
            galleryUpload: document.getElementById('galleryUpload'),
            galleryPreview: document.getElementById('galleryPreview'),
            
            // Review sections
            reviewBasic: document.getElementById('reviewBasic'),
            reviewCraft: document.getElementById('reviewCraft'),
            reviewPortfolio: document.getElementById('reviewPortfolio'),
            
            // Tags input
            additionalCrafts: document.getElementById('additionalCrafts'),
            craftTags: document.getElementById('craftTags'),
            
            // Terms
            termsAgreement: document.getElementById('termsAgreement'),
            
            // FAQ
            faqQuestions: document.querySelectorAll('.faq-question')
        };

        // Show pre-selected form if URL parameter exists
        if (this.selectedType) {
            this.showForm(this.selectedType);
        }
    }

    setupEventListeners() {
        // Choice selection
        if (this.elements.artisanChoice) {
            this.elements.artisanChoice.addEventListener('click', () => {
                this.showForm('artisan');
            });
        }

        if (this.elements.supporterChoice) {
            this.elements.supporterChoice.addEventListener('click', () => {
                this.showForm('supporter');
            });
        }

        if (this.elements.bothOptions) {
            this.elements.bothOptions.addEventListener('click', () => {
                this.showBothOptions();
            });
        }

        // Form navigation
        this.elements.nextButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const nextStep = parseInt(button.dataset.next);
                this.goToStep(nextStep);
            });
        });

        this.elements.prevButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const prevStep = parseInt(button.dataset.prev);
                this.goToStep(prevStep);
            });
        });

        // Tags input
        if (this.elements.additionalCrafts) {
            this.elements.additionalCrafts.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    this.addCraftTag(e.target.value);
                    e.target.value = '';
                }
            });
        }

        // Form submissions
        if (this.elements.artisanRegistrationForm) {
            this.elements.artisanRegistrationForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.submitArtisanForm();
            });
        }

        if (this.elements.supporterRegistrationForm) {
            this.elements.supporterRegistrationForm.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.submitSupporterForm();
            });
        }

        // Smooth scrolling for anchor links
        document.querySelectorAll('a[href^="#"]').forEach(anchor => {
            anchor.addEventListener('click', function (e) {
                e.preventDefault();
                const targetId = this.getAttribute('href');
                if (targetId === '#') return;
                
                const targetElement = document.querySelector(targetId);
                if (targetElement) {
                    window.scrollTo({
                        top: targetElement.offsetTop - 100,
                        behavior: 'smooth'
                    });
                }
            });
        });

        // Terms checkbox validation
        if (this.elements.termsAgreement) {
            this.elements.termsAgreement.addEventListener('change', () => {
                this.validateStep4();
            });
        }
    }

    setupFileUploads() {
        // Profile picture upload
        if (this.elements.profileUpload) {
            this.elements.profileUpload.addEventListener('click', () => {
                this.elements.profilePicture.click();
            });

            this.elements.profilePicture.addEventListener('change', (e) => {
                this.handleProfilePictureUpload(e.target.files[0]);
            });
        }

        // Gallery upload
        if (this.elements.galleryUpload) {
            this.elements.galleryUpload.addEventListener('click', () => {
                this.elements.workGallery.click();
            });

            this.elements.workGallery.addEventListener('change', (e) => {
                this.handleGalleryUpload(Array.from(e.target.files));
            });
        }
    }

    setupFAQ() {
        if (this.elements.faqQuestions) {
            this.elements.faqQuestions.forEach(question => {
                question.addEventListener('click', () => {
                    const answer = question.nextElementSibling;
                    const icon = question.querySelector('i');
                    
                    // Toggle current item
                    question.classList.toggle('active');
                    answer.classList.toggle('active');
                    icon.classList.toggle('fa-chevron-down');
                    icon.classList.toggle('fa-chevron-up');
                    
                    // Close other items
                    this.elements.faqQuestions.forEach(otherQuestion => {
                        if (otherQuestion !== question && otherQuestion.classList.contains('active')) {
                            const otherAnswer = otherQuestion.nextElementSibling;
                            const otherIcon = otherQuestion.querySelector('i');
                            
                            otherQuestion.classList.remove('active');
                            otherAnswer.classList.remove('active');
                            otherIcon.classList.remove('fa-chevron-up');
                            otherIcon.classList.add('fa-chevron-down');
                        }
                    });
                });
            });
        }
    }

    showForm(type) {
        this.selectedType = type;
        
        // Scroll to forms section
        this.elements.formsSection.scrollIntoView({ behavior: 'smooth' });
        
        // Show appropriate form
        if (type === 'artisan') {
            this.elements.artisanForm.style.display = 'block';
            this.elements.supporterForm.style.display = 'none';
            this.elements.successMessage.style.display = 'none';
            
            // Reset artisan form
            this.currentStep = 1;
            this.updateProgress();
            
        } else if (type === 'supporter') {
            this.elements.artisanForm.style.display = 'none';
            this.elements.supporterForm.style.display = 'block';
            this.elements.successMessage.style.display = 'none';
        }
    }

    showBothOptions() {
        // Create comparison modal
        const modal = document.createElement('div');
        modal.className = 'comparison-modal active';
        modal.innerHTML = `
            <div class="comparison-content">
                <div class="comparison-header">
                    <h3><i class="fas fa-balance-scale"></i> Compare Options</h3>
                    <button class="close-comparison">&times;</button>
                </div>
                <div class="comparison-grid">
                    <div class="comparison-column artisan">
                        <h4><i class="fas fa-palette"></i> As Artisan</h4>
                        <ul>
                            <li><i class="fas fa-check"></i> Showcase your portfolio</li>
                            <li><i class="fas fa-check"></i> Direct customer connections</li>
                            <li><i class="fas fa-check"></i> Workshop hosting</li>
                            <li><i class="fas fa-check"></i> Community support</li>
                            <li><i class="fas fa-check"></i> Marketing assistance</li>
                        </ul>
                        <button class="btn btn-primary choose-artisan">
                            <i class="fas fa-palette"></i> Choose Artisan
                        </button>
                    </div>
                    
                    <div class="comparison-column supporter">
                        <h4><i class="fas fa-heart"></i> As Supporter</h4>
                        <ul>
                            <li><i class="fas fa-check"></i> Discover unique crafts</li>
                            <li><i class="fas fa-check"></i> Connect with makers</li>
                            <li><i class="fas fa-check"></i> Workshop participation</li>
                            <li><i class="fas fa-check"></i> Early product access</li>
                            <li><i class="fas fa-check"></i> Support local economies</li>
                        </ul>
                        <button class="btn btn-secondary choose-supporter">
                            <i class="fas fa-heart"></i> Choose Supporter
                        </button>
                    </div>
                </div>
                <div class="comparison-note">
                    <p><i class="fas fa-info-circle"></i> Note: You can always change your role later!</p>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Add event listeners
        modal.querySelector('.close-comparison').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.querySelector('.choose-artisan').addEventListener('click', () => {
            this.showForm('artisan');
            modal.remove();
        });
        
        modal.querySelector('.choose-supporter').addEventListener('click', () => {
            this.showForm('supporter');
            modal.remove();
        });
        
        // Close on outside click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }

    goToStep(step) {
        // Validate current step before proceeding
        if (!this.validateCurrentStep()) {
            return;
        }
        
        // Update step
        this.currentStep = step;
        
        // Update UI
        this.updateProgress();
        
        // Scroll to top of form
        this.elements.artisanForm.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    updateProgress() {
        // Update progress bar
        const progressPercent = ((this.currentStep - 1) / (this.totalSteps - 1)) * 100;
        this.elements.progressFill.style.width = `${progressPercent}%`;
        
        // Update step indicators
        this.elements.progressSteps.forEach((step, index) => {
            const stepNumber = parseInt(step.dataset.step);
            
            if (stepNumber === this.currentStep) {
                step.classList.add('active');
                step.classList.remove('completed');
            } else if (stepNumber < this.currentStep) {
                step.classList.remove('active');
                step.classList.add('completed');
            } else {
                step.classList.remove('active', 'completed');
            }
        });
        
        // Show/hide steps
        document.querySelectorAll('.form-step').forEach(formStep => {
            const stepNumber = parseInt(formStep.dataset.step);
            if (stepNumber === this.currentStep) {
                formStep.classList.add('active');
            } else {
                formStep.classList.remove('active');
            }
        });
        
        // Update review if on step 4
        if (this.currentStep === 4) {
            this.updateReview();
        }
    }

    validateCurrentStep() {
        switch (this.currentStep) {
            case 1:
                return this.validateStep1();
            case 2:
                return this.validateStep2();
            case 3:
                return this.validateStep3();
            default:
                return true;
        }
    }

    validateStep1() {
        const requiredFields = [
            'artisanName',
            'artisanEmail',
            'artisanPhone',
            'artisanLocation',
            'artisanBio'
        ];
        
        let isValid = true;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) {
                isValid = false;
                this.highlightError(field, 'This field is required');
            } else if (fieldId === 'artisanEmail' && !this.validateEmail(field.value)) {
                isValid = false;
                this.highlightError(field, 'Please enter a valid email');
            } else if (fieldId === 'artisanPhone' && !this.validatePhone(field.value)) {
                isValid = false;
                this.highlightError(field, 'Please enter a valid phone number');
            } else {
                this.clearError(field);
            }
        });
        
        if (isValid) {
            // Save step 1 data
            this.artisanFormData.basic = {
                name: document.getElementById('artisanName').value.trim(),
                email: document.getElementById('artisanEmail').value.trim(),
                phone: document.getElementById('artisanPhone').value.trim(),
                location: document.getElementById('artisanLocation').value.trim(),
                bio: document.getElementById('artisanBio').value.trim()
            };
        }
        
        return isValid;
    }

    validateStep2() {
        const requiredFields = [
            'primaryCraft',
            'experienceYears',
            'workshopType',
            'craftDescription'
        ];
        
        let isValid = true;
        
        requiredFields.forEach(fieldId => {
            const field = document.getElementById(fieldId);
            if (!field || !field.value.trim()) {
                isValid = false;
                this.highlightError(field, 'This field is required');
            } else {
                this.clearError(field);
            }
        });
        
        if (isValid) {
            // Save step 2 data
            this.artisanFormData.craft = {
                primaryCraft: document.getElementById('primaryCraft').value,
                experienceYears: parseInt(document.getElementById('experienceYears').value),
                specialty: document.getElementById('craftSpecialty').value.trim(),
                workshopType: document.getElementById('workshopType').value,
                description: document.getElementById('craftDescription').value.trim(),
                additionalCrafts: this.getCraftTags()
            };
        }
        
        return isValid;
    }

    validateStep3() {
        // Check if profile picture is uploaded
        if (!this.uploadedProfilePic) {
            const uploadArea = document.getElementById('profileUpload');
            this.highlightError(uploadArea, 'Profile picture is required');
            return false;
        }
        
        // Save step 3 data
        this.artisanFormData.portfolio = {
            profilePicture: this.uploadedProfilePic,
            galleryImages: this.uploadedGalleryImages,
            portfolioLink: document.getElementById('portfolioLink').value.trim(),
            socialInstagram: document.getElementById('socialInstagram').value.trim(),
            socialFacebook: document.getElementById('socialFacebook').value.trim(),
            priceRange: document.getElementById('priceRange').value
        };
        
        return true;
    }

    validateStep4() {
        // Check terms agreement
        if (!this.elements.termsAgreement.checked) {
            this.highlightError(this.elements.termsAgreement, 'You must agree to the terms');
            return false;
        }
        
        this.clearError(this.elements.termsAgreement);
        return true;
    }

    validateEmail(email) {
        const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        return re.test(email);
    }

    validatePhone(phone) {
        const re = /^[\+]?[1-9][\d]{0,15}$/;
        return re.test(phone.replace(/[\s\-\(\)]/g, ''));
    }

    highlightError(element, message) {
        element.classList.add('error');
        
        // Show error message
        let errorDiv = element.nextElementSibling;
        if (!errorDiv || !errorDiv.classList.contains('error-message')) {
            errorDiv = document.createElement('div');
            errorDiv.className = 'error-message';
            element.parentNode.insertBefore(errorDiv, element.nextSibling);
        }
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
    }

    clearError(element) {
        element.classList.remove('error');
        
        // Hide error message
        const errorDiv = element.nextElementSibling;
        if (errorDiv && errorDiv.classList.contains('error-message')) {
            errorDiv.style.display = 'none';
        }
    }

    async handleProfilePictureUpload(file) {
        if (!file) return;
        
        // Validate file
        if (!file.type.startsWith('image/')) {
            Utils.showNotification('Please upload an image file', 'error');
            return;
        }
        
        if (file.size > 2 * 1024 * 1024) { // 2MB limit
            Utils.showNotification('Image must be less than 2MB', 'error');
            return;
        }
        
        try {
            Utils.toggleLoading(true);
            
            // Show preview
            const reader = new FileReader();
            reader.onload = (e) => {
                this.elements.profilePreview.innerHTML = `
                    <img src="${e.target.result}" alt="Profile preview">
                    <button class="remove-image" data-type="profile">
                        <i class="fas fa-times"></i>
                    </button>
                `;
                
                // Add remove button listener
                this.elements.profilePreview.querySelector('.remove-image').addEventListener('click', () => {
                    this.removeProfilePicture();
                });
            };
            reader.readAsDataURL(file);
            
            // Store file reference
            this.uploadedProfilePic = file;
            
            Utils.toggleLoading(false);
            Utils.showNotification('Profile picture uploaded successfully', 'success');
            
        } catch (error) {
            console.error('Error uploading profile picture:', error);
            Utils.toggleLoading(false);
            Utils.showNotification('Failed to upload profile picture', 'error');
        }
    }

    async handleGalleryUpload(files) {
        if (!files || files.length === 0) return;
        
        // Validate total number of images
        const totalImages = this.uploadedGalleryImages.length + files.length;
        if (totalImages > 10) {
            Utils.showNotification('Maximum 10 images allowed', 'error');
            return;
        }
        
        try {
            Utils.toggleLoading(true);
            
            for (const file of files) {
                // Validate each file
                if (!file.type.startsWith('image/')) {
                    Utils.showNotification(`${file.name} is not an image file`, 'warning');
                    continue;
                }
                
                if (file.size > 5 * 1024 * 1024) { // 5MB limit
                    Utils.showNotification(`${file.name} must be less than 5MB`, 'warning');
                    continue;
                }
                
                // Add to gallery preview
                const reader = new FileReader();
                reader.onload = (e) => {
                    const imageDiv = document.createElement('div');
                    imageDiv.className = 'gallery-image';
                    imageDiv.innerHTML = `
                        <img src="${e.target.result}" alt="Gallery image">
                        <button class="remove-image" data-filename="${file.name}">
                            <i class="fas fa-times"></i>
                        </button>
                    `;
                    
                    this.elements.galleryPreview.appendChild(imageDiv);
                    
                    // Add remove button listener
                    imageDiv.querySelector('.remove-image').addEventListener('click', (e) => {
                        this.removeGalleryImage(file.name, imageDiv);
                    });
                };
                reader.readAsDataURL(file);
                
                // Store file reference
                this.uploadedGalleryImages.push({
                    file: file,
                    name: file.name,
                    url: URL.createObjectURL(file)
                });
            }
            
            Utils.toggleLoading(false);
            Utils.showNotification(`${files.length} image(s) uploaded successfully`, 'success');
            
        } catch (error) {
            console.error('Error uploading gallery images:', error);
            Utils.toggleLoading(false);
            Utils.showNotification('Failed to upload images', 'error');
        }
    }

    removeProfilePicture() {
        this.uploadedProfilePic = null;
        this.elements.profilePreview.innerHTML = '';
        this.elements.profilePicture.value = '';
    }

    removeGalleryImage(filename, element) {
        this.uploadedGalleryImages = this.uploadedGalleryImages.filter(img => img.name !== filename);
        element.remove();
    }

    addCraftTag(tag) {
        if (!tag.trim()) return;
        
        const tagElement = document.createElement('span');
        tagElement.className = 'tag';
        tagElement.innerHTML = `
            ${tag.trim()}
            <button class="remove-tag" data-tag="${tag.trim()}">
                <i class="fas fa-times"></i>
            </button>
        `;
        
        this.elements.craftTags.appendChild(tagElement);
        
        // Add remove listener
        tagElement.querySelector('.remove-tag').addEventListener('click', (e) => {
            e.stopPropagation();
            tagElement.remove();
        });
    }

    getCraftTags() {
        const tags = [];
        this.elements.craftTags.querySelectorAll('.tag').forEach(tag => {
            const tagText = tag.textContent.trim();
            if (tagText) {
                tags.push(tagText);
            }
        });
        return tags;
    }

    updateReview() {
        // Update basic info review
        if (this.artisanFormData.basic) {
            this.elements.reviewBasic.innerHTML = `
                <p><strong>Name:</strong> ${this.artisanFormData.basic.name}</p>
                <p><strong>Email:</strong> ${this.artisanFormData.basic.email}</p>
                <p><strong>Phone:</strong> ${this.artisanFormData.basic.phone}</p>
                <p><strong>Location:</strong> ${this.artisanFormData.basic.location}</p>
                <p><strong>Bio:</strong> ${this.artisanFormData.basic.bio.substring(0, 100)}...</p>
            `;
        }
        
        // Update craft info review
        if (this.artisanFormData.craft) {
            const additionalCrafts = this.artisanFormData.craft.additionalCrafts.length > 0 
                ? this.artisanFormData.craft.additionalCrafts.join(', ') 
                : 'None';
            
            this.elements.reviewCraft.innerHTML = `
                <p><strong>Primary Craft:</strong> ${this.artisanFormData.craft.primaryCraft}</p>
                <p><strong>Experience:</strong> ${this.artisanFormData.craft.experienceYears} years</p>
                <p><strong>Specialty:</strong> ${this.artisanFormData.craft.specialty || 'Not specified'}</p>
                <p><strong>Workshop Type:</strong> ${this.artisanFormData.craft.workshopType}</p>
                <p><strong>Additional Crafts:</strong> ${additionalCrafts}</p>
                <p><strong>Description:</strong> ${this.artisanFormData.craft.description.substring(0, 100)}...</p>
            `;
        }
        
        // Update portfolio review
        if (this.artisanFormData.portfolio) {
            const hasPortfolio = this.artisanFormData.portfolio.portfolioLink ? 'Yes' : 'No';
            const hasInstagram = this.artisanFormData.portfolio.socialInstagram ? 'Yes' : 'No';
            const hasFacebook = this.artisanFormData.portfolio.socialFacebook ? 'Yes' : 'No';
            
            this.elements.reviewPortfolio.innerHTML = `
                <p><strong>Profile Picture:</strong> ${this.uploadedProfilePic ? 'Uploaded' : 'Not uploaded'}</p>
                <p><strong>Gallery Images:</strong> ${this.uploadedGalleryImages.length} uploaded</p>
                <p><strong>Portfolio Website:</strong> ${hasPortfolio}</p>
                <p><strong>Instagram:</strong> ${hasInstagram}</p>
                <p><strong>Facebook:</strong> ${hasFacebook}</p>
                <p><strong>Price Range:</strong> ${this.artisanFormData.portfolio.priceRange || 'Not specified'}</p>
            `;
        }
    }

    // ===== SIMPLIFIED REGISTRATION =====
     // ===== FIXED REGISTRATION FUNCTION =====
        // ===== FIXED REGISTRATION FUNCTION =====
    // ===== UPDATED submitArtisanForm WITH EMAIL SENDING =====
async submitArtisanForm() {
    console.log("🚀 Starting registration...");
    
    try {
        // Validate form first
        if (!this.validateCurrentStep()) {
            alert("Please complete all required fields in the current step");
            return;
        }
        
        // Skip profile picture validation for now (optional)
        if (!this.uploadedProfilePic) {
            const continueWithoutPic = confirm("Profile picture is recommended but not required. Continue without profile picture?");
            if (!continueWithoutPic) {
                return;
            }
        }
        
        // Validate terms
        if (!this.elements.termsAgreement?.checked) {
            alert("You must agree to the terms and conditions");
            return;
        }
        
        // Get ALL form data from steps
        const formData = {
            // Step 1 data
            name: document.getElementById('artisanName')?.value || '',
            email: document.getElementById('artisanEmail')?.value || '',
            phone: document.getElementById('artisanPhone')?.value || '',
            location: document.getElementById('artisanLocation')?.value || '',
            bio: document.getElementById('artisanBio')?.value || '',
            
            // Step 2 data
            craft: document.getElementById('primaryCraft')?.value || '',
            experience: document.getElementById('experienceYears')?.value || '0',
            specialty: document.getElementById('craftSpecialty')?.value || '',
            workshopType: document.getElementById('workshopType')?.value || '',
            description: document.getElementById('craftDescription')?.value || '',
            additionalCrafts: this.getCraftTags(),
            
            // Step 3 data (optional)
            portfolioLink: document.getElementById('portfolioLink')?.value || '',
            socialInstagram: document.getElementById('socialInstagram')?.value || '',
            socialFacebook: document.getElementById('socialFacebook')?.value || '',
            priceRange: document.getElementById('priceRange')?.value || ''
        };
        
        console.log("📝 Form data:", formData);
        
        // Validate required fields
        const requiredFields = ['name', 'email', 'phone', 'location', 'bio', 'craft'];
        for (const field of requiredFields) {
            if (!formData[field] || formData[field].trim() === '') {
                alert(`Please fill in: ${field}`);
                return;
            }
        }
        
        if (!formData.email.includes('@')) {
            alert("Please enter a valid email address");
            return;
        }
        
        // Show loading
        this.showLoading(true, "Creating your account...");
        
        // 1. Create user in Firebase Authentication
        const password = "Artisan@123"; // Default password
        console.log("🔐 Creating auth user:", formData.email);
        
        const userCredential = await createUserWithEmailAndPassword(
            auth, 
            formData.email, 
            password
        );
        
        const userId = userCredential.user.uid;
        console.log("✅ Auth user created:", userId);
        
        // 2. Send Firebase verification email
        try {
            await userCredential.user.sendEmailVerification({
                url: window.location.origin + '/login.html',
                handleCodeInApp: true
            });
            console.log("📧 Firebase verification email sent");
        } catch (emailError) {
            console.warn("Could not send Firebase verification email:", emailError);
        }
        
        // 3. Save user to Firestore Database
        console.log("💾 Saving to Firestore users collection...");
        
        await setDoc(doc(db, "users", userId), {
            uid: userId,
            email: formData.email,
            name: formData.name,
            phone: formData.phone,
            location: formData.location,
            bio: formData.bio,
            role: "artisan",
            status: "pending",
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            preferences: {
                notifications: true,
                newsletter: true
            }
        });
        
        console.log("✅ User saved to Firestore");
        
        // 4. Save artisan to Firestore
        console.log("🎨 Saving to Firestore artisans collection...");
        
        const artisanData = {
            userId: userId,
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            location: formData.location,
            bio: formData.bio,
            craft: formData.craft,
            specialty: formData.specialty,
            experience: parseInt(formData.experience) || 0,
            workshopType: formData.workshopType,
            craftDescription: formData.description,
            additionalCrafts: formData.additionalCrafts,
            portfolioLink: formData.portfolioLink,
            socialInstagram: formData.socialInstagram,
            socialFacebook: formData.socialFacebook,
            priceRange: formData.priceRange,
            status: "pending",
            verified: false,
            featured: false,
            rating: 0,
            reviewCount: 0,
            viewCount: 0,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };
        
        // Upload profile picture if exists
        if (this.uploadedProfilePic) {
            try {
                console.log("📸 Uploading profile picture...");
                const profilePictureUrl = await this.uploadFileToStorage(
                    this.uploadedProfilePic, 
                    'profile-pictures'
                );
                artisanData.imageUrl = profilePictureUrl;
                console.log("✅ Profile picture uploaded");
            } catch (uploadError) {
                console.warn("Profile picture upload failed:", uploadError);
            }
        }
        
        const artisanRef = await addDoc(collection(db, "artisans"), artisanData);
        const artisanId = artisanRef.id;
        console.log("✅ Artisan saved to Firestore:", artisanId);
        
        // 5. Update user with artisan ID
        await updateDoc(doc(db, "users", userId), {
            artisanId: artisanId
        });
        
        console.log("✅ Registration complete!");
        
        // 6. Send Welcome Email using EmailJS
        await this.sendWelcomeEmailViaEmailJS(formData, userId, artisanId);
        
        this.showLoading(false);
        
        // Show success message with email info
        this.showSuccessModal(formData);
        
        // Show success message on page
        this.showSuccessMessage('artisan');
        
        // Reset form
        this.resetArtisanForm();
        
    } catch (error) {
        console.error("❌ Registration error:", error);
        this.showLoading(false);
        
        let errorMsg = "Registration failed: ";
        
        if (error.code === 'auth/email-already-in-use') {
            errorMsg = "⚠️ This email is already registered. Please use a different email or login.";
        } else if (error.code === 'auth/invalid-email') {
            errorMsg = "⚠️ Invalid email address format.";
        } else if (error.code === 'auth/weak-password') {
            errorMsg = "⚠️ Password is too weak.";
        } else if (error.code === 'auth/operation-not-allowed') {
            errorMsg = "⚠️ Email/Password authentication is not enabled. Please contact support.";
        } else if (error.code === 'permission-denied') {
            errorMsg = "⚠️ Database permission denied. Update Firestore rules to allow writes.";
        } else {
            errorMsg += error.message;
        }
        
        alert(errorMsg);
    }
}
    
    // ===== EMAIL SENDING USING EMAILJS =====
async sendWelcomeEmailViaEmailJS(userData, userId, artisanId) {
    try {
        console.log("📧 Preparing to send welcome email to:", userData.email);
        
        // Step 1: Sign up for EmailJS (free) at https://www.emailjs.com/
        // Step 2: Get your Service ID, Template ID, and Public Key
        
        // EmailJS configuration - YOU NEED TO GET THESE FROM EMAILJS.COM
        const EMAILJS_SERVICE_ID = 'service_your_service_id'; // Replace with yours
        const EMAILJS_TEMPLATE_ID = 'template_your_template_id'; // Replace with yours
        const EMAILJS_PUBLIC_KEY = 'your_public_key'; // Replace with yours
        
        // If EmailJS is not loaded, load it dynamically
        if (typeof emailjs === 'undefined') {
            console.log("📥 Loading EmailJS SDK...");
            await this.loadEmailJSSDK();
        }
        
        // Initialize EmailJS with your public key
        if (typeof emailjs !== 'undefined' && emailjs.init) {
            emailjs.init(EMAILJS_PUBLIC_KEY);
            
            // Prepare email parameters
            const templateParams = {
                to_name: userData.name,
                to_email: userData.email,
                user_id: userId,
                artisan_id: artisanId,
                craft_type: userData.craft,
                registration_date: new Date().toLocaleDateString('en-IN', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                login_url: `${window.location.origin}/login.html`,
                support_email: 'support@artisanconnect.com',
                phone_number: userData.phone,
                location: userData.location,
                experience: userData.experience + ' years'
            };
            
            console.log("✉️ Sending email with params:", templateParams);
            
            // Send the email
            const response = await emailjs.send(
                EMAILJS_SERVICE_ID,
                EMAILJS_TEMPLATE_ID,
                templateParams
            );
            
            console.log("✅ Email sent successfully:", response);
            return { success: true, response };
            
        } else {
            console.warn("⚠️ EmailJS not available, sending fallback email");
            await this.sendFallbackEmail(userData, userId, artisanId);
            return { success: true, fallback: true };
        }
        
    } catch (error) {
        console.error("❌ Email sending failed:", error);
        
        // Try fallback method
        try {
            await this.sendFallbackEmail(userData, userId, artisanId);
            return { success: true, fallback: true };
        } catch (fallbackError) {
            console.error("❌ Fallback email also failed:", fallbackError);
            return { success: false, error: error.message };
        }
    }
}

// Load EmailJS SDK dynamically
async loadEmailJSSDK() {
    return new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@3/dist/email.min.js';
        script.onload = () => {
            console.log("✅ EmailJS SDK loaded");
            resolve();
        };
        script.onerror = () => {
            console.warn("⚠️ Failed to load EmailJS SDK");
            reject(new Error('Failed to load EmailJS SDK'));
        };
        document.head.appendChild(script);
    });
}

// Fallback email method using mailto link
async sendFallbackEmail(userData, userId, artisanId) {
    console.log("📧 Creating fallback email...");
    
    const subject = encodeURIComponent(`Welcome to ArtisanConnect - Registration Successful!`);
    const body = encodeURIComponent(`
Dear ${userData.name},

🎉 Welcome to ArtisanConnect! Your artisan account has been created successfully.

📋 YOUR ACCOUNT DETAILS:
• Name: ${userData.name}
• Email: ${userData.email}
• Phone: ${userData.phone}
• Location: ${userData.location}
• Craft: ${userData.craft}
• Experience: ${userData.experience} years
• User ID: ${userId}
• Artisan ID: ${artisanId}

📝 NEXT STEPS:
1. Verify your email address (check your inbox)
2. Complete your profile
3. Upload your portfolio images
4. Start receiving orders

🔗 LOGIN TO YOUR ACCOUNT:
${window.location.origin}/login.html

⏳ ACCOUNT STATUS:
Your account is currently under review. We'll notify you once it's approved (usually within 2-3 business days).

📞 NEED HELP?
Contact our support team:
• Email: support@artisanconnect.com
• Phone: +91-XXXXXXXXXX

Thank you for joining our community of talented artisans!

Best regards,
The ArtisanConnect Team
    `.trim());
    
    // Create a mailto link
    const mailtoLink = `mailto:${userData.email}?subject=${subject}&body=${body}`;
    
    // Show email in a modal for user to copy
    this.showEmailPreviewModal(userData, body);
    
    // Also try to open mail client
    setTimeout(() => {
        window.open(mailtoLink, '_blank');
    }, 1000);
    
    return true;
}

// Show email preview modal
showEmailPreviewModal(userData, emailBody) {
    const decodedBody = decodeURIComponent(emailBody);
    
    const modalHTML = `
        <div class="email-preview-modal" style="
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center;
            justify-content: center; z-index: 9999; padding: 20px;">
            <div style="background: white; border-radius: 10px; max-width: 600px;
                width: 100%; max-height: 80vh; overflow-y: auto; padding: 30px;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 20px;">
                    <h2 style="margin: 0; color: #3B82F6;">📧 Registration Email Preview</h2>
                    <button onclick="this.closest('.email-preview-modal').remove()" 
                        style="background: none; border: none; font-size: 24px; cursor: pointer;">
                        &times;
                    </button>
                </div>
                
                <div style="margin-bottom: 20px;">
                    <p><strong>To:</strong> ${userData.email}</p>
                    <p><strong>Subject:</strong> Welcome to ArtisanConnect - Registration Successful!</p>
                </div>
                
                <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <pre style="white-space: pre-wrap; font-family: Arial, sans-serif; font-size: 14px;">
${decodedBody}
                    </pre>
                </div>
                
                <div style="display: flex; gap: 10px; flex-wrap: wrap;">
                    <button onclick="navigator.clipboard.writeText('${decodedBody}'); 
                        alert('Email content copied to clipboard!');"
                        style="background: #3B82F6; color: white; border: none; padding: 10px 20px;
                        border-radius: 5px; cursor: pointer; flex: 1;">
                        📋 Copy Email Content
                    </button>
                    
                    <button onclick="window.open('mailto:${userData.email}?subject=${encodeURIComponent('Welcome to ArtisanConnect - Registration Successful!')}&body=${encodeURIComponent(decodedBody)}', '_blank');"
                        style="background: #10B981; color: white; border: none; padding: 10px 20px;
                        border-radius: 5px; cursor: pointer; flex: 1;">
                        📤 Open in Email Client
                    </button>
                    
                    <button onclick="this.closest('.email-preview-modal').remove()"
                        style="background: #6B7280; color: white; border: none; padding: 10px 20px;
                        border-radius: 5px; cursor: pointer; flex: 1;">
                        Close
                    </button>
                </div>
            </div>
        </div>
    `;
    
    const modalElement = document.createElement('div');
    modalElement.innerHTML = modalHTML;
    document.body.appendChild(modalElement);
}

// Show success modal with email information
showSuccessModal(formData) {
    const modalContent = `
        <div style="text-align: center; padding: 30px;">
            <div style="font-size: 60px; color: #10B981; margin-bottom: 20px;">✅</div>
            <h2 style="color: #3B82F6; margin-bottom: 15px;">Registration Successful!</h2>
            
            <div style="background: #f0f9ff; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h4 style="margin-top: 0; color: #0369A1;">📧 Emails Sent To:</h4>
                <p style="font-size: 18px; font-weight: bold; color: #1E40AF;">${formData.email}</p>
                
                <div style="text-align: left; margin-top: 20px;">
                    <p>✅ <strong>Verification Email</strong> - from Firebase Auth</p>
                    <p>✅ <strong>Welcome Email</strong> - with your account details</p>
                </div>
            </div>
            
            <div style="background: #f8fafc; padding: 15px; border-radius: 8px; margin: 20px 0; text-align: left;">
                <h4 style="margin-top: 0; color: #475569;">📝 What to do next:</h4>
                <ol style="margin: 10px 0; padding-left: 20px;">
                    <li>Check your email inbox</li>
                    <li>Verify your email address</li>
                    <li>Check spam folder if not received</li>
                    <li>Login to complete your profile</li>
                </ol>
            </div>
            
            <div style="display: flex; gap: 10px; justify-content: center; margin-top: 30px;">
                <button onclick="window.location.href='login.html'" 
                    style="background: #3B82F6; color: white; border: none; padding: 12px 24px;
                    border-radius: 5px; cursor: pointer; font-weight: bold;">
                    Go to Login
                </button>
                
                <button onclick="this.closest('.modal-overlay').remove()"
                    style="background: #6B7280; color: white; border: none; padding: 12px 24px;
                    border-radius: 5px; cursor: pointer;">
                    Close
                </button>
            </div>
        </div>
    `;
    
    // Use your existing modal system or create a simple one
    if (typeof Components !== 'undefined' && Components.showModal) {
        Components.showModal({
            title: 'Registration Complete',
            content: modalContent,
            size: 'md'
        });
    } else {
        // Simple modal fallback
        const modal = document.createElement('div');
        modal.className = 'success-modal-overlay';
        modal.style.cssText = `
            position: fixed; top: 0; left: 0; width: 100%; height: 100%;
            background: rgba(0,0,0,0.5); display: flex; align-items: center;
            justify-content: center; z-index: 9999; padding: 20px;
        `;
        modal.innerHTML = `
            <div style="background: white; border-radius: 10px; max-width: 500px;
                width: 100%; padding: 30px; box-shadow: 0 10px 25px rgba(0,0,0,0.1);">
                ${modalContent}
            </div>
        `;
        document.body.appendChild(modal);
        
        // Close on overlay click
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
}

    async submitSupporterForm() {
        try {
            Utils.toggleLoading(true);
            
            // Get form data
            const supporterData = {
                name: document.getElementById('supporterName').value.trim(),
                email: document.getElementById('supporterEmail').value.trim(),
                location: document.getElementById('supporterLocation').value.trim(),
                interests: Array.from(document.getElementById('interests').selectedOptions).map(opt => opt.value),
                supportLevel: document.getElementById('supportLevel').value,
                message: document.getElementById('supporterMessage').value.trim(),
                role: 'supporter',
                status: 'active',
                createdAt: new Date().toISOString(),
                newsletter: document.getElementById('supporterNewsletter')?.checked || false
            };
            
            // 1. Save supporter data to Firestore
            const supporterRef = await addDoc(collection(db, 'supporters'), supporterData);
            
            // 2. Create user account (optional for supporters)
            const email = supporterData.email;
            const password = this.generatePassword();
            
            try {
                const userCredential = await createUserWithEmailAndPassword(auth, email, password);
                
                // Save user data
                await setDoc(doc(db, 'users', userCredential.user.uid), {
                    uid: userCredential.user.uid,
                    email: userCredential.user.email,
                    role: 'supporter',
                    supporterId: supporterRef.id,
                    profileData: supporterData,
                    createdAt: new Date().toISOString(),
                    isActive: true,
                    preferences: {
                        notifications: true,
                        newsletter: supporterData.newsletter
                    }
                });
                
            } catch (authError) {
                // If user already exists or auth not required for supporters, continue
                console.log('Auth not required for supporter:', authError.message);
            }
            
            // 3. Send welcome email
            await this.sendWelcomeEmail(email, 'supporter');
            
            // Show success message
            this.showSuccessMessage('supporter');
            
            // Reset form
            this.resetSupporterForm();
            
            Utils.toggleLoading(false);
            
            Utils.showNotification('Welcome to ArtisanConnect! Check your email for details.', 'success');
            
        } catch (error) {
            console.error('Error submitting supporter form:', error);
            Utils.toggleLoading(false);
            Utils.showNotification('Failed to submit application. Please try again.', 'error');
        }
    }

    async uploadFileToStorage(file, folder) {
        try {
            // Create a unique filename
            const timestamp = Date.now();
            const filename = `${folder}/${timestamp}_${file.name.replace(/\s+/g, '_')}`;
            
            // Create storage reference
            const storageRef = ref(storage, filename);
            
            // Upload file
            const snapshot = await uploadBytes(storageRef, file);
            
            // Get download URL
            const downloadURL = await getDownloadURL(snapshot.ref);
            
            return downloadURL;
            
        } catch (error) {
            console.error('Error uploading file to storage:', error);
            throw new Error('Failed to upload file');
        }
    }

    async sendWelcomeEmail(email, role) {
        // In production, this would call a Firebase Cloud Function or email service
        // For now, just log it
        console.log(`Welcome email sent to ${email} as ${role}`);
        return Promise.resolve();
    }

    generatePassword() {
        // Generate a random password for new users
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
        let password = '';
        for (let i = 0; i < 12; i++) {
            password += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return password;
    }

    showSuccessMessage(role) {
        // Hide all forms
        if (this.elements.artisanForm) this.elements.artisanForm.style.display = 'none';
        if (this.elements.supporterForm) this.elements.supporterForm.style.display = 'none';
        
        // Update success message based on role
        const message = this.elements.successMessage.querySelector('.lead');
        if (role === 'artisan') {
            message.textContent = 'Thank you for joining as an artisan! We\'ll review your application and contact you within 2-3 business days.';
        } else {
            message.textContent = 'Welcome to ArtisanConnect! You can now start discovering and supporting artisans.';
        }
        
        // Show success message
        this.elements.successMessage.style.display = 'block';
        
        // Scroll to success message
        this.elements.successMessage.scrollIntoView({ behavior: 'smooth' });
    }

    resetArtisanForm() {
        // Reset form data
        this.currentStep = 1;
        this.uploadedProfilePic = null;
        this.uploadedGalleryImages = [];
        this.artisanFormData = {};
        
        // Reset form elements
        if (this.elements.artisanRegistrationForm) {
            this.elements.artisanRegistrationForm.reset();
        }
        
        // Clear previews
        if (this.elements.profilePreview) this.elements.profilePreview.innerHTML = '';
        if (this.elements.galleryPreview) this.elements.galleryPreview.innerHTML = '';
        if (this.elements.craftTags) this.elements.craftTags.innerHTML = '';
        
        // Reset progress
        this.updateProgress();
    }

    resetSupporterForm() {
        // Reset form
        if (this.elements.supporterRegistrationForm) {
            this.elements.supporterRegistrationForm.reset();
        }
    }

    showError(message) {
        // Create error display
        const errorDiv = document.createElement('div');
        errorDiv.className = 'global-error';
        errorDiv.innerHTML = `
            <div class="error-content">
                <i class="fas fa-exclamation-triangle"></i>
                <div>
                    <h3>Something went wrong</h3>
                    <p>${message}</p>
                    <button class="btn btn-sm btn-primary" onclick="location.reload()">
                        Reload Page
                    </button>
                </div>
            </div>
        `;
        
        document.body.appendChild(errorDiv);
        
        // Auto-remove after 10 seconds
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.remove();
            }
        }, 10000);
    }
}

// ===== INITIALIZE JOIN COMMUNITY PAGE =====
document.addEventListener('DOMContentLoaded', () => {
    new JoinCommunity();
});

// Export for module usage
export { JoinCommunity };