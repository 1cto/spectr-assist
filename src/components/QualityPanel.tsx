import { useState, useEffect, useRef } from "react";
import { BarChart3, Lightbulb, BookOpen, Target, AlertTriangle, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { supabase } from "@/integrations/supabase/client";

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

interface Tip {
  id: string;
  type: "improvement" | "warning" | "best-practice" | "suggestion";
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  category: string;
}

interface QualityPanelProps {
  featureContent: string;
  sessionId: string;
  onSendMessage?: (message: string) => void;
}

export function QualityPanel({ featureContent, sessionId, onSendMessage }: QualityPanelProps) {
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics>({
    "alternative scenarios": 0,
    "alternative scenarios justification": "",
    "given-when-then": 0,
    "given-when-then justification": "",
    "specifications": 0,
    "specifications justification": "",
    "overall": 0
  });
  const [metricsTips, setMetricsTips] = useState<Tip[]>([]);
  const [loadingState, setLoadingState] = useState({
    waitingForFeature: false,
    waitingForMetrics: false,
  });
  const [metricsProgressVisible, setMetricsProgressVisible] = useState(false);
  const [metricsProgressValue, setMetricsProgressValue] = useState(0);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);

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
      case 0: return "text-estimate-high";
      case 1: return "text-estimate-medium";
      case 2: return "text-estimate-medium";
      case 3: return "text-estimate-low";
      default: return "text-muted-foreground";
    }
  };

  const generateTipsFromMetrics = (metrics: QualityMetrics) => {
    const tips: Tip[] = [];

    if (metrics["alternative scenarios"] !== undefined && metrics["alternative scenarios"] <= 2) {
      tips.push({
        id: "alt-scenarios",
        type: getMetricTipType(metrics["alternative scenarios"]),
        title: "Improve Alternative Scenarios",
        description: metrics["alternative scenarios justification"] || "Add more alternative scenarios to cover edge cases and different user paths.",
        priority: getMetricPriority(metrics["alternative scenarios"]),
        category: "Scenarios",
      });
    }

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

  // Listen for loading state updates and quality metrics updates
  useEffect(() => {
    const loadingChannel = supabase
      .channel(`loading-state-${sessionId}`, { config: { broadcast: { self: true }}})
      .on('broadcast', { event: 'waiting-for-feature' }, () => {
        setLoadingState(prev => ({ ...prev, waitingForFeature: true }));
      })
      .on('broadcast', { event: 'feature-received' }, () => {
        setLoadingState(prev => ({ ...prev, waitingForFeature: false, waitingForMetrics: true }));
      })
      .on('broadcast', { event: 'waiting-for-metrics' }, () => {
        setLoadingState(prev => ({ ...prev, waitingForFeature: false, waitingForMetrics: true }));
        setMetricsProgressVisible(true);
        setMetricsProgressValue(12);
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        progressTimerRef.current = setInterval(() => {
          setMetricsProgressValue(v => {
            const newValue = v + 3 + Math.random() * 5;
            if (newValue >= 100) return 0;
            return newValue;
          });
        }, 400);
      })
      .on('broadcast', { event: 'metrics-received' }, () => {
        setLoadingState(prev => ({ ...prev, waitingForMetrics: false }));
        if (progressTimerRef.current) clearInterval(progressTimerRef.current);
        setMetricsProgressValue(100);
        setTimeout(() => {
          setMetricsProgressVisible(false);
          setMetricsProgressValue(0);
        }, 300);
      })
      .subscribe();

    const metricsChannel = supabase
      .channel(`quality-metrics-${sessionId}`)
      .on('broadcast', { event: 'metrics-update' }, (payload) => {
        console.log('QualityPanel: Received metrics update:', payload);
        if (payload.payload) {
          const { timestamp, sessionId: sid, ...metrics } = payload.payload as any;
          console.log('QualityPanel: Updating metrics:', metrics);
          setQualityMetrics(prev => ({
            ...prev,
            ...metrics
          }));
          generateTipsFromMetrics(payload.payload);
        }
        
        loadingChannel.send({ type: 'broadcast', event: 'metrics-received', payload: { ts: Date.now(), sessionId } });
        setLoadingState(prev => ({ ...prev, waitingForMetrics: false }));
      })
      .subscribe((status) => {
        console.log('QualityPanel: Metrics channel subscription status:', status);
      });

    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      supabase.removeChannel(loadingChannel);
      supabase.removeChannel(metricsChannel);
    };
  }, [sessionId]);

  return (
    <div className="h-full flex flex-col overflow-hidden" style={{ backgroundColor: '#F4F2EC' }}>
      <Accordion type="multiple" defaultValue={["metrics", "tips", "guide"]} className="flex-1 overflow-auto p-4">
        {/* Quality Metrics Section */}
        <AccordionItem value="metrics" className="border-b border-black/8">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                <div>
                  <span className="font-semibold text-lg">Quality Metrics</span>
                  {metricsProgressVisible && (
                    <div className="mt-1" style={{ width: '120px' }}>
                      <Progress value={metricsProgressValue} className="h-1" />
                    </div>
                  )}
                </div>
              </div>
              {qualityMetrics["overall"] !== undefined && (
                <Badge className="bg-primary text-primary-foreground">
                  {qualityMetrics["overall"]}/9
                </Badge>
              )}
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-0 pt-2">
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
          </AccordionContent>
        </AccordionItem>

        {/* Improvement Tips Section */}
        <AccordionItem value="tips" className="border-b border-black/8">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <Star className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg">Improvement Tips</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-2">
              {metricsTips.length > 0 ? (
                metricsTips.map((tip) => (
                  <div
                    key={tip.id}
                    className="p-3 border border-border rounded-lg hover:border-primary/30 transition-colors bg-background"
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
                            id="apply-id"
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
          </AccordionContent>
        </AccordionItem>

        {/* Gherkin Guide Section */}
        <AccordionItem value="guide" className="border-b-0">
          <AccordionTrigger className="hover:no-underline py-3">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="font-semibold text-lg">Gherkin Guide</span>
            </div>
          </AccordionTrigger>
          <AccordionContent>
            <div className="space-y-3 text-sm pt-2">
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
