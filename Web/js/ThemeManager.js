
// Simple theme manager with localStorage persistence
class ThemeManager {
  constructor() {
    this.storageKey = "site-theme";
  }

  init() {
    const saved = localStorage.getItem(this.storageKey);
    if (saved === "dark" || saved === "light") {
      this.apply(saved);
    } else {
      this.apply("light");
    }
    // wire toggle button if present
    const toggle = document.getElementById("themeToggle");
    if (toggle) {
      toggle.checked = document.documentElement.getAttribute("data-theme") === "dark";
      toggle.addEventListener("change", () => {
        this.apply(toggle.checked ? "dark" : "light");
      });
    }
  }

  apply(mode) {
    document.documentElement.setAttribute("data-theme", mode === "dark" ? "dark" : "light");
    localStorage.setItem(this.storageKey, mode);
    const icon = document.getElementById("themeIcon");
    if (icon) {
      icon.className = mode === "dark" ? "fa-solid fa-moon" : "fa-regular fa-sun";
    }
  }
}

// expose
window.ThemeManager = ThemeManager;
