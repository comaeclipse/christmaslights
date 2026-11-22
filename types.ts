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
  // Admin only: season this house is confirmed for, and whether that's the current one.
  activeSeason?: number | null;
  isActive?: boolean;
}

export interface Review {
  id: string;
  locationId: string;
  rating: number; // 1 to 5
  text: string;
  date: string;
  author: string;
}

export interface LocationSubmission {
  id: string;
  address: string;
  additionalInfo?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  ipAddress?: string;
}

export interface CaptchaChallenge {
  question: string;
  token: string;
}