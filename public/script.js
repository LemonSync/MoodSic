document.addEventListener('DOMContentLoaded', function() {
    const weatherInfo = document.getElementById('weather-info');
    const musicPlayer = document.getElementById('music-player');
    const nowPlaying = document.getElementById('now-playing');
    const playerContainer = document.getElementById('player-container');
    
    // Create play button (new element)
    const playButton = document.createElement('button');
    playButton.textContent = 'Start Music';
    playButton.id = 'play-button';
    playerContainer.insertBefore(playButton, playerContainer.firstChild);
    
    // Create next button
    const nextButton = document.createElement('button');
    nextButton.textContent = 'Next Song';
    nextButton.id = 'next-button';
    nextButton.disabled = true;
    playerContainer.insertBefore(nextButton, playButton.nextSibling);
    
    // API Key OpenWeatherMap
    const API_KEY = '267cf21554b098b03a55b035485b7dc6';
    
    // Global state variables
    let currentWeatherType = '';
    let currentSongs = [];
    let currentSongIndex = 0;
    let userInteracted = false;
    
    // Event listeners
    playButton.addEventListener('click', initPlayer);
    nextButton.addEventListener('click', playNextSong);
    
    // Initialize player after user interaction
    function initPlayer() {
        userInteracted = true;
        playButton.disabled = true;
        nextButton.disabled = false;
        
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                fetchWeatherAndMusic,
                handleLocationError,
                { timeout: 10000 }
            );
        } else {
            showError('Geolocation is not supported by your browser.');
        }
    }
    
    async function fetchWeatherAndMusic(position) {
        const { latitude, longitude } = position.coords;
        
        try {
            const weatherData = await getWeatherData(latitude, longitude);
            displayWeatherInfo(weatherData);
            
            const musicResponse = await sendWeatherToBackend(weatherData);
            
            if (musicResponse?.success) {
                currentWeatherType = musicResponse.weatherType;
                currentSongs = musicResponse.songs;
                currentSongIndex = 0;
                
                playCurrentSong();
            } else {
                showError('Failed to load music. Please try again.');
            }
        } catch (error) {
            console.error('Error:', error);
            showError('Failed to get weather data. Please refresh and try again.');
        }
    }
    
    function handleLocationError(error) {
        console.error('Location error:', error);
        let message = 'Error getting location: ';
        
        switch(error.code) {
            case error.PERMISSION_DENIED:
                message += 'Location permission denied.';
                break;
            case error.POSITION_UNAVAILABLE:
                message += 'Location information unavailable.';
                break;
            case error.TIMEOUT:
                message += 'Location request timed out.';
                break;
            default:
                message += 'Unknown error occurred.';
        }
        
        showError(message);
    }
    
    async function getWeatherData(lat, lon) {
        const response = await fetch(
            `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
        );
        if (!response.ok) throw new Error('Weather API request failed');
        return await response.json();
    }
    
    function displayWeatherInfo(data) {
        const weather = data.weather[0];
        const main = data.main;
        
        weatherInfo.innerHTML = `
            <h3>Weather in ${data.name}</h3>
            <p><strong>Condition:</strong> ${weather.main} (${weather.description})</p>
            <p><strong>Temperature:</strong> ${main.temp}°C</p>
        `;
    }
    
    async function sendWeatherToBackend(weatherData) {
        try {
            const response = await fetch('/get-music', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    weather: weatherData.weather[0].main,
                    temperature: weatherData.main.temp
                })
            });
            if (!response.ok) throw new Error('Backend request failed');
            return await response.json();
        } catch (error) {
            console.error('Error sending to backend:', error);
            return null;
        }
    }
    
    function playCurrentSong() {
        if (currentSongs.length === 0) {
            showError('No songs available for current weather');
            return;
        }
        
        const song = currentSongs[currentSongIndex];
        musicPlayer.src = song.path;
        nowPlaying.textContent = `Now playing: ${song.name} (${currentWeatherType})`;
        
        // Only play if user has interacted
        if (userInteracted) {
            const playPromise = musicPlayer.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(e => {
                    console.error('Playback failed:', e);
                    showError('Failed to play music. Click Next Song to try another track.');
                });
            }
        }
    }
    
    function playNextSong() {
        if (currentSongs.length === 0) return;
        
        currentSongIndex = (currentSongIndex + 1) % currentSongs.length;
        playCurrentSong();
    }
    
    function showError(message) {
        weatherInfo.innerHTML = `<p class="error">${message}</p>`;
        playButton.disabled = false;
    }
    
    // Auto-play next song when current ends
    musicPlayer.addEventListener('ended', playNextSong);
    
    // Handle player errors
    musicPlayer.addEventListener('error', () => {
        showError('Error playing music. Trying next song...');
        setTimeout(playNextSong, 2000);
    });
});