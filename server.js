const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Songs directory
const SONGS_DIR = path.join(__dirname, 'songs');

// Supported audio formats
const AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.wav', '.m4a'];

// API endpoint to get music based on weather
app.post('/get-music', (req, res) => {
    const { weather, temperature } = req.body;
    
    if (!weather || temperature === undefined) {
        return res.status(400).json({
            success: false,
            message: 'Weather and temperature parameters are required'
        });
    }

    try {
        const weatherType = getWeatherType(weather, temperature);
        const songs = getAllSongsForWeather(weatherType);
        
        if (songs.length > 0) {
            const shuffledSongs = shuffleArray(songs);
            
            return res.json({
                success: true,
                weatherType: weatherType,
                songs: shuffledSongs,
                message: `Found ${shuffledSongs.length} songs for ${weatherType} weather`
            });
        } else {
            return res.status(404).json({
                success: false,
                message: `No songs found for ${weatherType} weather condition`
            });
        }
    } catch (error) {
        console.error('Server error:', error);
        return res.status(500).json({
            success: false,
            message: 'Internal server error'
        });
    }
});

// Serve song files
app.use('/songs', express.static(SONGS_DIR));

// Helper functions
function getWeatherType(weather, temperature) {
    weather = weather.toLowerCase();
    
    if (weather.includes('rain') || weather.includes('drizzle')) {
        return 'rainy';
    } else if (weather.includes('snow') || temperature < 0) {
        return 'snowy';
    } else if (weather.includes('thunder') || weather.includes('storm')) {
        return 'stormy';
    } else if (weather.includes('cloud')) {
        return 'cloudy';
    } else if (weather.includes('clear') || temperature > 25) {
        return 'sunny';
    } else if (temperature < 10) {
        return 'cold';
    } else {
        return 'neutral';
    }
}

function getAllSongsForWeather(weatherType) {
    const weatherDir = path.join(SONGS_DIR, weatherType);
    
    if (!fs.existsSync(weatherDir)) {
        return [];
    }
    
    try {
        return fs.readdirSync(weatherDir)
            .filter(file => AUDIO_EXTENSIONS.includes(path.extname(file).toLowerCase()))
            .map(file => ({
                name: path.basename(file, path.extname(file)).replace(/_/g, ' '),
                path: `/songs/${weatherType}/${file}`
            }));
    } catch (error) {
        console.error(`Error reading ${weatherType} songs:`, error);
        return [];
    }
}

function shuffleArray(array) {
    const newArray = [...array];
    for (let i = newArray.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
    }
    return newArray;
}

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
    console.log(`Serving songs from: ${SONGS_DIR}`);
});