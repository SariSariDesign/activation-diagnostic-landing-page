import type { Metadata } from "next";
import { blueprint } from "@/content/activation-blueprint";
import "./globals.css";

export const metadata: Metadata = {
  title: blueprint.meta.title,
  description: blueprint.meta.description,
  openGraph: {
    type: "website",
    siteName: "Sari Sari Design",
    title: blueprint.meta.title,
    description: blueprint.meta.description,
  },
  twitter: {
    card: "summary_large_image",
    title: blueprint.meta.title,
    description: blueprint.meta.description,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
