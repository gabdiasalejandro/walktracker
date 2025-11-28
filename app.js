document.addEventListener("DOMContentLoaded", () => {
  const navItems = document.querySelectorAll(".nav-item");
  const screens = document.querySelectorAll(".screen");
  const startBtn = document.getElementById("start-btn");
  const pauseBtn = document.getElementById("pause-btn");
  const finishBtn = document.getElementById("finish-btn");
  const themeToggle = document.getElementById("theme-toggle");
  const liveStatus = document.getElementById("live-status");
  const liveTimer = document.getElementById("live-timer");
  const liveSteps = document.getElementById("live-steps");
  const livePulse = document.getElementById("live-pulse");
  const activityList = document.querySelector(".activity-list");
  const joinChallenge = document.getElementById("join-challenge");
  const rewardButtons = document.querySelectorAll(".redeem-btn");
  const toastStack = document.getElementById("toast-stack");
  const filtersWrapper = document.getElementById("route-filters");
  const routeCards = document.querySelectorAll(".route-card");
  const routeEmpty = document.getElementById("route-empty");
  const distanceFilter = document.getElementById("distance-filter");
  const distanceValue = document.getElementById("distance-value");
  const statsNumber = document.querySelector(".stats-number");
  const pointsValue = document.querySelector(".points-value");
  const premiumBtn = document.getElementById("premium-btn");
  const onboardingScreen = document.getElementById("onboarding-screen");
  const onboardingForm = document.getElementById("onboarding-form");
  const onboardingInput = document.getElementById("username-input");
  const onboardingStart = document.getElementById("start-onboarding");
  const profileName = document.getElementById("profile-name");
  const avatarInitials = document.getElementById("avatar-initials");

  const parseNumber = (text) => Number(String(text || "0").replace(/[^\d]/g, "")) || 0;
  let baseSteps = parseNumber(statsNumber?.textContent);
  let points = parseNumber(pointsValue?.textContent);
  const storedPoints = localStorage.getItem("wt-points");
  if (storedPoints && !Number.isNaN(Number(storedPoints))) {
    points = Number(storedPoints);
  }
  let userName = profileName?.textContent || "Tu nombre";
  let isPremium = false;

  const activityState = {
    status: "idle",
    baseSeconds: 0,
    steps: 0,
    startedAt: null,
    timerId: null,
  };

  const activeFilters = new Set(
    Array.from(filtersWrapper?.querySelectorAll(".chip-active") || []).map(
      (btn) => btn.dataset.filter
    )
  );

  function showScreen(target) {
    screens.forEach((screen) => {
      screen.classList.toggle("screen-active", screen.dataset.screen === target);
    });

    navItems.forEach((item) => {
      item.classList.toggle("nav-active", item.dataset.target === target);
    });
  }

  navItems.forEach((item) => {
    item.addEventListener("click", () => {
      showScreen(item.dataset.target);
    });
  });

  function formatTime(totalSeconds) {
    const hrs = String(Math.floor(totalSeconds / 3600)).padStart(2, "0");
    const mins = String(Math.floor((totalSeconds % 3600) / 60)).padStart(2, "0");
    const secs = String(totalSeconds % 60).padStart(2, "0");
    return `${hrs}:${mins}:${secs}`;
  }

  function updateStatsCircle() {
    if (!statsNumber) return;
    const totalSteps = baseSteps + activityState.steps;
    statsNumber.textContent = totalSteps.toLocaleString("es-ES");
  }

  function updatePointsDisplay() {
    if (pointsValue) {
      pointsValue.textContent = points.toLocaleString("es-ES");
    }
    localStorage.setItem("wt-points", String(points));
  }

  function sanitizeName(value) {
    return (value || "").replace(/[^A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]/g, "").replace(/\s{2,}/g, " ");
  }

  function isValidName(value) {
    const trimmed = (value || "").trim();
    if (trimmed.length < 2) return false;
    return /^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ ]+$/.test(trimmed);
  }

  function getInitials(name) {
    const parts = (name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean)
      .map((part) => part[0])
      .join("")
      .slice(0, 2);
    return parts ? parts.toUpperCase() : "WT";
  }

  function setProfileName(name) {
    userName = name;
    if (profileName) profileName.textContent = name;
    if (avatarInitials) avatarInitials.textContent = getInitials(name);
  }

  function toggleOnboarding(show) {
    if (!onboardingScreen) return;
    onboardingScreen.hidden = !show;
    onboardingScreen.setAttribute("aria-hidden", show ? "false" : "true");
    if (show && onboardingInput) onboardingInput.focus();
  }

  function handleNameInput() {
    if (!onboardingInput || !onboardingStart) return "";
    const cleaned = sanitizeName(onboardingInput.value);
    if (cleaned !== onboardingInput.value) onboardingInput.value = cleaned;
    const valid = isValidName(cleaned);
    onboardingStart.disabled = !valid;
    return valid ? cleaned.trim() : "";
  }

  function completeOnboarding() {
    const name = handleNameInput();
    if (!name) {
      pushToast("Nombre inválido", "Usa solo letras y espacios");
      return;
    }
    localStorage.setItem("wt-username", name);
    setProfileName(name);
    toggleOnboarding(false);
    pushToast("Perfil actualizado", `Hola, ${name}`);
  }

  function updatePremiumUI() {
    if (!premiumBtn) return;
    premiumBtn.textContent = isPremium ? "Premium activo" : "Suscribirme";
    premiumBtn.disabled = isPremium;
    premiumBtn.classList.toggle("premium-active", isPremium);
  }

  function activatePremium() {
    if (isPremium) {
      pushToast("Premium ya activo", "Disfruta de los beneficios");
      return;
    }
    isPremium = true;
    localStorage.setItem("wt-premium", "true");
    points += 150;
    updatePointsDisplay();
    refreshRedeemButtons();
    updatePremiumUI();
    pushToast("Premium activado", "150 pts de bienvenida agregados");
  }

  function updateLiveUI() {
    const elapsed = getElapsedSeconds();
    if (liveTimer) liveTimer.textContent = formatTime(elapsed);
    if (liveSteps) liveSteps.textContent = `${activityState.steps} pasos`;
    updateStatsCircle();

    if (livePulse && liveStatus) {
      livePulse.classList.remove("paused", "idle");
      if (activityState.status === "running") {
        liveStatus.textContent = "En marcha";
      } else if (activityState.status === "paused") {
        liveStatus.textContent = "Pausada";
        livePulse.classList.add("paused");
      } else {
        liveStatus.textContent = "En espera";
        livePulse.classList.add("idle");
      }
    }

    if (startBtn) {
      startBtn.disabled = activityState.status === "running";
      startBtn.textContent = activityState.status === "paused" ? "Reanudar" : "Iniciar";
    }
    if (pauseBtn) pauseBtn.disabled = activityState.status !== "running";
    if (finishBtn) finishBtn.disabled = activityState.status === "idle";
  }

  function getElapsedSeconds() {
    if (activityState.status !== "running" || !activityState.startedAt) {
      return activityState.baseSeconds;
    }
    const diff = Math.floor((Date.now() - activityState.startedAt) / 1000);
    return activityState.baseSeconds + diff;
  }

  function tickActivity() {
    activityState.steps += Math.floor(Math.random() * 7) + 3;
    updateLiveUI();
  }

  function startActivity() {
    if (activityState.status === "running") return;
    if (activityState.status === "idle") {
      activityState.baseSeconds = 0;
      activityState.steps = 0;
    }
    activityState.status = "running";
    activityState.startedAt = Date.now();
    clearInterval(activityState.timerId);
    activityState.timerId = setInterval(tickActivity, 1000);
    updateLiveUI();
    showScreen("activity");
  }

  function pauseActivity() {
    if (activityState.status !== "running") return;
    activityState.baseSeconds = getElapsedSeconds();
    activityState.status = "paused";
    clearInterval(activityState.timerId);
    updateLiveUI();
  }

  function finishActivity() {
    if (activityState.status === "idle") return;
    const elapsed = getElapsedSeconds();
    clearInterval(activityState.timerId);
    const minutes = Math.max(1, Math.round(elapsed / 60));
    const distance = Math.max(0.2, Number((activityState.steps / 1300).toFixed(1)));
    baseSteps += activityState.steps;
    addActivityItem({
      title: "Sesión rápida",
      summary: `${distance} km · ${minutes} min`,
      tag: "Caminar",
    });
    pushToast("Sesión guardada", `${distance} km registrados`);
    activityState.status = "idle";
    activityState.baseSeconds = 0;
    activityState.steps = 0;
    activityState.startedAt = null;
    updateLiveUI();
  }

  function addActivityItem({ title, summary, tag }) {
    if (!activityList) return;
    const item = document.createElement("div");
    item.className = "activity-item";
    item.innerHTML = `
      <div>
        <strong>${title}</strong>
        <p>${summary}</p>
      </div>
      <span class="tag tag-walk">${tag}</span>
    `;
    const firstItem = activityList.querySelector(".activity-item");
    activityList.insertBefore(item, firstItem);
  }

  function pushToast(title, detail) {
    if (!toastStack) return;
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.innerHTML = `
      <div>
        <strong>${title}</strong>
        ${detail ? `<br/><small>${detail}</small>` : ""}
      </div>
      <button aria-label="Cerrar notificación">✕</button>
    `;
    toastStack.appendChild(toast);
    const remove = () => {
      toast.classList.add("fade-out");
      setTimeout(() => toast.remove(), 180);
    };
    toast.querySelector("button")?.addEventListener("click", remove);
    setTimeout(remove, 3200);
  }

  function applyRouteFilters() {
    if (!routeCards.length) return;
    const maxDistance = Number(distanceFilter?.value || 15);
    if (distanceValue) distanceValue.textContent = `${maxDistance} km`;
    const typeFilters = ["walk", "bike"].filter((t) => activeFilters.has(t));
    const safeOnly = activeFilters.has("safe");

    let visibleCount = 0;
    routeCards.forEach((card) => {
      const type = card.dataset.type;
      const distance = Number(card.dataset.distance);
      const isSafe = card.dataset.safe === "true";
      const matchesType = typeFilters.length ? typeFilters.includes(type) : true;
      const matchesSafe = !safeOnly || isSafe;
      const matchesDistance = distance <= maxDistance;
      const show = matchesType && matchesSafe && matchesDistance;
      card.hidden = !show;
      if (show) visibleCount += 1;
    });

    if (routeEmpty) routeEmpty.hidden = visibleCount > 0;
  }

  function refreshRedeemButtons() {
    rewardButtons.forEach((btn) => {
      const cost = Number(btn.dataset.cost || 0);
      btn.disabled = cost > points;
    });
  }

  function redeem(cost) {
    if (cost > points) {
      const missing = cost - points;
      pushToast("Puntos insuficientes", `Te faltan ${missing} pts`);
      return;
    }
    points -= cost;
    updatePointsDisplay();
    refreshRedeemButtons();
    pushToast("Canje realizado", `Saldo: ${points.toLocaleString("es-ES")} pts`);
  }

  function setTheme(mode) {
    const isLight = mode === "light";
    document.body.classList.toggle("light-mode", isLight);
    if (themeToggle) themeToggle.textContent = isLight ? "Modo oscuro" : "Modo claro";
    localStorage.setItem("wt-theme", isLight ? "light" : "dark");
  }

  function initTheme() {
    const saved = localStorage.getItem("wt-theme");
    const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
    const mode = saved || (prefersLight ? "light" : "dark");
    setTheme(mode);
  }

  function initPremium() {
    const savedPremium = localStorage.getItem("wt-premium");
    isPremium = savedPremium === "true";
    updatePremiumUI();
  }

  function initUser() {
    const savedName = localStorage.getItem("wt-username");
    if (savedName && isValidName(savedName)) {
      setProfileName(savedName.trim());
      toggleOnboarding(false);
      return;
    }
    setProfileName(userName);
    toggleOnboarding(true);
    handleNameInput();
  }

  // Eventos principales
  startBtn?.addEventListener("click", startActivity);

  pauseBtn?.addEventListener("click", pauseActivity);
  finishBtn?.addEventListener("click", finishActivity);

  joinChallenge?.addEventListener("click", () => {
    pushToast("Te uniste al reto", "Sumaremos tus km de esta semana");
  });

  onboardingInput?.addEventListener("input", handleNameInput);

  onboardingForm?.addEventListener("submit", (e) => {
    e.preventDefault();
    completeOnboarding();
  });

  premiumBtn?.addEventListener("click", activatePremium);

  rewardButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const cost = Number(btn.dataset.cost || 0);
      redeem(cost);
    });
  });

  themeToggle?.addEventListener("click", () => {
    const next = document.body.classList.contains("light-mode") ? "dark" : "light";
    setTheme(next);
  });

  filtersWrapper?.addEventListener("click", (e) => {
    const target = e.target;
    if (!(target instanceof HTMLButtonElement)) return;
    const key = target.dataset.filter;
    if (!key) return;
    target.classList.toggle("chip-active");
    if (target.classList.contains("chip-active")) {
      activeFilters.add(key);
    } else {
      activeFilters.delete(key);
    }
    applyRouteFilters();
  });

  distanceFilter?.addEventListener("input", applyRouteFilters);

  initTheme();
  initPremium();
  initUser();
  updatePointsDisplay();
  refreshRedeemButtons();
  applyRouteFilters();
  updateLiveUI();
});
