"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV = [
  { href: "/", label: "Search", desc: "Find & summarize papers" },
  { href: "/ask", label: "Ask", desc: "Question the archive" },
  { href: "/topics", label: "Topics", desc: "Browse by cluster" },
  { href: "/upload", label: "Upload", desc: "Match your own PDF" },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 shrink-0 bg-ink text-bone flex flex-col border-r border-black/20">
      <div className="px-6 pt-8 pb-6 border-b border-white/10">
        <p className="access-no text-archive-soft/70">ML-ARXIV ARCHIVE</p>
        <h1 className="font-serif text-2xl leading-tight mt-1">
          Research
          <br />
          Assistant
        </h1>
      </div>

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

      <div className="px-6 py-5 border-t border-white/10">
        <p className="access-no text-bone/40">15,000 papers indexed</p>
      </div>
    </aside>
  );
}
