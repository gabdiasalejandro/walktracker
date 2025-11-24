document.addEventListener("DOMContentLoaded", () => {
  const navItems = document.querySelectorAll(".nav-item");
  const screens = document.querySelectorAll(".screen");

  function showScreen(target) {
    screens.forEach((screen) => {
      if (screen.dataset.screen === target) {
        screen.classList.add("screen-active");
      } else {
        screen.classList.remove("screen-active");
      }
    });

    navItems.forEach((item) => {
      if (item.dataset.target === target) {
        item.classList.add("nav-active");
      } else {
        item.classList.remove("nav-active");
      }
    });
  }

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      const target = item.dataset.target;
      showScreen(target);
    });
  });

  // Ejemplo: botón "Iniciar actividad" puede llevar a Actividad
  const headerBtn = document.querySelector(".header-btn");
  if (headerBtn) {
    headerBtn.addEventListener("click", () => {
      showScreen("activity");
    });
  }
});
