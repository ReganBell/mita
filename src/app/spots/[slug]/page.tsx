import { notFound } from "next/navigation";
import Link from "next/link";
import { getSpotBySlug } from "@/lib/spots";
import { fetchSpotForecast } from "@/lib/api";
import {
  ratingLabel,
  ratingColor,
  ratingBg,
  compassDir,
  metersToFeet,
} from "@/lib/scoring";
import ForecastTable from "@/components/ForecastTable";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function SpotPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const spot = getSpotBySlug(slug);
  if (!spot) notFound();

  const forecast = await fetchSpotForecast(spot);
  const c = forecast.currentConditions;

  return (
    <main className="min-h-screen max-w-lg mx-auto px-4 py-8">
      <Link
        href="/"
        className="inline-flex items-center gap-1.5 text-sm text-neutral-500 hover:text-neutral-300 transition-colors mb-6"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
        </svg>
        All spots
      </Link>

      <header className="mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
              {spot.name}
            </h1>
            <p className="text-xs text-neutral-500 mt-1">
              {spot.skillLevel.charAt(0).toUpperCase() + spot.skillLevel.slice(1)}{" "}
              &middot; {spot.bottomType} &middot; {spot.waveType}
            </p>
          </div>
          <div
            className={`text-right px-3 py-1.5 rounded-lg ${ratingBg(forecast.currentRating)}`}
          >
            <div
              className={`text-2xl font-bold ${ratingColor(forecast.currentRating)}`}
            >
              {forecast.currentRating.toFixed(1)}
            </div>
            <div
              className={`text-xs font-medium ${ratingColor(forecast.currentRating)}`}
            >
              {ratingLabel(forecast.currentRating)}
            </div>
          </div>
        </div>
        <p className="text-sm text-neutral-400 mt-3 leading-relaxed">
          {spot.description}
        </p>
      </header>

      {/* Current conditions */}
      {c && (
        <section className="bg-neutral-900 border border-neutral-800 rounded-xl p-5 mb-6">
          <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
            Right now
          </h2>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <div className="text-neutral-500 text-xs">Waves</div>
              <div className="text-neutral-100 text-xl font-bold">
                {metersToFeet(c.waveHeight)}ft
              </div>
              <div className="text-neutral-500 text-xs">
                {c.wavePeriod.toFixed(0)}s from {compassDir(c.waveDirection)}
              </div>
            </div>
            <div>
              <div className="text-neutral-500 text-xs">Swell</div>
              <div className="text-neutral-100 text-xl font-bold">
                {metersToFeet(c.swellHeight)}ft
              </div>
              <div className="text-neutral-500 text-xs">
                {c.swellPeriod.toFixed(0)}s from {compassDir(c.swellDirection)}
              </div>
            </div>
            <div>
              <div className="text-neutral-500 text-xs">Wind</div>
              <div className="text-neutral-100 text-xl font-bold">
                {c.windSpeed.toFixed(0)} km/h
              </div>
              <div className="text-neutral-500 text-xs">
                from {compassDir(c.windDirection)}
                {c.windGusts > c.windSpeed + 5 &&
                  ` — gusts ${c.windGusts.toFixed(0)}`}
              </div>
            </div>
            <div>
              <div className="text-neutral-500 text-xs">Temperature</div>
              <div className="text-neutral-100 text-xl font-bold">
                {c.temperature.toFixed(0)}&deg;C
              </div>
              <div className="text-neutral-500 text-xs">
                {((c.temperature * 9) / 5 + 32).toFixed(0)}&deg;F
              </div>
            </div>
          </div>

          {/* Ideal conditions note */}
          <div className="mt-4 pt-3 border-t border-neutral-800">
            <div className="text-[10px] text-neutral-600 uppercase tracking-wider mb-1">
              This spot is best with
            </div>
            <div className="text-xs text-neutral-500">
              {compassDir(spot.idealSwellDir[0])}–{compassDir(spot.idealSwellDir[1])} swell
              &middot; {spot.idealTide} tide &middot;{" "}
              {spot.idealWaveHeight[0].toFixed(1)}–{metersToFeet(spot.idealWaveHeight[1])}ft
              &middot; Light or offshore wind
            </div>
          </div>
        </section>
      )}

      {/* 7-day forecast */}
      <section>
        <h2 className="text-xs font-medium text-neutral-500 uppercase tracking-wider mb-3">
          7-day forecast
        </h2>
        <ForecastTable daily={forecast.daily} spot={spot} />
      </section>

      <footer className="mt-12 pt-6 border-t border-neutral-800 text-center text-xs text-neutral-600">
        <p>
          Data from{" "}
          <a
            href="https://open-meteo.com/"
            className="underline hover:text-neutral-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open-Meteo
          </a>
          . Conditions are approximate.
        </p>
      </footer>
    </main>
  );
}
