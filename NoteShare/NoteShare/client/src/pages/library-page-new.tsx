import { useQuery } from "@tanstack/react-query";
import { Note, Download, Like } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import NoteList from "@/components/notes/NoteList";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Download as DownloadIcon, Heart, Bookmark, History } from "lucide-react";

export default function LibraryPage() {
  const { user } = useAuth();
  
  // Fetch user's downloaded notes
  const { data: downloads, isLoading: downloadsLoading } = useQuery<Download[]>({
    queryKey: [`/api/user/downloads`],
    enabled: !!user,
  });
  
  // Fetch user's saved notes
  const { data: savedNotes, isLoading: savedLoading } = useQuery<Note[]>({
    queryKey: [`/api/user/saved`],
    enabled: !!user,
  });
  
  // Get all notes
  const { data: allNotes, isLoading: notesLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes"],
    enabled: !!user,
  });
  
  // Get user likes
  const { data: userLikes, isLoading: likesLoading } = useQuery<Like[]>({
    queryKey: [`/api/user/likes`],
    enabled: !!user,
  });
  
  // Get user's downloaded notes
  const downloadedNotes = allNotes && downloads 
    ? allNotes.filter(note => downloads.some(download => download.noteId === note.id))
    : [];
  
  // Get user's liked notes
  const likedNotes = allNotes && userLikes 
    ? allNotes.filter(note => userLikes.some(like => like.noteId === note.id))
    : [];
  
  const isLoading = downloadsLoading || notesLoading || likesLoading || savedLoading;
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Sidebar />
          
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-gray-900 mb-6">My Library</h1>
            
            <Tabs defaultValue="downloads" className="mb-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="downloads" className="flex items-center">
                  <DownloadIcon className="h-4 w-4 mr-2" />
                  Downloads
                </TabsTrigger>
                <TabsTrigger value="likes" className="flex items-center">
                  <Heart className="h-4 w-4 mr-2" />
                  Liked Notes
                </TabsTrigger>
                <TabsTrigger value="saved" className="flex items-center">
                  <Bookmark className="h-4 w-4 mr-2" />
                  Saved for Later
                </TabsTrigger>
              </TabsList>
              
              <TabsContent value="downloads" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Downloaded Notes</CardTitle>
                    <CardDescription>Notes you've downloaded</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : downloadedNotes.length > 0 ? (
                      <NoteList notes={downloadedNotes} layout="list" />
                    ) : (
                      <div className="text-center py-12">
                        <DownloadIcon className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No downloads yet</h3>
                        <p className="text-gray-500">
                          Browse the notes library and download content
                        </p>
                        <Button 
                          className="mt-4"
                          onClick={() => window.location.href = "/search"}
                        >
                          Browse Notes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="likes" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Liked Notes</CardTitle>
                    <CardDescription>Notes you've liked</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : likedNotes && likedNotes.length > 0 ? (
                      <NoteList notes={likedNotes} layout="list" />
                    ) : (
                      <div className="text-center py-12">
                        <Heart className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No liked notes yet</h3>
                        <p className="text-gray-500">
                          Like notes to save them to this collection
                        </p>
                        <Button 
                          className="mt-4"
                          onClick={() => window.location.href = "/search"}
                        >
                          Browse Notes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
              
              <TabsContent value="saved" className="mt-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Saved for Later</CardTitle>
                    <CardDescription>Notes you've bookmarked</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {isLoading ? (
                      <div className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-24 w-full" />
                      </div>
                    ) : savedNotes && savedNotes.length > 0 ? (
                      <NoteList notes={savedNotes} layout="list" />
                    ) : (
                      <div className="text-center py-12">
                        <Bookmark className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No saved notes yet</h3>
                        <p className="text-gray-500">
                          Save notes to read later
                        </p>
                        <Button 
                          className="mt-4"
                          onClick={() => window.location.href = "/search"}
                        >
                          Browse Notes
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
            
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2" />
                  Recent Activity
                </CardTitle>
                <CardDescription>Your recent interactions with notes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {downloadedNotes.length > 0 ? (
                    <div className="text-sm text-gray-600">
                      <p className="mb-2">You downloaded <span className="font-semibold">{downloadedNotes[0].title}</span> on {new Date(downloadedNotes[0].createdAt).toLocaleDateString()}</p>
                      
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => window.location.href = `/notes/${downloadedNotes[0].id}`}
                      >
                        View Note
                      </Button>
                    </div>
                  ) : (
                    <div className="text-center py-6 text-gray-500">
                      <p>No recent activity to show</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}