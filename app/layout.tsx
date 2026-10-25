import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono, Fredoka, Caveat_Brush } from "next/font/google";
import { Toaster } from "sonner";
import { BRAND } from "@/lib/brand";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

// Cozy display font (titles, numbers). One weight only: 600.
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
  weight: "600",
});

// Stickers only ("Day done!"). Never for UI text.
const caveatBrush = Caveat_Brush({
  variable: "--font-caveat-brush",
  subsets: ["latin"],
  weight: "400",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// Toasts sit above the docked add bar + tab bar so they never cover the page title (about 9.5rem on a phone).
const TOAST_BOTTOM = "calc(env(safe-area-inset-bottom) + 9.5rem)";

export const metadata: Metadata = {
  title: "VibraFlow",
  description: "VibraFlow — a personal planner for tasks, calendar, and goals.",
  manifest: "/manifest.webmanifest",
  // iOS home-screen app: full screen, light status bar text on paper.
  appleWebApp: { capable: true, title: BRAND.name, statusBarStyle: "default" },
};

// viewportFit "cover" lets the app draw under the notch; the shell pads with env(safe-area-inset-*).
// No maximumScale / userScalable: pinch zoom stays available (accessibility).
export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: BRAND.paper,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${fredoka.variable} ${caveatBrush.variable} ${geistMono.variable} h-full bg-paper antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-paper text-ink">
        {children}
        <Toaster
          position="bottom-center"
          offset={{ bottom: TOAST_BOTTOM, left: 16, right: 16 }}
          mobileOffset={{ bottom: TOAST_BOTTOM, left: 16, right: 16 }}
          toastOptions={{
            unstyled: true,
            classNames: {
              toast:
                "line bg-grain flex w-full max-w-column items-center gap-3 rounded-card border-ink bg-surface px-4 py-3 text-body text-ink shadow-lift font-sans",
              title: "font-semibold",
              description: "text-caption text-ink-soft",
              success: "bg-surface",
              error: "border-danger text-danger",
              actionButton: "line press rounded-btn border-ink bg-accent px-3 py-2 text-on-accent",
              cancelButton: "line press rounded-btn border-ink bg-surface px-3 py-2 text-ink",
            },
          }}
        />
      </body>
    </html>
  );
}