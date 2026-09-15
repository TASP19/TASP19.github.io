// Weather Dashboard Script
// Using OpenWeatherMap API (free tier)

const API_KEY = 'e8def7f1d1e9456e7d1f8e8e8e8e8e8'; // Free API key - replace with your own
const API_BASE = 'https://api.openweathermap.org/data/2.5';

// DOM Elements
const cityInput = document.getElementById('cityInput');
const searchBtn = document.getElementById('searchBtn');
const locationBtn = document.getElementById('locationBtn');
const currentWeatherDiv = document.getElementById('currentWeather');
const forecastDiv = document.getElementById('forecast');
const errorMessage = document.getElementById('errorMessage');

// Event Listeners
searchBtn.addEventListener('click', () => searchWeather());
cityInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchWeather();
});
locationBtn.addEventListener('click', getLocationWeather);

// Main search function
async function searchWeather() {
    const city = cityInput.value.trim();
    if (!city) {
        showError('Please enter a city name');
        return;
    }

    try {
        const weatherData = await fetchWeatherData(city);
        displayCurrentWeather(weatherData);
        await fetchForecast(weatherData.coord.lat, weatherData.coord.lon);
        hideError();
    } catch (error) {
        showError(error.message);
    }
}

// Get weather using geolocation
async function getLocationWeather() {
    if (!navigator.geolocation) {
        showError('Geolocation is not supported by your browser');
        return;
    }

    locationBtn.disabled = true;
    locationBtn.textContent = '📍 Getting location...';

    navigator.geolocation.getCurrentPosition(
        async (position) => {
            try {
                const { latitude, longitude } = position.coords;
                const weatherData = await fetchWeatherByCoords(latitude, longitude);
                displayCurrentWeather(weatherData);
                await fetchForecast(latitude, longitude);
                hideError();
            } catch (error) {
                showError(error.message);
            } finally {
                locationBtn.disabled = false;
                locationBtn.textContent = '📍 Use My Location';
            }
        },
        (error) => {
            showError('Unable to access your location');
            locationBtn.disabled = false;
            locationBtn.textContent = '📍 Use My Location';
        }
    );
}

// Fetch weather data by city name
async function fetchWeatherData(city) {
    const response = await fetch(
        `${API_BASE}/weather?q=${encodeURIComponent(city)}&appid=${API_KEY}&units=metric`
    );

    if (!response.ok) {
        if (response.status === 404) {
            throw new Error('City not found');
        }
        throw new Error('Failed to fetch weather data');
    }

    return await response.json();
}

// Fetch weather data by coordinates
async function fetchWeatherByCoords(lat, lon) {
    const response = await fetch(
        `${API_BASE}/weather?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch weather data');
    }

    return await response.json();
}

// Fetch 5-day forecast
async function fetchForecast(lat, lon) {
    const response = await fetch(
        `${API_BASE}/forecast?lat=${lat}&lon=${lon}&appid=${API_KEY}&units=metric`
    );

    if (!response.ok) {
        throw new Error('Failed to fetch forecast data');
    }

    const data = await response.json();
    displayForecast(data.list);
}

// Display current weather
function displayCurrentWeather(data) {
    const { name, sys, main, weather, wind, clouds } = data;

    const weatherIcon = getWeatherEmoji(weather[0].main);
    const feelsLike = main.feels_like;
    const humidity = main.humidity;
    const windSpeed = wind.speed;
    const pressure = main.pressure;
    const cloudiness = clouds.all;

    const html = `
        <div class="weather-header">
            <div class="location-info">
                <h2>${name}, ${sys.country}</h2>
                <p>${new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
        </div>

        <div class="weather-main">
            <div class="weather-icon">${weatherIcon}</div>
            <div class="temperature-section">
                <div class="temperature">${Math.round(main.temp)}°C</div>
                <div class="weather-description">${weather[0].description}</div>
            </div>
        </div>

        <div class="weather-details">
            <div class="detail">
                <span class="detail-label">Feels Like</span>
                <span class="detail-value">${Math.round(feelsLike)}°C</span>
            </div>
            <div class="detail">
                <span class="detail-label">Humidity</span>
                <span class="detail-value">${humidity}%</span>
            </div>
            <div class="detail">
                <span class="detail-label">Wind Speed</span>
                <span class="detail-value">${windSpeed} m/s</span>
            </div>
            <div class="detail">
                <span class="detail-label">Pressure</span>
                <span class="detail-value">${pressure} hPa</span>
            </div>
            <div class="detail">
                <span class="detail-label">Cloudiness</span>
                <span class="detail-value">${cloudiness}%</span>
            </div>
            <div class="detail">
                <span class="detail-label">UV Index</span>
                <span class="detail-value">-</span>
            </div>
        </div>
    `;

    currentWeatherDiv.innerHTML = html;
}

// Display 5-day forecast
function displayForecast(forecastList) {
    // Get one forecast per day (every 8 entries, as API returns every 3 hours)
    const dailyForecasts = [];
    const seenDates = new Set();

    forecastList.forEach(forecast => {
        const date = new Date(forecast.dt * 1000).toLocaleDateString();
        
        if (!seenDates.has(date) && dailyForecasts.length < 5) {
            seenDates.add(date);
            dailyForecasts.push(forecast);
        }
    });

    const html = dailyForecasts.map(forecast => {
        const date = new Date(forecast.dt * 1000);
        const icon = getWeatherEmoji(forecast.weather[0].main);
        const maxTemp = Math.round(forecast.main.temp_max);
        const minTemp = Math.round(forecast.main.temp_min);
        const description = forecast.weather[0].description;

        return `
            <div class="forecast-card">
                <div class="forecast-date">${date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</div>
                <div class="forecast-icon">${icon}</div>
                <div class="forecast-temp">${maxTemp}°C</div>
                <div class="forecast-temp-range">Low: ${minTemp}°C</div>
                <div class="forecast-description">${description}</div>
            </div>
        `;
    }).join('');

    forecastDiv.innerHTML = html;
}

// Get emoji for weather condition
function getWeatherEmoji(weatherMain) {
    const emojiMap = {
        'Clear': '☀️',
        'Clouds': '☁️',
        'Drizzle': '🌦️',
        'Rain': '🌧️',
        'Thunderstorm': '⛈️',
        'Snow': '❄️',
        'Mist': '🌫️',
        'Smoke': '💨',
        'Haze': '🌫️',
        'Dust': '🌪️',
        'Fog': '🌫️',
        'Sand': '🌪️',
        'Ash': '🌋',
        'Squall': '💨',
        'Tornado': '🌪️'
    };

    return emojiMap[weatherMain] || '🌤️';
}

// Error handling
function showError(message) {
    errorMessage.textContent = message;
    errorMessage.classList.add('show');
}

function hideError() {
    errorMessage.classList.remove('show');
}

// Load default weather on page load
window.addEventListener('load', () => {
    // Load weather for a default city
    cityInput.value = 'London';
    searchWeather();
});
