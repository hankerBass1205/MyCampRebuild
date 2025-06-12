'use client';
import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export default function Map({ lat, lng, name, address }) {
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // 檢測是否為移動設備
  const isMobileDevice = () => {
    return (typeof window !== "undefined") && 
           (navigator.userAgent.match(/iPhone|iPad|iPod|Android|webOS|BlackBerry|Windows Phone/i));
  };

  // 檢測是否為 iOS 設備
  const isIOSDevice = () => {
    return (typeof window !== "undefined") && 
           (navigator.userAgent.match(/iPhone|iPad|iPod/i));
  };

  // 生成導航連結
  const getNavigationLinks = (lat, lng, address) => {
    const encodedAddress = encodeURIComponent(address);
    const encodedName = encodeURIComponent(name);
    
    return {
      google: `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&destination_place_id=${encodedName}&travelmode=driving`,
      searchLocation: `https://www.google.com/maps/search/?api=1&query=${encodedAddress}`
    };
  };

  useEffect(() => {
    if (typeof window !== 'undefined' && lat && lng) {
      if (!mapRef.current) {
        const map = L.map('map').setView([lat, lng], 15);
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '© OpenStreetMap contributors'
        }).addTo(map);

        const links = getNavigationLinks(lat, lng, address);

        const popupContent = `
          <div class="p-4 min-w-[280px]">
            <h3 class="text-lg font-semibold text-gray-900 mb-1">${name}</h3>
            <p class="text-sm text-gray-600 mb-4">${address}</p>
            
            <div class="space-y-2">
              <a href="${links.google}" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 class="flex items-center justify-center w-full px-4 py-3 bg-[#4285f4] hover:bg-[#3367d6] text-white text-sm font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow group">
                <svg class="w-4 h-4 mr-2 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0C5.383 0 0 5.383 0 12s5.383 12 12 12 12-5.383 12-12S18.617 0 12 0z"/>
                </svg>
                <span class="text-white font-medium">
                  ${isMobileDevice() ? '開始導航' : '在 Google Maps 查看路線'}
                </span>
              </a>

              <a href="${links.searchLocation}" 
                 target="_blank" 
                 rel="noopener noreferrer"
                 class="flex items-center justify-center w-full px-4 py-3 bg-[#00c853] hover:bg-[#00a844] text-white text-sm font-medium rounded-md transition-all duration-200 shadow-sm hover:shadow group">
                <svg class="w-4 h-4 mr-2 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
                </svg>
                <span class="text-white font-medium">
                  查看詳細位置
                </span>
              </a>
            </div>
          </div>
        `;

        markerRef.current = L.marker([lat, lng])
          .addTo(map)
          .bindPopup(popupContent, {
            maxWidth: 320,
            className: 'custom-popup rounded-lg shadow-lg'
          })
          .openPopup();

        mapRef.current = map;
      } else {
        mapRef.current.setView([lat, lng], 15);
        markerRef.current.setLatLng([lat, lng]);
      }
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
        markerRef.current = null;
      }
    };
  }, [lat, lng, name, address]);

  return (
    <>
      <div id="map" className="h-full w-full" />
      <style jsx global>{`
        .leaflet-popup-content-wrapper {
          padding: 0;
          overflow: hidden;
          border-radius: 8px;
        }
        .leaflet-popup-content {
          margin: 0;
          min-width: 280px;
        }
        .leaflet-container a {
          text-decoration: none;
        }
        .leaflet-popup-tip-container {
          margin-top: -1px;
        }
        .leaflet-popup-content a span,
        .leaflet-popup-content a svg {
          color: white !important;
        }
      `}</style>
    </>
  );
} 