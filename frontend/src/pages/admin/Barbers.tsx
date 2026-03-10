import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Plus, User, Upload, ToggleLeft, ToggleRight, Pencil, Trash2 } from "lucide-react";
import api from "../../api";
import type { Barber, Schedule } from "../../types";

const WEEKDAYS = ["Ponedeljak", "Utorak", "Sreda", "Četvrtak", "Petak", "Subota", "Nedelja"];

export default function AdminBarbers() {
  const qc = useQueryClient();
  const [showCreate, setShowCreate] = useState(false);
  const [editBarber, setEditBarber] = useState<Barber | null>(null);
  const [scheduleBarber, setScheduleBarber] = useState<Barber | null>(null);
  const [form, setForm] = useState({ full_name: "", description: "", auto_accept: false });

  const { data: barbers } = useQuery<Barber[]>({
    queryKey: ["all-barbers"],
    queryFn: () => api.get("/barbers/all").then((r) => r.data),
  });

  const { data: schedule } = useQuery<Schedule[]>({
    queryKey: ["schedule", scheduleBarber?.id],
    queryFn: () => api.get(`/schedules/${scheduleBarber!.id}`).then((r) => r.data),
    enabled: !!scheduleBarber,
  });

  const createMutation = useMutation({
    mutationFn: (data: object) => api.post("/barbers", data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-barbers"] });
      qc.invalidateQueries({ queryKey: ["barbers"] });
      setShowCreate(false);
      setForm({ full_name: "", description: "", auto_accept: false });
      toast.success("Frizer kreiran");
    },
    onError: () => toast.error("Greška"),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: object }) =>
      api.patch(`/barbers/${id}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-barbers"] });
      qc.invalidateQueries({ queryKey: ["barbers"] });
      setEditBarber(null);
      toast.success("Frizer ažuriran");
    },
    onError: () => toast.error("Greška"),
  });

  const toggleAutoAccept = (barber: Barber) => {
    updateMutation.mutate({ id: barber.id, data: { auto_accept: !barber.auto_accept } });
  };

  const scheduleUpdateMutation = useMutation({
    mutationFn: ({ barberId, weekday, data }: { barberId: string; weekday: number; data: object }) =>
      api.put(`/schedules/${barberId}/${weekday}`, data).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["schedule"] });
      toast.success("Raspored ažuriran");
    },
    onError: () => toast.error("Greška"),
  });

  const uploadPhotoMutation = useMutation({
    mutationFn: ({ id, file }: { id: string; file: File }) => {
      const fd = new FormData();
      fd.append("file", file);
      return api.post(`/barbers/${id}/photo`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["all-barbers"] });
      qc.invalidateQueries({ queryKey: ["barbers"] });
      toast.success("Fotografija uploadovana");
    },
    onError: () => toast.error("Greška pri uploadu"),
  });

  const getScheduleForDay = (weekday: number) =>
    schedule?.find((s) => s.weekday === weekday);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Frizeri</h1>
          <p className="text-gray-400 mt-1">Upravljanje frizerima i rasporedima</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="btn-primary flex items-center gap-2"
        >
          <Plus size={16} /> Dodaj frizera
        </button>
      </div>

      {/* Create form */}
      {showCreate && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Novi frizer</h2>
          <div className="space-y-4">
            <div>
              <label className="label">Puno ime *</label>
              <input
                className="input"
                value={form.full_name}
                onChange={(e) => setForm({ ...form, full_name: e.target.value })}
                placeholder="Marko Nikolić"
              />
            </div>
            <div>
              <label className="label">Opis</label>
              <textarea
                className="input min-h-[80px] resize-none"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Kratak opis frizera..."
              />
            </div>
            <div className="flex items-center gap-3">
              <input
                type="checkbox"
                id="auto_accept_new"
                checked={form.auto_accept}
                onChange={(e) => setForm({ ...form, auto_accept: e.target.checked })}
                className="w-4 h-4 accent-yellow-400"
              />
              <label htmlFor="auto_accept_new" className="text-gray-300 text-sm">
                Automatski prihvati rezervacije
              </label>
            </div>
            <div className="flex gap-3">
              <button
                className="btn-primary"
                onClick={() => createMutation.mutate(form)}
                disabled={!form.full_name || createMutation.isPending}
              >
                Kreiraj
              </button>
              <button className="btn-secondary" onClick={() => setShowCreate(false)}>
                Otkaži
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Barbers list */}
      <div className="grid gap-4">
        {barbers?.map((barber) => (
          <div key={barber.id} className="card">
            <div className="flex items-start gap-4">
              {/* Photo */}
              <div className="relative flex-shrink-0">
                <div className="w-16 h-16 rounded-full bg-dark-500 flex items-center justify-center overflow-hidden">
                  {barber.photo_url ? (
                    <img src={barber.photo_url} alt={barber.full_name} className="w-full h-full object-cover" />
                  ) : (
                    <User size={28} className="text-gray-500" />
                  )}
                </div>
                <label className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-gold-500 flex items-center justify-center cursor-pointer">
                  <Upload size={10} className="text-black" />
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) uploadPhotoMutation.mutate({ id: barber.id, file });
                    }}
                  />
                </label>
              </div>

              <div className="flex-1">
                {editBarber?.id === barber.id ? (
                  <div className="space-y-3">
                    <input
                      className="input"
                      defaultValue={barber.full_name}
                      id={`edit-name-${barber.id}`}
                    />
                    <textarea
                      className="input min-h-[60px] resize-none text-sm"
                      defaultValue={barber.description}
                      id={`edit-desc-${barber.id}`}
                    />
                    <div className="flex gap-2">
                      <button
                        className="btn-primary text-sm px-4 py-1.5"
                        onClick={() => {
                          const name = (document.getElementById(`edit-name-${barber.id}`) as HTMLInputElement)?.value;
                          const desc = (document.getElementById(`edit-desc-${barber.id}`) as HTMLTextAreaElement)?.value;
                          updateMutation.mutate({ id: barber.id, data: { full_name: name, description: desc } });
                        }}
                      >
                        Sačuvaj
                      </button>
                      <button className="btn-secondary text-sm px-4 py-1.5" onClick={() => setEditBarber(null)}>
                        Otkaži
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3">
                      <h3 className="font-bold text-white">{barber.full_name}</h3>
                      {!barber.active && (
                        <span className="text-xs text-red-400 bg-red-400/10 px-2 py-0.5 rounded-full">Neaktivan</span>
                      )}
                    </div>
                    <p className="text-gray-400 text-sm mt-1">{barber.description}</p>
                  </>
                )}
              </div>

              <div className="flex flex-col gap-2 flex-shrink-0">
                {/* Auto accept toggle */}
                <button
                  onClick={() => toggleAutoAccept(barber)}
                  className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg transition-colors ${
                    barber.auto_accept
                      ? "bg-green-500/20 text-green-400 border border-green-500/30"
                      : "bg-dark-600 text-gray-400 border border-dark-500"
                  }`}
                  title="Auto prihvatanje"
                >
                  {barber.auto_accept ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                  Auto
                </button>
                <button
                  onClick={() => setEditBarber(editBarber?.id === barber.id ? null : barber)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-dark-600 text-gray-400 border border-dark-500 hover:text-white transition-colors"
                >
                  <Pencil size={12} /> Izmeni
                </button>
                <button
                  onClick={() => setScheduleBarber(scheduleBarber?.id === barber.id ? null : barber)}
                  className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-dark-600 text-gray-400 border border-dark-500 hover:text-white transition-colors"
                >
                  Raspored
                </button>
              </div>
            </div>

            {/* Schedule section */}
            {scheduleBarber?.id === barber.id && (
              <div className="mt-6 border-t border-dark-500 pt-6">
                <h4 className="text-sm font-semibold text-white mb-4">Nedeljni raspored</h4>
                <div className="space-y-2">
                  {WEEKDAYS.map((day, i) => {
                    const sched = getScheduleForDay(i);
                    return (
                      <div key={i} className="grid grid-cols-1 sm:grid-cols-6 gap-2 items-center p-3 bg-dark-600/30 rounded-lg">
                        <div className="text-sm text-gray-300 font-medium">{day}</div>
                        <div className="flex items-center gap-2 sm:col-span-5">
                          <input
                            type="checkbox"
                            defaultChecked={sched?.is_working ?? i < 6}
                            id={`working-${barber.id}-${i}`}
                            className="accent-yellow-400"
                          />
                          <input
                            type="time"
                            defaultValue={sched?.start_time || "09:00"}
                            id={`start-${barber.id}-${i}`}
                            className="input text-sm py-1 w-28"
                          />
                          <span className="text-gray-500 text-sm">–</span>
                          <input
                            type="time"
                            defaultValue={sched?.end_time || "18:00"}
                            id={`end-${barber.id}-${i}`}
                            className="input text-sm py-1 w-28"
                          />
                          <span className="text-gray-500 text-xs">Pauza:</span>
                          <input
                            type="time"
                            defaultValue={sched?.break_start || ""}
                            id={`bs-${barber.id}-${i}`}
                            className="input text-sm py-1 w-24"
                            placeholder="—"
                          />
                          <span className="text-gray-500 text-xs">–</span>
                          <input
                            type="time"
                            defaultValue={sched?.break_end || ""}
                            id={`be-${barber.id}-${i}`}
                            className="input text-sm py-1 w-24"
                            placeholder="—"
                          />
                          <button
                            className="btn-primary text-xs px-3 py-1.5"
                            onClick={() => {
                              const isWorking = (document.getElementById(`working-${barber.id}-${i}`) as HTMLInputElement)?.checked;
                              const startTime = (document.getElementById(`start-${barber.id}-${i}`) as HTMLInputElement)?.value;
                              const endTime = (document.getElementById(`end-${barber.id}-${i}`) as HTMLInputElement)?.value;
                              const breakStart = (document.getElementById(`bs-${barber.id}-${i}`) as HTMLInputElement)?.value || null;
                              const breakEnd = (document.getElementById(`be-${barber.id}-${i}`) as HTMLInputElement)?.value || null;
                              scheduleUpdateMutation.mutate({
                                barberId: barber.id,
                                weekday: i,
                                data: {
                                  weekday: i,
                                  is_working: isWorking,
                                  start_time: startTime,
                                  end_time: endTime,
                                  slot_duration_minutes: sched?.slot_duration_minutes || 15,
                                  break_start: breakStart || null,
                                  break_end: breakEnd || null,
                                },
                              });
                            }}
                          >
                            Sačuvaj
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
