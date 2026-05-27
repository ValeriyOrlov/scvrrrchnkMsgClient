import { Outlet } from "react-router-dom";
import { useWebSocket } from "../hooks/useWebSocket";

export default function Layout() {
  useWebSocket()
  return (
    <div className="max-w-lg mx-auto min-h-screen bg-white p-4
    ">
      <Outlet />
    </div>
  )
}