import React, { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AnimatePresence, motion } from "framer-motion";
import SubmitCheckin from "./components/SubmitCheckin";
import Dashboard from "./components/Dashboard";

const queryClient = new QueryClient();

function AppContent() {
  const [activeTab, setActiveTab] = useState<"submit" | "dashboard">("submit");

  return (
    <div className="min-h-screen w-full bg-background text-foreground selection:bg-pink-200 selection:text-pink-900 pb-20">
      <header className="pt-12 pb-8 px-6 text-center max-w-4xl mx-auto">
        <h1 className="font-display text-5xl md:text-6xl tracking-wide text-gradient mb-4">
          Weekly Check-In
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-2xl mx-auto">
          Share your wins, goals, and the cool new tech you've been exploring!
        </p>
      </header>

      <main className="max-w-4xl mx-auto px-4 md:px-6">
        <nav className="flex justify-center mb-8 relative">
          <div className="bg-white/60 backdrop-blur-md p-2 rounded-full shadow-bubbly flex items-center gap-2 border border-pink-100">
            <button
              onClick={() => setActiveTab("submit")}
              className={`relative px-6 py-3 rounded-full font-bold text-lg transition-colors duration-300 z-10 ${
                activeTab === "submit" ? "text-white" : "text-pink-400 hover:text-pink-500"
              }`}
            >
              {activeTab === "submit" && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 bg-gradient-bubbly rounded-full -z-10 shadow-md"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              Submit Check-In
            </button>
            <button
              onClick={() => setActiveTab("dashboard")}
              className={`relative px-6 py-3 rounded-full font-bold text-lg transition-colors duration-300 z-10 ${
                activeTab === "dashboard" ? "text-white" : "text-pink-400 hover:text-pink-500"
              }`}
            >
              {activeTab === "dashboard" && (
                <motion.div
                  layoutId="active-tab"
                  className="absolute inset-0 bg-gradient-bubbly rounded-full -z-10 shadow-md"
                  transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
                />
              )}
              Dashboard
            </button>
          </div>
        </nav>

        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 20, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.98 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
          >
            {activeTab === "submit" ? <SubmitCheckin onNavigateToDashboard={() => setActiveTab("dashboard")} /> : <Dashboard />}
          </motion.div>
        </AnimatePresence>
      </main>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AppContent />
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
