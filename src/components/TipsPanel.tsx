import { useState, useEffect } from "react";
import { Lightbulb, Star, AlertTriangle, BookOpen, Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";

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
  onSendMessage?: (message: string) => void;
  sessionId: string;
}

export function TipsPanel({ onSendMessage, sessionId }: TipsPanelProps) {
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics>({});
  const [metricsTips, setMetricsTips] = useState<Tip[]>([]);

  // Listen for quality metrics updates
  useEffect(() => {
    const metricsChannel = supabase
      .channel(`quality-metrics-${sessionId}`)
      .on('broadcast', { event: 'metrics-update' }, (payload) => {
        console.log('TipsPanel: Received quality metrics:', payload);
        
        if (payload.payload) {
          setQualityMetrics(payload.payload);
          generateTipsFromMetrics(payload.payload);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(metricsChannel);
    };
  }, [sessionId]);

  const generateTipsFromMetrics = (metrics: QualityMetrics) => {
    console.log('TipsPanel: Generating tips from metrics:', metrics);
    const tips: Tip[] = [];

    // Alternative Scenarios
    if (metrics["alternative scenarios"] !== undefined && metrics["alternative scenarios"] <= 2) {
      console.log('TipsPanel: Adding alternative scenarios tip, score:', metrics["alternative scenarios"]);
      tips.push({
        id: "alt-scenarios",
        type: getMetricTipType(metrics["alternative scenarios"]),
        title: "Improve Alternative Scenarios",
        description: metrics["alternative scenarios justification"] || "Add more alternative scenarios to cover edge cases and different user paths.",
        priority: getMetricPriority(metrics["alternative scenarios"]),
        category: "Scenarios",
      });
    }

    // Given-When-Then
    if (metrics["given-when-then"] !== undefined && metrics["given-when-then"] <= 2) {
      tips.push({
        id: "gwt-structure",
        type: getMetricTipType(metrics["given-when-then"]),
        title: "Enhance Given-When-Then Structure",
        description: metrics["given-when-then justification"] || "Improve the structure and clarity of your Given-When-Then statements.",
        priority: getMetricPriority(metrics["given-when-then"]),
        category: "Structure",
      });
    }

    // Specifications
    if (metrics["specifications"] !== undefined && metrics["specifications"] <= 2) {
      tips.push({
        id: "specifications",
        type: getMetricTipType(metrics["specifications"]),
        title: "Improve Specifications",
        description: metrics["specifications justification"] || "Make specifications more detailed and comprehensive.",
        priority: getMetricPriority(metrics["specifications"]),
        category: "Documentation",
      });
    }

    console.log('TipsPanel: Generated tips:', tips);
    setMetricsTips(tips);
  };

  const getMetricTipType = (score?: number): "improvement" | "warning" | "best-practice" | "suggestion" => {
    switch (score) {
      case 0: return "warning";
      case 1: return "improvement";
      case 2: return "suggestion";
      default: return "improvement";
    }
  };

  const getMetricPriority = (score?: number): "High" | "Medium" | "Low" => {
    switch (score) {
      case 0: return "High";
      case 1: return "High";
      case 2: return "Medium";
      default: return "Medium";
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

  const handleApplyTip = (tip: Tip) => {
    if (onSendMessage) {
      onSendMessage(`Fix it ${tip.description}`);
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
            {metricsTips.length > 0 ? (
              metricsTips.map((tip) => (
                <div
                  key={tip.id}
                  className="p-3 border border-border rounded-lg hover:border-primary/30 transition-colors"
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
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-xs h-6 px-2"
                          onClick={() => handleApplyTip(tip)}
                        >
                          Apply
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-sm text-muted-foreground py-4">
                Quality analysis will generate improvement tips here.
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