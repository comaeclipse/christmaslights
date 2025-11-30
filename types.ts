export interface LocationData {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  featured?: boolean;
  address?: string;
  schedule?: string;
  notes?: string;
  radioStation?: string;
}

export interface Review {
  id: string;
  locationId: string;
  rating: number; // 1 to 5
  text: string;
  date: string;
  author: string;
}