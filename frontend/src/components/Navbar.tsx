import { Link, useLocation } from "react-router-dom";
import { Scissors, Menu, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import api from "../api";
import type { SiteContent } from "../types";
import { useState } from "react";

const navLinks = [
  { to: "/", label: "Početna" },
  { to: "/usluge", label: "Usluge" },
  { to: "/kontakt", label: "Kontakt" },
];

export default function Navbar() {
  const location = useLocation();
  const [open, setOpen] = useState(false);

  const { data: content } = useQuery<SiteContent>({
    queryKey: ["site-content"],
    queryFn: () => api.get("/site-content").then((r) => r.data),
  });

  return (
    <nav className="sticky top-0 z-50 bg-surface-950/80 backdrop-blur-xl border-b border-border">
      <div className="max-w-6xl mx-auto px-4 flex items-center justify-between h-16">
        <Link to="/" className="flex items-center gap-2.5 font-display font-bold text-xl text-white">
          <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center shadow-accent-sm">
            {content?.logo_url ? (
              <img src={content.logo_url} alt="Logo" className="h-5 w-5 object-contain" />
            ) : (
              <Scissors size={16} className="text-white" />
            )}
          </div>
          <span className="hidden sm:inline">{content?.hero_title || "Frizerski Salon"}</span>
        </Link>

        {/* Desktop nav */}
        <div className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                location.pathname === link.to
                  ? "text-white bg-surface-700"
                  : "text-gray-400 hover:text-white hover:bg-surface-800"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/zakazivanje"
            className="ml-3 btn-primary text-sm py-2 px-5"
          >
            Zakaži termin
          </Link>
        </div>

        {/* Mobile toggle */}
        <button
          className="md:hidden w-9 h-9 flex items-center justify-center rounded-lg bg-surface-800 border border-border text-gray-400 hover:text-white transition-colors"
          onClick={() => setOpen(!open)}
        >
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <div className="md:hidden border-t border-border bg-surface-900/95 backdrop-blur-xl px-4 py-3 flex flex-col gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setOpen(false)}
              className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                location.pathname === link.to
                  ? "bg-surface-700 text-white"
                  : "text-gray-400 hover:text-white hover:bg-surface-800"
              }`}
            >
              {link.label}
            </Link>
          ))}
          <Link
            to="/zakazivanje"
            onClick={() => setOpen(false)}
            className="btn-primary text-center mt-2"
          >
            Zakaži termin
          </Link>
        </div>
      )}
    </nav>
  );
}
