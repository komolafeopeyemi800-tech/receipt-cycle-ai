import { Camera, Upload, FileSpreadsheet, PenLine } from "lucide-react";
import { cn } from "@/lib/utils";

const actions = [
  { 
    icon: Camera, 
    label: "Scan", 
    sublabel: "Receipt",
    gradient: "from-primary to-accent"
  },
  { 
    icon: Upload, 
    label: "Upload", 
    sublabel: "Statement",
    gradient: "from-accent to-success"
  },
  { 
    icon: FileSpreadsheet, 
    label: "Import", 
    sublabel: "CSV/OFX",
    gradient: "from-savings to-primary"
  },
  { 
    icon: PenLine, 
    label: "Add", 
    sublabel: "Manual",
    gradient: "from-warning to-destructive"
  },
];

export function QuickActions() {
  return (
    <div className="grid grid-cols-4 gap-3">
      {actions.map((action) => (
        <button
          key={action.label}
          className="group flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border hover:border-primary/30 transition-all hover:shadow-md"
        >
          <div className={cn(
            "w-11 h-11 rounded-xl flex items-center justify-center bg-gradient-to-br text-primary-foreground transition-transform group-hover:scale-110",
            action.gradient
          )}>
            <action.icon className="w-5 h-5" />
          </div>
          <div className="text-center">
            <p className="text-xs font-semibold text-foreground">{action.label}</p>
            <p className="text-[10px] text-muted-foreground">{action.sublabel}</p>
          </div>
        </button>
      ))}
    </div>
  );
}
