import { ChatPanel } from "@/components/ChatPanel";
import { FeatureEditor } from "@/components/FeatureEditor";
import { EstimationPanel } from "@/components/EstimationPanel";
import { TipsPanel } from "@/components/TipsPanel";

const Index = () => {
  return (
    <div className="h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-panel-border bg-gradient-panel px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">BA Requirements Studio</h1>
            <p className="text-sm text-muted-foreground">Collaborative feature file creation and analysis</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <div className="w-2 h-2 bg-estimate-low rounded-full"></div>
            <span>Ready</span>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Chat */}
        <div className="w-80 flex-shrink-0">
          <ChatPanel />
        </div>

        {/* Center Panel - Feature Editor */}
        <div className="flex-1 min-w-0">
          <FeatureEditor />
        </div>

        {/* Right Panel - Estimation & Tips */}
        <div className="w-80 flex-shrink-0 bg-panel border-l border-panel-border overflow-hidden">
          <div className="h-full flex flex-col">
            {/* Estimation Panel (Upper) */}
            <div className="p-4 border-b border-panel-border">
              <EstimationPanel />
            </div>

            {/* Tips Panel (Lower) */}
            <div className="flex-1 p-4 overflow-auto">
              <TipsPanel />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
