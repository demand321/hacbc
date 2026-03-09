export type ThemeId = "garage" | "route66" | "chrome" | "midnight" | "thunder" | "desert";

export interface Theme {
  id: ThemeId;
  name: string;
  description: string;
}

export const themes: Theme[] = [
  {
    id: "garage",
    name: "Garage",
    description: "Mørk & rå - verksted og V8",
  },
  {
    id: "route66",
    name: "Route 66",
    description: "Retro Americana - nostalgi og cruising",
  },
  {
    id: "chrome",
    name: "Chrome",
    description: "Premium & polert - bilshow og utstilling",
  },
  {
    id: "midnight",
    name: "Midnight Cruise",
    description: "Neon & asfalt - nattkjøring i byen",
  },
  {
    id: "thunder",
    name: "Thunder",
    description: "Elektrisk blå - kraft og fart",
  },
  {
    id: "desert",
    name: "Desert Run",
    description: "Støv & solnedgang - ørkenveien",
  },
];
