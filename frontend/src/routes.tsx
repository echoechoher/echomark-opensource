import { createBrowserRouter } from "react-router";
import { Root } from "./components/Root";
import { MarksLibrary } from "./components/MarksLibrary";
import { ContentLibrary } from "./components/ContentLibrary";
import { PlayerPage } from "./components/PlayerPage";
import { MarkDetail } from "./components/MarkDetail";
import { SettingsPage } from "./components/SettingsPage";
import { LoginPage } from "./components/LoginPage";
import { RegisterPage } from "./components/RegisterPage";
import { ProtectedRoute } from "./components/ProtectedRoute";

export const router = createBrowserRouter([
  {
    path: "/login",
    element: <LoginPage />,
  },
  {
    path: "/register",
    element: <RegisterPage />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Root />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <MarksLibrary /> },
      { path: "content", element: <ContentLibrary /> },
      { path: "player/:id", element: <PlayerPage /> },
      { path: "mark/:id", element: <MarkDetail /> },
      { path: "settings", element: <SettingsPage /> },
    ],
  },
]);
