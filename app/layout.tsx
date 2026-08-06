import type { Metadata } from "next";
import { SiteShell } from "@/components/site-shell";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "AXArena — Agent Experience Benchmark", template: "%s · AXArena" },
  description: "Evidence-first evaluation of how AI agents operate software through API and CLI surfaces.",
  robots: { index: false, follow: false, nocache: true },
  metadataBase: new URL("https://axarena.dev"),
  openGraph: { title: "AXArena", description: "Can AI agents actually operate your product?", type: "website" },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><SiteShell>{children}</SiteShell></body></html>;
}
