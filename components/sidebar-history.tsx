"use client";

import { mockSession, type MockUser } from "@/lib/mock-session";
import { SidebarGroup, SidebarGroupContent } from "@/components/ui/sidebar";

interface SidebarHistoryProps {
  user?: MockUser;
}

export function SidebarHistory({
  user = mockSession.user,
}: SidebarHistoryProps) {
  return (
    <div className="flex-1 overflow-hidden">
      <SidebarGroup>
        <SidebarGroupContent>
          <div className="px-2 text-zinc-500 w-full flex flex-row justify-center items-center text-sm gap-2">
            Your conversations will appear here
          </div>
        </SidebarGroupContent>
      </SidebarGroup>
    </div>
  );
}
