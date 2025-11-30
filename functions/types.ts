export interface Env {
  DB: D1Database;
  GEMINI_API_KEY: string;
  ADMIN_PASSWORD: string;
  JWT_SECRET: string;
}

export interface LocationData {
  id: string;
  title: string;
  description: string;
  lat: number;
  lng: number;
  featured?: number;
  address?: string;
  schedule?: string;
}

export interface Review {
  id: string;
  location_id: string;
  rating: number;
  text: string;
  author: string;
  date: string;
}
