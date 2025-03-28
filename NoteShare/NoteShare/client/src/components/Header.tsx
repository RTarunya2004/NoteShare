import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Search, Upload, LogOut, User } from "lucide-react";

export default function Header() {
  const [searchQuery, setSearchQuery] = useState("");
  const [, navigate] = useLocation();
  const { user, logoutMutation } = useAuth();
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };
  
  const handleLogout = () => {
    logoutMutation.mutate();
    navigate("/auth");
  };
  
  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3 flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <a href="/" className="flex items-center space-x-2">
            <span className="text-primary text-2xl"><i className="fa-solid fa-book-open"></i></span>
            <span className="font-bold text-xl text-gray-800">NoteShare</span>
          </a>
        </div>
        
        <div className="flex-1 max-w-xl px-4 hidden md:block">
          <form onSubmit={handleSearch} className="relative">
            <Input
              type="text"
              placeholder="Search for notes, topics, or authors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pr-10"
            />
            <button type="submit" className="absolute right-3 top-2.5 text-gray-400">
              <Search className="h-4 w-4" />
            </button>
          </form>
        </div>
        
        <div className="flex items-center space-x-4">
          {/* User is logged in (this would be conditionally rendered) */}
          {user && (
            <>
              <div className="flex items-center space-x-1 text-primary font-medium">
                <span className="text-yellow-500"><i className="fa-solid fa-coins"></i></span>
                <span>{user.coins} coins</span>
              </div>
              
              <Button 
                onClick={() => navigate("/upload")}
                className="rounded-full bg-secondary hover:bg-secondary/90 text-white hidden md:flex"
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Notes
              </Button>
              
              {/* User Avatar Dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-9 w-9 rounded-full">
                    <Avatar className="h-9 w-9">
                      <AvatarFallback className="bg-primary text-white">
                        {user.username.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate("/profile")}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Profile</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/upload")}>
                    <Upload className="mr-2 h-4 w-4" />
                    <span>Upload Notes</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout}>
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          )}
          
          {/* If user is not logged in */}
          {!user && (
            <Button onClick={() => navigate("/auth")}>
              Log In
            </Button>
          )}
          
          {/* Mobile menu button */}
          <button className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none">
            <i className="fas fa-bars text-xl"></i>
          </button>
        </div>
      </div>
    </header>
  );
}
