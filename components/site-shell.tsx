import Link from "next/link";
import type { ReactNode } from "react";

function Mark() {
  return (
    <svg viewBox="0 0 27 27" aria-hidden="true">
      <rect x="1" y="1" width="7" height="7" fill="currentColor" />
      <rect x="10" y="1" width="7" height="7" fill="none" stroke="currentColor" />
      <rect x="19" y="1" width="7" height="7" fill="none" stroke="currentColor" />
      <rect x="1" y="10" width="7" height="7" fill="none" stroke="currentColor" />
      <rect x="10" y="10" width="7" height="7" fill="currentColor" />
      <rect x="19" y="10" width="7" height="7" fill="none" stroke="currentColor" />
      <rect x="1" y="19" width="7" height="7" fill="none" stroke="currentColor" />
      <rect x="10" y="19" width="7" height="7" fill="none" stroke="currentColor" />
      <rect x="19" y="19" width="7" height="7" fill="currentColor" />
    </svg>
  );
}

export function SiteShell({ children }: { children: ReactNode }) {
  return (
    <>
      <div className="synthetic-banner" role="status">PROTOTYPE · SYNTHETIC VALUES · DO NOT CITE</div>
      <header className="site-header">
        <div className="header-inner">
          <Link className="brand" href="/"><Mark /> AXArena</Link>
          <nav className="main-nav" aria-label="Primary navigation">
            <Link href="/database/">Database</Link>
            <Link href="/methodology/">Methodology</Link>
            <Link href="/data/">Data</Link>
            <span className="header-badge">DATABASE v1</span>
          </nav>
        </div>
      </header>
      {children}
      <div className="watermark" aria-hidden="true">SYNTHETIC · DO NOT CITE</div>
      <footer className="site-footer">
        <div className="frame footer-grid">
          <div>AXArena measures whether agents can operate software, verified by live-state read-back.</div>
          <nav className="footer-links" aria-label="Research links">
            <Link href="/reproduce/">Reproduce</Link>
            <Link href="/independence/">Independence</Link>
            <Link href="/changelog/">Changelog</Link>
          </nav>
        </div>
      </footer>
    </>
  );
}
