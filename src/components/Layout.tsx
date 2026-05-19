import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="max-w-lg mx-auto min-h-screen bg-gray-50 p-4
    ">
      <Outlet />
    </div>
  )
}