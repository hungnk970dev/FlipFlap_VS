// js/app-supabase.js
// Flip Flash - Frontend Controller
//
// HTML cần nạp theo thứ tự:
// <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
// <script src="./js/supabase-config.js"></script>
// <script src="./js/app-supabase.js"></script>

let currentSession = null;
let currentUser = null;

let allDeckCache = [];

let studyCards = [];
let currentCardIndex = 0;
let studySessionId = null;
let studyCorrect = 0;
let studyIncorrect = 0;
let studyStartTime = null;
let isAnswerShown = false;

// ============================================================
// INIT
// ============================================================

document.addEventListener("DOMContentLoaded", async () => {
  bindCommonEvents();

  try {
    currentSession = await getSessionOrNull();

    if (!currentSession) {
      showAuthModal();
      return;
    }

    currentUser = currentSession.user;

    await api("ensureProfile", {
      username: currentUser.email?.split("@")[0] || "Scholar",
      email: currentUser.email,
    });

    await loadUserProfile(currentUser);

    const page = getCurrentPage();

    if (page === "index.html" || page === "") {
      await initDashboard();
      return;
    }

    if (page === "decks.html") {
      await initDecksPage();
      return;
    }

    if (page === "deck-details.html") {
      await initDeckDetails();
      return;
    }

    if (page === "cards.html") {
      await initCardsPage();
      return;
    }

    if (page === "study-session.html") {
      await initStudySession();
      return;
    }

    if (page === "recent.html") {
      await initRecentPage();
      return;
    }

    if (page === "achievements.html") {
      await initAchievementsPage();
      return;
    }

    if (page === "manage-account.html") {
      await initAccountPage();
      return;
    }
  } catch (err) {
    console.error(err);
    showToast(err.message || "Có lỗi xảy ra khi khởi tạo ứng dụng.", "error");
  }
});

// ============================================================
// CORE HELPERS
// ============================================================

function getCurrentPage() {
  return window.location.pathname.split("/").pop() || "index.html";
}

function getParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function getApiUrl() {
  if (typeof API_URL !== "undefined" && API_URL) return API_URL;

  if (typeof SUPABASE_URL !== "undefined" && SUPABASE_URL) {
    return `${SUPABASE_URL}/functions/v1/flashcard-api`;
  }

  throw new Error("Thiếu API_URL hoặc SUPABASE_URL trong js/supabase-config.js");
}

async function getSessionOrNull() {
  const { data, error } = await supabaseClient.auth.getSession();
  if (error) throw error;
  return data.session || null;
}

async function api(action, payload = {}) {
  const session = currentSession || (await getSessionOrNull());

  if (!session?.access_token) {
    throw new Error("Bạn cần đăng nhập trước.");
  }

  const headers = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${session.access_token}`,
  };

  if (typeof SUPABASE_ANON_KEY !== "undefined" && SUPABASE_ANON_KEY) {
    headers.apikey = SUPABASE_ANON_KEY;
  }

  const res = await fetch(getApiUrl(), {
    method: "POST",
    headers,
    body: JSON.stringify({
      action,
      ...payload,
    }),
  });

  let json = {};
  try {
    json = await res.json();
  } catch (_) {
    json = {};
  }

  if (!res.ok) {
    throw new Error(json.error || `Request failed: ${res.status}`);
  }

  return json;
}

function safeText(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function timeAgo(dateStr) {
  if (!dateStr) return "Not studied yet";

  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function showToast(message, type = "info") {
  const toast = document.createElement("div");

  const colors = {
    success: "bg-green-600 text-white",
    error: "bg-red-600 text-white",
    info: "bg-surface-container text-on-surface",
  };

  toast.className = `fixed top-4 right-4 z-[9999] px-6 py-3 rounded-xl shadow-lg font-bold text-body-md ${
    colors[type] || colors.info
  }`;

  toast.textContent = message;
  document.body.appendChild(toast);

  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateY(-8px)";
  }, 2600);

  setTimeout(() => toast.remove(), 3000);
}

function showLoading(btnId, text) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  btn.dataset.oldText = btn.textContent;
  btn.disabled = true;
  btn.textContent = text;
}

function hideLoading(btnId, fallbackText) {
  const btn = document.getElementById(btnId);
  if (!btn) return;

  btn.disabled = false;
  btn.textContent = btn.dataset.oldText || fallbackText;
}

function showAuthModal() {
  const modal = document.getElementById("authModal");

  if (modal) {
    modal.classList.remove("hidden");
  } else {
    console.warn("Không thấy #authModal. Người dùng chưa đăng nhập.");
  }
}

function closeModal(id) {
  document.getElementById(id)?.classList.add("hidden");
}

function openModal(id) {
  document.getElementById(id)?.classList.remove("hidden");
}

// ============================================================
// AUTH
// ============================================================

async function signIn(email, password) {
  const { data, error } = await supabaseClient.auth.signInWithPassword({
    email,
    password,
  });

  if (error) throw error;

  currentSession = data.session;
  currentUser = data.user;

  return data;
}

async function signUp(email, password, username) {
  const { data, error } = await supabaseClient.auth.signUp({
    email,
    password,
  });

  if (error) throw error;

  if (data.session) {
    currentSession = data.session;
    currentUser = data.user;

    await api("ensureProfile", {
      username: username || email.split("@")[0],
      email,
    });
  }

  return data;
}

async function signOut() {
  const { error } = await supabaseClient.auth.signOut();
  if (error) throw error;

  currentSession = null;
  currentUser = null;

  window.location.href = "index.html";
}

function bindCommonEvents() {
  const loginForm = document.getElementById("loginForm");

  if (loginForm && loginForm.dataset.bound !== "true") {
    loginForm.dataset.bound = "true";

    loginForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("loginEmail")?.value?.trim();
      const password = document.getElementById("loginPassword")?.value;

      if (!email || !password) {
        showToast("Vui lòng nhập email và mật khẩu.", "error");
        return;
      }

      try {
        await signIn(email, password);
        location.reload();
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  const signupForm = document.getElementById("signupForm");

  if (signupForm && signupForm.dataset.bound !== "true") {
    signupForm.dataset.bound = "true";

    signupForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const email = document.getElementById("signupEmail")?.value?.trim();
      const password = document.getElementById("signupPassword")?.value;
      const username = document.getElementById("signupUsername")?.value?.trim();

      if (!email || !password) {
        showToast("Vui lòng nhập email và mật khẩu.", "error");
        return;
      }

      try {
        await signUp(email, password, username);
        showToast(
          "Tạo tài khoản thành công. Nếu có yêu cầu xác nhận email, hãy kiểm tra hộp thư.",
          "success"
        );
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  const logoutBtn = document.getElementById("logoutBtn");

  if (logoutBtn && logoutBtn.dataset.bound !== "true") {
    logoutBtn.dataset.bound = "true";

    logoutBtn.addEventListener("click", async () => {
      try {
        await signOut();
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  document.querySelectorAll("[data-nav]").forEach((el) => {
    if (el.dataset.bound === "true") return;
    el.dataset.bound = "true";

    el.addEventListener("click", () => {
      window.location.href = el.dataset.nav;
    });
  });

  document.querySelectorAll("[data-modal-open]").forEach((el) => {
    if (el.dataset.bound === "true") return;
    el.dataset.bound = "true";

    el.addEventListener("click", () => openModal(el.dataset.modalOpen));
  });

  document.querySelectorAll("[data-modal-close]").forEach((el) => {
    if (el.dataset.bound === "true") return;
    el.dataset.bound = "true";

    el.addEventListener("click", () => closeModal(el.dataset.modalClose));
  });

  document.querySelectorAll("[data-color]").forEach((btn) => {
    if (btn.dataset.bound === "true") return;
    btn.dataset.bound = "true";

    btn.addEventListener("click", () => {
      const selectedColor = document.getElementById("selectedColor");

      if (selectedColor) {
        selectedColor.value = btn.dataset.color;
      }

      document.querySelectorAll("[data-color]").forEach((b) => {
        b.classList.remove("ring-2", "ring-offset-2");
      });

      btn.classList.add("ring-2", "ring-offset-2");
    });
  });

  const themeButtons = document.querySelectorAll(
    "[data-icon='contrast'], [data-theme-toggle]"
  );

  themeButtons.forEach((btn) => {
    if (btn.dataset.bound === "true") return;
    btn.dataset.bound = "true";

    btn.addEventListener("click", () => {
      document.documentElement.classList.toggle("dark");

      localStorage.setItem(
        "flipflash-theme",
        document.documentElement.classList.contains("dark") ? "dark" : "light"
      );
    });
  });

  if (localStorage.getItem("flipflash-theme") === "dark") {
    document.documentElement.classList.add("dark");
  }
}

// ============================================================
// PROFILE
// ============================================================

async function loadUserProfile(user) {
  try {
    const result = await api("ensureProfile", {
      username: user.email?.split("@")[0] || "Scholar",
      email: user.email,
    });

    const profile = result.user;
    if (!profile) return;

    const nameEl = document.getElementById("userName");
    if (nameEl) nameEl.textContent = profile.username || "Scholar";

    const levelEl = document.getElementById("userLevel");
    if (levelEl) levelEl.textContent = `Level ${profile.level || 1} Scholar`;

    const streakEl = document.getElementById("studyStreak");
    if (streakEl) streakEl.textContent = profile.study_streak || 0;

    const masteredEl = document.getElementById("totalMastered");
    if (masteredEl) {
      masteredEl.textContent = (profile.total_cards_mastered || 0).toLocaleString();
    }

    const hoursEl = document.getElementById("totalHours");
    if (hoursEl) {
      hoursEl.textContent = Math.round(Number(profile.total_study_hours || 0)) + "h";
    }

    const emailEl = document.getElementById("profileEmail");
    if (emailEl) emailEl.value = profile.email || user.email || "";

    const usernameEl = document.getElementById("profileUsername");
    if (usernameEl) usernameEl.value = profile.username || "";

    const avatarEl = document.getElementById("profileAvatarUrl");
    if (avatarEl) avatarEl.value = profile.avatar_url || "";
  } catch (err) {
    console.warn("Không load được profile:", err);
  }
}

// ============================================================
// API WRAPPERS
// ============================================================

async function getAllDecks() {
  return api("listDecks");
}

async function createDeck(payload) {
  return api("createDeck", payload);
}

async function updateDeck(deckId, payload) {
  return api("updateDeck", {
    deckId,
    ...payload,
  });
}

async function deleteDeck(deckId) {
  return api("deleteDeck", {
    deckId,
  });
}

async function getDeckBundle(deckId) {
  return api("getDeckBundle", {
    deckId,
  });
}

async function createFolder(payload) {
  return api("createFolder", payload);
}

async function createSet(payload) {
  return api("createSet", payload);
}

async function listCards(setId) {
  return api("listCards", {
    setId,
  });
}

async function createCard(payload) {
  return api("createCard", payload);
}

async function updateCard(cardId, payload) {
  return api("updateCard", {
    cardId,
    ...payload,
  });
}

async function deleteCard(cardId) {
  return api("deleteCard", {
    cardId,
  });
}

// ============================================================
// DASHBOARD - index.html
// ============================================================

async function initDashboard() {
  await loadAndRenderDecks({
    limit: 4,
    mode: "dashboard",
  });

  bindCreateDeckForm();
  bindDeckSearch();
}

// ============================================================
// ALL DECKS - decks.html
// ============================================================

async function initDecksPage() {
  await loadAndRenderDecks({
    limit: null,
    mode: "all",
  });

  bindCreateDeckForm();
  bindDeckSearch();
}

function bindCreateDeckForm() {
  const createDeckForm = document.getElementById("createDeckForm");

  if (!createDeckForm) return;
  if (createDeckForm.dataset.bound === "true") return;

  createDeckForm.dataset.bound = "true";

  createDeckForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = document.getElementById("deckName")?.value?.trim();
    const description = document.getElementById("deckDesc")?.value?.trim() || "";
    const color = document.getElementById("selectedColor")?.value || "#994700";

    if (!name) {
      showToast("Deck name is required", "error");
      return;
    }

    try {
      showLoading("createDeckBtn", "Creating...");

      await createDeck({
        name,
        description,
        color,
        icon: "menu_book",
      });

      closeModal("createDeckModal");
      createDeckForm.reset();

      showToast("Deck created!", "success");

      if (getCurrentPage() === "decks.html") {
        await loadAndRenderDecks({ limit: null, mode: "all" });
      } else {
        await loadAndRenderDecks({ limit: 4, mode: "dashboard" });
      }
    } catch (err) {
      showToast(err.message, "error");
    } finally {
      hideLoading("createDeckBtn", "Create Deck");
    }
  });
}

async function loadAndRenderDecks(options = {}) {
  const { limit = null, mode = "all" } = options;

  try {
    const data = await getAllDecks();
    allDeckCache = data?.decks || [];

    const visibleDecks = limit ? allDeckCache.slice(0, limit) : allDeckCache;

    renderDecks(visibleDecks, {
      mode,
      totalDecks: allDeckCache.length,
    });

    renderStats(allDeckCache);
  } catch (err) {
    console.error("Error loading decks:", err);
    showToast("Failed to load decks", "error");
  }
}

function bindDeckSearch() {
  const input = document.getElementById("deckSearchInput");
  if (!input) return;
  if (input.dataset.bound === "true") return;

  input.dataset.bound = "true";

  input.addEventListener("input", () => {
    const q = input.value.trim().toLowerCase();

    const filtered = allDeckCache.filter((deck) => {
      return (
        deck.name?.toLowerCase().includes(q) ||
        deck.description?.toLowerCase().includes(q)
      );
    });

    renderDecks(filtered, {
      mode: getCurrentPage() === "decks.html" ? "all" : "dashboard",
      totalDecks: allDeckCache.length,
    });
  });
}

function renderDecks(decks, options = {}) {
  const { mode = "all", totalDecks = decks.length } = options;

  const container = document.getElementById("decksGrid");
  if (!container) return;

  const addSection = document.getElementById("addDeckSection");

  container.innerHTML = "";

  if (!decks.length) {
    const empty = document.createElement("div");

    empty.className =
      "col-span-full bg-surface-container-lowest border border-outline-variant rounded-xl p-lg";

    empty.innerHTML = `
      <h3 class="font-headline-md text-headline-md text-on-surface mb-xs">
        Chưa có deck nào
      </h3>
      <p class="text-on-surface-variant mb-md">
        Hãy tạo deck đầu tiên để bắt đầu học flashcard.
      </p>
      <button
        data-modal-open="createDeckModal"
        class="bg-primary text-white font-bold px-4 py-2 rounded-full">
        Create Deck
      </button>
    `;

    container.appendChild(empty);

    empty.querySelector("[data-modal-open]")?.addEventListener("click", () => {
      openModal("createDeckModal");
    });

    if (addSection) container.appendChild(addSection);

    return;
  }

  const colors = [
    "primary",
    "tertiary",
    "secondary",
    "#E91E63",
    "#9C27B0",
    "#4CAF50",
  ];

  decks.forEach((deck, i) => {
    const color = deck.color || colors[i % colors.length];
    const colorClass = color.startsWith("#") ? "" : `bg-${color}`;
    const colorStyle = color.startsWith("#") ? `style="background-color:${color}"` : "";

    const card = document.createElement("div");

    card.className =
      "card-lift relative group bg-surface-container-lowest border border-outline-variant rounded-xl p-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)]";

    card.innerHTML = `
      <div class="absolute top-0 left-0 w-1.5 h-full rounded-l-xl ${colorClass}" ${colorStyle}></div>

      <div class="flex justify-between items-start mb-md">
        <div class="p-2 rounded-lg" style="background-color:${safeText(color)}20; color:${safeText(color)}">
          <span class="material-symbols-outlined">${safeText(deck.icon || "menu_book")}</span>
        </div>

        <div class="flex gap-xs">
          <button
            data-edit-deck="${deck.id}"
            class="p-1.5 text-on-surface-variant hover:bg-surface-variant rounded-full transition-colors">
            <span class="material-symbols-outlined text-[20px]">edit</span>
          </button>

          <button
            data-delete-deck="${deck.id}"
            data-deck-name="${safeText(deck.name)}"
            data-card-count="${deck.card_count || 0}"
            class="p-1.5 text-error hover:bg-error-container rounded-full transition-colors">
            <span class="material-symbols-outlined text-[20px]">delete</span>
          </button>
        </div>
      </div>

      <h3 class="font-headline-md text-headline-md text-on-surface mb-xs">
        ${safeText(deck.name)}
      </h3>

      <p class="text-on-surface-variant mb-md min-h-[48px]">
        ${safeText(deck.description || "")}
      </p>

      <div class="flex items-center gap-base text-label-lg text-on-surface-variant mb-lg">
        <span class="flex items-center gap-xs">
          <span class="material-symbols-outlined text-[18px]">folder</span>
          ${deck.folder_count || 0} Folders
        </span>

        <span class="w-1 h-1 bg-outline-variant rounded-full"></span>

        <span class="flex items-center gap-xs">
          <span class="material-symbols-outlined text-[18px]">style</span>
          ${deck.card_count || 0} Cards
        </span>
      </div>

      <div class="flex items-center justify-between mt-auto pt-md border-t border-outline-variant/30">
        <span class="text-label-sm text-on-surface-variant">
          ${
            deck.last_studied_at
              ? "Last studied " + timeAgo(deck.last_studied_at)
              : "Not studied yet"
          }
        </span>

        <button
          data-open-deck="${deck.id}"
          class="bg-surface-variant hover:bg-primary hover:text-white font-bold px-4 py-2 rounded-full transition-all text-label-lg"
          style="color:${safeText(color)}">
          Open Deck
        </button>
      </div>
    `;

    container.appendChild(card);
  });

  if (mode === "dashboard" && totalDecks > decks.length) {
    const viewAll = document.createElement("div");

    viewAll.className =
      "bg-surface-container-lowest border border-dashed border-outline-variant rounded-xl p-lg flex flex-col items-center justify-center text-center";

    viewAll.innerHTML = `
      <span class="material-symbols-outlined text-primary text-4xl mb-sm">
        dashboard
      </span>

      <h3 class="font-bold text-headline-md mb-xs">
        View all decks
      </h3>

      <p class="text-on-surface-variant mb-md">
        You have ${totalDecks} decks in total.
      </p>

      <a
        href="decks.html"
        class="bg-primary text-white font-bold px-4 py-2 rounded-full">
        Open Decks
      </a>
    `;

    container.appendChild(viewAll);
  }

  if (addSection) container.appendChild(addSection);

  document.querySelectorAll("[data-open-deck]").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.location.href = `deck-details.html?id=${btn.dataset.openDeck}`;
    });
  });

  document.querySelectorAll("[data-edit-deck]").forEach((btn) => {
    btn.addEventListener("click", () => {
      openEditDeck(btn.dataset.editDeck);
    });
  });

  document.querySelectorAll("[data-delete-deck]").forEach((btn) => {
    btn.addEventListener("click", () => {
      confirmDeleteDeck(
        btn.dataset.deleteDeck,
        btn.dataset.deckName,
        Number(btn.dataset.cardCount || 0)
      );
    });
  });
}

function renderStats(decks) {
  const totalCards = decks.reduce((sum, d) => sum + Number(d.card_count || 0), 0);
  const totalDecks = decks.length;

  const totalMastery =
    decks.length > 0
      ? Math.round(
          decks.reduce((sum, d) => sum + Number(d.mastery_percentage || 0), 0) /
            decks.length
        )
      : 0;

  const totalCardsEl = document.getElementById("totalCards");
  if (totalCardsEl) totalCardsEl.textContent = totalCards.toLocaleString();

  const totalDecksEl = document.getElementById("totalDecks");
  if (totalDecksEl) totalDecksEl.textContent = totalDecks.toLocaleString();

  const masteryEl = document.getElementById("masteryPercentage");
  if (masteryEl) masteryEl.textContent = `${totalMastery}%`;
}

function confirmDeleteDeck(deckId, deckName, cardCount) {
  const modal = document.getElementById("deleteModal");

  if (!modal) {
    const ok = confirm(`Xóa deck "${deckName}" và toàn bộ ${cardCount || 0} cards?`);

    if (ok) {
      deleteDeckAndReload(deckId);
    }

    return;
  }

  const text = document.getElementById("deleteModalText");

  if (text) {
    text.textContent = `This action cannot be undone. All ${
      cardCount || 0
    } cards in "${deckName}" will be permanently removed.`;
  }

  const confirmBtn = document.getElementById("confirmDeleteBtn");

  if (confirmBtn) {
    confirmBtn.onclick = () => deleteDeckAndReload(deckId, modal);
  }

  modal.classList.remove("hidden");
}

async function deleteDeckAndReload(deckId, modal = null) {
  try {
    await deleteDeck(deckId);

    if (modal) modal.classList.add("hidden");

    showToast("Deck deleted", "success");

    if (getCurrentPage() === "decks.html") {
      await loadAndRenderDecks({ limit: null, mode: "all" });
    } else {
      await loadAndRenderDecks({ limit: 4, mode: "dashboard" });
    }
  } catch (err) {
    showToast(err.message, "error");
  }
}

function openEditDeck(deckId) {
  window.location.href = `deck-details.html?id=${deckId}&edit=true`;
}

// ============================================================
// DECK DETAILS - deck-details.html
// ============================================================

async function initDeckDetails() {
  const deckId = getParam("id");

  if (!deckId) {
    showToast("Thiếu deckId.", "error");
    window.location.href = "decks.html";
    return;
  }

  await loadDeckBundleAndRender(deckId);

  const createFolderForm = document.getElementById("createFolderForm");

  if (createFolderForm && createFolderForm.dataset.bound !== "true") {
    createFolderForm.dataset.bound = "true";

    createFolderForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const name = document.getElementById("folderName")?.value?.trim();
      const description = document.getElementById("folderDesc")?.value?.trim() || "";

      if (!name) {
        showToast("Vui lòng nhập tên folder.", "error");
        return;
      }

      try {
        await createFolder({
          deckId,
          name,
          description,
          color: "#994700",
          icon: "folder",
        });

        showToast("Đã tạo folder.", "success");

        createFolderForm.reset();
        closeModal("createFolderModal");

        await loadDeckBundleAndRender(deckId);
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  const createSetForm = document.getElementById("createSetForm");

  if (createSetForm && createSetForm.dataset.bound !== "true") {
    createSetForm.dataset.bound = "true";

    createSetForm.addEventListener("submit", async (e) => {
      e.preventDefault();

      const folderId = document.getElementById("setFolderId")?.value;
      const name = document.getElementById("setName")?.value?.trim();
      const description = document.getElementById("setDesc")?.value?.trim() || "";

      if (!folderId) {
        showToast("Vui lòng chọn folder.", "error");
        return;
      }

      if (!name) {
        showToast("Vui lòng nhập tên set.", "error");
        return;
      }

      try {
        await createSet({
          deckId,
          folderId,
          name,
          description,
          color: "#994700",
          icon: "style",
        });

        showToast("Đã tạo set.", "success");

        createSetForm.reset();
        closeModal("createSetModal");

        await loadDeckBundleAndRender(deckId);
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }
}

async function loadDeckBundleAndRender(deckId) {
  const result = await getDeckBundle(deckId);

  renderDeckHeader(result.deck);
  renderFoldersAndSets(result.deck, result.folders || [], result.sets || []);
}

function renderDeckHeader(deck) {
  if (!deck) return;

  const title = document.getElementById("deckTitle");
  if (title) title.textContent = deck.name;

  const name = document.getElementById("deckNameTitle");
  if (name) name.textContent = deck.name;

  const desc = document.getElementById("deckDescription");
  if (desc) desc.textContent = deck.description || "";

  const cardCount = document.getElementById("deckCardCount");
  if (cardCount) cardCount.textContent = deck.card_count || 0;

  const folderCount = document.getElementById("deckFolderCount");
  if (folderCount) folderCount.textContent = deck.folder_count || 0;

  const setCount = document.getElementById("deckSetCount");
  if (setCount) setCount.textContent = deck.set_count || 0;
}

function renderFoldersAndSets(deck, folders, sets) {
  const folderSelect = document.getElementById("setFolderId");

  if (folderSelect) {
    folderSelect.innerHTML = folders
      .map((folder) => `<option value="${folder.id}">${safeText(folder.name)}</option>`)
      .join("");
  }

  const container =
    document.getElementById("foldersContainer") ||
    document.getElementById("foldersGrid") ||
    document.getElementById("deckContent");

  if (!container) return;

  container.innerHTML = "";

  if (!folders.length) {
    container.innerHTML = `
      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
        <h3 class="font-bold text-headline-md mb-sm">
          Deck này chưa có folder
        </h3>
        <p class="text-on-surface-variant mb-md">
          Tạo folder trước, sau đó tạo set trong folder.
        </p>
        <button
          data-modal-open="createFolderModal"
          class="bg-primary text-white px-md py-sm rounded-full font-bold">
          Create Folder
        </button>
      </div>
    `;

    container.querySelector("[data-modal-open]")?.addEventListener("click", () => {
      openModal("createFolderModal");
    });

    return;
  }

  folders.forEach((folder) => {
    const folderSets = sets.filter((set) => set.folder_id === folder.id);

    const section = document.createElement("section");

    section.className =
      "bg-surface-container-lowest border border-outline-variant rounded-xl p-lg mb-lg shadow-[0px_4px_20px_rgba(0,0,0,0.05)]";

    section.innerHTML = `
      <div class="flex items-start justify-between gap-md mb-md">
        <div>
          <div class="flex items-center gap-sm">
            <span class="material-symbols-outlined text-primary">
              ${safeText(folder.icon || "folder")}
            </span>
            <h3 class="font-bold text-headline-md">
              ${safeText(folder.name)}
            </h3>
          </div>

          <p class="text-on-surface-variant">
            ${safeText(folder.description || "")}
          </p>

          <p class="text-label-sm text-on-surface-variant mt-xs">
            ${folder.set_count || 0} sets • ${folder.card_count || 0} cards
          </p>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-md">
        ${
          folderSets.length
            ? folderSets
                .map(
                  (set) => `
                    <article class="border border-outline-variant rounded-xl p-md bg-surface hover:bg-surface-container-low transition-colors">
                      <div class="flex items-center gap-sm mb-sm">
                        <span class="material-symbols-outlined text-primary">
                          ${safeText(set.icon || "style")}
                        </span>

                        <h4 class="font-bold">
                          ${safeText(set.name)}
                        </h4>
                      </div>

                      <p class="text-on-surface-variant text-label-lg mb-md">
                        ${safeText(set.description || "")}
                      </p>

                      <p class="text-label-sm text-on-surface-variant mb-md">
                        ${set.card_count || 0} cards •
                        ${Math.round(Number(set.mastery_percentage || 0))}% mastered
                      </p>

                      <div class="flex flex-wrap gap-sm">
                        <button
                          data-open-cards="${set.id}"
                          data-folder-id="${folder.id}"
                          class="px-md py-sm rounded-full bg-surface-container text-primary font-bold">
                          Cards
                        </button>

                        <button
                          data-study-set="${set.id}"
                          class="px-md py-sm rounded-full bg-primary text-white font-bold">
                          Study
                        </button>
                      </div>
                    </article>
                  `
                )
                .join("")
            : `<p class="text-on-surface-variant col-span-full">Folder này chưa có set.</p>`
        }
      </div>
    `;

    container.appendChild(section);
  });

  document.querySelectorAll("[data-open-cards]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const setId = btn.dataset.openCards;
      const folderId = btn.dataset.folderId;

      window.location.href = `cards.html?deckId=${deck.id}&folderId=${folderId}&setId=${setId}`;
    });
  });

  document.querySelectorAll("[data-study-set]").forEach((btn) => {
    btn.addEventListener("click", () => {
      window.location.href = `study-session.html?deckId=${deck.id}&setId=${btn.dataset.studySet}`;
    });
  });
}

// ============================================================
// CARDS - cards.html
// ============================================================

async function initCardsPage() {
  const deckId = getParam("deckId");
  const folderId = getParam("folderId");
  const setId = getParam("setId");

  if (!deckId || !folderId || !setId) {
    showToast("Thiếu deckId, folderId hoặc setId.", "error");
    window.location.href = "decks.html";
    return;
  }

  await loadCardsAndRender(setId);

  const form = document.getElementById("createCardForm");

  if (form && form.dataset.bound !== "true") {
    form.dataset.bound = "true";

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const question = document.getElementById("cardQuestion")?.value?.trim();
      const answer = document.getElementById("cardAnswer")?.value?.trim();
      const imageUrl = document.getElementById("cardImageUrl")?.value?.trim() || null;
      const difficulty = Number(document.getElementById("cardDifficulty")?.value || 1);

      if (!question) {
        showToast("Vui lòng nhập câu hỏi.", "error");
        return;
      }

      if (!answer) {
        showToast("Vui lòng nhập câu trả lời.", "error");
        return;
      }

      try {
        await createCard({
          deckId,
          folderId,
          setId,
          question,
          answer,
          image_url: imageUrl,
          difficulty_level: difficulty,
        });

        showToast("Đã thêm card.", "success");

        form.reset();
        closeModal("createCardModal");

        await loadCardsAndRender(setId);
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  }

  const studyBtn = document.getElementById("studySetBtn");

  if (studyBtn && studyBtn.dataset.bound !== "true") {
    studyBtn.dataset.bound = "true";

    studyBtn.addEventListener("click", () => {
      window.location.href = `study-session.html?deckId=${deckId}&setId=${setId}`;
    });
  }
}

async function loadCardsAndRender(setId) {
  const result = await listCards(setId);
  renderCards(result.cards || []);
}

function renderCards(cards) {
  const container =
    document.getElementById("cardsContainer") ||
    document.getElementById("cardsList") ||
    document.getElementById("cardsGrid");

  if (!container) return;

  container.innerHTML = "";

  const countEl = document.getElementById("cardsCount");
  if (countEl) countEl.textContent = cards.length;

  if (!cards.length) {
    container.innerHTML = `
      <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg">
        <h3 class="font-bold text-headline-md mb-sm">
          Set này chưa có flashcard
        </h3>
        <p class="text-on-surface-variant">
          Hãy thêm card đầu tiên.
        </p>
      </div>
    `;

    return;
  }

  cards.forEach((card, index) => {
    const el = document.createElement("div");

    el.className =
      "card-row-shadow card-row-focus bg-surface-container-lowest border border-outline-variant rounded-xl p-lg mb-md";

    el.innerHTML = `
      <div class="flex justify-between gap-md">
        <div class="flex-1">
          <p class="text-label-sm text-on-surface-variant mb-xs">
            Card ${index + 1}
          </p>

          <h3 class="font-bold mb-sm">
            ${safeText(card.question)}
          </h3>

          <p class="text-on-surface-variant whitespace-pre-wrap">
            ${safeText(card.answer)}
          </p>

          ${
            card.image_url
              ? `<img
                  src="${safeText(card.image_url)}"
                  alt="Card image"
                  class="mt-md rounded-xl max-h-48 object-cover border border-outline-variant">`
              : ""
          }

          <div class="mt-md text-label-sm text-on-surface-variant">
            Difficulty ${card.difficulty_level || 1} •
            ${card.status || "learning"} •
            Reviewed ${card.review_count || 0} times
          </div>
        </div>

        <button class="text-error self-start" data-delete-card="${card.id}">
          <span class="material-symbols-outlined">delete</span>
        </button>
      </div>
    `;

    container.appendChild(el);
  });

  document.querySelectorAll("[data-delete-card]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      if (!confirm("Xóa card này?")) return;

      try {
        await deleteCard(btn.dataset.deleteCard);

        showToast("Đã xóa card.", "success");

        await loadCardsAndRender(getParam("setId"));
      } catch (err) {
        showToast(err.message, "error");
      }
    });
  });
}

// ============================================================
// STUDY - study-session.html
// ============================================================

async function initStudySession() {
  const deckId = getParam("deckId");
  const setId = getParam("setId");

  if (!deckId || !setId) {
    showToast("Thiếu deckId hoặc setId.", "error");
    window.location.href = "decks.html";
    return;
  }

  try {
    const result = await api("startStudy", {
      deckId,
      setId,
    });

    studySessionId = result.session?.id;
    studyCards = result.cards || [];
    currentCardIndex = 0;
    studyCorrect = 0;
    studyIncorrect = 0;
    studyStartTime = Date.now();
    isAnswerShown = false;

    bindStudyButtons();

    if (!studyCards.length) {
      const studyArea = document.getElementById("studyArea");

      if (studyArea) {
        studyArea.innerHTML = `
          <div class="bg-surface-container-lowest border border-outline-variant rounded-xl p-lg text-center">
            <h2 class="font-bold text-headline-md mb-sm">
              Set này chưa có card
            </h2>
            <p class="text-on-surface-variant mb-md">
              Hãy thêm flashcard trước khi học.
            </p>
            <button
              onclick="history.back()"
              class="bg-primary text-white px-md py-sm rounded-full font-bold">
              Quay lại
            </button>
          </div>
        `;
      }

      return;
    }

    renderCurrentStudyCard();
  } catch (err) {
    showToast(err.message, "error");
  }
}

function bindStudyButtons() {
  const showAnswerBtn = document.getElementById("showAnswerBtn");
  const correctBtn = document.getElementById("correctBtn");
  const incorrectBtn = document.getElementById("incorrectBtn");
  const finishStudyBtn = document.getElementById("finishStudyBtn");

  if (showAnswerBtn) {
    showAnswerBtn.onclick = () => {
      isAnswerShown = true;
      renderCurrentStudyCard();
    };
  }

  if (correctBtn) {
    correctBtn.onclick = () => reviewCurrentCard(true);
  }

  if (incorrectBtn) {
    incorrectBtn.onclick = () => reviewCurrentCard(false);
  }

  if (finishStudyBtn) {
    finishStudyBtn.onclick = finishStudy;
  }
}

function renderCurrentStudyCard() {
  const card = studyCards[currentCardIndex];
  if (!card) return;

  const progressEl = document.getElementById("studyProgress");

  if (progressEl) {
    progressEl.textContent = `${currentCardIndex + 1}/${studyCards.length}`;
  }

  const questionEl = document.getElementById("studyQuestion");

  if (questionEl) {
    questionEl.textContent = card.question;
  }

  const answerEl = document.getElementById("studyAnswer");

  if (answerEl) {
    answerEl.textContent = isAnswerShown
      ? card.answer
      : "Nhấn Show Answer để xem đáp án";
  }

  const imageEl = document.getElementById("studyImage");

  if (imageEl) {
    if (card.image_url) {
      imageEl.src = card.image_url;
      imageEl.classList.remove("hidden");
    } else {
      imageEl.classList.add("hidden");
    }
  }

  document.getElementById("correctBtn")?.classList.toggle("hidden", !isAnswerShown);
  document.getElementById("incorrectBtn")?.classList.toggle("hidden", !isAnswerShown);
  document.getElementById("showAnswerBtn")?.classList.toggle("hidden", isAnswerShown);
}

async function reviewCurrentCard(isCorrect) {
  const card = studyCards[currentCardIndex];

  if (!card) return;

  try {
    await api("reviewCard", {
      cardId: card.id,
      isCorrect,
    });

    if (isCorrect) {
      studyCorrect += 1;
    } else {
      studyIncorrect += 1;
    }

    currentCardIndex += 1;
    isAnswerShown = false;

    if (currentCardIndex >= studyCards.length) {
      await finishStudy();
      return;
    }

    renderCurrentStudyCard();
  } catch (err) {
    showToast(err.message, "error");
  }
}

async function finishStudy() {
  if (!studySessionId) {
    window.location.href = "recent.html";
    return;
  }

  const durationSeconds = Math.max(
    1,
    Math.floor((Date.now() - studyStartTime) / 1000)
  );

  try {
    await api("finishStudy", {
      sessionId: studySessionId,
      cardsStudied: studyCorrect + studyIncorrect,
      cardsCorrect: studyCorrect,
      cardsIncorrect: studyIncorrect,
      durationSeconds,
    });

    showToast("Đã lưu phiên học.", "success");

    window.location.href = "recent.html";
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ============================================================
// RECENT - recent.html
// ============================================================

async function initRecentPage() {
  const container =
    document.getElementById("recentContainer") ||
    document.getElementById("recentList") ||
    document.getElementById("sessionsList");

  if (!container) return;

  try {
    const result = await api("listRecent");
    const sessions = result.sessions || [];

    container.innerHTML = "";

    if (!sessions.length) {
      container.innerHTML = `<p class="text-on-surface-variant">Chưa có phiên học nào.</p>`;
      return;
    }

    sessions.forEach((session) => {
      const item = document.createElement("div");

      item.className =
        "bg-surface-container-lowest border border-outline-variant rounded-xl p-lg mb-md";

      const deckName = session.decks?.name || "Unknown deck";
      const setName = session.sets?.name || "Unknown set";

      item.innerHTML = `
        <div class="flex justify-between gap-md">
          <div>
            <h3 class="font-bold">
              ${safeText(deckName)} / ${safeText(setName)}
            </h3>

            <p class="text-on-surface-variant">
              ${session.cards_studied || 0} cards •
              ${session.cards_correct || 0} correct •
              ${session.cards_incorrect || 0} incorrect
            </p>
          </div>

          <div class="text-right text-label-sm text-on-surface-variant">
            <p>${timeAgo(session.started_at)}</p>
            <p>+${session.xp_earned || 0} XP</p>
          </div>
        </div>
      `;

      container.appendChild(item);
    });
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ============================================================
// ACHIEVEMENTS - achievements.html
// ============================================================

async function initAchievementsPage() {
  const container =
    document.getElementById("achievementsContainer") ||
    document.getElementById("achievementsGrid") ||
    document.getElementById("badgesGrid");

  if (!container) return;

  try {
    const result = await api("listAchievements");
    const achievements = result.achievements || [];

    container.innerHTML = "";

    if (!achievements.length) {
      container.innerHTML = `<p class="text-on-surface-variant">Chưa có achievement nào.</p>`;
      return;
    }

    achievements.forEach((badge) => {
      const progress = badge.target
        ? Math.min(100, Math.round((badge.progress / badge.target) * 100))
        : 0;

      const item = document.createElement("div");

      item.className =
        "achievement-card bg-surface-container-lowest border border-outline-variant rounded-xl p-lg";

      item.innerHTML = `
        <div class="flex items-center gap-md mb-md">
          <span class="material-symbols-outlined text-primary text-4xl">
            ${safeText(badge.badge_icon || "emoji_events")}
          </span>

          <div>
            <h3 class="font-bold">
              ${safeText(badge.badge_name)}
            </h3>

            <p class="text-on-surface-variant">
              ${safeText(badge.badge_description || "")}
            </p>
          </div>
        </div>

        <div class="w-full bg-surface-container rounded-full h-2">
          <div class="bg-primary h-2 rounded-full" style="width:${progress}%"></div>
        </div>

        <p class="text-label-sm text-on-surface-variant mt-sm">
          ${badge.progress || 0}/${badge.target || 0}
          ${badge.is_unlocked ? "• Unlocked" : ""}
        </p>
      `;

      container.appendChild(item);
    });
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ============================================================
// ACCOUNT - manage-account.html
// ============================================================

async function initAccountPage() {
  const form =
    document.getElementById("accountForm") ||
    document.getElementById("profileForm");

  if (!form) return;

  if (form.dataset.bound === "true") return;
  form.dataset.bound = "true";

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const username = document.getElementById("profileUsername")?.value?.trim();

    const avatarUrl =
      document.getElementById("profileAvatarUrl")?.value?.trim() || null;

    if (!username) {
      showToast("Vui lòng nhập username.", "error");
      return;
    }

    try {
      await api("updateProfile", {
        username,
        avatar_url: avatarUrl,
      });

      showToast("Đã cập nhật tài khoản.", "success");

      if (currentUser) {
        await loadUserProfile(currentUser);
      }
    } catch (err) {
      showToast(err.message, "error");
    }
  });
}

// ============================================================
// EXPOSE FUNCTIONS FOR OLD INLINE ONCLICK HTML
// ============================================================

window.confirmDeleteDeck = confirmDeleteDeck;
window.openEditDeck = openEditDeck;
window.signOut = signOut;
window.openModal = openModal;
window.closeModal = closeModal;