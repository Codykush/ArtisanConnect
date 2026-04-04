import { artisanDB, productDB, messageDB, followDB } from "./database.js";
import { uploadImageToCloudinary } from "./cloudinary.js";

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser")) || null;
  } catch {
    return null;
  }
}

function validateImage(file, maxMB = 2) {
  const allowed = ["image/jpeg", "image/png", "image/webp", "image/jpg"];
  if (!allowed.includes(file.type)) {
    throw new Error("Only JPG, PNG and WEBP images are allowed.");
  }
  if (file.size > maxMB * 1024 * 1024) {
    throw new Error(`Image must be smaller than ${maxMB}MB.`);
  }
}

function escapeHtml(value = "") {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

class ArtisanProfile {
  constructor() {
    this.artisanId = new URLSearchParams(window.location.search).get("id");
    this.currentUser = getCurrentUser();
    this.artisan = null;
    this.products = [];
    this.isOwner = false;
    this.isFollowing = false;
    this.ownerInbox = [];
    this.ownerFollowers = [];
    this.init();
  }

  async init() {
    if (!this.artisanId) return;

    this.artisan = await artisanDB.getArtisanById(this.artisanId);
    if (!this.artisan) return;

    await artisanDB.incrementView(this.artisanId);

    this.isOwner = await artisanDB.isOwner(this.artisanId, this.currentUser);
    this.products = await productDB.getProductsByArtisanId(this.artisanId);

    if (this.currentUser && !this.isOwner) {
      this.isFollowing = await followDB.isFollowing(this.artisanId, this.currentUser.uid);
    }

    if (this.isOwner) {
      this.ownerInbox = await messageDB.getInboxForArtisan(this.artisanId);
      this.ownerFollowers = await followDB.getFollowersForArtisan(this.artisanId);
    }

    this.renderMain();
    this.renderAbout();
    this.renderContact();
    this.renderGallery();
    this.renderProducts();
    this.renderOwnerPanels();
    this.bindActions();
  }

  renderMain() {
    const city =
      this.artisan.location?.city ||
      this.artisan.location ||
      "Location unavailable";

    const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(city)}`;
    const img = this.artisan.imageUrl || "images/default-artisan.jpg";
    const artisanEmail = this.artisan.email || "support@artisanconnect.com";
    const artisanSubject = encodeURIComponent(`Inquiry for ${this.artisan.name}`);
    const artisanBody = encodeURIComponent(`Hello ${this.artisan.name},\n\nI would like to connect with you through ArtisanConnect.\n`);
    const ceoEmail = "ceo@artisanconnect.com";
    const followLabel = this.isFollowing ? "Following" : "Follow Artisan";

    document.getElementById("profileMain").innerHTML = `
      <div class="profile-header-card premium">
        <div class="profile-avatar-container">
          <div class="profile-avatar-frame">
            <img src="${img}" alt="${escapeHtml(this.artisan.name)}" class="profile-avatar">
          </div>

          ${
            this.isOwner
              ? `
                <div style="margin-top:12px;">
                  <input type="file" id="replaceProfileImage" accept="image/*" class="form-control">
                  <button class="btn btn-outline btn-sm" id="replaceProfileImageBtn" style="margin-top:8px;">
                    Update Profile Photo
                  </button>
                </div>
              `
              : ""
          }
        </div>

        <div class="profile-info-main">
          <h1 class="profile-name">${escapeHtml(this.artisan.name)}</h1>

          <div class="profile-tags">
            <span class="profile-tag craft-tag">${escapeHtml(this.artisan.craft || "Craft")}</span>
            <a href="${mapLink}" target="_blank" class="profile-tag location-tag">${escapeHtml(city)}</a>
            <span class="profile-tag experience-tag">${escapeHtml(this.artisan.experience || 0)}+ Years</span>
          </div>

          <div class="profile-bio-preview">
            <p>${escapeHtml(this.artisan.bio || this.artisan.description || "No bio available.")}</p>
          </div>

          <div class="profile-actions-main" style="flex-wrap:wrap;">
            <a href="${mapLink}" target="_blank" class="btn btn-outline">View Live Location</a>
            <a href="mailto:${artisanEmail}?subject=${artisanSubject}&body=${artisanBody}" class="btn btn-outline">Email Artisan</a>
            <a href="mailto:${ceoEmail}?subject=ArtisanConnect Support" class="btn btn-outline">Email CEO</a>
            ${
              this.isOwner
                ? `
                  <button class="btn btn-outline" id="addProductBtn">Add Product</button>
                  <button class="btn btn-outline danger-lite" id="deleteProfileBtn">Delete Profile</button>
                `
                : `
                  <button class="btn btn-primary" id="messageArtisanBtn" data-requires-auth="true" data-redirect="artisan-profile.html?id=${this.artisanId}">Message Artisan</button>
                  <button class="btn btn-outline" id="followArtisanBtn" data-requires-auth="true" data-redirect="artisan-profile.html?id=${this.artisanId}">${followLabel}</button>
                `
            }
          </div>
        </div>
      </div>
    `;
  }

  renderAbout() {
    document.getElementById("artisanDescription").innerHTML = `
      <p>${escapeHtml(this.artisan.description || this.artisan.bio || "No description available.")}</p>
    `;

    const skills = [this.artisan.specialty].filter(Boolean);
    document.getElementById("skillsList").innerHTML = skills.length
      ? skills.map((s) => `<span class="tag">${escapeHtml(s)}</span>`).join("")
      : "<p>No skills added yet.</p>";
  }

  renderContact() {
    const city =
      this.artisan.location?.city ||
      this.artisan.location ||
      "Location unavailable";

    const mapLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(city)}`;
    const artisanEmail = this.artisan.email || "support@artisanconnect.com";
    const ceoEmail = "ceo@artisanconnect.com";

    document.getElementById("contactInfo").innerHTML = `
      <div class="contact-line"><strong>Email:</strong> <a href="mailto:${artisanEmail}">${escapeHtml(artisanEmail)}</a></div>
      <div class="contact-line"><strong>Phone:</strong> ${escapeHtml(this.artisan.phone || "Not available")}</div>
      <div class="contact-line"><strong>Location:</strong> <a href="${mapLink}" target="_blank">${escapeHtml(city)}</a></div>
      <div class="contact-line"><strong>Support:</strong> <a href="mailto:${ceoEmail}">${ceoEmail}</a></div>
      <div class="contact-line"><strong>Views:</strong> ${escapeHtml(this.artisan.viewCount || 0)}</div>
    `;
  }

  renderGallery() {
    const gallery = this.artisan.gallery || [];
    document.getElementById("galleryGrid").innerHTML = gallery.length
      ? gallery.map((img) => `<div class="gallery-item"><img src="${img}" alt="Gallery"></div>`).join("")
      : "<p>No gallery uploaded yet.</p>";
  }

  renderProducts() {
    const wrap = document.getElementById("productsList");

    if (!this.products.length) {
      wrap.innerHTML = `
        <div class="empty-state small">
          <i class="fas fa-bag-shopping"></i>
          <h3>No products yet</h3>
          <p>${this.isOwner ? "Click Add Product to list your first item." : "This artisan has not added products yet."}</p>
        </div>
      `;
      return;
    }

    wrap.innerHTML = this.products.map((p) => `
      <div class="product-mini-card">
        ${
          p.imageUrl
            ? `<img src="${p.imageUrl}" alt="${escapeHtml(p.name)}">`
            : `<div class="product-mini-noimg">No Image</div>`
        }
        <div class="product-mini-body">
          <h4>${escapeHtml(p.name)}</h4>
          <p>${escapeHtml(p.description || "")}</p>
          <div class="product-mini-meta">
            <span>₹${escapeHtml(p.price || "N/A")}</span>
          </div>
          <div class="product-mini-actions">
            <a href="product-details.html?id=${p.id}" class="btn btn-outline btn-sm">Open</a>
            ${
              this.isOwner
                ? `<button class="btn btn-outline btn-sm delete-product-btn" data-id="${p.id}">Delete</button>`
                : ""
            }
          </div>
        </div>
      </div>
    `).join("");
  }

  renderOwnerPanels() {
    const inboxCard = document.getElementById("ownerInboxCard");
    const followersCard = document.getElementById("ownerFollowersCard");
    const inboxSummary = document.getElementById("ownerInboxSummary");
    const inboxList = document.getElementById("ownerInboxList");
    const followersList = document.getElementById("ownerFollowersList");

    if (!this.isOwner) {
      if (inboxCard) inboxCard.style.display = "none";
      if (followersCard) followersCard.style.display = "none";
      return;
    }

    if (inboxCard) inboxCard.style.display = "block";
    if (followersCard) followersCard.style.display = "block";

    const unreadCount = this.ownerInbox.length;
    inboxSummary.innerHTML = `
      <p style="margin-bottom:12px;"><strong>${unreadCount}</strong> conversation${unreadCount === 1 ? "" : "s"} in your inbox.</p>
    `;

    if (!this.ownerInbox.length) {
      inboxList.innerHTML = `<p>No one has messaged you yet.</p>`;
    } else {
      inboxList.innerHTML = this.ownerInbox.map((item) => `
        <div class="card" style="padding:14px;margin-bottom:12px;">
          <div style="display:flex;justify-content:space-between;gap:12px;align-items:flex-start;">
            <div>
              <h4 style="margin-bottom:6px;">${escapeHtml(item.userName || "Visitor")}</h4>
              <p style="margin:0;color:#475569;">${escapeHtml(item.lastMessage || "No preview available")}</p>
            </div>
            <button class="btn btn-outline btn-sm open-conversation-btn" data-id="${item.id}">Open</button>
          </div>
        </div>
      `).join("");
    }

    if (!this.ownerFollowers.length) {
      followersList.innerHTML = `<p>No followers yet.</p>`;
    } else {
      followersList.innerHTML = this.ownerFollowers.map((item) => `
        <div class="card" style="padding:14px;margin-bottom:12px;">
          <h4 style="margin-bottom:6px;">${escapeHtml(item.followerName || "ArtisanConnect user")}</h4>
          <p style="margin:0 0 8px;color:#475569;">${escapeHtml(item.followerEmail || "Email not available")}</p>
          <a class="btn btn-outline btn-sm" href="mailto:${encodeURIComponent(item.followerEmail || "")}">Email follower</a>
        </div>
      `).join("");
    }
  }

  async openConversation(conversationId) {
    const messages = await messageDB.getMessages(conversationId);
    await messageDB.markConversationAsRead(conversationId);

    if (!messages.length) {
      alert("No messages in this conversation yet.");
      return;
    }

    const messageText = messages
      .map((msg) => `${msg.senderRole === "artisan" ? "You" : "Buyer"}: ${msg.text}`)
      .join("\n\n");

    alert(messageText);
  }

  bindActions() {
    if (!this.isOwner) {
      const messageBtn = document.getElementById("messageArtisanBtn");
      messageBtn?.addEventListener("click", async () => {
        if (!this.currentUser) {
          window.location.href = `login.html?redirect=${encodeURIComponent(`artisan-profile.html?id=${this.artisanId}`)}`;
          return;
        }

        const text = prompt("Write your message to the artisan:");
        if (!text) return;

        const result = await messageDB.sendMessage({
          artisanId: this.artisanId,
          userId: this.currentUser.uid,
          artisanName: this.artisan.name || "Artisan",
          userName: this.currentUser.name || this.currentUser.email,
          senderId: this.currentUser.uid,
          senderRole: "buyer",
          text
        });

        if (result.success) {
          alert("Message sent to artisan inbox.");
        } else {
          alert("Failed to send message.");
        }
      });

      const followBtn = document.getElementById("followArtisanBtn");
      followBtn?.addEventListener("click", async () => {
        if (!this.currentUser) {
          window.location.href = `login.html?redirect=${encodeURIComponent(`artisan-profile.html?id=${this.artisanId}`)}`;
          return;
        }

        if (this.isFollowing) {
          const result = await followDB.unfollowArtisan(this.artisanId, this.currentUser.uid);
          if (result.success) {
            this.isFollowing = false;
            followBtn.textContent = "Follow Artisan";
          }
          return;
        }

        const result = await followDB.followArtisan({
          artisanId: this.artisanId,
          artisanName: this.artisan.name || "Artisan",
          followerId: this.currentUser.uid,
          followerName: this.currentUser.name || this.currentUser.email || "User",
          followerEmail: this.currentUser.email || ""
        });

        if (result.success) {
          this.isFollowing = true;
          followBtn.textContent = "Following";
          alert("You are now following this artisan.");
        } else {
          alert("Failed to follow artisan.");
        }
      });

      return;
    }

    document.querySelectorAll(".open-conversation-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        await this.openConversation(btn.dataset.id);
      });
    });

    const replaceBtn = document.getElementById("replaceProfileImageBtn");
    replaceBtn?.addEventListener("click", async () => {
      const file = document.getElementById("replaceProfileImage")?.files?.[0];
      if (!file) {
        alert("Please choose an image first.");
        return;
      }

      try {
        validateImage(file, 2);
        const imageUrl = await uploadImageToCloudinary(file, "artisanconnect/profile");
        const result = await artisanDB.updateArtisan(this.artisanId, { imageUrl });

        if (result.success) {
          alert("Profile photo updated.");
          location.reload();
        } else {
          alert("Failed to update profile photo.");
        }
      } catch (err) {
        console.error(err);
        alert(err.message);
      }
    });

    const addBtn = document.getElementById("addProductBtn");
    addBtn?.addEventListener("click", () => {
      const name = prompt("Product Name:");
      if (!name) return;

      const price = prompt("Price:");
      const desc = prompt("Description:");

      const input = document.createElement("input");
      input.type = "file";
      input.accept = "image/*";

      input.onchange = async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        try {
          validateImage(file, 2);
          const imageUrl = await uploadImageToCloudinary(file, "artisanconnect/products");

          const result = await productDB.addProduct({
            artisanId: this.artisanId,
            artisanName: this.artisan.name,
            name,
            price,
            description: desc,
            imageUrl
          });

          if (result.success) {
            alert("Product Added ✅");
            location.reload();
          } else {
            alert("Failed to add product.");
          }
        } catch (err) {
          console.error(err);
          alert(err.message);
        }
      };

      input.click();
    });

    document.querySelectorAll(".delete-product-btn").forEach((btn) => {
      btn.addEventListener("click", async () => {
        const ok = confirm("Delete this product?");
        if (!ok) return;

        const result = await productDB.deleteProduct(btn.dataset.id);
        if (result.success) {
          location.reload();
        } else {
          alert("Failed to delete product.");
        }
      });
    });

    const deleteProfileBtn = document.getElementById("deleteProfileBtn");
    deleteProfileBtn?.addEventListener("click", async () => {
      const ok = confirm("Delete this artisan profile?");
      if (!ok) return;

      const result = await artisanDB.deleteArtisan(this.artisanId);
      if (result.success) {
        alert("Profile deleted.");
        window.location.href = "artisans.html";
      } else {
        alert(result.error || "Failed to delete profile.");
      }
    });
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new ArtisanProfile();
});
