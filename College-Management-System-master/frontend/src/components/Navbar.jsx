import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import CustomButton from "./CustomButton";
import ThemeToggle from "./ThemeToggle";
import NotificationBell from "../campussphere/NotificationBell";
import { LayoutDashboard, LogOut, Menu } from "lucide-react";
import { cn } from "../utils/cn";

const Navbar = ({ title, onToggleSidebar, rightSlot }) => {
  const router = useLocation();
  const navigate = useNavigate();

  const logouthandler = () => {
    localStorage.removeItem("userToken");
    localStorage.removeItem("userType");
    navigate("/");
  };

  const userType = localStorage.getItem("userType");
  const derivedTitle =
    title || (userType ? `${userType} Dashboard` : "Dashboard");

  return (
    <div className="flex w-full items-center justify-between py-3 transition-colors">
      <div className="flex w-full flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mx-auto">
        <p
          className="font-bold text-xl tracking-tight flex justify-center sm:justify-start items-center gap-3 cursor-pointer text-center sm:text-left text-slate-900 dark:text-white hover:opacity-80 transition-opacity"
          onClick={() => navigate("/")}
        >
          <span
            className={cn(
              "inline-flex h-10 w-10 items-center justify-center rounded-xl",
              "bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg"
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
          </span>
          <span className="truncate bg-clip-text text-transparent bg-gradient-to-r from-slate-900 to-slate-600 dark:from-white dark:to-slate-400">
            {(router.state && router.state.type
              ? `${router.state.type} Dashboard`
              : derivedTitle) || "Dashboard"}
          </span>
        </p>

        <div className="flex w-full sm:w-auto items-center gap-4">
          {onToggleSidebar ? (
            <button
              type="button"
              onClick={onToggleSidebar}
              className={cn(
                "md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl",
                "bg-black/5 dark:bg-white/10 border border-black/5 dark:border-white/10",
                "text-slate-700 dark:text-slate-200 shadow-sm backdrop-blur",
                "hover:bg-black/10 dark:hover:bg-white/20 transition"
              )}
              aria-label="Open sidebar"
            >
              <Menu className="h-5 w-5" />
            </button>
          ) : null}

          {rightSlot ? rightSlot : null}

          {localStorage.getItem("userToken") ? (
            <div className="hidden sm:block">
              <NotificationBell />
            </div>
          ) : null}

          <div className="h-6 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block mx-1"></div>
          
          <ThemeToggle />
          
          <CustomButton
            variant="danger"
            onClick={logouthandler}
            className="w-full sm:w-auto !rounded-xl !px-4"
          >
            <span className="hidden sm:inline font-semibold">Logout</span>
            <span className="sm:hidden inline-flex items-center justify-center">
              <LogOut className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline-flex ml-2">
              <LogOut className="h-4 w-4" />
            </span>
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
