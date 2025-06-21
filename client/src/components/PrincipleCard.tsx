import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Lightbulb, Target, ArrowRight, BookOpen, Plus } from "lucide-react";

interface PrincipleCardProps {
  principle: {
    id: number;
    number: number;
    title: string;
    description: string;
    url?: string;
    reflections?: string[];
    practicalSteps?: string[];
  };
  isCurrent?: boolean;
  onOpenDiary?: () => void;
}

export default function PrincipleCard({ principle, isCurrent = false, onOpenDiary }: PrincipleCardProps) {
  if (isCurrent) {
    return (
      <Card className="border-2 border-blue-200 bg-gradient-to-br from-blue-50/50 to-purple-50/50">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-4">
            <span className="text-2xl font-bold text-blue-600">{principle.number}</span>
          </div>
          <CardTitle className="text-2xl text-gray-900 mb-2">
            Принцип {principle.number}: {principle.title}
          </CardTitle>
          <p className="text-gray-600 text-lg">{principle.description}</p>
        </CardHeader>
        
        <CardContent>
          

          <div className="flex flex-col sm:flex-row gap-4 items-center justify-center">
            {onOpenDiary && (
              <Button onClick={onOpenDiary} className="bg-green-600 hover:bg-green-700">
                Записати в щоденник
              </Button>
            )}
            {principle.url && (
              <Button variant="outline" asChild>
                <a href={principle.url} target="_blank" rel="noopener noreferrer">
                  Детальніше про принцип
                  <ExternalLink className="w-4 h-4 ml-2" />
                </a>
              </Button>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`group hover:shadow-md transition-all duration-200 ${
      isCurrent ? 'ring-2 ring-blue-500 shadow-lg' : 'hover:shadow-lg'
    }`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-colors ${
            isCurrent 
              ? "bg-blue-100 text-blue-600" 
              : "bg-gray-100 text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600"
          }`}>
            <span className="font-bold">{principle.number}</span>
          </div>
          <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
        </div>
        
        <h3 className="font-semibold text-gray-900 mb-2">{principle.title}</h3>
        <p className="text-gray-600 text-sm mb-4">{principle.description}</p>
        
        {/* Reflections Preview */}
        {principle.reflections && principle.reflections.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Питання для роздумів:</p>
            <p className="text-sm text-gray-700 italic">
              "{principle.reflections[0]}"
            </p>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Badge variant={isCurrent ? "default" : "secondary"} className="flex items-center gap-1">
              {isCurrent && <Heart className="w-3 h-3" />}
              {isCurrent ? "Поточний принцип" : `Принцип ${principle.number}`}
            </Badge>
            {principle.url && (
              <Button variant="ghost" size="sm" asChild>
                <a href={principle.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1">
                  <ExternalLink className="w-3 h-3" />
                  Детальніше
                </a>
              </Button>
            )}
          </div>

          {/* Diary Button */}
          {onOpenDiary && (
            <Button 
              onClick={onOpenDiary} 
              className="w-full flex items-center gap-2"
              variant={isCurrent ? "default" : "outline"}
              size="sm"
            >
              <BookOpen className="w-4 h-4" />
              Записати в щоденник
            </Button>
          )}

          {/* Practical Steps Preview */}
          {principle.practicalSteps && principle.practicalSteps.length > 0 && !isCurrent && (
            <div className="pt-2 border-t border-gray-100">
              <p className="text-xs text-gray-500 mb-1">Практичні кроки:</p>
              <ul className="text-xs text-gray-600 space-y-1">
                {principle.practicalSteps.slice(0, 2).map((step, index) => (
                  <li key={index} className="flex items-start gap-1">
                    <span className="text-blue-600 mt-0.5">•</span>
                    <span>{step}</span>
                  </li>
                ))}
                {principle.practicalSteps.length > 2 && (
                  <li className="text-gray-400 text-xs">
                    та ще {principle.practicalSteps.length - 2}...
                  </li>
                )}
              </ul>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
