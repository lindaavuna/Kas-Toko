"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { Moon, Sun, Monitor } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const langgananKosong = () => () => {};
const diKlien = () => true;
const diServer = () => false;

function useSudahTerpasang() {
  return useSyncExternalStore(langgananKosong, diKlien, diServer);
}

export function ThemeToggle({ className }: { className?: string }) {
  const { theme, setTheme } = useTheme();
  const mounted = useSudahTerpasang();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className={className}
          aria-label="Ubah tema tampilan"
        >
          <Sun className="size-[18px] scale-100 rotate-0 transition-transform duration-200 dark:scale-0 dark:-rotate-90" />
          <Moon className="absolute size-[18px] scale-0 rotate-90 transition-transform duration-200 dark:scale-100 dark:rotate-0" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-40">
        <DropdownMenuItem onClick={() => setTheme("light")}>
          <Sun className="size-4" />
          <span>Terang</span>
          {mounted && theme === "light" && (
            <span className="ml-auto text-xs text-muted-foreground">Aktif</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("dark")}>
          <Moon className="size-4" />
          <span>Gelap</span>
          {mounted && theme === "dark" && (
            <span className="ml-auto text-xs text-muted-foreground">Aktif</span>
          )}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setTheme("system")}>
          <Monitor className="size-4" />
          <span>Sistem</span>
          {mounted && theme === "system" && (
            <span className="ml-auto text-xs text-muted-foreground">Aktif</span>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
