export type VehicleCategory =
  | "SUV / 4x4"
  | "Pick-up"
  | "Berline"
  | "Citadine"
  | "Minibus"
  | "Utilitaire";

export type Vehicle = {
  id: string;
  name: string;
  brand: string;
  type: "Location" | "Vente";
  category: VehicleCategory;
  year: number;
  seats: number;
  transmission: "Automatique" | "Manuelle";
  fuel: "Diesel" | "Essence";
  
  mileage?: number;
  price: number;
  priceUnit: "FCFA/jour" | "FCFA";
  city: string;
  featured: boolean;
  available: boolean;
  
  promo: boolean;
  promoPaused?: boolean;
  promoEndsAt?: string | null;
  withDriver: boolean;
  image: string;
  gallery: string[];
  description: string;
  features: string[];
  created_at?: string;
};


// Catalogue de secours, vide : les annonces MOTOM se publient depuis le back-office (/admin).
export const vehicles: Vehicle[] = [];

export const featuredVehicles = vehicles.filter((v) => v.featured);

export const getVehicleById = (id: string) => vehicles.find((v) => v.id === id);

export const vehicleCategories: readonly VehicleCategory[] = [
  "SUV / 4x4",
  "Pick-up",
  "Berline",
  "Citadine",
  "Minibus",
  "Utilitaire",
];


export const vehicleBrands = [
  "Toyota",
  "Renault",
  "Nissan",
  "Hyundai",
  "Mitsubishi",
  "Kia",
] as const;

export const formatVehiclePrice = (
  price: number,
  unit: Vehicle["priceUnit"],
) => `${price.toLocaleString("fr-FR")} ${unit}`;
