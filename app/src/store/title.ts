import { createSlice, PayloadAction } from '@reduxjs/toolkit';

const initialState = {
    title: 'Default Title',
};

const titleSlice = createSlice({
    name: 'title',
    initialState,
    reducers: {
        setTitle: (state, action: PayloadAction<string>) => {
            state.title = action.payload;
        },
    },
});

export const { setTitle } = titleSlice.actions;
export const selectTitle = (state) => state.title.title;
export default titleSlice.reducer;
