"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";

// Map routes to page titles
const routeTitles: Record<string, string> = {
  "/dashboard": "Dashboard",
  "/billing": "Billing",
  "/invoices": "Invoices",
  "/settings": "Settings",
  "/new": "New",
};

export function SiteHeader() {
  const pathname = usePathname();
  
  // Get title from route mapping, default to "Dashboard" if not found
  const pageTitle = routeTitles[pathname] || "Dashboard";

  return (
    <header className="flex h-16 shrink-0 items-center gap-2 border-b">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator
          orientation="vertical"
          className="data-[orientation=vertical]:h-4"
        />
        <h1 className="text-lg font-semibold">{pageTitle}</h1>
      </div>
      <div className="flex items-center flex-1 justify-end px-4">
        <ThemeToggle />
      </div>
    </header>
  );
}

