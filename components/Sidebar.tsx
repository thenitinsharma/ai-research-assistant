"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

const NAV = [
  { href: "/", label: "Search", desc: "Find & summarize papers" },
  { href: "/ask", label: "Ask", desc: "Question the archive" },
  { href: "/topics", label: "Topics", desc: "Browse by cluster" },
  { href: "/upload", label: "Upload", desc: "Match your own PDF" },
];

function Wordmark() {
  return (
    <div className="px-6 pt-8 pb-6 border-b border-white/10">
      <p className="access-no text-archive-soft/70">ML-ARXIV ARCHIVE</p>
      <h1 className="font-serif text-2xl leading-tight mt-1">
        Research
        <br />
        Assistant
      </h1>
    </div>
  );
}

export default function Sidebar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  // Close the mobile drawer any time the route changes.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  // Prevent background scroll while the mobile drawer is open.
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const NavLinks = (
    <nav className="flex-1 py-4">
      {NAV.map((item) => {
        const active = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`block px-6 py-3 border-l-2 transition-colors ${
              active
                ? "border-archive bg-white/5"
                : "border-transparent hover:border-white/20 hover:bg-white/5"
            }`}
          >
            <span className="block text-sm font-medium tracking-wide">{item.label}</span>
            <span className="block text-xs text-bone/50 mt-0.5">{item.desc}</span>
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar (sits in normal document flow, stacked above <main>) */}
      <div className="md:hidden sticky top-0 z-30 flex items-center justify-between gap-4 bg-ink text-bone px-4 py-3 border-b border-black/20">
        <h1 className="font-serif text-lg leading-tight truncate">Research Assistant</h1>
        <button
          type="button"
          aria-label={open ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className="shrink-0 p-2 -mr-2 rounded-sm hover:bg-white/10 active:bg-white/15 transition-colors"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
          </svg>
        </button>
      </div>

      {/* Mobile drawer backdrop */}
      <div
        className={`md:hidden fixed inset-0 z-40 bg-black/40 transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
        onClick={() => setOpen(false)}
        aria-hidden="true"
      />

      {/* Mobile drawer */}
      <aside
        className={`md:hidden fixed top-0 left-0 bottom-0 z-50 w-72 max-w-[85vw] bg-ink text-bone flex flex-col border-r border-black/20 transform transition-transform duration-200 ease-out ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <Wordmark />
        {NavLinks}
        <div className="px-6 py-5 border-t border-white/10">
          <p className="access-no text-bone/40">15,000 papers indexed</p>
        </div>
      </aside>

      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 bg-ink text-bone flex-col border-r border-black/20">
        <Wordmark />
        {NavLinks}
        <div className="px-6 py-5 border-t border-white/10">
          <p className="access-no text-bone/40">15,000 papers indexed</p>
        </div>
      </aside>
    </>
  );
}
