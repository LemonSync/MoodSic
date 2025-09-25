document.addEventListener("DOMContentLoaded", function () {
  const audioPlayer = new Audio();
  const playPauseBtn = document.getElementById("play-pause-btn");
  const playIcon = document.getElementById("play-icon");
  const prevBtn = document.getElementById("prev-btn");
  const nextBtn = document.getElementById("next-btn");
  const progressBar = document.getElementById("progress-bar");
  const progress = document.getElementById("progress");
  const currentTimeEl = document.getElementById("current-time");
  const durationEl = document.getElementById("duration");
  const songTitleEl = document.getElementById("song-title");
  const weatherTypeEl = document.getElementById("weather-type");
  const weatherIconEl = document.getElementById("weather-icon");
  const albumArtEl = document.getElementById("album-art");
  const songTypeSelect = document.getElementById("songType");

  let currentSongs = [];
  let currentSongIndex = 0;
  let isPlaying = false;
  let updateTimer;

  const weatherIcons = {
    sunny: "☀️",
    rainy: "🌧️",
    cloudy: "☁️",
    cold: "❄️",
    neutral: "🎵",
  };

  const weatherColors = {
    sunny: "#FF9A3C", // Vibrant orange
    clear: "#FFCC33", // Warm yellow (complement to sunny)
    rainy: "#3C6CFF", // Deep blue
    drizzle: "#5D8BF4", // Lighter rain blue
    shower: "#3CC3FF", // Bright sky blue
    cloudy: "#7D7D7D", // Medium gray
    overcast: "#B3B3B3", // Light gray
    cold: "#3CC3FF", // Ice blue
    snow: "#FFFFFF", // Pure white
    sleet: "#B2EBF2", // Light cyan
    thunderstorm: "#4A148C", // Dark purple
    lightning: "#7B1FA2", // Electric purple
    fog: "#9E9E9E", // Soft gray
    mist: "#E0E0E0", // Off-white
    haze: "#BDBDBD", // Warm gray
    dust: "#FFC107", // Amber
    sand: "#FFE082", // Light amber
    smoke: "#616161", // Dark gray
    ash: "#9E9E9E", // Medium gray
    tornado: "#D32F2F", // Danger red
    squall: "#F44336", // Bright red
    freezing: "#00ACC1", // Deep cyan
    neutral: "#1DB954", // Spotify green (warna default)
  };

  initPlayer();

  function initPlayer() {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          fetchWeatherAndMusic(latitude, longitude);
        },
        (error) => {
          console.error("Geolocation error:", error);
          showManualSelect();
        }
      );
    } else {
      showManualSelect();
    }

    playPauseBtn.addEventListener("click", togglePlayPause);
    prevBtn.addEventListener("click", playPrevious);
    nextBtn.addEventListener("click", playNext);
    audioPlayer.addEventListener("ended", playNext);
    audioPlayer.addEventListener("timeupdate", updateProgress);
    progressBar.addEventListener("click", setProgress);
    document
      .getElementById("manual-submit")
      .addEventListener("click", useManualWeather);
  }

  async function fetchWeatherAndMusic(lat, lon) {
    try {
      const response = await fetch("/get-weather-music", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          latitude: lat,
          longitude: lon,
          songType: songTypeSelect.value,
        }),
      });

      const data = await response.json();

      if (data.success) {
        updateWeatherDisplay(data.weatherData);
        currentSongs = data.songs;
        currentSongIndex = 0;
        loadCurrentSong();
      } else {
        throw new Error("Failed to get weather data");
      }
    } catch (error) {
      console.error("Fetch error:", error);
      showError("Gagal memuat data cuaca");
      showManualSelect();
    }
  }

  function updateWeatherDisplay(weather) {
    document.querySelector(".weather-location").textContent = weather.location;
    document.querySelector(".weather-condition").textContent =
      weather.description;
    document.getElementById("temperature").textContent = `${Math.round(
      weather.temperature
    )}°C`;
    document.getElementById("feels-like").textContent = `${Math.round(
      weather.feelsLike
    )}°C`;
    document.getElementById("weather-condition").textContent =
      weather.condition;

    const weatherType = weather.condition.toLowerCase();
    weatherIconEl.textContent =
      weatherIcons[weatherType] || weatherIcons.neutral;

    let bgColor1, bgColor2;
    if (weatherType.includes("clear") || weatherType.includes("sun")) {
      bgColor1 = "#FF9A3C"; // Vibrant orange
      bgColor2 = "#FFCC33"; // Warm yellow
    } else if (
      weatherType.includes("rain") ||
      weatherType.includes("drizzle") ||
      weatherType.includes("shower")
    ) {
      bgColor1 = "#3C6CFF"; // Deep blue
      bgColor2 = "#3CC3FF"; // Sky blue
    } else if (
      weatherType.includes("thunder") ||
      weatherType.includes("storm")
    ) {
      bgColor1 = "#4A148C"; // Dark purple
      bgColor2 = "#7B1FA2"; // Electric purple
    } else if (
      weatherType.includes("snow") ||
      weatherType.includes("flurr") ||
      weatherType.includes("sleet")
    ) {
      bgColor1 = "#3CC3FF"; // Ice blue
      bgColor2 = "#FFFFFF"; // Pure white
    } else if (
      weatherType.includes("cloud") ||
      weatherType.includes("overcast")
    ) {
      bgColor1 = "#7D7D7D"; // Medium gray
      bgColor2 = "#B3B3B3"; // Light gray
    } else if (
      weatherType.includes("fog") ||
      weatherType.includes("mist") ||
      weatherType.includes("haze")
    ) {
      bgColor1 = "#9E9E9E"; // Soft gray
      bgColor2 = "#E0E0E0"; // Off-white
    } else if (weatherType.includes("sand") || weatherType.includes("dust")) {
      bgColor1 = "#FFC107"; // Amber
      bgColor2 = "#FFE082"; // Light amber
    } else if (weatherType.includes("smoke") || weatherType.includes("ash")) {
      bgColor1 = "#616161"; // Dark gray
      bgColor2 = "#9E9E9E"; // Medium gray
    } else if (
      weatherType.includes("squall") ||
      weatherType.includes("tornado")
    ) {
      bgColor1 = "#D32F2F"; // Dark red
      bgColor2 = "#F44336"; // Bright red
    } else if (weatherType.includes("cold") || weatherType.includes("freez")) {
      bgColor1 = "#00ACC1"; // Cyan
      bgColor2 = "#B2EBF2"; // Light cyan
    } else {
      // Default
      bgColor1 = "#1DB954"; // Spotify green
      bgColor2 = "#1ED760"; // Brighter green
    }

    document.querySelector(
      ".weather-display"
    ).style.background = `linear-gradient(135deg, ${bgColor1} 0%, ${bgColor2} 100%)`;
  }

  function loadCurrentSong() {
    if (currentSongs.length === 0) return;

    clearInterval(updateTimer);
    resetProgress();

    const song = currentSongs[currentSongIndex];
    audioPlayer.src = song.path;
    songTitleEl.textContent = song.name;

    const weatherType = song.path.split("/")[2];
    weatherTypeEl.textContent = getWeatherTypeName(weatherType);
    weatherIconEl.textContent =
      weatherIcons[weatherType] || weatherIcons.neutral;
    albumArtEl.style.backgroundColor =
      weatherColors[weatherType] || weatherColors.neutral;

    audioPlayer.addEventListener("loadedmetadata", () => {
      durationEl.textContent = formatTime(audioPlayer.duration);

      if (isPlaying) {
        audioPlayer
          .play()
          .then(() => {
            playIcon.classList.replace("fa-play", "fa-pause");
            startProgressTimer();
          })
          .catch((e) => console.error("Play error:", e));
      }
    });
  }

  function getWeatherTypeName(type) {
    const names = {
      sunny: "Cerah",
      rainy: "Hujan",
      cloudy: "Berawan",
      cold: "Dingin",
      neutral: "Netral",
    };
    return names[type] || type;
  }

  function togglePlayPause() {
    if (currentSongs.length === 0) return;

    if (isPlaying) {
      audioPlayer.pause();
      playIcon.classList.replace("fa-pause", "fa-play");
      clearInterval(updateTimer);
    } else {
      audioPlayer
        .play()
        .then(() => {
          playIcon.classList.replace("fa-play", "fa-pause");
          startProgressTimer();
        })
        .catch((e) => {
          console.error("Play error:", e);
          showError("Gagal memutar musik");
        });
    }
    isPlaying = !isPlaying;
  }

  function playNext() {
    if (currentSongs.length === 0) return;

    currentSongIndex = (currentSongIndex + 1) % currentSongs.length;
    loadCurrentSong();

    if (isPlaying) {
      audioPlayer.play().catch((e) => console.error("Play error:", e));
    }
  }

  function playPrevious() {
    if (currentSongs.length === 0) return;

    if (audioPlayer.currentTime > 3) {
      audioPlayer.currentTime = 0;
      return;
    }

    currentSongIndex =
      (currentSongIndex - 1 + currentSongs.length) % currentSongs.length;
    loadCurrentSong();

    if (isPlaying) {
      audioPlayer.play().catch((e) => console.error("Play error:", e));
    }
  }

  function startProgressTimer() {
    clearInterval(updateTimer);
    updateTimer = setInterval(updateProgress, 1000);
  }

  function updateProgress() {
    if (audioPlayer.duration) {
      const progressPercent =
        (audioPlayer.currentTime / audioPlayer.duration) * 100;
      progress.style.width = `${progressPercent}%`;
      currentTimeEl.textContent = formatTime(audioPlayer.currentTime);
    }
  }

  function resetProgress() {
    progress.style.width = "0%";
    currentTimeEl.textContent = "0:00";
    durationEl.textContent = "0:00";
  }

  function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${minutes}:${secs < 10 ? "0" : ""}${secs}`;
  }

  function setProgress(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;
    audioPlayer.currentTime = (clickX / width) * duration;
  }

  function showManualSelect() {
    document.querySelector(".manual-select").style.display = "block";
  }

  function useManualWeather() {
    const selectedWeather = document.getElementById("weather-select").value;
    fetch("/get-weather-music", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        manualWeather: selectedWeather,
      }),
    })
      .then((response) => response.json())
      .then((data) => {
        if (data.success) {
          updateWeatherDisplay(data.weatherData);
          currentSongs = data.songs;
          currentSongIndex = 0;
          loadCurrentSong();
          document.querySelector(".manual-select").style.display = "none";
        }
      })
      .catch((error) => {
        console.error("Error:", error);
        showError("Gagal memuat data cuaca");
      });
  }

  function showError(message) {
    const errorDiv = document.createElement("div");
    errorDiv.className = "error-message";
    errorDiv.textContent = message;
    document.querySelector(".container").prepend(errorDiv);

    setTimeout(() => {
      errorDiv.remove();
    }, 5000);
  }
});
