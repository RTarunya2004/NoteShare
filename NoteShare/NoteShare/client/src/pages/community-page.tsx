import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Discussion, DiscussionReply } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";

import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { MessageCircle, Eye, Heart, Plus, Send } from "lucide-react";

// Discussion form schema
const discussionSchema = z.object({
  title: z.string().min(5, "Title must be at least 5 characters."),
  content: z.string().min(10, "Content must be at least 10 characters."),
  category: z.string().min(1, "Please select a category.")
});

// Reply form schema
const replySchema = z.object({
  content: z.string().min(2, "Reply must be at least 2 characters."),
  parentReplyId: z.number().optional().nullable(),
  // Allow for attaching images or files in chat
  attachmentUrl: z.string().optional(),
  attachmentType: z.string().optional()
});

type DiscussionFormValues = z.infer<typeof discussionSchema>;
type ReplyFormValues = z.infer<typeof replySchema>;

// The discussion detail component
function DiscussionDetail({ discussionId }: { discussionId: number }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch discussion details
  const { data: discussion, isLoading: discussionLoading } = useQuery<Discussion>({
    queryKey: ["/api/discussions", discussionId],
    enabled: !!discussionId
  });
  
  // Fetch replies to this discussion
  const { data: replies, isLoading: repliesLoading } = useQuery<DiscussionReply[]>({
    queryKey: ["/api/discussions", discussionId, "replies"],
    enabled: !!discussionId
  });
  
  // Reply form
  const form = useForm<ReplyFormValues>({
    resolver: zodResolver(replySchema),
    defaultValues: {
      content: "",
      parentReplyId: null,
      attachmentUrl: "",
      attachmentType: ""
    }
  });
  
  // State for tracking which reply we're responding to
  const [replyingTo, setReplyingTo] = useState<DiscussionReply | null>(null);
  
  // Reply mutation
  const replyMutation = useMutation({
    mutationFn: async (data: ReplyFormValues) => {
      const res = await apiRequest("POST", `/api/discussions/${discussionId}/replies`, data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discussions", discussionId, "replies"] });
      form.reset();
      toast({
        title: "Reply posted",
        description: "Your reply has been posted successfully.",
        variant: "default"
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to post reply",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handler for submitting a reply
  const onSubmitReply = (data: ReplyFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to post replies.",
        variant: "destructive"
      });
      return;
    }
    
    replyMutation.mutate(data);
  };
  
  // Helper to format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };
  
  // Get user initials for avatar
  const getUserInitials = (username: string) => {
    return username
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase();
  };
  
  if (discussionLoading || repliesLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-3/4" />
        <Skeleton className="h-4 w-1/4" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-6 w-1/3" />
        <div className="space-y-4 mt-6">
          <Skeleton className="h-20 w-full" />
          <Skeleton className="h-20 w-full" />
        </div>
      </div>
    );
  }
  
  if (!discussion) {
    return <div>Discussion not found</div>;
  }
  
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex justify-between">
            <div>
              <CardTitle className="text-xl">{discussion.title}</CardTitle>
              <CardDescription className="flex items-center space-x-2 mt-1">
                <span>Posted by {discussion.userId}</span>
                <span>•</span>
                <span>{formatDate(discussion.createdAt)}</span>
                <span>•</span>
                <span className="capitalize">{discussion.category}</span>
              </CardDescription>
            </div>
            <div className="flex items-center space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                <span>{discussion.views}</span>
              </div>
              <div className="flex items-center">
                <Heart className="h-4 w-4 mr-1" />
                <span>{discussion.likes}</span>
              </div>
              <div className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-1" />
                <span>{replies?.length || 0}</span>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p>{discussion.content}</p>
          </div>
        </CardContent>
      </Card>
      
      <h3 className="text-lg font-medium mt-8 mb-4">Replies ({replies?.length || 0})</h3>
      
      {replies && replies.length > 0 ? (
        <div className="space-y-4">
          {replies.map((reply) => {
            // Determine if this is a parent or child reply
            const isParentReply = reply.parentReplyId === null;
            const hasChildren = replies.some(r => r.parentReplyId === reply.id);
            
            return (
              <div key={reply.id} className={`${!isParentReply ? "ml-12" : ""}`}>
                <Card className={`${isParentReply ? "" : "border-l-4 border-primary/20"}`}>
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <div className="flex items-center">
                        <Avatar className="h-8 w-8 mr-2">
                          <AvatarFallback>{getUserInitials("User " + reply.userId)}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">User {reply.userId}</div>
                          <div className="text-xs text-gray-500">{formatDate(reply.createdAt)}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        <Button 
                          variant="ghost" 
                          size="sm"
                          className="h-8 px-2"
                          onClick={() => {
                            setReplyingTo(reply);
                            form.setValue("parentReplyId", reply.id);
                            // Scroll to reply form
                            document.getElementById("reply-form")?.scrollIntoView({ behavior: "smooth" });
                          }}
                        >
                          <MessageCircle className="h-4 w-4 mr-1" />
                          Reply
                        </Button>
                        <div className="flex items-center">
                          <Heart className="h-4 w-4 mr-1" />
                          <span>{reply.likes}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    {/* If replying to someone, show who */}
                    {reply.parentReplyId && (
                      <div className="text-sm text-muted-foreground mb-2">
                        Replying to User {
                          replies.find(r => r.id === reply.parentReplyId)?.userId || "unknown"
                        }
                      </div>
                    )}
                    <div className="prose prose-sm max-w-none">
                      <p>{reply.content}</p>
                    </div>
                    {/* If this has an attachment, show it */}
                    {reply.attachmentUrl && (
                      <div className="mt-3 p-2 border rounded-md bg-muted/50 inline-block">
                        {reply.attachmentType?.startsWith('image/') ? (
                          <img 
                            src={reply.attachmentUrl} 
                            alt="Attached image" 
                            className="max-h-40 max-w-full rounded"
                          />
                        ) : (
                          <a 
                            href={reply.attachmentUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center text-primary hover:underline"
                          >
                            <span>Attachment</span>
                          </a>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            );
          })}
        </div>
      ) : (
        <Card className="text-center py-8">
          <CardContent>
            <MessageCircle className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p className="text-gray-500">Be the first to reply to this discussion</p>
          </CardContent>
        </Card>
      )}
      
      <Card className="mt-6" id="reply-form">
        <CardHeader>
          <CardTitle className="text-lg">
            {replyingTo ? 
              <div className="flex items-center">
                <span>Reply to {getUserInitials("User " + replyingTo.userId)}</span>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="ml-2 h-7"
                  onClick={() => {
                    setReplyingTo(null);
                    form.setValue("parentReplyId", null);
                  }}
                >
                  (Cancel)
                </Button>
              </div>
              : 
              "Post a Reply"
            }
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmitReply)} className="space-y-4">
              {replyingTo && (
                <div className="p-3 bg-muted rounded-md mb-3">
                  <p className="text-sm font-medium">Replying to:</p>
                  <p className="text-sm text-muted-foreground line-clamp-2">{replyingTo.content}</p>
                </div>
              )}
              
              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormControl>
                      <Textarea
                        placeholder={replyingTo ? 
                          `Reply to User ${replyingTo.userId}...` : 
                          "Share your thoughts..."
                        }
                        className="min-h-[120px]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* File attachment fields with improved UI */}
              <div className="space-y-4">
                <div className="flex gap-2 items-center">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-1 text-muted-foreground"
                    onClick={() => {
                      const isVisible = !!form.getValues().attachmentUrl;
                      if (isVisible) {
                        // Clear attachment fields if they're visible and clicked again
                        form.setValue("attachmentUrl", "");
                        form.setValue("attachmentType", "");
                      } else {
                        // Set default values for attachment type if adding a new one
                        form.setValue("attachmentType", "image/png");
                      }
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    {!form.getValues().attachmentUrl ? "Add Attachment" : "Remove Attachment"}
                  </Button>
                  
                  {form.getValues().attachmentUrl && (
                    <span className="text-xs text-muted-foreground">
                      Attachment added
                    </span>
                  )}
                </div>
                
                {!!form.getValues().attachmentUrl && (
                  <div className="flex flex-col md:flex-row gap-4 p-3 border rounded-md bg-muted/30">
                    <FormField
                      control={form.control}
                      name="attachmentUrl"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Attachment URL</FormLabel>
                          <FormControl>
                            <Input 
                              placeholder="https://example.com/file.pdf" 
                              {...field} 
                            />
                          </FormControl>
                          <FormDescription className="text-xs">Link to an image or file</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="attachmentType"
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel>Type</FormLabel>
                          <Select
                            onValueChange={field.onChange}
                            defaultValue={field.value || "image/png"}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="image/png">Image</SelectItem>
                              <SelectItem value="application/pdf">PDF Document</SelectItem>
                              <SelectItem value="text/plain">Text File</SelectItem>
                              <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormDescription className="text-xs">Type of attachment</FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                )}
              </div>
              
              <div className="flex gap-2 justify-end">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    form.reset();
                    setReplyingTo(null);
                  }}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  className="flex items-center"
                  disabled={replyMutation.isPending}
                >
                  {replyMutation.isPending ? (
                    "Posting..."
                  ) : (
                    <>
                      <Send className="h-4 w-4 mr-2" />
                      Post Reply
                    </>
                  )}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

// Discussion list component
function DiscussionList() {
  const { data: discussions, isLoading } = useQuery<Discussion[]>({
    queryKey: ["/api/discussions"],
  });
  
  // Helper to format date
  const formatDate = (date: Date) => {
    return new Date(date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  };
  
  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
        <Skeleton className="h-24 w-full" />
      </div>
    );
  }
  
  if (!discussions || discussions.length === 0) {
    return (
      <Card className="text-center py-12">
        <CardContent>
          <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
          <h3 className="text-lg font-medium text-gray-900 mb-1">No discussions yet</h3>
          <p className="text-gray-500 mb-4">Be the first to start a discussion</p>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <div className="space-y-4">
      {discussions.map((discussion) => (
        <Card key={discussion.id} className="hover:shadow-md transition-shadow">
          <CardHeader className="pb-2">
            <div className="flex justify-between">
              <CardTitle className="text-lg">
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    window.history.pushState(
                      {},
                      "",
                      `/community?id=${discussion.id}`
                    );
                    window.dispatchEvent(new Event("popstate"));
                  }} 
                  className="hover:text-primary"
                >
                  {discussion.title}
                </a>
              </CardTitle>
              {discussion.isPinned && (
                <span className="px-2 py-1 text-xs font-medium bg-yellow-100 text-yellow-800 rounded-full">
                  Pinned
                </span>
              )}
            </div>
            <CardDescription className="flex items-center space-x-2 text-sm">
              <span>Posted by User {discussion.userId}</span>
              <span>•</span>
              <span>{formatDate(discussion.createdAt)}</span>
              <span>•</span>
              <span className="capitalize">{discussion.category}</span>
            </CardDescription>
          </CardHeader>
          <CardFooter className="pt-0 pb-3">
            <div className="flex space-x-4 text-sm text-gray-500">
              <div className="flex items-center">
                <Eye className="h-4 w-4 mr-1" />
                <span>{discussion.views}</span>
              </div>
              <div className="flex items-center">
                <Heart className="h-4 w-4 mr-1" />
                <span>{discussion.likes}</span>
              </div>
              <div className="flex items-center">
                <MessageCircle className="h-4 w-4 mr-1" />
                <span>0</span> {/* This would come from actual replies count */}
              </div>
            </div>
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}

// New discussion form component
function NewDiscussionForm({ onSuccess }: { onSuccess: () => void }) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const form = useForm<DiscussionFormValues>({
    resolver: zodResolver(discussionSchema),
    defaultValues: {
      title: "",
      content: "",
      category: ""
    }
  });
  
  // Fetch categories
  const { data: categories } = useQuery<{ name: string; count: number }[]>({
    queryKey: ["/api/categories"],
  });
  
  // Create discussion mutation
  const createDiscussionMutation = useMutation({
    mutationFn: async (data: DiscussionFormValues) => {
      const res = await apiRequest("POST", "/api/discussions", data);
      return await res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/discussions"] });
      form.reset();
      toast({
        title: "Discussion created",
        description: "Your discussion has been posted successfully.",
        variant: "default"
      });
      onSuccess();
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to create discussion",
        description: error.message,
        variant: "destructive"
      });
    }
  });
  
  // Handler for submitting a new discussion
  const onSubmit = (data: DiscussionFormValues) => {
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please sign in to create discussions.",
        variant: "destructive"
      });
      return;
    }
    
    createDiscussionMutation.mutate(data);
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Start a New Discussion</CardTitle>
        <CardDescription>
          Share your thoughts, questions or ideas with the community
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Discussion title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {categories?.map((category) => (
                        <SelectItem key={category.name} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="content"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Share your thoughts..."
                      className="min-h-[200px]"
                      {...field}
                    />
                  </FormControl>
                  <FormDescription>
                    Be clear and respectful in your discussions.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button 
              type="submit" 
              className="w-full"
              disabled={createDiscussionMutation.isPending}
            >
              {createDiscussionMutation.isPending ? (
                "Creating..."
              ) : (
                "Create Discussion"
              )}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

// Main Community Page
export default function CommunityPage() {
  const [activeTab, setActiveTab] = useState<string>("discussions");
  const [selectedDiscussionId, setSelectedDiscussionId] = useState<number | null>(null);
  const [showNewDiscussionForm, setShowNewDiscussionForm] = useState<boolean>(false);
  
  // Parse the URL for discussion ID
  useState(() => {
    const params = new URLSearchParams(window.location.search);
    const discussionId = params.get("id");
    
    if (discussionId) {
      setSelectedDiscussionId(Number(discussionId));
    }
    
    // Listen for history changes
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const discussionId = params.get("id");
      
      if (discussionId) {
        setSelectedDiscussionId(Number(discussionId));
      } else {
        setSelectedDiscussionId(null);
      }
    };
    
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  });
  
  // Handle back button click
  const handleBack = () => {
    setSelectedDiscussionId(null);
    setShowNewDiscussionForm(false);
    window.history.pushState({}, "", "/community");
  };
  
  // Fetch forum categories for tab navigation
  const { data: categories } = useQuery<{ name: string; count: number }[]>({
    queryKey: ["/api/categories"],
  });
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Sidebar categories={categories} />
          
          <div className="flex-1">
            <div className="flex justify-between items-center mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Community Forum</h1>
              
              <div className="flex space-x-2">
                {selectedDiscussionId || showNewDiscussionForm ? (
                  <Button variant="outline" onClick={handleBack}>
                    Back to Discussions
                  </Button>
                ) : (
                  <Button 
                    onClick={() => setShowNewDiscussionForm(true)}
                    className="flex items-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    New Discussion
                  </Button>
                )}
              </div>
            </div>
            
            {selectedDiscussionId ? (
              <DiscussionDetail discussionId={selectedDiscussionId} />
            ) : showNewDiscussionForm ? (
              <NewDiscussionForm onSuccess={handleBack} />
            ) : (
              <Tabs 
                defaultValue="all" 
                value={activeTab} 
                onValueChange={setActiveTab}
                className="w-full"
              >
                <TabsList className="mb-4 flex space-x-1 overflow-x-auto">
                  <TabsTrigger value="all">All Discussions</TabsTrigger>
                  {categories?.map((category) => (
                    <TabsTrigger key={category.name} value={category.name.toLowerCase()}>
                      {category.name}
                    </TabsTrigger>
                  ))}
                </TabsList>
                
                <TabsContent value="all">
                  <DiscussionList />
                </TabsContent>
                
                {categories?.map((category) => (
                  <TabsContent key={category.name} value={category.name.toLowerCase()}>
                    {/* TODO: Filter by category */}
                    <DiscussionList />
                  </TabsContent>
                ))}
              </Tabs>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}