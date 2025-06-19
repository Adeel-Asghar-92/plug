import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from './AuthContext';

const FavoritesContext = createContext();

export function FavoritesProvider({ children }) {
  const [favorites, setFavorites] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const { user } = useAuth();

  const fetchFavorites = useCallback(async () => {
    if (!user) {
      setError('Please log in to view your favorites');
      return;
    }
    
    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASEURL}/api/user/favorites`, { email: user.email }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      debugger
      setFavorites(response.data.products || []);
      setError(null);
    } catch (err) {
      setError('Failed to fetch favorites');
      console.error('Error fetching favorites:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchFavorites();
  }, [fetchFavorites]);

  const toggleFavorite = useCallback(async (product) => {
    if (!user) {
      setError('Please log in to manage your favorites');
      return;
    }

    if (!product || !product._id) {
      setError('Invalid product data');
      return;
    }

    setLoading(true);
    try {
      const response = await axios.post(`${process.env.REACT_APP_API_BASEURL}/api/user/toggleFavorite`,{}, {
        headers: { Authorization: `Bearer ${user.token}` },
        params: { email: user.email, id: product._id }
      });
      debugger

      if (response.data.isFavorited) {
        setFavorites(prev => [...prev, { ...product, isFavorited: true }]);
      } else {
        setFavorites(prev => prev.filter(fav => fav._id !== product._id));
      }
      setError(null);
    } catch (err) {
      setError('Failed to update favorite status');
      console.error('Error toggling favorite:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  const isFavorite = useCallback((productId) => {
    return favorites.some(fav => fav._id === productId);
  }, [favorites]);

  const clearFavorites = useCallback(() => {
    if (!user) {
      setError('Please log in to manage your favorites');
      return;
    }

    setLoading(true);
    axios.delete(`${process.env.REACT_APP_API_BASEURL}/api/user/favorites`, {
      headers: { Authorization: `Bearer ${user.token}` }
    })
      .then(response => {
          // localStorage.removeItem(getStorageKey());
          setFavorites([]);
          setError(null);
      })
      .catch(err => {
        setError('Failed to clear favorites');
        console.error('Error clearing favorites:', err);
      })
      .finally(() => setLoading(false));
  }, [user]);

  const getFavoritesCount = useCallback(() => {
    return favorites.length;
  }, [favorites]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const value = {
    favorites,
    toggleFavorite,
    isFavorite,
    clearFavorites,
    getFavoritesCount,
    loading,
    error,
    fetchFavorites,
    clearError
  };

  return (
    <FavoritesContext.Provider value={value}>
      {children}
    </FavoritesContext.Provider>
  );
}

export function useFavorites() {
  const context = useContext(FavoritesContext);
  if (context === undefined) {
    throw new Error('useFavorites must be used within a FavoritesProvider');
  }
  return context;
}

export function FavoritesList() {
  const { 
    favorites, 
    toggleFavorite, 
    loading, 
    error, 
    clearError 
  } = useFavorites();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {error && (
        <div className="error-prompt" style={{ color: 'red', marginBottom: '1rem' }}>
          {error}
          <button 
            onClick={clearError}
            style={{ marginLeft: '1rem' }}
          >
            Dismiss
          </button>
        </div>
      )}
      
      {favorites.length === 0 ? (
        <p>No favorites yet</p>
      ) : (
        <ul>
          {favorites.map((item) => (
            <li key={item._id}>
              {item.name}
              <button onClick={() => toggleFavorite(item)}>
                Remove from Favorites
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

