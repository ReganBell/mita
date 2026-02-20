import { HourlyForecast, DailyForecast, SpotConfig, SpotForecast } from "./types";
import { scoreHour } from "./scoring";

const MARINE_API = "https://marine-api.open-meteo.com/v1/marine";
const WEATHER_API = "https://api.open-meteo.com/v1/forecast";

interface MarineResponse {
  hourly: {
    time: string[];
    wave_height: number[];
    wave_period: number[];
    wave_direction: number[];
    swell_wave_height: number[];
    swell_wave_period: number[];
    swell_wave_direction: number[];
  };
}

interface WeatherResponse {
  hourly: {
    time: string[];
    temperature_2m: number[];
    wind_speed_10m: number[];
    wind_direction_10m: number[];
    wind_gusts_10m: number[];
  };
  daily: {
    time: string[];
    sunrise: string[];
    sunset: string[];
    uv_index_max: number[];
  };
}

async function fetchMarine(lat: number, lng: number): Promise<MarineResponse> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly:
      "wave_height,wave_period,wave_direction,swell_wave_height,swell_wave_period,swell_wave_direction",
    timezone: "America/Mexico_City",
    forecast_days: "7",
  });
  const res = await fetch(`${MARINE_API}?${params}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Marine API error: ${res.status}`);
  return res.json();
}

async function fetchWeather(lat: number, lng: number): Promise<WeatherResponse> {
  const params = new URLSearchParams({
    latitude: lat.toString(),
    longitude: lng.toString(),
    hourly: "temperature_2m,wind_speed_10m,wind_direction_10m,wind_gusts_10m",
    daily: "sunrise,sunset,uv_index_max",
    timezone: "America/Mexico_City",
    forecast_days: "7",
  });
  const res = await fetch(`${WEATHER_API}?${params}`, { next: { revalidate: 3600 } });
  if (!res.ok) throw new Error(`Weather API error: ${res.status}`);
  return res.json();
}

function mergeForecasts(marine: MarineResponse, weather: WeatherResponse): HourlyForecast[] {
  const hourly: HourlyForecast[] = [];
  const marineTimeSet = new Set(marine.hourly.time);

  for (let i = 0; i < weather.hourly.time.length; i++) {
    const time = weather.hourly.time[i];
    const mi = marine.hourly.time.indexOf(time);
    if (mi === -1 || !marineTimeSet.has(time)) continue;

    hourly.push({
      time,
      waveHeight: marine.hourly.wave_height[mi] ?? 0,
      wavePeriod: marine.hourly.wave_period[mi] ?? 0,
      waveDirection: marine.hourly.wave_direction[mi] ?? 0,
      swellHeight: marine.hourly.swell_wave_height[mi] ?? 0,
      swellPeriod: marine.hourly.swell_wave_period[mi] ?? 0,
      swellDirection: marine.hourly.swell_wave_direction[mi] ?? 0,
      windSpeed: weather.hourly.wind_speed_10m[i] ?? 0,
      windDirection: weather.hourly.wind_direction_10m[i] ?? 0,
      windGusts: weather.hourly.wind_gusts_10m[i] ?? 0,
      temperature: weather.hourly.temperature_2m[i] ?? 0,
    });
  }

  return hourly;
}

function groupByDay(
  hourly: HourlyForecast[],
  weather: WeatherResponse,
  spot: SpotConfig
): DailyForecast[] {
  const dayMap = new Map<string, HourlyForecast[]>();

  for (const h of hourly) {
    const date = h.time.split("T")[0];
    if (!dayMap.has(date)) dayMap.set(date, []);
    dayMap.get(date)!.push(h);
  }

  const days: DailyForecast[] = [];
  for (const [date, hours] of dayMap) {
    const di = weather.daily.time.indexOf(date);
    const ratings = hours.map((h) => scoreHour(h, spot));
    const avgRating = ratings.reduce((a, b) => a + b, 0) / ratings.length;
    const bestIdx = ratings.indexOf(Math.max(...ratings));

    days.push({
      date,
      sunrise: di >= 0 ? weather.daily.sunrise[di] : "",
      sunset: di >= 0 ? weather.daily.sunset[di] : "",
      uvIndexMax: di >= 0 ? weather.daily.uv_index_max[di] : 0,
      hours,
      bestHour: hours[bestIdx] ?? null,
      avgRating,
    });
  }

  return days;
}

function findCurrentHour(hourly: HourlyForecast[]): HourlyForecast | null {
  const now = new Date();
  let closest: HourlyForecast | null = null;
  let minDiff = Infinity;

  for (const h of hourly) {
    const diff = Math.abs(new Date(h.time).getTime() - now.getTime());
    if (diff < minDiff) {
      minDiff = diff;
      closest = h;
    }
  }
  return closest;
}

export async function fetchSpotForecast(spot: SpotConfig): Promise<SpotForecast> {
  const [marine, weather] = await Promise.all([
    fetchMarine(spot.lat, spot.lng),
    fetchWeather(spot.lat, spot.lng),
  ]);

  const hourly = mergeForecasts(marine, weather);
  const daily = groupByDay(hourly, weather, spot);
  const currentConditions = findCurrentHour(hourly);
  const currentRating = currentConditions ? scoreHour(currentConditions, spot) : 0;

  return { spot, hourly, daily, currentConditions, currentRating };
}

export async function fetchAllForecasts(): Promise<SpotForecast[]> {
  const { spots } = await import("./spots");
  return Promise.all(spots.map(fetchSpotForecast));
}
