import { useState, useEffect } from "react";
import { Clock, TrendingUp, AlertCircle, CheckCircle, Loader2, FileText, BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";

interface EstimationData {
  complexity: "Low" | "Medium" | "High";
  effort: number; // in story points
  duration: string;
  confidence: number; // percentage
  riskLevel: "Low" | "Medium" | "High";
}

interface QualityMetrics {
  "alternative scenarios"?: number;
  "alternative scenarios justification"?: string;
  "given-when-then"?: number;
  "given-when-then justification"?: string;
  "specifications"?: number;
  "specifications justification"?: string;
  "overall"?: number;
  [key: string]: any; // Allow for additional custom metrics
}

interface EstimationPanelProps {
  featureContent: string;
}

interface LoadingState {
  waitingForFeature: boolean;
  waitingForMetrics: boolean;
}

export function EstimationPanel({ featureContent }: EstimationPanelProps) {
  const [estimation, setEstimation] = useState<EstimationData>({
    complexity: "Medium",
    effort: 8,
    duration: "3-5 days",
    confidence: 75,
    riskLevel: "Low",
  });

  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics>({
    "alternative scenarios": 2,
    "alternative scenarios justification": "Basic scenario coverage",
    "given-when-then": 2, 
    "given-when-then justification": "Moderate step structure",
    "specifications": 2,
    "specifications justification": "Clear but basic specifications",
    "overall": 6
  });

  const [loadingState, setLoadingState] = useState<LoadingState>({
    waitingForFeature: false,
    waitingForMetrics: false,
  });

  // Convert numeric score to text label
  const getScoreLabel = (score?: number): string => {
    switch (score) {
      case 0: return "Bad";
      case 1: return "Needs Work";
      case 2: return "Moderate";
      case 3: return "Good";
      default: return "Unknown";
    }
  };

  // Get color class based on score
  const getScoreColor = (score?: number): string => {
    switch (score) {
      case 0: return "text-estimate-high"; // Bad - red
      case 1: return "text-estimate-medium"; // Needs Work - orange
      case 2: return "text-estimate-medium"; // Moderate - orange
      case 3: return "text-estimate-low"; // Good - green
      default: return "text-muted-foreground";
    }
  };

  // Analyze feature content and update estimation
  useEffect(() => {
    const analyzeFeature = () => {
      const scenarios = (featureContent.match(/Scenario:/g) || []).length;
      const steps = (featureContent.match(/\s+(Given|When|Then|And)\s+/g) || []).length;
      const hasBackground = featureContent.includes("Background:");
      const hasExamples = featureContent.includes("Examples:");
      
      let complexity: "Low" | "Medium" | "High" = "Low";
      let effort = 3;
      let duration = "1-2 days";
      let confidence = 85;
      let riskLevel: "Low" | "Medium" | "High" = "Low";

      // Complexity based on scenarios and steps
      if (scenarios >= 4 || steps >= 15) {
        complexity = "High";
        effort = 13;
        duration = "1-2 weeks";
        confidence = 65;
        riskLevel = "Medium";
      } else if (scenarios >= 2 || steps >= 8) {
        complexity = "Medium";
        effort = 8;
        duration = "3-5 days";
        confidence = 75;
        riskLevel = "Low";
      }

      // Adjust for background and examples
      if (hasBackground) effort += 1;
      if (hasExamples) effort += 2;

      // User registration is a common but important feature
      if (featureContent.toLowerCase().includes("registration") || 
          featureContent.toLowerCase().includes("sign up")) {
        riskLevel = "Medium";
        confidence = Math.max(70, confidence - 5);
      }

      setEstimation({
        complexity,
        effort: Math.min(21, effort),
        duration,
        confidence,
        riskLevel,
      });
    };

    analyzeFeature();
  }, [featureContent]);

  // Listen for loading state updates and quality metrics updates
  useEffect(() => {
    const loadingChannel = supabase
      .channel('loading-state')
      .on('broadcast', { event: 'waiting-for-feature' }, () => {
        console.log('EstimationPanel: Received waiting-for-feature signal');
        setLoadingState(prev => ({ ...prev, waitingForFeature: true }));
      })
      .on('broadcast', { event: 'feature-received' }, () => {
        console.log('EstimationPanel: Received feature-received signal');
        setLoadingState(prev => ({ ...prev, waitingForFeature: false, waitingForMetrics: true }));
      })
      .on('broadcast', { event: 'metrics-received' }, () => {
        console.log('EstimationPanel: Received metrics-received signal');
        setLoadingState(prev => ({ ...prev, waitingForMetrics: false }));
      })
      .subscribe();

    const metricsChannel = supabase
      .channel('quality-metrics')
      .on('broadcast', { event: 'metrics-update' }, (payload) => {
        console.log('Received quality metrics:', payload);
        
        // Update quality metrics with received data
        if (payload.payload) {
          setQualityMetrics(prev => ({
            ...prev,
            ...payload.payload
          }));
          
          // If estimation data is included, update that too
          if (payload.payload.estimation) {
            setEstimation(prev => ({
              ...prev,
              ...payload.payload.estimation
            }));
          }
        }
        
        // Signal that metrics have been received
        loadingChannel.send({ type: 'broadcast', event: 'metrics-received' });
        setLoadingState(prev => ({ ...prev, waitingForMetrics: false }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(loadingChannel);
      supabase.removeChannel(metricsChannel);
    };
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
            {loadingState.waitingForMetrics ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <BarChart3 className="w-5 h-5 text-primary" />
            )}
            Quality Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Alternative Scenarios</span>
                <span className={`font-medium ${getScoreColor(qualityMetrics["alternative scenarios"])}`}>
                  {getScoreLabel(qualityMetrics["alternative scenarios"])} ({qualityMetrics["alternative scenarios"] || 0}/3)
                </span>
              </div>
              {qualityMetrics["alternative scenarios justification"] && (
                <p className="text-xs text-muted-foreground ml-2">
                  {qualityMetrics["alternative scenarios justification"]}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Given-When-Then</span>
                <span className={`font-medium ${getScoreColor(qualityMetrics["given-when-then"])}`}>
                  {getScoreLabel(qualityMetrics["given-when-then"])} ({qualityMetrics["given-when-then"] || 0}/3)
                </span>
              </div>
              {qualityMetrics["given-when-then justification"] && (
                <p className="text-xs text-muted-foreground ml-2">
                  {qualityMetrics["given-when-then justification"]}
                </p>
              )}
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Specifications</span>
                <span className={`font-medium ${getScoreColor(qualityMetrics["specifications"])}`}>
                  {getScoreLabel(qualityMetrics["specifications"])} ({qualityMetrics["specifications"] || 0}/3)
                </span>
              </div>
              {qualityMetrics["specifications justification"] && (
                <p className="text-xs text-muted-foreground ml-2">
                  {qualityMetrics["specifications justification"]}
                </p>
              )}
            </div>

            {qualityMetrics["overall"] !== undefined && (
              <div className="pt-2 border-t">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-muted-foreground">Overall Score</span>
                  <span className="font-bold text-primary">
                    {qualityMetrics["overall"]}/9
                  </span>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <Card className="shadow-card">
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            {loadingState.waitingForFeature ? (
              <Loader2 className="w-5 h-5 text-primary animate-spin" />
            ) : (
              <FileText className="w-5 h-5 text-primary" />
            )}
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
    </div>
  );
}