export function formatFCFA(amount: number | null | undefined): string {
  if (amount == null) return "—";
  return new Intl.NumberFormat("fr-FR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount) + " FCFA";
}

export const STATUT_VOYAGE: Record<string, string> = {
  scheduled: "Programmé",
  boarding: "Embarquement",
  departed: "En route",
  arrived: "Arrivé",
  cancelled: "Annulé",
  delayed: "Retardé",
};

export const STATUT_RESERVATION: Record<string, string> = {
  reserved: "Réservé",
  paid: "Payé",
  boarded: "Embarqué",
  no_show: "Absent",
  cancelled: "Annulé",
};

export const STATUT_VEHICULE: Record<string, string> = {
  available: "Disponible",
  in_service: "En service",
  maintenance: "Maintenance",
  retired: "Retraité",
};

export const STATUT_GENERAL: Record<string, string> = {
  active: "Actif",
  inactive: "Inactif",
  suspended: "Suspendu",
};

export const METHODE_PAIEMENT: Record<string, string> = {
  cash: "Espèces",
  card: "Carte bancaire",
  mobile_money: "Mobile Money",
  bank_transfer: "Virement bancaire",
};

export const STATUT_PAIEMENT: Record<string, string> = {
  completed: "Complété",
  pending: "En attente",
  failed: "Échoué",
  refunded: "Remboursé",
};

export const ROLE_UTILISATEUR: Record<string, string> = {
  super_admin: "Super Admin",
  company_admin: "Admin Compagnie",
  booking_agent: "Agent de Réservation",
  boarding_agent: "Agent d'Embarquement",
  driver: "Chauffeur",
  accountant: "Comptable",
};

export const TYPE_VEHICULE: Record<string, string> = {
  bus: "Bus",
  minibus: "Minibus",
  van: "Van",
  ferry: "Ferry",
  train: "Train",
};

export function couleurStatutVoyage(status: string) {
  switch (status) {
    case "scheduled": return "bg-blue-500/10 text-blue-600 border-blue-200";
    case "boarding": return "bg-amber-500/10 text-amber-600 border-amber-200";
    case "departed": return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
    case "arrived": return "bg-slate-500/10 text-slate-600 border-slate-200";
    case "cancelled": return "bg-red-500/10 text-red-600 border-red-200";
    case "delayed": return "bg-orange-500/10 text-orange-600 border-orange-200";
    default: return "bg-slate-500/10 text-slate-600 border-slate-200";
  }
}

export function couleurStatutReservation(status: string) {
  switch (status) {
    case "boarded": return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
    case "paid": return "bg-blue-500/10 text-blue-600 border-blue-200";
    case "reserved": return "bg-amber-500/10 text-amber-600 border-amber-200";
    case "cancelled": return "bg-red-500/10 text-red-600 border-red-200";
    case "no_show": return "bg-slate-500/10 text-slate-600 border-slate-200";
    default: return "bg-slate-500/10 text-slate-600 border-slate-200";
  }
}

export function couleurStatutVehicule(status: string) {
  switch (status) {
    case "available": return "bg-emerald-500/10 text-emerald-600 border-emerald-200";
    case "in_service": return "bg-blue-500/10 text-blue-600 border-blue-200";
    case "maintenance": return "bg-amber-500/10 text-amber-600 border-amber-200";
    case "retired": return "bg-slate-500/10 text-slate-600 border-slate-200";
    default: return "bg-slate-500/10 text-slate-600 border-slate-200";
  }
}

export function formatDuree(minutes: number | null | undefined): string {
  if (!minutes) return "—";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}min`;
  if (m === 0) return `${h}h`;
  return `${h}h${m.toString().padStart(2, "0")}`;
}

export function formatDate(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric" }).format(new Date(dateStr));
}

export function formatDateHeure(dateStr: string | null | undefined): string {
  if (!dateStr) return "—";
  return new Intl.DateTimeFormat("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(dateStr));
}
