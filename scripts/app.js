// Konfigurasi
const API_KEY = '267cf21554b098b03a55b035485b7dc6'; // Ganti dengan API key Anda
const audioPlayer = document.getElementById('audio-player');
const playBtn = document.getElementById('play-btn');
const prevBtn = document.getElementById('prev-btn');
const nextBtn = document.getElementById('next-btn');
const progressBar = document.getElementById('progress-bar');
const favoriteBtn = document.getElementById('favorite-btn');
const favoritesList = document.getElementById('favorites-list');

// Data musik berdasarkan cuaca
const weatherMusicMap = {
    'clear': {
        mood: 'Cerah dan Bersemangat',
        tracks: [
            { title: 'Sunny Day', file: 'sunny1.mp3' },
            { title: 'Bright Morning', file: 'sunny2.mp3' },
            { title: 'Happy Vibes', file: 'sunny3.mp3' }
        ]
    },
    'clouds': {
        mood: 'Tenang dan Kontemplatif',
        tracks: [
            { title: 'Cloud Watching', file: 'clouds1.mp3' },
            { title: 'Misty Morning', file: 'clouds2.mp3' },
            { title: 'Soft Breeze', file: 'clouds3.mp3' }
        ]
    },
    'rain': {
        mood: 'Santai dan Fokus',
        tracks: [
            { title: 'Rainfall', file: 'rain1.mp3' },
            { title: 'Thunderstorm', file: 'rain2.mp3' },
            { title: 'Cozy Rain', file: 'rain3.mp3' }
        ]
    },
    'snow': {
        mood: 'Magis dan Damai',
        tracks: [
            { title: 'Winter Wonderland', file: 'snow1.mp3' },
            { title: 'Frozen Lake', file: 'snow2.mp3' },
            { title: 'Snowfall', file: 'snow3.mp3' }
        ]
    },
    'default': {
        mood: 'Netral dan Menenangkan',
        tracks: [
            { title: 'Ambient Soundscape', file: 'default1.mp3' },
            { title: 'Calm Atmosphere', file: 'default2.mp3' },
            { title: 'Peaceful Moment', file: 'default3.mp3' }
        ]
    }
};

// State aplikasi
let currentState = {
    location: null,
    weather: null,
    currentTrackIndex: 0,
    currentPlaylist: null,
    favorites: JSON.parse(localStorage.getItem('soundmood_favorites')) || [],
    isPlaying: false
};

// Inisialisasi
document.addEventListener('DOMContentLoaded', () => {
    updateFavoritesList();
    getLocation();
    
    // Event listeners
    playBtn.addEventListener('click', togglePlay);
    prevBtn.addEventListener('click', playPrevious);
    nextBtn.addEventListener('click', playNext);
    favoriteBtn.addEventListener('click', addToFavorites);
    audioPlayer.addEventListener('timeupdate', updateProgressBar);
    audioPlayer.addEventListener('ended', playNext);
    progressBar.parentElement.addEventListener('click', seek);
});

// Fungsi utama
function getLocation() {
    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            position => {
                const { latitude, longitude } = position.coords;
                currentState.location = { latitude, longitude };
                getWeather(latitude, longitude);
            },
            error => {
                console.error("Error getting location:", error);
                document.getElementById('location').textContent = "Tidak dapat mendeteksi lokasi";
                // Default ke Jakarta jika lokasi tidak bisa didapatkan
                currentState.location = { latitude: -6.2088, longitude: 106.8456 };
                getWeather(-6.2088, 106.8456);
            }
        );
    } else {
        alert("Geolocation tidak didukung oleh browser Anda");
    }
}

async function getWeather(lat, lon) {
    try {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric&lang=id`
        );
        const data = await response.json();
        
        currentState.weather = {
            city: data.name,
            country: data.sys.country,
            temp: Math.round(data.main.temp),
            description: data.weather[0].description,
            main: data.weather[0].main.toLowerCase(),
            icon: data.weather[0].icon
        };
        
        updateWeatherUI();
        selectPlaylistBasedOnWeather();
    } catch (error) {
        console.error("Error fetching weather:", error);
        document.getElementById('location').textContent = "Gagal mendapatkan data cuaca";
    }
}

function updateWeatherUI() {
    const { city, country, temp, description, main, icon } = currentState.weather;
    
    document.getElementById('location').textContent = `${city}, ${country}`;
    document.getElementById('temperature').textContent = `${temp}°C`;
    document.getElementById('weather-desc').textContent = description;
    
    // Update icon berdasarkan cuaca
    const weatherIcon = document.getElementById('weather-icon');
    weatherIcon.innerHTML = '';
    
    let iconClass;
    switch (main) {
        case 'clear':
            iconClass = 'fas fa-sun';
            break;
        case 'clouds':
            iconClass = 'fas fa-cloud';
            break;
        case 'rain':
            iconClass = 'fas fa-cloud-rain';
            break;
        case 'snow':
            iconClass = 'far fa-snowflake';
            break;
        case 'thunderstorm':
            iconClass = 'fas fa-bolt';
            break;
        default:
            iconClass = 'fas fa-cloud-sun';
    }
    
    const iconElement = document.createElement('i');
    iconElement.className = iconClass;
    weatherIcon.appendChild(iconElement);
}

function selectPlaylistBasedOnWeather() {
    const weatherMain = currentState.weather.main;
    let playlist;
    
    if (weatherMusicMap[weatherMain]) {
        playlist = weatherMusicMap[weatherMain];
    } else {
        playlist = weatherMusicMap['default'];
    }
    
    currentState.currentPlaylist = playlist;
    currentState.currentTrackIndex = 0;
    
    // Update UI
    document.getElementById('track-mood').textContent = playlist.mood;
    
    // Mulai memainkan lagu pertama
    playTrack(currentState.currentTrackIndex);
}

function playTrack(index) {
    if (!currentState.currentPlaylist || !currentState.currentPlaylist.tracks[index]) return;
    
    const track = currentState.currentPlaylist.tracks[index];
    document.getElementById('track-title').textContent = track.title;
    
    // Dalam implementasi nyata, Anda perlu memiliki file audio yang sesuai
    // Ini hanya contoh, Anda perlu menyesuaikan path ke file audio Anda
    audioPlayer.src = `assets/audio/${track.file}`;
    
    if (currentState.isPlaying) {
        audioPlayer.play()
            .then(() => {
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            })
            .catch(error => {
                console.error("Error playing audio:", error);
            });
    }
}

function togglePlay() {
    if (audioPlayer.paused) {
        audioPlayer.play()
            .then(() => {
                currentState.isPlaying = true;
                playBtn.innerHTML = '<i class="fas fa-pause"></i>';
            })
            .catch(error => {
                console.error("Error playing audio:", error);
            });
    } else {
        audioPlayer.pause();
        currentState.isPlaying = false;
        playBtn.innerHTML = '<i class="fas fa-play"></i>';
    }
}

function playPrevious() {
    if (!currentState.currentPlaylist) return;
    
    currentState.currentTrackIndex--;
    if (currentState.currentTrackIndex < 0) {
        currentState.currentTrackIndex = currentState.currentPlaylist.tracks.length - 1;
    }
    
    playTrack(currentState.currentTrackIndex);
}

function playNext() {
    if (!currentState.currentPlaylist) return;
    
    currentState.currentTrackIndex++;
    if (currentState.currentTrackIndex >= currentState.currentPlaylist.tracks.length) {
        currentState.currentTrackIndex = 0;
    }
    
    playTrack(currentState.currentTrackIndex);
}

function updateProgressBar() {
    const { duration, currentTime } = audioPlayer;
    const progressPercent = (currentTime / duration) * 100;
    progressBar.style.width = `${progressPercent}%`;
}

function seek(e) {
    const width = this.clientWidth;
    const clickX = e.offsetX;
    const duration = audioPlayer.duration;
    
    audioPlayer.currentTime = (clickX / width) * duration;
}

function addToFavorites() {
    if (!currentState.weather || !currentState.currentPlaylist || 
        !currentState.currentPlaylist.tracks[currentState.currentTrackIndex]) return;
    
    const favorite = {
        id: Date.now(),
        city: currentState.weather.city,
        weather: currentState.weather.main,
        track: currentState.currentPlaylist.tracks[currentState.currentTrackIndex].title,
        mood: currentState.currentPlaylist.mood,
        timestamp: new Date().toLocaleString()
    };
    
    // Cek apakah sudah ada di favorit
    const exists = currentState.favorites.some(
        fav => fav.city === favorite.city && fav.track === favorite.track
    );
    
    if (!exists) {
        currentState.favorites.push(favorite);
        localStorage.setItem('soundmood_favorites', JSON.stringify(currentState.favorites));
        updateFavoritesList();
        
        // Feedback visual
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Tersimpan!';
        favoriteBtn.style.backgroundColor = '#4CAF50';
        
        setTimeout(() => {
            favoriteBtn.innerHTML = '<i class="far fa-heart"></i> Simpan ke Favorit';
            favoriteBtn.style.backgroundColor = '';
        }, 2000);
    } else {
        favoriteBtn.innerHTML = '<i class="fas fa-heart"></i> Sudah Tersimpan';
        favoriteBtn.style.backgroundColor = '#FF9800';
        
        setTimeout(() => {
            favoriteBtn.innerHTML = '<i class="far fa-heart"></i> Simpan ke Favorit';
            favoriteBtn.style.backgroundColor = '';
        }, 2000);
    }
}

function updateFavoritesList() {
    if (currentState.favorites.length === 0) {
        favoritesList.innerHTML = '<p class="empty-message">Belum ada favorit</p>';
        return;
    }
    
    favoritesList.innerHTML = '';
    
    currentState.favorites.forEach(fav => {
        const favoriteItem = document.createElement('div');
        favoriteItem.className = 'favorite-item';
        
        let weatherIcon;
        switch (fav.weather) {
            case 'clear': weatherIcon = '<i class="fas fa-sun"></i>'; break;
            case 'clouds': weatherIcon = '<i class="fas fa-cloud"></i>'; break;
            case 'rain': weatherIcon = '<i class="fas fa-cloud-rain"></i>'; break;
            case 'snow': weatherIcon = '<i class="far fa-snowflake"></i>'; break;
            default: weatherIcon = '<i class="fas fa-cloud-sun"></i>';
        }
        
        favoriteItem.innerHTML = `
            <div class="favorite-info">
                <p><strong>${weatherIcon} ${fav.city}</strong> - ${fav.track}</p>
                <p class="favorite-mood">${fav.mood} • ${fav.timestamp}</p>
            </div>
            <div class="favorite-actions">
                <button class="remove-favorite" data-id="${fav.id}">
                    <i class="fas fa-trash"></i>
                </button>
            </div>
        `;
        
        favoritesList.appendChild(favoriteItem);
    });
    
    // Tambahkan event listener untuk tombol hapus
    document.querySelectorAll('.remove-favorite').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const id = parseInt(e.currentTarget.getAttribute('data-id'));
            removeFavorite(id);
        });
    });
}

function removeFavorite(id) {
    currentState.favorites = currentState.favorites.filter(fav => fav.id !== id);
    localStorage.setItem('soundmood_favorites', JSON.stringify(currentState.favorites));
    updateFavoritesList();
}