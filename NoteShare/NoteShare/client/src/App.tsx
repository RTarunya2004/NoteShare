import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "./hooks/use-auth";
import { ProtectedRoute } from "./lib/protected-route";
import NotFound from "@/pages/not-found";
import HomePage from "@/pages/home-page";
import AuthPage from "@/pages/auth-page";
import UploadPage from "@/pages/upload-page";
import NoteDetailPage from "@/pages/note-detail-page";
import ProfilePage from "@/pages/profile-page";
import SearchPage from "@/pages/search-page";
import CommunityPage from "@/pages/community-page";
import LibraryPage from "@/pages/library-page-new";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/upload" component={UploadPage} />
      <ProtectedRoute path="/notes/:id" component={NoteDetailPage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/search" component={SearchPage} />
      <ProtectedRoute path="/community" component={CommunityPage} />
      <ProtectedRoute path="/library" component={LibraryPage} />
      <ProtectedRoute path="/explore" component={SearchPage} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
