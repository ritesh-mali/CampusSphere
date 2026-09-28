import React, { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { cn } from "../../utils/cn";
import Navbar from "../Navbar";
import "../../styles/sections/dashboard-layout.css";

// ─── NavItem Component ───────────────────────────────────────────────
function NavItem({ active, label, onClick, collapsed }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "group relative flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all duration-200 ease-out",
        active
          ? "bg-slate-900 text-white shadow-md dark:bg-white dark:text-slate-900"
          : "text-slate-600 hover:bg-slate-200/50 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-slate-800/50 dark:hover:text-slate-100"
      )}
      title={collapsed ? label : undefined}
    >
      {/* Active Indicator (Subtle Dot) */}
      <span
        className={cn(
          "h-1.5 w-1.5 flex-shrink-0 rounded-full transition-colors",
          active
            ? "bg-brand-500 dark:bg-brand-600"
            : "bg-slate-300 group-hover:bg-slate-400 dark:bg-slate-700 dark:group-hover:bg-slate-500"
        )}
      />
      <span
        className={cn(
          "truncate whitespace-nowrap transition-opacity duration-200",
          collapsed ? "opacity-0 w-0 hidden" : "opacity-100 w-auto block"
        )}
      >
        {label}
      </span>
    </button>
  );
}

// ─── Sidebar Content Component ───────────────────────────────────────
function SidebarContent({ menuItems, selectedId, onSelect, collapsed, header, footer, onToggleCollapse }) {
  return (
    <div className="flex h-full flex-col justify-between overflow-hidden">
      <div className="flex-1 overflow-y-auto pb-4 custom-scrollbar">
        {/* Header Area */}
        <div className="flex h-16 items-center px-4 pt-2 shrink-0">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-indigo-600 text-white shadow-sm">
              <span className="text-sm font-bold">C</span>
            </div>
            {!collapsed && (
              <div className="flex flex-col opacity-100 transition-opacity">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                  Campussphere
                </span>
                <span className="truncate text-sm font-semibold text-slate-900 dark:text-slate-100">
                  {header}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Navigation Links */}
        <nav className="mt-6 flex flex-col gap-1 px-3">
          {menuItems.map((item) => (
            <NavItem
              key={item.id}
              label={item.label}
              active={String(selectedId).toLowerCase() === String(item.id).toLowerCase()}
              onClick={() => onSelect(item.id)}
              collapsed={collapsed}
            />
          ))}
        </nav>
      </div>

      {/* Footer Area */}
      <div className="p-3">
        {/* Tips Box */}
        {!collapsed && (
          <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 p-3 dark:border-slate-800/60 dark:bg-slate-900/40">
            <div className="mb-1 flex items-center gap-2 text-brand-600 dark:text-brand-400">
              <Sparkles className="h-4 w-4" />
              <p className="text-xs font-bold uppercase tracking-wide">Quick Tip</p>
            </div>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Use <kbd className="rounded border border-slate-300 bg-white px-1 py-0.5 text-[10px] font-mono dark:border-slate-700 dark:bg-slate-800 shadow-sm">⌘ + K</kbd> to search anywhere.
            </p>
          </div>
        )}

        {/* Custom Footer Slot */}
        {footer && <div className="mb-4">{footer}</div>}

        {/* Desktop Collapse Toggle */}
        <div className="hidden md:block">
          <button
            onClick={onToggleCollapse}
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white py-2 text-sm font-medium text-slate-600 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-900 dark:border-slate-800 dark:bg-[#0c0c0e] dark:text-slate-400 dark:hover:bg-slate-900 dark:hover:text-slate-100"
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            {!collapsed && <span>Collapse Sidebar</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Layout Component ───────────────────────────────────────────
export default function DashboardLayout({ 
  title, 
  menuItems, 
  selectedId, 
  onSelect, 
  children, 
  sidebarFooter, 
  themeVariant 
}) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const safeTitle = useMemo(() => title || "Dashboard", [title]);

  return (
    <div
      className={cn(
        "flex h-screen w-full overflow-hidden bg-transparent text-slate-900 dark:text-slate-100 p-2 sm:p-4 gap-4",
        themeVariant && `dash-theme-${themeVariant}`
      )}
    >
      {/* ─── Desktop Floating Sidebar ─── */}
      <motion.aside
        className="hidden flex-shrink-0 rounded-2xl border border-white/20 bg-white/40 backdrop-blur-2xl shadow-xl dark:border-white/10 dark:bg-white/5 md:flex flex-col z-40 overflow-hidden relative"
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
      >
        <SidebarContent
          menuItems={menuItems}
          selectedId={selectedId}
          onSelect={onSelect}
          collapsed={collapsed}
          header={safeTitle}
          footer={sidebarFooter}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />
      </motion.aside>

      {/* ─── Mobile Sidebar Overlay ─── */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed bottom-4 left-4 top-4 z-50 w-[280px] rounded-2xl border border-white/20 bg-white/80 backdrop-blur-2xl dark:border-white/10 dark:bg-black/80 md:hidden shadow-2xl flex flex-col overflow-hidden"
              initial={{ x: "-120%" }}
              animate={{ x: 0 }}
              exit={{ x: "-120%" }}
              transition={{ type: "spring", stiffness: 400, damping: 40 }}
            >
              {/* Mobile Close Button */}
              <button
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-black/5 text-slate-600 hover:bg-black/10 dark:bg-white/10 dark:text-slate-400 dark:hover:bg-white/20 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                <X className="h-4 w-4" />
              </button>
              
              <SidebarContent
                menuItems={menuItems}
                selectedId={selectedId}
                onSelect={(id) => {
                  onSelect(id);
                  setMobileOpen(false);
                }}
                collapsed={false}
                header={safeTitle}
                footer={sidebarFooter}
              />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ─── Main Content Area ─── */}
      <div className="flex min-w-0 flex-1 flex-col relative rounded-2xl border border-white/20 bg-white/60 backdrop-blur-xl shadow-xl dark:border-white/10 dark:bg-white/5 overflow-hidden">
        
        {/* Navbar Layer (Floating inside the canvas) */}
        <header className="sticky top-0 z-30 border-b border-black/5 bg-white/40 px-4 backdrop-blur-2xl dark:border-white/5 dark:bg-black/40 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Mobile Menu Toggle & Title */}
            <div className="flex items-center gap-3 md:hidden">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 text-slate-600 hover:bg-black/5 dark:text-slate-400 dark:hover:bg-white/10 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">
                {safeTitle}
              </h1>
            </div>

            {/* Desktop Navbar Integration */}
            <div className="hidden w-full md:block">
              <Navbar title={safeTitle} />
            </div>
          </div>
        </header>

        {/* Scrollable Canvas */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 z-10 relative">
          <div className="mx-auto max-w-7xl h-full">
            {/* Content Wrapper Surface */}
            <AnimatePresence mode="wait">
              <motion.div
                key={String(selectedId)}
                initial={{ opacity: 0, y: 20, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.98 }}
                transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                className="h-full rounded-xl bg-transparent"
              >
                {children}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>
    </div>
  );
}