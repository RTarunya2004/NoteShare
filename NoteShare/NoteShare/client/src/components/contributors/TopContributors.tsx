import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { User } from "@shared/schema";

type TopContributorsProps = {
  contributors?: User[];
};

export default function TopContributors({ contributors = [] }: TopContributorsProps) {
  if (contributors.length === 0) {
    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900">Top Contributors</h2>
          <a href="#" className="text-primary hover:underline text-sm font-medium">View All</a>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array(4).fill(0).map((_, i) => (
            <div key={i} className="bg-white rounded-lg shadow-sm p-4 flex items-center animate-pulse">
              <div className="w-12 h-12 rounded-full bg-gray-200 mr-3"></div>
              <div className="flex-1">
                <div className="h-4 w-24 bg-gray-200 rounded mb-2"></div>
                <div className="h-3 w-32 bg-gray-200 rounded"></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // Get contributor initials
  const getInitials = (username: string) => {
    return username.substring(0, 2).toUpperCase();
  };

  // Background colors for avatars
  const bgColors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-purple-500",
    "bg-red-500",
    "bg-yellow-500",
    "bg-indigo-500",
    "bg-pink-500",
    "bg-teal-500",
  ];

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Top Contributors</h2>
        <a href="#" className="text-primary hover:underline text-sm font-medium">View All</a>
      </div>
      
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {contributors.map((contributor, index) => (
          <div key={contributor.id} className="bg-white rounded-lg shadow-sm p-4 flex items-center">
            <Avatar className={`w-12 h-12 ${bgColors[index % bgColors.length]} text-white mr-3`}>
              <AvatarFallback className="text-lg font-bold">
                {getInitials(contributor.username)}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="font-medium text-gray-900">{contributor.username}</h3>
              <p className="text-gray-500 text-sm">
                <span className="mr-1">{contributor.coins} coins</span>
              </p>
            </div>
            <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 text-sm font-medium">
              <i className="fas fa-user-plus"></i>
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
}
