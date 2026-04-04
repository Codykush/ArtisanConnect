const CLOUDINARY_CLOUD_NAME = "dafazgolh";
const CLOUDINARY_UPLOAD_PRESET = "artisanconnect";

export async function uploadImageToCloudinary(file, folder = "artisanconnect") {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", CLOUDINARY_UPLOAD_PRESET);
  formData.append("folder", folder);

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`,
    {
      method: "POST",
      body: formData
    }
  );

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.error?.message || "Upload failed");
  }

  return data.secure_url;
}