import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "clean. — Your words. Nothing extra.",
  description: "Instant plain-text cleaning. Remove formatting and common invisible characters, review punctuation, and copy your words. Everything stays in your browser.",
  icons: { icon: "/icon.svg" },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
