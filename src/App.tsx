import { Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout.tsx";
import LoginPage from "./pages/LoginPage.tsx";
import RegisterPage from "./pages/RegisterPage.tsx";
import ChatsPage from "./pages/ChatsPage.tsx";
import ChatRoomPage from "./pages/ChatRoomPage.tsx";
import SearchPage from "./pages/SearchPage.tsx";
import SearchGroupMembersPage from "./pages/SearchGroupMembersPage.tsx";
import ChatInfoPage from "./pages/ChatInfoPage.tsx";
import ProtectedRoute from "./components/ProtectedRoute.tsx";
import ForwardPage from "./pages/ForwardPage.tsx";

function App() {
  return (
    <Routes>
        <Route element={<Layout />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/chats" element={<ProtectedRoute><ChatsPage /></ProtectedRoute>} />
        <Route path="/chats/:id" element={<ProtectedRoute><ChatRoomPage /></ProtectedRoute>} />
        <Route path="/search" element={<ProtectedRoute><SearchPage /></ProtectedRoute>} />
        <Route path="/searchGroupMembers" element={<ProtectedRoute><SearchGroupMembersPage /></ProtectedRoute>} />
        <Route path="/chats/:id/info" element={<ProtectedRoute><ChatInfoPage /></ProtectedRoute>} />
        <Route path="/forward" element={<ProtectedRoute><ForwardPage /></ProtectedRoute>} />
        <Route path="/" element={<Navigate to="/chats" replace />} />
      </Route>
    </Routes>
  )
}

export default App