import React from 'react';
import { useFavorites } from '../contexts/FavoritesContext';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const FavoriteButton = ({ propertyId, className = "", size = "default" }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { isAuthenticated, login } = useAuth();
  
  const isFav = isFavorite(propertyId);
  
  const sizeClasses = {
    small: "w-9 h-9",
    default: "w-11 h-11",
    large: "w-14 h-14"
  };
  
  const iconSizes = {
    small: 18,
    default: 22,
    large: 26
  };

  const handleClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast.info('Please login to save favorites', {
        action: {
          label: 'Login',
          onClick: () => login()
        }
      });
      return;
    }
    
    const result = await toggleFavorite(propertyId);
    
    if (result.success) {
      if (isFav) {
        toast.success('Removed from favorites');
      } else {
        toast.success('Added to favorites');
      }
    } else if (result.requiresLogin) {
      toast.info('Please login to save favorites', {
        action: {
          label: 'Login',
          onClick: () => login()
        }
      });
    } else {
      toast.error('Something went wrong');
    }
  };

  return (
    <button
      onClick={handleClick}
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center transition-all duration-300 shadow-lg hover:scale-110 ${className}`}
      style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
      title={isFav ? 'Remove from favorites' : 'Add to favorites'}
      data-testid={`favorite-btn-${propertyId}`}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width={iconSizes[size]}
        height={iconSizes[size]}
        viewBox="0 0 24 24"
        fill={isFav ? '#ef4444' : 'none'}
        stroke={isFav ? '#ef4444' : '#ffffff'}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{ transition: 'all 0.3s ease', filter: 'drop-shadow(0 1px 2px rgba(0,0,0,0.3))' }}
      >
        <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
      </svg>
    </button>
  );
};

export default FavoriteButton;
