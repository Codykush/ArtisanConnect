import { artisanDB, messageDB, followDB } from "./database.js";

function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser")) || null;
  } catch {
    return null;
  }
}

document.addEventListener("DOMContentLoaded", async () => {
  const box = document.getElementById("myProfileBox");
  const inboxBox = document.getElementById("myInboxBox");
  const followersBox = document.getElementById("myFollowersBox");
  const inboxCard = document.getElementById("myInboxCard");
  const followersCard = document.getElementById("myFollowersCard");
  const currentUser = getCurrentUser();

  if (!currentUser) {
    window.location.href = "login.html?redirect=my-account.html";
    return;
  }

  const artisan = await artisanDB.getArtisanByUserId(currentUser.uid);

  box.innerHTML = `
    <p><strong>Name:</strong> ${currentUser.name || ""}</p>
    <p><strong>Email:</strong> ${currentUser.email || ""}</p>
    <p><strong>Role:</strong> ${currentUser.role || "user"}</p>
    <div style="display:flex;gap:10px;flex-wrap:wrap;margin-top:18px;">
      ${artisan
        ? `<a class="btn btn-primary" href="artisan-profile.html?id=${artisan.id}">View My Artisan Profile</a>`
        : `<a class="btn btn-primary" href="join-community.html">Create Artisan Profile</a>`
      }
      <a class="btn btn-outline" href="artisans.html">Discover Artisans</a>
    </div>
  `;

  if (!artisan) return;

  inboxCard.style.display = "block";
  followersCard.style.display = "block";

  const inbox = await messageDB.getInboxForArtisan(artisan.id);
  const followers = await followDB.getFollowersForArtisan(artisan.id);

  inboxBox.innerHTML = inbox.length
    ? inbox.map((item) => `
        <div class="card" style="padding:14px;margin-top:12px;">
          <h3 style="margin-bottom:6px;">${item.userName || "Visitor"}</h3>
          <p style="margin:0;">${item.lastMessage || "No message preview"}</p>
        </div>
      `).join("")
    : "<p style='margin-top:12px;'>No messages yet.</p>";

  followersBox.innerHTML = followers.length
    ? followers.map((item) => `
        <div class="card" style="padding:14px;margin-top:12px;">
          <h3 style="margin-bottom:6px;">${item.followerName || "User"}</h3>
          <p style="margin:0;">${item.followerEmail || "No email"}</p>
        </div>
      `).join("")
    : "<p style='margin-top:12px;'>No followers yet.</p>";
});
