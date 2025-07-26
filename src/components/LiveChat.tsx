
import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { MessageCircle, X, Send, Bot, User, Maximize2, Minimize2, Headphones } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  message: string;
  sender: 'user' | 'support' | 'ai';
  timestamp: Date;
  name?: string;
  isTyping?: boolean;
  ticketId?: string;
}

interface TicketForm {
  subject: string;
  message: string;
  customerName: string;
  customerEmail: string;
}

const LiveChat = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      message: 'Hello! Welcome to SmartHub Computers. I\'m your AI assistant. How can I help you today? I can answer questions about our products, services, and help you with your shopping needs.',
      sender: 'ai',
      timestamp: new Date(),
      name: 'AI Assistant'
    }
  ]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [isOnline, setIsOnline] = useState(true);
  const [isTyping, setIsTyping] = useState(false);
  const [showTicketDialog, setShowTicketDialog] = useState(false);
  const [conversationHistory, setConversationHistory] = useState<Array<{role: 'user' | 'assistant', content: string}>>([]);
  const [activeTicketIds, setActiveTicketIds] = useState<string[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user } = useAuth();
  const [ticketForm, setTicketForm] = useState<TicketForm>({
    subject: '',
    message: '',
    customerName: user?.email?.split('@')[0] || '',
    customerEmail: user?.email || ''
  });
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (user) {
      setTicketForm(prev => ({
        ...prev,
        customerName: user.email?.split('@')[0] || '',
        customerEmail: user.email || ''
      }));
    }
  }, [user]);

  // Subscribe to support ticket messages for real-time admin replies
  useEffect(() => {
    if (!user || activeTicketIds.length === 0) return;

    const channel = supabase
      .channel('ticket-messages')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'ticket_messages',
          filter: `ticket_id=in.(${activeTicketIds.join(',')})`
        },
        (payload) => {
          const newMessage = payload.new;
          
          // Only show messages from admins (not from the user themselves)
          if (newMessage.sender_email !== user.email) {
            const supportMessage: ChatMessage = {
              id: newMessage.id,
              message: newMessage.message,
              sender: 'support',
              timestamp: new Date(newMessage.created_at),
              name: newMessage.sender_name,
              ticketId: newMessage.ticket_id
            };

            setMessages(prev => [...prev, supportMessage]);
            
            // Add a notification message
            setTimeout(() => {
              const notificationMessage: ChatMessage = {
                id: `notification-${Date.now()}`,
                message: "💬 You received a reply from our support team above. You can continue the conversation here or check your email.",
                sender: 'ai',
                timestamp: new Date(),
                name: 'AI Assistant'
              };
              setMessages(prev => [...prev, notificationMessage]);
            }, 500);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, activeTicketIds]);

  const callAIChatbot = async (message: string) => {
    try {
      const response = await supabase.functions.invoke('ai-chat', {
        body: {
          action: 'chat',
          message: message,
          conversationHistory: conversationHistory.slice(-10) // Keep last 10 messages for context
        }
      });

      if (response.error) {
        throw response.error;
      }

      return response.data;
    } catch (error) {
      console.error('AI chatbot error:', error);
      return {
        response: "I apologize, but I'm experiencing technical difficulties. Would you like me to create a support ticket so our human team can assist you?",
        needsHumanSupport: true
      };
    }
  };

  const handleSendMessage = async () => {
    if (!currentMessage.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      message: currentMessage,
      sender: 'user',
      timestamp: new Date(),
      name: user?.email || 'Guest'
    };

    setMessages(prev => [...prev, newMessage]);
    
    const messageToRespond = currentMessage;
    setCurrentMessage('');

    // Check if user has active tickets - if so, add message to ticket instead of AI chat
    if (activeTicketIds.length > 0) {
      try {
        // Add message to the most recent active ticket
        const latestTicketId = activeTicketIds[activeTicketIds.length - 1];
        
        const { error } = await supabase
          .from('ticket_messages')
          .insert({
            ticket_id: latestTicketId,
            sender_id: user?.id,
            sender_name: user?.email?.split('@')[0] || 'Customer',
            sender_email: user?.email || 'unknown@email.com',
            message: messageToRespond,
            is_internal: false
          });

        if (error) throw error;

        // Add a confirmation message
        const confirmationMessage: ChatMessage = {
          id: (Date.now() + 1).toString(),
          message: "💌 Your message has been added to your support ticket. Our team will see it and respond accordingly.",
          sender: 'ai',
          timestamp: new Date(),
          name: 'AI Assistant'
        };

        setMessages(prev => [...prev, confirmationMessage]);

        toast({
          title: "Message Sent",
          description: "Your message has been added to your support ticket.",
        });

      } catch (error) {
        console.error('Error sending message to ticket:', error);
        toast({
          title: "Error",
          description: "Failed to send message to support ticket.",
          variant: "destructive"
        });
      }
      return;
    }

    // Continue with AI chat if no active tickets
    setConversationHistory(prev => [...prev, { role: 'user', content: messageToRespond }]);
    setIsTyping(true);

    // Add typing indicator
    const typingMessage: ChatMessage = {
      id: 'typing',
      message: '',
      sender: 'ai',
      timestamp: new Date(),
      name: 'AI Assistant',
      isTyping: true
    };
    setMessages(prev => [...prev, typingMessage]);

    try {
      // Call AI chatbot
      const aiResponse = await callAIChatbot(messageToRespond);
      
      // Remove typing indicator
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      setIsTyping(false);

      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        message: aiResponse.response,
        sender: 'ai',
        timestamp: new Date(),
        name: 'AI Assistant'
      };

      setMessages(prev => [...prev, aiMessage]);
      setConversationHistory(prev => [...prev, { role: 'assistant', content: aiResponse.response }]);

      // If AI suggests human support, show ticket option
      if (aiResponse.needsHumanSupport) {
        setTimeout(() => {
          const ticketSuggestion: ChatMessage = {
            id: (Date.now() + 2).toString(),
            message: "Would you like me to create a support ticket for you to get help from our human support team?",
            sender: 'ai',
            timestamp: new Date(),
            name: 'AI Assistant'
          };
          setMessages(prev => [...prev, ticketSuggestion]);
        }, 1000);
      }

    } catch (error) {
      console.error('Error in chat:', error);
      setMessages(prev => prev.filter(msg => msg.id !== 'typing'));
      setIsTyping(false);
      
      toast({
        title: "Error",
        description: "Failed to send message. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleCreateTicket = async () => {
    if (!ticketForm.subject.trim() || !ticketForm.message.trim()) {
      toast({
        title: "Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await supabase.functions.invoke('ai-chat', {
        body: {
          action: 'create_ticket',
          customerName: ticketForm.customerName,
          customerEmail: ticketForm.customerEmail,
          subject: ticketForm.subject,
          message: ticketForm.message,
          userId: user?.id
        }
      });

      if (response.error) {
        throw response.error;
      }

      toast({
        title: "Support Ticket Created",
        description: response.data.message,
      });

      // Add confirmation message to chat
      const confirmationMessage: ChatMessage = {
        id: Date.now().toString(),
        message: `✅ Support ticket #${response.data.ticketId.slice(-8)} has been created successfully! Our team will respond within 24 hours to ${ticketForm.customerEmail}. Any replies from support will appear here in this chat.`,
        sender: 'ai',
        timestamp: new Date(),
        name: 'AI Assistant',
        ticketId: response.data.ticketId
      };

      setMessages(prev => [...prev, confirmationMessage]);
      
      // Add ticket ID to active tickets for real-time subscriptions
      setActiveTicketIds(prev => [...prev, response.data.ticketId]);
      
      setShowTicketDialog(false);
      
      // Reset form
      setTicketForm({
        subject: '',
        message: '',
        customerName: user?.email?.split('@')[0] || '',
        customerEmail: user?.email || ''
      });

    } catch (error) {
      console.error('Error creating ticket:', error);
      toast({
        title: "Error",
        description: "Failed to create support ticket. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const toggleExpanded = () => {
    setIsExpanded(!isExpanded);
  };

  // Dynamic sizing based on expanded state
  const chatWidth = isExpanded ? 'w-[90vw] max-w-4xl' : 'w-80 md:w-96';
  const chatHeight = isExpanded ? 'h-[80vh] max-h-[700px]' : 'h-96 md:h-[500px]';

  return (
    <>
      {/* Chat Toggle Button */}
      <div className="fixed bottom-6 right-6 z-50">
        {!isOpen && (
          <Button
            onClick={() => setIsOpen(true)}
            className="rounded-full w-14 h-14 shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
            size="icon"
          >
            <MessageCircle className="h-6 w-6" />
          </Button>
        )}
      </div>

      {/* Chat Window */}
      {isOpen && (
        <div className={`fixed ${isExpanded ? 'inset-4' : 'bottom-6 right-6'} z-50 ${isExpanded ? 'flex items-center justify-center' : ''}`}>
          <Card className={`${chatWidth} ${chatHeight} flex flex-col shadow-2xl ${isExpanded ? 'max-w-none' : ''}`}>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className="relative">
                      <Bot className="h-6 w-6 text-primary" />
                      <div className={`absolute -top-1 -right-1 w-3 h-3 rounded-full ${
                        isOnline ? 'bg-green-500' : 'bg-gray-400'
                      }`}></div>
                    </div>
                    <div>
                      <CardTitle className="text-lg">AI Support</CardTitle>
                      <Badge variant={isOnline ? "default" : "secondary"} className="text-xs">
                        {isOnline ? 'AI Online' : 'Offline'}
                      </Badge>
                    </div>
                  </div>
                <div className="flex items-center space-x-2">
                  <Dialog open={showTicketDialog} onOpenChange={setShowTicketDialog}>
                    <DialogTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <Headphones className="h-4 w-4" />
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Create Support Ticket</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium">Your Name</label>
                          <Input
                            value={ticketForm.customerName}
                            onChange={(e) => setTicketForm(prev => ({ ...prev, customerName: e.target.value }))}
                            placeholder="Enter your name"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Email Address</label>
                          <Input
                            type="email"
                            value={ticketForm.customerEmail}
                            onChange={(e) => setTicketForm(prev => ({ ...prev, customerEmail: e.target.value }))}
                            placeholder="Enter your email"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Subject</label>
                          <Input
                            value={ticketForm.subject}
                            onChange={(e) => setTicketForm(prev => ({ ...prev, subject: e.target.value }))}
                            placeholder="Brief description of your issue"
                          />
                        </div>
                        <div>
                          <label className="text-sm font-medium">Message</label>
                          <Textarea
                            value={ticketForm.message}
                            onChange={(e) => setTicketForm(prev => ({ ...prev, message: e.target.value }))}
                            placeholder="Describe your issue in detail"
                            rows={4}
                          />
                        </div>
                        <Button onClick={handleCreateTicket} className="w-full">
                          Create Support Ticket
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={toggleExpanded}
                    className="h-8 w-8"
                  >
                    {isExpanded ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsOpen(false)}
                    className="h-8 w-8"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 min-h-0">
              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${
                      message.sender === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-[85%] p-3 rounded-lg ${
                        message.sender === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted text-muted-foreground'
                      }`}
                    >
                      <div className="flex items-center space-x-2 mb-1">
                        {message.sender === 'user' ? (
                          <User className="h-3 w-3" />
                        ) : (
                          <Bot className="h-3 w-3" />
                        )}
                        <span className="text-xs font-medium">
                          {message.name || (message.sender === 'user' ? 'You' : message.sender === 'ai' ? 'AI Assistant' : 'Support')}
                        </span>
                      </div>
                      {message.isTyping ? (
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-current rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                      )}
                      <p className="text-xs opacity-70 mt-1">
                        {message.timestamp.toLocaleTimeString([], { 
                          hour: '2-digit', 
                          minute: '2-digit' 
                        })}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              {/* Message Input */}
              <div className="border-t p-4 bg-background">
                <div className="flex space-x-2">
                  <Input
                    value={currentMessage}
                    onChange={(e) => setCurrentMessage(e.target.value)}
                    onKeyPress={handleKeyPress}
                    placeholder="Type your message..."
                    className="flex-1"
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim()}
                    size="icon"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  AI-powered support • Need human help? Click the headphones icon above
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};

export default LiveChat;
