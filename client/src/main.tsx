import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import App from "./App";
import "./index.css";
import "./i18n/config";
import { I18nextProvider } from 'react-i18next';
import i18n from './i18n/config';

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <I18nextProvider i18n={i18n}>
      <App />
    </I18nextProvider>
  </StrictMode>
);
