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

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<ThemeId>("garage");

  useEffect(() => {
    const saved = localStorage.getItem("hacbc-theme") as ThemeId | null;
    if (saved && ["garage", "route66", "chrome"].includes(saved)) {
      setTheme(saved);
    }
  }, []);

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
