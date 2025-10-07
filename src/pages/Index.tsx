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
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/logo.svg";

const Index = () => {
  const [featureContent, setFeatureContent] = useState("");
  const [activeTab, setActiveTab] = useState<"chat" | "document" | "quality">("chat");
  const [hasDocumentUpdate, setHasDocumentUpdate] = useState(false);
  const [overallScore, setOverallScore] = useState<number | null>(null);
  const [documentProgress, setDocumentProgress] = useState<{ visible: boolean; value: number }>({ visible: false, value: 0 });
  const [startSignal, setStartSignal] = useState(0);
  const loadingChannelRef = useRef<any>(null);
  const chatPanelRef = useRef<ChatPanelRef>(null);
  // Session management: selected session and available sessions for the current user
  const { user } = useAuth();
  const [availableSessions, setAvailableSessions] = useState<string[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const isMobile = useIsMobile();
  const previousFeatureContent = useRef(featureContent);

  const startWaiting = useCallback(() => {
    // Kick off mobile progress immediately
    setDocumentProgress({ visible: true, value: 12 });
    setStartSignal((k) => k + 1);
    // Broadcast waiting-for-feature via parent-held channel
    try {
      if (selectedSessionId) {
        loadingChannelRef.current?.send({ type: 'broadcast', event: 'waiting-for-feature', payload: { ts: Date.now(), sessionId: selectedSessionId } });
      }
    } catch {}
    if (!selectedSessionId) return;
    const tempLoadingCh = supabase.channel(`loading-state-${selectedSessionId}`, { config: { broadcast: { self: true }}});
    tempLoadingCh.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        tempLoadingCh.send({ type: 'broadcast', event: 'waiting-for-feature', payload: { ts: Date.now(), sessionId: selectedSessionId } });
        setTimeout(() => supabase.removeChannel(tempLoadingCh), 500);
      }
    });
  }, [setDocumentProgress, selectedSessionId]);

  const handleSendMessage = (message: string) => {
    // Ensure waiting state starts even if ChatPanel channel isn't ready
    startWaiting();
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

  // Load sessions list for the current user and pick the most recent by default
  useEffect(() => {
    if (!user?.id) {
      setAvailableSessions([]);
      setSelectedSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
      return;
    }
    (async () => {
      const { data, error } = await supabase
        .from('n8n_chat_histories')
        .select('session_id,id')
        .eq('user_id', user.id)
        .order('id', { ascending: false });
      if (error) {
        console.error('Error loading sessions:', error);
        setAvailableSessions([]);
        setSelectedSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
        return;
      }
      const unique: string[] = [];
      if (data) {
        for (const row of data) {
          if (row.session_id && !unique.includes(row.session_id)) unique.push(row.session_id);
        }
      }
      setAvailableSessions(unique);
      setSelectedSessionId(unique[0] || `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
    })();
  }, [user?.id]);

  // Subscribe to per-session channels; resubscribe when selected session changes
  useEffect(() => {
    if (!selectedSessionId) return;
    const loadingCh = supabase.channel(`loading-state-${selectedSessionId}`, { config: { broadcast: { self: true }}}).subscribe();
    loadingChannelRef.current = loadingCh;

    const featureCh = supabase
      .channel(`feature-updates-${selectedSessionId}`)
      .on('broadcast', { event: 'feature-update' }, (payload) => {
        console.log('Received feature update:', payload);
        if (payload.payload?.content || payload.payload?.text) {
          setFeatureContent(payload.payload.content || payload.payload.text);
          // Notify Feature File that feature has been received to stop spinner and start QM spinner
           loadingChannelRef.current?.send({ type: 'broadcast', event: 'feature-received', payload: { ts: Date.now(), sessionId: selectedSessionId } });
           loadingChannelRef.current?.send({ type: 'broadcast', event: 'waiting-for-metrics', payload: { ts: Date.now(), sessionId: selectedSessionId } });

          // Fail-safe: also broadcast via a temporary channel to ensure delivery
          const tempLoadingCh = supabase.channel(`loading-state-${selectedSessionId}`, { config: { broadcast: { self: true }}});
          tempLoadingCh.subscribe((status) => {
            if (status === 'SUBSCRIBED') {
               tempLoadingCh.send({ type: 'broadcast', event: 'feature-received', payload: { ts: Date.now(), sessionId: selectedSessionId } });
               tempLoadingCh.send({ type: 'broadcast', event: 'waiting-for-metrics', payload: { ts: Date.now(), sessionId: selectedSessionId } });
              setTimeout(() => supabase.removeChannel(tempLoadingCh), 500);
            }
          });
        }
      })
      .subscribe();

    // Listen for quality metrics to get overall score
    const metricsChannel = supabase
      .channel(`quality-metrics-${selectedSessionId}`)
      .on('broadcast', { event: 'metrics-update' }, (payload) => {
        console.log('Index: Received metrics update:', payload);
        if (payload.payload?.overall !== undefined) {
          console.log('Index: Setting overall score:', payload.payload.overall);
          setOverallScore(payload.payload.overall);
          
          // Broadcast metrics-received to stop the progress bar
          loadingChannelRef.current?.send({ type: 'broadcast', event: 'metrics-received', payload: { ts: Date.now(), sessionId: selectedSessionId } });
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
  }, [selectedSessionId]);

  return (
    <AuthGuard>
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
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                  <div className="w-2 h-2 bg-estimate-low rounded-full"></div>
                  <span className="hidden sm:inline">Ready</span>
                </div>
                {/* Session selector */}
                <div className="flex items-center gap-2">
                  <label htmlFor="session-select-id" className="text-xs sm:text-sm text-muted-foreground">Session</label>
                  <select
                    id="session-select-id"
                    className="text-xs sm:text-sm border rounded px-2 py-1 bg-background"
                    value={selectedSessionId ?? ''}
                    onChange={(e) => setSelectedSessionId(e.target.value)}
                  >
                    {(selectedSessionId && !availableSessions.includes(selectedSessionId)) && (
                      <option value={selectedSessionId}>{selectedSessionId}</option>
                    )}
                    {availableSessions.map((sid) => (
                      <option key={sid} value={sid}>{sid}</option>
                    ))}
                  </select>
                  <button
                    id="new-session-btn-id"
                    className="text-xs sm:text-sm px-2 py-1 border rounded"
                    onClick={() => setSelectedSessionId(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`)}
                  >
                    New
                  </button>
                </div>
                <UserMenu />
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
                  sessionId={selectedSessionId || ''}
                  onStartWaiting={startWaiting}
                />
              </div>
              
              <div className={`h-full p-4 ${activeTab === "document" ? "block" : "hidden"}`}>
                <FeatureEditor 
                  value={featureContent} 
                  onChange={setFeatureContent} 
                  sessionId={selectedSessionId || ''}
                  onProgressChange={handleProgressChange}
                  startSignal={startSignal}
                />
              </div>
              
              <div className={`h-full ${activeTab === "quality" ? "block" : "hidden"}`}>
                <QualityPanel 
                  featureContent={featureContent} 
                  sessionId={selectedSessionId || ''}
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
                  sessionId={selectedSessionId || ''}
                  onStartWaiting={startWaiting}
                />
              </div>

              {/* Center Panel - Feature Editor */}
              <div className="flex-1 min-w-0 p-6 flex flex-col">
                <div className="flex-1 min-h-0">
                  <FeatureEditor 
                    value={featureContent} 
                    onChange={setFeatureContent} 
                    sessionId={selectedSessionId || ''}
                    onProgressChange={handleProgressChange}
                    startSignal={startSignal}
                  />
                </div>
              </div>

              {/* Right Panel - Quality (30% width, max 400px) */}
              <div className="w-[30%] max-w-[400px] flex-shrink-0 flex flex-col overflow-hidden">
                <QualityPanel 
                  featureContent={featureContent} 
                  sessionId={selectedSessionId || ''}
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
                id="mob-chat-tab-id"
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
                id="mob-feature-tab-id"
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
                id="mob-quality-tab-id"
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
    </AuthGuard>
  );
};

export default Index;
