import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { RootState } from './index';

type NewGameState = {
  currentStep: number;
  stepsStatus: { status: string; value: string }[];
  user: string;
  LLM: string;
  isGameStarted: boolean; 
};

const initialState: NewGameState = {
  currentStep: -1,
  stepsStatus: Array(7).fill({ status: 'pending', value: '' }),
  user: '',
  LLM: '',
  isGameStarted: false,
};

export const newGameSlice = createSlice({
  name: 'newGameSlice',
  initialState,
  reducers: {
    updateStepValue: (state, action: PayloadAction<{ index: number, value: string }>) => {
      state.stepsStatus[action.payload.index].value = action.payload.value;
    },
    completeStep: (state, action: PayloadAction<{ index: number }>) => {
      state.stepsStatus[action.payload.index].status = 'completed';
    },
    activateNextStep: (state, action: PayloadAction<number>) => {
      if (action.payload + 1 < state.stepsStatus.length) {
        state.stepsStatus[action.payload + 1].status = 'active';
      }
    },
    setCurrentStep: (state, action: PayloadAction<number>) => {
      state.currentStep = action.payload;
    },
    setUser: (state, action: PayloadAction<string>) => {
      state.user = action.payload;
    },
    setLLM: (state, action: PayloadAction<string>) => {
      state.LLM = action.payload;
    },
    initializeSteps: (state) => {
      if (state.stepsStatus.length > 0) {
        state.stepsStatus[0].status = 'active'; // Initialize the first step to 'active'
      }
      state.currentStep = 0; // Set currentStep to 0
    },
    resetToBeginning: (state) => {
      state.stepsStatus = Array(7).fill(null).map(() => ({ status: 'pending', value: '' }));
      state.currentStep = -1;
    },
    setIsGameStarted: (state, action: PayloadAction<boolean>) => {
      state.isGameStarted = action.payload;
    },
    extendStepsStatus: (state, action: PayloadAction<number>) => {
      const newLength = action.payload;
      if (state.stepsStatus.length < newLength) {
        const additionalSteps = Array.from(
          { length: newLength - state.stepsStatus.length },
          () => ({ status: 'pending', value: '' })
        );
        state.stepsStatus = [...state.stepsStatus, ...additionalSteps];
      }
    },
    resetState: (state) => {
      return initialState;
    },    
},
});

// Export actions
export const { updateStepValue, completeStep, activateNextStep, setCurrentStep, setUser, setLLM, initializeSteps, resetToBeginning, setIsGameStarted, extendStepsStatus, resetState } = newGameSlice.actions;

// Export selectors
export const selectCurrentStep = (state: RootState) => state.newGameSlice.currentStep;
export const selectUser = (state: RootState) => state.newGameSlice.user;
export const selectLLM = (state: RootState) => state.newGameSlice.LLM;
export const selectStepsStatus = (state: RootState) => state.newGameSlice.stepsStatus;
export const selectIsGameStarted = (state: RootState) => state.newGameSlice.isGameStarted;

// Export the reducer
export default newGameSlice.reducer;
