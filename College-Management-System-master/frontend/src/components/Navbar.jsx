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
    <div className="sticky top-0 z-40 border-b border-slate-200/70 dark:border-slate-800/70 bg-white/70 dark:bg-slate-950/50 backdrop-blur px-4 sm:px-6 py-4 mb-6 transition-colors">
      <div className="max-w-7xl flex flex-col gap-3 sm:flex-row sm:justify-between sm:items-center mx-auto">
        <p
          className="font-semibold text-xl sm:text-2xl flex justify-center sm:justify-start items-center gap-2 cursor-pointer text-center sm:text-left text-slate-900 dark:text-slate-100"
          onClick={() => navigate("/")}
        >
          <span
            className={cn(
              "inline-flex h-9 w-9 items-center justify-center rounded-2xl",
              "bg-gradient-to-br from-brand-600 to-indigo-600 text-white shadow-soft"
            )}
          >
            <LayoutDashboard className="h-5 w-5" />
          </span>
          <span className="truncate">
            {(router.state && router.state.type
              ? `${router.state.type} Dashboard`
              : derivedTitle) || "Dashboard"}
          </span>
        </p>

        <div className="flex w-full sm:w-auto items-center gap-2">
          {onToggleSidebar ? (
            <button
              type="button"
              onClick={onToggleSidebar}
              className={cn(
                "md:hidden inline-flex h-10 w-10 items-center justify-center rounded-xl",
                "bg-white/70 dark:bg-slate-900/60 border border-slate-200/70 dark:border-slate-800/70",
                "text-slate-700 dark:text-slate-200 shadow-soft backdrop-blur",
                "hover:bg-white dark:hover:bg-slate-900 transition"
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

          <ThemeToggle />
          <CustomButton
            variant="danger"
            onClick={logouthandler}
            className="w-full sm:w-auto"
          >
            <span className="hidden sm:inline">Logout</span>
            <span className="sm:hidden inline-flex items-center justify-center">
              <LogOut className="h-4 w-4" />
            </span>
            <span className="hidden sm:inline-flex ml-1">
              <LogOut className="h-4 w-4" />
            </span>
          </CustomButton>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
