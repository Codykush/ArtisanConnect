function getCurrentUser() {
  try {
    return JSON.parse(localStorage.getItem("currentUser")) || null;
  } catch {
    return null;
  }
}

function handleProtectedAction(redirectTarget) {
  const currentUser = getCurrentUser();
  if (currentUser) {
    window.location.href = redirectTarget;
    return;
  }

  window.location.href = `login.html?redirect=${encodeURIComponent(redirectTarget)}`;
}

document.addEventListener("DOMContentLoaded", () => {
  document.querySelectorAll(".action-requires-auth").forEach((button) => {
    button.addEventListener("click", () => {
      const redirectTarget = button.dataset.redirect || "my-account.html";
      handleProtectedAction(redirectTarget);
    });
  });

  document.querySelectorAll(".faq-item").forEach((item) => {
    const trigger = item.querySelector(".faq-question");
    trigger?.addEventListener("click", () => {
      item.classList.toggle("active");
    });
  });
});
