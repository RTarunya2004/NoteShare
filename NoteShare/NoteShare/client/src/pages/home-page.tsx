import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import QuickStats from "@/components/stats/QuickStats";
import NoteList from "@/components/notes/NoteList";
import TopContributors from "@/components/contributors/TopContributors";
import Footer from "@/components/Footer";
import { useAuth } from "@/hooks/use-auth";
import { Note } from "@shared/schema";
import { Loader2 } from "lucide-react";

export default function HomePage() {
  const { user } = useAuth();
  
  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/user/stats"],
    enabled: !!user,
  });
  
  // Fetch trending notes
  const { data: trendingNotes, isLoading: trendingLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes/trending"],
  });
  
  // Fetch recent notes
  const { data: recentNotes, isLoading: recentLoading } = useQuery<Note[]>({
    queryKey: ["/api/notes/recent"],
  });
  
  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });
  
  // Fetch top contributors
  const { data: topContributors, isLoading: contributorsLoading } = useQuery({
    queryKey: ["/api/contributors/top"],
  });
  
  const isLoading = statsLoading || trendingLoading || recentLoading || contributorsLoading;
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <Sidebar categories={categories || []} />
          
          <div className="flex-1">
            {/* Welcome Section */}
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl shadow-md text-white p-6 mb-6">
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold mb-2">Welcome to NoteShare!</h1>
                  <p className="text-blue-100 mb-4">Share your knowledge, earn coins, and access premium content</p>
                  <div className="flex space-x-4">
                    <a href="/upload" className="bg-white text-primary hover:bg-blue-50 px-4 py-2 rounded-md font-medium transition-colors">
                      <i className="fas fa-upload mr-2"></i>Upload Notes
                    </a>
                    <a href="/search" className="bg-blue-400 bg-opacity-30 hover:bg-opacity-40 text-white px-4 py-2 rounded-md font-medium transition-colors">
                      <i className="fas fa-compass mr-2"></i>Explore
                    </a>
                  </div>
                </div>
                <div className="hidden md:block">
                  <svg className="w-32 h-32" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
                    <path fill="#ffffff" fillOpacity="0.2" d="M45.4,-58.6C58.1,-47.3,67.4,-31.6,71.5,-14.2C75.6,3.2,74.5,22.3,66,36.8C57.5,51.3,41.5,61.3,24.4,67.4C7.3,73.6,-10.9,75.9,-26.3,70.2C-41.7,64.4,-54.3,50.5,-63.1,34.2C-71.9,17.9,-76.9,-0.7,-72.2,-16.4C-67.5,-32.1,-53,-44.8,-38.1,-55.5C-23.1,-66.2,-7.8,-74.8,7,-76.5C21.8,-78.3,32.7,-69.9,45.4,-58.6Z" transform="translate(100 100)" />
                    <path fill="#ffffff" fillOpacity="0.1" d="M55.2,-71.1C73.6,-62.2,91.5,-48.3,99.3,-29.7C107.1,-11.1,105,-12.3,99.8,8.1C94.6,28.5,86.3,45.5,73.3,58.8C60.3,72.1,42.5,81.7,24.6,83.5C6.7,85.3,-11.4,79.4,-27.9,71.3C-44.4,63.2,-59.3,52.9,-67.5,38.6C-75.7,24.2,-77.1,5.9,-74.2,-10.9C-71.3,-27.7,-64.2,-43,-52.6,-52.4C-41.1,-61.9,-25.3,-65.4,-8.7,-70.5C7.8,-75.5,36.8,-80,55.2,-71.1Z" transform="translate(100 100)" />
                  </svg>
                </div>
              </div>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center p-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Quick Stats */}
                <QuickStats stats={userStats} />
                
                {/* Trending Notes Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Trending Notes</h2>
                    <a href="/search" className="text-primary hover:underline text-sm font-medium">View All</a>
                  </div>
                  
                  <NoteList notes={trendingNotes || []} layout="grid" />
                </div>
                
                {/* Recently Uploaded Section */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Recently Uploaded</h2>
                    <a href="/search" className="text-primary hover:underline text-sm font-medium">View All</a>
                  </div>
                  
                  <NoteList notes={recentNotes || []} layout="list" />
                </div>
                
                {/* Top Contributors Section */}
                <TopContributors contributors={topContributors || []} />
              </>
            )}
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
