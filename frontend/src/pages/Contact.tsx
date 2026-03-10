import { useQuery } from "@tanstack/react-query";
import { Phone, Mail, MapPin, Clock } from "lucide-react";
import api from "../api";
import type { SiteContent } from "../types";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const DAYS = [
  { day: "Ponedeljak", time: "09:00 – 18:00" },
  { day: "Utorak",     time: "09:00 – 18:00" },
  { day: "Sreda",      time: "09:00 – 18:00" },
  { day: "Četvrtak",   time: "09:00 – 18:00" },
  { day: "Petak",      time: "09:00 – 18:00" },
  { day: "Subota",     time: "09:00 – 15:00" },
  { day: "Nedelja",    time: null },
];

export default function ContactPage() {
  const { data: content } = useQuery<SiteContent>({
    queryKey: ["site-content"],
    queryFn: () => api.get("/site-content").then((r) => r.data),
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Header */}
      <div className="relative bg-surface-900 border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-grid-sm opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-accent-500/5 to-transparent pointer-events-none" />
        <div className="relative max-w-4xl mx-auto px-4 py-16 text-center">
          <h1 className="font-display text-5xl font-bold text-white mb-3">Kontakt</h1>
          <p className="text-gray-400 text-lg">Pronađi nas ili nam se javi</p>
        </div>
      </div>

      <main className="flex-1 max-w-4xl mx-auto px-4 py-16 w-full">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Contact info */}
          <div className="card space-y-5">
            <h2 className="font-display text-xl font-bold text-white">Informacije</h2>

            {content?.contact_phone && (
              <a href={`tel:${content.contact_phone}`} className="flex items-center gap-4 group">
                <div className="w-11 h-11 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-500/20 transition-colors">
                  <Phone size={17} className="text-accent-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Telefon</p>
                  <p className="text-white group-hover:text-accent-400 transition-colors font-medium">
                    {content.contact_phone}
                  </p>
                </div>
              </a>
            )}

            {content?.contact_email && (
              <a href={`mailto:${content.contact_email}`} className="flex items-center gap-4 group">
                <div className="w-11 h-11 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0 group-hover:bg-accent-500/20 transition-colors">
                  <Mail size={17} className="text-accent-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Email</p>
                  <p className="text-white group-hover:text-accent-400 transition-colors font-medium">
                    {content.contact_email}
                  </p>
                </div>
              </a>
            )}

            {content?.address && (
              <div className="flex items-center gap-4">
                <div className="w-11 h-11 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
                  <MapPin size={17} className="text-accent-400" />
                </div>
                <div>
                  <p className="text-xs text-gray-500 mb-0.5">Adresa</p>
                  <p className="text-white font-medium">{content.address}</p>
                </div>
              </div>
            )}
          </div>

          {/* Working hours */}
          <div className="card">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-11 h-11 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
                <Clock size={17} className="text-accent-400" />
              </div>
              <h2 className="font-display text-xl font-bold text-white">Radno vreme</h2>
            </div>
            <div className="space-y-2">
              {DAYS.map(({ day, time }) => (
                <div key={day} className="flex justify-between items-center py-2.5 border-b border-border last:border-0 text-sm">
                  <span className="text-gray-400">{day}</span>
                  {time ? (
                    <span className="text-white font-medium">{time}</span>
                  ) : (
                    <span className="text-red-400 font-medium">Zatvoreno</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
