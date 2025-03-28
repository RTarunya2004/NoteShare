import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Note } from "@shared/schema";
import Header from "@/components/Header";
import Sidebar from "@/components/Sidebar";
import Footer from "@/components/Footer";
import NoteList from "@/components/notes/NoteList";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter } from "lucide-react";

export default function SearchPage() {
  const [location] = useLocation();
  const [searchQuery, setSearchQuery] = useState("");
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showPremium, setShowPremium] = useState(true);
  const [showFree, setShowFree] = useState(true);
  
  // Parse URL parameters
  const urlParams = new URLSearchParams(location.split("?")[1] || "");
  const urlQuery = urlParams.get("q") || "";
  
  // Use URL query if available and search hasn't been submitted yet
  useEffect(() => {
    if (urlQuery && !submittedQuery) {
      setSearchQuery(urlQuery);
      setSubmittedQuery(urlQuery);
    }
  }, [urlQuery, submittedQuery]);
  
  // Fetch all notes or search results
  const { data: notes, isLoading } = useQuery<Note[]>({
    queryKey: submittedQuery 
      ? [`/api/notes/search?q=${encodeURIComponent(submittedQuery)}`] 
      : ["/api/notes"],
  });
  
  // Fetch categories
  const { data: categories = [] } = useQuery<Array<{name: string, count: number}>>({
    queryKey: ["/api/categories"],
  });
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedQuery(searchQuery);
  };
  
  // Filter notes based on selected category and premium/free filters
  const filteredNotes = notes?.filter(note => {
    const categoryMatch = !selectedCategory || note.category === selectedCategory;
    const premiumMatch = (note.isPremium && showPremium) || (!note.isPremium && showFree);
    return categoryMatch && premiumMatch;
  });
  
  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <main className="flex-1 container mx-auto px-4 py-6">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="md:w-64 flex-shrink-0">
            {/* Filter Sidebar */}
            <Card className="sticky top-20">
              <CardHeader className="pb-3">
                <CardTitle>Filters</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Categories</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Checkbox 
                        id="all-categories" 
                        checked={!selectedCategory}
                        onCheckedChange={() => setSelectedCategory(null)}
                      />
                      <label htmlFor="all-categories" className="ml-2 text-sm cursor-pointer">All Categories</label>
                    </div>
                    
                    {categories?.map(category => (
                      <div key={category.name} className="flex items-center">
                        <Checkbox 
                          id={`category-${category.name}`} 
                          checked={selectedCategory === category.name}
                          onCheckedChange={() => setSelectedCategory(category.name)}
                        />
                        <label 
                          htmlFor={`category-${category.name}`} 
                          className="ml-2 text-sm cursor-pointer flex justify-between w-full"
                        >
                          <span>{category.name}</span>
                          <span className="text-xs bg-gray-200 text-gray-700 rounded-full px-2 py-0.5">
                            {category.count}
                          </span>
                        </label>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Price</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Checkbox 
                        id="premium-notes" 
                        checked={showPremium}
                        onCheckedChange={() => setShowPremium(!showPremium)}
                      />
                      <label htmlFor="premium-notes" className="ml-2 text-sm cursor-pointer">Premium Notes</label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox 
                        id="free-notes" 
                        checked={showFree}
                        onCheckedChange={() => setShowFree(!showFree)}
                      />
                      <label htmlFor="free-notes" className="ml-2 text-sm cursor-pointer">Free Notes</label>
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">File Type</h3>
                  <div className="space-y-2">
                    <div className="flex items-center">
                      <Checkbox id="pdf-files" defaultChecked />
                      <label htmlFor="pdf-files" className="ml-2 text-sm cursor-pointer">PDF</label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="docx-files" defaultChecked />
                      <label htmlFor="docx-files" className="ml-2 text-sm cursor-pointer">DOCX</label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="ppt-files" defaultChecked />
                      <label htmlFor="ppt-files" className="ml-2 text-sm cursor-pointer">PPT</label>
                    </div>
                    <div className="flex items-center">
                      <Checkbox id="other-files" defaultChecked />
                      <label htmlFor="other-files" className="ml-2 text-sm cursor-pointer">Other</label>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="flex-1">
            {/* Search form */}
            <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
              <form onSubmit={handleSearch} className="flex gap-2">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search for notes, topics, or authors..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <Button type="submit">Search</Button>
              </form>
            </div>
            
            {/* Search results */}
            <Tabs defaultValue="grid" className="mb-6">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">
                  {submittedQuery 
                    ? `Search Results for "${submittedQuery}"` 
                    : "Browse All Notes"}
                </h2>
                <TabsList>
                  <TabsTrigger value="grid">
                    <i className="fas fa-th-large"></i>
                  </TabsTrigger>
                  <TabsTrigger value="list">
                    <i className="fas fa-list"></i>
                  </TabsTrigger>
                </TabsList>
              </div>
              
              {isLoading ? (
                <div className="grid grid-cols-1 gap-4 mt-6">
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                  <Skeleton className="h-32 w-full" />
                </div>
              ) : filteredNotes && filteredNotes.length > 0 ? (
                <>
                  <TabsContent value="grid" className="mt-6">
                    <NoteList notes={filteredNotes} layout="grid" />
                  </TabsContent>
                  <TabsContent value="list" className="mt-6">
                    <NoteList notes={filteredNotes} layout="list" />
                  </TabsContent>
                </>
              ) : (
                <div className="text-center py-12">
                  <i className="fas fa-search text-4xl text-gray-300 mb-3"></i>
                  <h3 className="text-lg font-medium text-gray-900 mb-1">No notes found</h3>
                  <p className="text-gray-500">
                    Try different keywords or browse all available notes
                  </p>
                  <Button 
                    className="mt-4"
                    onClick={() => {
                      setSearchQuery("");
                      setSubmittedQuery("");
                      setSelectedCategory(null);
                    }}
                  >
                    Browse All Notes
                  </Button>
                </div>
              )}
            </Tabs>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
