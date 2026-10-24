export type Page =
  | "login"
  | "dashboard"
  | "properties-vente"
  | "properties-location"
  | "vehicles"
  | "vehicles-vente"
  | "vehicles-location"
  | "promos"
  | "services"
  | "faqs"
  | "messages"
  | "admins"
  | "reviews"
  | "audit";

export type AdminProfile = {
  id: string;
  email: string;
  username: string | null;
  role: "superadmin" | "admin";
  avatar?: string;
};

export type AdminRow = {
  id: string;
  email: string;
  username: string | null;
  role: "superadmin" | "admin";
  status: "invited" | "active" | "blocked";
  createdAt?: string | null;
};


export type Review = {
  id: string;
  author: string;
  avatar?: string;
  rating: number;
  comment: string;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

export type LoginEvent = {
  id: string;
  email: string;
  username: string | null;
  ip: string;
  device: string;
  createdAt: string;
};

// Saisie d'un témoignage client par l'agence : créé puis publié directement
