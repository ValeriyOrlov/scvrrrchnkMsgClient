import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import ChatsPage from "./pages/ChatsPage.tsx";
import ChatRoomPage from "./pages/ChatRoomPage.tsx";
import SearchPage from "./pages/SearchPage.tsx";
import SearchGroupMembersPage from "./pages/SearchGroupMembersPage.tsx";
import ChatInfoPage from "./pages/ChatInfoPage.tsx";

function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        {/* Все страницы рендерятся внутри Layout */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/chats" element={<ChatsPage />} />
        <Route path="/chats/:id" element={<ChatRoomPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/searchGroupMembers" element={<SearchGroupMembersPage />} />
        <Route path="/chats/:id/info" element={<ChatInfoPage />} />
        {/* Корневой путь автоматически перенаправляет на /chats */}
        <Route path="/" element={<Navigate to="/chats" replace />} />
      </Route>
    </Routes>
  )
}

export default App