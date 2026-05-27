import type { ReactNode } from "react";

type PageShellProps = {
  eyebrow: string;
  title: string;
  intro: string;
  children: ReactNode;
};

export default function PageShell({ eyebrow, title, intro, children }: PageShellProps) {
  return (
    <main className="page-shell">
      <div className="wirefield" aria-hidden="true">
        <span className="wire-triangle wire-triangle-a" />
        <span className="wire-triangle wire-triangle-b" />
        <span className="wire-triangle wire-triangle-c" />
        <span className="wire-triangle wire-triangle-d" />
      </div>
      <div className="backdrop-grid" />
      <div className="backdrop-glow backdrop-glow-pink" />
      <div className="backdrop-glow backdrop-glow-teal" />

      <section className="section-frame page-hero">
        <p className="eyebrow">{eyebrow}</p>
        <h1>{title}</h1>
        <p className="lede page-intro">{intro}</p>
      </section>

      {children}
    </main>
  );
}
