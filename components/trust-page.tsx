import Link from "next/link";
import type { ReactNode } from "react";

export function TrustPage({ eyebrow, title, deck, markdownHref, children }: { eyebrow: string; title: string; deck: string; markdownHref: string; children: ReactNode }) {
  return <main className="article"><article className="narrow"><p className="eyebrow">{eyebrow}</p><h1>{title}</h1><p className="detail-deck">{deck}</p><p><Link className="back-link" href={markdownHref}>Plain Markdown ↗</Link></p>{children}</article></main>;
}
