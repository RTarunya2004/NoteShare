import { Card } from "@/components/ui/card";
import { Upload, Download, Coins, Star } from "lucide-react";

type StatsType = {
  uploads: number;
  downloads: number;
  coins: number;
  likes: number;
};

type QuickStatsProps = {
  stats?: StatsType;
};

export default function QuickStats({ stats }: QuickStatsProps) {
  if (!stats) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {Array(4).fill(0).map((_, i) => (
          <Card key={i} className="bg-white p-4 flex items-center animate-pulse">
            <div className="w-12 h-12 rounded-full bg-gray-200 mr-4"></div>
            <div>
              <div className="h-3 w-16 bg-gray-200 rounded mb-2"></div>
              <div className="h-5 w-10 bg-gray-200 rounded"></div>
            </div>
          </Card>
        ))}
      </div>
    );
  }

  const statItems = [
    {
      title: "Uploads",
      value: stats.uploads,
      icon: Upload,
      bgColor: "bg-blue-100",
      textColor: "text-primary",
    },
    {
      title: "Downloads",
      value: stats.downloads,
      icon: Download,
      bgColor: "bg-green-100",
      textColor: "text-secondary",
    },
    {
      title: "Coins",
      value: stats.coins,
      icon: Coins,
      bgColor: "bg-yellow-100",
      textColor: "text-yellow-500",
    },
    {
      title: "Likes",
      value: stats.likes,
      icon: Star,
      bgColor: "bg-purple-100",
      textColor: "text-purple-500",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      {statItems.map((item, index) => (
        <Card key={index} className="bg-white p-4 flex items-center">
          <div className={`w-12 h-12 rounded-full ${item.bgColor} ${item.textColor} flex items-center justify-center mr-4`}>
            <item.icon className="h-5 w-5" />
          </div>
          <div>
            <p className="text-gray-500 text-sm">{item.title}</p>
            <p className="text-gray-900 font-bold text-xl">{item.value}</p>
          </div>
        </Card>
      ))}
    </div>
  );
}
