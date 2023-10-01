
import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './index';

type TabsState = {
  selectedLeftTab: string;
  selectedRightTab: string;
};

const initialState: TabsState = {
  selectedLeftTab: 'scenes',
  selectedRightTab: 'character sheet',
};

export const tabsSlice = createSlice({
  name: 'tabs',
  initialState,
  reducers: {
    setSelectedLeftTab: (state, action: PayloadAction<string>) => {
      state.selectedLeftTab = action.payload;
    },
    setSelectedRightTab: (state, action: PayloadAction<string>) => {
      state.selectedRightTab = action.payload;
    },
  },
});

export const { setSelectedLeftTab, setSelectedRightTab } = tabsSlice.actions;

export const selectSelectedLeftTab = (state: RootState) => state.tabs.selectedLeftTab;
export const selectSelectedRightTab = (state: RootState) => state.tabs.selectedRightTab;

export default tabsSlice.reducer;
