import { getBasePathBasedOnEnv } from "../../scripts/utils.js";
// sliderTeaserUtils.js
// Utility functions for slider-teaser-content block

/**
 * Create a music player card for a slide
 * @param {Object} opts - Music player options
 * @param {string} opts.songSrc - Audio source URL
 * @param {string} opts.artist - Artist name
 * @param {string} opts.title - Song title
 * @param {HTMLElement} opts.thumbnail - Thumbnail element
 * @returns {HTMLElement} Music card element
 */
export function createMusicPlayer({ songSrc, artist, title, thumbnail }) {
  const musicCard = document.createElement("div");
  musicCard.className = "music-card";

  // Artist thumbnail
  const thumbnailDiv = document.createElement("div");
  thumbnailDiv.className = "music-artist-thumbnail";
  if (thumbnail) thumbnailDiv.innerHTML = thumbnail.innerHTML;

  // Song info
  const songInfoDiv = document.createElement("div");
  songInfoDiv.className = "music-song-info";

  const songLabelDiv = document.createElement("div");
  songLabelDiv.className = "music-song-label";
  songLabelDiv.textContent = artist;

  const songTitleDiv = document.createElement("div");
  songTitleDiv.className = "music-title";
  songTitleDiv.textContent = title;

  // Audio player
  const audioPlayerDiv = document.createElement("div");
  audioPlayerDiv.className = "music-audio-player";

  const timingDiv = document.createElement("div");
  timingDiv.className = "music-audio-timing";

  const timingRowDiv = document.createElement("div");
  timingRowDiv.className = "music-audio-timing-row";

  const currentTimeSpan = document.createElement("span");
  currentTimeSpan.className = "music-audio-current";
  currentTimeSpan.textContent = "0:00";

  const durationLeftSpan = document.createElement("span");
  durationLeftSpan.className = "music-audio-left";
  durationLeftSpan.textContent = "-0:00";

  timingRowDiv.appendChild(currentTimeSpan);
  timingRowDiv.appendChild(durationLeftSpan);
  timingDiv.appendChild(timingRowDiv);

  // Progress bar
  const progressBarWrapper = document.createElement("div");
  progressBarWrapper.className = "music-progress-bar-wrapper";
  const progressBar = document.createElement("div");
  progressBar.className = "music-progress-bar";
  progressBarWrapper.appendChild(progressBar);
  timingDiv.appendChild(progressBarWrapper);

  audioPlayerDiv.appendChild(timingDiv);

  // Play button
  const playBtn = document.createElement("button");
  playBtn.className = "music-audio-play";
  playBtn.innerHTML = `
    <svg width="56" height="56" viewBox="0 0 32 32">
      <circle cx="16" cy="16" r="16" fill="#fff"></circle>
      <polygon points="12,10 23,16 12,22" fill="#000"></polygon>
    </svg>
  `;

  // Create audio element for this card
  const audio = document.createElement("audio");
  audio.src = getBasePathBasedOnEnv() + songSrc;
  audio.preload = "metadata";
  audio.style.display = "none";
  musicCard.appendChild(audio);

  // Assemble music card
  songInfoDiv.appendChild(songLabelDiv);
  songInfoDiv.appendChild(songTitleDiv);
  songInfoDiv.appendChild(audioPlayerDiv);

  musicCard.appendChild(thumbnailDiv);
  musicCard.appendChild(songInfoDiv);
  musicCard.appendChild(playBtn);

  return musicCard;
}

/**
 * Format time in seconds to mm:ss
 * @param {number} sec
 * @returns {string}
 */
export function formatTime(sec) {
  if (!isFinite(sec)) return "0:00";
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

/**
 * Create and show artist modal
 * @param {Object} opts
 * @param {string} opts.imageSrc
 * @param {string} opts.imageAlt
 * @param {string} opts.title
 * @param {string} opts.body
 */

/**
 * Robust video logic: autoplay when visible
 * @param {HTMLVideoElement} video
 */
export function setupVideoAutoplay(video) {
  if (!video) return;
  const observer = new window.IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          video.play();
        } else {
          video.pause();
        }
      });
    },
    { threshold: 0.5 }
  );
  observer.observe(video);
}

// Muisc Player Logic
export function handleMusicPlayer(section) {
  const musicCards = section.querySelectorAll(".music-card");
  musicCards.forEach((card) => {
    const playBtn = card.querySelector(".music-audio-play");
    const audio = card.querySelector("audio");
    const currentTimeSpan = card.querySelector(".music-audio-current");
    const durationLeftSpan = card.querySelector(".music-audio-left");
    const progressBar = card.querySelector(".music-progress-bar");
    const progressBarWrapper = card.querySelector(
      ".music-progress-bar-wrapper"
    );

    if (playBtn && audio) {
      playBtn.addEventListener("click", (e) => {
        e.stopPropagation();
        // Pause all other audios in the document
        document.querySelectorAll(".music-card audio").forEach((a) => {
          if (a !== audio) a.pause();
        });
        if (audio.paused) {
          audio.play();
          playBtn.classList.add("playing");
        } else {
          audio.pause();
          playBtn.classList.remove("playing");
        }
      });

      audio.addEventListener("play", () => {
        playBtn.innerHTML = `
      <svg width="56" height="56" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#fff"/><rect x="12" y="10" width="3" height="12" fill="#000"/><rect x="17" y="10" width="3" height="12" fill="#000"/></svg>
    `;
      });
      audio.addEventListener("pause", () => {
        playBtn.innerHTML = `
      <svg width="56" height="56" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#fff"/><polygon points="12,10 23,16 12,22" fill="#000"/></svg>
    `;
      });

      audio.addEventListener("loadedmetadata", () => {
        if (currentTimeSpan) currentTimeSpan.textContent = "0:00";
        if (durationLeftSpan)
          durationLeftSpan.textContent = `-${formatTime(audio.duration)}`;
      });

      audio.addEventListener("timeupdate", () => {
        if (currentTimeSpan)
          currentTimeSpan.textContent = formatTime(audio.currentTime);
        if (durationLeftSpan)
          durationLeftSpan.textContent = `-${formatTime(
            audio.duration - audio.currentTime
          )}`;
        if (progressBar && audio.duration) {
          progressBar.style.width =
            (audio.currentTime / audio.duration) * 100 + "%";
        }
      });
      if (progressBarWrapper) {
        progressBarWrapper.addEventListener("click", (e) => {
          const rect = progressBarWrapper.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const percent = x / rect.width;
          if (audio.duration) {
            audio.currentTime = percent * audio.duration;
          }
        });
      }
    }
  });
}
