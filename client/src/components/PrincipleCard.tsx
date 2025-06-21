import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ExternalLink, Lightbulb, Target, ArrowRight } from "lucide-react";

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
          {principle.reflections && (
            <div className="mb-6">
              <Card>
                <CardContent className="p-6">
                  <h4 className="font-semibold text-gray-900 mb-3 flex items-center">
                    <Lightbulb className="w-5 h-5 text-green-600 mr-2" />
                    Сьогоднішні роздуми
                  </h4>
                  <ul className="space-y-2 text-gray-600 text-sm">
                    {principle.reflections.map((reflection, index) => (
                      <li key={index} className="flex items-start space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full mt-2 flex-shrink-0" />
                        <span>{reflection}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            </div>
          )}

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
    <Card className="group hover:shadow-md transition-shadow">
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
        
        <div className="flex items-center justify-between">
          <Badge variant={isCurrent ? "default" : "secondary"}>
            {isCurrent ? "Активний" : "Очікування"}
          </Badge>
          {principle.url && (
            <Button variant="ghost" size="sm" asChild>
              <a href={principle.url} target="_blank" rel="noopener noreferrer">
                Детальніше
              </a>
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
