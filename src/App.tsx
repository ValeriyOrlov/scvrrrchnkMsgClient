import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import ChatsPage from "./pages/ChatsPage";
import ChatRoomPage from "./pages/ChatsRoomPage";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Все страницы рендерятся внутри Layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/chats/:id" element={<ChatRoomPage />} />
        {/* Корневой путь автоматически перенаправляет на /chats */}
        <Route path="/" element={<Navigate to="/chats" replace />} />
      </Route>
    </Routes>
  )
}

export default App