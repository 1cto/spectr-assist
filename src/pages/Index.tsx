import { useState, useEffect, useRef, useCallback } from "react";
import { ChatPanel, ChatPanelRef } from "@/components/ChatPanel";
import { FeatureEditor } from "@/components/FeatureEditor";
import { QualityPanel } from "@/components/QualityPanel";
import { AuthGuard } from "@/components/AuthGuard";
import { UserMenu } from "@/components/UserMenu";
import { supabase } from "@/integrations/supabase/client";
import { useIsMobile } from "@/hooks/use-mobile";
import { MessageSquare, FileText, BarChart3 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import logo from "@/assets/logo.svg";

const Index = () => {
  const [featureContent, setFeatureContent] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "document" | "quality">("chat");
  const [hasDocumentUpdate, setHasDocumentUpdate] = useState(false);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [documentProgress, setDocumentProgress] = useState<{ visible: boolean; value: number }>({ visible: false, value: 0 });
  const loadingChannelRef = useRef<any>(null);
  const chatPanelRef = useRef<ChatPanelRef>(null);
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const isMobile = useIsMobile();
  const previousFeatureContent = useRef(featureContent);

  const handleSendMessage = (message: string) => {
    if (chatPanelRef.current) {
      chatPanelRef.current.sendMessage(message);
    }
  };

  const handleProgressChange = useCallback((visible: boolean, value: number) => {
    setDocumentProgress({ visible, value });
  }, []);

  // Track document updates for mobile badge
  useEffect(() => {
    if (isMobile && featureContent !== previousFeatureContent.current && activeTab !== "document" && featureContent !== "") {
      setHasDocumentUpdate(true);
    }
    previousFeatureContent.current = featureContent;
  }, [featureContent, activeTab, isMobile]);

  // Clear badge when switching to document tab
  useEffect(() => {
    if (activeTab === "document") {
      setHasDocumentUpdate(false);
    }
  }, [activeTab]);

  useEffect(() => {
    const loadingCh = supabase.channel(`loading-state-${sessionId.current}`, { config: { broadcast: { self: true }}}).subscribe();
    loadingChannelRef.current = loadingCh;

    const featureCh = supabase
      .channel(`feature-updates-${sessionId.current}`)
      .on('broadcast', { event: 'feature-update' }, (payload) => {
        console.log('Received feature update:', payload);
        if (payload.payload?.content || payload.payload?.text) {
          setFeatureContent(payload.payload.content || payload.payload.text);
          // Notify Feature File that feature has been received to stop spinner and start QM spinner
           loadingChannelRef.current?.send({ type: 'broadcast', event: 'feature-received', payload: { ts: Date.now(), sessionId: sessionId.current } });
           loadingChannelRef.current?.send({ type: 'broadcast', event: 'waiting-for-metrics', payload: { ts: Date.now(), sessionId: sessionId.current } });

          // Fail-safe: also broadcast via a temporary channel to ensure delivery
          const tempLoadingCh = supabase.channel(`loading-state-${sessionId.current}`, { config: { broadcast: { self: true }}});
          tempLoadingCh.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
               tempLoadingCh.send({ type: 'broadcast', event: 'feature-received', payload: { ts: Date.now(), sessionId: sessionId.current } });
               tempLoadingCh.send({ type: 'broadcast', event: 'waiting-for-metrics', payload: { ts: Date.now(), sessionId: sessionId.current } });
              setTimeout(() => supabase.removeChannel(tempLoadingCh), 500);
            }
          });
        }
      })
      .subscribe();

    // Listen for quality metrics to get overall score
    const metricsChannel = supabase
      .channel(`quality-metrics-${sessionId.current}`)
      .on('broadcast', { event: 'metrics-update' }, (payload) => {
        console.log('Index: Received metrics update:', payload);
        if (payload.payload?.overall !== undefined) {
          console.log('Index: Setting overall score:', payload.payload.overall);
          setOverallScore(payload.payload.overall);
          
          // Broadcast metrics-received to stop the progress bar
          loadingChannelRef.current?.send({ type: 'broadcast', event: 'metrics-received', payload: { ts: Date.now(), sessionId: sessionId.current } });
        }
      })
      .subscribe((status) => {
        console.log('Index: Metrics channel subscription status:', status);
      });

    return () => {
      if (featureCh) supabase.removeChannel(featureCh);
      if (loadingCh) supabase.removeChannel(loadingCh);
      if (metricsChannel) supabase.removeChannel(metricsChannel);
    };
  }, []);

  return (
    <div className="h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="bg-gradient-panel px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-4">
              <img src={logo} alt="BA Requirements Studio" className="h-8 sm:h-12" />
              <div>
                <h1 className="text-lg sm:text-2xl font-bold text-foreground">BA Requirements Studio</h1>
                <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">Collaborative feature file creation and analysis</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-estimate-low rounded-full"></div>
              <span className="hidden sm:inline">Ready</span>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="flex-1 flex overflow-hidden pb-16 lg:pb-0">
          {/* Mobile: Single Panel View */}
          {isMobile ? (
            <div className="flex-1 overflow-hidden">
              <div className={`h-full border-r ${activeTab === "chat" ? "block" : "hidden"}`} style={{ borderColor: 'rgba(0, 0, 0, 0.08)' }}>
                <ChatPanel 
                  ref={chatPanelRef}
                  featureContent={featureContent} 
                  onFeatureChange={setFeatureContent}
                  sessionId={sessionId.current}
                />
              </div>
              
              <div className={`h-full p-4 ${activeTab === "document" ? "block" : "hidden"}`}>
                <FeatureEditor 
                  value={featureContent} 
                  onChange={setFeatureContent} 
                  sessionId={sessionId.current}
                  onProgressChange={handleProgressChange}
                />
              </div>
              
              <div className={`h-full ${activeTab === "quality" ? "block" : "hidden"}`}>
                <QualityPanel 
                  featureContent={featureContent} 
                  sessionId={sessionId.current}
                  onSendMessage={handleSendMessage}
                />
              </div>
            </div>
          ) : (
            /* Desktop: Three Column Layout - 30%, 40%, 30% */
            <div className="flex-1 flex overflow-hidden justify-center">
              {/* Left Panel - Chat (30% width, max 400px) */}
              <div className="w-[30%] max-w-[400px] flex-shrink-0 border-r" style={{ borderColor: 'rgba(0, 0, 0, 0.08)' }}>
                <ChatPanel 
                  ref={chatPanelRef}
                  featureContent={featureContent} 
                  onFeatureChange={setFeatureContent}
                  sessionId={sessionId.current}
                />
              </div>

              {/* Center Panel - Feature Editor */}
              <div className="flex-1 min-w-0 p-6 flex flex-col">
                <div className="flex-1 min-h-0">
                  <FeatureEditor 
                    value={featureContent} 
                    onChange={setFeatureContent} 
                    sessionId={sessionId.current}
                    onProgressChange={handleProgressChange}
                  />
                </div>
              </div>

              {/* Right Panel - Quality (30% width, max 400px) */}
              <div className="w-[30%] max-w-[400px] flex-shrink-0 flex flex-col overflow-hidden">
                <QualityPanel 
                  featureContent={featureContent} 
                  sessionId={sessionId.current}
                  onSendMessage={handleSendMessage}
                />
              </div>
            </div>
          )}
        </div>

        {/* Mobile Bottom Tab Bar */}
        {isMobile && (
          <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50">
            <nav className="flex">
              <button
                onClick={() => setActiveTab("chat")}
                className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors ${
                  activeTab === "chat" 
                    ? "text-primary bg-accent" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <MessageSquare className="h-5 w-5 mb-1" />
                <span className="text-xs font-medium">Chat</span>
              </button>
              
              <button
                onClick={() => setActiveTab("document")}
                className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors relative ${
                  activeTab === "document" 
                    ? "text-primary bg-accent" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative w-full flex flex-col items-center">
                  <div className="relative">
                    <FileText className="h-5 w-5 mb-1" />
                    {hasDocumentUpdate && (
                      <Badge className="absolute -top-1 -right-2 h-2 w-2 p-0 bg-primary" />
                    )}
                  </div>
                  <span className="text-xs font-medium mb-1">Document</span>
                  {documentProgress.visible && (
                    <div className="w-full px-2">
                      <div className="h-1 bg-secondary rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-primary transition-all duration-300"
                          style={{ width: `${documentProgress.value}%` }}
                        />
                      </div>
                    </div>
                  )}
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab("quality")}
                className={`flex-1 flex flex-col items-center justify-center py-3 px-2 transition-colors relative ${
                  activeTab === "quality" 
                    ? "text-primary bg-accent" 
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <div className="relative">
                  <BarChart3 className="h-5 w-5 mb-1" />
                  {overallScore !== null && (
                    <Badge className="absolute -top-1 -right-3 h-4 px-1 text-[10px] bg-primary">
                      {overallScore}
                    </Badge>
                  )}
                </div>
                <span className="text-xs font-medium">Quality</span>
              </button>
            </nav>
          </div>
        )}
      </div>
  );
};

export default Index;
