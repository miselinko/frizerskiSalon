import { useQuery } from "@tanstack/react-query";
import { Phone, Mail, MapPin, Scissors, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import api from "../api";
import type { SiteContent } from "../types";

export default function Footer() {
  const { data: content } = useQuery<SiteContent>({
    queryKey: ["site-content"],
    queryFn: () => api.get("/site-content").then((r) => r.data),
  });

  return (
    <footer className="bg-surface-900 border-t border-border mt-20">
      <div className="max-w-6xl mx-auto px-4 pt-14 pb-10">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          <div>
            <div className="flex items-center gap-2.5 mb-4">
              <div className="w-8 h-8 rounded-lg bg-accent-500 flex items-center justify-center">
                <Scissors size={16} className="text-white" />
              </div>
              <span className="font-display font-bold text-white text-lg">
                {content?.hero_title || "Frizerski Salon"}
              </span>
            </div>
            <p className="text-gray-500 text-sm leading-relaxed">{content?.hero_text}</p>
          </div>

          <div>
            <h3 className="font-display font-semibold text-white mb-4">Kontakt</h3>
            <ul className="space-y-3 text-sm">
              {content?.contact_phone && (
                <li className="flex items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center flex-shrink-0">
                    <Phone size={13} className="text-accent-500" />
                  </div>
                  <a href={`tel:${content.contact_phone}`} className="hover:text-white transition-colors">
                    {content.contact_phone}
                  </a>
                </li>
              )}
              {content?.contact_email && (
                <li className="flex items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center flex-shrink-0">
                    <Mail size={13} className="text-accent-500" />
                  </div>
                  <a href={`mailto:${content.contact_email}`} className="hover:text-white transition-colors">
                    {content.contact_email}
                  </a>
                </li>
              )}
              {content?.address && (
                <li className="flex items-center gap-3 text-gray-400">
                  <div className="w-8 h-8 rounded-lg bg-surface-700 flex items-center justify-center flex-shrink-0">
                    <MapPin size={13} className="text-accent-500" />
                  </div>
                  <span>{content.address}</span>
                </li>
              )}
            </ul>
          </div>

          <div>
            <h3 className="font-display font-semibold text-white mb-4">Radno vreme</h3>
            <ul className="text-sm text-gray-400 space-y-2">
              <li className="flex items-center gap-2">
                <Clock size={13} className="text-accent-500" />
                Pon – Pet: 09:00 – 18:00
              </li>
              <li className="flex items-center gap-2">
                <Clock size={13} className="text-accent-500" />
                Subota: 09:00 – 15:00
              </li>
              <li className="flex items-center gap-2">
                <span className="w-[13px] h-[13px] rounded-full bg-red-500/30 border border-red-500/50 inline-block flex-shrink-0" />
                Nedelja: Zatvoreno
              </li>
            </ul>
            <Link to="/zakazivanje" className="btn-primary inline-flex items-center gap-2 text-sm mt-6 py-2 px-5">
              Zakaži termin
            </Link>
          </div>
        </div>
      </div>

      <div className="border-t border-border py-4 text-center text-gray-600 text-xs">
        © {new Date().getFullYear()} {content?.hero_title || "Frizerski Salon"}. Sva prava zadržana.
      </div>
    </footer>
  );
}
