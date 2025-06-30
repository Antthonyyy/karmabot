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
  UserCircle,
  Bell,
  Palette,
  Shield
} from "lucide-react";
import { authUtils } from "@/utils/auth";

interface UserMenuProps {
  className?: string;
}

export default function UserMenu({ className }: UserMenuProps) {
  const [, setLocation] = useLocation();
  
  const { data: user } = useQuery({
    queryKey: ["/api/user/me"],
  });

  const handleLogout = () => {
    authUtils.clearAuth();
    setLocation("/login");
  };

  const getInitials = (firstName?: string, lastName?: string) => {
    if (!firstName) return "U";
    return `${firstName.charAt(0)}${lastName ? lastName.charAt(0) : ""}`.toUpperCase();
  };

  if (!user) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="ghost" 
          className={`flex items-center gap-2 p-2 h-auto hover:bg-white/10 ${className}`}
        >
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-purple-600 text-white text-sm font-medium">
              {getInitials(user.firstName, user.lastName)}
            </AvatarFallback>
          </Avatar>
          <div className="hidden sm:flex flex-col items-start">
            <span className="text-sm font-medium text-foreground">
              {user.firstName} {user.lastName || ""}
            </span>
            <span className="text-xs text-muted-foreground">
              @{user.username || "користувач"}
            </span>
          </div>
          <ChevronDown className="h-4 w-4 text-muted-foreground" />
        </Button>
      </DropdownMenuTrigger>
      
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="flex items-center gap-2">
          <UserCircle className="h-4 w-4" />
          Мій акаунт
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={() => setLocation("/profile")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <User className="h-4 w-4" />
          Профіль користувача
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setLocation("/settings")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Settings className="h-4 w-4" />
          Налаштування
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setLocation("/settings#notifications")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Bell className="h-4 w-4" />
          Нагадування
        </DropdownMenuItem>
        
        <DropdownMenuItem 
          onClick={() => setLocation("/settings#theme")}
          className="flex items-center gap-2 cursor-pointer"
        >
          <Palette className="h-4 w-4" />
          Тема оформлення
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="flex items-center gap-2 cursor-pointer text-red-600 dark:text-red-400 focus:text-red-600 dark:focus:text-red-400"
        >
          <LogOut className="h-4 w-4" />
          Вийти з акаунта
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}