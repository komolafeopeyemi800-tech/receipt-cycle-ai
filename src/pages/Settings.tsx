import { AppLayout } from "@/components/layout/AppLayout";
import { 
  User, CreditCard, Bell, Shield, HelpCircle, LogOut, 
  ChevronRight, Globe, Moon, Palette
} from "lucide-react";
import { cn } from "@/lib/utils";

const settingsSections = [
  {
    title: "Account",
    items: [
      { icon: User, label: "Profile", sublabel: "Manage your account" },
      { icon: CreditCard, label: "Subscription", sublabel: "Free plan" },
      { icon: Globe, label: "Currency", sublabel: "USD ($)" },
    ],
  },
  {
    title: "Preferences",
    items: [
      { icon: Bell, label: "Notifications", sublabel: "Manage alerts" },
      { icon: Moon, label: "Appearance", sublabel: "Light mode" },
      { icon: Palette, label: "Categories", sublabel: "Customize tags" },
    ],
  },
  {
    title: "Security & Help",
    items: [
      { icon: Shield, label: "Privacy & Security", sublabel: "Data protection" },
      { icon: HelpCircle, label: "Help & Support", sublabel: "FAQ, contact us" },
    ],
  },
];

const Settings = () => {
  return (
    <AppLayout showFAB={false}>
      <div className="space-y-6">
        <h1 className="text-2xl font-display font-bold">Settings</h1>

        {/* Profile Card */}
        <div className="card-glass p-4 flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-xl font-bold text-primary">A</span>
          </div>
          <div className="flex-1">
            <h2 className="font-semibold text-lg">Alex Johnson</h2>
            <p className="text-sm text-muted-foreground">alex@example.com</p>
          </div>
          <ChevronRight className="w-5 h-5 text-muted-foreground" />
        </div>

        {/* Settings Sections */}
        {settingsSections.map((section) => (
          <div key={section.title} className="space-y-2">
            <h3 className="section-title">{section.title}</h3>
            <div className="card-elevated divide-y divide-border">
              {section.items.map((item) => (
                <button
                  key={item.label}
                  className="w-full flex items-center gap-3 p-4 hover:bg-secondary/50 transition-colors text-left"
                >
                  <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
                    <item.icon className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{item.label}</p>
                    <p className="text-xs text-muted-foreground">{item.sublabel}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-muted-foreground" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Logout */}
        <button className="w-full card-elevated p-4 flex items-center gap-3 text-destructive hover:bg-destructive/5 transition-colors">
          <div className="w-10 h-10 rounded-xl bg-destructive/10 flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </div>
          <span className="font-medium">Log Out</span>
        </button>

        {/* Version */}
        <p className="text-center text-xs text-muted-foreground pb-4">
          Receipt Cycle v1.0.0
        </p>
      </div>
    </AppLayout>
  );
};

export default Settings;
