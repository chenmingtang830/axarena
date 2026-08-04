import Link from "next/link";

export default function Home() {
  return <main className="article"><div className="frame"><p className="eyebrow">AXArena presentation sprint</p><h1>One benchmark.<br />Three visual arguments.</h1><p className="detail-deck">All directions share the same validated synthetic publication contract and interactions. Choose the editorial rhythm that best carries the evidence.</p>
    <div className="prototype-grid">
      <article className="prototype-card"><span className="eyebrow">A · 30-second read</span><h2>Verdict</h2><p>Large conclusion, agent switch, and ranked dot plot. Built for launch reach and instant comprehension.</p><Link className="button" href="/prototypes/verdict/">Open Verdict →</Link></article>
      <article className="prototype-card"><span className="eyebrow">B · Research authority</span><h2>Evidence Ledger</h2><p>Editorial grid, provenance stamps, and receipts placed beside every claim.</p><Link className="button" href="/prototypes/ledger/">Open Ledger →</Link></article>
      <article className="prototype-card"><span className="eyebrow">C · Product diagnosis</span><h2>Agent Journey</h2><p>Discovery → authentication → execution → verification makes friction legible.</p><Link className="button" href="/prototypes/journey/">Open Journey →</Link></article>
    </div>
    <p><Link className="back-link" href="/database/">Canonical Database route uses Verdict →</Link></p>
  </div></main>;
}
