import type { Metadata } from "next";
import { Inter, Oswald, Righteous, Montserrat, Teko, Rajdhani, Bebas_Neue } from "next/font/google";
import "./globals.css";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/layout/Footer";
import { SessionProvider } from "@/components/providers/SessionProvider";
import { ThemeProvider } from "@/components/providers/ThemeProvider";

const inter = Inter({
  variable: "--font-sans",
  subsets: ["latin"],
});

const oswald = Oswald({
  variable: "--font-heading",
  subsets: ["latin"],
});

const righteous = Righteous({
  variable: "--font-heading-retro",
  weight: "400",
  subsets: ["latin"],
});

const montserrat = Montserrat({
  variable: "--font-heading-chrome",
  subsets: ["latin"],
});

const teko = Teko({
  variable: "--font-heading-midnight",
  subsets: ["latin"],
});

const rajdhani = Rajdhani({
  variable: "--font-heading-thunder",
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
});

const bebasNeue = Bebas_Neue({
  variable: "--font-heading-desert",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "HACBC - Hamar American Car & Bike Club",
    template: "%s | HACBC",
  },
  description:
    "Hamar American Car & Bike Club - For entusiaster av amerikanske biler og motorsykler i Hamar-regionen.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="no" className="dark" data-theme="garage" suppressHydrationWarning>
      <body
        className={`${inter.variable} ${oswald.variable} ${righteous.variable} ${montserrat.variable} ${teko.variable} ${rajdhani.variable} ${bebasNeue.variable} font-sans antialiased`}
      >
        <SessionProvider>
          <ThemeProvider>
            <div className="flex min-h-screen flex-col">
              <Navbar />
              <main className="flex-1">{children}</main>
              <Footer />
            </div>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
