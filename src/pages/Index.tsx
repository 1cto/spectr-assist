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

const Index = () => {
  const [featureContent, setFeatureContent] = useState("");
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

    return () => {
      if (featureCh) supabase.removeChannel(featureCh);
      if (loadingCh) supabase.removeChannel(loadingCh);
    };
  }, []);

  return (
    <div className="h-screen bg-background flex flex-col">
        {/* Header */}
        <header className="bg-gradient-panel px-4 md:px-6 py-3 md:py-4">
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
                <EstimationPanel featureContent={featureContent} sessionId={sessionId.current} />
              </div>

              {/* Tips Panel (Lower) */}
              <div className="flex-1 p-4 overflow-auto">
                <TipsPanel onSendMessage={handleSendMessage} sessionId={sessionId.current} />
              </div>
            </div>
          </div>
        </div>

        {/* Mobile Layout - Tabs */}
        <div className="flex-1 flex flex-col md:hidden overflow-hidden">
          <Tabs defaultValue="editor" className="flex-1 flex flex-col">
            <TabsList className="w-full rounded-none border-b grid grid-cols-3">
              <TabsTrigger value="chat" className="gap-2">
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Chat</span>
              </TabsTrigger>
              <TabsTrigger value="editor" className="gap-2">
                <FileCode className="w-4 h-4" />
                <span className="hidden sm:inline">Editor</span>
              </TabsTrigger>
              <TabsTrigger value="analysis" className="gap-2">
                <BarChart3 className="w-4 h-4" />
                <span className="hidden sm:inline">Analysis</span>
              </TabsTrigger>
            </TabsList>
            
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
            
            <TabsContent value="analysis" className="flex-1 m-0 overflow-auto" style={{ backgroundColor: '#F4F2EC' }}>
              <div className="p-4 space-y-4">
                <EstimationPanel featureContent={featureContent} sessionId={sessionId.current} />
                <TipsPanel onSendMessage={handleSendMessage} sessionId={sessionId.current} />
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
  );
};

export default Index;
