"use client"

import { AppSidebar } from "@/components/app-sidebar";
import { SimpleEditor } from "@/components/tiptap-templates/simple/simple-editor";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { NoteProvider } from "@/context/NoteContext";

export default function Page() {
  return (
    <NoteProvider>
      <div>
        <SidebarProvider>
          <AppSidebar />
          <SidebarInset>
            <SidebarTrigger className="-ml-1" />

            <div className="flex flex-col flex-1">
              <SimpleEditor />
            </div>
          </SidebarInset>
        </SidebarProvider>
      </div>
    </NoteProvider>
  );
}
