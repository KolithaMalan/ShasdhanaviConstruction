"use client";

import type { ReactNode } from "react";
import { LayoutDashboard, FileText } from "lucide-react";

import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { SiteOverviewDashboard } from "@/components/admin/SiteOverviewDashboard";

/**
 * Nuwan's dashboard shell. "Site Overview" is the primary (default) tab; the
 * previous operational dashboard is kept intact on the second tab.
 */
export function AdminDashboardTabs({ operationsSlot }: { operationsSlot: ReactNode }) {
  return (
    <Tabs defaultValue="overview" className="space-y-6">
      <TabsList className="w-full sm:w-auto">
        <TabsTrigger value="overview">
          <LayoutDashboard className="mr-1.5 h-4 w-4" />
          Site Overview
        </TabsTrigger>
        <TabsTrigger value="operations">
          <FileText className="mr-1.5 h-4 w-4" />
          Operations
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview">
        <SiteOverviewDashboard />
      </TabsContent>
      <TabsContent value="operations">{operationsSlot}</TabsContent>
    </Tabs>
  );
}
