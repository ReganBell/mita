import Link from "next/link";
import { SpotForecast } from "@/lib/types";
import {
  ratingLabel,
  ratingColor,
  ratingBg,
  compassDir,
  metersToFeet,
} from "@/lib/scoring";

export default function SpotCard({ forecast }: { forecast: SpotForecast }) {
  const { spot, currentConditions, currentRating, daily } = forecast;
  const c = currentConditions;

  return (
    <Link
      href={`/spots/${spot.slug}`}
      className="block bg-neutral-900 border border-neutral-800 rounded-xl p-5 hover:border-neutral-600 transition-colors"
    >
      <div className="flex items-start justify-between mb-3">
        <div>
          <h2 className="text-lg font-semibold text-neutral-100">{spot.name}</h2>
          <p className="text-xs text-neutral-500 mt-0.5">
            {spot.skillLevel.charAt(0).toUpperCase() + spot.skillLevel.slice(1)} &middot;{" "}
            {spot.bottomType} &middot; {spot.waveType}
          </p>
        </div>
        <div
          className={`text-right px-3 py-1.5 rounded-lg ${ratingBg(currentRating)}`}
        >
          <div className={`text-xl font-bold ${ratingColor(currentRating)}`}>
            {currentRating.toFixed(1)}
          </div>
          <div className={`text-xs font-medium ${ratingColor(currentRating)}`}>
            {ratingLabel(currentRating)}
          </div>
        </div>
      </div>

      {c && (
        <div className={`grid ${c.tideState !== null ? "grid-cols-4" : "grid-cols-3"} gap-3 text-sm mb-4`}>
          <div>
            <div className="text-neutral-500 text-xs">Waves</div>
            <div className="text-neutral-200 font-medium">
              {metersToFeet(c.waveHeight)}ft
            </div>
            <div className="text-neutral-500 text-xs">
              {c.wavePeriod.toFixed(0)}s {compassDir(c.waveDirection)}
            </div>
          </div>
          <div>
            <div className="text-neutral-500 text-xs">Swell</div>
            <div className="text-neutral-200 font-medium">
              {metersToFeet(c.swellHeight)}ft
            </div>
            <div className="text-neutral-500 text-xs">
              {c.swellPeriod.toFixed(0)}s {compassDir(c.swellDirection)}
            </div>
          </div>
          <div>
            <div className="text-neutral-500 text-xs">Wind</div>
            <div className="text-neutral-200 font-medium">
              {c.windSpeed.toFixed(0)} km/h
            </div>
            <div className="text-neutral-500 text-xs">
              {compassDir(c.windDirection)}
              {c.windGusts > c.windSpeed + 5 &&
                ` G${c.windGusts.toFixed(0)}`}
            </div>
          </div>
          {c.tideState !== null && (
            <div>
              <div className="text-neutral-500 text-xs">Tide</div>
              <div className="text-neutral-200 font-medium capitalize">
                {c.tideState}
              </div>
              <div className="text-neutral-500 text-xs capitalize">
                {c.tideTrend}
              </div>
            </div>
          )}
        </div>
      )}

      <div className="flex gap-1.5">
        {daily.slice(0, 7).map((d) => {
          const dayLabel = new Date(d.date + "T12:00:00").toLocaleDateString(
            "en-US",
            { weekday: "short" }
          );
          return (
            <div
              key={d.date}
              className={`flex-1 text-center py-1.5 rounded-md ${ratingBg(d.avgRating)}`}
            >
              <div className="text-[10px] text-neutral-500">{dayLabel}</div>
              <div
                className={`text-xs font-semibold ${ratingColor(d.avgRating)}`}
              >
                {d.avgRating.toFixed(1)}
              </div>
            </div>
          );
        })}
      </div>
    </Link>
  );
}
