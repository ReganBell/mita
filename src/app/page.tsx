import { fetchAllForecasts } from "@/lib/api";
import SpotCard from "@/components/SpotCard";

export const dynamic = "force-dynamic";
export const revalidate = 3600;

export default async function Home() {
  const forecasts = await fetchAllForecasts();

  // Sort by current rating descending
  const sorted = [...forecasts].sort(
    (a, b) => b.currentRating - a.currentRating
  );

  const now = new Date();
  const timeStr = now.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
    timeZone: "America/Mexico_City",
  });

  return (
    <main className="min-h-screen max-w-lg mx-auto px-4 py-8">
      <header className="mb-8">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
          Mita
        </h1>
        <p className="text-sm text-neutral-500 mt-1">
          Punta Mita surf forecast &middot; Updated {timeStr} CST
        </p>
      </header>

      <div className="space-y-4">
        {sorted.map((forecast) => (
          <SpotCard key={forecast.spot.slug} forecast={forecast} />
        ))}
      </div>

      <footer className="mt-12 pt-6 border-t border-neutral-800 text-center text-xs text-neutral-600">
        <p>
          Wave and weather data from{" "}
          <a
            href="https://open-meteo.com/"
            className="underline hover:text-neutral-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            Open-Meteo
          </a>
          . Conditions are approximate — always check locally before paddling out.
        </p>
        <p className="mt-2">
          Inspired by{" "}
          <a
            href="https://dialed.surf"
            className="underline hover:text-neutral-400"
            target="_blank"
            rel="noopener noreferrer"
          >
            Dialed
          </a>
        </p>
      </footer>
    </main>
  );
}
