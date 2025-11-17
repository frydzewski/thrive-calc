import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Navigation from "./components/Navigation";
import SessionProvider from "./components/SessionProvider";
import { getSession } from "./lib/auth";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ThriveCalc - Financial Planning & Retirement",
  description: "Plan your financial future with confidence. Retirement planning, savings goals, and investment tracking.",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await getSession();

  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <SessionProvider session={session}>
          <Navigation />
          <main className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
            {children}
          </main>
        </SessionProvider>
      </body>
    </html>
  );
}
