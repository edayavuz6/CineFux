# 🎬 CineFlux — Discover Cinema

CineFlux is a modern, luxury-themed (Navy & Gold) film discovery platform built for cinema enthusiasts. Powered by **The Movie Database (TMDB) API** integration, it dynamically fetches, filters, and displays up-to-date, popular, and top-rated movies, providing detailed insights and seamless trailer playback.

> 🚀 **Live Demo:** [Insert your live deployment link here]

---

## ✨ Features

- **Weekly Trending Section:** A smooth, continuous horizontal scrolling marquee displaying the week's trending movies that pauses on hover.
- **Advanced Filtering & Sorting:** Filter movies by genres (Action, Sci-Fi, Drama, etc.) and sort them dynamically by Popularity, Rating, or Release Date.
- **Smart Search:** Real-time search functionality allowing users to look up movies by titles, genres, or keywords instantly.
- **Immersive Movie Modal:** Clicking a movie card opens an elegant detail panel featuring a blurred backdrop of the film, cast details, runtimes, genres, and synthetic overviews.
- **In-App Trailer Player:** Integrated YouTube overlay player that lets users watch official trailers directly within the modal.
- **Personalized Watchlist:** Save favorite movies seamlessly using local browser storage (`LocalStorage`) for persistent access.
- **Premium UI/UX Polish:** - Sleek **Shimmer Effect Skeleton Cards** that act as structural placeholders while API data loads.
  - Custom-built Toast Notifications for micro-interactions.
  - Fully responsive, mobile-first design equipped with a smooth slide-out hamburger sidebar.

---

## 🛠️ Technologies Used

- **HTML5:** Semantic architecture and core structure.
- **CSS3:** Custom luxury color palette (`Navy & Gold`), fluid animations, CSS custom properties (`--variables`), and robust Responsive Design.
- **JavaScript (ES6+):** Asynchronous API management (`Fetch API`, `Promise.all`), State management, `LocalStorage` handling, and dynamic DOM manipulation.
- **Third-Party Services:**
  - **TMDB API:** Robust repository for movie metadata, graphics, and video sources.
  - **Font Awesome:** High-quality interface iconography.
  - **Google Fonts:** Premium typography combining *Cormorant Garamond* for display headings and *DM Sans* for crisp body text.

---

## 📂 Project Architecture

```text
├── index.html       # Application backbone, layout wrappers, and modal wireframes
├── style.css        # Palette variables, layout mechanics, animations, and media queries
└── script.js        # Core API client, state machines, and UX lifecycle event listeners
