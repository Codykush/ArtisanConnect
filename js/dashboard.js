import { artisanDB, productDB, buyRequestDB, messageDB } from "./database.js";

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser")) || null;
  } catch {
    return null;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const user = getCurrentUser();
  if (!user) {
    window.location.href = "login.html?redirect=dashboard.html";
    return;
  }

  const artisan = await artisanDB.getArtisanByUserId(user.uid);
  if (!artisan) {
    alert("No artisan profile found for this account.");
    window.location.href = "join-community.html";
    return;
  }

  const products = await productDB.getProductsByArtisanId(artisan.id);
  const requests = await buyRequestDB.getRequestsForArtisan(artisan.id);
  const inbox = await messageDB.getInboxForArtisan(artisan.id);

  const totalViews = products.reduce((sum, p) => sum + Number(p.views || 0), 0);
  const totalRequests = products.reduce((sum, p) => sum + Number(p.buyRequestsCount || 0), 0);
  const totalReviews = products.reduce((sum, p) => sum + Number(p.reviewsCount || 0), 0);

  document.getElementById("statsGrid").innerHTML = `
    <div class="stat-tile"><h4>Profile Views</h4><strong>${artisan.viewCount || 0}</strong></div>
    <div class="stat-tile"><h4>Product Views</h4><strong>${totalViews}</strong></div>
    <div class="stat-tile"><h4>Buy Requests</h4><strong>${totalRequests}</strong></div>
    <div class="stat-tile"><h4>Reviews</h4><strong>${totalReviews}</strong></div>
  `;

  document.getElementById("dashboardProducts").innerHTML = products.length
    ? products.map((p) => `
      <div class="dash-list-item">
        <div>
          <strong>${p.name}</strong>
          <p>Views: ${p.views || 0} · Requests: ${p.buyRequestsCount || 0} · Reviews: ${p.reviewsCount || 0}</p>
        </div>
        <a class="btn btn-outline btn-sm" href="product-details.html?id=${p.id}">Open</a>
      </div>
    `).join("")
    : `<p>No products yet.</p>`;

  document.getElementById("dashboardInbox").innerHTML = inbox.length
    ? inbox.map((c) => `
      <div class="dash-list-item">
        <div>
          <strong>${c.userName || "User"}</strong>
          <p>${c.lastMessage || ""}</p>
        </div>
      </div>
    `).join("")
    : `<p>No messages yet.</p>`;

  document.getElementById("dashboardRequests").innerHTML = requests.length
    ? requests.map((r) => `
      <div class="dash-list-item">
        <div>
          <strong>${r.buyerName || "Buyer"}</strong>
          <p>${r.productName || ""}</p>
          <p>${r.message || ""}</p>
        </div>
      </div>
    `).join("")
    : `<p>No buy requests yet.</p>`;

  document.getElementById("openProfileBtn")?.addEventListener("click", () => {
    window.location.href = `artisan-profile.html?id=${artisan.id}`;
  });
});