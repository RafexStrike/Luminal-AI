"use client";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";

// These are the dialog components (no internal trigger) — shown as siblings below
// import NewCollectionDialog from "./NewCollectionDialog";
import NewCollectionDialog from "./NewCollectionFlow";
import ExistingCollectionDialog from "./ExistingCollectionFlow";
// import ExistingCollectionDialog from "./ExistingCollectionDialog";

export function SaveNoteDialogue() {
  const [open, setOpen] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showExisting, setShowExisting] = useState(false);

  // Close parent, then open requested child after a tiny delay (lets animations finish)
  const openAfterClose = (which) => {
    setOpen(false);
    setTimeout(() => {
      if (which === "new") setShowNew(true);
      if (which === "existing") setShowExisting(true);
    }, 160); // 120-200ms works fine
  };

  return (
    <>
      <AlertDialog open={open} onOpenChange={setOpen}>
        <AlertDialogTrigger asChild>
          <Button variant="outline">Save Note</Button>
        </AlertDialogTrigger>

        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Where do you want to save?</AlertDialogTitle>
            <AlertDialogDescription>
              You can create a new collection or save note to existing collection.
            </AlertDialogDescription>
          </AlertDialogHeader>

          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>

            {/* simple buttons that close parent and open the appropriate dialog */}
            <Button variant="outline" onClick={() => openAfterClose("existing")}>
              Existing Collection
            </Button>
            <Button variant="outline" onClick={() => openAfterClose("new")}>
              New Collection
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Render the child dialogs as siblings (controlled) */}
      <NewCollectionDialog open={showNew} onOpenChange={setShowNew} />
      <ExistingCollectionDialog open={showExisting} onOpenChange={setShowExisting} />
    </>
  );
}
