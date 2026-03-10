import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useMutation } from "@tanstack/react-query";
import { format, addDays, isBefore, startOfDay, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { sr } from "date-fns/locale";
import toast from "react-hot-toast";
import { User, Clock, Scissors, CheckCircle, ChevronLeft, ChevronRight, Shield, Check, AlertCircle } from "lucide-react";
import api from "../api";
import type { Barber, Service, AvailabilityResponse } from "../types";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

type Step = "barber" | "date" | "slot" | "service" | "form" | "success";

interface BookingFormData {
  client_name: string;
  client_email: string;
  client_phone: string;
  note: string;
}

type FormErrors = Partial<Record<keyof BookingFormData, string>>;
type Touched = Partial<Record<keyof BookingFormData, boolean>>;

const NOTE_MAX = 300;

function validateForm(data: BookingFormData): FormErrors {
  const errors: FormErrors = {};

  const name = data.client_name.trim();
  if (!name) {
    errors.client_name = "Ime i prezime je obavezno";
  } else if (name.length < 3) {
    errors.client_name = "Minimum 3 karaktera";
  } else if (name.length > 60) {
    errors.client_name = "Maksimum 60 karaktera";
  } else if (!/^[a-zA-ZčćšžđČĆŠŽĐ\s\-']+$/.test(name)) {
    errors.client_name = "Dozvoljena su samo slova";
  }

  const email = data.client_email.trim();
  if (!email) {
    errors.client_email = "Email adresa je obavezna";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    errors.client_email = "Unesite ispravnu email adresu";
  }

  const phone = data.client_phone.trim();
  if (!phone) {
    errors.client_phone = "Broj telefona je obavezan";
  } else if (!/^[\+\d][\d\s\-\(\)]{5,19}$/.test(phone)) {
    errors.client_phone = "Unesite ispravan broj telefona (npr. 060 123 4567)";
  }

  if (data.note.length > NOTE_MAX) {
    errors.note = `Napomena ne sme biti duža od ${NOTE_MAX} karaktera`;
  }

  return errors;
}

const DAY_LABELS = ["Po", "Ut", "Sr", "Če", "Pe", "Su", "Ne"];
const MAX_DATE = addDays(new Date(), 60);
const TODAY = startOfDay(new Date());

function CustomCalendar({
  value,
  onChange,
}: {
  value: Date | null;
  onChange: (d: Date) => void;
}) {
  const [viewMonth, setViewMonth] = useState(() => new Date());

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  // Mon=0 .. Sun=6
  const firstDayRaw = new Date(year, month, 1).getDay();
  const offset = (firstDayRaw + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const prevDisabled = isSameMonth(viewMonth, new Date());
  const nextDisabled = isSameMonth(viewMonth, MAX_DATE);

  return (
    <div className="bg-surface-800 border border-border rounded-2xl p-5 w-full max-w-sm mx-auto shadow-card">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <button
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
          disabled={prevDisabled}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-surface-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={18} />
        </button>
        <h3 className="font-display font-semibold text-white capitalize">
          {format(viewMonth, "MMMM yyyy", { locale: sr })}
        </h3>
        <button
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          disabled={nextDisabled}
          className="w-9 h-9 rounded-xl flex items-center justify-center text-gray-400 hover:text-white hover:bg-surface-700 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Day labels */}
      <div className="grid grid-cols-7 mb-2">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-600 py-1">
            {d}
          </div>
        ))}
      </div>

      {/* Days */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;

          const isSelected = value && isSameDay(day, value);
          const isToday = isSameDay(day, new Date());
          const isSunday = day.getDay() === 0;
          const isPast = isBefore(day, TODAY);
          const isFuture = day > MAX_DATE;
          const disabled = isSunday || isPast || isFuture;

          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onChange(day)}
              className={`
                h-9 w-9 mx-auto flex items-center justify-center rounded-xl text-sm font-medium transition-all
                ${isSelected
                  ? "bg-accent-500 text-white font-bold shadow-accent-sm"
                  : isToday
                  ? "ring-1 ring-accent-500 text-accent-400 hover:bg-surface-700"
                  : disabled
                  ? "text-surface-600 cursor-not-allowed"
                  : "text-gray-300 hover:bg-surface-700 hover:text-white"
                }
              `}
            >
              {day.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default function BookingPage() {
  const [params] = useSearchParams();
  const [step, setStep] = useState<Step>("barber");
  const [selectedBarber, setSelectedBarber] = useState<Barber | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<BookingFormData>({
    client_name: "",
    client_email: "",
    client_phone: "",
    note: "",
  });
  const [touched, setTouched] = useState<Touched>({});
  const errors = validateForm(formData);
  const isFormValid = Object.keys(errors).length === 0;

  const touch = (field: keyof BookingFormData) =>
    setTouched((t) => ({ ...t, [field]: true }));

  const touchAll = () =>
    setTouched({ client_name: true, client_email: true, client_phone: true, note: true });

  const { data: barbers } = useQuery<Barber[]>({
    queryKey: ["barbers"],
    queryFn: () => api.get("/barbers").then((r) => r.data),
  });

  useEffect(() => {
    const barberId = params.get("barber");
    if (barberId && barbers) {
      const b = barbers.find((b) => b.id === barberId);
      if (b) {
        setSelectedBarber(b);
        setStep("date");
      }
    }
  }, [barbers, params]);

  const dateStr = selectedDate ? format(selectedDate, "yyyy-MM-dd") : null;

  const { data: availability, isLoading: loadingSlots } = useQuery<AvailabilityResponse>({
    queryKey: ["availability", selectedBarber?.id, dateStr],
    queryFn: () =>
      api.get(`/availability?barber_id=${selectedBarber!.id}&date=${dateStr}`).then((r) => r.data),
    enabled: !!selectedBarber && !!dateStr,
  });

  const { data: services } = useQuery<Service[]>({
    queryKey: ["services", selectedBarber?.id],
    queryFn: () => api.get(`/services?barber_id=${selectedBarber!.id}`).then((r) => r.data),
    enabled: !!selectedBarber,
  });

  const bookMutation = useMutation({
    mutationFn: (data: object) => api.post("/bookings", data).then((r) => r.data),
    onSuccess: () => setStep("success"),
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || "Greška pri zakazivanju");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    touchAll();
    if (!selectedBarber || !dateStr || !selectedSlot || !selectedService) return;
    if (!isFormValid) return;
    bookMutation.mutate({
      barber_id: selectedBarber.id,
      service_id: selectedService.id,
      date: dateStr,
      start_time: selectedSlot,
      ...formData,
    });
  };

  const resetBooking = () => {
    setStep("barber");
    setSelectedBarber(null);
    setSelectedDate(null);
    setSelectedSlot(null);
    setSelectedService(null);
    setFormData({ client_name: "", client_email: "", client_phone: "", note: "" });
  };

  const steps: Step[] = ["barber", "date", "slot", "service", "form"];
  const stepLabels = ["Frizer", "Datum", "Termin", "Usluga", "Podaci"];
  const stepIndex = steps.indexOf(step);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Page header */}
      <div className="relative bg-surface-900 border-b border-border overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern bg-grid-sm opacity-60" />
        <div className="absolute inset-0 bg-gradient-to-b from-accent-500/5 to-transparent pointer-events-none" />
        <div className="relative max-w-3xl mx-auto px-4 py-12 text-center">
          <h1 className="font-display text-4xl font-bold text-white">Zakaži termin</h1>
        </div>
      </div>

      <main className="flex-1 max-w-3xl mx-auto px-4 py-10 w-full">
        {/* Step progress */}
        {step !== "success" && (
          <div className="mb-10">
            <div className="flex items-center gap-0">
              {steps.map((s, i) => (
                <div key={s} className="flex items-center flex-1">
                  <div className="flex flex-col items-center">
                    <div
                      className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold transition-all duration-300 ${
                        i < stepIndex
                          ? "bg-accent-500 text-white"
                          : i === stepIndex
                          ? "bg-accent-500/20 border-2 border-accent-500 text-accent-400"
                          : "bg-surface-800 border border-border text-gray-600"
                      }`}
                    >
                      {i < stepIndex ? <Check size={16} /> : i + 1}
                    </div>
                    <span
                      className={`text-xs font-medium mt-1.5 hidden sm:block ${
                        i === stepIndex ? "text-accent-400" : i < stepIndex ? "text-gray-400" : "text-gray-600"
                      }`}
                    >
                      {stepLabels[i]}
                    </span>
                  </div>
                  {i < steps.length - 1 && (
                    <div className={`flex-1 h-px mx-2 transition-colors ${i < stepIndex ? "bg-accent-500" : "bg-border"}`} />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step: Barber */}
        {step === "barber" && (
          <div>
            <h2 className="font-display text-2xl font-bold text-white mb-6">Izaberi frizera</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {barbers?.map((barber) => (
                <button
                  key={barber.id}
                  onClick={() => { setSelectedBarber(barber); setStep("date"); }}
                  className="card text-left hover:border-accent-500/50 transition-all group hover:shadow-accent-sm hover:-translate-y-0.5"
                >
                  <div className="flex items-start gap-4">
                    <div className="relative flex-shrink-0">
                      <div className="w-16 h-16 rounded-2xl bg-surface-700 flex items-center justify-center overflow-hidden ring-2 ring-border group-hover:ring-accent-500/50 transition-all">
                        {barber.photo_url ? (
                          <img src={barber.photo_url} alt={barber.full_name} className="w-full h-full object-cover" />
                        ) : (
                          <User size={26} className="text-gray-500" />
                        )}
                      </div>
                      {barber.auto_accept && (
                        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-green-500 border-2 border-surface-800 flex items-center justify-center">
                          <Shield size={9} className="text-white" />
                        </div>
                      )}
                    </div>
                    <div>
                      <h3 className="font-display font-bold text-white group-hover:text-accent-400 transition-colors">
                        {barber.full_name}
                      </h3>
                      <p className="text-gray-400 text-sm mt-1 leading-relaxed">{barber.description}</p>
                      {barber.auto_accept && (
                        <span className="inline-flex items-center gap-1 mt-2 text-xs text-green-400 bg-green-400/10 border border-green-400/20 px-2 py-0.5 rounded-full">
                          Automatska potvrda
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Date */}
        {step === "date" && (
          <div>
            <button onClick={() => setStep("barber")} className="flex items-center gap-1.5 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
              <ChevronLeft size={16} /> Nazad
            </button>
            <h2 className="font-display text-2xl font-bold text-white mb-1">Izaberi datum</h2>
            <p className="text-gray-500 text-sm mb-8">
              Frizer: <span className="text-accent-400 font-medium">{selectedBarber?.full_name}</span>
            </p>
            <CustomCalendar
              value={selectedDate}
              onChange={(date) => { setSelectedDate(date); setStep("slot"); }}
            />
          </div>
        )}

        {/* Step: Slot */}
        {step === "slot" && (
          <div>
            <button onClick={() => setStep("date")} className="flex items-center gap-1.5 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
              <ChevronLeft size={16} /> Nazad
            </button>
            <h2 className="font-display text-2xl font-bold text-white mb-1">Izaberi termin</h2>
            <p className="text-gray-500 text-sm mb-6">
              {selectedBarber?.full_name} —{" "}
              <span className="text-white capitalize">
                {selectedDate && format(selectedDate, "EEEE, d. MMMM", { locale: sr })}
              </span>
            </p>

            {/* Legend */}
            <div className="flex gap-4 mb-5 text-xs text-gray-500">
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-accent-500 inline-block" /> Slobodno
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500/50 inline-block" /> Zauzeto
              </span>
            </div>

            {loadingSlots ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="h-11 rounded-xl bg-surface-800 animate-pulse" />
                ))}
              </div>
            ) : !availability?.slots.length ? (
              <div className="card text-center text-gray-500 py-14">
                Nema dostupnih termina za ovaj dan
              </div>
            ) : (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {availability.slots.map((slot) => (
                  <button
                    key={slot.time}
                    disabled={slot.status !== "free"}
                    onClick={() => { setSelectedSlot(slot.time); setStep("service"); }}
                    className={`py-2.5 rounded-xl text-sm font-medium transition-all ${
                      slot.status === "free"
                        ? "bg-accent-500/15 border border-accent-500/40 text-accent-400 hover:bg-accent-500/25 hover:border-accent-500/60 hover:-translate-y-px"
                        : slot.status === "booked"
                        ? "bg-surface-800 border border-border text-gray-700 cursor-not-allowed line-through"
                        : "bg-surface-800 border border-border text-gray-700 cursor-not-allowed"
                    }`}
                  >
                    {slot.time}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Step: Service */}
        {step === "service" && (
          <div>
            <button onClick={() => setStep("slot")} className="flex items-center gap-1.5 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
              <ChevronLeft size={16} /> Nazad
            </button>
            <h2 className="font-display text-2xl font-bold text-white mb-1">Izaberi uslugu</h2>
            <p className="text-gray-500 text-sm mb-6">
              {selectedBarber?.full_name} —{" "}
              <span className="text-white">
                {selectedDate && format(selectedDate, "d. MMMM", { locale: sr })}
              </span>{" "}
              u <span className="text-accent-400">{selectedSlot}</span>
            </p>
            <div className="grid gap-3">
              {services?.map((svc) => (
                <button
                  key={svc.id}
                  onClick={() => { setSelectedService(svc); setStep("form"); }}
                  className="card text-left hover:border-accent-500/40 transition-all group hover:shadow-accent-sm hover:-translate-y-px"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-display font-semibold text-white group-hover:text-accent-400 transition-colors">
                        {svc.name}
                      </h3>
                      {svc.description && (
                        <p className="text-gray-500 text-sm mt-0.5">{svc.description}</p>
                      )}
                      <div className="flex items-center gap-1.5 mt-2 text-sm text-gray-500">
                        <Clock size={13} className="text-accent-500" />
                        {svc.duration_minutes} min
                      </div>
                    </div>
                    {svc.price && (
                      <div className="ml-4 text-right flex-shrink-0">
                        <span className="font-display text-xl font-bold text-accent-400">{svc.price}</span>
                        <span className="text-gray-600 text-xs block">RSD</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Step: Form */}
        {step === "form" && (
          <div>
            <button onClick={() => setStep("service")} className="flex items-center gap-1.5 text-gray-400 hover:text-white mb-6 text-sm transition-colors">
              <ChevronLeft size={16} /> Nazad
            </button>

            {/* Summary */}
            <div className="card mb-8 bg-surface-700/50">
              <h3 className="font-display text-sm font-semibold text-gray-400 mb-4 uppercase tracking-wider">
                Rezime rezervacije
              </h3>
              <div className="space-y-2.5">
                {[
                  { label: "Frizer", value: selectedBarber?.full_name },
                  { label: "Datum", value: selectedDate && format(selectedDate, "d. MMMM yyyy.", { locale: sr }) },
                  { label: "Vreme", value: selectedSlot },
                  { label: "Usluga", value: `${selectedService?.name} (${selectedService?.duration_minutes} min)` },
                  ...(selectedService?.price ? [{ label: "Cena", value: `${selectedService.price} RSD` }] : []),
                ].map(({ label, value }) => (
                  <div key={label} className="flex justify-between text-sm gap-4">
                    <span className="text-gray-500 flex-shrink-0">{label}</span>
                    <span className="text-white text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            <h2 className="font-display text-2xl font-bold text-white mb-6">Vaši podaci</h2>
            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
              {/* Ime */}
              <div>
                <label className="label">Ime i prezime *</label>
                <div className="relative">
                  <input
                    className={`input pr-10 ${touched.client_name && errors.client_name ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : touched.client_name && !errors.client_name ? "border-green-500/60 focus:border-green-500/60" : ""}`}
                    value={formData.client_name}
                    onChange={(e) => setFormData({ ...formData, client_name: e.target.value })}
                    onBlur={() => touch("client_name")}
                    placeholder="Petar Petrović"
                    autoComplete="name"
                  />
                  {touched.client_name && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {errors.client_name
                        ? <AlertCircle size={16} className="text-red-500" />
                        : <Check size={16} className="text-green-500" />}
                    </div>
                  )}
                </div>
                {touched.client_name && errors.client_name && (
                  <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={13} /> {errors.client_name}
                  </p>
                )}
              </div>

              {/* Email */}
              <div>
                <label className="label">Email adresa *</label>
                <div className="relative">
                  <input
                    type="email"
                    className={`input pr-10 ${touched.client_email && errors.client_email ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : touched.client_email && !errors.client_email ? "border-green-500/60 focus:border-green-500/60" : ""}`}
                    value={formData.client_email}
                    onChange={(e) => setFormData({ ...formData, client_email: e.target.value })}
                    onBlur={() => touch("client_email")}
                    placeholder="petar@email.com"
                    autoComplete="email"
                  />
                  {touched.client_email && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {errors.client_email
                        ? <AlertCircle size={16} className="text-red-500" />
                        : <Check size={16} className="text-green-500" />}
                    </div>
                  )}
                </div>
                {touched.client_email && errors.client_email && (
                  <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={13} /> {errors.client_email}
                  </p>
                )}
              </div>

              {/* Telefon */}
              <div>
                <label className="label">Broj telefona *</label>
                <div className="relative">
                  <input
                    type="tel"
                    className={`input pr-10 ${touched.client_phone && errors.client_phone ? "border-red-500 focus:border-red-500 focus:ring-red-500/20" : touched.client_phone && !errors.client_phone ? "border-green-500/60 focus:border-green-500/60" : ""}`}
                    value={formData.client_phone}
                    onChange={(e) => setFormData({ ...formData, client_phone: e.target.value })}
                    onBlur={() => touch("client_phone")}
                    placeholder="060 123 4567"
                    autoComplete="tel"
                  />
                  {touched.client_phone && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                      {errors.client_phone
                        ? <AlertCircle size={16} className="text-red-500" />
                        : <Check size={16} className="text-green-500" />}
                    </div>
                  )}
                </div>
                {touched.client_phone && errors.client_phone && (
                  <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={13} /> {errors.client_phone}
                  </p>
                )}
              </div>

              {/* Napomena */}
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="label mb-0">Napomena (opciono)</label>
                  <span className={`text-xs ${formData.note.length > NOTE_MAX ? "text-red-400" : "text-gray-600"}`}>
                    {formData.note.length}/{NOTE_MAX}
                  </span>
                </div>
                <textarea
                  className={`input min-h-[90px] resize-none ${touched.note && errors.note ? "border-red-500 focus:border-red-500" : ""}`}
                  value={formData.note}
                  onChange={(e) => setFormData({ ...formData, note: e.target.value })}
                  onBlur={() => touch("note")}
                  placeholder="Npr: fade + linije, brada sa brijanjem..."
                />
                {touched.note && errors.note && (
                  <p className="mt-1.5 text-sm text-red-400 flex items-center gap-1">
                    <AlertCircle size={13} /> {errors.note}
                  </p>
                )}
              </div>

              <button
                type="submit"
                disabled={bookMutation.isPending}
                className="btn-primary w-full text-base py-3.5 flex items-center justify-center gap-2 mt-2"
              >
                <Scissors size={18} />
                {bookMutation.isPending ? "Slanje..." : "Pošalji rezervaciju"}
              </button>
            </form>
          </div>
        )}

        {/* Step: Success */}
        {step === "success" && (
          <div className="card text-center py-16">
            <div className="w-20 h-20 rounded-full bg-green-500/15 border border-green-500/30 flex items-center justify-center mx-auto mb-6">
              <CheckCircle size={40} className="text-green-400" />
            </div>
            <h2 className="font-display text-3xl font-bold text-white mb-3">Zahtev je poslat!</h2>
            <p className="text-gray-400 mb-2 text-lg">
              Termin kod <span className="text-accent-400 font-semibold">{selectedBarber?.full_name}</span> je rezervisan.
            </p>
            <p className="text-gray-600 text-sm mb-10">Bićeš obavešten kada admin potvrdi termin.</p>
            <button onClick={resetBooking} className="btn-primary px-8 py-3">
              Zakaži novi termin
            </button>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
