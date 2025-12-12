"use client";

import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface HeaderProps {
  title?: string;
}

export function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-sm border-b border-border">
      <div className="flex items-center justify-between h-14 px-4 lg:px-6">
        <div className="flex items-center gap-4">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-[10px]">
                OG
              </span>
            </div>
            <span className="font-semibold text-sm">OGtool</span>
          </div>

          {/* Page Title */}
          {title && (
            <h1 className="hidden lg:block text-base font-semibold text-foreground">
              {title}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-1">
          {/* Search Button */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="text-muted-foreground hover:text-foreground"
          >
            <Search className="w-4 h-4" />
            <span className="sr-only">Search</span>
          </Button>

          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon-sm"
            className="relative text-muted-foreground hover:text-foreground"
          >
            <Bell className="w-4 h-4" />
            <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-primary rounded-full" />
            <span className="sr-only">Notifications</span>
          </Button>

          {/* Divider */}
          <div className="w-px h-5 bg-border mx-1" />

          {/* Avatar */}
          <Avatar className="w-7 h-7">
            <AvatarImage src="/professional-avatar.png" />
            <AvatarFallback className="bg-primary text-primary-foreground text-[10px] font-medium">
              JD
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
}
