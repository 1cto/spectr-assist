import { useState, useEffect } from "react";
import { Lightbulb, Star, AlertTriangle, BookOpen, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface Tip {
  id: string;
  type: "improvement" | "warning" | "best-practice" | "suggestion";
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  category: string;
}

interface QualityMetrics {
  "alternative scenarios"?: number;
  "alternative scenarios justification"?: string;
  "given-when-then"?: number;
  "given-when-then justification"?: string;
  "specifications"?: number;
  "specifications justification"?: string;
  "overall"?: number;
  [key: string]: any;
}

interface TipsPanelProps {
  metrics?: QualityMetrics;
  onSendMessage?: (message: string) => void;
}

export function TipsPanel({ metrics = {}, onSendMessage }: TipsPanelProps) {
  const [tips, setTips] = useState<Tip[]>([]);

  // Generate tips from low-scoring metrics (0, 1, 2)
  useEffect(() => {
    const metricsToCheck = [
      { key: "alternative scenarios", type: "improvement", category: "Test Coverage" },
      { key: "given-when-then", type: "warning", category: "Structure" },
      { key: "specifications", type: "best-practice", category: "Clarity" }
    ];

    const newTips: Tip[] = [];
    
    metricsToCheck.forEach(({ key, type, category }) => {
      const score = metrics[key];
      const justification = metrics[`${key} justification`];
      
      if (typeof score === 'number' && score <= 2 && justification) {
        newTips.push({
          id: key,
          type: type as "improvement" | "warning" | "best-practice",
          title: key.split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' '),
          description: justification,
          priority: score === 0 ? "High" : score === 1 ? "Medium" : "Low",
          category
        });
      }
    });

    setTips(newTips);
  }, [metrics]);

  const handleTipClick = (tip: Tip) => {
    if (onSendMessage) {
      onSendMessage(`Fix it ${tip.title}: ${tip.description}`);
    }
  };

  const getTipIcon = (type: string) => {
    switch (type) {
      case "improvement": return <Target className="w-4 h-4" />;
      case "warning": return <AlertTriangle className="w-4 h-4" />;
      case "best-practice": return <BookOpen className="w-4 h-4" />;
      case "suggestion": return <Lightbulb className="w-4 h-4" />;
      default: return <Lightbulb className="w-4 h-4" />;
    }
  };

  const getTipColor = (type: string) => {
    switch (type) {
      case "improvement": return "text-primary";
      case "warning": return "text-estimate-high";
      case "best-practice": return "text-estimate-low";
      case "suggestion": return "text-estimate-medium";
      default: return "text-muted-foreground";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "High": return "text-estimate-high";
      case "Medium": return "text-estimate-medium";
      case "Low": return "text-estimate-low";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Star className="w-5 h-5 text-primary" />
            Improvement Tips
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {tips.length > 0 ? tips.map((tip) => (
              <div
                key={tip.id}
                className="p-3 border border-border rounded-lg hover:border-primary/30 transition-colors cursor-pointer"
                onClick={() => handleTipClick(tip)}
              >
                <div className="flex items-start gap-3">
                  <div className={`mt-0.5 ${getTipColor(tip.type)}`}>
                    {getTipIcon(tip.type)}
                  </div>
                  <div className="flex-1 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <h4 className="font-medium text-sm leading-tight">{tip.title}</h4>
                      <Badge 
                        variant="outline" 
                        className={`text-xs ${getPriorityColor(tip.priority)} shrink-0`}
                      >
                        {tip.priority}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      {tip.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                        {tip.category}
                      </span>
                      <Button variant="ghost" size="sm" className="text-xs h-6 px-2">
                        Fix it
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center py-8 text-muted-foreground">
                <AlertTriangle className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No issues found</p>
                <p className="text-xs">Quality metrics look good!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BookOpen className="w-5 h-5 text-primary" />
            Gherkin Guide
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3 text-sm">
            <div className="space-y-1">
              <div className="font-medium text-syntax-keyword">Feature:</div>
              <div className="text-muted-foreground text-xs ml-2">High-level description of a software feature</div>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium text-syntax-scenario">Scenario:</div>
              <div className="text-muted-foreground text-xs ml-2">Concrete example illustrating a business rule</div>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium text-syntax-given">Given:</div>
              <div className="text-muted-foreground text-xs ml-2">Initial context or state</div>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium text-syntax-when">When:</div>
              <div className="text-muted-foreground text-xs ml-2">Event or action</div>
            </div>
            
            <div className="space-y-1">
              <div className="font-medium text-syntax-then">Then:</div>
              <div className="text-muted-foreground text-xs ml-2">Expected outcome</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}