import { TideData, TideExtreme, TidePoint, TideState, TideTrend } from "./types";

const STORMGLASS_API = "https://api.stormglass.io/v2/tide";

interface StormGlassExtreme {
  height: number;
  time: string;
  type: string;
}

interface StormGlassSeaLevel {
  sg: number;
  time: string;
}

/**
 * Fetch tide data from StormGlass API.
 * Returns null if no API key is configured (graceful degradation).
 */
export async function fetchTides(
  lat: number,
  lng: number,
  days: number = 7
): Promise<TideData | null> {
  const apiKey = process.env.STORMGLASS_API_KEY;
  if (!apiKey) return null;

  const now = new Date();
  const start = now.toISOString();
  const end = new Date(now.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

  try {
    const [extremesRes, seaLevelRes] = await Promise.all([
      fetch(
        `${STORMGLASS_API}/extremes/point?lat=${lat}&lng=${lng}&start=${start}&end=${end}`,
        {
          headers: { Authorization: apiKey },
          next: { revalidate: 3600 },
        }
      ),
      fetch(
        `${STORMGLASS_API}/sea-level/point?lat=${lat}&lng=${lng}&start=${start}&end=${end}`,
        {
          headers: { Authorization: apiKey },
          next: { revalidate: 3600 },
        }
      ),
    ]);

    if (!extremesRes.ok || !seaLevelRes.ok) {
      console.warn(`StormGlass API error: extremes=${extremesRes.status} sea-level=${seaLevelRes.status}`);
      return null;
    }

    const extremesJson = await extremesRes.json();
    const seaLevelJson = await seaLevelRes.json();

    const extremes: TideExtreme[] = (extremesJson.data ?? []).map(
      (e: StormGlassExtreme) => ({
        time: e.time,
        height: e.height,
        type: e.type === "high" ? "high" : "low",
      })
    );

    const hourly: TidePoint[] = (seaLevelJson.data ?? []).map(
      (p: StormGlassSeaLevel) => ({
        time: p.time,
        height: p.sg,
      })
    );

    return { extremes, hourly };
  } catch (err) {
    console.warn("Failed to fetch tide data:", err);
    return null;
  }
}

/**
 * Get the tide height at a specific time by interpolating hourly sea level data.
 */
export function getTideHeightAt(tides: TideData, time: string): number | null {
  const t = new Date(time).getTime();
  const points = tides.hourly;

  if (points.length === 0) return null;

  // Find surrounding points
  for (let i = 0; i < points.length - 1; i++) {
    const t0 = new Date(points[i].time).getTime();
    const t1 = new Date(points[i + 1].time).getTime();
    if (t >= t0 && t <= t1) {
      const ratio = (t - t0) / (t1 - t0);
      return points[i].height + ratio * (points[i + 1].height - points[i].height);
    }
  }

  // If outside range, return nearest
  const first = new Date(points[0].time).getTime();
  const last = new Date(points[points.length - 1].time).getTime();
  if (t <= first) return points[0].height;
  if (t >= last) return points[points.length - 1].height;

  return null;
}

/**
 * Determine tide state (low/mid/high) from height relative to the day's range.
 */
export function classifyTideState(
  height: number,
  tides: TideData,
  time: string
): TideState {
  const t = new Date(time).getTime();
  const dayStart = t - 12 * 60 * 60 * 1000;
  const dayEnd = t + 12 * 60 * 60 * 1000;

  // Find nearby extremes to establish range
  const nearby = tides.extremes.filter((e) => {
    const et = new Date(e.time).getTime();
    return et >= dayStart && et <= dayEnd;
  });

  if (nearby.length < 2) {
    // Fallback: use absolute height thresholds typical for Pacific Mexico
    if (height <= -0.2) return "low";
    if (height >= 0.5) return "high";
    return "mid";
  }

  const heights = nearby.map((e) => e.height);
  const min = Math.min(...heights);
  const max = Math.max(...heights);
  const range = max - min;

  if (range < 0.1) return "mid";

  const normalized = (height - min) / range;
  if (normalized <= 0.33) return "low";
  if (normalized >= 0.67) return "high";
  return "mid";
}

/**
 * Determine if tide is rising or falling at a given time.
 */
export function getTideTrend(tides: TideData, time: string): TideTrend {
  const t = new Date(time).getTime();

  // Find the two extremes bracketing this time
  const sorted = [...tides.extremes].sort(
    (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
  );

  for (let i = 0; i < sorted.length - 1; i++) {
    const t0 = new Date(sorted[i].time).getTime();
    const t1 = new Date(sorted[i + 1].time).getTime();
    if (t >= t0 && t <= t1) {
      // Near an extreme = slack
      const distFromExtreme = Math.min(t - t0, t1 - t);
      if (distFromExtreme < 30 * 60 * 1000) return "slack"; // within 30 min

      return sorted[i].type === "low" ? "rising" : "falling";
    }
  }

  // Before first extreme or after last
  if (sorted.length > 0) {
    const first = sorted[0];
    const firstT = new Date(first.time).getTime();
    if (t < firstT) return first.type === "high" ? "rising" : "falling";

    const last = sorted[sorted.length - 1];
    return last.type === "high" ? "falling" : "rising";
  }

  return "slack";
}

/**
 * Get extremes for a specific date.
 */
export function getExtremesForDate(tides: TideData, date: string): TideExtreme[] {
  return tides.extremes.filter((e) => e.time.startsWith(date));
}

/**
 * Format tide height for display.
 */
export function formatTideHeight(height: number): string {
  const sign = height >= 0 ? "+" : "";
  return `${sign}${height.toFixed(1)}m`;
}
