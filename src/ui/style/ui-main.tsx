import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { DialogProvider } from "../DialogProvider.tsx";
import AppUI from "../App.UI.tsx";
import "../../index.css";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <DialogProvider>
      <AppUI />
    </DialogProvider>
  </StrictMode>,
);
