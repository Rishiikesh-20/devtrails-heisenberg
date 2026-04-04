import React from "react";

export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <span className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: "0ms" }} />
      <span className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: "150ms" }} />
      <span className="w-2 h-2 rounded-full bg-current animate-pulse" style={{ animationDelay: "300ms" }} />
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#08172c]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 rounded-xl bg-electric flex items-center justify-center animate-pulse">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
        </div>
        <LoadingSpinner className="text-white/40" />
      </div>
    </div>
  );
}
