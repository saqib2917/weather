// DOM Elements
const body = document.body;
const settingsBtn = document.getElementById('settingsBtn');
const closeSettings = document.getElementById('closeSettings');
const settingsPanel = document.getElementById('settingsPanel');
const settingsOverlay = document.getElementById('settingsOverlay');
const locationBtn = document.getElementById('locationBtn');
const searchBtn = document.getElementById('searchBtn');
const searchInput = document.getElementById('searchInput');
const unitSelect = document.getElementById('unitSelect');
const darkModeToggle = document.getElementById('darkModeToggle');
const animatedBgToggle = document.getElementById('animatedBgToggle');
const locationAccessToggle = document.getElementById('locationAccessToggle');
const notificationsToggle = document.getElementById('notificationsToggle');
const saveSettingsBtn = document.getElementById('saveSettings');
const weatherViz = document.getElementById('weatherViz');
const sun = document.getElementById('sun');
const moon = document.getElementById('moon');
const stars = document.getElementById('stars');
const rainContainer = document.getElementById('rainContainer');
const lightningContainer = document.getElementById('lightningContainer');
const forecastContainer = document.getElementById('forecastContainer');

// Weather data elements
const locationName = document.getElementById('locationName');
const currentDate = document.getElementById('currentDate');
const weatherIcon = document.getElementById('weatherIcon');
const weatherDescription = document.getElementById('weatherDescription');
const temperature = document.getElementById('temperature');
const windSpeed = document.getElementById('windSpeed');
const humidity = document.getElementById('humidity');
const pressure = document.getElementById('pressure');
const visibility = document.getElementById('visibility');
const sunrise = document.getElementById('sunrise');
const sunset = document.getElementById('sunset');
const solarNoon = document.getElementById('solarNoon');
const daylight = document.getElementById('daylight');

// App state
let currentWeather = 'sunny';
let isDaytime = true;
let isCelsius = true;
let userSettings = {};
let currentLocation = {
    name: "Barcelona",
    country: "Spain",
    latitude: 41.3888,
    longitude: 2.159
};

// Initialize the app
function init() {
    // Load saved settings
    loadSettings();
    
    // Set up event listeners
    setupEventListeners();
    
    // Generate stars and clouds
    generateStars();
    generateClouds();
    
    // Get initial weather data
    getWeatherData();
    
    // Update time
    updateDateTime();
    setInterval(updateDateTime, 60000);
}

// Set up event listeners
function setupEventListeners() {
    settingsBtn.addEventListener('click', openSettings);
    closeSettings.addEventListener('click', closeSettingsPanel);
    settingsOverlay.addEventListener('click', closeSettingsPanel);
    locationBtn.addEventListener('click', getLocation);
    searchBtn.addEventListener('click', handleSearch);
    searchInput.addEventListener('keyup', (e) => {
        if (e.key === 'Enter') handleSearch();
    });
    
    // Settings changes
    saveSettingsBtn.addEventListener('click', saveSettings);
}

// Load settings from localStorage
function loadSettings() {
    const savedSettings = localStorage.getItem('weatherSettings');
    if (savedSettings) {
        userSettings = JSON.parse(savedSettings);
        
        // Apply settings
        if (userSettings.unit) {
            isCelsius = userSettings.unit === 'celsius';
            unitSelect.value = userSettings.unit;
        }
        
        if (userSettings.darkMode !== undefined) {
            darkModeToggle.checked = userSettings.darkMode;
            if (userSettings.darkMode) {
                body.classList.add('dark-mode');
            }
        }
        
        if (userSettings.animatedBg !== undefined) {
            animatedBgToggle.checked = userSettings.animatedBg;
            weatherViz.style.display = userSettings.animatedBg ? 'block' : 'none';
        }
        
        if (userSettings.locationAccess !== undefined) {
            locationAccessToggle.checked = userSettings.locationAccess;
        }
        
        if (userSettings.notifications !== undefined) {
            notificationsToggle.checked = userSettings.notifications;
        }
    }
}

// Save settings to localStorage
function saveSettings() {
    userSettings = {
        unit: unitSelect.value,
        darkMode: darkModeToggle.checked,
        animatedBg: animatedBgToggle.checked,
        locationAccess: locationAccessToggle.checked,
        notifications: notificationsToggle.checked
    };
    
    localStorage.setItem('weatherSettings', JSON.stringify(userSettings));
    
    // Apply settings
    isCelsius = userSettings.unit === 'celsius';
    if (userSettings.darkMode) {
        body.classList.add('dark-mode');
    } else {
        body.classList.remove('dark-mode');
    }
    weatherViz.style.display = userSettings.animatedBg ? 'block' : 'none';
    
    // Close settings panel
    closeSettingsPanel();
    
    // Refresh weather data to update units
    getWeatherData();
}

// Open settings panel
function openSettings() {
    settingsPanel.classList.add('open');
    settingsOverlay.classList.add('active');
    document.body.style.overflow = 'hidden';
}

// Close settings panel
function closeSettingsPanel() {
    settingsPanel.classList.remove('open');
    settingsOverlay.classList.remove('active');
    document.body.style.overflow = 'auto';
}

// Get user's location
function getLocation() {
    if (navigator.geolocation) {
        locationName.innerHTML = '<span class="loading"></span> Detecting location...';
        
        navigator.geolocation.getCurrentPosition(
            async (position) => {
                const latitude = position.coords.latitude;
                const longitude = position.coords.longitude;
                
                // Get location name from coordinates
                try {
                    const response = await fetch(`https://geocoding-api.open-meteo.com/v1/reverse?latitude=${latitude}&longitude=${longitude}`);
                    const data = await response.json();
                    
                    if (data.results && data.results.length > 0) {
                        currentLocation = {
                            name: data.results[0].name,
                            country: data.results[0].country,
                            latitude: latitude,
                            longitude: longitude
                        };
                        
                        locationName.textContent = `${currentLocation.name}, ${currentLocation.country}`;
                    } else {
                        locationName.textContent = "Current Location";
                    }
                } catch (error) {
                    console.error('Error getting location name:', error);
                    locationName.textContent = "Current Location";
                }
                
                // Get weather data for current location
                getWeatherData();
            },
            (error) => {
                console.error('Error getting location:', error);
                locationName.textContent = "Barcelona, Spain";
                alert('Unable to get your location. Please ensure location services are enabled.');
            }
        );
    } else {
        alert('Geolocation is not supported by your browser.');
    }
}

// Handle search
function handleSearch() {
    const query = searchInput.value.trim();
    if (query) {
        locationName.innerHTML = '<span class="loading"></span> Searching...';
        searchLocation(query);
    }
}

// Search for a location
async function searchLocation(query) {
    try {
        const response = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query)}`);
        const data = await response.json();
        
        if (data.results && data.results.length > 0) {
            const result = data.results[0];
            currentLocation = {
                name: result.name,
                country: result.country,
                latitude: result.latitude,
                longitude: result.longitude
            };
            
            locationName.textContent = `${currentLocation.name}, ${currentLocation.country}`;
            searchInput.value = '';
            
            // Get weather data for the searched location
            getWeatherData();
        } else {
            locationName.textContent = "Barcelona, Spain";
            alert('Location not found. Please try another search.');
        }
    } catch (error) {
        console.error('Error searching location:', error);
        locationName.textContent = "Barcelona, Spain";
        alert('Error searching for location. Please try again.');
    }
}

// Get weather data from Open-Meteo API
async function getWeatherData() {
    locationName.innerHTML = `<span class="loading"></span> Loading weather for ${currentLocation.name}...`;
    
    try {
        // Fetch current weather
        const weatherResponse = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${currentLocation.latitude}&longitude=${currentLocation.longitude}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,rain,showers,snowfall,weather_code,cloud_cover,pressure_msl,surface_pressure,wind_speed_10m,wind_direction_10m,wind_gusts_10m&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset,daylight_duration,sunshine_duration,precipitation_sum,rain_sum,showers_sum,snowfall_sum,precipitation_hours&timezone=auto`);
        const weatherData = await weatherResponse.json();
        
        // Update UI with weather data
        updateWeatherUI(weatherData);
    } catch (error) {
        console.error('Error fetching weather data:', error);
        locationName.textContent = `${currentLocation.name}, ${currentLocation.country}`;
        alert('Error fetching weather data. Please try again.');
    }
}

// Update UI with weather data
function updateWeatherUI(data) {
    if (!data || !data.current) {
        alert('Unable to fetch weather data. Please try again.');
        return;
    }
    
    const current = data.current;
    const daily = data.daily;
    
    // Update location name
    locationName.textContent = `${currentLocation.name}, ${currentLocation.country}`;
    
    // Update temperature
    const temp = isCelsius ? 
        `${Math.round(current.temperature_2m)}°C` : 
        `${Math.round(current.temperature_2m * 9/5 + 32)}°F`;
    temperature.textContent = temp;
    
    // Update weather condition
    const weatherCode = current.weather_code;
    updateWeatherCondition(weatherCode, current.is_day);
    
    // Update weather details
    windSpeed.textContent = isCelsius ? 
        `${current.wind_speed_10m} km/h` : 
        `${(current.wind_speed_10m * 0.621371).toFixed(1)} mph`;
    humidity.textContent = `${current.relative_humidity_2m}%`;
    pressure.textContent = `${current.pressure_msl} hPa`;
    visibility.textContent = `${(current.visibility || 10)} km`; // Fallback if not available
    
    // Update sun and moon data
    if (daily && daily.sunrise && daily.sunrise.length > 0) {
        sunrise.textContent = formatTime(daily.sunrise[0]);
        sunset.textContent = formatTime(daily.sunset[0]);
        
        // Calculate solar noon and daylight duration
        const sunriseTime = new Date(daily.sunrise[0]);
        const sunsetTime = new Date(daily.sunset[0]);
        
        const solarNoonTime = new Date(sunriseTime.getTime() + (sunsetTime - sunriseTime) / 2);
        solarNoon.textContent = formatTime(solarNoonTime.toISOString());
        
        const daylightMinutes = Math.round((sunsetTime - sunriseTime) / (1000 * 60));
        const daylightHours = Math.floor(daylightMinutes / 60);
        const daylightMins = daylightMinutes % 60;
        daylight.textContent = `${daylightHours}h ${daylightMins}m`;
    }
    
    // Update forecast
    updateForecast(daily);
    
    // Update time of day and background
    isDaytime = current.is_day === 1;
    checkTimeOfDay();
    
    // Update weather visualization
    updateWeatherVisualization();
}

// Update weather condition based on weather code
function updateWeatherCondition(weatherCode, isDay) {
    // Weather code mapping based on WMO codes
    const weatherCodes = {
        0: { day: { icon: 'fa-sun', description: 'Clear sky' }, night: { icon: 'fa-moon', description: 'Clear sky' } },
        1: { day: { icon: 'fa-cloud-sun', description: 'Mainly clear' }, night: { icon: 'fa-cloud-moon', description: 'Mainly clear' } },
        2: { day: { icon: 'fa-cloud', description: 'Partly cloudy' }, night: { icon: 'fa-cloud', description: 'Partly cloudy' } },
        3: { day: { icon: 'fa-cloud', description: 'Overcast' }, night: { icon: 'fa-cloud', description: 'Overcast' } },
        45: { day: { icon: 'fa-smog', description: 'Fog' }, night: { icon: 'fa-smog', description: 'Fog' } },
        48: { day: { icon: 'fa-smog', description: 'Depositing rime fog' }, night: { icon: 'fa-smog', description: 'Depositing rime fog' } },
        51: { day: { icon: 'fa-cloud-rain', description: 'Light drizzle' }, night: { icon: 'fa-cloud-rain', description: 'Light drizzle' } },
        53: { day: { icon: 'fa-cloud-rain', description: 'Moderate drizzle' }, night: { icon: 'fa-cloud-rain', description: 'Moderate drizzle' } },
        55: { day: { icon: 'fa-cloud-rain', description: 'Dense drizzle' }, night: { icon: 'fa-cloud-rain', description: 'Dense drizzle' } },
        61: { day: { icon: 'fa-cloud-showers-heavy', description: 'Slight rain' }, night: { icon: 'fa-cloud-showers-heavy', description: 'Slight rain' } },
        63: { day: { icon: 'fa-cloud-showers-heavy', description: 'Moderate rain' }, night: { icon: 'fa-cloud-showers-heavy', description: 'Moderate rain' } },
        65: { day: { icon: 'fa-cloud-showers-heavy', description: 'Heavy rain' }, night: { icon: 'fa-cloud-showers-heavy', description: 'Heavy rain' } },
        80: { day: { icon: 'fa-cloud-rain', description: 'Slight rain showers' }, night: { icon: 'fa-cloud-rain', description: 'Slight rain showers' } },
        81: { day: { icon: 'fa-cloud-rain', description: 'Moderate rain showers' }, night: { icon: 'fa-cloud-rain', description: 'Moderate rain showers' } },
        82: { day: { icon: 'fa-cloud-rain', description: 'Violent rain showers' }, night: { icon: 'fa-cloud-rain', description: 'Violent rain showers' } },
        95: { day: { icon: 'fa-bolt', description: 'Thunderstorm' }, night: { icon: 'fa-bolt', description: 'Thunderstorm' } },
        96: { day: { icon: 'fa-bolt', description: 'Thunderstorm with slight hail' }, night: { icon: 'fa-bolt', description: 'Thunderstorm with slight hail' } },
        99: { day: { icon: 'fa-bolt', description: 'Thunderstorm with heavy hail' }, night: { icon: 'fa-bolt', description: 'Thunderstorm with heavy hail' } }
    };
    
    // Default to code 0 if code not found
    const codeData = weatherCodes[weatherCode] || weatherCodes[0];
    const timeOfDay = isDay === 1 ? 'day' : 'night';
    
    // Update weather icon and description
    weatherIcon.className = `fas ${codeData[timeOfDay].icon} weather-icon`;
    weatherDescription.textContent = codeData[timeOfDay].description;
    
    // Set current weather for visualization
    if (weatherCode >= 95) {
        currentWeather = 'thunder';
    } else if (weatherCode >= 61 || weatherCode >= 80) {
        currentWeather = 'rain';
    } else if (weatherCode >= 3) {
        currentWeather = 'cloudy';
    } else {
        currentWeather = 'sunny';
    }
}

// Update forecast data
function updateForecast(dailyData) {
    if (!dailyData || !dailyData.time) return;
    
    // Clear previous forecast
    forecastContainer.innerHTML = '';
    
    // Create forecast items for the next 7 days
    for (let i = 0; i < 7; i++) {
        if (!dailyData.time[i]) continue;
        
        const forecastItem = document.createElement('div');
        forecastItem.className = 'forecast-item';
        
        const date = new Date(dailyData.time[i]);
        const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
        
        const weatherCode = dailyData.weather_code[i];
        const isDay = 1; // Assume day for forecast icons
        const codeData = getWeatherIcon(weatherCode, isDay);
        
        const maxTemp = isCelsius ? 
            `${Math.round(dailyData.temperature_2m_max[i])}°C` : 
            `${Math.round(dailyData.temperature_2m_max[i] * 9/5 + 32)}°F`;
        
        forecastItem.innerHTML = `
            <div class="forecast-day">${i === 0 ? 'Today' : dayName}</div>
            <i class="fas ${codeData.icon} forecast-icon"></i>
            <div class="forecast-temp">${maxTemp}</div>
        `;
        
        forecastContainer.appendChild(forecastItem);
    }
}

// Get weather icon based on code and time of day
function getWeatherIcon(weatherCode, isDay) {
    const weatherCodes = {
        0: { day: { icon: 'fa-sun' }, night: { icon: 'fa-moon' } },
        1: { day: { icon: 'fa-cloud-sun' }, night: { icon: 'fa-cloud-moon' } },
        2: { day: { icon: 'fa-cloud' }, night: { icon: 'fa-cloud' } },
        3: { day: { icon: 'fa-cloud' }, night: { icon: 'fa-cloud' } },
        45: { day: { icon: 'fa-smog' }, night: { icon: 'fa-smog' } },
        48: { day: { icon: 'fa-smog' }, night: { icon: 'fa-smog' } },
        51: { day: { icon: 'fa-cloud-rain' }, night: { icon: 'fa-cloud-rain' } },
        53: { day: { icon: 'fa-cloud-rain' }, night: { icon: 'fa-cloud-rain' } },
        55: { day: { icon: 'fa-cloud-rain' }, night: { icon: 'fa-cloud-rain' } },
        61: { day: { icon: 'fa-cloud-showers-heavy' }, night: { icon: 'fa-cloud-showers-heavy' } },
        63: { day: { icon: 'fa-cloud-showers-heavy' }, night: { icon: 'fa-cloud-showers-heavy' } },
        65: { day: { icon: 'fa-cloud-showers-heavy' }, night: { icon: 'fa-cloud-showers-heavy' } },
        80: { day: { icon: 'fa-cloud-rain' }, night: { icon: 'fa-cloud-rain' } },
        81: { day: { icon: 'fa-cloud-rain' }, night: { icon: 'fa-cloud-rain' } },
        82: { day: { icon: 'fa-cloud-rain' }, night: { icon: 'fa-cloud-rain' } },
        95: { day: { icon: 'fa-bolt' }, night: { icon: 'fa-bolt' } },
        96: { day: { icon: 'fa-bolt' }, night: { icon: 'fa-bolt' } },
        99: { day: { icon: 'fa-bolt' }, night: { icon: 'fa-bolt' } }
    };
    
    const codeData = weatherCodes[weatherCode] || weatherCodes[0];
    const timeOfDay = isDay === 1 ? 'day' : 'night';
    
    return codeData[timeOfDay];
}

// Format time string
function formatTime(timeString) {
    const date = new Date(timeString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
}

// Update time and date
function updateDateTime() {
    const now = new Date();
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const timeString = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    const dateString = now.toLocaleDateString('en-US', options);
    
    currentDate.textContent = `${dateString} • ${timeString}`;
}

// Check if it's day or night and update background accordingly
function checkTimeOfDay() {
    if (isDaytime) {
        body.classList.remove('night');
        body.classList.add('day');
        sun.style.opacity = '1';
        moon.style.opacity = '0';
        stars.style.opacity = '0';
    } else {
        body.classList.remove('day');
        body.classList.add('night');
        sun.style.opacity = '0';
        moon.style.opacity = '1';
        stars.style.opacity = '1';
    }
}

// Update weather visualization based on current conditions
function updateWeatherVisualization() {
    // Clear previous weather effects
    clearWeatherEffects();
    
    // Add effects based on current weather
    switch(currentWeather) {
        case 'rain':
            body.classList.add('rain');
            createRainEffect();
            break;
        case 'thunder':
            body.classList.add('thunder');
            createRainEffect();
            createLightningEffect();
            break;
        case 'cloudy':
            body.classList.add('cloudy');
            break;
        default:
            body.classList.remove('rain', 'thunder', 'cloudy');
    }
}

// Clear weather effects
function clearWeatherEffects() {
    const rainDrops = document.querySelectorAll('.rain-drop');
    const lightnings = document.querySelectorAll('.lightning');
    
    rainDrops.forEach(drop => drop.remove());
    lightnings.forEach(lightning => lightning.remove());
}

// Generate stars for night sky
function generateStars() {
    for (let i = 0; i < 100; i++) {
        const star = document.createElement('div');
        star.classList.add('star');
        
        // Random position
        const x = Math.random() * 100;
        const y = Math.random() * 100;
        
        // Random size
        const size = Math.random() * 3;
        
        star.style.left = `${x}%`;
        star.style.top = `${y}%`;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;
        
        // Random twinkle animation
        star.style.animation = `twinkle ${2 + Math.random() * 5}s infinite`;
        
        stars.appendChild(star);
    }
}

// Generate clouds
function generateClouds() {
    const cloud1 = document.getElementById('cloud1');
    const cloud2 = document.getElementById('cloud2');
    const cloud3 = document.getElementById('cloud3');
    
    // Cloud 1
    cloud1.style.width = '80px';
    cloud1.style.height = '30px';
    cloud1.style.top = '20%';
    cloud1.style.left = '20%';
    cloud1.style.animation = 'float 20s infinite linear';
    
    // Cloud 2
    cloud2.style.width = '60px';
    cloud2.style.height = '25px';
    cloud2.style.top = '30%';
    cloud2.style.left = '60%';
    cloud2.style.animation = 'float 25s infinite linear';
    
    // Cloud 3
    cloud3.style.width = '70px';
    cloud3.style.height = '28px';
    cloud3.style.top = '25%';
    cloud3.style.left = '40%';
    cloud3.style.animation = 'float 30s infinite linear';
}

// Create rain effect
function createRainEffect() {
    for (let i = 0; i < 50; i++) {
        const drop = document.createElement('div');
        drop.classList.add('rain-drop');
        
        // Random position
        const x = Math.random() * 100;
        
        drop.style.left = `${x}%`;
        drop.style.animation = `rain ${0.5 + Math.random() * 0.5}s infinite linear`;
        drop.style.animationDelay = `${Math.random() * 2}s`;
        
        rainContainer.appendChild(drop);
    }
}

// Create lightning effect
function createLightningEffect() {
    for (let i = 0; i < 3; i++) {
        const lightning = document.createElement('div');
        lightning.classList.add('lightning');
        
        // Random position
        const x = 20 + Math.random() * 60;
        
        lightning.style.left = `${x}%`;
        lightning.style.top = `${10 + Math.random() * 30}%`;
        lightning.style.animation = `lightning ${5 + Math.random() * 10}s infinite`;
        
        lightningContainer.appendChild(lightning);
    }
}

// Initialize the app
init();