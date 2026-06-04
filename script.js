// API KEY DOĞRUDAN BUrada
const _cfg = {
  key: "61c3236f021b7087ff8553f8d58999a3",
  base: "https://api.themoviedb.org/3",
  img: "https://image.tmdb.org/t/p/w500",
  imgOrig: "https://image.tmdb.org/t/p/original",
};

const state = {
  page: 1,
  totalPages: 1,
  genre: "all",
  sort: "popularity.desc",
  query: "",
  loading: false,
  watchlist: JSON.parse(localStorage.getItem("cf_wl") || "[]"),
};

const $ = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

const els = {
  trendTrack: $("trendingTrack"),
  trendSection: $("trendingSection"),
  grid: $("topRatedGrid"),
  sectionTitle: $("sectionTitle"),
  searchInput: $("searchInput"),
  searchBtn: $("searchBtn"),
  clearBtn: $("clearBtn"),
  loadMoreWrap: $("loadMoreWrapper"),
  loadMoreBtn: $("loadMoreBtn"),
  errorState: $("errorState"),
  retryBtn: $("retryBtn"),
  movieModal: $("movieModal"),
  closeModal: $("closeModalBtn"),
  modalImg: $("modalImg"),
  modalTitle: $("modalTitle"),
  modalRating: $("modalRatingVal"),
  modalDate: $("modalDate"),
  modalRuntime: $("modalRuntime"),
  modalDesc: $("modalDesc"),
  modalBackdrop: $("modalBackdrop"),
  modalGenres: $("modalGenres"),
  modalCast: $("modalCast"),
  trailerBtn: $("playTrailerBtn"),
  watchlistBtn: $("watchlistBtn"),
  trailerModal: $("trailerModal"),
  trailerFrame: $("trailerFrame"),
  closeTrailer: $("closeTrailerBtn"),
  loginModal: $("loginModal"),
  loginTrigger: $("loginTrigger"),
  closeLogin: $("closeLoginBtn"),
  toast: $("toast"),
  hamburger: $("hamburgerBtn"),
  sidebar: $("sidebar"),
  sidebarOv: $("sidebarOverlay"),
  sidebarClose: $("sidebarClose"),
};

const toast = (msg) => {
  let t = els.toast;
  if (t) {
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3000);
  }
};
const skeletons = (c, count, cls) => {
  if (c) {
    c.innerHTML = "";
    for (let i = 0; i < count; i++) {
      let d = document.createElement("div");
      d.className = `skeleton-card ${cls}`;
      c.appendChild(d);
    }
  }
};

const api = async (endpoint, params = "") => {
  try {
    const r = await fetch(
      `${_cfg.base}${endpoint}?api_key=${_cfg.key}&language=en-US${params}`,
    );
    if (!r.ok) throw new Error();
    return await r.json();
  } catch (e) {
    return null;
  }
};

const makeCard = (movie) => {
  const card = document.createElement("div");
  card.className = "movie-card";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "—";
  const poster = movie.poster_path
    ? `${_cfg.img}${movie.poster_path}`
    : "https://placehold.co/200x300/0d1228/38456a?text=No+Poster";
  card.innerHTML = `<img src="${poster}" alt="${movie.title}" loading="lazy"/><div class="card-info"><span class="rating-pill"><i class="fa-solid fa-star"></i>${rating}</span><h4>${movie.title}</h4><p class="desc">${movie.overview?.substring(0, 100) || "No description."}</p></div>`;
  card.addEventListener("click", () => openModal(movie.id));
  return card;
};

const renderGrid = async (append = false) => {
  if (state.loading) return;
  state.loading = true;
  if (!append && els.grid) skeletons(els.grid, 8, "grid-skel");

  let endpoint, params;
  if (state.query) {
    endpoint = "/search/movie";
    params = `&query=${encodeURIComponent(state.query)}&page=${state.page}`;
  } else if (state.genre === "all") {
    endpoint = "/movie/top_rated";
    params = `&page=${state.page}`;
  } else {
    endpoint = "/discover/movie";
    params = `&with_genres=${state.genre}&sort_by=${state.sort}&page=${state.page}`;
  }

  const data = await api(endpoint, params);
  if (!data) {
    if (!append && els.grid) {
      els.grid.innerHTML = "";
      if (els.errorState) els.errorState.style.display = "block";
    }
    state.loading = false;
    return;
  }
  if (els.errorState) els.errorState.style.display = "none";
  state.totalPages = Math.min(data.total_pages || 1, 500);
  if (!append && els.grid) els.grid.innerHTML = "";
  if (!data.results?.length && !append) {
    if (els.grid)
      els.grid.innerHTML =
        "<div class='no-results'><h3>No results found</h3></div>";
    if (els.loadMoreWrap) els.loadMoreWrap.style.display = "none";
    state.loading = false;
    return;
  }
  const frag = document.createDocumentFragment();
  data.results.forEach((m) => frag.appendChild(makeCard(m)));
  if (els.grid) els.grid.appendChild(frag);
  if (els.loadMoreWrap)
    els.loadMoreWrap.style.display =
      state.page < state.totalPages ? "block" : "none";
  if (els.loadMoreBtn)
    els.loadMoreBtn.innerHTML =
      '<i class="fa-solid fa-circle-plus"></i>Load More';
  state.loading = false;
};

const renderTrending = async () => {
  if (!els.trendTrack) return;
  skeletons(els.trendTrack, 5, "carousel-skel");
  const data = await api("/trending/movie/week");
  if (!data?.results) return;
  const movies = data.results.slice(0, 10);
  els.trendTrack.innerHTML = "";
  [1, 2].forEach(() => {
    const frag = document.createDocumentFragment();
    movies.forEach((m) => frag.appendChild(makeCard(m)));
    els.trendTrack.appendChild(frag);
  });
  requestAnimationFrame(() => {
    const w = els.trendTrack.scrollWidth / 2;
    els.trendTrack.style.animationDuration = `${Math.round(w / 32)}s`;
  });
};

const openModal = async (id) => {
  if (!els.movieModal) return;
  els.movieModal.classList.add("active");
  document.body.style.overflow = "hidden";
  const details = await api(`/movie/${id}`);
  if (!details) {
    toast("Could not load details.");
    closeModal();
    return;
  }
  if (els.modalImg)
    els.modalImg.src = details.poster_path
      ? `${_cfg.img}${details.poster_path}`
      : "https://placehold.co/250x375/0d1228/38456a?text=No+Poster";
  if (els.modalTitle) els.modalTitle.textContent = details.title;
  if (els.modalRating)
    els.modalRating.textContent = details.vote_average
      ? details.vote_average.toFixed(1)
      : "—";
  if (els.modalDesc)
    els.modalDesc.textContent = details.overview || "No description.";
  if (els.modalGenres && details.genres)
    els.modalGenres.innerHTML = details.genres
      .slice(0, 3)
      .map((g) => `<span class="genre-tag">${g.name}</span>`)
      .join("");
  const saved = state.watchlist.includes(id);
  if (els.watchlistBtn) {
    els.watchlistBtn.classList.toggle("saved", saved);
    els.watchlistBtn.dataset.id = id;
  }
};

const closeModal = () => {
  if (els.movieModal) els.movieModal.classList.remove("active");
  document.body.style.overflow = "";
};
const toggleWatchlist = (id) => {
  let n = Number(id),
    idx = state.watchlist.indexOf(n);
  if (idx === -1) {
    state.watchlist.push(n);
    toast("Added to watchlist");
  } else {
    state.watchlist.splice(idx, 1);
    toast("Removed from watchlist");
  }
  localStorage.setItem("cf_wl", JSON.stringify(state.watchlist));
  if (els.watchlistBtn) els.watchlistBtn.classList.toggle("saved", idx === -1);
};

const handleSearch = () => {
  if (!els.searchInput) return;
  let q = els.searchInput.value.trim();
  $$(".category-item").forEach((i) => i.classList.remove("active"));
  let allCat = document.querySelector('[data-id="all"]');
  if (allCat) allCat.classList.add("active");
  state.query = q;
  state.genre = "all";
  state.page = 1;
  if (els.clearBtn) els.clearBtn.classList.toggle("visible", q.length > 0);
  if (!q) {
    if (els.trendSection) els.trendSection.style.display = "block";
    if (els.sectionTitle)
      els.sectionTitle.innerHTML =
        "<span class='title-accent'>Top</span> Rated";
  } else {
    if (els.trendSection) els.trendSection.style.display = "none";
    if (els.sectionTitle)
      els.sectionTitle.innerHTML = `<span class='title-accent'>"${q}"</span> Results`;
  }
  renderGrid(false);
};

const handleCategory = (e) => {
  let el = e.currentTarget,
    id = el.dataset.id;
  $$(".category-item").forEach((i) => i.classList.remove("active"));
  el.classList.add("active");
  if (els.searchInput) els.searchInput.value = "";
  if (els.clearBtn) els.clearBtn.classList.remove("visible");
  state.query = "";
  state.genre = id;
  state.page = 1;
  if (id === "all") {
    if (els.trendSection) els.trendSection.style.display = "block";
    if (els.sectionTitle)
      els.sectionTitle.innerHTML =
        "<span class='title-accent'>Top</span> Rated";
  } else {
    if (els.trendSection) els.trendSection.style.display = "none";
    if (els.sectionTitle)
      els.sectionTitle.innerHTML = `<span class='title-accent'>${el.textContent.trim()}</span> Movies`;
  }
  closeSidebar();
  renderGrid(false);
};

const handleSort = (e) => {
  $$(".sort-item").forEach((i) => i.classList.remove("active"));
  e.currentTarget.classList.add("active");
  state.sort = e.currentTarget.dataset.sort;
  state.page = 1;
  if (state.genre !== "all" || state.query) renderGrid(false);
};

const openSidebar = () => {
  if (els.sidebar) els.sidebar.classList.add("open");
  if (els.sidebarOv) els.sidebarOv.classList.add("active");
  if (els.hamburger) els.hamburger.classList.add("open");
  document.body.style.overflow = "hidden";
};
const closeSidebar = () => {
  if (els.sidebar) els.sidebar.classList.remove("open");
  if (els.sidebarOv) els.sidebarOv.classList.remove("active");
  if (els.hamburger) els.hamburger.classList.remove("open");
  document.body.style.overflow = "";
};

// Event Listeners
if (els.searchBtn) els.searchBtn.addEventListener("click", handleSearch);
if (els.searchInput)
  els.searchInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") handleSearch();
  });
if (els.clearBtn)
  els.clearBtn.addEventListener("click", () => {
    if (els.searchInput) els.searchInput.value = "";
    handleSearch();
  });
if (els.loadMoreBtn)
  els.loadMoreBtn.addEventListener("click", () => {
    if (!state.loading) {
      state.page++;
      renderGrid(true);
    }
  });
if (els.retryBtn)
  els.retryBtn.addEventListener("click", () => renderGrid(false));
if (els.closeModal) els.closeModal.addEventListener("click", closeModal);
if (els.watchlistBtn)
  els.watchlistBtn.addEventListener("click", () =>
    toggleWatchlist(els.watchlistBtn.dataset.id),
  );
if (els.loginTrigger)
  els.loginTrigger.addEventListener("click", () => {
    if (els.loginModal) els.loginModal.classList.add("active");
  });
if (els.closeLogin)
  els.closeLogin.addEventListener("click", () => {
    if (els.loginModal) els.loginModal.classList.remove("active");
  });
if (els.hamburger)
  els.hamburger.addEventListener("click", () => {
    if (els.sidebar && els.sidebar.classList.contains("open")) closeSidebar();
    else openSidebar();
  });
if (els.sidebarClose) els.sidebarClose.addEventListener("click", closeSidebar);
if (els.sidebarOv) els.sidebarOv.addEventListener("click", closeSidebar);

$$(".category-item").forEach((el) =>
  el.addEventListener("click", handleCategory),
);
$$(".sort-item").forEach((el) => el.addEventListener("click", handleSort));

document.addEventListener("DOMContentLoaded", () => {
  renderTrending();
  renderGrid(false);
});
