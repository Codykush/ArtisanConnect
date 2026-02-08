// ===== DATABASE OPERATIONS =====
// Updated to work with your new Firebase project

import { 
    db, 
    auth,
    collection, 
    getDocs,
    doc,
    getDoc,
    addDoc,
    updateDoc,
    deleteDoc,
    setDoc,
    query,
    where,
    orderBy,
    limit,
    serverTimestamp 
} from './firebase.js';

class ArtisanDB {
    constructor() {
        this.artisansCollection = 'artisans';
        this.usersCollection = 'users';
        this.reviewsCollection = 'reviews';
        this.messagesCollection = 'messages';
    }

    // Get all active artisans
    async getAllArtisans() {
        try {
            const artisansRef = collection(db, this.artisansCollection);
            const q = query(
                artisansRef, 
                where('status', '==', 'active'),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                console.log('No artisans found in database');
                return [];
            }
            
            const artisans = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                // Convert Firestore timestamps to JS Dates if needed
                createdAt: doc.data().createdAt?.toDate() || new Date(),
                updatedAt: doc.data().updatedAt?.toDate() || new Date()
            }));
            
            return artisans;
        } catch (error) {
            console.error('Error getting artisans:', error);
            // Return empty array instead of sample data for production
            return [];
        }
    }

    // Get featured artisans
    async getFeaturedArtisans(count = 6) {
        try {
            const artisansRef = collection(db, this.artisansCollection);
            const q = query(
                artisansRef, 
                where('featured', '==', true),
                where('status', '==', 'active'),
                orderBy('rating', 'desc'),
                limit(count)
            );
            const snapshot = await getDocs(q);
            
            if (snapshot.empty) {
                console.log('No featured artisans found');
                return [];
            }
            
            const artisans = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            return artisans;
        } catch (error) {
            console.error('Error getting featured artisans:', error);
            return [];
        }
    }

    // Get artisan by ID
    async getArtisanById(id) {
        try {
            if (!id) {
                throw new Error('Artisan ID is required');
            }
            
            const artisanRef = doc(db, this.artisansCollection, id);
            const snapshot = await getDoc(artisanRef);
            
            if (!snapshot.exists()) {
                console.log(`Artisan ${id} not found`);
                return null;
            }
            
            return { 
                id: snapshot.id, 
                ...snapshot.data(),
                createdAt: snapshot.data().createdAt?.toDate() || new Date(),
                updatedAt: snapshot.data().updatedAt?.toDate() || new Date()
            };
        } catch (error) {
            console.error('Error getting artisan:', error);
            return null;
        }
    }

    // Search artisans
    async searchArtisans(searchTerm, filters = {}) {
        try {
            let constraints = [
                where('status', '==', 'active')
            ];
            
            // Apply search term
            if (searchTerm && searchTerm.trim() !== '') {
                const term = searchTerm.toLowerCase().trim();
                // We'll filter after fetching since Firestore doesn't support OR queries well
            }
            
            // Apply other filters
            if (filters.craft && filters.craft !== 'all') {
                constraints.push(where('craft', '==', filters.craft));
            }
            
            if (filters.location && filters.location !== 'all') {
                constraints.push(where('location.city', '==', filters.location));
            }
            
            const artisansRef = collection(db, this.artisansCollection);
            const q = query(artisansRef, ...constraints);
            const snapshot = await getDocs(q);
            
            let artisans = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            
            // Apply search term filtering in memory
            if (searchTerm && searchTerm.trim() !== '') {
                const term = searchTerm.toLowerCase().trim();
                artisans = artisans.filter(artisan => {
                    const searchFields = [
                        artisan.name?.toLowerCase() || '',
                        artisan.craft?.toLowerCase() || '',
                        artisan.specialty?.toLowerCase() || '',
                        artisan.description?.toLowerCase() || '',
                        artisan.location?.city?.toLowerCase() || '',
                        ...(artisan.tags || []).map(tag => tag.toLowerCase())
                    ].join(' ');
                    
                    return searchFields.includes(term);
                });
            }
            
            return artisans;
        } catch (error) {
            console.error('Error searching artisans:', error);
            return [];
        }
    }

    // Create new artisan
    async createArtisan(artisanData, userId) {
        try {
            const artisansRef = collection(db, this.artisansCollection);
            
            // Prepare artisan data
            const artisanDoc = {
                ...artisanData,
                userId: userId,
                status: 'pending', // New artisans need approval
                featured: false,
                verified: false,
                rating: 0,
                reviewCount: 0,
                views: 0,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp()
            };
            
            const docRef = await addDoc(artisansRef, artisanDoc);
            
            // Update user document with artisan ID
            const userRef = doc(db, this.usersCollection, userId);
            await updateDoc(userRef, {
                artisanId: docRef.id,
                role: 'artisan',
                updatedAt: serverTimestamp()
            });
            
            return { 
                success: true, 
                id: docRef.id,
                message: 'Artisan profile created successfully. Awaiting verification.'
            };
        } catch (error) {
            console.error('Error creating artisan:', error);
            return { 
                success: false, 
                error: error.message,
                message: 'Failed to create artisan profile'
            };
        }
    }

    // Update artisan profile
    async updateArtisan(artisanId, updates) {
        try {
            const artisanRef = doc(db, this.artisansCollection, artisanId);
            
            await updateDoc(artisanRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            
            return { success: true, message: 'Artisan profile updated successfully' };
        } catch (error) {
            console.error('Error updating artisan:', error);
            return { success: false, error: error.message };
        }
    }

    // Increment view count
    async incrementViewCount(artisanId) {
        try {
            const artisanRef = doc(db, this.artisansCollection, artisanId);
            const snapshot = await getDoc(artisanRef);
            
            if (snapshot.exists()) {
                const currentViews = snapshot.data().views || 0;
                await updateDoc(artisanRef, {
                    views: currentViews + 1,
                    updatedAt: serverTimestamp()
                });
            }
        } catch (error) {
            console.error('Error incrementing view count:', error);
        }
    }

    // Get artisans by user ID
    async getArtisansByUserId(userId) {
        try {
            const artisansRef = collection(db, this.artisansCollection);
            const q = query(
                artisansRef,
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const snapshot = await getDocs(q);
            
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting user artisans:', error);
            return [];
        }
    }
}

class UserDB {
    constructor() {
        this.usersCollection = 'users';
    }

    // Get user profile
    async getUserProfile(userId) {
        try {
            const userRef = doc(db, this.usersCollection, userId);
            const snapshot = await getDoc(userRef);
            
            if (snapshot.exists()) {
                return { 
                    id: snapshot.id, 
                    ...snapshot.data(),
                    createdAt: snapshot.data().createdAt?.toDate() || new Date(),
                    lastLogin: snapshot.data().lastLogin?.toDate() || new Date()
                };
            }
            return null;
        } catch (error) {
            console.error('Error getting user profile:', error);
            return null;
        }
    }

    // Create or update user profile
    async createUserProfile(userId, userData) {
        try {
            const userRef = doc(db, this.usersCollection, userId);
            const snapshot = await getDoc(userRef);
            
            if (snapshot.exists()) {
                // Update existing user
                await updateDoc(userRef, {
                    ...userData,
                    updatedAt: serverTimestamp(),
                    lastLogin: serverTimestamp()
                });
            } else {
                // Create new user
                await setDoc(userRef, {
                    ...userData,
                    uid: userId,
                    favorites: [],
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    lastLogin: serverTimestamp(),
                    emailVerified: false,
                    isActive: true
                });
            }
            
            return true;
        } catch (error) {
            console.error('Error creating user profile:', error);
            return false;
        }
    }

    // Toggle favorite artisan
    async toggleFavorite(userId, artisanId) {
        try {
            const userRef = doc(db, this.usersCollection, userId);
            const user = await this.getUserProfile(userId);
            
            if (!user) {
                throw new Error('User not found');
            }
            
            let favorites = user.favorites || [];
            const isFavorite = favorites.includes(artisanId);
            
            if (isFavorite) {
                // Remove from favorites
                favorites = favorites.filter(id => id !== artisanId);
            } else {
                // Add to favorites
                favorites.push(artisanId);
            }
            
            await updateDoc(userRef, {
                favorites: favorites,
                updatedAt: serverTimestamp()
            });
            
            return { 
                success: true, 
                favorites: favorites,
                isFavorite: !isFavorite
            };
        } catch (error) {
            console.error('Error toggling favorite:', error);
            return { success: false, error: error.message };
        }
    }

    // Update user profile
    async updateUserProfile(userId, updates) {
        try {
            const userRef = doc(db, this.usersCollection, userId);
            
            await updateDoc(userRef, {
                ...updates,
                updatedAt: serverTimestamp()
            });
            
            return { success: true, message: 'Profile updated successfully' };
        } catch (error) {
            console.error('Error updating user profile:', error);
            return { success: false, error: error.message };
        }
    }
}

class ReviewDB {
    constructor() {
        this.reviewsCollection = 'reviews';
    }

    // Add review for artisan
    async addReview(artisanId, userId, reviewData) {
        try {
            const reviewsRef = collection(db, this.reviewsCollection);
            
            const reviewDoc = {
                artisanId: artisanId,
                userId: userId,
                ...reviewData,
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
                helpfulCount: 0,
                reported: false
            };
            
            const docRef = await addDoc(reviewsRef, reviewDoc);
            
            // Update artisan's rating and review count
            await this.updateArtisanRating(artisanId);
            
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error adding review:', error);
            return { success: false, error: error.message };
        }
    }

    // Get reviews for artisan
    async getArtisanReviews(artisanId, limitCount = 10) {
        try {
            const reviewsRef = collection(db, this.reviewsCollection);
            const q = query(
                reviewsRef,
                where('artisanId', '==', artisanId),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );
            
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting reviews:', error);
            return [];
        }
    }

    // Update artisan's average rating
    async updateArtisanRating(artisanId) {
        try {
            const reviews = await this.getArtisanReviews(artisanId, 1000); // Get all reviews
            
            if (reviews.length === 0) {
                return;
            }
            
            const totalRating = reviews.reduce((sum, review) => sum + (review.rating || 0), 0);
            const averageRating = totalRating / reviews.length;
            
            const artisanRef = doc(db, 'artisans', artisanId);
            await updateDoc(artisanRef, {
                rating: parseFloat(averageRating.toFixed(1)),
                reviewCount: reviews.length,
                updatedAt: serverTimestamp()
            });
        } catch (error) {
            console.error('Error updating artisan rating:', error);
        }
    }
}

class MessageDB {
    constructor() {
        this.messagesCollection = 'messages';
    }

    // Send message to artisan
    async sendMessage(artisanId, messageData) {
        try {
            const messagesRef = collection(db, this.messagesCollection);
            
            const messageDoc = {
                artisanId: artisanId,
                ...messageData,
                status: 'unread',
                read: false,
                archived: false,
                createdAt: serverTimestamp()
            };
            
            const docRef = await addDoc(messagesRef, messageDoc);
            
            return { success: true, id: docRef.id };
        } catch (error) {
            console.error('Error sending message:', error);
            return { success: false, error: error.message };
        }
    }

    // Get messages for artisan
    async getMessages(artisanId, limitCount = 50) {
        try {
            const messagesRef = collection(db, this.messagesCollection);
            const q = query(
                messagesRef,
                where('artisanId', '==', artisanId),
                orderBy('createdAt', 'desc'),
                limit(limitCount)
            );
            
            const snapshot = await getDocs(q);
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        } catch (error) {
            console.error('Error getting messages:', error);
            return [];
        }
    }

    // Mark message as read
    async markAsRead(messageId) {
        try {
            const messageRef = doc(db, this.messagesCollection, messageId);
            await updateDoc(messageRef, {
                read: true,
                status: 'read',
                updatedAt: serverTimestamp()
            });
            
            return { success: true };
        } catch (error) {
            console.error('Error marking message as read:', error);
            return { success: false, error: error.message };
        }
    }
}

// Create instances
const artisanDB = new ArtisanDB();
const userDB = new UserDB();
const reviewDB = new ReviewDB();
const messageDB = new MessageDB();

// Export instances
export { artisanDB, userDB, reviewDB, messageDB };

// Helper function to populate sample data (for testing)
export async function populateSampleData() {
    console.log('Populating sample data...');
    
    // Sample artisans data
    const sampleArtisans = [
        {
            name: 'Rajesh Kumar',
            craft: 'Pottery',
            specialty: 'Terracotta & Blue Pottery',
            description: 'Master potter with 15+ years of experience in traditional Indian pottery techniques. Specializes in terracotta and blue pottery with intricate hand-painted designs.',
            location: {
                city: 'Delhi',
                state: 'Delhi',
                address: 'Craft Street, Artisan Colony',
                latitude: 28.6139,
                longitude: 77.2090
            },
            experience: 15,
            rating: 4.8,
            reviewCount: 124,
            featured: true,
            verified: true,
            imageUrl: 'https://images.unsplash.com/photo-1605000797499-95a51c5269ae?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
            tags: ['Handmade', 'Terracotta', 'Blue Pottery', 'Traditional'],
            skills: ['Pottery Wheel', 'Hand Building', 'Glazing', 'Firing'],
            contact: {
                phone: '+91 98765 43210',
                email: 'rajesh@artisanconnect.com'
            },
            social: {
                instagram: 'https://instagram.com/rajeshpottery',
                facebook: 'https://facebook.com/rajeshpottery'
            },
            workshopType: 'studio',
            priceRange: 'mid',
            languages: ['Hindi', 'English'],
            commission: true,
            workshops: true,
            status: 'active'
        }
        // Add more sample artisans as needed
    ];
    
    try {
        for (const artisan of sampleArtisans) {
            await artisanDB.createArtisan(artisan, 'sample-user-id');
        }
        console.log('Sample data populated successfully');
    } catch (error) {
        console.error('Error populating sample data:', error);
    }
}