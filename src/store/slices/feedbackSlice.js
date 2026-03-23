import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  items: [],
};

const feedbackSlice = createSlice({
  name: "feedback",
  initialState,
  reducers: {
    addFeedback: {
      reducer(state, action) {
        // Keep most recent feedback at the top
        state.items.unshift(action.payload);
      },
      prepare(message) {
        const trimmed = message.trim();
        return {
          payload: {
            id: Date.now().toString(),
            message: trimmed,
            createdAt: new Date().toISOString(),
          },
        };
      },
    },
  },
});

export const { addFeedback } = feedbackSlice.actions;
export default feedbackSlice.reducer;

