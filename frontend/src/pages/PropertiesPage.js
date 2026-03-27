import React, { useState, useEffect, useRef } from 'react';
import { useLanguage } from '../contexts/LanguageContext';
import { useAuth } from '../contexts/AuthContext';
import { useFavorites } from '../contexts/FavoritesContext';
import { useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import axios from 'axios';
import PropertyCard from '../components/PropertyCard';
import MapView from '../components/MapView';
import { Slider } from '../components/ui/slider';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '../components/ui/select';

const API_URL = process.env.REACT_APP_BACKEND_URL;

const PropertiesPage = () => {
  const { t } = useLanguage();
  const { isAuthenticated } = useAuth();
  const { favoriteIds, favoriteProperties, fetchFavorites } = useFavorites();
  const [searchParams] = useSearchParams();
  const [properties, setProperties] = useState([]);
  const [allProperties, setAllProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [currentPage, setCurrentPage] = useState(1);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const searchRef = useRef(null);
  const propertiesPerPage = 9;

  const [searchQuery, setSearchQuery] = useState(searchParams.get('city') || '');
  const [priceRange, setPriceRange] = useState([0, 5000000]);
  const [bedrooms, setBedrooms] = useState('any');
  const [propertyType, setPropertyType] = useState('all');

  // Fetch all properties on mount for suggestions
  useEffect(() => {
    const fetchAllProperties = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/properties`);
        setAllProperties(response.data);
      } catch (error) { console.error('Error:', error); }
    };
    fetchAllProperties();
  }, []);

  useEffect(() => { 
    fetchProperties(); 
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bedrooms, propertyType]);

  // Fetch favorites when showing favorites only
  useEffect(() => {
    if (showFavoritesOnly && isAuthenticated) {
      fetchFavorites();
    }
  }, [showFavoritesOnly, isAuthenticated, fetchFavorites]);

  // Generate suggestions based on search query
  useEffect(() => {
    if (searchQuery.length > 0) {
      const query = searchQuery.toLowerCase();
      // Get unique cities and locations from properties
      const uniqueLocations = [...new Set(allProperties.flatMap(p => [p.city, p.location, p.address].filter(Boolean)))];
      const filtered = uniqueLocations
        .filter(loc => loc.toLowerCase().includes(query))
        .slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, allProperties]);

  // Close suggestions on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchProperties = async () => {
    setLoading(true);
    try {
      let url = `${API_URL}/api/properties?`;
      const params = [];
      if (propertyType && propertyType !== 'all') params.push(`property_type=${propertyType}`);
      if (priceRange[0] > 0) params.push(`min_price=${priceRange[0]}`);
      if (priceRange[1] < 5000000) params.push(`max_price=${priceRange[1]}`);
      if (bedrooms && bedrooms !== 'any') params.push(`bedrooms=${bedrooms}`);
      if (searchQuery) params.push(`city=${encodeURIComponent(searchQuery)}`);
      const response = await axios.get(url + params.join('&'));
      setProperties(response.data);
    } catch (error) { console.error('Error:', error); }
    finally { setLoading(false); }
  };

  const handleSearch = (e) => { 
    e.preventDefault(); 
    setShowSuggestions(false);
    setCurrentPage(1);
    fetchProperties(); 
  };

  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion);
    setShowSuggestions(false);
    setCurrentPage(1);
    // Trigger search with the selected suggestion
    setTimeout(() => fetchProperties(), 100);
  };

  const clearFilters = () => {
    setSearchQuery(''); setPriceRange([0, 5000000]); setBedrooms('any'); setPropertyType('all'); setCurrentPage(1); setShowFavoritesOnly(false);
    setTimeout(() => fetchProperties(), 100);
  };

  const handleBedroomsChange = (value) => {
    setBedrooms(value);
    setCurrentPage(1);
  };

  const handlePropertyTypeChange = (value) => {
    setPropertyType(value);
    setCurrentPage(1);
  };

  const formatPrice = (price) => {
    if (price >= 1000000) return `$${(price / 1000000).toFixed(1)}M`;
    if (price >= 1000) return `$${(price / 1000).toFixed(0)}K`;
    return `$${price}`;
  };

  // Get displayed properties (either all or favorites only)
  const displayedProperties = showFavoritesOnly ? favoriteProperties : properties;
  const totalPages = Math.ceil(displayedProperties.length / propertiesPerPage);
  const paginatedProperties = displayedProperties.slice((currentPage - 1) * propertiesPerPage, currentPage * propertiesPerPage);
  const goToPage = (page) => { setCurrentPage(page); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  return (
    <div className="min-h-screen bg-[#FAFAF9] pt-16 sm:pt-20" data-testid="properties-page">
      {/* Header */}
      <div className="bg-white border-b border-stone-100">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 py-8 sm:py-10">
          <p className="caption mb-2">{t('properties.subtitle')}</p>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-semibold text-stone-900 tracking-tight">{t('properties.title')}</h1>
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-white border-b border-stone-100 sticky top-16 sm:top-20 z-30">
        <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 py-3 sm:py-4">
          <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
            <form onSubmit={handleSearch} className="flex-1" ref={searchRef}>
              <div className="relative">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#44403c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="absolute left-4 top-1/2 -translate-y-1/2" style={{color:'#44403c'}}><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
                <input type="text" placeholder={t('properties.search') || 'Search by city, location, or address...'} value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => searchQuery.length > 0 && suggestions.length > 0 && setShowSuggestions(true)}
                  className="w-full pl-11 pr-10 py-3 border border-stone-200 bg-stone-50 rounded-lg focus:outline-none focus:border-stone-400 transition-colors text-sm"
                  data-testid="search-input" />
                {searchQuery && (
                  <button type="button" onClick={() => { setSearchQuery(''); setSuggestions([]); setShowSuggestions(false); }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-stone-200 rounded-full transition-colors">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#44403c" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
                  </button>
                )}
                
                {/* Search Suggestions Dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-stone-200 rounded-lg shadow-lg overflow-hidden z-50">
                    {suggestions.map((suggestion, index) => (
                      <button
                        key={index}
                        type="button"
                        onClick={() => handleSuggestionClick(suggestion)}
                        className="w-full px-4 py-3 text-left text-sm hover:bg-stone-50 flex items-center gap-3 border-b border-stone-100 last:border-b-0 transition-colors"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#C2410C" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color:'#C2410C', minWidth:'16px'}}><path d="M20 10c0 4.993-5.539 10.193-7.399 11.799a1 1 0 0 1-1.202 0C9.539 20.193 4 14.993 4 10a8 8 0 0 1 16 0"/><circle cx="12" cy="10" r="3"/></svg>
                        <span className="text-stone-700">{suggestion}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </form>

            <div className="hidden lg:flex items-center gap-2">
              <Select value={propertyType} onValueChange={handlePropertyTypeChange}>
                <SelectTrigger className="w-[150px] rounded-lg h-[46px] border-stone-200 bg-stone-50 text-sm text-left justify-between" data-testid="property-type-select">
                  <SelectValue placeholder={t('properties.propertyType')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('properties.types.all')}</SelectItem>
                  <SelectItem value="apartment">{t('properties.types.apartment')}</SelectItem>
                  <SelectItem value="house">{t('properties.types.house')}</SelectItem>
                  <SelectItem value="villa">{t('properties.types.villa')}</SelectItem>
                  <SelectItem value="commercial">{t('properties.types.commercial')}</SelectItem>
                  <SelectItem value="land">{t('properties.types.land')}</SelectItem>
                </SelectContent>
              </Select>

              <Select value={bedrooms} onValueChange={handleBedroomsChange}>
                <SelectTrigger className="w-[130px] rounded-lg h-[46px] border-stone-200 bg-stone-50 text-sm text-left justify-between" data-testid="bedrooms-select">
                  <SelectValue placeholder={t('properties.bedrooms')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="any">Any</SelectItem>
                  <SelectItem value="1">1 Bed</SelectItem>
                  <SelectItem value="2">2 Beds</SelectItem>
                  <SelectItem value="3">3 Beds</SelectItem>
                  <SelectItem value="4">4 Beds</SelectItem>
                  <SelectItem value="5">5+ Beds</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex items-center gap-2">
              {/* Favorites Filter Button */}
              {isAuthenticated && (
                <button 
                  onClick={() => { setShowFavoritesOnly(!showFavoritesOnly); setCurrentPage(1); }}
                  className={`flex items-center gap-2 px-4 py-3 border text-sm font-medium rounded-lg transition-all ${
                    showFavoritesOnly ? 'bg-red-500 text-white border-red-500' : 'border-stone-200 text-stone-600 hover:border-red-300 hover:text-red-500'
                  }`}
                  data-testid="favorites-filter"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill={showFavoritesOnly ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z"/></svg>
                  <span className="hidden sm:inline">My Wishlist</span>
                  {favoriteIds.length > 0 && (
                    <span className={`text-xs px-1.5 py-0.5 rounded-full ${showFavoritesOnly ? 'bg-white/20' : 'bg-red-100 text-red-600'}`}>
                      {favoriteIds.length}
                    </span>
                  )}
                </button>
              )}
              
              <button onClick={() => setShowFilters(!showFilters)}
                className={`flex items-center gap-2 px-4 py-3 border text-sm font-medium rounded-lg transition-all ${
                  showFilters ? 'bg-stone-900 text-white border-stone-900' : 'border-stone-200 text-stone-600 hover:border-stone-400'
                }`} data-testid="toggle-filters">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1c1917" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{color:'#1c1917'}}><line x1="21" x2="14" y1="4" y2="4"/><line x1="10" x2="3" y1="4" y2="4"/><line x1="21" x2="12" y1="12" y2="12"/><line x1="8" x2="3" y1="12" y2="12"/><line x1="21" x2="16" y1="20" y2="20"/><line x1="12" x2="3" y1="20" y2="20"/><line x1="14" x2="14" y1="2" y2="6"/><line x1="8" x2="8" y1="10" y2="14"/><line x1="16" x2="16" y1="18" y2="22"/></svg>
                <span className="hidden sm:inline">{t('properties.filters')}</span>
              </button>
              <div className="relative flex bg-stone-100 rounded-full p-1" data-testid="view-mode-toggle">
                <div
                  className="absolute top-1 bottom-1 w-[calc(50%-4px)] bg-stone-900 rounded-full transition-all duration-300 ease-out"
                  style={{ left: viewMode === 'grid' ? '4px' : 'calc(50% + 0px)' }}
                />
                <button onClick={() => setViewMode('grid')}
                  className={`relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors duration-300 ${viewMode === 'grid' ? 'text-white' : 'text-stone-500'}`}
                  data-testid="grid-view-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={viewMode === 'grid' ? '#ffffff' : '#1c1917'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{minWidth:'14px'}}><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>
                  List
                </button>
                <button onClick={() => setViewMode('map')}
                  className={`relative z-10 flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-colors duration-300 ${viewMode === 'map' ? 'text-white' : 'text-stone-500'}`}
                  data-testid="map-view-btn">
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke={viewMode === 'map' ? '#ffffff' : '#1c1917'} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{minWidth:'14px'}}><path d="M14.106 5.553a2 2 0 0 0 1.788 0l3.659-1.83A1 1 0 0 1 21 4.619v12.764a1 1 0 0 1-.553.894l-4.553 2.277a2 2 0 0 1-1.788 0l-4.212-2.106a2 2 0 0 0-1.788 0l-3.659 1.83A1 1 0 0 1 3 19.381V6.618a1 1 0 0 1 .553-.894l4.553-2.277a2 2 0 0 1 1.788 0z"/><path d="M15 5.764v15"/><path d="M9 3.236v15"/></svg>
                  Map
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Expanded Filters */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: 'easeInOut' }}
            className="bg-white border-b border-stone-100 overflow-hidden"
            data-testid="expanded-filters"
          >
          <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 py-6 sm:py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
              <div>
                <label className="caption block mb-4">{t('properties.priceRange')}</label>
                <Slider value={priceRange} onValueChange={setPriceRange} min={0} max={5000000} step={50000} className="mb-4" data-testid="price-slider" />
                <div className="flex justify-between text-sm text-stone-500"><span>{formatPrice(priceRange[0])}</span><span>{formatPrice(priceRange[1])}</span></div>
              </div>
              <div className="lg:hidden">
                <label className="caption block mb-4">{t('properties.propertyType')}</label>
                <Select value={propertyType} onValueChange={handlePropertyTypeChange}>
                  <SelectTrigger className="w-full rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="apartment">Apartment</SelectItem>
                    <SelectItem value="house">House</SelectItem>
                    <SelectItem value="villa">Villa</SelectItem>
                    <SelectItem value="commercial">Commercial</SelectItem>
                    <SelectItem value="land">Land</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="lg:hidden">
                <label className="caption block mb-4">{t('properties.bedrooms')}</label>
                <Select value={bedrooms} onValueChange={handleBedroomsChange}>
                  <SelectTrigger className="w-full rounded-lg"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="any">Any</SelectItem>
                    <SelectItem value="1">1 Bed</SelectItem>
                    <SelectItem value="2">2 Beds</SelectItem>
                    <SelectItem value="3">3 Beds</SelectItem>
                    <SelectItem value="4">4 Beds</SelectItem>
                    <SelectItem value="5">5+ Beds</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="flex justify-between items-center mt-6 sm:mt-8 pt-5 border-t border-stone-100">
              <button onClick={clearFilters} className="flex items-center gap-2 text-stone-500 hover:text-stone-900 text-sm" data-testid="clear-filters">
                <X className="w-3.5 h-3.5" /> {t('properties.clearFilters')}
              </button>
              <button onClick={fetchProperties} className="btn-primary text-xs h-10 px-6" data-testid="apply-filters">{t('properties.applyFilters')}</button>
            </div>
          </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Results */}
      <div className="max-w-[1400px] mx-auto px-5 sm:px-8 md:px-12 py-8 sm:py-12">
        <p className="text-stone-400 text-sm mb-6 sm:mb-8" data-testid="results-count">
          {properties.length} {properties.length === 1 ? t('properties.propertyFound') : t('properties.propertiesFound')}
        </p>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">{[1,2,3,4,5,6].map((i) => <div key={i} className="aspect-[4/5] skeleton" />)}</div>
        ) : viewMode === 'grid' ? (
          properties.length > 0 ? (
            <>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 sm:gap-6 md:gap-8">
                {paginatedProperties.map((property, index) => <PropertyCard key={property.property_id} property={property} index={index} />)}
              </div>
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-12 sm:mt-16" data-testid="pagination">
                  {currentPage > 1 && (
                    <button onClick={() => goToPage(currentPage - 1)}
                      className="p-3 border border-stone-200 rounded-lg hover:border-stone-400 transition-colors" data-testid="pagination-prev">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    </button>
                  )}
                  {[...Array(totalPages)].map((_, i) => {
                    const page = i + 1;
                    if (page === 1 || page === totalPages || (page >= currentPage - 1 && page <= currentPage + 1)) {
                      return <button key={page} onClick={() => goToPage(page)}
                        className={`w-11 h-11 rounded-lg text-sm font-semibold transition-colors ${currentPage === page ? 'bg-stone-900 text-white' : 'border border-stone-200 hover:border-stone-400 text-stone-600'}`}
                        data-testid={`pagination-page-${page}`}>{page}</button>;
                    } else if ((page === currentPage - 2 && currentPage > 3) || (page === currentPage + 2 && currentPage < totalPages - 2)) {
                      return <span key={page} className="px-1 text-stone-300">...</span>;
                    }
                    return null;
                  })}
                  {currentPage < totalPages && (
                    <button onClick={() => goToPage(currentPage + 1)}
                      className="p-3 border border-stone-200 rounded-lg hover:border-stone-400 transition-colors" data-testid="pagination-next">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
                    </button>
                  )}
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-20" data-testid="no-results">
              <div className="w-20 h-20 rounded-full bg-stone-100 flex items-center justify-center mx-auto mb-6">
                <MapPin className="w-10 h-10 text-stone-300" />
              </div>
              <h3 className="text-xl font-semibold text-stone-700 mb-2">No properties found</h3>
              {searchQuery ? (
                <p className="text-stone-400 mb-6">
                  We couldn't find any properties in "<span className="font-medium text-stone-600">{searchQuery}</span>"
                </p>
              ) : (
                <p className="text-stone-400 mb-6">No properties match your current filters</p>
              )}
              <button onClick={clearFilters} className="btn-primary" data-testid="no-results-clear">Clear All Filters</button>
            </div>
          )
        ) : (
          <div className="relative w-full h-[500px] md:h-[600px] rounded-xl overflow-hidden border border-stone-200">
            <MapView properties={properties} />
          </div>
        )}
      </div>
    </div>
  );
};

export default PropertiesPage;
