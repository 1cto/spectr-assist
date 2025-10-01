import { useState, useRef, useEffect, forwardRef, useImperativeHandle } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

interface Message {
  id: string;
  content: string;
  sender: "user" | "assistant";
  timestamp: Date;
  isTyping?: boolean;
}

interface ChatPanelProps {
  featureContent: string;
  onFeatureChange: (content: string) => void;
  sessionId: string;
}

export interface ChatPanelRef {
  sendMessage: (message: string) => void;
}

export const ChatPanel = forwardRef<ChatPanelRef, ChatPanelProps>(({ featureContent, onFeatureChange, sessionId }, ref) => {
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [waitingForResponse, setWaitingForResponse] = useState(false);
  const waitingRef = useRef(false);
  const loadingChannelRef = useRef<any>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history from database
  useEffect(() => {
    const loadChatHistory = async () => {
      if (!user?.id) {
        // If no user, show default welcome message
        setMessages([{
          id: "1",
          content: "Hello! I'm here to help you create better feature files. What requirement would you like to work on?",
          sender: "assistant",
          timestamp: new Date(),
        }]);
        setIsLoadingHistory(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('n8n_chat_histories')
          .select('*')
          .eq('session_id', sessionId)
          .eq('user_id', user.id)
          .order('id', { ascending: true });

        if (error) {
          console.error('Error loading chat history:', error);
          // Show default message on error
          setMessages([{
            id: "1",
            content: "Hello! I'm here to help you create better feature files. What requirement would you like to work on?",
            sender: "assistant",
            timestamp: new Date(),
          }]);
        } else if (data && data.length > 0) {
          // Convert database messages to Message format
          const loadedMessages: Message[] = data.map(record => {
            const msg = record.message as any;
            return {
              id: record.id.toString(),
              content: msg.content || msg.text || '',
              sender: msg.role === 'user' ? 'user' : 'assistant',
              timestamp: new Date(msg.timestamp || record.id),
            };
          });
          setMessages(loadedMessages);
        } else {
          // No history, show welcome message
          setMessages([{
            id: "1",
            content: "Hello! I'm here to help you create better feature files. What requirement would you like to work on?",
            sender: "assistant",
            timestamp: new Date(),
          }]);
        }
      } catch (err) {
        console.error('Unexpected error loading chat history:', err);
        setMessages([{
          id: "1",
          content: "Hello! I'm here to help you create better feature files. What requirement would you like to work on?",
          sender: "assistant",
          timestamp: new Date(),
        }]);
      } finally {
        setIsLoadingHistory(false);
      }
    };

    loadChatHistory();
  }, [user?.id, sessionId]);

  // Setup realtime channels for loading-state and metrics to coordinate spinners and typing
  useEffect(() => {
    // Loading-state channel (used for spinners and sync only)
    const loadingCh = supabase
      .channel(`loading-state-${sessionId}`, { config: { broadcast: { self: true }}})
      .on('broadcast', { event: 'metrics-received' }, () => {
        console.log('ChatPanel: metrics-received via loading-state (coordination only)');
        // Only used for coordination, no response handling here
      })
      .subscribe();
    loadingChannelRef.current = loadingCh;

    // No metrics channel is needed for rendering chat responses now
    return () => {
      if (loadingCh) supabase.removeChannel(loadingCh);
    };
  }, []);

  // Simulate typing effect
  const simulateTyping = (finalMessage: string, callback: () => void) => {
    setIsTyping(true);
    
    // Add typing indicator message
    const typingMessage: Message = {
      id: `typing-${Date.now()}`,
      content: "",
      sender: "assistant",
      timestamp: new Date(),
      isTyping: true,
    };
    
    setMessages(prev => [...prev, typingMessage]);
    
    // Simulate typing delay (2-3 seconds)
    typingTimeoutRef.current = setTimeout(() => {
      // Remove typing indicator and add real message
      setMessages(prev => {
        const withoutTyping = prev.filter(msg => !msg.isTyping);
        return [...withoutTyping, {
          id: Date.now().toString(),
          content: finalMessage,
          sender: "assistant" as const,
          timestamp: new Date(),
        }];
      });
      setIsTyping(false);
      waitingRef.current = false;
      callback();
    }, 2500);
  };

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
          sessionId: sessionId,
          chatInput,
          feature: featureContent,
          userId: user?.id,
          system: "lovable"
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

  // Save message to database
  const saveMessageToDb = async (message: Message) => {
    if (!user?.id) return;

    try {
      await supabase
        .from('n8n_chat_histories')
        .insert({
          session_id: sessionId,
          user_id: user.id,
          message: {
            role: message.sender,
            content: message.content,
            timestamp: message.timestamp.toISOString(),
          }
        });
    } catch (error) {
      console.error('Error saving message to database:', error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || waitingForResponse) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      content: input,
      sender: "user",
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setWaitingForResponse(true);
    waitingRef.current = true;

    // Save user message to database
    await saveMessageToDb(userMessage);

    console.log('Starting new message flow - signaling waiting-for-feature');
    
    // Signal that we're waiting for feature update
    // Signal to Feature File to start spinner (use persistent channel and a temp fail-safe)
    loadingChannelRef.current?.send({ type: 'broadcast', event: 'waiting-for-feature' });
    const tempLoadingCh = supabase.channel(`loading-state-${sessionId}`, { config: { broadcast: { self: true }}});
    tempLoadingCh.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        tempLoadingCh.send({ type: 'broadcast', event: 'waiting-for-feature' });
        setTimeout(() => supabase.removeChannel(tempLoadingCh), 500);
      }
    });

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
        // Signal feature received
        loadingChannelRef.current?.send({
          type: 'broadcast',
          event: 'feature-received',
        });
      }
      
      // Immediately render assistant response (no waiting for metrics)
      simulateTyping(chatContent, async () => {
        setWaitingForResponse(false);
        // Save assistant message to database after typing animation
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          content: chatContent,
          sender: "assistant",
          timestamp: new Date(),
        };
        await saveMessageToDb(assistantMessage);
      });
      waitingRef.current = false;
      
    } catch (error) {
      // Add error message if webhook fails
      const errorResponse: Message = {
        id: (Date.now() + 1000).toString(),
        content: "Sorry, I'm having trouble connecting to the service right now. Please try again later.",
        sender: "assistant",
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorResponse]);
      setWaitingForResponse(false);
      waitingRef.current = false;
      
      // Signal that we're no longer waiting for any loading states
      loadingChannelRef.current?.send({
        type: 'broadcast',
        event: 'feature-received',
      });
      loadingChannelRef.current?.send({
        type: 'broadcast',
        event: 'metrics-received',
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Expose sendMessage function through ref
  useImperativeHandle(ref, () => ({
    sendMessage: (message: string) => {
      // Create a user message directly and trigger the send flow
      const userMessage: Message = {
        id: Date.now().toString(),
        content: message,
        sender: "user",
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, userMessage]);
      setWaitingForResponse(true);
      waitingRef.current = true;

      console.log('Starting new message flow - signaling waiting-for-feature');
      
      // Signal that we're waiting for feature update
      loadingChannelRef.current?.send({ type: 'broadcast', event: 'waiting-for-feature' });
      const tempLoadingCh = supabase.channel(`loading-state-${sessionId}`, { config: { broadcast: { self: true }}});
      tempLoadingCh.subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          tempLoadingCh.send({ type: 'broadcast', event: 'waiting-for-feature' });
          setTimeout(() => supabase.removeChannel(tempLoadingCh), 500);
        }
      });

      // Send the message to webhook
      sendToWebhook(message).then((webhookResponse) => {
        // Use output field for chat response
        const chatContent = (webhookResponse && typeof webhookResponse === 'object' && webhookResponse.output) 
          ? webhookResponse.output 
          : (typeof webhookResponse === 'string' ? webhookResponse : "I received your message and processed it successfully.");
        
        // Update feature content if provided
        if (webhookResponse && typeof webhookResponse === 'object' && webhookResponse.feature) {
          onFeatureChange(webhookResponse.feature);
          // Signal feature received
          loadingChannelRef.current?.send({
            type: 'broadcast',
            event: 'feature-received',
          });
        }
        
        // Immediately render assistant response (no waiting for metrics)
        simulateTyping(chatContent, async () => {
          setWaitingForResponse(false);
          // Save assistant message to database after typing animation
          const assistantMessage: Message = {
            id: (Date.now() + 1).toString(),
            content: chatContent,
            sender: "assistant",
            timestamp: new Date(),
          };
          await saveMessageToDb(assistantMessage);
        });
        waitingRef.current = false;
        
      }).catch((error) => {
        // Add error message if webhook fails
        const errorResponse: Message = {
          id: (Date.now() + 1000).toString(),
          content: "Sorry, I'm having trouble connecting to the service right now. Please try again later.",
          sender: "assistant",
          timestamp: new Date(),
        };
        setMessages(prev => [...prev, errorResponse]);
        setWaitingForResponse(false);
        waitingRef.current = false;
        
        // Signal that we're no longer waiting for any loading states
        loadingChannelRef.current?.send({
          type: 'broadcast',
          event: 'feature-received',
        });
        loadingChannelRef.current?.send({
          type: 'broadcast',
          event: 'metrics-received',
        });
      });
    }
  }));

  // Clean up timeouts on unmount
  useEffect(() => {
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: 'white' }}>
      <div className="p-4 bg-gradient-panel">
        <h2 className="font-semibold text-foreground">Requirements Chat</h2>
        <p className="text-sm text-muted-foreground">Discuss and refine your requirements</p>
      </div>

      <ScrollArea className="flex-1" style={{ backgroundColor: '#F4F2EC' }}>
        <div className="p-4 space-y-4">
          {isLoadingHistory ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span className="ml-2 text-sm text-muted-foreground">Loading chat history...</span>
            </div>
          ) : (
            messages.map((message) => (
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
                    ? "text-black"
                    : ""
                }`}
                style={message.sender === "user" ? { backgroundColor: '#E9E7E1' } : { backgroundColor: '#F4F2EC' }}
              >
                {message.isTyping ? (
                  <div className="flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span className="text-sm text-muted-foreground">Typing...</span>
                  </div>
                ) : (
                  <>
                    <p className="text-sm">{message.content}</p>
                    <span className="text-xs opacity-70 mt-1 block">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                )}
              </div>
              {message.sender === "user" && (
                <div className="flex-shrink-0 w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  <User className="w-4 h-4 text-secondary-foreground" />
                </div>
              )}
            </div>
            ))
          )}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <div className="p-4" style={{ backgroundColor: '#F4F2EC' }}>
        <div className="relative shadow-lg rounded-md">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyPress}
            placeholder="Ask about requirements, scenarios, or acceptance criteria..."
            className="flex-1 min-h-[72px] resize-none pr-12 bg-white"
            rows={3}
          />
          <Button 
            onClick={handleSend} 
            size="icon" 
            className="absolute right-2 bottom-2 h-10 w-10"
            disabled={waitingForResponse || isTyping}
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
});
