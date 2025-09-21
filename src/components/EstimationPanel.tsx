import { useState, useEffect } from "react";
import { Clock, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";

interface EstimationData {
  complexity: "Low" | "Medium" | "High";
  effort: number; // in story points
  duration: string;
  confidence: number; // percentage
  riskLevel: "Low" | "Medium" | "High";
}

export function EstimationPanel() {
  const [estimation, setEstimation] = useState<EstimationData>({
    complexity: "Medium",
    effort: 8,
    duration: "3-5 days",
    confidence: 75,
    riskLevel: "Low",
  });

  // Simulate real-time estimation updates based on feature content
  useEffect(() => {
    const interval = setInterval(() => {
      // Randomly update estimation values to simulate AI analysis
      const complexities: ("Low" | "Medium" | "High")[] = ["Low", "Medium", "High"];
      const risks: ("Low" | "Medium" | "High")[] = ["Low", "Medium", "High"];
      
      setEstimation(prev => ({
        ...prev,
        confidence: Math.max(60, Math.min(95, prev.confidence + (Math.random() - 0.5) * 10)),
        effort: Math.max(1, Math.min(21, prev.effort + Math.round((Math.random() - 0.5) * 2))),
      }));
    }, 10000);

    return () => clearInterval(interval);
  }, []);

  const getComplexityColor = (complexity: string) => {
    switch (complexity) {
      case "Low": return "text-estimate-low";
      case "Medium": return "text-estimate-medium";
      case "High": return "text-estimate-high";
      default: return "text-muted-foreground";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "Low": return "text-estimate-low";
      case "Medium": return "text-estimate-medium";
      case "High": return "text-estimate-high";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="space-y-4">
      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <TrendingUp className="w-5 h-5 text-primary" />
            Feature Estimation
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Complexity</label>
              <Badge variant="outline" className={getComplexityColor(estimation.complexity)}>
                {estimation.complexity}
              </Badge>
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-muted-foreground">Story Points</label>
              <div className="text-2xl font-bold text-primary">{estimation.effort}</div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-sm font-medium text-muted-foreground">Confidence</label>
              <span className="text-sm font-medium">{Math.round(estimation.confidence)}%</span>
            </div>
            <Progress value={estimation.confidence} className="h-2" />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Duration</span>
              </div>
              <span className="font-medium">{estimation.duration}</span>
            </div>
            
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Risk Level</span>
              </div>
              <Badge variant="outline" className={getRiskColor(estimation.riskLevel)}>
                {estimation.riskLevel}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <CheckCircle className="w-5 h-5 text-primary" />
            Quality Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Scenario Coverage</span>
              <span className="font-medium text-estimate-low">Good</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Acceptance Criteria</span>
              <span className="font-medium text-estimate-medium">Moderate</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Edge Cases</span>
              <span className="font-medium text-estimate-high">Needs Work</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}