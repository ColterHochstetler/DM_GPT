// newGameSlice.ts

import { createSlice, PayloadAction } from '@reduxjs/toolkit';

type NewGameState = {
  currentStep: number;
  userInputs: any;  // Define a more specific type based on your needs
  llmOutputs: any;  // Define a more specific type based on your needs
};

const initialState: NewGameState = {
  currentStep: 0,
  userInputs: {},
  llmOutputs: {},
};

const newGameSlice = createSlice({
  name: 'newGame',
  initialState,
  reducers: {
    setCurrentStep: (state, action: PayloadAction<number>) => {
        state.currentStep = action.payload;
    },
    setUserInputs: (state, action: PayloadAction<any>) => {  // Use a specific type
        state.userInputs = action.payload;
    },
    setLlmOutputs: (state, action: PayloadAction<any>) => {  // Use a specific type
        state.llmOutputs = action.payload;
    },
  },
});

export const selectCurrentStep = (state) => state.newGame.currentStep;
export const selectUserInputs = (state) => state.newGame.userInputs;
export const selectLlmOutputs = (state) => state.newGame.llmOutputs;

export default newGameSlice.reducer;

// Add these at the end of newGameSlice.ts

export const { setCurrentStep, setUserInputs, setLlmOutputs } = newGameSlice.actions;

