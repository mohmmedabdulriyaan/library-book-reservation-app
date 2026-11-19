import AppLayout from "./AppLayout";

const tabs = [
  { to: "/home", label: "Home", icon: "bi-house-door" },
  { to: "/search", label: "Search", icon: "bi-search" },
  { to: "/library", label: "E-Library", icon: "bi-file-earmark-pdf" },
  { to: "/reservations", label: "My Books", icon: "bi-bookmark" },
  { to: "/profile", label: "Profile", icon: "bi-person" },
];

export default function StudentLayout() {
  return <AppLayout tabs={tabs} homePath="/home" profilePath="/profile" notificationsPath="/notifications" />;
}
