import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus, Pencil, Trash2, Clock } from "lucide-react";
import api from "../../api";
import type { Service, Barber } from "../../types";

interface ServiceForm {
  name: string;
  duration_minutes: number;
  price: string;
  description: string;
  barber_id: string;
  active: boolean;
}

const emptyForm: ServiceForm = {
  name: "",
  duration_minutes: 30,
  price: "",
  description: "",
  barber_id: "",
  active: true,
};

export default function AdminServices() {
  const qc = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editService, setEditService] = useState<Service | null>(null);
  const [form, setForm] = useState<ServiceForm>(emptyForm);

  const { data: services, isLoading } = useQuery<Service[]>({
    queryKey: ["admin-services"],
    queryFn: () => api.get("/services/admin").then((r) => r.data),
  });

  const { data: barbers } = useQuery<Barber[]>({
    queryKey: ["all-barbers"],
    queryFn: () => api.get("/barbers/all").then((r) => r.data),
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post("/services", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-services"] });
      qc.invalidateQueries({ queryKey: ["services"] });
      setShowForm(false);
      setForm(emptyForm);
      toast.success("Usluga kreirana");
    },
    onError: () => toast.error("Greška"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      api.patch(`/services/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-services"] });
      qc.invalidateQueries({ queryKey: ["services"] });
      setEditService(null);
      toast.success("Usluga ažurirana");
    },
    onError: () => toast.error("Greška"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/services/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-services"] });
      qc.invalidateQueries({ queryKey: ["services"] });
      toast.success("Usluga obrisana");
    },
    onError: () => toast.error("Greška"),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      ...form,
      price: form.price ? parseFloat(form.price) : null,
      barber_id: form.barber_id || null,
    };
    if (editService) {
      updateMutation.mutate({ id: editService.id, data: payload });
    } else {
      createMutation.mutate(payload);
    }
  };

  const startEdit = (svc: Service) => {
    setEditService(svc);
    setForm({
      name: svc.name,
      duration_minutes: svc.duration_minutes,
      price: svc.price?.toString() || "",
      description: svc.description,
      barber_id: svc.barber_id || "",
      active: svc.active,
    });
    setShowForm(true);
  };

  const getBarberName = (id: string | null) => {
    if (!id) return "Globalna";
    return barbers?.find((b) => b.id === id)?.full_name || "—";
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Usluge</h1>
          <p className="text-gray-400 mt-1">Upravljanje uslugama i cenovnikom</p>
        </div>
        <button
          onClick={() => { setShowForm(true); setEditService(null); setForm(emptyForm); }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Dodaj uslugu
        </button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">
            {editService ? "Izmeni uslugu" : "Nova usluga"}
          </h2>
          <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="label">Naziv *</label>
              <input
                className="input"
                required
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Fade"
              />
            </div>
            <div>
              <label className="label">Trajanje (min) *</label>
              <input
                type="number"
                className="input"
                required
                min={5}
                value={form.duration_minutes}
                onChange={(e) => setForm({ ...form, duration_minutes: parseInt(e.target.value) })}
              />
            </div>
            <div>
              <label className="label">Cena (RSD)</label>
              <input
                type="number"
                className="input"
                value={form.price}
                onChange={(e) => setForm({ ...form, price: e.target.value })}
                placeholder="1200"
              />
            </div>
            <div>
              <label className="label">Frizer (ostavite prazno za globalnu)</label>
              <select
                className="input"
                value={form.barber_id}
                onChange={(e) => setForm({ ...form, barber_id: e.target.value })}
              >
                <option value="">Globalna (svi frizeri)</option>
                {barbers?.map((b) => (
                  <option key={b.id} value={b.id}>{b.full_name}</option>
                ))}
              </select>
            </div>
            <div className="md:col-span-2">
              <label className="label">Opis</label>
              <input
                className="input"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Kratki opis usluge"
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="svc_active"
                checked={form.active}
                onChange={(e) => setForm({ ...form, active: e.target.checked })}
                className="w-4 h-4 accent-yellow-400"
              />
              <label htmlFor="svc_active" className="text-gray-300 text-sm">Aktivna usluga</label>
            </div>
            <div className="md:col-span-2 flex gap-3">
              <button type="submit" className="btn-primary" disabled={createMutation.isPending || updateMutation.isPending}>
                {editService ? "Sačuvaj izmene" : "Kreiraj uslugu"}
              </button>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => { setShowForm(false); setEditService(null); }}
              >
                Otkaži
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Table */}
      {isLoading ? (
        <div className="text-center text-gray-500 py-12">Učitavanje...</div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-dark-500">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Naziv</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Trajanje</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Cena</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium hidden md:table-cell">Frizer</th>
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Status</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {services?.map((svc) => (
                <tr key={svc.id} className="border-b border-dark-500 last:border-0 hover:bg-dark-600/20">
                  <td className="px-4 py-3">
                    <div className="text-white font-medium">{svc.name}</div>
                    {svc.description && <div className="text-gray-500 text-xs">{svc.description}</div>}
                  </td>
                  <td className="px-4 py-3 text-gray-300">
                    <span className="flex items-center gap-1">
                      <Clock size={12} className="text-gold-500" />
                      {svc.duration_minutes} min
                    </span>
                  </td>
                  <td className="px-4 py-3 text-gold-400 font-semibold">
                    {svc.price ? `${svc.price} RSD` : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-400 hidden md:table-cell">
                    {getBarberName(svc.barber_id)}
                  </td>
                  <td className="px-4 py-3">
                    <span className={svc.active ? "badge-approved" : "badge-cancelled"}>
                      {svc.active ? "Aktivna" : "Neaktivna"}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(svc)}
                        className="p-1.5 rounded hover:bg-dark-500 text-gray-400 hover:text-white transition-colors"
                      >
                        <Pencil size={14} />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm("Obrisati uslugu?")) deleteMutation.mutate(svc.id);
                        }}
                        className="p-1.5 rounded hover:bg-red-500/10 text-gray-400 hover:text-red-400 transition-colors"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
