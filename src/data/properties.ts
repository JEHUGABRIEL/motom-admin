export type Property = {
  id: string;
  title: string;
  type: "Vente" | "Location";
  category: "Villa" | "Maison" | "Appartement" | "Terrain" | "Bureau" | "Studio";
  city: string;
  neighborhood: string;
  price: number;
  priceUnit: "FCFA" | "FCFA/mois" | "FCFA/nuit";
  bedrooms: number;
  bathrooms: number;
  area: number;
  featured: boolean;
  promo: boolean;
  promoPaused?: boolean;
  promoEndsAt?: string | null;
  image: string;
  gallery: string[];
  description: string;
  features: string[];
  created_at?: string;
};


// Catalogue de secours, vide : les annonces MOTOM se publient depuis le back-office (/admin).
export const properties: Property[] = [];

export const featuredProperties = properties.filter((p) => p.featured);

export const getPropertyById = (id: string) =>
  properties.find((p) => p.id === id);

export const formatPrice = (price: number, unit: Property["priceUnit"]) =>
  `${price.toLocaleString("fr-FR")} ${unit}`;
