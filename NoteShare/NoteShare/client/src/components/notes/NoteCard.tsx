import { useAuth } from "@/hooks/use-auth";
import { Note } from "@shared/schema";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Download, Heart, FileText, Coins, Calendar, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type NoteCardProps = {
  note: Note;
  layout?: "grid" | "list";
  onClick?: (noteId: number) => void;
};

export default function NoteCard({ note, layout = "grid", onClick }: NoteCardProps) {
  const { user } = useAuth();
  
  // Helper functions
  const getFileIcon = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf': return "fa-file-pdf";
      case 'docx': case 'doc': return "fa-file-word";
      case 'xlsx': case 'csv': return "fa-file-excel";
      case 'ppt': case 'pptx': return "fa-file-powerpoint";
      case 'zip': return "fa-file-archive";
      case 'txt': return "fa-file-alt";
      case 'md': return "fa-file-alt";
      case 'tex': return "fa-file-code";
      case 'json': return "fa-file-code";
      default: return "fa-file";
    }
  };
  
  const getFileTypeClass = (fileType: string) => {
    switch (fileType.toLowerCase()) {
      case 'pdf': return "bg-red-100 text-red-800";
      case 'docx': case 'doc': return "bg-blue-100 text-blue-800";
      case 'xlsx': case 'csv': return "bg-green-100 text-green-800";
      case 'ppt': case 'pptx': return "bg-orange-100 text-orange-800";
      case 'zip': return "bg-gray-100 text-gray-800";
      case 'txt': return "bg-gray-100 text-gray-800";
      case 'md': return "bg-purple-100 text-purple-800";
      case 'tex': return "bg-yellow-100 text-yellow-800";
      case 'json': return "bg-indigo-100 text-indigo-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };
  
  const getUserInitials = (username?: string) => {
    return username ? username.substring(0, 2).toUpperCase() : "UN";
  };
  
  const handleCardClick = () => {
    if (onClick) {
      onClick(note.id);
    } else {
      window.location.href = `/notes/${note.id}`;
    }
  };
  
  // Grid layout (card view)
  if (layout === "grid") {
    return (
      <Card 
        className="group bg-white rounded-lg shadow-sm overflow-hidden relative hover:shadow-md transition-all duration-300 hover:translate-y-[-2px]"
        onClick={handleCardClick}
      >
        {/* Premium badge */}
        {note.isPremium && (
          <div className="absolute top-2 right-2 z-10">
            <Badge 
              variant="outline" 
              className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 font-medium"
            >
              <Coins className="h-3 w-3 mr-1" /> Premium
            </Badge>
          </div>
        )}
        
        {/* File type badge with gradient background based on file type */}
        <div className="absolute top-2 left-2 z-10">
          <Badge 
            variant="outline" 
            className={cn(
              "border-0 font-medium text-white",
              note.fileType.toLowerCase() === 'pdf' ? "bg-gradient-to-r from-red-500 to-red-600" :
              note.fileType.toLowerCase() === 'docx' || note.fileType.toLowerCase() === 'doc' ? "bg-gradient-to-r from-blue-500 to-blue-600" :
              note.fileType.toLowerCase() === 'xlsx' || note.fileType.toLowerCase() === 'csv' ? "bg-gradient-to-r from-green-500 to-green-600" :
              note.fileType.toLowerCase() === 'ppt' || note.fileType.toLowerCase() === 'pptx' ? "bg-gradient-to-r from-orange-500 to-orange-600" :
              "bg-gradient-to-r from-gray-500 to-gray-600"
            )}
          >
            <FileText className="h-3 w-3 mr-1" /> {note.fileType.toUpperCase()}
          </Badge>
        </div>
        
        <CardContent className="p-4 pt-10">
          {/* Title and description */}
          <div className="mb-4">
            <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 group-hover:text-primary transition-colors">
              {note.title}
            </h3>
            <p className="text-gray-500 text-sm line-clamp-2">{note.description}</p>
          </div>
          
          {/* Stats row */}
          <div className="flex items-center justify-between text-xs text-gray-500 mb-3">
            <div className="flex items-center gap-3">
              <span className="flex items-center">
                <Download className="h-3.5 w-3.5 mr-1 opacity-70" /> {note.downloads}
              </span>
              <span className="flex items-center">
                <Heart className="h-3.5 w-3.5 mr-1 opacity-70" /> {note.likes}
              </span>
            </div>
            <span className="flex items-center">
              <Calendar className="h-3.5 w-3.5 mr-1 opacity-70" /> 
              {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </div>
          
          {/* User and file info */}
          <div className="flex items-center justify-between">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2">
                    <Avatar className="h-6 w-6 bg-primary/10">
                      <AvatarFallback className="text-xs text-primary">{getUserInitials(user?.username)}</AvatarFallback>
                    </Avatar>
                    <span className="text-xs font-medium text-gray-700">{user?.username || "User"}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">
                  <p className="text-xs">Content creator</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            
            <span className="text-xs text-gray-500">{formatFileSize(note.fileSize)}</span>
          </div>
        </CardContent>
        
        <CardFooter className="p-0 border-t">
          <div className="grid grid-cols-2 w-full">
            <Button 
              variant="ghost" 
              className="py-3 rounded-none h-auto text-gray-600 hover:text-primary hover:bg-gray-50/80"
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/notes/${note.id}`;
              }}
            >
              <Eye className="h-4 w-4 mr-2" /> Preview
            </Button>
            
            <Button 
              variant={note.isPremium ? "default" : "secondary"} 
              className={cn(
                "py-3 rounded-none h-auto",
                note.isPremium 
                  ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary" 
                  : "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600"
              )}
              onClick={(e) => {
                e.stopPropagation();
                window.location.href = `/notes/${note.id}`;
              }}
            >
              {note.isPremium ? (
                <>
                  <Coins className="h-4 w-4 mr-2" /> {note.coinPrice || 0} Coins
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" /> Free
                </>
              )}
            </Button>
          </div>
        </CardFooter>
      </Card>
    );
  }
  
  // List layout
  return (
    <Card 
      className="group bg-white rounded-lg shadow-sm overflow-hidden border-gray-200 hover:shadow-md transition-all duration-300 cursor-pointer flex flex-col md:flex-row"
      onClick={handleCardClick}
    >
      {/* Left section with file type icon */}
      <div className="flex-shrink-0 bg-gray-50 border-r border-b md:border-b-0 border-gray-100 p-4 flex items-center justify-center md:w-16">
        <div 
          className={cn(
            "w-12 h-12 flex items-center justify-center rounded-md",
            note.fileType.toLowerCase() === 'pdf' ? "bg-red-50 text-red-500" :
            note.fileType.toLowerCase() === 'docx' || note.fileType.toLowerCase() === 'doc' ? "bg-blue-50 text-blue-500" :
            note.fileType.toLowerCase() === 'xlsx' || note.fileType.toLowerCase() === 'csv' ? "bg-green-50 text-green-500" :
            note.fileType.toLowerCase() === 'ppt' || note.fileType.toLowerCase() === 'pptx' ? "bg-orange-50 text-orange-500" :
            "bg-gray-100 text-gray-500"
          )}
        >
          <FileText className="h-6 w-6" />
        </div>
      </div>
      
      {/* Middle content section */}
      <div className="flex-1 p-4">
        <div className="flex flex-wrap items-center gap-2 mb-1.5">
          <h3 className="font-medium text-gray-900 group-hover:text-primary transition-colors">
            {note.title}
          </h3>
          
          {/* Premium or Free badge */}
          {note.isPremium ? (
            <Badge variant="outline" className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0">
              <Coins className="h-3 w-3 mr-1" /> Premium
            </Badge>
          ) : (
            <Badge variant="outline" className="bg-gradient-to-r from-green-500 to-green-600 text-white border-0">
              <Download className="h-3 w-3 mr-1" /> Free
            </Badge>
          )}
        </div>
        
        {/* Description */}
        <p className="text-gray-500 text-sm line-clamp-1 mb-2">{note.description}</p>
        
        {/* Stats row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
          <span className="flex items-center">
            <Badge variant="outline" className="mr-1.5 h-5 bg-gray-50 text-gray-700">
              {note.fileType.toUpperCase()}
            </Badge>
            {formatFileSize(note.fileSize)}
          </span>
          
          <span className="flex items-center">
            <Download className="h-3.5 w-3.5 mr-1 opacity-70" /> {note.downloads}
          </span>
          
          <span className="flex items-center">
            <Heart className="h-3.5 w-3.5 mr-1 opacity-70" /> {note.likes}
          </span>
          
          <span className="flex items-center">
            <Calendar className="h-3.5 w-3.5 mr-1 opacity-70" />
            {new Date(note.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          
          <span className="flex items-center">
            <User className="h-3.5 w-3.5 mr-1 opacity-70" />
            {user?.username || "User"}
          </span>
          
          {note.isPremium && (
            <span className="flex items-center">
              <Coins className="h-3.5 w-3.5 mr-1 opacity-70" /> {note.coinPrice || 0}
            </span>
          )}
        </div>
      </div>
      
      {/* Right actions section */}
      <div className="flex flex-row md:flex-col border-t md:border-l md:border-t-0 border-gray-100">
        <Button 
          variant="ghost" 
          className="flex-1 md:flex-none md:w-16 py-3 md:py-4 rounded-none h-auto text-gray-600 hover:text-primary hover:bg-gray-50"
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `/notes/${note.id}`;
          }}
        >
          <Eye className="h-4 w-4" />
          <span className="ml-2 md:hidden">Preview</span>
        </Button>
        
        <Button 
          variant={note.isPremium ? "default" : "secondary"} 
          className={cn(
            "flex-1 md:flex-none md:w-16 py-3 md:py-4 rounded-none h-auto",
            note.isPremium 
              ? "bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary" 
              : "bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-600"
          )}
          onClick={(e) => {
            e.stopPropagation();
            window.location.href = `/notes/${note.id}`;
          }}
        >
          {note.isPremium ? (
            <>
              <Coins className="h-4 w-4" />
              <span className="ml-2 md:hidden">{note.coinPrice || 0}</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span className="ml-2 md:hidden">Free</span>
            </>
          )}
        </Button>
      </div>
    </Card>
  );
}
