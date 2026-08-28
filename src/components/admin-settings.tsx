"use client";

import { User, Palette } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ProfileTab } from "@/components/settings/profile-tab";
import { SiteSettingsTab } from "@/components/settings/site-settings-tab";

export function AdminSettings({ userFullName, userPhone }: { userFullName: string; userPhone: string }) {
  return (
    <div className="max-w-lg space-y-4">
      <h1 className="text-xl font-semibold">Sozlamalar</h1>
      <Tabs defaultValue="profile">
        <div className="overflow-x-auto">
          <TabsList variant="line">
            <TabsTrigger value="profile" className="gap-1.5">
              <User />
              Foydalanuvchi
            </TabsTrigger>
            <TabsTrigger value="site" className="gap-1.5">
              <Palette />
              Sayt
            </TabsTrigger>
          </TabsList>
        </div>
        <TabsContent value="profile" keepMounted>
          <ProfileTab fullName={userFullName} phone={userPhone} />
        </TabsContent>
        <TabsContent value="site" keepMounted>
          <SiteSettingsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
