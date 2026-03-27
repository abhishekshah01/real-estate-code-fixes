import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { Bed, Bath, Maximize, MapPin, Phone, Mail, ArrowLeft, Share2, Heart, Check } from 'lucide-react';
import axios from 'axios';
import MapView from '../components/MapView';
import Gallery from '../components/Gallery';
import FavoriteButton from '../components/FavoriteButton';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PropertyDetailPage = () => {
  const { id } = useParams();
  const { t, language } = useLanguage();
  const [property, setProperty] = useState(null);
  const [loading, setLoading] = useState(true);
  const [similarProperties, setSimilarProperties] = useState([]);
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', message: '' });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => { fetchProperty(); }, [id]);

  const fetchProperty = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/properties/${id}`);
      setProperty(response.data);
      const similarRes = await axios.get(`${API_URL}/api/properties?property_type=${response.data.property_type}&limit=3`);
      setSimilarProperties(similarRes.data.filter(p => p.property_id !== id).slice(0, 3));
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const getLocalizedText = (field) => property[`${field}_${language}`] || property[field];
  const formatPrice = (price, currency = 'USD') => new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(price);

  const handleInquirySubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await axios.post(`${API_URL}/api/inquiries`, { ...formData, property_id: property.property_id, inquiry_type: 'property' });
      toast.success(t('contact.success'));
      setFormData({ name: '', email: '', phone: '', message: '' });
    } catch { toast.error(t('contact.error')); }
    finally { setSubmitting(false); }
  };

  const getWhatsAppLink = () => {
    const number = property?.whatsapp_number || '';
    if (!number) return null;
    const cleanNumber = number.replace(/\D/g, '');
    return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(`Hello! I'm interested in: ${getLocalizedText('title')}`)}`;
  };

  if (loading) return (
    <div className="min-h-screen bg-[#FAFAF9] pt-20 flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-stone-200 border-t-[#C2410C] rounded-full animate-spin" />
    </div>
  );

  if (!property) return (
    <div className="min-h-screen bg-[#FAFAF9] pt-20 flex items-center justify-center">
      <div className="text-center"><p className="text-stone-500 text-lg mb-4">{t('common.propertyNotFound')}</p><Link to="/properties" className="btn-primary">{t('properties.backToProperties')}</Link></div>
    </div>
  );

  const whatsappLink = getWhatsAppLink();

  return (
    <div className="min-h-screen bg-[#FAFAF9] pt-16 sm:pt-20" data-testid="property-detail-page">
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 py-4 sm:py-6">
        <Link to="/properties" className="inline-flex items-center gap-2 text-stone-400 hover:text-stone-700 transition-colors text-sm" data-testid="back-link">
          <ArrowLeft className="w-4 h-4" /> {t('properties.backToProperties')}
        </Link>
      </div>

      {/* Hero */}
      <div className="relative h-[45vh] sm:h-[50vh] md:h-[60vh] overflow-hidden">
        <img src={property.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200'}
          alt={getLocalizedText('title')} className="w-full h-full object-cover" data-testid="property-hero-image" />
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

        <div className="absolute top-4 sm:top-6 right-4 sm:right-6 flex gap-2">
          <button onClick={async () => {
              try {
                if (navigator.share) { await navigator.share({ title: getLocalizedText('title'), url: window.location.href }); }
                else { await navigator.clipboard.writeText(window.location.href); toast.success('Link copied to clipboard!'); }
              } catch (e) { if (e.name !== 'AbortError') { await navigator.clipboard.writeText(window.location.href); toast.success('Link copied to clipboard!'); } }
            }}
            className="p-3 bg-stone-900/70 backdrop-blur-sm rounded-full hover:bg-stone-900 transition-colors" data-testid="share-btn">
            <Share2 className="w-5 h-5 text-white" />
          </button>
          <FavoriteButton propertyId={property.property_id} size="default" />
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-8 md:p-12">
          <div className="max-w-[1400px] mx-auto">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="text-white">
              <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.12em] text-white/50 font-semibold mb-2">{property.property_type}</p>
              <h1 className="text-2xl sm:text-3xl md:text-5xl font-semibold mb-2 sm:mb-3 tracking-tight" data-testid="property-title">{getLocalizedText('title')}</h1>
              <div className="flex items-center gap-2 text-white/50 text-sm"><MapPin className="w-4 h-4" /><span>{property.location}</span></div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 py-8 sm:py-12 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
          <div className="lg:col-span-2 space-y-8 sm:space-y-12">
            {/* Price & Specs */}
            <div className="bg-white p-6 sm:p-8 rounded-xl border border-stone-200">
              <p className="text-3xl sm:text-4xl md:text-5xl font-bold text-stone-900 mb-6 sm:mb-8 tracking-tight" data-testid="property-price">
                {formatPrice(property.price, property.currency)}
              </p>
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {[
                  { icon: Bed, value: property.bedrooms, label: t('property.bedrooms') },
                  { icon: Bath, value: property.bathrooms, label: t('property.bathrooms') },
                  { icon: Maximize, value: property.area?.toLocaleString(), label: t('property.sqft') },
                ].map((spec, i) => (
                  <div key={i} className="text-center p-3 sm:p-4 bg-stone-50 rounded-lg border border-stone-100">
                    <spec.icon className="w-5 h-5 mx-auto mb-2 text-stone-400" />
                    <p className="font-bold text-base sm:text-lg text-stone-900">{spec.value}</p>
                    <p className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wider">{spec.label}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Description */}
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-5 tracking-tight">{t('property.description')}</h2>
              <p className="text-stone-500 leading-relaxed text-base sm:text-lg" data-testid="property-description">{getLocalizedText('description')}</p>
            </div>

            {/* Features */}
            {property.features?.length > 0 && (
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-5 tracking-tight">{t('property.features')}</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 sm:gap-3">
                  {property.features.map((feature, index) => (
                    <div key={index} className="flex items-center gap-3 p-3 sm:p-4 bg-stone-50 rounded-lg border border-stone-100" data-testid={`feature-${index}`}>
                      <Check className="w-4 h-4 text-[#C2410C] flex-shrink-0" />
                      <span className="text-stone-600 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Gallery */}
            {property.images?.length > 1 && (
              <div>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-5 tracking-tight">{t('property.gallery')}</h2>
                <Gallery images={property.images} title={getLocalizedText('title')} />
              </div>
            )}

            {/* Map */}
            <div>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-semibold mb-4 sm:mb-5 tracking-tight">{t('property.location')}</h2>
              <div className="relative w-full h-[400px] md:h-[450px] rounded-xl overflow-hidden border border-stone-200">
                <MapView properties={[property]} singleProperty={true} />
              </div>
              <p className="mt-3 text-stone-400 text-sm flex items-center gap-2"><MapPin className="w-3.5 h-3.5" /> {property.address}, {property.city}, {property.country}</p>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 sm:top-28 bg-white p-6 sm:p-8 rounded-xl border border-stone-200">
              <h3 className="text-lg sm:text-xl font-semibold mb-5 sm:mb-6 tracking-tight">{t('property.contactAgent')}</h3>
              <form onSubmit={handleInquirySubmit} className="space-y-4 sm:space-y-5" data-testid="inquiry-form">
                <input type="text" placeholder={t('contact.name')} value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="input-underline w-full" required data-testid="inquiry-name" />
                <input type="email" placeholder={t('contact.email')} value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="input-underline w-full" required data-testid="inquiry-email" />
                <input type="tel" placeholder={t('contact.phone')} value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="input-underline w-full" data-testid="inquiry-phone" />
                <textarea placeholder={t('contact.message')} value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  className="input-underline w-full min-h-[100px] resize-none" required data-testid="inquiry-message" />
                <button type="submit" disabled={submitting} className="btn-primary w-full" data-testid="inquiry-submit">
                  {submitting ? t('common.loading') : t('contact.send')}
                </button>
              </form>
              {whatsappLink && (
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer"
                  className="flex items-center justify-center gap-3 mt-3 sm:mt-4 h-12 bg-[#25D366] text-white font-semibold text-[13px] uppercase tracking-wider rounded-lg hover:bg-[#1da851] transition-colors"
                  data-testid="whatsapp-property-btn">
                  <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
                  </svg>{t('property.whatsapp')}
                </a>
              )}
              <div className="mt-6 sm:mt-8 pt-5 sm:pt-6 border-t border-stone-100 space-y-3">
                <div className="flex items-center gap-3 text-stone-500 text-sm"><Phone className="w-4 h-4" /><span>+00000-00000</span></div>
                <div className="flex items-center gap-3 text-stone-500 text-sm"><Mail className="w-4 h-4" /><span>info@example.com</span></div>
              </div>
            </div>
          </div>
        </div>

        {/* Similar */}
        {similarProperties.length > 0 && (
          <div className="mt-16 sm:mt-24">
            <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold mb-6 sm:mb-8 tracking-tight">{t('property.similarProperties')}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5 sm:gap-6">
              {similarProperties.map((prop) => (
                <Link key={prop.property_id} to={`/properties/${prop.property_id}`} className="group hover-lift rounded-xl overflow-hidden bg-white border border-stone-100" data-testid={`similar-property-${prop.property_id}`}>
                  <div className="aspect-[4/3] overflow-hidden bg-stone-100">
                    <img src={prop.images?.[0] || 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600'}
                      alt={prop.title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  </div>
                  <div className="p-4"><h3 className="font-semibold text-base mb-1 tracking-tight">{prop.title}</h3><p className="text-stone-900 font-bold">{formatPrice(prop.price, prop.currency)}</p></div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertyDetailPage;
