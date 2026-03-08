export type ThemeId = "garage" | "route66" | "chrome";

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
];
