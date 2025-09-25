import { useState, useRef, useEffect } from "react";
import { Send, Bot, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
}

interface ChatPanelProps {
  featureContent: string;
  onFeatureChange: (content: string) => void;
}

export function ChatPanel({ featureContent, onFeatureChange }: ChatPanelProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      content: "Hello! I'm here to help you create better feature files. What requirement would you like to work on?",
      sender: "assistant",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const sessionId = useRef(`session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendToWebhook = async (chatInput: string): Promise<any> => {
    try {
      const credentials = btoa('n8n_BA_Assistant:wqB0*r@Cxpoo2tTt');
      
      const response = await fetch('https://n8n.1service.live/webhook/bb24ae75-b8ce-4395-8f43-6d7a8dd52b71', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify({
          sessionId: sessionId.current,
          chatInput,
          feature: featureContent
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const responseText = await response.text();
      try {
        const jsonResponse = JSON.parse(responseText);
        return jsonResponse;
      } catch {
        // If not JSON, return as text
        return { output: responseText || "I received your message and processed it successfully." };
      }
    } catch (error) {
      console.error('Failed to send to webhook:', error);
      toast({
        title: "Failed to send",
        description: "There was an error sending your message to the webhook.",
        variant: "destructive",
      });
      throw error;
    }
  };

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");

    try {
      // Send to webhook and wait for response
      const webhookResponse = await sendToWebhook(input);
      
      // Use output field for chat response
      const chatContent = (webhookResponse && typeof webhookResponse === 'object' && webhookResponse.output) 
        ? webhookResponse.output 
        : (typeof webhookResponse === 'string' ? webhookResponse : "I received your message and processed it successfully.");
      
      // Update feature content if provided
      if (webhookResponse && typeof webhookResponse === 'object' && webhookResponse.feature) {
        onFeatureChange(webhookResponse.feature);
      }
      
      // Add AI response with actual webhook response
      const aiResponse: Message = {
        id: (Date.now() + 1000).toString(),
        content: chatContent,
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, aiResponse]);
    } catch (error) {
      // Add error message if webhook fails
      const errorResponse: Message = {
        id: (Date.now() + 1000).toString(),
        content: "Sorry, I'm having trouble connecting to the service right now. Please try again later.",
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-chat border-r border-panel-border">
      <div className="p-4 border-b border-panel-border bg-gradient-panel">
        <h2 className="font-semibold text-foreground">Requirements Chat</h2>
        <p className="text-sm text-muted-foreground">Discuss and refine your requirements</p>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-3 ${message.sender === "user" ? "justify-end" : "justify-start"}`}
            >
              {message.sender === "assistant" && (
                <div className="flex-shrink-0 w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-primary-foreground" />
                </div>
              )}
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.sender === "user"
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border"
                }`}
              >
                <p className="text-sm">{message.content}</p>
                <span className="text-xs opacity-70 mt-1 block">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
              {message.sender === "user" && (
                <div className="flex-shrink-0 w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </div>
              )}
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4 border-t border-panel-border bg-gradient-panel">
        <div className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask about requirements, scenarios, or acceptance criteria..."
            className="flex-1"
          />
          <Button onClick={handleSend} size="icon" className="shrink-0">
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
