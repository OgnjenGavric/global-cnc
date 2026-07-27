/* =====================================================
   Advanced RFQ Form Mechanics & File Upload List
===================================================== */
const fileUploadInput = document.getElementById("file-upload");
const fileListContainer = document.getElementById("file-list");

// Handle drawing files logic on client side
if (fileUploadInput && fileListContainer) {
   fileUploadInput.addEventListener("change", function () {
      fileListContainer.innerHTML = ""; // Reset file display
      const files = Array.from(fileUploadInput.files);

      files.forEach((file, index) => {
         // Block files greater than 20MB
         if (file.size > 20971520) {
            alert(`Datoteka "${file.name}" je prevelika! Maksimalna veličina je 20MB.`);
            fileUploadInput.value = "";
            fileListContainer.innerHTML = "";
            return;
         }

         const fileItem = document.createElement("div");
         fileItem.className = "file-item";
         fileItem.innerHTML = `
            <span>📄 ${file.name} (${(file.size / 1024 / 1024).toFixed(2)} MB)</span>
            <i class="ri-delete-bin-line" onclick="removeSelectedFile(${index})"></i>
         `;
         fileListContainer.appendChild(fileItem);
      });
   });
}

// Remove single specific file from selection before upload
function removeSelectedFile(index) {
   const dt = new DataTransfer();
   const { files } = fileUploadInput;

   for (let i = 0; i < files.length; i++) {
      if (index !== i) dt.items.add(files[i]);
   }

   fileUploadInput.files = dt.files;
   fileUploadInput.dispatchEvent(new Event('change'));
}

// AJAX form submission logic targeting contact-form-handler.php
const contactForm = document.getElementById("contactForm");
if (contactForm) {
   contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const form = event.target;
      const formData = new FormData(form);

      const submitBtn = form.querySelector(".submit-btn span");
      const originalBtnText = submitBtn ? submitBtn.textContent : "Pošalji";
      if (submitBtn) submitBtn.textContent = "Slanje upita i crteža...";

      // Target PHP Form Handler
      const PHP_HANDLER_URL = "assets/form/contact-form-handler.php";

      fetch(PHP_HANDLER_URL, {
         method: "POST",
         headers: {
            "X-Requested-With": "XMLHttpRequest" // Omogućava PHP skripti da prepozna AJAX poziv
         },
         body: formData
      })
         .then((response) => {
            if (response.ok) return response.text();
            throw new Error("Greška na serveru prilikom slanja.");
         })
         .then((responseText) => {
            const alertDiv = document.getElementById("formAlert");
            if (alertDiv) {
               alertDiv.style.display = "flex";
               alertDiv.querySelector("span").style.color = "";
               alertDiv.querySelector("span").textContent = responseText || "Vaš tehnički upit je uspješno proslijeđen!";
            }
            form.reset();
            if (fileListContainer) fileListContainer.innerHTML = "";
         })
         .catch((error) => {
            console.error("PHP Handler Error:", error);
            const alertDiv = document.getElementById("formAlert");
            if (alertDiv) {
               alertDiv.style.display = "flex";
               alertDiv.querySelector("span").style.color = "#ff3333";
               alertDiv.querySelector("span").textContent = "Došlo je do greške. Pokušajte ponovo.";
            }
         })
         .finally(() => {
            if (submitBtn) submitBtn.textContent = originalBtnText;
         });
   });
}

/* =====================================================
   Service modal open/close function (Machinery specs)
===================================================== */
const serviceCardWithModals = document.querySelectorAll(".service-container .card-with-modal");

serviceCardWithModals.forEach((serviceCardWithModal) => {
   const serviceCard = serviceCardWithModal.querySelector(".service-card");
   const serviceBackDrop = serviceCardWithModal.querySelector(".service-modal-backdrop");
   const serviceModal = serviceCardWithModal.querySelector(".service-modal");
   const modalCloseBtn = serviceCardWithModal.querySelector(".modal-close-btn");

   if (serviceCard && serviceBackDrop && serviceModal && modalCloseBtn) {
      serviceCard.addEventListener("click", (e) => {
         e.preventDefault();
         serviceBackDrop.style.display = "flex";
         setTimeout(() => { serviceBackDrop.classList.add("active"); }, 50);
         setTimeout(() => { serviceModal.classList.add("active"); }, 150);
      });

      modalCloseBtn.addEventListener("click", () => {
         serviceModal.classList.remove("active");
         serviceBackDrop.classList.remove("active");
         setTimeout(() => { serviceBackDrop.style.display = "none"; }, 300);
      });
   }
});

/* =====================================================
   Shrink header on page scroll
===================================================== */
window.addEventListener("scroll", () => {
   const sueHeader = document.querySelector(".sue-header");
   if (sueHeader) {
      sueHeader.classList.toggle("shrink", window.scrollY > 0);
   }
});

/* =====================================================
   Active menu state tracking during page scroll
===================================================== */
window.addEventListener("scroll", () => {
   const navMenuSections = document.querySelectorAll(".nav-menu-section");
   const scrollY = window.scrollY;

   navMenuSections.forEach((navMenuSection) => {
      let sectionHeight = navMenuSection.offsetHeight;
      let sectionTop = navMenuSection.offsetTop - 100;
      let id = navMenuSection.getAttribute("id");

      if (id) {
         const navLink = document.querySelector(".bottom-nav .menu li a[href*=" + id + "]");
         if (navLink) {
            if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
               navLink.classList.add("current");
            } else {
               navLink.classList.remove("current");
            }
         }
      }
   });
});

// Auto show menu bar UI on initialization
window.addEventListener("DOMContentLoaded", () => {
   const bottomNav = document.querySelector(".bottom-nav");
   if (bottomNav) { bottomNav.classList.add("active"); }
});

/* =====================================================
   To-top scroll bar calculation
===================================================== */
window.addEventListener("scroll", () => {
   const toTopBtn = document.querySelector(".to-top-btn");
   if (toTopBtn) { toTopBtn.classList.toggle("active", window.scrollY > 300); }

   const scrollIndicatorBar = document.querySelector(".scroll-indicator-bar");
   if (scrollIndicatorBar) {
      const pageScroll = document.body.scrollTop || document.documentElement.scrollTop;
      const height = document.documentElement.scrollHeight - document.documentElement.clientHeight;
      const scrollValue = (pageScroll / height) * 100;
      scrollIndicatorBar.style.height = scrollValue + "%";
   }
});

/* =====================================================
   Dark/Light theme save state logic
===================================================== */
const themeBtn = document.querySelector(".theme-btn");

if (themeBtn) {
   themeBtn.addEventListener("click", () => {
      themeBtn.classList.toggle("active-sun-icon");
      document.body.classList.toggle("light-theme");

      const getCurrentIcon = () => themeBtn.classList.contains("active-sun-icon") ? "sun" : "moon";
      const getCurrentTheme = () => document.body.classList.contains("light-theme") ? "light" : "dark";

      localStorage.setItem("sue-saved-icon", getCurrentIcon());
      localStorage.setItem("sue-saved-theme", getCurrentTheme());
   });
}

// Read saved state out of localStorage on boot
const savedIcon = localStorage.getItem("sue-saved-icon");
const savedTheme = localStorage.getItem("sue-saved-theme");

document.addEventListener("DOMContentLoaded", () => {
   if (themeBtn && savedIcon) {
      themeBtn.classList[savedIcon === "sun" ? "add" : "remove"]("active-sun-icon");
   }
   if (savedTheme) {
      document.body.classList[savedTheme === "light" ? "add" : "remove"]("light-theme");
   }
});

/* =====================================================
   Cookie Banner logic loop
===================================================== */
(function () {
   const COOKIE_KEY = 'cnc-cookie-consent';
   const banner = document.getElementById('khCookieBanner');
   if (!banner) return;

   function initCookieBanner() {
      const saved = localStorage.getItem(COOKIE_KEY);
      if (!saved) { setTimeout(() => banner.classList.add('show'), 1000); }
   }

   const acceptBtn = document.getElementById('khCookieAccept');
   if (acceptBtn) {
      acceptBtn.addEventListener('click', () => {
         localStorage.setItem(COOKIE_KEY, 'accepted');
         banner.classList.remove('show');
      });
   }

   const declineBtn = document.getElementById('khCookieDecline');
   if (declineBtn) {
      declineBtn.addEventListener('click', () => {
         localStorage.setItem(COOKIE_KEY, 'declined');
         banner.classList.remove('show');
      });
   }

   initCookieBanner();
})();