document.addEventListener('DOMContentLoaded', function() {
  // DOM Elements
  const weatherDisplay = document.createElement('div');
  weatherDisplay.className = 'weather-display';
  weatherDisplay.innerHTML = `
    <div class="weather-header">
      <div class="weather-location">Mendeteksi lokasi...</div>
      <span class="weather-type">-</span>
    </div>
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
      <div class="weather-detail">
        <div class="detail-label">Kelembaban</div>
        <div class="detail-value" id="humidity">-</div>
      </div>
    </div>
  `;

  const playerContainer = document.createElement('div');
  playerContainer.className = 'player-container';
  playerContainer.innerHTML = `
    <audio id="audio-player"></audio>
    <div class="player-controls">
      <button class="control-btn" id="prev-btn" title="Previous">
        <i>⏮</i>
      </button>
      <button class="control-btn" id="play-pause-btn" title="Play/Pause">
        <i>▶️</i>
      </button>
      <button class="control-btn" id="next-btn" title="Next">
        <i>⏭</i>
      </button>
    </div>
    <div id="now-playing">
      <span class="song-title">-</span>
    </div>
  `;

  const manualSelect = document.createElement('div');
  manualSelect.className = 'manual-select';

  document.querySelector('.container').append(weatherDisplay, playerContainer, manualSelect);

  // Player elements
  const audioPlayer = document.getElementById('audio-player');
  const playPauseBtn = document.getElementById('play-pause-btn');
  const prevBtn = document.getElementById('prev-btn');
  const nextBtn = document.getElementById('next-btn');
  const nowPlaying = document.querySelector('.song-title');
  const weatherType = document.querySelector('.weather-type');

  // State
  let currentSongs = [];
  let currentSongIndex = 0;
  let isPlaying = false;

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
    document.getElementById('temperature').textContent = `${weather.temperature}°C`;
    document.getElementById('feels-like').textContent = `${weather.feelsLike}°C`;
    document.getElementById('weather-condition').textContent = weather.condition;
    document.getElementById('humidity').textContent = `${weather.humidity}%`;
  }

  function loadCurrentSong() {
    if (currentSongs.length === 0) return;

    const song = currentSongs[currentSongIndex];
    audioPlayer.src = song.path;
    nowPlaying.textContent = song.name;
    weatherType.textContent = getWeatherTypeName(song.path.split('/')[2]);

    // Auto-play if user has interacted before
    if (isPlaying) {
      audioPlayer.play().catch(e => console.error('Play error:', e));
    }
  }

  function getWeatherTypeName(type) {
    const names = {
      sunny: '☀️ Cerah',
      rainy: '🌧️ Hujan',
      cloudy: '☁️ Berawan',
      cold: '❄️ Dingin',
      neutral: '🎵 Netral'
    };
    return names[type] || type;
  }

  function togglePlayPause() {
    if (currentSongs.length === 0) return;

    if (isPlaying) {
      audioPlayer.pause();
      playPauseBtn.innerHTML = '<i>▶️</i>';
    } else {
      audioPlayer.play()
        .then(() => {
          playPauseBtn.innerHTML = '<i>⏸</i>';
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
    
    currentSongIndex = (currentSongIndex - 1 + currentSongs.length) % currentSongs.length;
    loadCurrentSong();
    
    if (isPlaying) {
      audioPlayer.play().catch(e => console.error('Play error:', e));
    }
  }

  function showManualSelect() {
    document.querySelector('.manual-select').style.display = 'block';
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