import { LocationData, Review, CaptchaChallenge, LocationSubmission } from '../types';

const API_BASE = '/api'; // Works for both Vercel dev (port 3000) and production

class ApiClient {
  async getLocations(): Promise<LocationData[]> {
    const res = await fetch(`${API_BASE}/locations`);
    if (!res.ok) throw new Error('Failed to fetch locations');
    return res.json();
  }

  async getLocation(id: string): Promise<LocationData> {
    const res = await fetch(`${API_BASE}/locations/${id}`);
    if (!res.ok) throw new Error('Failed to fetch location');
    return res.json();
  }

  async getReviews(locationId?: string): Promise<Review[]> {
    const url = locationId
      ? `${API_BASE}/reviews?location_id=${locationId}`
      : `${API_BASE}/reviews`;
    const res = await fetch(url);
    if (!res.ok) throw new Error('Failed to fetch reviews');
    return res.json();
  }

  async createReview(review: {
    locationId: string;
    rating: number;
    text: string;
    author?: string;
  }): Promise<Review> {
    const res = await fetch(`${API_BASE}/reviews`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        location_id: review.locationId,
        rating: review.rating,
        text: review.text,
        author: review.author || 'A Festive Visitor',
      }),
    });
    if (!res.ok) throw new Error('Failed to create review');
    return res.json();
  }

  async getCaptcha(): Promise<CaptchaChallenge> {
    const res = await fetch(`${API_BASE}/captcha`);
    if (!res.ok) throw new Error('Failed to load captcha');
    return res.json();
  }

  async submitLocation(data: {
    address: string;
    additionalInfo?: string;
    captchaAnswer: number;
    captchaToken: string;
  }): Promise<LocationSubmission> {
    const res = await fetch(`${API_BASE}/submissions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error || 'Submission failed');
    }
    return res.json();
  }

  async adminLogin(password: string): Promise<{ token: string }> {
    const res = await fetch(`${API_BASE}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password }),
    });
    if (!res.ok) throw new Error('Login failed');
    return res.json();
  }

  async adminCreateLocation(
    location: Omit<LocationData, 'id'>,
    token: string
  ): Promise<LocationData> {
    const res = await fetch(`${API_BASE}/admin/locations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(location),
    });
    if (!res.ok) {
      const error: any = new Error('Failed to create location');
      error.status = res.status;
      throw error;
    }
    return res.json();
  }

  async adminUpdateLocation(
    id: string,
    updates: Partial<LocationData>,
    token: string
  ): Promise<LocationData> {
    const res = await fetch(`${API_BASE}/admin/locations/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      const error: any = new Error('Failed to update location');
      error.status = res.status;
      throw error;
    }
    return res.json();
  }

  async adminDeleteLocation(id: string, token: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/locations/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const error: any = new Error('Failed to delete location');
      error.status = res.status;
      throw error;
    }
  }

  async adminGetReviews(token: string): Promise<(Review & { ipAddress?: string; locationTitle?: string })[]> {
    const res = await fetch(`${API_BASE}/admin/reviews`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const error: any = new Error('Failed to fetch reviews');
      error.status = res.status;
      throw error;
    }
    return res.json();
  }

  async adminDeleteReview(id: string, token: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/reviews/${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const error: any = new Error('Failed to delete review');
      error.status = res.status;
      throw error;
    }
  }

  async adminGetSubmissions(token: string): Promise<LocationSubmission[]> {
    const res = await fetch(`${API_BASE}/admin/submissions`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const error: any = new Error('Failed to fetch submissions');
      error.status = res.status;
      throw error;
    }
    return res.json();
  }

  async adminDeleteSubmission(id: string, token: string): Promise<void> {
    const res = await fetch(`${API_BASE}/admin/submissions?id=${id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      const error: any = new Error('Failed to delete submission');
      error.status = res.status;
      throw error;
    }
  }
}

export const api = new ApiClient();
