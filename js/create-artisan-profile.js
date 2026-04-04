import { userDB, artisanDB } from "./database.js";
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

document.addEventListener("DOMContentLoaded", async () => {
  const currentUser = getCurrentUser();

  if (!currentUser) {
    window.location.href = "login.html?redirect=create-artisan-profile.html";
    return;
  }

  const nameInput = document.getElementById("artisanName");
  const emailInput = document.getElementById("artisanEmail");

  const existingArtisan = await artisanDB.getArtisanByUserId(currentUser.uid);
  if (existingArtisan) {
    alert("You already have an artisan profile.");
    window.location.href = `artisan-profile.html?id=${existingArtisan.id}`;
    return;
  }

  if (nameInput) nameInput.value = currentUser.name || "";
  if (emailInput) emailInput.value = currentUser.email || "";

  const form = document.getElementById("artisanRegistrationForm");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
      const profileFile = document.getElementById("profilePicture")?.files?.[0];
      const galleryFiles = Array.from(document.getElementById("workGallery")?.files || []);
      const consent = document.getElementById("copyrightConsent")?.checked;

      if (!consent) {
        alert("Please confirm the image copyright declaration.");
        return;
      }

      if (!profileFile) {
        alert("Profile image is required.");
        return;
      }

      validateImage(profileFile, 2);
      const imageUrl = await uploadImageToCloudinary(profileFile, "artisanconnect/profile");

      const gallery = [];
      for (const file of galleryFiles.slice(0, 5)) {
        validateImage(file, 2);
        const url = await uploadImageToCloudinary(file, "artisanconnect/gallery");
        gallery.push(url);
      }

      const artisanData = {
        userId: currentUser.uid,
        name: document.getElementById("artisanName")?.value?.trim() || "",
        email: document.getElementById("artisanEmail")?.value?.trim() || "",
        phone: document.getElementById("artisanPhone")?.value?.trim() || "",
        craft: document.getElementById("primaryCraft")?.value || "",
        experience: Number(document.getElementById("experienceYears")?.value || 0),
        specialty: document.getElementById("craftSpecialty")?.value?.trim() || "",
        workshopType: document.getElementById("workshopType")?.value || "",
        bio: document.getElementById("artisanBio")?.value?.trim() || "",
        description: document.getElementById("craftDescription")?.value?.trim() || "",
        location: {
          city: document.getElementById("artisanLocation")?.value?.trim() || "",
          state: ""
        },
        imageUrl,
        gallery,
        portfolioLink: document.getElementById("portfolioLink")?.value?.trim() || "",
        socialInstagram: document.getElementById("socialInstagram")?.value?.trim() || "",
        createdAt: new Date().toISOString()
      };

      const res = await artisanDB.createArtisan(artisanData);
      if (!res.success) {
        alert(res.error || "Error creating profile.");
        return;
      }

      const updatedUser = {
        ...currentUser,
        role: "artisan",
        artisanId: res.id
      };

      await userDB.saveUser(updatedUser);
      localStorage.setItem("currentUser", JSON.stringify(updatedUser));

      alert("Profile created successfully.");
      window.location.href = `artisan-profile.html?id=${res.id}`;
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to create profile.");
    }
  });
});
