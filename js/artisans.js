import { artisanDB } from "./database.js";

const placeholderImages = [
  "images/5.jpg",
  "images/6.jpg",
  "images/7.jpg",
  "images/8.jpg",
  "images/9.jpg",
  "images/10.jpg"
];

const craftLabels = {
  pottery: "Pottery & Ceramics",
  textiles: "Textile Weaving",
  jewelry: "Jewelry Making",
  woodwork: "Woodwork",
  metalwork: "Metalwork",
  painting: "Painting",
  sculpture: "Sculpture"
};

function normalizeValue(value) {
  return String(value || "").trim().toLowerCase();
}

function getBadgeMarkup(artisan, index) {
  const items = [];
  if (artisan.verified) items.push('<span class="badge-chip badge-verified">Verified</span>');
  if (artisan.featured || index % 3 === 0) items.push('<span class="badge-chip badge-featured">Featured</span>');
  if (!artisan.verified && index % 4 === 1) items.push('<span class="badge-chip badge-new">New</span>');
  return items.join("");
}

function buildCard(artisan, index) {
  const city = artisan.location?.city || artisan.location || "Location unavailable";
  const craft = artisan.craft || "craft";
  const image = artisan.imageUrl || placeholderImages[index % placeholderImages.length];
  const rating = artisan.rating || ((4 + (index % 10) / 10).toFixed(1));
  const reviews = artisan.reviewCount || artisan.reviewsCount || (12 + index * 5);
  const specialty = artisan.specialty || artisan.bio || artisan.description || "Authentic handmade creations crafted with care.";

  return `
    <article class="artisan-card card">
      <div class="artisan-card-header">
        <img src="${image}" alt="${artisan.name || "Artisan"}" class="artisan-image">
        <div class="artisan-badges">${getBadgeMarkup(artisan, index)}</div>
      </div>
      <div class="artisan-card-body">
        <h3 class="artisan-name">${artisan.name || "Unnamed Artisan"}</h3>
        <div class="artisan-meta">
          <span><i class="fas fa-hammer"></i> ${craftLabels[normalizeValue(craft)] || craft}</span>
          <span><i class="fas fa-location-dot"></i> ${city}</span>
        </div>
        <div class="rating-row">
          <i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star"></i><i class="fas fa-star-half-stroke"></i>
          <span>${rating} (${reviews} reviews)</span>
        </div>
        <p class="artisan-desc">${specialty.slice(0, 110)}${specialty.length > 110 ? "..." : ""}</p>
        <div class="card-actions-row">
          <a href="artisan-profile.html?id=${artisan.id}" class="btn btn-primary btn-sm">View Profile</a>
          <button type="button" class="wishlist-btn" aria-label="Save artisan"><i class="far fa-heart"></i></button>
        </div>
      </div>
    </article>
  `;
}

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("artisansContainer");
  const resultsCount = document.getElementById("resultsCount");
  const resultsHeading = document.getElementById("resultsHeading");
  const noResults = document.getElementById("noResults");
  const searchInput = document.getElementById("artisanSearchInput");
  const searchButton = document.getElementById("artisanSearchBtn");
  const craftFilter = document.getElementById("craftFilter");
  const locationFilter = document.getElementById("locationFilter");
  const experienceFilter = document.getElementById("experienceFilter");
  const sortFilter = document.getElementById("sortFilter");
  const clearFiltersBtn = document.getElementById("clearFiltersBtn");

  if (!container) return;

  const urlParams = new URLSearchParams(window.location.search);
  const initialSearch = urlParams.get("search") || "";
  const initialCraft = urlParams.get("craft") || "";
  if (searchInput) searchInput.value = initialSearch;
  if (craftFilter && initialCraft) craftFilter.value = initialCraft;

  const artisans = await artisanDB.getAllArtisans();
  let activeQuick = "nearby";

  const applyFilters = () => {
    const searchText = normalizeValue(searchInput?.value);
    const craftValue = normalizeValue(craftFilter?.value || initialCraft);
    const locationValue = normalizeValue(locationFilter?.value);
    const experienceValue = experienceFilter?.value || "";
    const sortValue = sortFilter?.value || "featured";

    let filtered = artisans.filter((artisan) => {
      const city = normalizeValue(artisan.location?.city || artisan.location);
      const craft = normalizeValue(artisan.craft);
      const haystack = [artisan.name, artisan.craft, artisan.specialty, artisan.bio, artisan.description, city].map(normalizeValue).join(" ");
      const experience = Number(artisan.experience || 0);

      const matchesSearch = !searchText || haystack.includes(searchText);
      const matchesCraft = !craftValue || craft === craftValue;
      const matchesLocation = !locationValue || city.includes(locationValue);
      const matchesQuick = activeQuick !== "featured" || artisan.featured || artisan.verified;

      let matchesExperience = true;
      if (experienceValue === "0-5") matchesExperience = experience <= 5;
      if (experienceValue === "6-10") matchesExperience = experience >= 6 && experience <= 10;
      if (experienceValue === "11+") matchesExperience = experience >= 11;

      return matchesSearch && matchesCraft && matchesLocation && matchesExperience && matchesQuick;
    });

    filtered.sort((a, b) => {
      if (sortValue === "name") return String(a.name || "").localeCompare(String(b.name || ""));
      if (sortValue === "newest") return String(b.createdAt || "").localeCompare(String(a.createdAt || ""));
      if (sortValue === "rating") return Number(b.rating || b.reviewCount || 0) - Number(a.rating || a.reviewCount || 0);
      return Number(b.featured || b.verified) - Number(a.featured || a.verified);
    });

    if (!filtered.length) {
      container.innerHTML = "";
      noResults?.classList.remove("hidden");
      if (resultsHeading) resultsHeading.textContent = "0 Artisans Found";
      if (resultsCount) resultsCount.textContent = "Try changing the search, craft, or location filters.";
      return;
    }

    noResults?.classList.add("hidden");
    container.innerHTML = filtered.map(buildCard).join("");
    if (resultsHeading) resultsHeading.textContent = `${filtered.length} Artisan${filtered.length > 1 ? "s" : ""} Found`;
    if (resultsCount) resultsCount.textContent = "Showing talented artisans near you";
  };

  [searchInput, craftFilter, locationFilter, experienceFilter, sortFilter].forEach((element) => {
    element?.addEventListener("input", applyFilters);
    element?.addEventListener("change", applyFilters);
  });

  searchButton?.addEventListener("click", applyFilters);
  clearFiltersBtn?.addEventListener("click", () => {
    if (searchInput) searchInput.value = "";
    if (craftFilter) craftFilter.value = "";
    if (locationFilter) locationFilter.value = "";
    if (experienceFilter) experienceFilter.value = "";
    if (sortFilter) sortFilter.value = "featured";
    activeQuick = "nearby";
    document.querySelectorAll(".quick-pill").forEach((button) => button.classList.toggle("active", button.dataset.quick === "nearby"));
    applyFilters();
  });

  document.querySelectorAll(".quick-pill").forEach((button) => {
    button.addEventListener("click", () => {
      activeQuick = button.dataset.quick || "nearby";
      document.querySelectorAll(".quick-pill").forEach((item) => item.classList.toggle("active", item === button));
      applyFilters();
    });
  });

  document.querySelectorAll(".tag-pill").forEach((button) => {
    button.addEventListener("click", () => {
      document.querySelectorAll(".tag-pill").forEach((item) => item.classList.remove("active-tag"));
      button.classList.add("active-tag");
      if (craftFilter) {
        const value = normalizeValue(button.dataset.tag);
        craftFilter.value = value === "weaving" ? "textiles" : value;
      }
      applyFilters();
    });
  });

  applyFilters();
});
