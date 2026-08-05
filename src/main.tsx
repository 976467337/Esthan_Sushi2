
  import { createRoot } from "react-dom/client";
  import App from "./app/App.tsx";
  import AdminPromocoes from "./app/AdminPromocoes.tsx";
  import "./styles/index.css";

  // /admin abre o painel de promoções (protegido por senha) em vez do site público.
  const isAdmin = window.location.pathname.replace(/\/+$/, "") === "/admin";

  createRoot(document.getElementById("root")!).render(isAdmin ? <AdminPromocoes /> : <App />);
