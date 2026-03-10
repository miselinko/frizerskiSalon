import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Scissors, Clock, ChevronRight, User, ArrowRight, Sparkles, Shield, Star } from "lucide-react";
import api from "../api";
import type { SiteContent, Barber, Service } from "../types";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const SERVICE_VISUALS: Record<string, { gradient: string; icon: string }> = {
  default: { gradient: "from-surface-700 to-surface-800", icon: "✂️" },
  šišanje: { gradient: "from-blue-900/60 to-surface-800", icon: "✂️" },
  kosa: { gradient: "from-blue-900/60 to-surface-800", icon: "✂️" },
  brada: { gradient: "from-amber-900/60 to-surface-800", icon: "🪒" },
  brijanje: { gradient: "from-violet-900/60 to-surface-800", icon: "🪒" },
  farbanje: { gradient: "from-pink-900/60 to-surface-800", icon: "🎨" },
  nega: { gradient: "from-teal-900/60 to-surface-800", icon: "✨" },
  tretman: { gradient: "from-teal-900/60 to-surface-800", icon: "✨" },
  styling: { gradient: "from-indigo-900/60 to-surface-800", icon: "💇" },
};

function getServiceVisual(name: string) {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(SERVICE_VISUALS)) {
    if (key !== "default" && lower.includes(key)) return val;
  }
  return SERVICE_VISUALS.default;
}

export default function Home() {
  const { data: content } = useQuery<SiteContent>({
    queryKey: ["site-content"],
    queryFn: () => api.get("/site-content").then((r) => r.data),
  });

  const { data: barbers } = useQuery<Barber[]>({
    queryKey: ["barbers"],
    queryFn: () => api.get("/barbers").then((r) => r.data),
  });

  const { data: services } = useQuery<Service[]>({
    queryKey: ["services"],
    queryFn: () => api.get("/services").then((r) => r.data),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-surface-950">
        {/* Grid bg */}
        <div className="absolute inset-0 bg-grid-pattern bg-grid-sm opacity-100" />
        {/* Glow blobs */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[500px] bg-accent-500/5 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative max-w-6xl mx-auto px-4 py-28 md:py-36">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 bg-accent-500/10 border border-accent-500/20 rounded-full px-4 py-1.5 text-accent-400 text-sm font-medium mb-8 animate-fade-up">
              <Sparkles size={14} />
              Profesionalni frizerski salon
            </div>
            <h1 className="font-display text-5xl md:text-7xl font-bold text-white mb-6 leading-tight tracking-tight animate-fade-up-delay">
              {content?.hero_title || "Frizerski Salon"}
            </h1>
            <p className="text-lg md:text-xl text-gray-400 max-w-xl mx-auto mb-10 leading-relaxed animate-fade-up-delay2">
              {content?.hero_text || "Zakaži termin online i prepusti se profesionalnoj nezi"}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center animate-fade-up-delay2">
              <Link
                to="/zakazivanje"
                className="btn-primary text-base px-8 py-3 flex items-center gap-2 justify-center"
              >
                <Scissors size={18} />
                Zakaži odmah
              </Link>
              <Link
                to="/usluge"
                className="btn-secondary text-base px-8 py-3 flex items-center gap-2 justify-center"
              >
                Pogledaj usluge
                <ArrowRight size={18} />
              </Link>
            </div>
          </div>

          {/* Stats row */}
          <div className="mt-20 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {[
              { value: "500+", label: "zadovoljnih klijenata" },
              { value: "5★", label: "prosečna ocena" },
              { value: "24h", label: "online zakazivanje" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <div className="font-display text-2xl md:text-3xl font-bold text-white">{stat.value}</div>
                <div className="text-gray-500 text-xs mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Barbers */}
      {barbers && barbers.length > 0 && (
        <section className="max-w-6xl mx-auto px-4 py-24">
          <div className="text-center mb-12">
            <h2 className="font-display text-4xl font-bold text-white mb-3">Naši majstori</h2>
            <p className="text-gray-500">Izaberi svog frizera i zakaži termin u sekundi</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {barbers.map((barber) => (
              <div
                key={barber.id}
                className="card hover:border-accent-500/40 transition-all group hover:shadow-accent-sm"
              >
                <div className="flex items-start gap-5">
                  <div className="relative flex-shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-surface-700 flex items-center justify-center overflow-hidden ring-2 ring-border group-hover:ring-accent-500/50 transition-all">
                      {barber.photo_url ? (
                        <img src={barber.photo_url} alt={barber.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <User size={32} className="text-gray-500" />
                      )}
                    </div>
                    {barber.auto_accept && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-surface-800 flex items-center justify-center">
                        <Shield size={10} className="text-white" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-display text-xl font-bold text-white mb-1 group-hover:text-accent-400 transition-colors">
                      {barber.full_name}
                    </h3>
                    <p className="text-gray-400 text-sm mb-4 leading-relaxed">{barber.description}</p>
                    {barber.auto_accept && (
                      <span className="inline-flex items-center gap-1 text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2.5 py-1 rounded-full mb-3">
                        Automatska potvrda termina
                      </span>
                    )}
                    <Link
                      to={`/zakazivanje?barber=${barber.id}`}
                      className="inline-flex items-center gap-1.5 text-accent-400 text-sm font-medium hover:text-accent-300 transition-colors"
                    >
                      Zakaži kod {barber.full_name.split(" ")[0]}
                      <ChevronRight size={15} />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Services */}
      {services && services.length > 0 && (
        <section className="bg-surface-900 border-y border-border py-24">
          <div className="max-w-6xl mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="font-display text-4xl font-bold text-white mb-3">Naše usluge</h2>
              <p className="text-gray-500">Sve što ti treba — od šišanja do kompletnog stajlinga</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {services.slice(0, 6).map((svc) => {
                const visual = getServiceVisual(svc.name);
                return (
                  <div
                    key={svc.id}
                    className="bg-surface-800 border border-border rounded-2xl overflow-hidden hover:border-accent-500/30 transition-all group hover:shadow-accent-sm hover:-translate-y-0.5"
                  >
                    {/* Visual header */}
                    <div className={`h-28 bg-gradient-to-br ${visual.gradient} flex items-center justify-center relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-grid-pattern bg-grid-sm opacity-30" />
                      <span className="text-4xl relative z-10 group-hover:scale-110 transition-transform duration-300">
                        {visual.icon}
                      </span>
                      {svc.price && (
                        <div className="absolute top-3 right-3 bg-surface-950/80 backdrop-blur rounded-lg px-2.5 py-1">
                          <span className="font-display text-accent-400 font-bold text-sm">{svc.price} RSD</span>
                        </div>
                      )}
                    </div>
                    <div className="p-5">
                      <h3 className="font-display font-semibold text-white mb-1">{svc.name}</h3>
                      {svc.description && (
                        <p className="text-gray-500 text-sm mb-3 leading-relaxed line-clamp-2">{svc.description}</p>
                      )}
                      <div className="flex items-center gap-1.5 text-sm text-gray-400">
                        <Clock size={13} className="text-accent-500" />
                        {svc.duration_minutes} min
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            <div className="text-center mt-10">
              <Link to="/usluge" className="btn-secondary inline-flex items-center gap-2">
                Sve usluge <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>
      )}

      {/* About */}
      {content?.about_text && (
        <section className="max-w-3xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-accent-500/10 border border-accent-500/20 rounded-full px-4 py-1.5 text-accent-400 text-sm font-medium mb-6">
            <Star size={13} />
            O nama
          </div>
          <h2 className="font-display text-4xl font-bold text-white mb-6">Naša priča</h2>
          <p className="text-gray-400 leading-relaxed text-lg">{content.about_text}</p>
        </section>
      )}

      {/* CTA */}
      <section className="relative overflow-hidden bg-surface-900 border-y border-border py-20">
        <div className="absolute inset-0 bg-grid-pattern bg-grid-sm opacity-50" />
        <div className="absolute inset-0 bg-gradient-to-r from-accent-500/5 via-transparent to-blue-600/5 pointer-events-none" />
        <div className="relative max-w-2xl mx-auto text-center px-4">
          <h2 className="font-display text-4xl md:text-5xl font-bold text-white mb-4">
            Spreman za novi izgled?
          </h2>
          <p className="text-gray-400 mb-8 text-lg">Zakaži termin online za samo 2 minuta</p>
          <Link to="/zakazivanje" className="btn-primary text-base px-10 py-3.5 inline-flex items-center gap-2">
            <Scissors size={18} />
            Zakaži termin
          </Link>
        </div>
      </section>

      <Footer />
    </div>
  );
}
