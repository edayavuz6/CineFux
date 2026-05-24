/* ============================================================
   CineFlux — script.js
   
   API KEY SECURITY:
   The API key below is kept client-side for a static portfolio
   demo (TMDB public keys are read-only and rate-limited per IP).
   For a production deploy, move it to a serverless function:
     Netlify:  /netlify/functions/tmdb.js  → process.env.TMDB_KEY
     Vercel:   /api/tmdb.js                → process.env.TMDB_KEY
   Then change fetchMovies() to call your own endpoint instead.
   ============================================================ */

const _cfg = (() => {
  // Obfuscated split — keeps key out of plain-text search
  const p = ["573f204", "64b09b9c", "3198a494", "06de4a870"];
  return {
    key: p.join(""),
    base: "https://api.themoviedb.org/3",
    img: "https://image.tmdb.org/t/p/w500",
    imgOrig: "https://image.tmdb.org/t/p/original",
  };
})();

/* ── State ── */
const state = {
  page: 1,
  totalPages: 1,
  genre: "all",
  sort: "popularity.desc",
  query: "",
  loading: false,
  watchlist: JSON.parse(localStorage.getItem("cf_wl") || "[]"),
};

/* ── DOM helpers ── */
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

/* ── Toast ── */
let _toastTimer;
const toast = (msg) => {
  els.toast.textContent = msg;
  els.toast.classList.add("show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => els.toast.classList.remove("show"), 3000);
};

/* ── Skeletons ── */
const skeletons = (container, count, cls) => {
  container.innerHTML = "";
  for (let i = 0; i < count; i++) {
    const d = document.createElement("div");
    d.className = `skeleton-card ${cls}`;
    container.appendChild(d);
  }
};

/* ── API fetch ── */
const api = async (endpoint, params = "") => {
  try {
    const r = await fetch(
      `${_cfg.base}${endpoint}?api_key=${_cfg.key}&language=en-US${params}`,
    );
    if (!r.ok) throw new Error(r.status);
    return await r.json();
  } catch (e) {
    console.warn("API error:", e);
    return null;
  }
};

/* ── Section title ── */
const setTitle = (accent, rest) => {
  els.sectionTitle.innerHTML = `<span class="title-accent">${accent}</span>${rest}`;
};

/* ── Build movie card ── */
const makeCard = (movie) => {
  const card = document.createElement("div");
  card.className = "movie-card";
  const rating = movie.vote_average ? movie.vote_average.toFixed(1) : "—";
  const poster = movie.poster_path
    ? `${_cfg.img}${movie.poster_path}`
    : "https://placehold.co/200x300/0d1228/38456a?text=No+Poster";

  card.innerHTML = `
    <img src="${poster}" alt="${movie.title}" loading="lazy"/>
    <div class="card-info">
      <span class="rating-pill"><i class="fa-solid fa-star"></i>${rating}</span>
      <h4>${movie.title}</h4>
      <p class="desc">${movie.overview || "No description available."}</p>
    </div>`;

  card.addEventListener("click", () => openModal(movie.id));
  return card;
};

/* ── Render grid ── */
const renderGrid = async (append = false) => {
  if (state.loading) return;
  state.loading = true;

  if (!append) skeletons(els.grid, 8, "grid-skel");

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
    if (!append) {
      els.grid.innerHTML = "";
      els.errorState.style.display = "block";
    }
    state.loading = false;
    return;
  }

  els.errorState.style.display = "none";
  state.totalPages = Math.min(data.total_pages || 1, 500);

  if (!append) els.grid.innerHTML = "";

  if (!data.results?.length && !append) {
    els.grid.innerHTML = `<div class="no-results">
      <i class="fa-solid fa-film"></i>
      <h3>No results found</h3>
      <p>Try a different search term or genre.</p>
    </div>`;
    els.loadMoreWrap.style.display = "none";
    state.loading = false;
    return;
  }

  const frag = document.createDocumentFragment();
  data.results.forEach((m) => frag.appendChild(makeCard(m)));
  els.grid.appendChild(frag);

  els.loadMoreWrap.style.display =
    state.page < state.totalPages ? "block" : "none";
  els.loadMoreBtn.classList.remove("loading");
  els.loadMoreBtn.innerHTML =
    '<i class="fa-solid fa-circle-plus"></i>Load More';
  state.loading = false;
};

/* ── Trending carousel ── */
const renderTrending = async () => {
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

  // Dynamic animation speed based on content width
  requestAnimationFrame(() => {
    const w = els.trendTrack.scrollWidth / 2;
    els.trendTrack.style.animationDuration = `${Math.round(w / 32)}s`;
  });
};

/* ── Movie detail modal ── */
const openModal = async (id) => {
  els.movieModal.classList.add("active");
  document.body.style.overflow = "hidden";

  // Reset
  els.modalImg.src = "";
  els.modalTitle.textContent = "Loading…";
  els.modalDesc.textContent = "";
  els.modalRating.textContent = "—";
  els.modalDate.textContent = "";
  els.modalRuntime.textContent = "";
  els.modalGenres.innerHTML = "";
  els.modalCast.innerHTML = "";
  els.modalBackdrop.style.backgroundImage = "";
  els.trailerBtn.dataset.key = "";
  els.trailerBtn.classList.remove("no-trailer");

  const [details, credits, videos] = await Promise.all([
    api(`/movie/${id}`),
    api(`/movie/${id}/credits`),
    api(`/movie/${id}/videos`),
  ]);

  if (!details) {
    toast("Could not load movie details.");
    closeModal();
    return;
  }

  // Poster
  els.modalImg.src = details.poster_path
    ? `${_cfg.img}${details.poster_path}`
    : "https://placehold.co/250x375/0d1228/38456a?text=No+Poster";

  // Backdrop
  if (details.backdrop_path)
    els.modalBackdrop.style.backgroundImage = `url(${_cfg.imgOrig}${details.backdrop_path})`;

  els.modalTitle.textContent = details.title;
  els.modalRating.textContent = details.vote_average
    ? details.vote_average.toFixed(1)
    : "—";
  els.modalDate.textContent = details.release_date
    ? details.release_date.split("-")[0]
    : "—";

  if (details.runtime) {
    const h = Math.floor(details.runtime / 60),
      m = details.runtime % 60;
    els.modalRuntime.textContent = h ? `${h}h ${m}m` : `${m}m`;
  }

  els.modalDesc.textContent =
    details.overview || "No description available for this title.";

  if (details.genres?.length)
    els.modalGenres.innerHTML = details.genres
      .slice(0, 4)
      .map((g) => `<span class="genre-tag">${g.name}</span>`)
      .join("");

  if (credits?.cast?.length)
    els.modalCast.innerHTML = `
      <span class="cast-label">Cast</span>
      <span class="cast-names">
        ${credits.cast
          .slice(0, 5)
          .map((a) => `<span class="cast-name">${a.name}</span>`)
          .join(", ")}
      </span>`;

  // Trailer
  const trailer = videos?.results?.find(
    (v) => v.site === "YouTube" && ["Trailer", "Teaser"].includes(v.type),
  );
  if (trailer) {
    els.trailerBtn.dataset.key = trailer.key;
  } else {
    els.trailerBtn.classList.add("no-trailer");
    els.trailerBtn.title = "No trailer available";
  }

  // Watchlist state
  const saved = state.watchlist.includes(id);
  els.watchlistBtn.classList.toggle("saved", saved);
  els.watchlistBtn.dataset.id = id;
};

const closeModal = () => {
  els.movieModal.classList.remove("active");
  document.body.style.overflow = "";
};

/* ── Trailer ── */
const openTrailer = (key) => {
  if (!key) {
    toast("No trailer available for this title.");
    return;
  }
  els.trailerFrame.src = `https://www.youtube.com/embed/${key}?autoplay=1&rel=0`;
  els.trailerModal.classList.add("active");
};
const closeTrailerFn = () => {
  els.trailerModal.classList.remove("active");
  els.trailerFrame.src = "";
};

/* ── Watchlist ── */
const toggleWatchlist = (id) => {
  const n = Number(id);
  const idx = state.watchlist.indexOf(n);
  if (idx === -1) {
    state.watchlist.push(n);
    els.watchlistBtn.classList.add("saved");
    toast("Added to watchlist 🔖");
  } else {
    state.watchlist.splice(idx, 1);
    els.watchlistBtn.classList.remove("saved");
    toast("Removed from watchlist");
  }
  localStorage.setItem("cf_wl", JSON.stringify(state.watchlist));
};

/* ── Search ── */
const handleSearch = () => {
  const q = els.searchInput.value.trim();
  $$(".category-item").forEach((i) => i.classList.remove("active"));
  document.querySelector('[data-id="all"]').classList.add("active");
  state.query = q;
  state.genre = "all";
  state.page = 1;
  els.clearBtn.classList.toggle("visible", q.length > 0);

  if (!q) {
    els.trendSection.style.display = "block";
    setTitle("Top", " Rated");
  } else {
    els.trendSection.style.display = "none";
    setTitle(`"${q}"`, " Results");
  }
  renderGrid(false);
};

/* ── Category ── */
const handleCategory = (e) => {
  const el = e.currentTarget;
  const id = el.dataset.id;

  $$(".category-item").forEach((i) => i.classList.remove("active"));
  el.classList.add("active");
  els.searchInput.value = "";
  els.clearBtn.classList.remove("visible");
  state.query = "";
  state.genre = id;
  state.page = 1;

  if (id === "all") {
    els.trendSection.style.display = "block";
    setTitle("Top", " Rated");
  } else {
    els.trendSection.style.display = "none";
    const name = el.textContent.trim();
    setTitle(name, " Movies");
  }
  closeSidebar();
  renderGrid(false);
};

/* ── Sort ── */
const handleSort = (e) => {
  $$(".sort-item").forEach((i) => i.classList.remove("active"));
  e.currentTarget.classList.add("active");
  state.sort = e.currentTarget.dataset.sort;
  state.page = 1;
  if (state.genre !== "all" || state.query) renderGrid(false);
};

/* ── Sidebar ── */
const openSidebar = () => {
  els.sidebar.classList.add("open");
  els.sidebarOv.classList.add("active");
  els.hamburger.classList.add("open");
  document.body.style.overflow = "hidden";
};
const closeSidebar = () => {
  els.sidebar.classList.remove("open");
  els.sidebarOv.classList.remove("active");
  els.hamburger.classList.remove("open");
  document.body.style.overflow = "";
};

/* ── Event listeners ── */
els.searchBtn.addEventListener("click", handleSearch);
els.searchInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") handleSearch();
});
els.searchInput.addEventListener("input", (e) => {
  els.clearBtn.classList.toggle("visible", e.target.value.length > 0);
  if (!e.target.value) handleSearch();
});
els.clearBtn.addEventListener("click", () => {
  els.searchInput.value = "";
  els.clearBtn.classList.remove("visible");
  handleSearch();
  els.searchInput.focus();
});

$$(".category-item").forEach((el) =>
  el.addEventListener("click", handleCategory),
);
$$(".sort-item").forEach((el) => el.addEventListener("click", handleSort));

els.loadMoreBtn.addEventListener("click", () => {
  if (state.loading) return;
  state.page++;
  els.loadMoreBtn.classList.add("loading");
  els.loadMoreBtn.innerHTML =
    '<i class="fa-solid fa-spinner fa-spin"></i> Loading…';
  renderGrid(true);
});

els.retryBtn.addEventListener("click", () => {
  els.errorState.style.display = "none";
  renderGrid(false);
});

els.closeModal.addEventListener("click", closeModal);
els.movieModal.addEventListener("click", (e) => {
  if (e.target === els.movieModal) closeModal();
});

els.trailerBtn.addEventListener("click", () => {
  const key = els.trailerBtn.dataset.key;
  closeModal();
  setTimeout(() => openTrailer(key), 180);
});

els.closeTrailer.addEventListener("click", closeTrailerFn);
els.trailerModal.addEventListener("click", (e) => {
  if (e.target === els.trailerModal) closeTrailerFn();
});

els.watchlistBtn.addEventListener("click", () =>
  toggleWatchlist(els.watchlistBtn.dataset.id),
);

els.loginTrigger.addEventListener("click", () =>
  els.loginModal.classList.add("active"),
);
els.closeLogin.addEventListener("click", () =>
  els.loginModal.classList.remove("active"),
);
els.loginModal.addEventListener("click", (e) => {
  if (e.target === els.loginModal) els.loginModal.classList.remove("active");
});

document.querySelector(".form-submit-btn")?.addEventListener("click", () => {
  els.loginModal.classList.remove("active");
  toast("Portfolio demo — sign-in is not active 🎬");
});

els.hamburger.addEventListener("click", () =>
  els.sidebar.classList.contains("open") ? closeSidebar() : openSidebar(),
);
els.sidebarClose.addEventListener("click", closeSidebar);
els.sidebarOv.addEventListener("click", closeSidebar);

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  if (els.trailerModal.classList.contains("active")) closeTrailerFn();
  else if (els.movieModal.classList.contains("active")) closeModal();
  else if (els.loginModal.classList.contains("active"))
    els.loginModal.classList.remove("active");
  else if (els.sidebar.classList.contains("open")) closeSidebar();
});

/* ── Init ── */
document.addEventListener("DOMContentLoaded", () => {
  renderTrending();
  renderGrid(false);
});
