document.addEventListener('DOMContentLoaded', function() {
  // Create player structure
  const playerHTML = `
    <div class="weather-display">
      <div class="weather-location">Mendeteksi lokasi...</div>
      <div class="weather-condition">-</div>
      <div class="weather-details">
        <div class="weather-detail">
          <div class="detail-label">Suhu</div>
          <div class="detail-value" id="temperature">-</div>
        </div>
        <div class="weather-detail">
          <div class="detail-label">Terasa</div>
          <div class="detail-value" id="feels-like">-</div>
        </div>
        <div class="weather-detail">
          <div class="detail-label">Kondisi</div>
          <div class="detail-value" id="weather-condition">-</div>
        </div>
      </div>
    </div>
    <div class="player-container">
      <div class="album-art" id="album-art">
        <div class="weather-icon" id="weather-icon">⛅</div>
      </div>
      <div class="song-info">
        <div class="song-title" id="song-title">-</div>
        <div class="song-artist">Moodsic Player</div>
        <div class="weather-type" id="weather-type">-</div>
      </div>
      <div class="progress-container">
        <div class="progress-bar" id="progress-bar">
          <div class="progress" id="progress"></div>
        </div>
        <div class="time-info">
          <span id="current-time">0:00</span>
          <span id="duration">0:00</span>
        </div>
      </div>
      <div class="player-controls">
        <button class="control-btn" id="prev-btn" title="Previous">
          <i class="fas fa-step-backward"></i>
        </button>
        <button class="control-btn" id="play-pause-btn" title="Play">
          <i class="fas fa-play" id="play-icon"></i>
        </button>
        <button class="control-btn" id="next-btn" title="Next">
          <i class="fas fa-step-forward"></i>
        </button>
      </div>
    </div>
    <div class="manual-select" style="display: none;">
      <p>Atau pilih cuaca manual:</p>
      <select id="weather-select">
        <option value="sunny">Cerah</option>
        <option value="rainy">Hujan</option>
        <option value="cloudy">Berawan</option>
        <option value="cold">Dingin</option>
        <option value="neutral">Netral</option>
      </select>
      <button id="manual-submit">Terapkan</button>
    </div>
  `;

  document.querySelector('.container').innerHTML = playerHTML;

  // Player elements
  const audioPlayer = new Audio();
  const playPauseBtn = document.getElementById('play-pause-btn');
  const playIcon = document.getElementById('play-icon');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const progressBar = document.getElementById('progress-bar');
  const progress = document.getElementById('progress');
  const currentTimeEl = document.getElementById('current-time');
  const durationEl = document.getElementById('duration');
  const songTitleEl = document.getElementById('song-title');
  const weatherTypeEl = document.getElementById('weather-type');
  const weatherIconEl = document.getElementById('weather-icon');
  const albumArtEl = document.getElementById('album-art');

  // State
  let currentSongs = [];
  let currentSongIndex = 0;
  let isPlaying = false;
  let updateTimer;

  // Weather icons
  const weatherIcons = {
    sunny: '☀️',
    rainy: '🌧️',
    cloudy: '☁️',
    cold: '❄️',
    neutral: '🎵'
  };

  // Weather colors
  const weatherColors = {
    sunny: '#ff9a3c',
    rainy: '#3c6cff',
    cloudy: '#7d7d7d',
    cold: '#3cc3ff',
    neutral: '#1db954'
  };

  // Initialize
  initPlayer();

  function initPlayer() {
    // Try geolocation first
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        position => {
          const { latitude, longitude } = position.coords;
          fetchWeatherAndMusic(latitude, longitude);
        },
        error => {
          console.error('Geolocation error:', error);
          showManualSelect();
        }
      );
    } else {
      showManualSelect();
    }

    // Setup event listeners
    playPauseBtn.addEventListener('click', togglePlayPause);
    prevBtn.addEventListener('click', playPrevious);
    nextBtn.addEventListener('click', playNext);
    audioPlayer.addEventListener('ended', playNext);
    audioPlayer.addEventListener('timeupdate', updateProgress);
    progressBar.addEventListener('click', setProgress);
    document.getElementById('manual-submit').addEventListener('click', useManualWeather);
  }

  async function fetchWeatherAndMusic(lat, lon) {
    try {
      const response = await fetch('/get-weather-music', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ latitude: lat, longitude: lon })
      });

      const data = await response.json();

      if (data.success) {
        updateWeatherDisplay(data.weatherData);
        currentSongs = data.songs;
        currentSongIndex = 0;
        loadCurrentSong();
      } else {
        throw new Error('Failed to get weather data');
      }
    } catch (error) {
      console.error('Fetch error:', error);
      showError('Gagal memuat data cuaca');
      showManualSelect();
    }
  }

  function updateWeatherDisplay(weather) {
    document.querySelector('.weather-location').textContent = weather.location;
    document.querySelector('.weather-condition').textContent = weather.description;
    document.getElementById('temperature').textContent = `${Math.round(weather.temperature)}°C`;
    document.getElementById('feels-like').textContent = `${Math.round(weather.feelsLike)}°C`;
    document.getElementById('weather-condition').textContent = weather.condition;
    
    // Update weather icon
    const weatherType = weather.condition.toLowerCase();
    weatherIconEl.textContent = weatherIcons[weatherType] || weatherIcons.neutral;
    
    // Update background based on weather
    let bgColor1, bgColor2;
    if (weatherType.includes('sun') || weatherType.includes('clear')) {
      bgColor1 = '#ff9a3c';
      bgColor2 = '#ffcc33';
    } else if (weatherType.includes('rain')) {
      bgColor1 = '#3c6cff';
      bgColor2 = '#3cc3ff';
    } else if (weatherType.includes('cloud')) {
      bgColor1 = '#7d7d7d';
      bgColor2 = '#b3b3b3';
    } else if (weatherType.includes('cold') || weatherType.includes('snow')) {
      bgColor1 = '#3cc3ff';
      bgColor2 = '#ffffff';
    } else {
      bgColor1 = '#1db954';
      bgColor2 = '#1ed760';
    }
    
    document.querySelector('.weather-display').style.background = 
      `linear-gradient(135deg, ${bgColor1} 0%, ${bgColor2} 100%)`;
  }

  function loadCurrentSong() {
    if (currentSongs.length === 0) return;

    clearInterval(updateTimer);
    resetProgress();

    const song = currentSongs[currentSongIndex];
    audioPlayer.src = song.path;
    songTitleEl.textContent = song.name;
    
    const weatherType = song.path.split('/')[2];
    weatherTypeEl.textContent = getWeatherTypeName(weatherType);
    weatherIconEl.textContent = weatherIcons[weatherType] || weatherIcons.neutral;
    albumArtEl.style.backgroundColor = weatherColors[weatherType] || weatherColors.neutral;

    audioPlayer.addEventListener('loadedmetadata', () => {
      durationEl.textContent = formatTime(audioPlayer.duration);
      
      // Auto-play if user has interacted before
      if (isPlaying) {
        audioPlayer.play()
          .then(() => {
            playIcon.classList.replace('fa-play', 'fa-pause');
            startProgressTimer();
          })
          .catch(e => console.error('Play error:', e));
      }
    });
  }

  function getWeatherTypeName(type) {
    const names = {
      sunny: 'Cerah',
      rainy: 'Hujan',
      cloudy: 'Berawan',
      cold: 'Dingin',
      neutral: 'Netral'
    };
    return names[type] || type;
  }

  function togglePlayPause() {
    if (currentSongs.length === 0) return;

    if (isPlaying) {
      audioPlayer.pause();
      playIcon.classList.replace('fa-pause', 'fa-play');
      clearInterval(updateTimer);
    } else {
      audioPlayer.play()
        .then(() => {
          playIcon.classList.replace('fa-play', 'fa-pause');
          startProgressTimer();
        })
        .catch(e => {
          console.error('Play error:', e);
          showError('Gagal memutar musik');
        });
    }
    isPlaying = !isPlaying;
  }

  function playNext() {
    if (currentSongs.length === 0) return;
    
    currentSongIndex = (currentSongIndex + 1) % currentSongs.length;
    loadCurrentSong();
    
    if (isPlaying) {
      audioPlayer.play().catch(e => console.error('Play error:', e));
    }
  }

  function playPrevious() {
    if (currentSongs.length === 0) return;
    
    // If song is more than 3 seconds in, restart it
    if (audioPlayer.currentTime > 3) {
      audioPlayer.currentTime = 0;
      return;
    }
    
    currentSongIndex = (currentSongIndex - 1 + currentSongs.length) % currentSongs.length;
    loadCurrentSong();
    
    if (isPlaying) {
      audioPlayer.play().catch(e => console.error('Play error:', e));
    }
  }

  function startProgressTimer() {
    clearInterval(updateTimer);
    updateTimer = setInterval(updateProgress, 1000);
  }

  function updateProgress() {
    if (audioPlayer.duration) {
      const progressPercent = (audioPlayer.currentTime / audioPlayer.duration) * 100;
      progress.style.width = `${progressPercent}%`;
      currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    }
  }

  function resetProgress() {
    progress.style.width = '0%';
    currentTimeEl.textContent = '0:00';
    durationEl.textContent = '0:00';
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? '0' : ''}${secs}`;
  }

  function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;
    audioPlayer.currentTime = (clickX / width) * duration;
  }

  function showManualSelect() {
    document.querySelector('.manual-select').style.display = 'block';
  }

  function useManualWeather() {
    const selectedWeather = document.getElementById('weather-select').value;
    fetch('/get-weather-music', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ 
        manualWeather: selectedWeather
      })
    })
    .then(response => response.json())
    .then(data => {
      if (data.success) {
        updateWeatherDisplay(data.weatherData);
        currentSongs = data.songs;
        currentSongIndex = 0;
        loadCurrentSong();
        document.querySelector('.manual-select').style.display = 'none';
      }
    })
    .catch(error => {
      console.error('Error:', error);
      showError('Gagal memuat data cuaca');
    });
  }

  function showError(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'error-message';
    errorDiv.textContent = message;
    document.querySelector('.container').prepend(errorDiv);
    
    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
});