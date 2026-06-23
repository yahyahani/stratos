const WMO_CODES: Record<number, string> = {
  0: 'Clear sky', 1: 'Mainly clear', 2: 'Partly cloudy', 3: 'Overcast',
  45: 'Fog', 48: 'Icy fog',
  51: 'Light drizzle', 53: 'Moderate drizzle', 55: 'Dense drizzle',
  61: 'Light rain', 63: 'Moderate rain', 65: 'Heavy rain',
  71: 'Light snow', 73: 'Moderate snow', 75: 'Heavy snow', 77: 'Snow grains',
  80: 'Light showers', 81: 'Moderate showers', 82: 'Heavy showers',
  85: 'Light snow showers', 86: 'Heavy snow showers',
  95: 'Thunderstorm', 96: 'Thunderstorm with hail', 99: 'Thunderstorm with heavy hail',
};

export interface WeatherData {
  location: string;
  temperature_c: number;
  windspeed_kmh: number;
  condition: string;
  time: string;
}

export async function getWeather(city: string): Promise<WeatherData> {
  const geoRes = await fetch(
    `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`
  );
  const geoData = await geoRes.json();

  if (!geoData.results?.length) {
    throw new Error(`City not found: "${city}". Try a different spelling.`);
  }

  const { latitude, longitude, name, country } = geoData.results[0];

  const weatherRes = await fetch(
    `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true&temperature_unit=celsius&windspeed_unit=kmh`
  );
  const weatherData = await weatherRes.json();

  const cw = weatherData.current_weather;

  return {
    location: `${name}, ${country}`,
    temperature_c: cw.temperature,
    windspeed_kmh: cw.windspeed,
    condition: WMO_CODES[cw.weathercode] ?? `Code ${cw.weathercode}`,
    time: cw.time,
  };
}
