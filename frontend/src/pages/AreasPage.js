import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useLanguage } from '../contexts/LanguageContext';
import { motion } from 'framer-motion';
import { MapPin, TrendingUp, Home, Building, ArrowRight, Star, Shield, TreePine, Coffee, GraduationCap, Train, RefreshCw } from 'lucide-react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const AreasPage = () => {
  const { t } = useLanguage();
  const [areas, setAreas] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAreas = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/areas`);
        setAreas(response.data);
      } catch (error) {
        console.error('Error fetching areas:', error);
        setAreas([]);
      } finally {
        setLoading(false);
      }
    };
    fetchAreas();
  }, []);

  const ScoreBar = ({ score, label, icon: Icon }) => (
    <div className="flex items-center gap-3">
      <Icon className="w-4 h-4 text-stone-400 flex-shrink-0" />
      <div className="flex-1">
        <div className="flex justify-between mb-1">
          <span className="text-xs text-stone-500">{label}</span>
          <span className="text-xs font-semibold text-stone-700">{score}/100</span>
        </div>
        <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            whileInView={{ width: `${score}%` }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className={`h-full rounded-full ${score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-amber-400' : 'bg-red-400'}`}
          />
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAF9] pt-16 sm:pt-20 flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="w-8 h-8 text-[#C2410C] animate-spin mx-auto mb-3" />
          <p className="text-stone-400 text-sm">Loading areas...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAF9] pt-16 sm:pt-20" data-testid="areas-page">
      {/* Hero Header */}
      <div className="relative bg-stone-900 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute inset-0" style={{backgroundImage: 'radial-gradient(circle at 30% 50%, rgba(194,65,12,0.3), transparent 50%), radial-gradient(circle at 70% 80%, rgba(194,65,12,0.15), transparent 50%)'}} />
        </div>
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 py-12 sm:py-16 md:py-20 relative">
          <p className="caption text-orange-400 mb-2">{t('areas.subtitle')}</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold mb-4 text-white tracking-tight">{t('areas.title')}</h1>
          <p className="text-stone-400 text-sm sm:text-base max-w-2xl leading-relaxed">{t('areas.description')}</p>

          {/* Quick Jump Navigation */}
          {areas.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8">
              {areas.map((area) => (
                <a
                  key={area.area_id}
                  href={`#area-${area.area_id}`}
                  className="px-4 py-2 bg-white/10 hover:bg-[#C2410C] border border-white/10 hover:border-[#C2410C] rounded-full text-xs sm:text-sm font-medium transition-all duration-300"
                  data-testid={`area-jump-${area.area_id}`}
                >
                  {area.name}
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Areas Listing */}
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 py-12 sm:py-16 md:py-24">
        {areas.length === 0 ? (
          <div className="text-center py-16">
            <MapPin className="w-12 h-12 text-stone-300 mx-auto mb-4" />
            <p className="text-stone-500">No areas found. Add areas from the admin panel.</p>
          </div>
        ) : (
          <div className="space-y-24 sm:space-y-32 md:space-y-40">
            {areas.map((area, index) => (
              <motion.div
                key={area.area_id}
                id={`area-${area.area_id}`}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.05 }}
                data-testid={`area-${area.area_id}`}
                className="pb-8 sm:pb-12 border-b border-stone-200 last:border-b-0 last:pb-0"
              >
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
                  {/* Image */}
                  <div className={index % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="aspect-[4/3] overflow-hidden bg-stone-100 rounded-2xl relative group">
                      <img src={area.image || 'https://via.placeholder.com/800x600?text=No+Image'} alt={area.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="flex items-center gap-2 text-white text-sm mb-3">
                          <MapPin className="w-4 h-4" />
                          <span className="font-medium">{area.name}, {area.state}</span>
                        </div>
                        <Link 
                          to={`/properties?city=${area.name}`} 
                          className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#C2410C] hover:bg-[#EA580C] text-white text-sm font-semibold rounded-lg transition-all duration-300 shadow-lg hover:shadow-xl" 
                          data-testid={`area-link-${area.area_id}`}
                        >
                          {t('areas.viewPropertiesIn')} {area.name} <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className={index % 2 === 1 ? 'lg:order-1' : ''}>
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-3 py-1 bg-orange-50 text-[#C2410C] text-xs font-bold uppercase tracking-wider rounded">
                        {(() => { const key = area.highlights?.[0]; if (!key) return 'Featured'; const translated = t(`areas.highlights.${key}`); return translated === `areas.highlights.${key}` ? key.replace(/([A-Z])/g, ' $1').trim() : translated; })()}
                      </span>
                      <span className="flex items-center gap-1 text-emerald-600 text-xs font-semibold">
                        <TrendingUp className="w-3 h-3" /> {area.price_change}
                      </span>
                    </div>

                    <h2 className="text-2xl sm:text-3xl md:text-4xl font-semibold tracking-tight mb-3">{area.name}</h2>
                    <p className="text-stone-500 text-sm sm:text-base leading-relaxed mb-6">{area.description}</p>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-stone-50 rounded-xl">
                      <div>
                        <p className="text-lg sm:text-xl font-bold text-[#C2410C]">{area.avg_price}</p>
                        <p className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wide">{t('areas.avgPrice')}</p>
                      </div>
                      <div>
                        <p className="text-lg sm:text-xl font-bold text-stone-900">{area.properties_count}</p>
                        <p className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wide">{t('areas.listings')}</p>
                      </div>
                      <div>
                        <p className="text-lg sm:text-xl font-bold text-emerald-600">{area.price_change}</p>
                        <p className="text-[10px] sm:text-xs text-stone-400 uppercase tracking-wide">{t('areas.yearGrowth')}</p>
                      </div>
                    </div>

                    {/* Scores */}
                    <div className="space-y-3 mb-5 sm:mb-6">
                      <ScoreBar score={area.walk_score || 0} label={t('areas.walkScore')} icon={Coffee} />
                      <ScoreBar score={area.transit_score || 0} label={t('areas.transitScore')} icon={Train} />
                      <ScoreBar score={area.bike_score || 0} label={t('areas.bikeScore')} icon={TreePine} />
                    </div>

                    {/* Community Ratings */}
                    <div className="flex flex-wrap gap-3 mb-5 sm:mb-6">
                      <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border border-stone-200 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <GraduationCap className="w-5 h-5 text-[#C2410C]" />
                        </div>
                        <span className="text-sm text-stone-500">Schools</span>
                        <span className="text-sm font-bold text-stone-900">{area.school_rating || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border border-stone-200 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <Shield className="w-5 h-5 text-[#C2410C]" />
                        </div>
                        <span className="text-sm text-stone-500">Safety</span>
                        <span className="text-sm font-bold text-stone-900">{area.safety_rating || 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 px-4 py-3 bg-white rounded-lg border border-stone-200 shadow-sm">
                        <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                          <Star className="w-5 h-5 text-[#C2410C]" />
                        </div>
                        <span className="text-sm text-stone-500">Lifestyle</span>
                        <span className="text-sm font-bold text-stone-900">{area.lifestyle_rating || 'N/A'}</span>
                      </div>
                    </div>

                    {/* Local Amenities */}
                    <div className="flex flex-wrap gap-2">
                      {(area.amenities || []).map((a, i) => (
                        <span key={i} className="px-3 py-1.5 bg-orange-50 text-[#C2410C] text-[10px] sm:text-xs font-semibold rounded-full">
                          {a}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default AreasPage;
