import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  User, 
  Settings, 
  LogOut, 
  ChevronDown,
  Bell,
  Palette
} from "lucide-react";
import { authUtils } from "@/utils/auth";

interface UserMenuProps {
  className?: string;
}

interface User {
  id: number;
  firstName: string;
  lastName?: string | null;
  username?: string | null;
  currentPrinciple: number;
  telegramConnected: boolean;
  stats?: any;
}

export default function UserMenu({ className }: UserMenuProps) {
  const [, setLocation] = useLocation();
  
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ["/api/user/me"],
  });

  const handleLogout = () => {
    authUtils.clearAuth();
    setLocation("/login");
  };

  const getInitials = (firstName?: string | null, lastName?: string | null) => {
    if (!firstName) return "U";
    return `${firstName.charAt(0)}${lastName ? lastName.charAt(0) : ""}`.toUpperCase();
  };

  // Always show the menu, even if loading or no user data
  const displayUser = user || {
    firstName: "Користувач",
    lastName: null,
    username: "користувач"
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={`flex items-center gap-2 p-2 h-auto hover:bg-white/10 ${className || ''}`}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm font-medium">
              {isLoading ? "..." : getInitials(displayUser.firstName, displayUser.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium text-foreground">
              {isLoading ? "Завантаження..." : `${displayUser.firstName} ${displayUser.lastName || ""}`}
            </span>
            <span className="text-xs text-muted-foreground">
              @{isLoading ? "..." : (displayUser.username || "користувач")}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Мій акаунт</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        {user && (
          <>
            <DropdownMenuItem onClick={() => setLocation("/profile")}>
              <User className="mr-2 h-4 w-4" />
              Профіль
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setLocation("/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Налаштування
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setLocation("/reminders")}>
              <Bell className="mr-2 h-4 w-4" />
              Нагадування
            </DropdownMenuItem>
            
            <DropdownMenuItem onClick={() => setLocation("/theme")}>
              <Palette className="mr-2 h-4 w-4" />
              Тема
            </DropdownMenuItem>
            
            <DropdownMenuSeparator />
          </>
        )}
        
        <DropdownMenuItem onClick={handleLogout}>
          <LogOut className="mr-2 h-4 w-4" />
          Вийти
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}