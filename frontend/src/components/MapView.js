import React, { useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

// Custom red pin marker for single property
const createPinMarker = () => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="
      width: 32px; height: 42px; position: relative;
    ">
      <svg viewBox="0 0 32 42" fill="none" xmlns="http://www.w3.org/2000/svg" style="width:32px;height:42px;">
        <path d="M16 0C7.164 0 0 7.164 0 16c0 12 16 26 16 26s16-14 16-26C32 7.164 24.836 0 16 0z" fill="#C2410C"/>
        <circle cx="16" cy="15" r="6" fill="white"/>
      </svg>
    </div>`,
    iconSize: [32, 42],
    iconAnchor: [16, 42],
    popupAnchor: [0, -42]
  });
};

// Custom price marker for multi-property view
const createPriceMarker = (price, isFeatured = false) => {
  const formatPrice = (p) => {
    if (p >= 1000000) return `$${(p / 1000000).toFixed(1)}M`;
    if (p >= 1000) return `$${(p / 1000).toFixed(0)}K`;
    return `$${p}`;
  };

  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div class="custom-price-marker ${isFeatured ? 'featured' : ''}">${formatPrice(price)}</div>`,
    iconSize: [80, 30],
    iconAnchor: [40, 30],
    popupAnchor: [0, -30]
  });
};

// Map bounds adjuster component
const MapBoundsAdjuster = ({ properties }) => {
  const map = useMap();

  useEffect(() => {
    if (properties.length > 0) {
      const bounds = L.latLngBounds(
        properties.map(p => [p.latitude, p.longitude])
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [properties, map]);

  return null;
};

const MapView = ({ properties, center, zoom = 4, singleProperty = false }) => {
  const { language, t } = useLanguage();

  // Filter out properties without valid coordinates
  const validProperties = properties.filter(p => 
    p.latitude != null && p.longitude != null && 
    !isNaN(p.latitude) && !isNaN(p.longitude)
  );

  const getLocalizedTitle = (property) => {
    const titleKey = `title_${language}`;
    return property[titleKey] || property.title;
  };

  const formatPrice = (price, currency = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
      maximumFractionDigits: 0
    }).format(price);
  };

  // Default center (USA)
  const defaultCenter = center || [39.8283, -98.5795];

  // For single property, use its coordinates
  const mapCenter = singleProperty && validProperties.length > 0
    ? [validProperties[0].latitude, validProperties[0].longitude]
    : defaultCenter;

  const mapZoom = singleProperty ? 15 : zoom;

  // Don't render map if no valid properties for single property view
  if (singleProperty && validProperties.length === 0) {
    return (
      <div className="map-container flex items-center justify-center bg-stone-100 rounded-xl" data-testid="map-view" style={{ height: '100%', width: '100%' }}>
        <p className="text-stone-400 text-sm">Map location not available</p>
      </div>
    );
  }

  return (
    <div className="map-container" data-testid="map-view">
      <MapContainer
        center={mapCenter}
        zoom={mapZoom}
        scrollWheelZoom={true}
        style={{ height: '100%', width: '100%', borderRadius: '12px' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://carto.com/">CARTO</a>'
          url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
        />

        {!singleProperty && validProperties.length > 1 && (
          <MapBoundsAdjuster properties={validProperties} />
        )}

        {validProperties.map((property) => (
          <Marker
            key={property.property_id}
            position={[property.latitude, property.longitude]}
            icon={singleProperty ? createPinMarker() : createPriceMarker(property.price, property.is_featured)}
          >
            <Popup>
              <div className="p-2 min-w-[200px]">
                <img
                  src={property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=400'}
                  alt={getLocalizedTitle(property)}
                  className="w-full h-32 object-cover mb-2 rounded"
                />
                <h4 className="font-semibold text-base mb-1">
                  {getLocalizedTitle(property)}
                </h4>
                <p className="text-stone-500 text-sm mb-1">{property.location}</p>
                <p className="font-bold text-[#C2410C] text-lg mb-2">
                  {formatPrice(property.price, property.currency)}
                </p>
                {!singleProperty && (
                  <Link
                    to={`/properties/${property.property_id}`}
                    className="block text-center bg-[#C2410C] text-white py-2 px-4 text-sm font-semibold rounded-lg hover:bg-[#9A3412] transition-colors"
                  >
                    {t('properties.viewDetails')}
                  </Link>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
};

export default MapView;
