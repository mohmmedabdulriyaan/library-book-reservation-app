import AppLayout from "./AppLayout";

const tabs = [
  { to: "/admin", label: "Dashboard", short: "Home", icon: "bi-grid", end: true },
  { to: "/admin/books", label: "Books", icon: "bi-journal-bookmark" },
  { to: "/admin/reservations", label: "Reservations", short: "Loans", icon: "bi-clipboard-check" },
  { to: "/admin/students", label: "Students", icon: "bi-people" },
  { to: "/admin/profile", label: "Profile", icon: "bi-person" },
];

export default function AdminLayout() {
  return <AppLayout tabs={tabs} homePath="/admin" profilePath="/admin/profile" notificationsPath="/admin/notifications" badge="Admin" />;
}
