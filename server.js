require('dotenv').config();
const express = require('express');
const path = require('path');
const fs = require('fs');
const cors = require('cors');
const axios = require('axios');

const app = express();
const PORT = process.env.PORT || 3000;

// Config
const OPENWEATHER_API_KEY = process.env.OPENWEATHER_API_KEY;
const SONGS_DIR = path.resolve(__dirname, 'songs');
const AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.wav', '.m4a'];

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// Static files with proper MIME types
app.use('/songs', express.static(SONGS_DIR, {
  setHeaders: (res, filePath) => {
    const ext = path.extname(filePath).toLowerCase();
    const types = {
      '.mp3': 'audio/mpeg',
      '.ogg': 'audio/ogg',
      '.wav': 'audio/wav',
      '.m4a': 'audio/mp4'
    };
    if (types[ext]) res.set('Content-Type', types[ext]);
  }
}));

// Weather and music endpoint
app.post('/get-weather-music', async (req, res) => {
  try {
    const { latitude, longitude, manualWeather, songType } = req.body;
    let weatherData;

    if (manualWeather) {
      weatherData = {
        weather: [{ main: manualWeather, description: 'Manual selection' }],
        main: { temp: 25, feels_like: 25 },
        name: 'Manual Location'
      };
    } else {
      const url = `https://api.openweathermap.org/data/2.5/weather?lat=${latitude}&lon=${longitude}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=id`;
      const response = await axios.get(url);
      weatherData = response.data;
    }

    const weatherType = determineWeatherType(weatherData);
    const songs = getSongsForWeather(weatherType);

    res.json({
      success: true,
      weatherData: {
        location: weatherData.name,
        condition: weatherData.weather[0].main,
        description: weatherData.weather[0].description,
        temperature: weatherData.main.temp,
        feelsLike: weatherData.main.feels_like,
        humidity: weatherData.main.humidity
      },
      songs: shuffleArray(songs),
      weatherType
    });

  } catch (error) {
    console.error('Server error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Failed to get weather data'
    });
  }
});

// Helper functions
function determineWeatherType(weatherData) {
  const weather = weatherData.weather[0].main.toLowerCase();
  const temp = weatherData.main.temp;

    if (weather.includes("tornado") || weather.includes("hurricane")) return "extreme";
    if (weather.includes("thunder") || weather.includes("lightning")) return "stormy";
    if (weather.includes("squall")) return "windy";
    if (weather.includes("rain") || weather.includes("drizzle") || weather.includes("shower")) return "rainy";
    if (weather.includes("snow") || weather.includes("flurry") || weather.includes("sleet")) return "snowy";
    if (weather.includes("hail")) return "hail";
    if (weather.includes("fog") || weather.includes("mist")) return "foggy";
    if (weather.includes("haze") || weather.includes("smoke")) return "hazy";
    if (weather.includes("dust") || weather.includes("sand")) return "dusty";
    if (weather.includes("ash")) return "ashy";
    if (weather.includes("cloud") || weather.includes("overcast")) return "cloudy";
    if (weather.includes("clear") || weather.includes("sun")) return "sunny";
    if (temp < 10) return "cold";
    if (temp > 30) return "hot";
    return "neutral";
}

function getSongsForWeather(weatherType) {
  const weatherDir = path.join(SONGS_DIR, weatherType);
  if (!fs.existsSync(weatherDir)) return [];

  return fs.readdirSync(weatherDir)
    .filter(file => AUDIO_EXTENSIONS.includes(path.extname(file).toLowerCase()))
    .map(file => ({
      name: path.basename(file, path.extname(file)).replace(/_/g, ' '),
      path: `/songs/${weatherType}/${encodeURIComponent(file)}`
    }));
}

function shuffleArray(array) {
  return [...array].sort(() => Math.random() - 0.5);
}

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
