import { productDB, reviewDB, buyRequestDB, artisanDB, messageDB } from "./database.js";

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser")) || null;
  } catch {
    return null;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const id = new URLSearchParams(window.location.search).get("id");
  if (!id) return;

  const product = await productDB.getProductById(id);
  if (!product) {
    document.getElementById("productMain").innerHTML = "<p>Product not found.</p>";
    return;
  }

  await productDB.incrementView(id);

  const artisan = await artisanDB.getArtisanById(product.artisanId);
  const reviews = await reviewDB.getProductReviews(id);
  const currentUser = getCurrentUser();

  document.getElementById("productMain").innerHTML = `
    <div class="product-hero-card">
      ${
        product.imageUrl
          ? `<img src="${product.imageUrl}" class="product-main-image" alt="${product.name}">`
          : `<div class="product-image-placeholder">No Image</div>`
      }
      <div class="product-main-info">
        <h1>${product.name}</h1>
        <p>${product.description || ""}</p>
        <div class="product-meta">
          <span>₹${product.price || "N/A"}</span>
          <span>Views: ${Number(product.views || 0) + 1}</span>
          <span>Requests: ${product.buyRequestsCount || 0}</span>
          <span>Reviews: ${product.reviewsCount || 0}</span>
        </div>
        <a class="btn btn-outline" href="artisan-profile.html?id=${product.artisanId}">Visit Artisan</a>
      </div>
    </div>
  `;

  document.getElementById("productReviews").innerHTML = reviews.length
    ? reviews.map((r) => `
      <div class="dash-list-item">
        <div>
          <strong>${r.userName || "User"}</strong>
          <p>Rating: ${r.rating}/5</p>
          <p>${r.comment}</p>
        </div>
      </div>
    `).join("")
    : `<p>No reviews yet.</p>`;

  document.getElementById("reviewForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser) {
      window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
      return;
    }

    const rating = Number(document.getElementById("reviewRating").value);
    const comment = document.getElementById("reviewComment").value.trim();

    const result = await reviewDB.addReview({
      productId: id,
      userId: currentUser.uid,
      userName: currentUser.name || currentUser.email,
      rating,
      comment
    });

    if (result.success) {
      alert("Review added successfully.");
      location.reload();
    } else {
      alert("Failed to add review.");
    }
  });

  document.getElementById("buyRequestForm")?.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (!currentUser) {
      window.location.href = `login.html?redirect=${encodeURIComponent(window.location.href)}`;
      return;
    }

    const message = document.getElementById("buyMessage").value.trim();

    const req = await buyRequestDB.addRequest({
      productId: id,
      artisanId: product.artisanId,
      buyerId: currentUser.uid,
      buyerName: currentUser.name || currentUser.email,
      productName: product.name,
      message
    });

    if (req.success) {
      await messageDB.sendMessage({
        artisanId: product.artisanId,
        userId: currentUser.uid,
        artisanName: artisan?.name || "Artisan",
        userName: currentUser.name || currentUser.email,
        senderId: currentUser.uid,
        senderRole: "buyer",
        text: `Buy request for "${product.name}": ${message}`
      });

      alert("Buy request sent successfully.");
      location.reload();
    } else {
      alert("Failed to send request.");
    }
  });
});