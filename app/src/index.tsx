import { MantineProvider } from '@mantine/core';
import { ModalsProvider } from '@mantine/modals';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { IntlProvider } from 'react-intl';
import { Provider } from 'react-redux';
import { createBrowserRouter, RouterProvider } from "react-router-dom";
import { PersistGate } from 'redux-persist/integration/react';
import { AppContextProvider } from './core/context';
import store, { persistor } from './store';
import { Global, css } from '@emotion/react';

import ChatPage from './components/pages/chat';
import LandingPage from './components/pages/landing';

import "./index.css";



const GlobalStyles = () => {
  return (
    <Global
      styles={css`
        body {
          margin: 0;
          padding: 0;
          background-image: url('https://cdn.discordapp.com/attachments/1017498159699742732/1142926888801677453/foxymayhem_photograph_838b68ad-0d64-4649-838b-2e1afac83570.png?ex=652c539c&is=6519de9c&hm=9f2b909bfcde84d60c2d630611265226262db4c6db601a85c011ece43ed5f105&'); 
          background-size: cover;
          background-position: center;
          background-attachment: fixed;
        }
        .vignette {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: radial-gradient(circle at center, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.8));
          pointer-events: none;
        }
      `}
    />
  );
};


const router = createBrowserRouter([
    {
        path: "/",
        element: <AppContextProvider>
            <LandingPage landing={true} />
        </AppContextProvider>,
    },
    {
        path: "/chat/:id",
        element: <AppContextProvider>
            <ChatPage />
        </AppContextProvider>,
    },
    {
        path: "/s/:id",
        element: <AppContextProvider>
            <ChatPage share={true} />
        </AppContextProvider>,
    },
    {
        path: "/s/:id/*",
        element: <AppContextProvider>
            <ChatPage share={true} />
        </AppContextProvider>,
    },
]);

const root = ReactDOM.createRoot(
    document.getElementById('root') as HTMLElement
);

async function loadLocaleData(locale: string) {
    const response = await fetch(`/lang/${locale}.json`);
    if (!response.ok) {
        throw new Error("Failed to load locale data");
    }
    const messages: any = await response.json();
    for (const key of Object.keys(messages)) {
        if (typeof messages[key] !== 'string') {
            messages[key] = messages[key].defaultMessage;
        }
    }
    return messages;
}

async function bootstrapApplication() {
    const locale = navigator.language;
  
    let messages: any;
    try {
      messages = await loadLocaleData(locale.toLocaleLowerCase());
    } catch (e) {
      console.warn("No locale data for", locale);
    }
  
    // Suppresses translation errors
    const onError = (err: any) => {
      if (err.code === 'MISSING_TRANSLATION') {
        return;
      }
      console.error(err);
    };
  
    root.render(
      <React.StrictMode>
        <IntlProvider locale={navigator.language} defaultLocale="en-GB" messages={messages} onError={onError}>
          <MantineProvider theme={{ colorScheme: "dark" }}>
            <Provider store={store}>
              <PersistGate loading={null} persistor={persistor}>
                <ModalsProvider>
                  <div className="vignette"></div>
                  <GlobalStyles />
                  <RouterProvider router={router} />
                </ModalsProvider>
              </PersistGate>
            </Provider>
          </MantineProvider>
        </IntlProvider>
      </React.StrictMode>
    );
  }
  
  bootstrapApplication();
  
