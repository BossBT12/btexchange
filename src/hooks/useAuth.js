import { useSelector, useDispatch } from 'react-redux';
import { useCallback, useRef, useEffect } from 'react';
import { clearUser, setUserData, mergeAuthState } from '../store/slices/userAuthSlice';
import Cookies from 'js-cookie';
import authService from '../services/authService';
import tradingService from '../services/tradingService';

/** In-flight promise refs for deduplicating concurrent API calls */
const userDataPromiseRef = { current: null };
const favoritePairsPromiseRef = { current: null };
/** Tracks if favorites have been fetched (even when result is empty) to avoid repeated API calls */
const hasFetchedFavoritePairsRef = { current: false };

export const useAuth = () => {
  const dispatch = useDispatch();
  const isMountedRef = useRef(true);

  const cookieToken = Cookies.get('token');
  const cookieToken2 = Cookies.get('token2');

  const data = useSelector((state) => state.userAuth);
  const user = data?.userData;
  const token = data?.token ?? cookieToken;
  const token2 = data?.token2 ?? cookieToken2;
  const favoritePairs = data?.favoritePairs ?? [];

  const clear = useCallback(() => {
    userDataPromiseRef.current = null;
    favoritePairsPromiseRef.current = null;
    hasFetchedFavoritePairsRef.current = false;
    dispatch(clearUser());
    Cookies.remove('token');
    Cookies.remove('refreshToken');
    Cookies.remove('token2');
    Cookies.remove('refreshToken2');
    localStorage.clear();
  }, [dispatch]);

  const setUser = useCallback(
    (userData) => {
      const { tradeData, networkData } = userData;
      const { token: tradeToken, refreshToken: tradeRefreshToken, user: tradeUser } = tradeData;
      const { token: networkToken, refreshToken: networkRefreshToken } = networkData ?? {};

      if (tradeToken) Cookies.set('token', tradeToken);
      if (tradeRefreshToken) Cookies.set('refreshToken', tradeRefreshToken);
      if (networkToken) Cookies.set('token2', networkToken);
      if (networkRefreshToken) Cookies.set('refreshToken2', networkRefreshToken);

      hasFetchedFavoritePairsRef.current = false;
      dispatch(
        setUserData({
          userData: tradeUser,
          token: tradeToken,
          refreshToken: tradeRefreshToken,
          token2: networkToken,
          refreshToken2: networkRefreshToken,
          favoritePairs: [],
        })
      );
    },
    [dispatch]
  );

  const addFavoritePair = useCallback(async (pair) => {
    try {
      dispatch(mergeAuthState({ favoritePairs: [...favoritePairs, pair] }));
      await tradingService.addFavoritePair(pair);
      return true;
    } catch (error) {
      console.error('[useAuth] Error adding favorite pair:', error);
      return false;
    }
  });

  const removeFavoritePair = useCallback(async (pair) => {
    try {
      dispatch(mergeAuthState({ favoritePairs: favoritePairs.filter((p) => p !== pair) }));
      await tradingService.removeFavoritePair(pair);
      return true;
    } catch (error) {
      console.error('[useAuth] Error removing favorite pair:', error);
      return false;
    }
  });

  const fetchUserData = useCallback(async () => {
    if (!token || user) return Promise.resolve(user ?? null);

    if (userDataPromiseRef.current) {
      return userDataPromiseRef.current;
    }

    const promise = (async () => {
      try {
        const response = await authService.getUser();
        if (!isMountedRef.current) return null;
        if (response?.success && response?.data?.user) {
          dispatch(mergeAuthState({ userData: response.data.user }));
          return response.data.user;
        }
        return null;
      } catch (error) {
        if (isMountedRef.current) {
          console.error('[useAuth] Error fetching user data:', error);
        }
        return null;
      } finally {
        userDataPromiseRef.current = null;
      }
    })();

    userDataPromiseRef.current = promise;
    return promise;
  }, [token, user, dispatch]);

  const fetchFavoritePairs = useCallback(async () => {
    if (!token || hasFetchedFavoritePairsRef.current) return Promise.resolve(favoritePairs);

    if (favoritePairsPromiseRef.current) {
      return favoritePairsPromiseRef.current;
    }

    const promise = (async () => {
      try {
        const response = await tradingService.getFavoritePairs();
        hasFetchedFavoritePairsRef.current = true;
        if (!isMountedRef.current) return [];
        const pairs = response?.data?.map((item) => item.pair) ?? [];
        if (isMountedRef.current && Array.isArray(pairs)) {
          dispatch(mergeAuthState({ favoritePairs: pairs }));
        }
        return pairs;
      } catch (error) {
        hasFetchedFavoritePairsRef.current = true;
        if (isMountedRef.current) {
          console.error('[useAuth] Error fetching favorite pairs:', error);
        }
        return [];
      } finally {
        favoritePairsPromiseRef.current = null;
      }
    })();

    favoritePairsPromiseRef.current = promise;
    return promise;
  }, [token, favoritePairs, dispatch]);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (token && !user) {
      fetchUserData();
    }
  }, [token, user, fetchUserData]);

  useEffect(() => {
    if (token && favoritePairs.length === 0) {
      fetchFavoritePairs();
    }
  }, [token, favoritePairs.length, fetchFavoritePairs]);

  return {
    userData: user,
    token,
    token2,
    favoritePairs,
    addFavoritePair,
    removeFavoritePair,
    isLoggedIn: Boolean(token),
    clear,
    setUser,
    fetchUserData,
    fetchFavoritePairs,
  };
};

export default useAuth;
