import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import { LocationData, Review } from '../types';
import { PENSACOLA_CENTER } from '../constants';

mapboxgl.accessToken = 'pk.eyJ1IjoicGVuc2Fjb2xhbGlnaHRzIiwiYSI6ImNtaW1ia3BzZzF6MWMzY214N2gyNGhwa2wifQ.OAOw0lFhW50GrIK0R67JBA';

interface MapboxMapProps {
  locations: LocationData[];
  reviews: Review[];
  selectedLocationId: string | null;
  onSelectLocation: (id: string | null) => void;
}

const MapboxMap: React.FC<MapboxMapProps> = ({
  locations,
  reviews,
  selectedLocationId,
  onSelectLocation
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const [mapLoaded, setMapLoaded] = useState(false);

  const getAvgRating = (id: string) => {
    const locReviews = reviews.filter(r => r.locationId === id);
    if (locReviews.length === 0) return null;
    return (locReviews.reduce((acc, curr) => acc + curr.rating, 0) / locReviews.length).toFixed(1);
  };

  const createMarkerElement = () => {
    const el = document.createElement('div');
    el.style.width = '38px';
    el.style.height = '38px';
    el.style.cursor = 'pointer';
    el.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="#dc2626" stroke="#ffffff" stroke-width="1.5" style="filter: drop-shadow(0px 3px 3px rgba(0,0,0,0.3)); width: 100%; height: 100%;">
        <path stroke-linecap="round" stroke-linejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
        <path stroke-linecap="round" stroke-linejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
      </svg>
    `;
    return el;
  };

  const createPopupContent = (loc: LocationData) => {
    const rating = getAvgRating(loc.id);
    const scheduleLines = loc.schedule ? loc.schedule.split('\n').filter(Boolean) : [];

    return `
      <div class="p-3 min-w-[200px]" style="cursor: pointer;">
        <h3 class="font-bold text-gray-900 text-base mb-1">${loc.title}</h3>

        ${rating ? `
          <div class="flex items-center text-amber-500 text-sm font-bold mb-2">
            <span class="mr-1">★</span> ${rating}
          </div>
        ` : ''}

        <p class="text-xs text-gray-600 truncate max-w-[220px] mb-2">${loc.address || ''}</p>

        ${scheduleLines.length > 0 ? `
          <div class="space-y-1 mb-2">
            ${scheduleLines.slice(0, 2).map(line => `
              <p class="text-xs text-blue-600 flex items-center">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3 mr-1 flex-shrink-0">
                  <circle cx="12" cy="12" r="10"/>
                  <polyline points="12 6 12 12 16 14"/>
                </svg>
                ${line}
              </p>
            `).join('')}
            ${scheduleLines.length > 2 ? '<p class="text-xs text-gray-400">+ more times...</p>' : ''}
          </div>
        ` : ''}

        ${loc.radioStation ? `
          <p class="text-xs flex items-center text-purple-600">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="w-3 h-3 mr-1 flex-shrink-0">
              <path d="M4.9 16.1C1 12.2 1 5.8 4.9 1.9"/>
              <path d="M7.8 4.7a6.14 6.14 0 0 0-.8 7.5"/>
              <circle cx="12" cy="9" r="2"/>
              <path d="M16.2 4.7a6.14 6.14 0 0 1 .8 7.5"/>
              <path d="M19.1 1.9a10.14 10.14 0 0 1 0 14.2"/>
              <path d="M9.5 18h5"/>
              <path d="m8 22 4-11 4 11"/>
            </svg>
            Tune to ${loc.radioStation}
          </p>
        ` : ''}

        <p class="text-[10px] text-gray-400 mt-2 italic">Click for details →</p>
      </div>
    `;
  };

  // Initialize map
  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: 'mapbox://styles/mapbox/light-v11',
      center: [PENSACOLA_CENTER[1], PENSACOLA_CENTER[0]], // [lng, lat]
      zoom: 12
    });

    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');

    map.current.on('load', () => {
      setMapLoaded(true);
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Add markers when map is loaded or locations change
  useEffect(() => {
    if (!map.current || !mapLoaded) return;

    // Clear existing markers
    markersRef.current.forEach(marker => marker.remove());
    markersRef.current = [];

    // Add new markers
    locations.forEach(location => {
      const el = createMarkerElement();

      const popup = new mapboxgl.Popup({
        offset: 25,
        closeButton: true,
        closeOnClick: false
      }).setHTML(createPopupContent(location));

      const marker = new mapboxgl.Marker(el)
        .setLngLat([location.lng, location.lat])
        .setPopup(popup)
        .addTo(map.current!);

      // Click handler
      el.addEventListener('click', () => {
        onSelectLocation(location.id);
      });

      markersRef.current.push(marker);
    });
  }, [locations, reviews, mapLoaded, onSelectLocation]);

  // Fly to selected location
  useEffect(() => {
    if (!map.current || !mapLoaded || !selectedLocationId) return;

    const selectedLoc = locations.find(l => l.id === selectedLocationId);
    if (selectedLoc) {
      map.current.flyTo({
        center: [selectedLoc.lng, selectedLoc.lat],
        zoom: 13,
        duration: 1000
      });
    }
  }, [selectedLocationId, locations, mapLoaded]);

  return (
    <div
      ref={mapContainer}
      className="h-full w-full z-0 relative"
      style={{ background: '#f8fafc' }}
    />
  );
};

export default MapboxMap;
