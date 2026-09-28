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
    <div className="flex h-full flex-col justify-between">
      <div>
        {/* Header Area */}
        <div className="flex h-16 items-center px-4 pt-2">
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
        "flex h-screen w-full overflow-hidden bg-slate-50 text-slate-900 dark:bg-[#09090b] dark:text-slate-100",
        themeVariant && `dash-theme-${themeVariant}`
      )}
    >
      {/* ─── Desktop Sidebar ─── */}
      <motion.aside
        className="hidden flex-shrink-0 border-r border-slate-200 bg-white/60 backdrop-blur-xl dark:border-slate-800/80 dark:bg-[#09090b]/80 md:block z-40"
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ type: "spring", stiffness: 350, damping: 30 }}
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
              className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm dark:bg-black/60 md:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
            />
            <motion.aside
              className="fixed bottom-0 left-0 top-0 z-50 w-[280px] border-r border-slate-200 bg-white dark:border-slate-800 dark:bg-[#0c0c0e] md:hidden shadow-2xl"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", stiffness: 350, damping: 30 }}
            >
              {/* Mobile Close Button */}
              <button
                className="absolute right-4 top-4 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:hover:bg-slate-700 transition-colors"
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
      <div className="flex min-w-0 flex-1 flex-col relative">
        {/* Subtle Background Glows (Optional, removed from cards, kept soft in background) */}
        <div className="pointer-events-none absolute top-0 left-1/4 h-96 w-96 -translate-y-1/2 rounded-full bg-brand-500/5 blur-[120px]" />
        
        {/* Navbar Layer */}
        <header className="sticky top-0 z-30 border-b border-slate-200/60 bg-white/70 px-4 backdrop-blur-md dark:border-slate-800/60 dark:bg-[#09090b]/70 sm:px-6">
          <div className="flex h-16 items-center justify-between">
            {/* Mobile Menu Toggle & Title */}
            <div className="flex items-center gap-3 md:hidden">
              <button
                onClick={() => setMobileOpen(true)}
                className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800 transition-colors"
              >
                <Menu className="h-5 w-5" />
              </button>
              <h1 className="text-lg font-semibold text-slate-900 dark:text-white">
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
          <div className="mx-auto max-w-7xl">
            {/* Content Wrapper Surface */}
            <motion.div
              key={String(selectedId)}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="min-h-[75vh] rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-800/80 dark:bg-[#0c0c0e] overflow-hidden"
            >
              {children}
            </motion.div>
          </div>
        </main>
      </div>
    </div>
  );
}