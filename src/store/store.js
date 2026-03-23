import { configureStore } from '@reduxjs/toolkit';
import userAuthReducer from './slices/userAuthSlice';
import commanReducer from './slices/commanSlice';
import feedbackReducer from './slices/feedbackSlice';

export const store = configureStore({
  reducer: {
    userAuth: userAuthReducer,
    comman: commanReducer,
    feedback: feedbackReducer,
  },
});

export default store;
