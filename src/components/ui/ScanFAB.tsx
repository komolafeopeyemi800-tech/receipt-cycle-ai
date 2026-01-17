import { Camera, Plus, Upload, FileText, Keyboard } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";

const addOptions = [
  { icon: Camera, label: "Scan Receipt", color: "bg-primary" },
  { icon: Upload, label: "Upload File", color: "bg-accent" },
  { icon: FileText, label: "Bank Statement", color: "bg-savings" },
  { icon: Keyboard, label: "Manual Entry", color: "bg-warning" },
];

export function ScanFAB() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-foreground/20 backdrop-blur-sm z-40 animate-fade-in"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Options */}
      <div className={cn(
        "fixed bottom-28 left-1/2 -translate-x-1/2 z-50 flex flex-col items-center gap-3 transition-all duration-300",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"
      )}>
        {addOptions.map((option, index) => (
          <button
            key={option.label}
            className={cn(
              "flex items-center gap-3 px-5 py-3 rounded-full bg-card border border-border shadow-lg transition-all",
              "hover:scale-105 active:scale-95"
            )}
            style={{ 
              transitionDelay: isOpen ? `${index * 50}ms` : '0ms',
              opacity: isOpen ? 1 : 0,
              transform: isOpen ? 'translateY(0)' : 'translateY(10px)'
            }}
            onClick={() => setIsOpen(false)}
          >
            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-primary-foreground", option.color)}>
              <option.icon className="w-4 h-4" />
            </div>
            <span className="font-medium text-sm">{option.label}</span>
          </button>
        ))}
      </div>

      {/* FAB Button */}
      <button 
        className={cn(
          "fab-scan transition-transform duration-200",
          isOpen && "rotate-45"
        )}
        onClick={() => setIsOpen(!isOpen)}
      >
        <Plus className="w-7 h-7" strokeWidth={2.5} />
      </button>
    </>
  );
}
