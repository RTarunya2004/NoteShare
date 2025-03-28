import { useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { 
  Home, Compass, Heart, BarChart2, Users, 
  Upload, Search, BookOpen
} from "lucide-react";

type SidebarProps = {
  categories?: Array<{name: string; count: number}>;
};

export default function Sidebar({ categories = [] }: SidebarProps) {
  const [location] = useLocation();
  
  const isActive = (path: string) => {
    return location === path;
  };
  
  const navItems = [
    { icon: Home, label: "Home", path: "/" },
    { icon: Compass, label: "Explore", path: "/search" },
    { icon: Heart, label: "My Library", path: "/library" },
    { icon: BarChart2, label: "Dashboard", path: "/profile" },
    { icon: Users, label: "Community", path: "/community" },
  ];
  
  return (
    <aside className="md:w-64 flex-shrink-0">
      <div className="bg-white rounded-lg shadow-sm p-4 sticky top-20">
        <ScrollArea className="h-[calc(100vh-8rem)]">
          <nav className="space-y-1">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  className={cn(
                    "w-full justify-start",
                    isActive(item.path) && "bg-blue-50 text-primary"
                  )}
                  onClick={() => window.location.href = item.path}
                >
                  <Icon className="mr-2 h-4 w-4" />
                  {item.label}
                </Button>
              );
            })}
            
            <Button
              variant="default"
              className="w-full justify-start mt-4"
              onClick={() => window.location.href = "/upload"}
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Notes
            </Button>
          </nav>
          
          {categories && categories.length > 0 && (
            <div className="mt-6 pt-6 border-t border-gray-200">
              <h3 className="font-medium text-gray-900 mb-2 px-3">Categories</h3>
              <div className="space-y-1">
                {categories.map((category, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-between text-gray-600 hover:text-primary"
                    onClick={() => window.location.href = `/search?category=${encodeURIComponent(category.name)}`}
                  >
                    <span className="flex items-center">
                      <BookOpen className="mr-2 h-3 w-3" />
                      {category.name}
                    </span>
                    <span className="text-xs bg-gray-200 text-gray-700 rounded-full px-2 py-0.5">
                      {category.count}
                    </span>
                  </Button>
                ))}
              </div>
            </div>
          )}
        </ScrollArea>
      </div>
    </aside>
  );
}
