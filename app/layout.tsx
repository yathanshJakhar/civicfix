import type { Metadata, Viewport } from "next";
import { Barlow, Barlow_Semi_Condensed, JetBrains_Mono } from "next/font/google";
import AccountBar from "@/components/AccountBar";
import BottomNav from "@/components/BottomNav";
import { AuthProvider } from "@/lib/auth";
import "leaflet/dist/leaflet.css";
import "./globals.css";

const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

const barlowCondensed = Barlow_Semi_Condensed({
  variable: "--font-barlow-sc",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: "CivicFix — Report civic issues in Delhi NCR",
  description: "Report potholes, garbage, broken streetlights and more in Delhi NCR.",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#eee3ca",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${barlow.variable} ${barlowCondensed.variable} ${jetbrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans">
        <AuthProvider>
          <div className="mx-auto min-h-dvh w-full max-w-lg manila sm:border-x sm:border-line-strong sm:shadow-[0_6px_28px_-10px_rgb(92_66_28/0.45)]">
            <AccountBar />
            <main className="pb-24">{children}</main>
          </div>
          <BottomNav />
        </AuthProvider>
      </body>
    </html>
  );
}
