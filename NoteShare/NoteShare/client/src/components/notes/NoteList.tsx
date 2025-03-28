import { Note } from "@shared/schema";
import NoteCard from "./NoteCard";
import { useLocation } from "wouter";

type NoteListProps = {
  notes: Note[];
  layout?: "grid" | "list";
};

export default function NoteList({ notes, layout = "grid" }: NoteListProps) {
  const [, navigate] = useLocation();
  
  const handleNoteClick = (noteId: number) => {
    navigate(`/notes/${noteId}`);
  };
  
  if (notes.length === 0) {
    return (
      <div className="text-center py-12">
        <i className="fas fa-file-alt text-4xl text-gray-300 mb-3"></i>
        <h3 className="text-lg font-medium text-gray-900 mb-1">No notes found</h3>
        <p className="text-gray-500">
          Try different search criteria or upload your own notes
        </p>
      </div>
    );
  }
  
  if (layout === "grid") {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {notes.map(note => (
          <NoteCard 
            key={note.id} 
            note={note} 
            layout="grid"
            onClick={handleNoteClick}
          />
        ))}
      </div>
    );
  }
  
  return (
    <div className="space-y-4">
      {notes.map(note => (
        <NoteCard 
          key={note.id} 
          note={note} 
          layout="list"
          onClick={handleNoteClick}
        />
      ))}
    </div>
  );
}
