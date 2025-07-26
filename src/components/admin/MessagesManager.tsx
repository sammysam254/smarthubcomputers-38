import { useState, useEffect } from 'react';
import { TicketMessage } from '@/hooks/useAdmin';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const MessagesManager = () => {
  const [messages, setMessages] = useState<TicketMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, []);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('ticket_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setMessages(data || []);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    } finally {
      setLoading(false);
    }
  };

  const deleteMessage = async (id: string) => {
    if (confirm('Are you sure you want to delete this message?')) {
      try {
        const { error } = await supabase
          .from('ticket_messages')
          .delete()
          .eq('id', id);

        if (error) throw error;
        toast.success('Message deleted successfully');
        loadMessages();
      } catch (error) {
        console.error('Error deleting message:', error);
        toast.error('Failed to delete message');
      }
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading messages...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center">
          <MessageSquare className="h-5 w-5 mr-2 text-blue-500" />
          Support Messages ({messages.length})
        </h3>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Sender</TableHead>
              <TableHead>Message</TableHead>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {messages.map((message) => (
              <TableRow key={message.id}>
                <TableCell>
                  <div>
                    <div className="font-medium">{message.sender_name}</div>
                    <div className="text-sm text-muted-foreground">{message.sender_email}</div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="max-w-md truncate">
                    {message.message}
                  </div>
                </TableCell>
                <TableCell>
                  {new Date(message.created_at).toLocaleString()}
                </TableCell>
                <TableCell>
                  <Badge variant={message.is_internal ? 'secondary' : 'default'}>
                    {message.is_internal ? 'Internal' : 'Customer'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => deleteMessage(message.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {messages.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No messages found.
        </div>
      )}
    </div>
  );
};

export default MessagesManager;