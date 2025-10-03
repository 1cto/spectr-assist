import { useState, useEffect, useRef } from "react";
import { FileCode, Download, Copy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import hljs from 'highlight.js/lib/core';
import gherkin from 'highlight.js/lib/languages/gherkin';
interface FeatureEditorProps {
  value: string;
  onChange: (value: string) => void;
  sessionId: string;
  onProgressChange?: (visible: boolean, value: number) => void;
  startSignal?: number; // optional external trigger to start progress
}
export function FeatureEditor({
  value: featureContent,
  onChange: setFeatureContent,
  sessionId,
  onProgressChange,
  startSignal
}: FeatureEditorProps) {
  const {
    toast
  } = useToast();
  const [waitingForFeature, setWaitingForFeature] = useState(false);
  const [featureProgressVisible, setFeatureProgressVisible] = useState(false);
  const [featureProgressValue, setFeatureProgressValue] = useState(0);
  const [progressVisible, setProgressVisible] = useState(false);
  const [progressValue, setProgressValue] = useState(0);
  const [metricsReceived, setMetricsReceived] = useState(false);

  // Notify parent of progress changes
  useEffect(() => {
    onProgressChange?.(progressVisible, progressValue);
  }, [progressVisible, progressValue, onProgressChange]);
  const progressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const metricsReceivedRef = useRef(false);

  // Listen to loading-state to swap the Feature File icon with a spinner while waiting
  useEffect(() => {
    console.log('FeatureEditor: Setting up loading-state channel listener');
    const channel = supabase.channel(`loading-state-${sessionId}`, {
      config: {
        broadcast: {
          self: true
        }
      }
    }).on('broadcast', {
      event: 'waiting-for-feature'
    }, () => {
      console.log('FeatureEditor: Received waiting-for-feature signal');
      setWaitingForFeature(true);
      setFeatureProgressVisible(true);
      setFeatureProgressValue(12);
      setProgressVisible(true);
      setProgressValue(12);
      setMetricsReceived(false);
      metricsReceivedRef.current = false;
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      progressTimerRef.current = setInterval(() => {
        setFeatureProgressValue(v => {
          const newValue = v + 3 + Math.random() * 5;
          return Math.min(newValue, 90);
        });
        setProgressValue(v => {
          const newValue = v + 3 + Math.random() * 5;
          if (newValue >= 95 && !metricsReceivedRef.current) {
            return 25 + Math.random() * 10;
          }
          return Math.min(newValue, 90);
        });
      }, 400);
    }).on('broadcast', {
      event: 'feature-received'
    }, () => {
      console.log('FeatureEditor: Received feature-received signal');
      setWaitingForFeature(false);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setFeatureProgressValue(100);
      setTimeout(() => {
        setFeatureProgressVisible(false);
        setFeatureProgressValue(0);
      }, 300);
      setProgressVisible(true);
      setProgressValue(v => Math.max(v, 70));
    }).on('broadcast', {
      event: 'waiting-for-metrics'
    }, () => {
      console.log('FeatureEditor: Received waiting-for-metrics signal');
      setProgressVisible(true);
      setProgressValue(v => Math.max(v, 85));
    }).on('broadcast', {
      event: 'metrics-received'
    }, () => {
      console.log('FeatureEditor: Received metrics-received signal');
      setMetricsReceived(true);
      metricsReceivedRef.current = true;
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      setProgressValue(100);
      setTimeout(() => {
        setProgressVisible(false);
        setProgressValue(0);
      }, 300);
    }).subscribe();
    return () => {
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
      supabase.removeChannel(channel);
    };
  }, [sessionId]);

  // External trigger to force progress start (fail-safe)
  const firstStartRef = useRef(true);
  useEffect(() => {
    // Ignore initial mount
    if (firstStartRef.current) {
      firstStartRef.current = false;
      return;
    }
    if (startSignal === undefined || startSignal === null) return;
    // Mirror waiting-for-feature behavior
    setWaitingForFeature(true);
    setFeatureProgressVisible(true);
    setFeatureProgressValue(12);
    setProgressVisible(true);
    setProgressValue(12);
    setMetricsReceived(false);
    metricsReceivedRef.current = false;
    if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    progressTimerRef.current = setInterval(() => {
      setFeatureProgressValue(v => {
        const newValue = v + 3 + Math.random() * 5;
        return Math.min(newValue, 90);
      });
      setProgressValue(v => {
        const newValue = v + 3 + Math.random() * 5;
        if (newValue >= 95 && !metricsReceivedRef.current) {
          return 25 + Math.random() * 10;
        }
        return Math.min(newValue, 90);
      });
    }, 400);
  }, [startSignal]);
  useEffect(() => {
    hljs.registerLanguage('gherkin', gherkin);
  }, []);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  const handleScrollSync = () => {
    if (textareaRef.current && overlayRef.current) {
      overlayRef.current.scrollTop = textareaRef.current.scrollTop;
      overlayRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(featureContent);
      toast({
        title: "Copied to clipboard",
        description: "Feature file content has been copied to your clipboard."
      });
    } catch (err) {
      toast({
        title: "Copy failed",
        description: "Unable to copy to clipboard.",
        variant: "destructive"
      });
    }
  };
  const handleDownload = () => {
    const blob = new Blob([featureContent], {
      type: 'text/plain'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'feature.feature';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({
      title: "Feature file downloaded",
      description: "Your feature file has been saved as 'feature.feature'"
    });
  };
  const getHighlightedContent = (content: string) => {
    try {
      // Register Gherkin language if not already registered
      if (!hljs.getLanguage('gherkin')) {
        hljs.registerLanguage('gherkin', gherkin);
      }
      const highlighted = hljs.highlight(content, {
        language: 'gherkin'
      });
      return highlighted.value;
    } catch (error) {
      console.warn('Highlighting failed, using custom highlighting:', error);
      // Fallback to custom highlighting if hljs fails
      return customHighlight(content);
    }
  };
  const customHighlight = (content: string) => {
    return content.split('\n').map(line => {
      const trimmedLine = line.trim();
      let highlightedLine = line;
      if (trimmedLine.startsWith('Feature:')) {
        highlightedLine = line.replace(/Feature:/, '<span class="hljs-title">Feature:</span>');
      } else if (trimmedLine.startsWith('Scenario:') || trimmedLine.startsWith('Scenario Outline:')) {
        highlightedLine = line.replace(/(Scenario.*?:)/, '<span class="hljs-meta">$1</span>');
      } else if (trimmedLine.startsWith('Background:')) {
        highlightedLine = line.replace(/Background:/, '<span class="hljs-keyword">Background:</span>');
      } else if (trimmedLine.startsWith('Given')) {
        highlightedLine = line.replace(/Given/, '<span class="hljs-built_in">Given</span>');
      } else if (trimmedLine.startsWith('When')) {
        highlightedLine = line.replace(/When/, '<span class="hljs-name">When</span>');
      } else if (trimmedLine.startsWith('Then')) {
        highlightedLine = line.replace(/Then/, '<span class="hljs-function">Then</span>');
      } else if (trimmedLine.startsWith('And')) {
        highlightedLine = line.replace(/And/, '<span class="hljs-keyword">And</span>');
      } else if (trimmedLine.startsWith('But')) {
        highlightedLine = line.replace(/But/, '<span class="hljs-keyword">But</span>');
      } else if (trimmedLine.startsWith('As a') || trimmedLine.startsWith('I want') || trimmedLine.startsWith('So that')) {
        highlightedLine = `<span class="hljs-comment">${line}</span>`;
      }

      // Highlight strings in quotes
      highlightedLine = highlightedLine.replace(/"([^"]*)"/g, '<span class="hljs-string">"$1"</span>');
      return highlightedLine;
    }).join('\n');
  };
  return <div className="flex flex-col h-full bg-white rounded-2xl shadow-[0_4px_24px_rgba(0,0,0,0.08)]">
      <div className="p-4 bg-white flex items-center justify-between rounded-t-2xl border-b" style={{
      borderColor: 'rgba(0, 0, 0, 0.08)'
    }}>
        <div className="flex items-center gap-2">
          {waitingForFeature ? <FileCode className="w-5 h-5 text-primary" /> : <FileCode className="w-5 h-5 text-primary" />}
          <div>
            <h2 className="font-semibold text-foreground">Feature File</h2>
            {featureProgressVisible && (
              <div className="mt-1" style={{ width: '90px' }}>
                <Progress value={featureProgressValue} className="h-1" />
              </div>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleCopy} className="text-xs">
            <Copy className="w-4 h-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline" size="sm" onClick={handleDownload} className="text-xs">
            <Download className="w-4 h-4 mr-2" />
            Download
          </Button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="relative h-full">
          <Textarea ref={textareaRef} value={featureContent} onChange={e => setFeatureContent(e.target.value)} onScroll={handleScrollSync} readOnly className="w-full h-full resize-none border-0 rounded-none focus:ring-0 font-mono text-sm leading-relaxed p-6 bg-transparent text-transparent caret-foreground selection:bg-primary/20 overflow-auto" style={{ hyphens: 'none', wordBreak: 'normal', whiteSpace: 'pre' }} placeholder="Write your BDD scenarios&#10;using Gherkin syntax&#10;&#10;Feature:&#10;&#10;Background:&#10;&#10;Scenario:" />
          <div className="absolute inset-0 pointer-events-none p-6 font-mono text-sm overflow-auto no-scrollbar" style={{ whiteSpace: 'pre', wordBreak: 'normal', hyphens: 'none', overflowWrap: 'normal' }} ref={overlayRef}>
            <div className="select-none leading-relaxed" dangerouslySetInnerHTML={{
            __html: getHighlightedContent(featureContent)
          }} />
          </div>
        </div>
      </div>

      <div className="p-4 bg-white rounded-b-2xl border-t" style={{
      borderColor: 'rgba(0, 0, 0, 0.08)'
    }}>
        <div className="flex items-center gap-4 text-sm text-muted-foreground">
          <span>Lines: {featureContent.split('\n').length}</span>
          <span>Scenarios: {(featureContent.match(/Scenario:/g) || []).length}</span>
          <span>Steps: {(featureContent.match(/^\s*(Given|When|Then|And|But)/gm) || []).length}</span>
        </div>
      </div>
    </div>;
}