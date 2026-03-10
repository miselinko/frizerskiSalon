import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Upload, Save } from "lucide-react";
import api from "../../api";
import type { SiteContent } from "../../types";

export default function AdminSettings() {
  const qc = useQueryClient();

  const { data: content } = useQuery<SiteContent>({
    queryKey: ["site-content"],
    queryFn: () => api.get("/site-content").then((r) => r.data),
  });

  const [form, setForm] = useState({
    hero_title: "",
    hero_text: "",
    about_text: "",
    contact_phone: "",
    contact_email: "",
    address: "",
  });

  useEffect(() => {
    if (content) {
      setForm({
        hero_title: content.hero_title,
        hero_text: content.hero_text,
        about_text: content.about_text,
        contact_phone: content.contact_phone,
        contact_email: content.contact_email,
        address: content.address,
      });
    }
  }, [content]);

  const updateMutation = useMutation({
    mutationFn: (data: object) => api.patch("/site-content", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-content"] });
      toast.success("Sadržaj sajta ažuriran");
    },
    onError: () => toast.error("Greška"),
  });

  const logoMutation = useMutation({
    mutationFn: (file: File) => {
      const fd = new FormData();
      fd.append("file", file);
      return api.post("/site-content/logo", fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-content"] });
      toast.success("Logo uploadovan");
    },
    onError: () => toast.error("Greška pri uploadu"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  return (
    <div className="space-y-8 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-white">Podešavanja sajta</h1>
        <p className="text-gray-400 mt-1">Upravljaj sadržajem i kontakt informacijama</p>
      </div>

      {/* Logo */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Logo</h2>
        <div className="flex items-center gap-6">
          <div className="w-20 h-20 rounded-xl bg-dark-600 border border-dark-500 flex items-center justify-center overflow-hidden">
            {content?.logo_url ? (
              <img src={content.logo_url} alt="Logo" className="w-full h-full object-contain p-2" />
            ) : (
              <span className="text-gray-500 text-xs text-center">Nema loga</span>
            )}
          </div>
          <label className="btn-secondary flex items-center gap-2 cursor-pointer">
            <Upload size={16} />
            {logoMutation.isPending ? "Uploadovanje..." : "Upload logo"}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) logoMutation.mutate(file);
              }}
            />
          </label>
        </div>
      </div>

      {/* Content form */}
      <form onSubmit={handleSubmit} className="card space-y-5">
        <h2 className="text-lg font-semibold text-white">Sadržaj sajta</h2>

        <div>
          <label className="label">Naziv salona</label>
          <input
            className="input"
            value={form.hero_title}
            onChange={(e) => setForm({ ...form, hero_title: e.target.value })}
            placeholder="Frizerski Salon"
          />
        </div>
        <div>
          <label className="label">Tagline / Kratki opis (hero)</label>
          <textarea
            className="input min-h-[80px] resize-none"
            value={form.hero_text}
            onChange={(e) => setForm({ ...form, hero_text: e.target.value })}
          />
        </div>
        <div>
          <label className="label">Tekst o salonu</label>
          <textarea
            className="input min-h-[120px] resize-none"
            value={form.about_text}
            onChange={(e) => setForm({ ...form, about_text: e.target.value })}
            placeholder="Duži opis salona za stranicu 'O nama'..."
          />
        </div>

        <div className="border-t border-dark-500 pt-5">
          <h3 className="text-sm font-semibold text-gray-300 mb-4">Kontakt informacije</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="label">Telefon</label>
              <input
                className="input"
                value={form.contact_phone}
                onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                placeholder="+381 11 123 4567"
              />
            </div>
            <div>
              <label className="label">Email</label>
              <input
                type="email"
                className="input"
                value={form.contact_email}
                onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                placeholder="salon@example.rs"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="label">Adresa</label>
              <input
                className="input"
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Ulica, grad"
              />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="btn-primary flex items-center gap-2"
          disabled={updateMutation.isPending}
        >
          <Save size={16} />
          {updateMutation.isPending ? "Čuvanje..." : "Sačuvaj izmene"}
        </button>
      </form>
    </div>
  );
}
