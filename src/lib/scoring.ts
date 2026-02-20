import { HourlyForecast, SpotConfig } from "./types";

/**
 * Compute an angular difference between two compass bearings, result in [0, 180].
 */
function angleDiff(a: number, b: number): number {
  let d = Math.abs(a - b) % 360;
  if (d > 180) d = 360 - d;
  return d;
}

/**
 * Check if an angle falls within a range (handles wrap-around at 360).
 */
function angleInRange(angle: number, min: number, max: number): boolean {
  const a = ((angle % 360) + 360) % 360;
  const lo = ((min % 360) + 360) % 360;
  const hi = ((max % 360) + 360) % 360;
  if (lo <= hi) return a >= lo && a <= hi;
  return a >= lo || a <= hi; // wraps around 0/360
}

/**
 * Score a swell direction for a spot. Returns 0-1.
 * Perfect match = 1, outside ideal range degrades smoothly.
 */
function scoreSwellDirection(swellDir: number, spot: SpotConfig): number {
  if (angleInRange(swellDir, spot.idealSwellDir[0], spot.idealSwellDir[1])) return 1;
  const midIdeal = (spot.idealSwellDir[0] + spot.idealSwellDir[1]) / 2;
  const diff = angleDiff(swellDir, midIdeal);
  const halfRange = angleDiff(spot.idealSwellDir[0], spot.idealSwellDir[1]) / 2;
  const excess = diff - halfRange;
  return Math.max(0, 1 - excess / 90);
}

/**
 * Score wind quality. Offshore = best. Light wind always good.
 * Returns 0-1.
 */
function scoreWind(windSpeed: number, windDir: number, spot: SpotConfig): number {
  // Light wind is always good
  if (windSpeed < 5) return 1;

  // Check if offshore (wind blowing from land toward ocean)
  const isOffshore = angleInRange(windDir, spot.idealWindDir[0], spot.idealWindDir[1]);
  // Cross-shore check: within ~45° of perpendicular to shore
  const shoreNormal = (spot.facing + 180) % 360;
  const crossDiff = angleDiff(windDir, shoreNormal);
  const isCross = crossDiff > 45 && crossDiff < 135;

  let dirScore: number;
  if (isOffshore) dirScore = 1;
  else if (isCross) dirScore = 0.5;
  else dirScore = 0.1; // onshore

  // Strong wind penalty
  const speedPenalty = windSpeed > 25 ? 0.3 : windSpeed > 15 ? 0.7 : 1;

  return dirScore * speedPenalty;
}

/**
 * Score wave height for the spot. Returns 0-1.
 */
function scoreWaveHeight(height: number, spot: SpotConfig): number {
  const [min, max] = spot.idealWaveHeight;
  if (height >= min && height <= max) return 1;
  if (height < min) {
    if (height < 0.1) return 0;
    return height / min;
  }
  // Over max — degrades but still surfable
  const excess = height - max;
  return Math.max(0, 1 - excess / max);
}

/**
 * Score wave period. Longer period = better. Returns 0-1.
 */
function scorePeriod(period: number): number {
  if (period >= 14) return 1;
  if (period >= 10) return 0.8;
  if (period >= 7) return 0.5;
  if (period >= 4) return 0.2;
  return 0;
}

/**
 * Score tide state for a spot. Returns 0-1.
 * Matches spot's ideal tide preference.
 */
function scoreTide(hour: HourlyForecast, spot: SpotConfig): number {
  if (hour.tideState === null || spot.idealTide === "any") return 0.5; // neutral when unknown
  if (hour.tideState === spot.idealTide) return 1;
  // Adjacent tide state is ok
  const adjacent: Record<string, string[]> = {
    low: ["mid"],
    mid: ["low", "high"],
    high: ["mid"],
  };
  if (adjacent[spot.idealTide]?.includes(hour.tideState)) return 0.5;
  return 0.15;
}

/**
 * Overall quality score for an hour at a specific spot.
 * Returns 1-5 rating.
 */
export function scoreHour(hour: HourlyForecast, spot: SpotConfig): number {
  const swellDir = scoreSwellDirection(hour.swellDirection, spot);
  const wind = scoreWind(hour.windSpeed, hour.windDirection, spot);
  const waveH = scoreWaveHeight(hour.swellHeight || hour.waveHeight, spot);
  const period = scorePeriod(hour.swellPeriod || hour.wavePeriod);
  const tide = scoreTide(hour, spot);

  const hasTide = hour.tideState !== null;

  // Weighted average — redistribute weight when tide data available
  const raw = hasTide
    ? swellDir * 0.2 + wind * 0.25 + waveH * 0.25 + period * 0.15 + tide * 0.15
    : swellDir * 0.25 + wind * 0.3 + waveH * 0.3 + period * 0.15;

  // Map 0-1 to 1-5
  return Math.round((1 + raw * 4) * 10) / 10;
}

/**
 * Get a human-readable label for a rating.
 */
export function ratingLabel(rating: number): string {
  if (rating >= 4.2) return "Epic";
  if (rating >= 3.5) return "Firing";
  if (rating >= 2.8) return "Fun";
  if (rating >= 2.0) return "Fair";
  if (rating >= 1.3) return "Poor";
  return "Flat";
}

/**
 * Get a color class for a rating.
 */
export function ratingColor(rating: number): string {
  if (rating >= 4.2) return "text-fuchsia-400";
  if (rating >= 3.5) return "text-green-400";
  if (rating >= 2.8) return "text-sky-400";
  if (rating >= 2.0) return "text-amber-400";
  if (rating >= 1.3) return "text-orange-400";
  return "text-neutral-500";
}

export function ratingBg(rating: number): string {
  if (rating >= 4.2) return "bg-fuchsia-400/15";
  if (rating >= 3.5) return "bg-green-400/15";
  if (rating >= 2.8) return "bg-sky-400/15";
  if (rating >= 2.0) return "bg-amber-400/15";
  if (rating >= 1.3) return "bg-orange-400/15";
  return "bg-neutral-500/15";
}

/**
 * Get compass direction label from degrees.
 */
export function compassDir(deg: number): string {
  const dirs = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];
  const idx = Math.round(deg / 22.5) % 16;
  return dirs[idx];
}

/**
 * Format wave height in feet (surfers prefer feet).
 */
export function metersToFeet(m: number): string {
  return (m * 3.28084).toFixed(1);
}
