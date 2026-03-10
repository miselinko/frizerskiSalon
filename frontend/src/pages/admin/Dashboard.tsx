import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  CalendarCheck, Clock, CheckCircle, XCircle,
  ChevronDown, ChevronUp, Check, X,
} from "lucide-react";
import { format, isSameDay } from "date-fns";
import { sr } from "date-fns/locale";
import toast from "react-hot-toast";
import api from "../../api";
import type { Booking, BookingStats, Barber, BookingStatus } from "../../types";
import StatusBadge from "../../components/StatusBadge";
import CalendarPicker from "../../components/CalendarPicker";

type StatusFilter = "pending" | "approved" | "rejected" | null;

function formatDate(dateStr: string) {
  // dateStr is "YYYY-MM-DD" from backend
  const d = new Date(dateStr + "T00:00:00");
  return format(d, "d.MM.yyyy", { locale: sr });
}

export default function AdminDashboard() {
  const qc = useQueryClient();
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [adminNoteInput, setAdminNoteInput] = useState<Record<string, string>>({});

  const dateStr = format(selectedDate, "yyyy-MM-dd");
  const isToday = isSameDay(selectedDate, new Date());

  const { data: globalStats } = useQuery<BookingStats>({
    queryKey: ["booking-stats"],
    queryFn: () => api.get("/bookings/admin/stats").then((r) => r.data),
    refetchInterval: 30000,
  });

  const { data: dayBookings, isLoading } = useQuery<Booking[]>({
    queryKey: ["day-bookings", dateStr],
    queryFn: () =>
      api.get(`/bookings/admin?date_from=${dateStr}&date_to=${dateStr}`).then((r) => r.data),
    refetchInterval: 30000,
  });

  // Stats computed from selected day's bookings
  const dayStats = {
    total: dayBookings?.length ?? 0,
    pending: dayBookings?.filter((b) => b.status === "pending").length ?? 0,
    approved: dayBookings?.filter((b) => b.status === "approved" || b.status === "auto_approved").length ?? 0,
    rejected: dayBookings?.filter((b) => b.status === "rejected").length ?? 0,
  };

  const { data: barbers } = useQuery<Barber[]>({
    queryKey: ["all-barbers"],
    queryFn: () => api.get("/barbers/all").then((r) => r.data),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, status, note }: { id: string; status: BookingStatus; note?: string }) =>
      api.patch(`/bookings/admin/${id}`, { status, admin_note: note }).then((r) => r.data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["day-bookings"] });
      qc.invalidateQueries({ queryKey: ["booking-stats"] });
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

  const toggleStatusFilter = (s: StatusFilter) =>
    setStatusFilter((prev) => (prev === s ? null : s));

  const filteredBookings = dayBookings?.filter((b) => {
    if (!statusFilter) return true;
    if (statusFilter === "approved") return b.status === "approved" || b.status === "auto_approved";
    return b.status === statusFilter;
  });

  const statCards = [
    {
      label: "Na čekanju",
      value: dayStats.pending,
      icon: Clock,
      color: "text-yellow-400",
      bg: "bg-yellow-400/10",
      activeBorder: "border-yellow-400/50 ring-1 ring-yellow-400/20",
      filter: "pending" as StatusFilter,
    },
    {
      label: "Prihvaćene",
      value: dayStats.approved,
      icon: CheckCircle,
      color: "text-green-400",
      bg: "bg-green-400/10",
      activeBorder: "border-green-400/50 ring-1 ring-green-400/20",
      filter: "approved" as StatusFilter,
    },
    {
      label: "Odbijene",
      value: dayStats.rejected,
      icon: XCircle,
      color: "text-red-400",
      bg: "bg-red-400/10",
      activeBorder: "border-red-400/50 ring-1 ring-red-400/20",
      filter: "rejected" as StatusFilter,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div>
        <h1 className="font-display text-2xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Pregled frizerskog salona</p>
      </div>

      {/* Top stats row */}
      <div className="grid grid-cols-2 gap-4">
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-accent-500/10 border border-accent-500/20 flex items-center justify-center flex-shrink-0">
            <CalendarCheck size={20} className="text-accent-400" />
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-white">{stats?.total ?? "—"}</div>
            <div className="text-xs text-gray-500">Ukupno rezervacija</div>
          </div>
        </div>
        <div className="card flex items-center gap-4">
          <div className="w-11 h-11 rounded-xl bg-blue-400/10 border border-blue-400/20 flex items-center justify-center flex-shrink-0">
            <CalendarCheck size={20} className="text-blue-400" />
          </div>
          <div>
            <div className="text-2xl font-display font-bold text-white">{stats?.today ?? "—"}</div>
            <div className="text-xs text-gray-500">Danas</div>
          </div>
        </div>
      </div>

      {/* Clickable status filters */}
      <div>
        <p className="text-xs text-gray-500 mb-2 font-medium uppercase tracking-wider">
          Klikni za filtriranje termina
        </p>
        <div className="grid grid-cols-3 gap-3">
          {statCards.map(({ label, value, icon: Icon, color, bg, activeBorder, filter }) => {
            const active = statusFilter === filter;
            return (
              <button
                key={label}
                onClick={() => toggleStatusFilter(filter)}
                className={`card text-left transition-all hover:-translate-y-0.5 cursor-pointer select-none ${
                  active ? activeBorder : "hover:border-border-light"
                }`}
              >
                <div className={`w-9 h-9 rounded-xl ${bg} flex items-center justify-center mb-3`}>
                  <Icon size={17} className={color} />
                </div>
                <div className={`text-2xl font-display font-bold mb-0.5 transition-colors ${active ? color : "text-white"}`}>
                  {value}
                </div>
                <div className="text-xs text-gray-400 flex items-center gap-1.5">
                  {label}
                  {active && <span className={`text-xs ${color}`}>●</span>}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Date + bookings */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <h2 className="font-display text-base font-semibold text-white">
              Termini —
            </h2>
            <span className="text-gray-400 text-sm capitalize">
              {isToday ? "danas" : format(selectedDate, "EEEE, d. MMMM yyyy.", { locale: sr })}
            </span>
            {filteredBookings && filteredBookings.length > 0 && (
              <span className="text-xs bg-accent-500/10 border border-accent-500/20 text-accent-400 px-2 py-0.5 rounded-full">
                {filteredBookings.length}
              </span>
            )}
            {statusFilter && (
              <button
                onClick={() => setStatusFilter(null)}
                className="text-xs text-gray-500 hover:text-white bg-surface-700 border border-border px-2 py-0.5 rounded-full transition-colors"
              >
                × ukloni filter
              </button>
            )}
          </div>

          <CalendarPicker
            value={selectedDate}
            onChange={(d) => {
              setSelectedDate(d);
              setExpandedId(null);
            }}
            allowPast
          />
        </div>

        {isLoading ? (
          <div className="space-y-2">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-16 rounded-2xl bg-surface-800 animate-pulse" />
            ))}
          </div>
        ) : !filteredBookings?.length ? (
          <div className="card text-center py-12">
            <div className="text-3xl mb-3">📅</div>
            <p className="text-gray-400 font-medium">
              {dayBookings?.length
                ? "Nema rezervacija sa ovim filterom"
                : `Nema termina za ${isToday ? "danas" : formatDate(dateStr)}`}
            </p>
            {dayBookings?.length ? (
              <button
                onClick={() => setStatusFilter(null)}
                className="mt-3 text-sm text-accent-400 hover:text-accent-300 transition-colors"
              >
                Prikaži sve
              </button>
            ) : null}
          </div>
        ) : (
          <div className="space-y-2">
            {filteredBookings.map((booking) => (
              <div key={booking.id} className="card p-0 overflow-hidden">
                <button
                  className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-surface-700/30 transition-colors text-left"
                  onClick={() => setExpandedId(expandedId === booking.id ? null : booking.id)}
                >
                  {/* Time pill */}
                  <div className="flex-shrink-0 bg-surface-700 border border-border rounded-xl px-3 py-2 text-center min-w-[80px]">
                    <div className="font-mono font-bold text-white text-sm">
                      {booking.start_time.slice(0, 5)}
                    </div>
                    <div className="text-gray-600 text-xs">
                      – {booking.end_time.slice(0, 5)}
                    </div>
                  </div>

                  <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-2">
                    <div>
                      <div className="text-white text-sm font-medium">{booking.client_name}</div>
                      <div className="text-gray-500 text-xs">{booking.client_phone}</div>
                    </div>
                    <div className="hidden md:block">
                      <div className="text-xs text-gray-500 mb-0.5">Frizer</div>
                      <div className="text-gray-300 text-sm">{getBarberName(booking.barber_id)}</div>
                    </div>
                    <div className="flex justify-end md:justify-start items-start">
                      <StatusBadge status={booking.status} />
                    </div>
                  </div>

                  {expandedId === booking.id
                    ? <ChevronUp size={14} className="text-gray-500 flex-shrink-0" />
                    : <ChevronDown size={14} className="text-gray-500 flex-shrink-0" />}
                </button>

                {expandedId === booking.id && (
                  <div className="border-t border-border px-4 py-4 bg-surface-700/20">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2 text-sm">
                        {[
                          { label: "Email", value: booking.client_email },
                          { label: "Datum", value: formatDate(booking.date) },
                          { label: "Napomena", value: booking.note || "—" },
                          {
                            label: "Kreirano",
                            value: format(new Date(booking.created_at), "d.MM.yyyy HH:mm", { locale: sr }),
                          },
                        ].map(({ label, value }) => (
                          <div key={label} className="flex gap-3">
                            <span className="text-gray-500 w-24 flex-shrink-0">{label}:</span>
                            <span className="text-gray-300 text-xs leading-relaxed break-all">{value}</span>
                          </div>
                        ))}
                      </div>
                      <div>
                        <label className="label">Napomena admina</label>
                        <textarea
                          className="input min-h-[70px] resize-none text-sm mb-3"
                          defaultValue={booking.admin_note}
                          onChange={(e) =>
                            setAdminNoteInput((p) => ({ ...p, [booking.id]: e.target.value }))
                          }
                        />
                        <div className="flex gap-2 flex-wrap">
                          {booking.status !== "approved" && booking.status !== "auto_approved" && (
                            <button
                              className="btn-success flex items-center gap-1.5 text-sm flex-1"
                              onClick={() => handleStatusUpdate(booking, "approved")}
                              disabled={updateMutation.isPending}
                            >
                              <Check size={13} /> Prihvati
                            </button>
                          )}
                          {booking.status !== "rejected" && (
                            <button
                              className="btn-danger flex items-center gap-1.5 text-sm flex-1"
                              onClick={() => handleStatusUpdate(booking, "rejected")}
                              disabled={updateMutation.isPending}
                            >
                              <X size={13} /> Odbij
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
    </div>
  );
}
