export interface SpotConfig {
  name: string;
  slug: string;
  description: string;
  lat: number;
  lng: number;
  skillLevel: "beginner" | "intermediate" | "advanced";
  facing: number; // degrees, direction the beach faces (toward ocean)
  idealSwellDir: [number, number]; // min, max degrees
  idealWindDir: [number, number]; // offshore wind direction range
  idealTide: "low" | "mid" | "high" | "any";
  idealWaveHeight: [number, number]; // min, max in meters
  bottomType: string;
  waveType: string;
}

export interface HourlyForecast {
  time: string;
  waveHeight: number; // meters
  wavePeriod: number; // seconds
  waveDirection: number; // degrees
  swellHeight: number; // meters
  swellPeriod: number; // seconds
  swellDirection: number; // degrees
  windSpeed: number; // km/h
  windDirection: number; // degrees
  windGusts: number; // km/h
  temperature: number; // celsius
}

export interface DailyForecast {
  date: string;
  sunrise: string;
  sunset: string;
  uvIndexMax: number;
  hours: HourlyForecast[];
  bestHour: HourlyForecast | null;
  avgRating: number;
}

export interface SpotForecast {
  spot: SpotConfig;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  currentConditions: HourlyForecast | null;
  currentRating: number;
}
