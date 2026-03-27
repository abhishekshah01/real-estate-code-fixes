import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext();

const API_URL = process.env.REACT_APP_BACKEND_URL;

export const useFavorites = () => {
  const context = useContext(FavoritesContext);
  if (!context) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
};

export const FavoritesProvider = ({ children }) => {
  const { user, isAuthenticated } = useAuth();
  const [favoriteIds, setFavoriteIds] = useState([]);
  const [favoriteProperties, setFavoriteProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch favorite IDs when user logs in
  const fetchFavoriteIds = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoriteIds([]);
      return;
    }
    
    try {
      const response = await axios.get(`${API_URL}/api/favorites/ids`, {
        withCredentials: true
      });
      setFavoriteIds(response.data.property_ids || []);
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavoriteIds([]);
    }
  }, [isAuthenticated]);

  // Fetch full favorite properties with details
  const fetchFavorites = useCallback(async () => {
    if (!isAuthenticated) {
      setFavoriteProperties([]);
      return [];
    }
    
    setLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/favorites`, {
        withCredentials: true
      });
      setFavoriteProperties(response.data.properties || []);
      setFavoriteIds(response.data.favorites?.map(f => f.property_id) || []);
      return response.data.properties || [];
    } catch (error) {
      console.error('Error fetching favorites:', error);
      setFavoriteProperties([]);
      return [];
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated]);

  // Add property to favorites
  const addFavorite = async (propertyId) => {
    if (!isAuthenticated) {
      return { success: false, requiresLogin: true };
    }
    
    try {
      await axios.post(`${API_URL}/api/favorites/${propertyId}`, {}, {
        withCredentials: true
      });
      setFavoriteIds(prev => [...prev, propertyId]);
      return { success: true };
    } catch (error) {
      console.error('Error adding favorite:', error);
      return { success: false, error: error.message };
    }
  };

  // Remove property from favorites
  const removeFavorite = async (propertyId) => {
    if (!isAuthenticated) {
      return { success: false, requiresLogin: true };
    }
    
    try {
      await axios.delete(`${API_URL}/api/favorites/${propertyId}`, {
        withCredentials: true
      });
      setFavoriteIds(prev => prev.filter(id => id !== propertyId));
      setFavoriteProperties(prev => prev.filter(p => p.property_id !== propertyId));
      return { success: true };
    } catch (error) {
      console.error('Error removing favorite:', error);
      return { success: false, error: error.message };
    }
  };

  // Toggle favorite status
  const toggleFavorite = async (propertyId) => {
    if (isFavorite(propertyId)) {
      return removeFavorite(propertyId);
    } else {
      return addFavorite(propertyId);
    }
  };

  // Check if property is favorited
  const isFavorite = (propertyId) => {
    return favoriteIds.includes(propertyId);
  };

  // Fetch favorites when user changes
  useEffect(() => {
    if (isAuthenticated) {
      fetchFavoriteIds();
    } else {
      setFavoriteIds([]);
      setFavoriteProperties([]);
    }
  }, [isAuthenticated, fetchFavoriteIds]);

  const value = {
    favoriteIds,
    favoriteProperties,
    loading,
    fetchFavorites,
    fetchFavoriteIds,
    addFavorite,
    removeFavorite,
    toggleFavorite,
    isFavorite,
    favoritesCount: favoriteIds.length
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
};

export default FavoritesContext;
