import { useState, useRef, useEffect } from "react";
import {
  format,
  addDays,
  isBefore,
  startOfDay,
  isSameDay,
  isSameMonth,
  addMonths,
  subMonths,
} from "date-fns";
import { sr } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar } from "lucide-react";

const DAY_LABELS = ["Po", "Ut", "Sr", "Če", "Pe", "Su", "Ne"];
const TODAY = startOfDay(new Date());

interface CalendarPickerProps {
  value: Date;
  onChange: (d: Date) => void;
  /** If true, allow selecting any date (past too). Default: false */
  allowPast?: boolean;
  maxDaysAhead?: number;
}

function CalendarGrid({
  value,
  onChange,
  allowPast,
  maxDaysAhead,
}: CalendarPickerProps) {
  const [viewMonth, setViewMonth] = useState(() => new Date(value));
  const maxDate = maxDaysAhead != null ? addDays(new Date(), maxDaysAhead) : null;

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstDayRaw = new Date(year, month, 1).getDay();
  const offset = (firstDayRaw + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < offset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const prevDisabled = !allowPast && isSameMonth(viewMonth, new Date());
  const nextDisabled = maxDate ? isSameMonth(viewMonth, maxDate) : false;

  return (
    <div className="p-4 w-72">
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={() => setViewMonth(subMonths(viewMonth, 1))}
          disabled={prevDisabled}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-surface-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronLeft size={16} />
        </button>
        <span className="font-display font-semibold text-white text-sm capitalize">
          {format(viewMonth, "MMMM yyyy", { locale: sr })}
        </span>
        <button
          onClick={() => setViewMonth(addMonths(viewMonth, 1))}
          disabled={nextDisabled}
          className="w-8 h-8 rounded-lg flex items-center justify-center text-gray-400 hover:text-white hover:bg-surface-600 disabled:opacity-20 disabled:cursor-not-allowed transition-all"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 mb-1">
        {DAY_LABELS.map((d) => (
          <div key={d} className="text-center text-xs font-medium text-gray-600 py-1">
            {d}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={i} />;
          const isSelected = isSameDay(day, value);
          const isToday = isSameDay(day, new Date());
          const isPast = !allowPast && isBefore(day, TODAY);
          const isTooFar = maxDate ? day > maxDate : false;
          const disabled = isPast || isTooFar;

          return (
            <button
              key={i}
              disabled={disabled}
              onClick={() => onChange(day)}
              className={`
                h-8 w-8 mx-auto flex items-center justify-center rounded-lg text-xs font-medium transition-all
                ${isSelected
                  ? "bg-accent-500 text-white font-bold shadow-accent-sm"
                  : isToday
                  ? "ring-1 ring-accent-500 text-accent-400 hover:bg-surface-600"
                  : disabled
                  ? "text-surface-600 cursor-not-allowed"
                  : "text-gray-300 hover:bg-surface-600 hover:text-white"
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

export default function CalendarPicker({
  value,
  onChange,
  allowPast = false,
  maxDaysAhead,
}: CalendarPickerProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const isToday = isSameDay(value, new Date());

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border transition-all text-sm font-medium ${
          open
            ? "bg-surface-700 border-accent-500 text-white"
            : "bg-surface-800 border-border text-gray-300 hover:border-border-light hover:text-white"
        }`}
      >
        <Calendar size={15} className="text-accent-500 flex-shrink-0" />
        <span>
          {isToday
            ? "Danas"
            : format(value, "d. MMMM yyyy.", { locale: sr })}
        </span>
        <span className="text-gray-600 text-xs font-normal">
          {format(value, "EEEE", { locale: sr })}
        </span>
        <ChevronRight
          size={14}
          className={`text-gray-500 ml-auto transition-transform ${open ? "rotate-90" : ""}`}
        />
      </button>

      {open && (
        <div className="absolute top-full mt-2 left-0 z-50 bg-surface-800 border border-border rounded-2xl shadow-card overflow-hidden">
          <CalendarGrid
            value={value}
            onChange={(d) => {
              onChange(d);
              setOpen(false);
            }}
            allowPast={allowPast}
            maxDaysAhead={maxDaysAhead}
          />
          {!isToday && (
            <div className="px-4 pb-3">
              <button
                onClick={() => {
                  onChange(new Date());
                  setOpen(false);
                }}
                className="w-full text-xs text-center text-accent-400 hover:text-accent-300 bg-accent-500/10 border border-accent-500/20 rounded-lg py-1.5 transition-colors"
              >
                Idi na danas
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
