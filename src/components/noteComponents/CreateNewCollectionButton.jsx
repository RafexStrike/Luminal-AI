/* _   _                          _   _____                                              _   
| | | |                        | | /  __ \                                            | |  
| | | |_ __  _   _ ___  ___  __| | | /  \/ ___  _ __ ___  _ __   ___  _ __   ___ _ __ | |_ 
| | | | '_ \| | | / __|/ _ \/ _` | | |    / _ \| '_ ` _ \| '_ \ / _ \| '_ \ / _ \ '_ \| __|
| |_| | | | | |_| \__ \  __/ (_| | | \__/\ (_) | | | | | | |_) | (_) | | | |  __/ | | | |_ 
 \___/|_| |_|\__,_|___/\___|\__,_|  \____/\___/|_| |_| |_| .__/ \___/|_| |_|\___|_| |_|\__|
                                                         | |                               
                                                         |_|                               
 */
// note: this component is unused...............
// src/components/noteCompnents/CreateNewCollectionButton.jsx

import React from "react";
import { useContext } from "react";
import { Button } from "../ui/button";
import { EditorContext } from "@tiptap/react";

export default function CreateNewCollectionButton({ newCollectionName }) {
  console.log("received from child component button", newCollectionName);

  const { editor } = useContext(EditorContext);

  const handleCreateNewCollection = () => {
    const html = editor.getHTML();

    console.log("Saving the note...", html);

    fetch("/api/notesCollection", {
      method: "POST",
      headers: { "Content-type": "application/json" },
      body: JSON.stringify({
        notesCollectionName: newCollectionName,
        content: html,
      }),
    })
      .then((res) => {
        if (!res.ok) throw new Error(`status ${res.status}`);
        return res.json();
      })
      .then((data) =>
        console.log(
          "Saving to the databse - Operation successful! The data that we saved is:",
          data
        )
      )
      .catch((error) =>
        console.log(
          "Saving to the databse - Operation failed! The error is:",
          error
        )
      );
  };
  return (
    <Button onClick={handleCreateNewCollection}>Create New Collection</Button>
  );
}
