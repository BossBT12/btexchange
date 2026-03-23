import { createSlice } from "@reduxjs/toolkit";

const initialState = {
    homePageSearchValue: "",
}

const commanSlice = createSlice({
    name: "comman",
    initialState,
    reducers: {
        setHomePageSearchValue: (state, action) => {
            state.homePageSearchValue = action.payload;
        },
    },
});

export const { setHomePageSearchValue } = commanSlice.actions;
export default commanSlice.reducer;