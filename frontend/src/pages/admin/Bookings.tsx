import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { Filter, ChevronDown, ChevronUp, Check, X } from "lucide-react";
import api from "../../api";
import type { Booking, Barber, BookingStatus } from "../../types";
import StatusBadge from "../../components/StatusBadge";

const STATUS_OPTIONS: { value: BookingStatus | ""; label: string }[] = [
  { value: "", label: "Svi statusi" },
  { value: "pending", label: "Na čekanju" },
  { value: "approved", label: "Prihvaćene" },
  { value: "auto_approved", label: "Auto-prihvaćene" },
  { value: "rejected", label: "Odbijene" },
  { value: "cancelled", label: "Otkazane" },
];

export default function AdminBookings() {
  const qc = useQueryClient();
  const [filterBarber, setFilterBarber] = useState("");
  const [filterStatus, setFilterStatus] = useState<BookingStatus | "">("");
  const [filterDateFrom, setFilterDateFrom] = useState("");
  const [filterDateTo, setFilterDateTo] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState<Record<string, string>>({});

  const { data: barbers } = useQuery<Barber[]>({
    queryKey: ["all-barbers"],
    queryFn: () => api.get("/barbers/all").then((r) => r.data),
  });

  const queryParams = new URLSearchParams();
  if (filterBarber) queryParams.set("barber_id", filterBarber);
  if (filterStatus) queryParams.set("status", filterStatus);
  if (filterDateFrom) queryParams.set("date_from", filterDateFrom);
  if (filterDateTo) queryParams.set("date_to", filterDateTo);

  const { data: bookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["bookings", filterBarber, filterStatus, filterDateFrom, filterDateTo],
    queryFn: () => api.get(`/bookings/admin?${queryParams}`).then((r) => r.data),
    refetchInterval: 15000,
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: BookingStatus; note?: string }) =>
      api.patch(`/bookings/admin/${id}`, { status, admin_note: note }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["bookings"] });
      qc.invalidateQueries({ queryKey: ["booking-stats"] });
      qc.invalidateQueries({ queryKey: ["today-bookings"] });
      toast.success("Status ažuriran");
    },
    onError: () => toast.error("Greška"),
  });

  const getBarberName = (id: string) =>
    barbers?.find((b) => b.id === id)?.full_name || "—";

  const handleStatusUpdate = (booking: Booking, status: BookingStatus) => {
    updateMutation.mutate({
      id: booking.id,
      status,
      note: adminNoteInput[booking.id] ?? booking.admin_note,
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Rezervacije</h1>
        <p className="text-gray-400 mt-1">Pregled i upravljanje svim rezervacijama</p>
      </div>

      {/* Filters */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4 text-sm text-gray-400">
          <Filter size={14} /> Filteri
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <select
            className="input"
            value={filterBarber}
            onChange={(e) => setFilterBarber(e.target.value)}
          >
            <option value="">Svi frizeri</option>
            {barbers?.map((b) => (
              <option key={b.id} value={b.id}>{b.full_name}</option>
            ))}
          </select>
          <select
            className="input"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as BookingStatus | "")}
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <input
            type="date"
            className="input"
            value={filterDateFrom}
            onChange={(e) => setFilterDateFrom(e.target.value)}
            placeholder="Od datuma"
          />
          <input
            type="date"
            className="input"
            value={filterDateTo}
            onChange={(e) => setFilterDateTo(e.target.value)}
            placeholder="Do datuma"
          />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="text-center text-gray-500 py-12">Učitavanje...</div>
      ) : !bookings?.length ? (
        <div className="card text-center text-gray-500 py-12">
          Nema rezervacija
        </div>
      ) : (
        <div className="space-y-2">
          {bookings.map((booking) => (
            <div key={booking.id} className="card p-0 overflow-hidden">
              {/* Summary row */}
              <button
                className="w-full flex items-center gap-4 px-4 py-4 hover:bg-dark-600/30 transition-colors text-left"
                onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
              >
                <div className="flex-1 grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Datum / Vreme</div>
                    <div className="text-white font-medium">{booking.date}</div>
                    <div className="text-gray-400 text-sm font-mono">{booking.start_time.slice(0, 5)} – {booking.end_time.slice(0, 5)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Klijent</div>
                    <div className="text-white">{booking.client_name}</div>
                    <div className="text-gray-400 text-xs">{booking.client_phone}</div>
                  </div>
                  <div className="hidden md:block">
                    <div className="text-xs text-gray-500 mb-0.5">Frizer</div>
                    <div className="text-gray-300">{getBarberName(booking.barber_id)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-gray-500 mb-0.5">Status</div>
                    <StatusBadge status={booking.status} />
                  </div>
                </div>
                {expandedId === booking.id ? (
                  <ChevronUp size={16} className="text-gray-500 flex-shrink-0" />
                ) : (
                  <ChevronDown size={16} className="text-gray-500 flex-shrink-0" />
                )}
              </button>

              {/* Expanded details */}
              {expandedId === booking.id && (
                <div className="border-t border-dark-500 px-4 py-4 bg-dark-600/20">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3 text-sm">
                      <div className="flex gap-3">
                        <span className="text-gray-500 w-24 flex-shrink-0">Email:</span>
                        <span className="text-gray-300">{booking.client_email}</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-gray-500 w-24 flex-shrink-0">Napomena:</span>
                        <span className="text-gray-300">{booking.note || "—"}</span>
                      </div>
                      <div className="flex gap-3">
                        <span className="text-gray-500 w-24 flex-shrink-0">Kreirano:</span>
                        <span className="text-gray-400 text-xs">{new Date(booking.created_at).toLocaleString("sr-RS")}</span>
                      </div>
                    </div>

                    <div>
                      <label className="label">Interna napomena admina</label>
                      <textarea
                        className="input min-h-[80px] resize-none text-sm mb-3"
                        defaultValue={booking.admin_note}
                        onChange={(e) =>
                          setAdminNoteInput((p) => ({ ...p, [booking.id]: e.target.value }))
                        }
                      />
                      <div className="flex gap-2">
                        {booking.status !== "approved" && booking.status !== "auto_approved" && (
                          <button
                            className="btn-success flex items-center gap-1.5 text-sm flex-1"
                            onClick={() => handleStatusUpdate(booking, "approved")}
                            disabled={updateMutation.isPending}
                          >
                            <Check size={14} /> Prihvati
                          </button>
                        )}
                        {booking.status !== "rejected" && (
                          <button
                            className="btn-danger flex items-center gap-1.5 text-sm flex-1"
                            onClick={() => handleStatusUpdate(booking, "rejected")}
                            disabled={updateMutation.isPending}
                          >
                            <X size={14} /> Odbij
                          </button>
                        )}
                        {booking.status !== "cancelled" && (
                          <button
                            className="btn-secondary flex items-center gap-1.5 text-sm"
                            onClick={() => handleStatusUpdate(booking, "cancelled")}
                            disabled={updateMutation.isPending}
                          >
                            Otkaži
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
