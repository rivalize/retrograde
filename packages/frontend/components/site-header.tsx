"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { navLinks } from "../lib/site-content";

export default function SiteHeader() {
  const pathname = usePathname();

  return (
    <header className="site-header">
      <div className="site-header-inner section-frame">
        <Link className="brand-lockup" href="/" aria-label="Retrograde home">
          <span className="brand-mark">R</span>
          <span>
            <strong>Retrograde</strong>
            <em>Trust infrastructure for the agentic economy</em>
          </span>
        </Link>

        <nav className="top-nav" aria-label="Primary navigation">
          {navLinks.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                aria-current={active ? "page" : undefined}
                className={`top-nav-link ${active ? "active" : ""}`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
