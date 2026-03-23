import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  userData: null,
  userData2: null,
  token: null,
  token2: null,
  refreshToken: null,
  refreshToken2: null,
  favoritePairs: [],
};

const userAuthSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUser: (state) => {
      state.userData = null;
      state.userData2 = null;
      state.token = null;
      state.token2 = null;
      state.refreshToken = null;
      state.refreshToken2 = null;
      state.favoritePairs = [];
    },
    setUserData: (state, action) => {
      state.userData = action.payload.userData;
      state.token = action.payload.token;
      state.refreshToken = action.payload.refreshToken;
      state.token2 = action.payload.token2;
      state.refreshToken2 = action.payload.refreshToken2;
      state.favoritePairs = action.payload.favoritePairs;
    },
    mergeAuthState: (state, action) => {
      const payload = action.payload;
      if (payload.userData !== undefined) state.userData = payload.userData;
      if (payload.favoritePairs !== undefined) state.favoritePairs = payload.favoritePairs;
    },
  },
});

export const { clearUser, setUserData, mergeAuthState } = userAuthSlice.actions;
export default userAuthSlice.reducer;
