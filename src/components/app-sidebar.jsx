"use client";
import * as React from "react";
import { ChevronRight } from "lucide-react";

import { SearchForm } from "@/components/search-form";
import { VersionSwitcher } from "@/components/version-switcher";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

import { useState, useEffect } from "react";
import { useNote } from "@/context/NoteContext";

export function AppSidebar(props) {
  const [navData, setNavData] = useState([]);
  const { setCurrentNote } = useNote();

  console.log("NoteContext identity:", useNote());


  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const res = await fetch("/api/getBothTheNotesCollectionAndNotes");
        if (!res.ok) throw new Error("Failed to fetch sidebar data");
        const data = await res.json();
        if (!mounted) return;

        // Transform into the shape your component expects:
        // navMain: [{ title, items: [{ title, url, isActive }] }]
        const navMain = data.map((col) => ({
          title: col.collectionName,
          items: col.notes.map((note) => ({
            title: note.title,
            // url: `/notes/${note.id}`, 
            url: note.id, 
            isActive: false, // you can compute true/false based on router
          })),
        }));

        setNavData(navMain);
      } catch (err) {
        console.error(err);
      }
    }
    load();
    return () => (mounted = false);
  }, []);

  return (
    <Sidebar {...props}>
      {/* header omitted for brevity */}
      <SidebarContent className="gap-0">
        {navData.map((item) => (
          <Collapsible
            key={item.title}
            title={item.title}
            defaultOpen
            className="group/collapsible"
          >
            <SidebarGroup>
              <SidebarGroupLabel asChild className="...">
                <CollapsibleTrigger>
                  {item.title}
                  <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                </CollapsibleTrigger>
              </SidebarGroupLabel>

              <CollapsibleContent>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {item.items.map((note) => (
                      <SidebarMenuItem key={note.url}>
                        {/* <SidebarMenuButton asChild isActive={note.isActive}> */}
                        <SidebarMenuButton
                          asChild
                          onClick={() => {
                            setCurrentNote(note);
                          }}
                        >
                          {/* <a href={note.url}>{note.title}</a> */}
                          <button>{note.title}</button>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </CollapsibleContent>
            </SidebarGroup>
          </Collapsible>
        ))}
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
