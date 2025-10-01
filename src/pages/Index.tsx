import { useState, useEffect, useRef } from "react";
import { ChatPanel, ChatPanelRef } from "@/components/ChatPanel";
import { FeatureEditor } from "@/components/FeatureEditor";
import { EstimationPanel } from "@/components/EstimationPanel";
import { TipsPanel } from "@/components/TipsPanel";
import { AuthGuard } from "@/components/AuthGuard";
import { UserMenu } from "@/components/UserMenu";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { MessageSquare, FileCode, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.svg";

interface QualityMetrics {
  "alternative scenarios"?: number;
  "given-when-then"?: number;
  "specifications"?: number;
  "overall"?: number;
  [key: string]: any;
}

const Index = () => {
  const [featureContent, setFeatureContent] = useState("");
  const [qualityMetrics, setQualityMetrics] = useState<QualityMetrics>({});
  const loadingChannelRef = useRef<any>(null);
  const chatPanelRef = useRef<ChatPanelRef>(null);
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);

  const handleSendMessage = (message: string) => {
    if (chatPanelRef.current) {
      chatPanelRef.current.sendMessage(message);
    }
  };

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
          loadingChannelRef.current?.send({ type: 'broadcast', event: 'feature-received' });
          loadingChannelRef.current?.send({ type: 'broadcast', event: 'waiting-for-metrics' });

          // Fail-safe: also broadcast via a temporary channel to ensure delivery
          const tempLoadingCh = supabase.channel(`loading-state-${sessionId.current}`, { config: { broadcast: { self: true }}});
          tempLoadingCh.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
              tempLoadingCh.send({ type: 'broadcast', event: 'feature-received' });
              tempLoadingCh.send({ type: 'broadcast', event: 'waiting-for-metrics' });
              setTimeout(() => supabase.removeChannel(tempLoadingCh), 500);
            }
          });
        }
      })
      .subscribe();

    const metricsChannel = supabase
      .channel(`quality-metrics-${sessionId.current}`)
      .on('broadcast', { event: 'metrics-update' }, (payload) => {
        if (payload.payload) {
          const { timestamp, sessionId: sid, ...metrics } = payload.payload as any;
          setQualityMetrics(prev => ({
            ...prev,
            ...metrics
          }));
        }
      })
      .subscribe();

    return () => {
      if (featureCh) supabase.removeChannel(featureCh);
      if (loadingCh) supabase.removeChannel(loadingCh);
      if (metricsChannel) supabase.removeChannel(metricsChannel);
    };
  }, []);

  const getScoreColor = (score?: number): string => {
    switch (score) {
      case 0:
      case 1:
      case 2:
      case 3: return "text-estimate-high";
      case 4:
      case 5:
      case 6: return "text-estimate-medium";
      case 7:
      case 8:
      case 9: return "text-estimate-low";
      default: return "text-muted-foreground";
    }
  };

  return (
    <div className="h-screen bg-background flex flex-col">
        {/* Header - Hidden on mobile */}
        <header className="hidden md:block bg-gradient-panel px-4 md:px-6 py-3 md:py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 md:gap-4">
              <img src={logo} alt="BA Requirements Studio" className="h-8 md:h-12" />
              <div>
                <h1 className="text-lg md:text-2xl font-bold text-foreground">BA Requirements Studio</h1>
                <p className="text-xs md:text-sm text-muted-foreground hidden sm:block">Collaborative feature file creation and analysis</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground">
              <div className="w-2 h-2 bg-estimate-low rounded-full"></div>
              <span>Ready</span>
            </div>
          </div>
        </header>

        {/* Desktop Layout - Hidden on Mobile */}
        <div className="hidden md:flex flex-1 overflow-hidden">
          {/* Left Panel - Chat */}
          <div className="w-[368px] flex-shrink-0 border-r" style={{ borderColor: 'rgba(0, 0, 0, 0.08)' }}>
            <ChatPanel 
              ref={chatPanelRef}
              featureContent={featureContent} 
              onFeatureChange={setFeatureContent}
              sessionId={sessionId.current}
            />
          </div>

          {/* Center Panel - Feature Editor */}
          <div className="flex-1 min-w-0 p-6">
            <FeatureEditor value={featureContent} onChange={setFeatureContent} sessionId={sessionId.current} />
          </div>

          {/* Right Panel - Estimation & Tips */}
          <div className="w-80 flex-shrink-0 overflow-hidden" style={{ backgroundColor: '#F4F2EC' }}>
            <div className="h-full flex flex-col">
              {/* Estimation Panel (Upper) */}
              <div className="p-4">
                <EstimationPanel 
                  featureContent={featureContent} 
                  sessionId={sessionId.current}
                  qualityMetrics={qualityMetrics}
                  onQualityMetricsChange={setQualityMetrics}
                />
              </div>

              {/* Tips Panel (Lower) */}
              <div className="flex-1 p-4 overflow-auto">
                <TipsPanel onSendMessage={handleSendMessage} sessionId={sessionId.current} />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Tabs */}
        <div className="flex-1 flex flex-col md:hidden overflow-hidden pb-16">
          <Tabs defaultValue="editor" className="flex-1 flex flex-col">
            <TabsContent value="chat" className="flex-1 m-0 overflow-hidden">
              <ChatPanel 
                ref={chatPanelRef}
                featureContent={featureContent} 
                onFeatureChange={setFeatureContent}
                sessionId={sessionId.current}
              />
            </TabsContent>
            
            <TabsContent value="editor" className="flex-1 m-0 overflow-hidden p-4">
              <FeatureEditor value={featureContent} onChange={setFeatureContent} sessionId={sessionId.current} />
            </TabsContent>
            
            <TabsContent value="quality" className="flex-1 m-0 overflow-auto" style={{ backgroundColor: '#F4F2EC' }}>
              <div className="p-4 space-y-4">
                <EstimationPanel 
                  featureContent={featureContent} 
                  sessionId={sessionId.current}
                  qualityMetrics={qualityMetrics}
                  onQualityMetricsChange={setQualityMetrics}
                />
                <TipsPanel onSendMessage={handleSendMessage} sessionId={sessionId.current} />
              </div>
            </TabsContent>

            {/* Bottom Navigation - Fixed */}
            <TabsList className="fixed bottom-0 left-0 right-0 w-full rounded-none border-t grid grid-cols-3 h-16 bg-background z-50">
              <TabsTrigger value="chat" className="gap-2 flex-col h-full py-2">
                <MessageSquare className="w-5 h-5" />
                <span className="text-xs">Chat</span>
              </TabsTrigger>
              <TabsTrigger value="editor" className="gap-2 flex-col h-full py-2">
                <FileCode className="w-5 h-5" />
                <span className="text-xs">Editor</span>
              </TabsTrigger>
              <TabsTrigger value="quality" className="gap-2 flex-col h-full py-2">
                <BarChart3 className="w-5 h-5" />
                <span className="text-xs flex items-center gap-1">
                  Quality
                  {qualityMetrics["overall"] !== undefined && (
                    <span className={`font-bold ${getScoreColor(qualityMetrics["overall"])}`}>
                      {qualityMetrics["overall"]}/9
                    </span>
                  )}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </div>
  );
};

export default Index;
