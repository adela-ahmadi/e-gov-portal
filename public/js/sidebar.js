const btn = document.getElementById("menu-btn");
const sidebarMobile = document.getElementById("sidebar-mobile");
const overlay = document.getElementById("overlay");

btn.addEventListener("click", () => {
  sidebarMobile.classList.toggle("-translate-x-full");
  overlay.classList.toggle("hidden");
});

overlay.addEventListener("click", () => {
  sidebarMobile.classList.add("-translate-x-full");
  overlay.classList.add("hidden");
});
