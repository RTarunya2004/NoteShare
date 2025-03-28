import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Note, User } from "@shared/schema";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import NoteList from "@/components/notes/NoteList";
import QuickStats from "@/components/stats/QuickStats";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Users, UserPlus, UserMinus, Edit, Mail, ChevronDown, ChevronUp, 
  ThumbsUp, Download, BookOpen, FileText, Settings, Bell, Clock
} from "lucide-react";

// Helper component to display user cards in social lists
function UserCard({ user, isFollowing, onFollowToggle }: { 
  user: User; 
  isFollowing: boolean;
  onFollowToggle: (userId: number) => void;
}) {
  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10 border border-primary/10">
          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
            {user.username.substring(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium text-sm">{user.username}</p>
          <p className="text-xs text-muted-foreground">{user.email}</p>
        </div>
      </div>
      <Button 
        variant={isFollowing ? "outline" : "default"} 
        size="sm"
        onClick={() => onFollowToggle(user.id)}
        className="gap-1"
      >
        {isFollowing ? (
          <>
            <UserMinus className="h-3.5 w-3.5" />
            <span className="text-xs">Unfollow</span>
          </>
        ) : (
          <>
            <UserPlus className="h-3.5 w-3.5" />
            <span className="text-xs">Follow</span>
          </>
        )}
      </Button>
    </div>
  );
}

export default function ProfilePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [userId, setUserId] = useState<number | null>(null);
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  
  // Extract user ID from URL if present
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const id = params.get('id');
    
    if (id && !isNaN(Number(id))) {
      setUserId(Number(id));
    } else if (user?.id) {
      setUserId(user.id);
    }
  }, [user]);
  
  // Determine if viewing own profile
  const isOwnProfile = user?.id === userId;
  
  // Fetch profile user data
  const { data: profileUser, isLoading: profileLoading } = useQuery<User>({
    queryKey: ["/api/users", userId],
    enabled: !!userId && userId !== user?.id,
  });
  
  // For UI display, use either fetched profile or current user
  const displayUser = isOwnProfile ? user : profileUser;
  
  // Fetch follower relationship status
  const { data: isFollowing } = useQuery<{ isFollowing: boolean }>({
    queryKey: ["/api/users", userId, "is-following"],
    enabled: !!userId && !!user && userId !== user.id,
  });
  
  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: isOwnProfile ? ["/api/user/stats"] : ["/api/users", userId, "stats"],
    enabled: !!userId,
  });
  
  // Fetch user's uploaded notes
  const { data: userNotes, isLoading: notesLoading } = useQuery<Note[]>({
    queryKey: [`/api/users/${userId}/notes`],
    enabled: !!userId,
  });
  
  // Fetch user's followers
  const { data: followers, isLoading: followersLoading } = useQuery<User[]>({
    queryKey: ["/api/users", userId, "followers"],
    enabled: !!userId,
  });
  
  // Fetch users that this user is following
  const { data: following, isLoading: followingLoading } = useQuery<User[]>({
    queryKey: ["/api/users", userId, "following"],
    enabled: !!userId,
  });
  
  // Mutation to follow/unfollow a user
  const followMutation = useMutation({
    mutationFn: async (followedId: number) => {
      const res = await apiRequest("POST", `/api/users/${followedId}/follow`);
      return await res.json();
    },
    onSuccess: () => {
      // Invalidate queries that might be affected
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "is-following"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", userId, "followers"] });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "following"] });
      
      toast({
        title: isFollowing?.isFollowing ? "Unfollowed user" : "Following user",
        description: isFollowing?.isFollowing 
          ? "You've unfollowed this user." 
          : "You're now following this user.",
        variant: "default",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Action failed",
        description: error.message,
        variant: "destructive",
      });
    }
  });
  
  // Handle follow/unfollow toggle
  const handleFollowToggle = () => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow other users.",
        variant: "destructive",
      });
      return;
    }
    
    if (userId) {
      followMutation.mutate(userId);
    }
  };
  
  // Handle follow/unfollow in user lists
  const handleUserFollowToggle = (followedId: number) => {
    if (!user) {
      toast({
        title: "Sign in required",
        description: "Please sign in to follow other users.",
        variant: "destructive",
      });
      return;
    }
    
    followMutation.mutate(followedId);
  };
  
  // Determine which downloaded notes to show
  const { data: downloadedNotes, isLoading: downloadsLoading } = useQuery<any[]>({
    queryKey: isOwnProfile ? ["/api/user/downloads"] : ["/api/users", userId, "downloads"],
    enabled: !!userId && (isOwnProfile || !!profileUser),
  });
  
  const isLoading = 
    statsLoading || 
    notesLoading || 
    followersLoading || 
    followingLoading || 
    profileLoading ||
    downloadsLoading;
  
  if (!userId || (profileLoading && !isOwnProfile)) {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-12 flex items-center justify-center">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6 text-center">
              <Skeleton className="h-20 w-20 rounded-full mx-auto mb-4" />
              <Skeleton className="h-8 w-48 mx-auto mb-2" />
              <Skeleton className="h-4 w-32 mx-auto mb-8" />
              <div className="space-y-2">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-10 w-full" />
              </div>
            </CardContent>
          </Card>
        </main>
        <Footer />
      </div>
    );
  }
  
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      
      <main className="flex-1">
        {/* Hero section with profile info */}
        <div className="bg-gradient-to-br from-primary/90 to-primary/70 text-white">
          <div className="container mx-auto px-4 py-12">
            <div className="flex flex-col lg:flex-row items-center lg:items-start gap-8">
              {/* Avatar */}
              <div className="relative">
                <Avatar className="w-28 h-28 border-4 border-white/20 shadow-lg">
                  <AvatarFallback className="text-3xl bg-primary-foreground/10">
                    {displayUser?.username?.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                {isOwnProfile && (
                  <Button size="icon" variant="secondary" className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full shadow-md">
                    <Edit className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
              
              {/* Profile info */}
              <div className="flex-1 text-center lg:text-left">
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-3 mb-2">
                  <h1 className="text-3xl font-bold">{displayUser?.username}</h1>
                  <Badge variant="secondary" className="bg-white/10 text-white hover:bg-white/20 transition-colors">
                    {userStats?.uploads || 0} Uploads
                  </Badge>
                </div>
                
                <div className="flex items-center justify-center lg:justify-start gap-2 mb-4">
                  <Mail className="h-4 w-4 opacity-80" />
                  <span className="text-white/80 text-sm">{displayUser?.email}</span>
                </div>
                
                {/* Social stats */}
                <div className="flex flex-wrap justify-center lg:justify-start gap-6 mb-6">
                  <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="bg-white/10 hover:bg-white/20 text-white gap-2">
                        <Users className="h-4 w-4" />
                        <span>{followers?.length || 0} Followers</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Followers</DialogTitle>
                        <DialogDescription>
                          People who follow {isOwnProfile ? "you" : displayUser?.username}
                        </DialogDescription>
                      </DialogHeader>
                      {followersLoading ? (
                        <div className="space-y-2 py-4">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : followers && followers.length > 0 ? (
                        <ScrollArea className="h-[300px] pr-4">
                          <div className="space-y-2">
                            {followers.map((follower) => (
                              <UserCard 
                                key={follower.id} 
                                user={follower} 
                                isFollowing={false} // We would need a query for each user, simplifying here
                                onFollowToggle={handleUserFollowToggle}
                              />
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No followers yet</h3>
                          <p className="text-gray-500">
                            {isOwnProfile ? "When people follow you, they'll appear here" : "This user doesn't have any followers yet"}
                          </p>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" className="bg-white/10 hover:bg-white/20 text-white gap-2">
                        <Users className="h-4 w-4" />
                        <span>Following {following?.length || 0}</span>
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Following</DialogTitle>
                        <DialogDescription>
                          People {isOwnProfile ? "you're" : `${displayUser?.username} is`} following
                        </DialogDescription>
                      </DialogHeader>
                      {followingLoading ? (
                        <div className="space-y-2 py-4">
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                          <Skeleton className="h-12 w-full" />
                        </div>
                      ) : following && following.length > 0 ? (
                        <ScrollArea className="h-[300px] pr-4">
                          <div className="space-y-2">
                            {following.map((followed) => (
                              <UserCard 
                                key={followed.id} 
                                user={followed} 
                                isFollowing={true} // They're in the following list
                                onFollowToggle={handleUserFollowToggle}
                              />
                            ))}
                          </div>
                        </ScrollArea>
                      ) : (
                        <div className="text-center py-8">
                          <Users className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">Not following anyone</h3>
                          <p className="text-gray-500">
                            {isOwnProfile 
                              ? "When you follow people, they'll appear here" 
                              : "This user isn't following anyone yet"}
                          </p>
                        </div>
                      )}
                    </DialogContent>
                  </Dialog>
                  
                  <div className="flex items-center px-3 py-1.5 rounded-full bg-gradient-to-r from-yellow-500/90 to-amber-500/90 shadow-sm">
                    <i className="fas fa-coins mr-2"></i>
                    <span className="font-medium">{displayUser?.coins || 0} coins</span>
                  </div>
                </div>
                
                {/* Action buttons */}
                <div className="flex flex-wrap gap-3 justify-center lg:justify-start">
                  {!isOwnProfile && user && (
                    <Button 
                      onClick={handleFollowToggle}
                      variant={isFollowing?.isFollowing ? "outline" : "secondary"}
                      className={isFollowing?.isFollowing ? "bg-white/10 text-white border-white/20" : ""}
                      disabled={followMutation.isPending}
                    >
                      {followMutation.isPending ? (
                        <span className="flex items-center gap-1">
                          <Skeleton className="h-4 w-4 rounded-full animate-pulse" />
                          Processing...
                        </span>
                      ) : isFollowing?.isFollowing ? (
                        <span className="flex items-center gap-1">
                          <UserMinus className="h-4 w-4" />
                          Unfollow
                        </span>
                      ) : (
                        <span className="flex items-center gap-1">
                          <UserPlus className="h-4 w-4" />
                          Follow
                        </span>
                      )}
                    </Button>
                  )}
                  
                  {isOwnProfile && (
                    <Button variant="secondary" className="gap-1">
                      <Settings className="h-4 w-4" />
                      Edit Profile
                    </Button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Content section */}
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-3 order-2 lg:order-1">
              <div className="sticky top-6 space-y-6">
                {/* Quick Stats Card */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Bell className="h-4 w-4 mr-2 text-primary" />
                      Activity Stats
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <QuickStats stats={userStats} />
                  </CardContent>
                </Card>
                
                {/* Follower Highlights */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg flex items-center">
                      <Users className="h-4 w-4 mr-2 text-primary" />
                      Network
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="space-y-4">
                      <div>
                        <Button 
                          variant="outline" 
                          className="w-full justify-between" 
                          onClick={() => setShowFollowers(true)}
                        >
                          <span className="flex items-center">
                            <Users className="h-4 w-4 mr-2 text-primary" />
                            Followers
                          </span>
                          <Badge variant="secondary" className="ml-2">
                            {followers?.length || 0}
                          </Badge>
                        </Button>
                      </div>
                      <div>
                        <Button 
                          variant="outline" 
                          className="w-full justify-between" 
                          onClick={() => setShowFollowing(true)}
                        >
                          <span className="flex items-center">
                            <UserPlus className="h-4 w-4 mr-2 text-primary" />
                            Following
                          </span>
                          <Badge variant="secondary" className="ml-2">
                            {following?.length || 0}
                          </Badge>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            {/* Main content area */}
            <div className="lg:col-span-9 order-1 lg:order-2">
              <Tabs defaultValue="uploads" className="w-full">
                <TabsList className="mb-6 flex space-x-2 rounded-lg bg-muted p-1 overflow-x-auto">
                  <TabsTrigger value="uploads" className="rounded-md gap-1.5">
                    <FileText className="h-4 w-4" />
                    <span>Uploads</span>
                  </TabsTrigger>
                  <TabsTrigger value="downloads" className="rounded-md gap-1.5">
                    <Download className="h-4 w-4" />
                    <span>Downloads</span>
                  </TabsTrigger>
                  <TabsTrigger value="activity" className="rounded-md gap-1.5">
                    <Clock className="h-4 w-4" />
                    <span>Activity</span>
                  </TabsTrigger>
                  <TabsTrigger value="favorites" className="rounded-md gap-1.5">
                    <ThumbsUp className="h-4 w-4" />
                    <span>Liked</span>
                  </TabsTrigger>
                  <TabsTrigger value="library" className="rounded-md gap-1.5">
                    <BookOpen className="h-4 w-4" />
                    <span>Saved</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="uploads">
                  <Card>
                    <CardHeader className="flex flex-row items-center justify-between">
                      <div>
                        <CardTitle>Shared Notes</CardTitle>
                        <CardDescription>
                          Notes {isOwnProfile ? "you've" : `${displayUser?.username} has`} shared with the community
                        </CardDescription>
                      </div>
                      {isOwnProfile && (
                        <Button size="sm" className="gap-1.5">
                          <FileText className="h-4 w-4" />
                          <span>Upload New</span>
                        </Button>
                      )}
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-24 w-full" />
                          <Skeleton className="h-24 w-full" />
                          <Skeleton className="h-24 w-full" />
                        </div>
                      ) : userNotes && userNotes.length > 0 ? (
                        <NoteList notes={userNotes} layout="list" />
                      ) : (
                        <div className="text-center py-12">
                          <FileText className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No uploads yet</h3>
                          <p className="text-gray-500 mb-6">
                            {isOwnProfile 
                              ? "Share your knowledge with the community and earn coins" 
                              : `${displayUser?.username} hasn't uploaded any notes yet`}
                          </p>
                          {isOwnProfile && (
                            <Button asChild>
                              <a href="/upload">Upload Notes</a>
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="downloads">
                  <Card>
                    <CardHeader>
                      <CardTitle>Downloaded Notes</CardTitle>
                      <CardDescription>
                        Notes {isOwnProfile ? "you've" : `${displayUser?.username} has`} downloaded
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      {isLoading ? (
                        <div className="space-y-4">
                          <Skeleton className="h-24 w-full" />
                          <Skeleton className="h-24 w-full" />
                        </div>
                      ) : downloadedNotes && downloadedNotes.length > 0 ? (
                        <div className="space-y-4">
                          {/* Would need to map download data to notes */}
                          <p>Downloaded notes would appear here</p>
                        </div>
                      ) : (
                        <div className="text-center py-12">
                          <Download className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                          <h3 className="text-lg font-medium text-gray-900 mb-1">No downloads yet</h3>
                          <p className="text-gray-500 mb-6">
                            {isOwnProfile 
                              ? "Browse the notes library and download content" 
                              : `${displayUser?.username} hasn't downloaded any notes yet`}
                          </p>
                          {isOwnProfile && (
                            <Button asChild variant="outline">
                              <a href="/search">Browse Notes</a>
                            </Button>
                          )}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="activity">
                  <Card>
                    <CardHeader>
                      <CardTitle>Recent Activity</CardTitle>
                      <CardDescription>
                        Recent interactions with the platform
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <Clock className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No recent activity</h3>
                        <p className="text-gray-500">
                          Activity like uploads, comments, and likes will appear here
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="favorites">
                  <Card>
                    <CardHeader>
                      <CardTitle>Liked Notes</CardTitle>
                      <CardDescription>
                        Notes {isOwnProfile ? "you've" : `${displayUser?.username} has`} liked
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <ThumbsUp className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No liked notes</h3>
                        <p className="text-gray-500">
                          {isOwnProfile 
                            ? "When you like notes, they'll appear here" 
                            : `${displayUser?.username} hasn't liked any notes yet`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
                
                <TabsContent value="library">
                  <Card>
                    <CardHeader>
                      <CardTitle>Saved Library</CardTitle>
                      <CardDescription>
                        Notes saved for later
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center py-12">
                        <BookOpen className="h-16 w-16 mx-auto text-gray-300 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-1">No saved notes</h3>
                        <p className="text-gray-500">
                          {isOwnProfile 
                            ? "When you save notes to your library, they'll appear here" 
                            : `${displayUser?.username} doesn't have any saved notes`}
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
