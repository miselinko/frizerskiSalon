import type { BookingStatus } from "../types";

const labels: Record<BookingStatus, string> = {
  pending: "Na čekanju",
  approved: "Prihvaćena",
  rejected: "Odbijena",
  auto_approved: "Auto-prihvaćena",
  cancelled: "Otkazana",
};

const classes: Record<BookingStatus, string> = {
  pending: "badge-pending",
  approved: "badge-approved",
  rejected: "badge-rejected",
  auto_approved: "badge-auto",
  cancelled: "badge-cancelled",
};

export default function StatusBadge({ status }: { status: BookingStatus }) {
  return <span className={classes[status]}>{labels[status]}</span>;
}
