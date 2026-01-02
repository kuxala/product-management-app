import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from 'react';
import { favoritesApi } from '../api/favorites';
import { FavoriteWithTarget, RecentItemWithTarget, FavoriteType } from '@pm/shared';

interface NavigationContextType {
  favorites: FavoriteWithTarget[];
  recentItems: RecentItemWithTarget[];
  expandedSpaces: Set<string>;
  sidebarCollapsed: boolean;
  isLoading: boolean;
  toggleSpace: (spaceId: string) => void;
  toggleSidebar: () => void;
  addFavorite: (targetType: FavoriteType, targetId: string) => Promise<void>;
  removeFavorite: (favoriteId: string) => Promise<void>;
  recordView: (targetType: FavoriteType, targetId: string) => Promise<void>;
  refreshFavorites: () => Promise<void>;
  refreshRecent: () => Promise<void>;
  isFavorite: (targetType: FavoriteType, targetId: string) => boolean;
}

const NavigationContext = createContext<NavigationContextType | null>(null);

export function NavigationProvider({ children }: { children: ReactNode }) {
  const [favorites, setFavorites] = useState<FavoriteWithTarget[]>([]);
  const [recentItems, setRecentItems] = useState<RecentItemWithTarget[]>([]);
  const [expandedSpaces, setExpandedSpaces] = useState<Set<string>>(new Set());
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const fetchFavorites = useCallback(async () => {
    try {
      const data = await favoritesApi.getAll();
      setFavorites(data);
    } catch (err) {
      console.error('Failed to load favorites:', err);
    }
  }, []);

  const fetchRecent = useCallback(async () => {
    try {
      const data = await favoritesApi.getRecent(10);
      setRecentItems(data);
    } catch (err) {
      console.error('Failed to load recent items:', err);
    }
  }, []);

  // Initial load
  useEffect(() => {
    const initialize = async () => {
      setIsLoading(true);
      await Promise.all([fetchFavorites(), fetchRecent()]);
      setIsLoading(false);
    };

    initialize();
  }, [fetchFavorites, fetchRecent]);

  const toggleSpace = useCallback((spaceId: string) => {
    setExpandedSpaces((prev) => {
      const next = new Set(prev);
      if (next.has(spaceId)) {
        next.delete(spaceId);
      } else {
        next.add(spaceId);
      }
      return next;
    });
  }, []);

  const toggleSidebar = useCallback(() => {
    setSidebarCollapsed((prev) => !prev);
  }, []);

  const addFavorite = useCallback(
    async (targetType: FavoriteType, targetId: string) => {
      try {
        const favorite = await favoritesApi.add({ targetType, targetId });
        setFavorites((prev) => [...prev, favorite]);
      } catch (err) {
        console.error('Failed to add favorite:', err);
        throw err;
      }
    },
    []
  );

  const removeFavorite = useCallback(async (favoriteId: string) => {
    try {
      await favoritesApi.remove(favoriteId);
      setFavorites((prev) => prev.filter((f) => f.id !== favoriteId));
    } catch (err) {
      console.error('Failed to remove favorite:', err);
      throw err;
    }
  }, []);

  const recordView = useCallback(
    async (targetType: FavoriteType, targetId: string) => {
      try {
        await favoritesApi.recordView({ targetType, targetId });
        // Refresh recent items
        const data = await favoritesApi.getRecent(10);
        setRecentItems(data);
      } catch (err) {
        console.error('Failed to record view:', err);
      }
    },
    []
  );

  const refreshFavorites = useCallback(async () => {
    await fetchFavorites();
  }, [fetchFavorites]);

  const refreshRecent = useCallback(async () => {
    await fetchRecent();
  }, [fetchRecent]);

  const isFavorite = useCallback(
    (targetType: FavoriteType, targetId: string) => {
      return favorites.some(
        (f) => f.targetType === targetType && f.targetId === targetId
      );
    },
    [favorites]
  );

  return (
    <NavigationContext.Provider
      value={{
        favorites,
        recentItems,
        expandedSpaces,
        sidebarCollapsed,
        isLoading,
        toggleSpace,
        toggleSidebar,
        addFavorite,
        removeFavorite,
        recordView,
        refreshFavorites,
        refreshRecent,
        isFavorite,
      }}
    >
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  const context = useContext(NavigationContext);
  if (!context) {
    throw new Error('useNavigation must be used within NavigationProvider');
  }
  return context;
}
