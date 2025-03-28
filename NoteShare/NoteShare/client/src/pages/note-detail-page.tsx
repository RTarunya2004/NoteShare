import { useState } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Note, Comment, User } from "@shared/schema";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { ThumbsUp, ThumbsDown, MessageSquare, Download, Eye } from "lucide-react";

const commentSchema = z.object({
  content: z.string().min(3, "Comment must be at least 3 characters"),
});

type CommentFormValues = z.infer<typeof commentSchema>;

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [, navigate] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiked, setIsLiked] = useState(false);
  
  // Fetch note details
  const { data: note, isLoading } = useQuery<Note>({
    queryKey: [`/api/notes/${id}`],
    enabled: !!id,
  });
  
  // Fetch uploader info
  const { data: noteUploader, isLoading: uploaderLoading } = useQuery<User>({
    queryKey: [`/api/users/${note?.userId}`],
    enabled: !!note?.userId,
  });
  
  // Fetch comments
  const { data: comments, isLoading: commentsLoading } = useQuery<Comment[]>({
    queryKey: [`/api/notes/${id}/comments`],
    enabled: !!id,
  });
  
  // Create a map to store comment author data
  const [commentAuthors, setCommentAuthors] = useState<Record<number, User>>({});
  
  // Fetch comment author information when comments load
  useQuery<void>({
    queryKey: [`/api/notes/${id}/comments/authors`],
    enabled: !!comments && comments.length > 0,
    queryFn: async () => {
      if (!comments) return;
      
      // Create a set of unique user IDs from comments
      const userIds = new Set(comments.map(comment => comment.userId));
      
      // Fetch user data for each unique user ID
      const authors: Record<number, User> = {};
      
      await Promise.all(Array.from(userIds).map(async (userId) => {
        try {
          const response = await fetch(`/api/users/${userId}`);
          if (response.ok) {
            const userData = await response.json();
            authors[userId] = userData;
          }
        } catch (error) {
          console.error("Error fetching comment author:", error);
        }
      }));
      
      setCommentAuthors(authors);
    }
  });
  
  // Comment form
  const form = useForm<CommentFormValues>({
    resolver: zodResolver(commentSchema),
    defaultValues: {
      content: "",
    },
  });
  
  // Add comment mutation
  const commentMutation = useMutation({
    mutationFn: async (data: CommentFormValues) => {
      const res = await apiRequest("POST", `/api/notes/${id}/comments`, data);
      return await res.json();
    },
    onSuccess: () => {
      form.reset();
      toast({
        title: "Comment added",
        description: "Your comment has been added successfully.",
      });
      queryClient.invalidateQueries({ queryKey: [`/api/notes/${id}/comments`] });
      queryClient.invalidateQueries({ queryKey: [`/api/notes/${id}/comments/authors`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to add comment",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Like mutation
  const likeMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/notes/${id}/like`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      setIsLiked(data.isLiked);
      queryClient.invalidateQueries({ queryKey: [`/api/notes/${id}`] });
    },
    onError: (error) => {
      toast({
        title: "Failed to like note",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  // Download mutation
  const downloadMutation = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("POST", `/api/notes/${id}/download`, {});
      return await res.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Download successful",
        description: "Your file is being downloaded.",
      });
      
      // Implement actual file download
      if (data.fileUrl) {
        // Create a temporary anchor element
        const downloadLink = document.createElement('a');
        
        // Build the download URL - In a real application this would be a proper secure URL
        downloadLink.href = data.fileUrl.startsWith("http") 
          ? data.fileUrl
          : `/api/files/${data.fileName}`;
          
        // Set download attribute to suggest filename to browser
        downloadLink.download = data.fileName || 'download';
        
        // Append to the body
        document.body.appendChild(downloadLink);
        
        // Trigger the download
        downloadLink.click();
        
        // Clean up
        document.body.removeChild(downloadLink);
      }
      
      queryClient.invalidateQueries({ queryKey: [`/api/notes/${id}`] });
      queryClient.invalidateQueries({ queryKey: ["/api/user/stats"] });
    },
    onError: (error: any) => {
      if (error.message.includes("Insufficient coins")) {
        toast({
          title: "Insufficient coins",
          description: "You don't have enough coins to download this premium note.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Download failed",
          description: error.message,
          variant: "destructive",
        });
      }
    },
  });
  
  const onCommentSubmit = (data: CommentFormValues) => {
    commentMutation.mutate(data);
  };
  
  const handleLike = () => {
    likeMutation.mutate();
  };
  
  const handleDownload = () => {
    downloadMutation.mutate();
  };
  
  function getUserInitials(username: string) {
    return username.substring(0, 2).toUpperCase();
  }
  
  function getFileIcon(fileType: string) {
    switch (fileType) {
      case 'pdf': return "fas fa-file-pdf";
      case 'docx': case 'doc': return "fas fa-file-word";
      case 'xlsx': case 'csv': return "fas fa-file-excel";
      case 'ppt': case 'pptx': return "fas fa-file-powerpoint";
      case 'zip': return "fas fa-file-archive";
      case 'txt': case 'md': case 'tex': return "fas fa-file-alt";
      default: return "fas fa-file";
    }
  }
  
  if (isLoading) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Sidebar />
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm p-6">
                <Skeleton className="h-8 w-3/4 mb-4" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-full mb-2" />
                <Skeleton className="h-4 w-2/3 mb-6" />
                <div className="flex space-x-4 mb-6">
                  <Skeleton className="h-10 w-24" />
                  <Skeleton className="h-10 w-24" />
                </div>
                <Skeleton className="h-40 w-full" />
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  if (!note) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-6">
          <div className="flex flex-col md:flex-row gap-6">
            <Sidebar />
            <div className="flex-1">
              <div className="bg-white rounded-lg shadow-sm p-6 text-center">
                <h1 className="text-2xl font-bold text-gray-900 mb-4">Note Not Found</h1>
                <p className="text-gray-600 mb-6">The note you're looking for doesn't exist or has been removed.</p>
                <Button onClick={() => navigate("/")}>Return Home</Button>
              </div>
            </div>
          </div>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Sidebar />
          
          <div className="flex-1">
            <div className="bg-white rounded-lg shadow-sm overflow-hidden">
              {/* Note header */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="flex-shrink-0 w-10 h-10 bg-primary text-white flex items-center justify-center rounded-lg mr-4">
                    <i className={getFileIcon(note.fileType)}></i>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">{note.title}</h1>
                    <div className="flex items-center text-sm text-gray-500 mt-1">
                      <span className="mr-3">{note.fileType.toUpperCase()} • {(note.fileSize / 1024).toFixed(1)} KB</span>
                      <span className="mr-3"><i className="fas fa-download mr-1"></i> {note.downloads}</span>
                      <span><i className="fas fa-heart mr-1"></i> {note.likes}</span>
                    </div>
                  </div>
                  {note.isPremium && (
                    <Badge className="ml-auto bg-orange-500 hover:bg-orange-600">Premium</Badge>
                  )}
                </div>
                
                <p className="text-gray-700 mb-4">{note.description}</p>
                
                {note.tags && note.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {note.tags.map(tag => (
                      <Badge key={tag} variant="outline">{tag}</Badge>
                    ))}
                  </div>
                )}
                
                <div className="flex items-center justify-between mt-6">
                  <div className="flex items-center">
                    <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs mr-2">
                      <span>{getUserInitials(noteUploader?.username || "")}</span>
                    </div>
                    <div className="text-sm">
                      <span className="text-gray-900 font-medium">Uploaded by: {noteUploader?.username || "Unknown user"}</span>
                      <span className="text-gray-500 block text-xs">
                        {new Date(note.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button 
                      size="sm" 
                      variant="outline" 
                      onClick={handleLike}
                      disabled={likeMutation.isPending}
                      className={isLiked ? "bg-blue-50" : ""}
                    >
                      {isLiked ? <ThumbsUp className="h-4 w-4 mr-1" /> : <ThumbsUp className="h-4 w-4 mr-1" />}
                      Like
                    </Button>
                    <Button size="sm" variant="outline">
                      <Eye className="h-4 w-4 mr-1" />
                      Preview
                    </Button>
                    <Button 
                      size="sm" 
                      onClick={handleDownload}
                      disabled={downloadMutation.isPending}
                    >
                      <Download className="h-4 w-4 mr-1" />
                      {note.isPremium ? `Download (${note.coinPrice} Coins)` : "Download Free"}
                    </Button>
                  </div>
                </div>
              </div>
              
              {/* Comments section */}
              <div className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Comments</h2>
                
                {/* Comment form */}
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onCommentSubmit)} className="mb-6">
                    <FormField
                      control={form.control}
                      name="content"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea 
                              placeholder="Add a comment..." 
                              className="resize-none"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <div className="mt-2 flex justify-end">
                      <Button 
                        type="submit"
                        size="sm"
                        disabled={commentMutation.isPending}
                      >
                        {commentMutation.isPending ? "Posting..." : "Post Comment"}
                      </Button>
                    </div>
                  </form>
                </Form>
                
                {/* Comments list */}
                {commentsLoading ? (
                  <div className="space-y-4">
                    <Skeleton className="h-24 w-full" />
                    <Skeleton className="h-24 w-full" />
                  </div>
                ) : comments && comments.length > 0 ? (
                  <div className="space-y-4">
                    {comments.map(comment => (
                      <Card key={comment.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start">
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center text-xs mr-3">
                              <span>{getUserInitials(commentAuthors[comment.userId]?.username || "")}</span>
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <span className="font-medium text-gray-900">
                                  {commentAuthors[comment.userId]?.username || "Unknown user"}
                                </span>
                                <span className="text-xs text-gray-500">
                                  {new Date(comment.createdAt).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-gray-700">{comment.content}</p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <div className="text-center p-6 text-gray-500">
                    <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                    <p>No comments yet. Be the first to comment!</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
