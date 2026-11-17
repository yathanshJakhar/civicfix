import type { Category } from "./types";

export const MODEL_TO_CATEGORY: Record<string, Category> = {
  "Potholes and RoadCracks": "Pothole",
  "Garbage": "Garbage",
  "DamagedElectricalPoles": "Streetlight",
  "IllegalParking": "Traffic",
  "DamagedRoadSigns": "Traffic",
  "FallenTrees": "Other",
  "Graffitti": "Other",
  "DeadAnimalsPollution": "Other",
  "Damaged concrete structures": "Other",
};


export const prettyLabel = (s: string) => s.replace(/([a-z])([A-Z])/g, "$1 $2");