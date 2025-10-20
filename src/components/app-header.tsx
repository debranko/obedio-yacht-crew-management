import { Search, Bell, Moon, Sun, User, Users, Ship, UserX, ChevronDown, LogOut } from "lucide-react";
import { ObedioLogo } from "./obedio-logo";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Avatar, AvatarFallback } from "./ui/avatar";
import { useAuth } from "../contexts/AuthContext";
import { Badge } from "./ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";

export type GuestStatus = 'onboard' | 'ashore' | 'none';

interface AppHeaderProps {
  onThemeToggle?: () => void;
  isDark?: boolean;
  guestStatus?: GuestStatus;
  onGuestStatusChange?: (status: GuestStatus) => void;
}

export function AppHeader({ onThemeToggle, isDark, guestStatus = 'onboard', onGuestStatusChange }: AppHeaderProps) {
  const { user, logout } = useAuth();

  const getStatusConfig = (status: GuestStatus) => {
    switch (status) {
      case 'onboard':
        return { icon: Users, label: 'Guests Onboard', color: 'text-green-600 dark:text-green-400', bgColor: 'bg-green-500/10' };
      case 'ashore':
        return { icon: Ship, label: 'Guests Ashore', color: 'text-amber-600 dark:text-amber-400', bgColor: 'bg-amber-500/10' };
      case 'none':
        return { icon: UserX, label: 'No Guests', color: 'text-muted-foreground', bgColor: 'bg-muted' };
    }
  };
  
  const currentStatus = getStatusConfig(guestStatus);
  return (
    <div className="border-b border-border bg-card">
      <div className="flex items-center justify-between h-16 px-6">
        {/* Left: Logo and Guest Status */}
        <div className="flex items-center gap-6">
          <ObedioLogo className="text-xl" />
          
          {/* Guest Status Selector */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="h-9 px-3 gap-2"
              >
                <div className={`w-2 h-2 rounded-full ${guestStatus === 'onboard' ? 'bg-green-500 animate-pulse' : guestStatus === 'ashore' ? 'bg-amber-500' : 'bg-muted-foreground/50'}`} />
                <currentStatus.icon className={`h-4 w-4 ${currentStatus.color}`} />
                <span className="text-xs font-medium">{currentStatus.label}</span>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56">
              <DropdownMenuItem
                onClick={() => onGuestStatusChange?.('onboard')}
                className="gap-2"
              >
                <Users className="h-4 w-4 text-green-600" />
                <div className="flex-1">
                  <p className="font-medium">Guests Onboard</p>
                  <p className="text-xs text-muted-foreground">Full service mode active</p>
                </div>
                {guestStatus === 'onboard' && <div className="w-2 h-2 rounded-full bg-green-500" />}
              </DropdownMenuItem>
              
              <DropdownMenuItem
                onClick={() => onGuestStatusChange?.('ashore')}
                className="gap-2"
              >
                <Ship className="h-4 w-4 text-amber-600" />
                <div className="flex-1">
                  <p className="font-medium">Guests Ashore</p>
                  <p className="text-xs text-muted-foreground">Guests on land/excursion</p>
                </div>
                {guestStatus === 'ashore' && <div className="w-2 h-2 rounded-full bg-amber-500" />}
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem
                onClick={() => onGuestStatusChange?.('none')}
                className="gap-2"
              >
                <UserX className="h-4 w-4 text-muted-foreground" />
                <div className="flex-1">
                  <p className="font-medium">No Guests</p>
                  <p className="text-xs text-muted-foreground">Maintenance mode</p>
                </div>
                {guestStatus === 'none' && <div className="w-2 h-2 rounded-full bg-muted-foreground" />}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-3">
          {/* Global Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search..." 
              className="pl-9 w-64 bg-background/50 border-border"
            />
          </div>

          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="icon"
            onClick={onThemeToggle}
            className="h-9 w-9"
          >
            {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          {/* Notifications */}
          <Button variant="ghost" size="icon" className="h-9 w-9 relative">
            <Bell className="h-4 w-4" />
            <span className="absolute top-1 right-1 h-2 w-2 bg-error rounded-full" />
          </Button>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-3 gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-primary/10 text-primary text-xs">
                    {user?.name ? user.name.substring(0, 2).toUpperCase() : 'U'}
                  </AvatarFallback>
                </Avatar>
                <div className="flex flex-col items-start">
                  <span className="text-sm font-medium">{user?.name || 'User'}</span>
                  <span className="text-xs text-muted-foreground">{user?.role || 'crew'}</span>
                </div>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5">
                <p className="text-sm font-medium">{user?.name}</p>
                <p className="text-xs text-muted-foreground">{user?.email}</p>
                {user?.role && (
                  <Badge variant="secondary" className="mt-1 text-xs">
                    {user.role.replace('-', ' ').toUpperCase()}
                  </Badge>
                )}
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem>Profile</DropdownMenuItem>
              <DropdownMenuItem>Settings</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
                <LogOut className="h-4 w-4 mr-2" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
}
