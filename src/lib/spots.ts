import { SpotConfig } from "./types";

export const spots: SpotConfig[] = [
  {
    name: "El Anclote",
    slug: "el-anclote",
    description:
      "Gentle, rolling waves on the western tip of Punta de Mita. Sandy bottom, mellow, perfect for longboarding and beginners. The go-to when it's too big everywhere else.",
    lat: 20.774,
    lng: -105.536,
    skillLevel: "beginner",
    facing: 250, // WSW
    idealSwellDir: [180, 250], // S to WSW
    idealWindDir: [0, 90], // N to E (offshore)
    idealTide: "mid",
    idealWaveHeight: [0.3, 1.2],
    bottomType: "Sand",
    waveType: "Beach break, slow rollers",
  },
  {
    name: "La Lancha",
    slug: "la-lancha",
    description:
      "One of Mexico's most iconic surf spots. A pristine beach accessed through a mangrove forest with consistent waves in multiple swell directions. Two peaks — one mellow, one with more push.",
    lat: 20.755,
    lng: -105.505,
    skillLevel: "intermediate",
    facing: 260, // W
    idealSwellDir: [180, 280], // S to WNW — picks up wide window
    idealWindDir: [30, 120], // NE to ESE (offshore)
    idealTide: "low",
    idealWaveHeight: [0.5, 2.0],
    bottomType: "Sand & reef",
    waveType: "Reef break, right and left peaks",
  },
  {
    name: "Punta Burros",
    slug: "punta-burros",
    description:
      "The best wave in the area. A powerful reef break producing fast rights and occasional lefts. Handles size well and rewards experienced surfers. Access through a jungle trail.",
    lat: 20.743,
    lng: -105.487,
    skillLevel: "advanced",
    facing: 255, // WSW
    idealSwellDir: [180, 240], // S to SW
    idealWindDir: [20, 110], // NNE to ESE (offshore)
    idealTide: "low",
    idealWaveHeight: [0.8, 3.0],
    bottomType: "Reef",
    waveType: "Reef break, primarily rights",
  },
  {
    name: "El Faro",
    slug: "el-faro",
    description:
      "Sheltered reef near the lighthouse at the tip of the peninsula. Catches winter NW swells when they wrap around the point. Fun, walling rights on its day.",
    lat: 20.776,
    lng: -105.541,
    skillLevel: "intermediate",
    facing: 310, // NW
    idealSwellDir: [270, 340], // W to NNW
    idealWindDir: [90, 180], // E to S (offshore for NW-facing)
    idealTide: "mid",
    idealWaveHeight: [0.5, 1.8],
    bottomType: "Reef",
    waveType: "Reef break, rights",
  },
  {
    name: "Stinky's",
    slug: "stinkys",
    description:
      "Just south of El Anclote, named for the fish market nearby. A fun reef break that works on similar swells to Anclote but with more shape and push.",
    lat: 20.771,
    lng: -105.533,
    skillLevel: "intermediate",
    facing: 255, // WSW
    idealSwellDir: [190, 260], // S-SSW to WSW
    idealWindDir: [10, 100], // N to E (offshore)
    idealTide: "mid",
    idealWaveHeight: [0.5, 1.5],
    bottomType: "Reef",
    waveType: "Reef break, rights and lefts",
  },
];

export function getSpotBySlug(slug: string): SpotConfig | undefined {
  return spots.find((s) => s.slug === slug);
}
