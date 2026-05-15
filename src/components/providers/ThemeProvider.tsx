"use client";

import { createContext, useContext, useEffect, useState } from "react";
import type { ThemeId } from "@/lib/themes";

type ThemeContextType = {
  theme: ThemeId;
  setTheme: (theme: ThemeId) => void;
};

const ThemeContext = createContext<ThemeContextType>({
  theme: "garage",
  setTheme: () => {},
});

const VALID_THEMES: ThemeId[] = ["garage", "route66", "chrome", "midnight", "thunder", "desert"];

function readStoredTheme(): ThemeId {
  if (typeof window === "undefined") return "garage";
  const saved = localStorage.getItem("hacbc-theme") as ThemeId | null;
  return saved && VALID_THEMES.includes(saved) ? saved : "garage";
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeId>(readStoredTheme);

  useEffect(() => {
    localStorage.setItem("hacbc-theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
