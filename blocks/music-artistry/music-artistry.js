export default function decorate(block) {
  // Get all block children
  const [bannerRow, labelRow, titleRow, thumbRow, songLabelRow, songRow] = [...block.children];

  // Banner image
  const bannerImg = bannerRow.querySelector('img');
  const banner = document.createElement('div');
  banner.className = 'music-banner';
  banner.style.backgroundImage = `url('${bannerImg.src}')`;

  // Overlay content
  const overlay = document.createElement('div');
  overlay.className = 'music-banner-overlay';

  // Label
  const label = document.createElement('div');
  label.className = 'music-banner-label';
  label.textContent = labelRow.querySelector('p')?.textContent || '';

  // Title
  const title = document.createElement('div');
  title.className = 'music-banner-title';
  const h2 = titleRow.querySelector('h2, h1, h3, h4, h5, h6');
  if (h2) title.innerHTML = h2.outerHTML;

  overlay.appendChild(label);
  overlay.appendChild(title);

  // Music Card
  const musicCard = document.createElement('div');
  musicCard.className = 'music-card';

  // Artist thumbnail
  const artistThumb = document.createElement('div');
  artistThumb.className = 'music-artist-thumbnail';
  const thumbPic = thumbRow.querySelector('picture');
  if (thumbPic) artistThumb.appendChild(thumbPic.cloneNode(true));

  // Song info
  const songInfo = document.createElement('div');
  songInfo.className = 'music-song-info';

  // Song label (artist)
  const songLabel = document.createElement('div');
  songLabel.className = 'music-song-label';
  songLabel.textContent = songLabelRow.querySelector('p')?.textContent || '';

  // Song title
  const songTitle = document.createElement('div');
  songTitle.className = 'music-title';
  const songLink = songRow.querySelector('a.button');
  songTitle.textContent = songLink?.title || songLink?.textContent || '';

  // Audio player
  const audioContainer = document.createElement('div');
  audioContainer.className = 'music-audio-player';

  const audio = document.createElement('audio');
  audio.src = songLink?.href || '';
  audio.preload = 'metadata';

  // Duration display
  const duration = document.createElement('span');
  duration.className = 'music-audio-duration';
  duration.textContent = '0:00 / 0:00';

  // Progress bar
  const progressBarWrapper = document.createElement('div');
  progressBarWrapper.className = 'music-progress-bar-wrapper';
  const progressBar = document.createElement('div');
  progressBar.className = 'music-progress-bar';
  progressBarWrapper.appendChild(progressBar);

  // Update progress bar and timings as audio plays
  audio.addEventListener('timeupdate', () => {
    const percent = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    progressBar.style.width = percent + '%';

    const left = audio.duration - audio.currentTime;
    currentTimeSpan.textContent = formatTime(audio.currentTime);
    durationLeftSpan.textContent = `-${formatTime(left)}`;
  });

  // Seek on click
  progressBarWrapper.addEventListener('click', (e) => {
    const rect = progressBarWrapper.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const percent = x / rect.width;
    if (audio.duration) {
      audio.currentTime = percent * audio.duration;
    }
  });

  // Play button
  const playBtn = document.createElement('button');
  playBtn.className = 'music-audio-play';
  playBtn.innerHTML = `
    <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#fff"/><polygon points="13,10 24,16 13,22" fill="#000"/></svg>
  `;

  // Play/Pause logic
  let playing = false;
  playBtn.addEventListener('click', () => {
    if (audio.paused) {
      audio.play();
    } else {
      audio.pause();
    }
  });
  audio.addEventListener('play', () => {
    playing = true;
    playBtn.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#fff"/><rect x="12" y="10" width="3" height="12" fill="#000"/><rect x="17" y="10" width="3" height="12" fill="#000"/></svg>
    `;
  });
  audio.addEventListener('pause', () => {
    playing = false;
    playBtn.innerHTML = `
      <svg width="32" height="32" viewBox="0 0 32 32"><circle cx="16" cy="16" r="16" fill="#fff"/><polygon points="13,10 24,16 13,22" fill="#000"/></svg>
    `;
  });
  // Duration update
  audio.addEventListener('loadedmetadata', () => {
    currentTimeSpan.textContent = '0:00';
    durationLeftSpan.textContent = `-${formatTime(audio.duration)}`;
  });

  function formatTime(sec) {
    if (!isFinite(sec)) return '0:00';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }

  // Timing container for progress bar and timings
  const timingContainer = document.createElement('div');
  timingContainer.className = 'music-audio-timing';

  // Create timing row
  const timingRow = document.createElement('div');
  timingRow.className = 'music-audio-timing-row';

  const currentTimeSpan = document.createElement('span');
  currentTimeSpan.className = 'music-audio-current';
  currentTimeSpan.textContent = '0:00';

  const durationLeftSpan = document.createElement('span');
  durationLeftSpan.className = 'music-audio-left';
  durationLeftSpan.textContent = '-0:00';

  timingRow.appendChild(currentTimeSpan);
  timingRow.appendChild(durationLeftSpan);

  timingContainer.appendChild(timingRow);
  timingContainer.appendChild(progressBarWrapper);

  audioContainer.appendChild(timingContainer);
  audioContainer.appendChild(playBtn);

  // Assemble song info
  songInfo.appendChild(songLabel);
  songInfo.appendChild(songTitle);
  songInfo.appendChild(audioContainer);

  // Assemble music card
  musicCard.appendChild(artistThumb);
  musicCard.appendChild(songInfo);

  // Create a wrapper for overlay and card
  const contentWrapper = document.createElement('div');
  contentWrapper.className = 'music-banner-content';
  contentWrapper.appendChild(overlay);
  contentWrapper.appendChild(musicCard);

  // Final assembly
  banner.appendChild(contentWrapper);

  // Clear block and append
  block.innerHTML = '';
  block.appendChild(banner);
}