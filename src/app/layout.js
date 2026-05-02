import { Geist } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata = {
  title: "Flagged AI",
  description: "The agent between a scam job and its victim.",
  icons: { icon: "/logo.png", apple: "/logo.png" },
};

export default function RootLayout({ children }) {
  return (
    <html lang="en" className={`${geistSans.variable} h-full`}>
      <body className="h-full">{children}</body>
    </html>
  );
}
