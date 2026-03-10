import { useQuery } from "@tanstack/react-query";
import { Clock, Scissors, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api";
import type { Service, Barber } from "../types";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const SERVICE_VISUALS: Record<string, { gradient: string; icon: string; color: string }> = {
  default:  { gradient: "from-surface-700 to-surface-800", icon: "✂️",  color: "text-gray-400" },
  šišanje:  { gradient: "from-blue-900/80 to-blue-950",    icon: "✂️",  color: "text-blue-400" },
  kosa:     { gradient: "from-blue-900/80 to-blue-950",    icon: "✂️",  color: "text-blue-400" },
  brada:    { gradient: "from-amber-900/80 to-amber-950",  icon: "🪒",  color: "text-amber-400" },
  brijanje: { gradient: "from-violet-900/80 to-violet-950",icon: "🪒",  color: "text-violet-400" },
  farbanje: { gradient: "from-pink-900/80 to-pink-950",    icon: "🎨",  color: "text-pink-400" },
  nega:     { gradient: "from-teal-900/80 to-teal-950",    icon: "✨",  color: "text-teal-400" },
  tretman:  { gradient: "from-teal-900/80 to-teal-950",    icon: "✨",  color: "text-teal-400" },
  styling:  { gradient: "from-indigo-900/80 to-indigo-950",icon: "💇",  color: "text-indigo-400" },
  masaža:   { gradient: "from-green-900/80 to-green-950",  icon: "💆",  color: "text-green-400" },
};

function getServiceVisual(name: string) {
  const lower = name.toLowerCase();
  for (const [key, val] of Object.entries(SERVICE_VISUALS)) {
    if (key !== "default" && lower.includes(key)) return val;
  }
  return SERVICE_VISUALS.default;
}

export default function ServicesPage() {
  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["services-all"],
    queryFn: () => api.get("/services?barber_id=").then((r) => r.data),
  });

  const { data: barbers } = useQuery<Barber[]>({
    queryKey: ["barbers"],
    queryFn: () => api.get("/barbers").then((r) => r.data),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <main className="flex-1 w-full">
        {/* Header */}
        <div className="relative bg-surface-900 border-b border-border overflow-hidden">
          <div className="absolute inset-0 bg-grid-pattern bg-grid-sm opacity-60" />
          <div className="absolute inset-0 bg-gradient-to-b from-accent-500/5 to-transparent pointer-events-none" />
          <div className="relative max-w-5xl mx-auto px-4 py-16 text-center">
            <h1 className="font-display text-5xl font-bold text-white mb-3">Usluge i cenovnik</h1>
            <p className="text-gray-400 text-lg">Sve usluge koje nudimo sa cenama i trajanjem</p>
          </div>
        </div>

        <div className="max-w-5xl mx-auto px-4 py-16">
          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-surface-800 border border-border rounded-2xl overflow-hidden animate-pulse">
                  <div className="h-36 bg-surface-700" />
                  <div className="p-5 space-y-2">
                    <div className="h-4 bg-surface-700 rounded w-2/3" />
                    <div className="h-3 bg-surface-700 rounded w-full" />
                    <div className="h-3 bg-surface-700 rounded w-4/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {services?.map((svc) => {
                const visual = getServiceVisual(svc.name);
                const barber = barbers?.find((b) => b.id === svc.barber_id);
                return (
                  <div
                    key={svc.id}
                    className="bg-surface-800 border border-border rounded-2xl overflow-hidden hover:border-accent-500/40 transition-all group hover:shadow-accent-sm hover:-translate-y-0.5"
                  >
                    {/* Visual header */}
                    <div className={`h-36 bg-gradient-to-br ${visual.gradient} flex items-center justify-center relative overflow-hidden`}>
                      <div className="absolute inset-0 bg-grid-pattern bg-grid-sm opacity-40" />
                      <span className="text-5xl relative z-10 group-hover:scale-110 transition-transform duration-300 select-none">
                        {visual.icon}
                      </span>
                      {svc.price && (
                        <div className="absolute bottom-3 right-3 bg-surface-950/90 backdrop-blur rounded-xl px-3 py-1.5">
                          <span className="font-display text-accent-400 font-bold">{svc.price}</span>
                          <span className="text-gray-500 text-xs ml-1">RSD</span>
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="p-5">
                      <h3 className="font-display text-lg font-bold text-white mb-1 group-hover:text-accent-400 transition-colors">
                        {svc.name}
                      </h3>
                      {svc.description && (
                        <p className="text-gray-500 text-sm mb-3 leading-relaxed line-clamp-2">{svc.description}</p>
                      )}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-sm text-gray-400">
                          <Clock size={13} className="text-accent-500" />
                          {svc.duration_minutes} min
                        </div>
                        {barber && (
                          <span className="text-xs text-gray-600 bg-surface-700 px-2 py-0.5 rounded-full">
                            {barber.full_name.split(" ")[0]}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="mt-14 text-center">
            <p className="text-gray-500 mb-5">Svidela ti se neka od usluga?</p>
            <Link to="/zakazivanje" className="btn-primary inline-flex items-center gap-2 text-base px-8 py-3">
              <Scissors size={18} />
              Zakaži termin
              <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
