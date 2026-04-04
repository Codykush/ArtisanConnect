import {
  db,
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  setDoc,
  query,
  where
} from "./firebase.js";

const now = () => new Date().toISOString();

class UserDB {
  constructor() {
    this.collectionName = "users";
  }

  async saveUser(user) {
    try {
      await setDoc(
        doc(db, this.collectionName, user.uid),
        {
          ...user,
          updatedAt: now()
        },
        { merge: true }
      );
      return { success: true };
    } catch (error) {
      console.error("saveUser error:", error);
      return { success: false, error: error.message };
    }
  }

  async getUser(uid) {
    try {
      const snap = await getDoc(doc(db, this.collectionName, uid));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() };
    } catch (error) {
      console.error("getUser error:", error);
      return null;
    }
  }
}

class ArtisanDB {
  constructor() {
    this.collectionName = "artisans";
  }

  async createArtisan(data) {
    try {
      const refDoc = await addDoc(collection(db, this.collectionName), {
        ...data,
        status: "active",
        featured: false,
        verified: false,
        viewCount: 0,
        reviewCount: 0,
        createdAt: now(),
        updatedAt: now()
      });
      return { success: true, id: refDoc.id };
    } catch (error) {
      console.error("createArtisan error:", error);
      return { success: false, error: error.message };
    }
  }

  async updateArtisan(id, updates) {
    try {
      await updateDoc(doc(db, this.collectionName, id), {
        ...updates,
        updatedAt: now()
      });
      return { success: true };
    } catch (error) {
      console.error("updateArtisan error:", error);
      return { success: false, error: error.message };
    }
  }

  async getArtisanById(id) {
    try {
      const snap = await getDoc(doc(db, this.collectionName, id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() };
    } catch (error) {
      console.error("getArtisanById error:", error);
      return null;
    }
  }

  async getArtisanByUserId(userId) {
    try {
      const q = query(collection(db, this.collectionName), where("userId", "==", userId));
      const snap = await getDocs(q);
      if (snap.empty) return null;
      const first = snap.docs[0];
      return { id: first.id, ...first.data() };
    } catch (error) {
      console.error("getArtisanByUserId error:", error);
      return null;
    }
  }

  async getAllArtisans() {
    try {
      const q = query(collection(db, this.collectionName), where("status", "==", "active"));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return list.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    } catch (error) {
      console.error("getAllArtisans error:", error);
      return [];
    }
  }

  async incrementView(id) {
    try {
      const artisan = await this.getArtisanById(id);
      if (!artisan) return;
      await updateDoc(doc(db, this.collectionName, id), {
        viewCount: Number(artisan.viewCount || 0) + 1,
        updatedAt: now()
      });
    } catch (error) {
      console.error("incrementView error:", error);
    }
  }

  async deleteArtisan(id) {
    try {
      await deleteDoc(doc(db, this.collectionName, id));
      return { success: true };
    } catch (error) {
      console.error("deleteArtisan error:", error);
      return { success: false, error: error.message };
    }
  }

  async isOwner(artisanId, currentUser) {
    if (!currentUser) return false;
    const artisan = await this.getArtisanById(artisanId);
    if (!artisan) return false;
    return currentUser.uid === artisan.userId;
  }
}

class ProductDB {
  constructor() {
    this.collectionName = "products";
  }

  async addProduct(data) {
    try {
      const refDoc = await addDoc(collection(db, this.collectionName), {
        ...data,
        status: "active",
        views: 0,
        impressions: 0,
        buyRequestsCount: 0,
        reviewsCount: 0,
        createdAt: now(),
        updatedAt: now()
      });
      return { success: true, id: refDoc.id };
    } catch (error) {
      console.error("addProduct error:", error);
      return { success: false, error: error.message };
    }
  }

  async updateProduct(id, updates) {
    try {
      await updateDoc(doc(db, this.collectionName, id), {
        ...updates,
        updatedAt: now()
      });
      return { success: true };
    } catch (error) {
      console.error("updateProduct error:", error);
      return { success: false, error: error.message };
    }
  }

  async deleteProduct(id) {
    try {
      await deleteDoc(doc(db, this.collectionName, id));
      return { success: true };
    } catch (error) {
      console.error("deleteProduct error:", error);
      return { success: false, error: error.message };
    }
  }

  async getProductById(id) {
    try {
      const snap = await getDoc(doc(db, this.collectionName, id));
      if (!snap.exists()) return null;
      return { id: snap.id, ...snap.data() };
    } catch (error) {
      console.error("getProductById error:", error);
      return null;
    }
  }

  async getProductsByArtisanId(artisanId) {
    try {
      const q = query(collection(db, this.collectionName), where("artisanId", "==", artisanId));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return list.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    } catch (error) {
      console.error("getProductsByArtisanId error:", error);
      return [];
    }
  }

  async incrementView(id) {
    try {
      const product = await this.getProductById(id);
      if (!product) return;
      await updateDoc(doc(db, this.collectionName, id), {
        views: Number(product.views || 0) + 1,
        impressions: Number(product.impressions || 0) + 1,
        updatedAt: now()
      });
    } catch (error) {
      console.error("incrementView error:", error);
    }
  }
}

class ReviewDB {
  constructor() {
    this.collectionName = "productReviews";
  }

  async addReview(data) {
    try {
      const refDoc = await addDoc(collection(db, this.collectionName), {
        ...data,
        createdAt: now()
      });

      const product = await productDB.getProductById(data.productId);
      if (product) {
        await productDB.updateProduct(data.productId, {
          reviewsCount: Number(product.reviewsCount || 0) + 1
        });
      }

      return { success: true, id: refDoc.id };
    } catch (error) {
      console.error("addReview error:", error);
      return { success: false, error: error.message };
    }
  }

  async getProductReviews(productId) {
    try {
      const q = query(collection(db, this.collectionName), where("productId", "==", productId));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return list.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    } catch (error) {
      console.error("getProductReviews error:", error);
      return [];
    }
  }
}

class BuyRequestDB {
  constructor() {
    this.collectionName = "buyRequests";
  }

  async addRequest(data) {
    try {
      const refDoc = await addDoc(collection(db, this.collectionName), {
        ...data,
        status: "new",
        createdAt: now()
      });

      const product = await productDB.getProductById(data.productId);
      if (product) {
        await productDB.updateProduct(data.productId, {
          buyRequestsCount: Number(product.buyRequestsCount || 0) + 1
        });
      }

      return { success: true, id: refDoc.id };
    } catch (error) {
      console.error("addRequest error:", error);
      return { success: false, error: error.message };
    }
  }

  async getRequestsForArtisan(artisanId) {
    try {
      const q = query(collection(db, this.collectionName), where("artisanId", "==", artisanId));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return list.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    } catch (error) {
      console.error("getRequestsForArtisan error:", error);
      return [];
    }
  }
}

class MessageDB {
  constructor() {
    this.conversationsCollection = "conversations";
    this.messagesCollection = "messages";
  }

  async getOrCreateConversation(artisanId, userId, artisanName, userName) {
    const q = query(collection(db, this.conversationsCollection), where("artisanId", "==", artisanId));
    const snap = await getDocs(q);

    const found = snap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .find((c) => c.userId === userId);

    if (found) return found.id;

    const refDoc = await addDoc(collection(db, this.conversationsCollection), {
      artisanId,
      userId,
      artisanName,
      userName,
      lastMessage: "",
      updatedAt: now(),
      createdAt: now()
    });

    return refDoc.id;
  }

  async sendMessage({ artisanId, userId, artisanName, userName, senderId, senderRole, text }) {
    try {
      const conversationId = await this.getOrCreateConversation(
        artisanId,
        userId,
        artisanName,
        userName
      );

      await addDoc(collection(db, this.messagesCollection), {
        conversationId,
        artisanId,
        userId,
        senderId,
        senderRole,
        text,
        read: false,
        createdAt: now()
      });

      await updateDoc(doc(db, this.conversationsCollection, conversationId), {
        lastMessage: text,
        updatedAt: now()
      });

      return { success: true, conversationId };
    } catch (error) {
      console.error("sendMessage error:", error);
      return { success: false, error: error.message };
    }
  }

  async getInboxForArtisan(artisanId) {
    try {
      const q = query(collection(db, this.conversationsCollection), where("artisanId", "==", artisanId));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return list.sort((a, b) => String(b.updatedAt || "").localeCompare(String(a.updatedAt || "")));
    } catch (error) {
      console.error("getInboxForArtisan error:", error);
      return [];
    }
  }

  async getMessages(conversationId) {
    try {
      const q = query(collection(db, this.messagesCollection), where("conversationId", "==", conversationId));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return list.sort((a, b) => String(a.createdAt || "").localeCompare(String(b.createdAt || "")));
    } catch (error) {
      console.error("getMessages error:", error);
      return [];
    }
  }

  async getUnreadCountForArtisan(artisanId) {
    try {
      const inbox = await this.getInboxForArtisan(artisanId);
      let unread = 0;

      for (const convo of inbox) {
        const messages = await this.getMessages(convo.id);
        unread += messages.filter(
          (msg) => msg.senderRole !== "artisan" && !msg.read
        ).length;
      }

      return unread;
    } catch (error) {
      console.error("getUnreadCountForArtisan error:", error);
      return 0;
    }
  }

  async markConversationAsRead(conversationId) {
    try {
      const messages = await this.getMessages(conversationId);
      const unreadMessages = messages.filter(
        (msg) => msg.senderRole !== "artisan" && !msg.read
      );

      await Promise.all(
        unreadMessages.map((msg) =>
          updateDoc(doc(db, this.messagesCollection, msg.id), { read: true })
        )
      );

      return { success: true };
    } catch (error) {
      console.error("markConversationAsRead error:", error);
      return { success: false, error: error.message };
    }
  }
}

class FollowDB {
  constructor() {
    this.collectionName = "follows";
  }

  async followArtisan({ artisanId, artisanName, followerId, followerName, followerEmail }) {
    try {
      const existing = await this.getFollowRecord(artisanId, followerId);
      if (existing) return { success: true, id: existing.id, alreadyFollowing: true };

      const refDoc = await addDoc(collection(db, this.collectionName), {
        artisanId,
        artisanName,
        followerId,
        followerName,
        followerEmail,
        createdAt: now()
      });

      return { success: true, id: refDoc.id, alreadyFollowing: false };
    } catch (error) {
      console.error("followArtisan error:", error);
      return { success: false, error: error.message };
    }
  }

  async unfollowArtisan(artisanId, followerId) {
    try {
      const existing = await this.getFollowRecord(artisanId, followerId);
      if (!existing) return { success: true };
      await deleteDoc(doc(db, this.collectionName, existing.id));
      return { success: true };
    } catch (error) {
      console.error("unfollowArtisan error:", error);
      return { success: false, error: error.message };
    }
  }

  async getFollowRecord(artisanId, followerId) {
    try {
      const q = query(collection(db, this.collectionName), where("artisanId", "==", artisanId));
      const snap = await getDocs(q);
      const record = snap.docs
        .map((d) => ({ id: d.id, ...d.data() }))
        .find((item) => item.followerId === followerId);
      return record || null;
    } catch (error) {
      console.error("getFollowRecord error:", error);
      return null;
    }
  }

  async isFollowing(artisanId, followerId) {
    const record = await this.getFollowRecord(artisanId, followerId);
    return Boolean(record);
  }

  async getFollowersForArtisan(artisanId) {
    try {
      const q = query(collection(db, this.collectionName), where("artisanId", "==", artisanId));
      const snap = await getDocs(q);
      const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      return list.sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || "")));
    } catch (error) {
      console.error("getFollowersForArtisan error:", error);
      return [];
    }
  }
}

export const userDB = new UserDB();
export const artisanDB = new ArtisanDB();
export const productDB = new ProductDB();
export const reviewDB = new ReviewDB();
export const buyRequestDB = new BuyRequestDB();
export const messageDB = new MessageDB();
export const followDB = new FollowDB();
