import React from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { Bed, Bath, Maximize, MapPin } from 'lucide-react';
import { motion } from 'framer-motion';
import FavoriteButton from './FavoriteButton';

const PropertyCard = ({ property, index = 0 }) => {
  const { t, language } = useLanguage();

  const getLocalizedTitle = () => property[`title_${language}`] || property.title;

  const formatPrice = (price, currency = 'USD') =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: index * 0.08, ease: [0.23, 1, 0.32, 1] }}
      className="group rounded-2xl overflow-hidden bg-white transition-all duration-500"
      style={{ boxShadow: '0 2px 12px rgba(0,0,0,0.06)' }}
      onMouseEnter={(e) => { e.currentTarget.style.boxShadow = '0 16px 48px -8px rgba(0,0,0,0.14)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
      onMouseLeave={(e) => { e.currentTarget.style.boxShadow = '0 2px 12px rgba(0,0,0,0.06)'; e.currentTarget.style.transform = 'translateY(0)'; }}
      data-testid={`property-card-${property.property_id}`}
    >
      <Link to={`/properties/${property.property_id}`} className="block">
        {/* Image Section */}
        <div className="relative aspect-[16/10] overflow-hidden">
          <img
            src={property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=800'}
            alt={getLocalizedTitle()}
            className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            loading="lazy"
          />

          {property.status !== 'available' && (
            <div className="absolute top-3 left-3">
              <span className={`badge-${property.status}`}>
                {t(`properties.status.${property.status}`)}
              </span>
            </div>
          )}

          {/* Favorite Button */}
          <div className="absolute top-3 right-3 z-10">
            <FavoriteButton propertyId={property.property_id} size="default" />
          </div>

          {property.is_featured && (
            <div className="absolute top-3 left-3">
              <span className="bg-[#C2410C] text-white px-3 py-1 text-[10px] font-semibold uppercase tracking-wider rounded-full">
                {t('hero.featured')}
              </span>
            </div>
          )}

          {/* Price overlay */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent p-4 sm:p-5">
            <p className="text-xl sm:text-2xl font-bold text-white tracking-tight">
              {formatPrice(property.price, property.currency)}
            </p>
          </div>
        </div>

        {/* Details Section */}
        <div className="p-4 sm:p-5">
          <p className="text-[10px] uppercase tracking-[0.15em] text-[#C2410C] font-semibold mb-1">
            {property.property_type}
          </p>
          <h3 className="text-base sm:text-lg font-semibold leading-tight tracking-tight text-stone-900 mb-1.5">
            {getLocalizedTitle()}
          </h3>
          <div className="flex items-center gap-1.5 text-stone-400 text-xs sm:text-sm mb-3">
            <MapPin className="w-3.5 h-3.5" />
            <span>{property.location}</span>
          </div>
          <div className="flex items-center gap-4 sm:gap-5 pt-3 border-t border-stone-100 text-stone-500">
            <div className="flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-stone-400" />
              <span className="text-xs sm:text-sm font-medium">{property.bedrooms} Beds</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Bath className="w-4 h-4 text-stone-400" />
              <span className="text-xs sm:text-sm font-medium">{property.bathrooms} Baths</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Maximize className="w-4 h-4 text-stone-400" />
              <span className="text-xs sm:text-sm font-medium">{property.area?.toLocaleString()} ft²</span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

export default PropertyCard;
