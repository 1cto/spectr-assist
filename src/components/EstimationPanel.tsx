import { useState, useEffect } from "react";
import { BarChart3 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";

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
  sessionId: string;
}

interface LoadingState {
  waitingForFeature: boolean;
  waitingForMetrics: boolean;
}

export function EstimationPanel({ featureContent, sessionId }: EstimationPanelProps) {
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics>({
    "alternative scenarios": 0,
    "alternative scenarios justification": "",
    "given-when-then": 0, 
    "given-when-then justification": "",
    "specifications": 0,
    "specifications justification": "",
    "overall": 0
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

  // Listen for loading state updates and quality metrics updates
  useEffect(() => {
    const loadingChannel = supabase
      .channel(`loading-state-${sessionId}`, { config: { broadcast: { self: true }}})
      .on('broadcast', { event: 'waiting-for-feature' }, () => {
        console.log('EstimationPanel: Received waiting-for-feature signal');
        setLoadingState(prev => ({ ...prev, waitingForFeature: true }));
      })
      .on('broadcast', { event: 'feature-received' }, () => {
        console.log('EstimationPanel: Received feature-received signal');
        setLoadingState(prev => ({ ...prev, waitingForFeature: false, waitingForMetrics: true }));
      })
      .on('broadcast', { event: 'waiting-for-metrics' }, () => {
        console.log('EstimationPanel: Received waiting-for-metrics signal');
        setLoadingState(prev => ({ ...prev, waitingForFeature: false, waitingForMetrics: true }));
      })
      .on('broadcast', { event: 'metrics-received' }, () => {
        console.log('EstimationPanel: Received metrics-received signal');
        setLoadingState(prev => ({ ...prev, waitingForMetrics: false }));
      })
      .subscribe();

    const metricsChannel = supabase
      .channel(`quality-metrics-${sessionId}`)
      .on('broadcast', { event: 'metrics-update' }, (payload) => {
        console.log('Received quality metrics:', payload);
        
        // Update quality metrics with received data
        if (payload.payload) {
          const { timestamp, sessionId: sid, ...metrics } = payload.payload as any;
          setQualityMetrics(prev => ({
            ...prev,
            ...metrics
          }));
        }
        
        // Signal that metrics have been received
        loadingChannel.send({ type: 'broadcast', event: 'metrics-received', payload: { ts: Date.now(), sessionId } });
        setLoadingState(prev => ({ ...prev, waitingForMetrics: false }));
      })
      .subscribe();

    return () => {
      supabase.removeChannel(loadingChannel);
      supabase.removeChannel(metricsChannel);
    };
  }, [sessionId]);

  return (
    <div className="border-none shadow-none" style={{ backgroundColor: '#F4F2EC' }}>
      <div className="pb-3">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <BarChart3 className="w-5 h-5 text-primary" />
          Quality Metrics
        </h3>
      </div>
      <div className="space-y-0">
        <div className="space-y-2 py-4 border-b border-black/8">
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
        
        <div className="space-y-2 py-4 border-b border-black/8">
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
        
        <div className="space-y-2 py-4 border-b border-black/8">
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
          <div className="pt-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-muted-foreground">Overall Score</span>
              <span className="font-bold text-primary">
                {qualityMetrics["overall"]}/9
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}