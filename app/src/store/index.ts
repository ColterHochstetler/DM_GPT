import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import {
  FLUSH,
  PAUSE,
  PERSIST,
  PURGE,
  REGISTER,
  REHYDRATE,
  persistReducer,
  persistStore,
} from "redux-persist";
import storage from 'redux-persist/lib/storage';
import messageReducer from './message';
import settingsUIReducer from './settings-ui';
import sidebarReducer from './sidebar';
import uiReducer from './ui';
import campaignReducer from './campaign-slice';
import titleReducer from './title'
import newGameSliceReducer  from './new-game-slice';
import tabReducer from './tabs-slice';

const persistConfig = {
  key: 'root',
  storage,
}

const persistSidebarConfig = {
  key: 'sidebar',
  storage,
}

const persistMessageConfig = {
  key: 'message',
  storage,
}

const persistTitleConfig = {
  key: 'title',
  storage,
};

const persistTabsConfig = {
  key: 'tabs',
  storage,
};

const persistNewGameSliceConfig = {
  key: 'newGameSlice',
  storage,
};

const store = configureStore({
  reducer: {
    campaign: campaignReducer,
    message: persistReducer<ReturnType<typeof messageReducer>>(persistMessageConfig, messageReducer),
    ui: uiReducer,
    settingsUI: settingsUIReducer,
    sidebar: persistReducer<ReturnType<typeof sidebarReducer>>(persistSidebarConfig, sidebarReducer),
    title: persistReducer<ReturnType<typeof titleReducer>>(persistTitleConfig, titleReducer),
    newGameSlice: persistReducer<ReturnType<typeof newGameSliceReducer>>(persistNewGameSliceConfig, newGameSliceReducer),
    tabs: persistReducer<ReturnType<typeof tabReducer>>(persistTabsConfig, tabReducer),
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
      },
    }),
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch: () => AppDispatch = useDispatch;
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;

export const persistor = persistStore(store);

export default store;