import { 
  LayoutDashboard, 
  Users, 
  UserCircle, 
  Smartphone, 
  MapPin,
  Settings, 
  ChevronRight,
  ChevronDown,
  ScrollText,
  Bell,
  Radio,
  LucideIcon
} from "lucide-react";
import { useState } from "react";
import { ButtonSimulatorWidget } from "./button-simulator-widget";

interface NavItem {
  label: string;
  icon: LucideIcon;
  href?: string;
  children?: NavItem[];
}

const navItems: NavItem[] = [
  {
    label: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard"
  },
  {
    label: "Crew",
    icon: Users,
    href: "/crew"
  },
  {
    label: "Guests",
    icon: UserCircle,
    href: "/guests-list"
  },
  {
    label: "Device Manager",
    icon: Smartphone,
    href: "/device-manager"
  },
  {
    label: "Button Simulator",
    icon: Radio,
    href: "/button-simulator"
  },
  {
    label: "Locations",
    icon: MapPin,
    href: "/locations"
  },
  {
    label: "Service Requests",
    icon: Bell,
    href: "/service-requests"
  },
  {
    label: "Activity Log",
    icon: ScrollText,
    href: "/activity-log"
  },
  {
    label: "Settings",
    icon: Settings,
    href: "/settings"
  }
];

interface AppSidebarProps {
  currentPath?: string;
  onNavigate?: (path: string) => void;
}

export function AppSidebar({ currentPath = "/dashboard", onNavigate }: AppSidebarProps) {
  const [expandedItems, setExpandedItems] = useState<string[]>([]);
  const [collapsed, setCollapsed] = useState(false);

  const toggleItem = (label: string) => {
    setExpandedItems(prev => 
      prev.includes(label) 
        ? prev.filter(item => item !== label)
        : [...prev, label]
    );
  };

  const handleNavigate = (href: string) => {
    if (onNavigate) {
      // Convert /crew-list to crew-list format
      const path = href.startsWith('/') ? href.slice(1) : href;
      onNavigate(path);
    }
  };

  return (
    <div className={`h-full border-r border-border bg-sidebar transition-all duration-200 ${collapsed ? 'w-16' : 'w-64'}`}>
      <div className="flex flex-col h-full">
        {/* Sidebar Content */}
        <div className="flex-1 overflow-y-auto py-6">
          <nav className="space-y-1 px-3">
            {navItems.map((item) => (
              <div key={item.label}>
                {item.children ? (
                  <div>
                    <button
                      onClick={() => toggleItem(item.label)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                        collapsed ? 'justify-center' : 'justify-between'
                      } ${
                        item.children.some(child => currentPath === child.href)
                          ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                          : 'hover:bg-sidebar-accent text-sidebar-foreground'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <item.icon className="h-5 w-5 stroke-[1.5]" />
                        {!collapsed && <span>{item.label}</span>}
                      </div>
                      {!collapsed && (
                        expandedItems.includes(item.label) ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )
                      )}
                    </button>
                    {!collapsed && expandedItems.includes(item.label) && (
                      <div className="mt-1 space-y-1 pl-4">
                        {item.children.map((child) => (
                          <button
                            key={child.label}
                            onClick={() => child.href && handleNavigate(child.href)}
                            className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                              currentPath === child.href
                                ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                                : 'hover:bg-sidebar-accent/50 text-sidebar-foreground'
                            }`}
                          >
                            <child.icon className="h-4 w-4 stroke-[1.5]" />
                            <span className="text-sm">{child.label}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={() => item.href && handleNavigate(item.href)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      collapsed ? 'justify-center' : ''
                    } ${
                      currentPath === item.href
                        ? 'bg-sidebar-primary text-sidebar-primary-foreground'
                        : 'hover:bg-sidebar-accent text-sidebar-foreground'
                    }`}
                  >
                    <item.icon className="h-5 w-5 stroke-[1.5]" />
                    {!collapsed && <span>{item.label}</span>}
                  </button>
                )}
              </div>
            ))}
          </nav>
        </div>

        {/* Button Simulator Widget - HIDDEN FOR PRODUCTION DEMO */}
        {/* Uncomment below for development/testing */}
        {/* {!collapsed && <ButtonSimulatorWidget />} */}

        {/* Collapse Toggle */}
        <div className="p-3 border-t border-sidebar-border">
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="w-full flex items-center justify-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors text-sidebar-foreground"
          >
            <ChevronRight className={`h-4 w-4 transition-transform ${collapsed ? '' : 'rotate-180'}`} />
            {!collapsed && <span className="text-sm">Collapse</span>}
          </button>
        </div>
      </div>
    </div>
  );
}
