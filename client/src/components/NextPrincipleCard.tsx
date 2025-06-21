import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Clock } from "lucide-react";

interface NextPrincipleCardProps {
  currentPrinciple: number;
  principles: any[];
}

export default function NextPrincipleCard({ currentPrinciple, principles }: NextPrincipleCardProps) {
  const nextPrinciple = currentPrinciple === 10 ? 1 : currentPrinciple + 1;
  const principle = principles?.find(p => p.number === nextPrinciple);

  if (!principle) {
    return null;
  }

  return (
    <Card className="border-orange-200 bg-gradient-to-br from-orange-50/50 to-yellow-50/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-orange-900">
          <Clock className="w-5 h-5 text-orange-600" />
          Наступний принцип в фокусі
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
            <span className="text-orange-600 font-bold">{nextPrinciple}</span>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-orange-900 mb-1">
              Принцип {nextPrinciple}: {principle.title}
            </h3>
            <p className="text-sm text-orange-700 mb-3">
              {principle.description}
            </p>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-orange-100 text-orange-700 border-orange-200">
                Готується
              </Badge>
              <ArrowRight className="w-4 h-4 text-orange-500" />
            </div>
          </div>
        </div>
        
        {principle.reflections && principle.reflections.length > 0 && (
          <div className="mt-4 p-3 bg-orange-50 rounded-lg border border-orange-100">
            <p className="text-xs font-medium text-orange-700 mb-1">💭 Підготуйтеся до роздумів:</p>
            <p className="text-xs text-orange-600 italic">
              "{principle.reflections[0]}"
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}