class ArtisanConnect {
  constructor() {
    this.init();
  }

  init() {
    console.log("ArtisanConnect initialized successfully");
    this.initCommon();
    this.initPageSpecific();
    this.initEventListeners();
  }

  initCommon() {
    this.renderSharedFooter();
    this.setCurrentYear();
    this.initMobileMenu();
    this.initBackToTop();
    this.initSearch();
    this.initProtectedActions();
  }


  getCurrentUser() {
    try {
      return JSON.parse(localStorage.getItem("currentUser")) || null;
    } catch {
      return null;
    }
  }

  redirectToLogin(target) {
    const fallback = window.location.pathname.split("/").pop() || "index.html";
    const redirectTarget = target || `${fallback}${window.location.search}${window.location.hash}`;
    window.location.href = `login.html?redirect=${encodeURIComponent(redirectTarget)}`;
  }

  initProtectedActions() {
    const protectedHrefs = new Set(["my-account.html", "create-artisan-profile.html"]);
    const protectedIds = new Set([
      "contactArtisanMain",
      "finalContactBtn",
      "bookWorkshopMain",
      "finalBookBtn",
      "writeReviewBtn",
      "contactBtn",
      "bookAppointmentBtn",
      "saveArtisanBtn",
      "bookVisitBtn"
    ]);

    document.addEventListener("click", (event) => {
      const trigger = event.target.closest("[data-requires-auth='true'], a[href], button[id]");
      if (!trigger) return;

      const currentUser = this.getCurrentUser();
      const href = trigger.getAttribute("href");
      const datasetRedirect = trigger.dataset?.redirect;
      const isProtectedHref = href && protectedHrefs.has(href.split("?")[0]);
      const isProtectedId = trigger.id && protectedIds.has(trigger.id);
      const explicitlyProtected = trigger.dataset?.requiresAuth === "true";

      if (!explicitlyProtected && !isProtectedHref && !isProtectedId) return;

      const target = datasetRedirect || href || `${window.location.pathname.split("/").pop() || "index.html"}${window.location.search}${window.location.hash}`;

      if (!currentUser) {
        event.preventDefault();
        this.redirectToLogin(target);
        return;
      }

      if (
        trigger.tagName !== "A" &&
        datasetRedirect &&
        trigger.classList.contains("action-requires-auth")
      ) {
        event.preventDefault();
        window.location.href = target;
      }
    });
  }
  initPageSpecific() {
    const bodyClass = document.body.className;

    if (bodyClass.includes("about-page")) {
      this.initAboutPage();
    } else if (bodyClass.includes("artisans-page")) {
      this.initArtisansPage();
    } else if (bodyClass.includes("profile-page")) {
      this.initProfilePage();
    } else if (bodyClass.includes("join-page")) {
      this.initJoinPage();
    }
  }

  initEventListeners() {
    window.addEventListener("scroll", () => {
      const header = document.querySelector(".main-header");
      if (header) {
        if (window.scrollY > 50) header.classList.add("scrolled");
        else header.classList.remove("scrolled");
      }
    });
  }


  renderSharedFooter() {
    const footerMarkup = `
      <div class="container">
        <div class="footer-content">
          <div class="footer-col footer-brand">
            <a href="index.html" class="logo">
              <div class="logo-icon">AC</div>
              <div class="logo-text">
                <h1>Artisan<span>Connect</span></h1>
                <p>Bridging Crafts and Community</p>
              </div>
            </a>
            <p>Connecting local artisans with customers, communities, and opportunities through one trusted platform.</p>
            <div class="footer-social">
              <a href="#" aria-label="Facebook"><i class="fab fa-facebook-f"></i></a>
              <a href="#" aria-label="Instagram"><i class="fab fa-instagram"></i></a>
              <a href="#" aria-label="Twitter"><i class="fab fa-twitter"></i></a>
              <a href="#" aria-label="LinkedIn"><i class="fab fa-linkedin-in"></i></a>
            </div>
          </div>

          <div class="footer-col">
            <h3>Quick Links</h3>
            <ul>
              <li><a href="index.html">Home</a></li>
              <li><a href="artisans.html">Discover Artisans</a></li>
              <li><a href="about.html">Our Mission</a></li>
              <li><a href="join-community.html">Join Community</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h3>Support & Connect</h3>
            <ul>
              <li><a href="mailto:support@artisanconnect.com">support@artisanconnect.com</a></li>
              <li><a href="mailto:ceo@artisanconnect.com">ceo@artisanconnect.com</a></li>
              <li><a href="contact.html">Contact Page</a></li>
              <li><a href="login.html">Login</a></li>
            </ul>
          </div>

          <div class="footer-col">
            <h3>Craft Categories</h3>
            <ul>
              <li><a href="artisans.html?craft=pottery">Pottery</a></li>
              <li><a href="artisans.html?craft=textiles">Textiles</a></li>
              <li><a href="artisans.html?craft=jewelry">Jewelry</a></li>
              <li><a href="artisans.html?craft=woodwork">Woodwork</a></li>
            </ul>
          </div>
        </div>
        <div class="footer-bottom">© <span id="currentYear"></span> ArtisanConnect. All rights reserved.</div>
      </div>
    `;

    let footer = document.querySelector('.main-footer');
    if (!footer) {
      footer = document.createElement('footer');
      footer.className = 'main-footer';
      document.body.appendChild(footer);
    }

    footer.innerHTML = footerMarkup;
  }

  setCurrentYear() {
    const yearElements = document.querySelectorAll("#currentYear");
    yearElements.forEach((el) => {
      el.textContent = new Date().getFullYear();
    });
  }

  initMobileMenu() {
    const menuToggle = document.getElementById("menuToggle");
    const mainNav = document.getElementById("mainNav");

    if (menuToggle && mainNav) {
      menuToggle.addEventListener("click", () => {
        mainNav.classList.toggle("active");
        menuToggle.classList.toggle("active");
        document.body.style.overflow = mainNav.classList.contains("active") ? "hidden" : "";
      });

      document.addEventListener("click", (e) => {
        if (!mainNav.contains(e.target) && !menuToggle.contains(e.target)) {
          mainNav.classList.remove("active");
          menuToggle.classList.remove("active");
          document.body.style.overflow = "";
        }
      });

      const navLinks = mainNav.querySelectorAll(".nav-link");
      navLinks.forEach((link) => {
        link.addEventListener("click", () => {
          mainNav.classList.remove("active");
          menuToggle.classList.remove("active");
          document.body.style.overflow = "";
        });
      });
    }
  }

  initBackToTop() {
    const backToTop = document.getElementById("backToTop");

    if (backToTop) {
      window.addEventListener("scroll", () => {
        if (window.pageYOffset > 300) backToTop.classList.add("visible");
        else backToTop.classList.remove("visible");
      });

      backToTop.addEventListener("click", () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
      });
    }
  }

  initSearch() {
    const searchBtn = document.getElementById("searchBtn");
    const searchInput = document.querySelector(".search-input");

    if (searchBtn && searchInput) {
      searchBtn.addEventListener("click", () => {
        if (searchInput.value.trim()) {
          window.location.href = `artisans.html?search=${encodeURIComponent(searchInput.value)}`;
        }
      });

      searchInput.addEventListener("keypress", (e) => {
        if (e.key === "Enter" && searchInput.value.trim()) {
          window.location.href = `artisans.html?search=${encodeURIComponent(searchInput.value)}`;
        }
      });
    }
  }

  initAboutPage() {
    const faqItems = document.querySelectorAll(".faq-item");

    faqItems.forEach((item) => {
      const question = item.querySelector(".faq-question");
      if (!question) return;

      question.addEventListener("click", () => {
        faqItems.forEach((otherItem) => {
          if (otherItem !== item && otherItem.classList.contains("active")) {
            otherItem.classList.remove("active");
          }
        });
        item.classList.toggle("active");
      });
    });
  }

  initArtisansPage() {
    const viewToggles = document.querySelectorAll(".view-toggle");
    const artisansContainer = document.getElementById("artisansContainer");

    viewToggles.forEach((toggle) => {
      toggle.addEventListener("click", () => {
        const view = toggle.dataset.view;
        viewToggles.forEach((t) => t.classList.remove("active"));
        toggle.classList.add("active");

        if (artisansContainer) {
          artisansContainer.classList.remove("view-grid", "view-list");
          artisansContainer.classList.add(`view-${view}`);
        }
      });
    });

    const mapToggle = document.getElementById("mapToggle");
    const mapView = document.getElementById("mapView");

    if (mapToggle && mapView) {
      mapToggle.addEventListener("click", () => {
        const isVisible = mapView.style.display === "block";
        mapView.style.display = isVisible ? "none" : "block";
        mapToggle.innerHTML = isVisible
          ? '<i class="fas fa-map"></i> Show Map'
          : '<i class="fas fa-list"></i> Hide Map';

        if (artisansContainer) {
          artisansContainer.style.display = isVisible ? "block" : "none";
        }
      });
    }
  }

  initProfilePage() {}

  initJoinPage() {
    const nextSteps = document.querySelectorAll(".next-step");
    const prevSteps = document.querySelectorAll(".prev-step");

    nextSteps.forEach((button) => {
      button.addEventListener("click", () => {
        const nextStep = button.dataset.next;
        const currentStep = button.closest(".form-step")?.dataset.step;
        if (this.validateStep(currentStep)) this.goToStep(nextStep);
      });
    });

    prevSteps.forEach((button) => {
      button.addEventListener("click", () => {
        const prevStep = button.dataset.prev;
        this.goToStep(prevStep);
      });
    });
  }

  validateStep(step) {
    const currentStep = document.querySelector(`.form-step[data-step="${step}"]`);
    if (!currentStep) return true;

    const requiredFields = currentStep.querySelectorAll("[required]");
    let isValid = true;

    requiredFields.forEach((field) => {
      let fieldValid = true;
      if (field.type === "checkbox") fieldValid = field.checked;
      else fieldValid = !!field.value.trim();

      if (!fieldValid) {
        field.classList.add("error");
        isValid = false;
      } else {
        field.classList.remove("error");
      }
    });

    return isValid;
  }

  goToStep(stepNumber) {
    const steps = document.querySelectorAll(".form-step");
    const stepElements = document.querySelectorAll(".step");
    const progressFill = document.querySelector(".progress-fill");

    steps.forEach((step) => {
      step.classList.remove("active");
      if (step.dataset.step === String(stepNumber)) step.classList.add("active");
    });

    stepElements.forEach((stepEl) => {
      stepEl.classList.remove("active", "completed");
      const stepNum = parseInt(stepEl.dataset.step, 10);

      if (stepNum < Number(stepNumber)) stepEl.classList.add("completed");
      else if (stepNum === Number(stepNumber)) stepEl.classList.add("active");
    });

    if (progressFill) {
      const percentage = ((Number(stepNumber) - 1) / (stepElements.length - 1)) * 100;
      progressFill.style.width = `${percentage}%`;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  window.App = new ArtisanConnect();
});

window.Utils = {
  showNotification: (message, type = "info") => {
    if (typeof Components !== "undefined" && Components.showNotification) {
      Components.showNotification(message, type);
    } else {
      alert(message);
    }
  },

  toggleLoading: (show, message = "Loading...") => {
    if (show) Components?.showLoading(message);
    else Components?.hideLoading();
  },

  showLoading: (show, message) => {
    if (show) Components?.showLoading(message);
    else Components?.hideLoading();
  },

  formatDate: (date) => {
    return new Date(date).toLocaleDateString();
  }
};