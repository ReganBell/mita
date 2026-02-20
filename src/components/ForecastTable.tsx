"use client";

import { useState } from "react";
import { DailyForecast, SpotConfig } from "@/lib/types";
import {
  scoreHour,
  ratingColor,
  ratingBg,
  compassDir,
  metersToFeet,
  ratingLabel,
} from "@/lib/scoring";

export default function ForecastTable({
  daily,
  spot,
}: {
  daily: DailyForecast[];
  spot: SpotConfig;
}) {
  const [expandedDay, setExpandedDay] = useState<string | null>(
    daily[0]?.date ?? null
  );

  return (
    <div className="space-y-3">
      {daily.map((day) => {
        const isExpanded = expandedDay === day.date;
        const dateObj = new Date(day.date + "T12:00:00");
        const dayName = dateObj.toLocaleDateString("en-US", {
          weekday: "long",
        });
        const dateStr = dateObj.toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        });

        return (
          <div
            key={day.date}
            className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden"
          >
            <button
              onClick={() => setExpandedDay(isExpanded ? null : day.date)}
              className="w-full flex items-center justify-between p-4 hover:bg-neutral-800/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center font-bold text-sm ${ratingBg(day.avgRating)} ${ratingColor(day.avgRating)}`}
                >
                  {day.avgRating.toFixed(1)}
                </div>
                <div className="text-left">
                  <div className="text-neutral-200 font-medium text-sm">
                    {dayName}
                  </div>
                  <div className="text-neutral-500 text-xs">{dateStr}</div>
                </div>
              </div>
              <div className="flex items-center gap-4 text-sm">
                {day.bestHour && (
                  <div className="text-right">
                    <div className="text-neutral-400 text-xs">Best</div>
                    <div className="text-neutral-200 text-xs">
                      {new Date(day.bestHour.time).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        hour12: true,
                      })}
                      {" — "}
                      {metersToFeet(day.bestHour.swellHeight || day.bestHour.waveHeight)}ft @{" "}
                      {(day.bestHour.swellPeriod || day.bestHour.wavePeriod).toFixed(0)}s
                    </div>
                  </div>
                )}
                <svg
                  className={`w-4 h-4 text-neutral-500 transition-transform ${isExpanded ? "rotate-180" : ""}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 9l-7 7-7-7"
                  />
                </svg>
              </div>
            </button>

            {isExpanded && (
              <div className="border-t border-neutral-800">
                {/* Column headers */}
                <div className="grid grid-cols-[3.5rem_1fr_1fr_1fr_2.5rem] gap-2 px-4 py-2 text-[10px] text-neutral-500 uppercase tracking-wider border-b border-neutral-800/50">
                  <div>Time</div>
                  <div>Waves</div>
                  <div>Swell</div>
                  <div>Wind</div>
                  <div className="text-right">Rtg</div>
                </div>

                {/* Show daylight hours (5am - 9pm) */}
                {day.hours
                  .filter((h) => {
                    const hr = new Date(h.time).getHours();
                    return hr >= 5 && hr <= 21;
                  })
                  .map((h) => {
                    const rating = scoreHour(h, spot);
                    const timeStr = new Date(h.time).toLocaleTimeString(
                      "en-US",
                      { hour: "numeric", hour12: true }
                    );

                    return (
                      <div
                        key={h.time}
                        className={`grid grid-cols-[3.5rem_1fr_1fr_1fr_2.5rem] gap-2 px-4 py-2 text-xs border-b border-neutral-800/30 ${ratingBg(rating)}`}
                      >
                        <div className="text-neutral-400 font-medium">
                          {timeStr}
                        </div>
                        <div>
                          <span className="text-neutral-200">
                            {metersToFeet(h.waveHeight)}ft
                          </span>{" "}
                          <span className="text-neutral-500">
                            {h.wavePeriod.toFixed(0)}s{" "}
                            {compassDir(h.waveDirection)}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-200">
                            {metersToFeet(h.swellHeight)}ft
                          </span>{" "}
                          <span className="text-neutral-500">
                            {h.swellPeriod.toFixed(0)}s{" "}
                            {compassDir(h.swellDirection)}
                          </span>
                        </div>
                        <div>
                          <span className="text-neutral-200">
                            {h.windSpeed.toFixed(0)}
                          </span>{" "}
                          <span className="text-neutral-500">
                            {compassDir(h.windDirection)}
                            {h.windGusts > h.windSpeed + 5 &&
                              ` G${h.windGusts.toFixed(0)}`}
                          </span>
                        </div>
                        <div
                          className={`text-right font-bold ${ratingColor(rating)}`}
                        >
                          {rating.toFixed(1)}
                        </div>
                      </div>
                    );
                  })}

                {/* Sunrise/Sunset footer */}
                {day.sunrise && (
                  <div className="px-4 py-2 text-[10px] text-neutral-600 flex gap-4">
                    <span>
                      Sunrise{" "}
                      {new Date(day.sunrise).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                    <span>
                      Sunset{" "}
                      {new Date(day.sunset).toLocaleTimeString("en-US", {
                        hour: "numeric",
                        minute: "2-digit",
                        hour12: true,
                      })}
                    </span>
                    <span>UV {day.uvIndexMax.toFixed(0)}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
