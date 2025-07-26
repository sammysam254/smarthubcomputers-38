import { useState, useEffect } from 'react';
import { useAdmin, SupportTicket } from '@/hooks/useAdmin';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { HeadphonesIcon } from 'lucide-react';
import { toast } from 'sonner';

const SupportTicketsManager = () => {
  const { fetchSupportTickets, updateTicketStatus } = useAdmin();
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadTickets();
  }, []);

  const loadTickets = async () => {
    try {
      setLoading(true);
      const data = await fetchSupportTickets();
      setTickets(data);
    } catch (error) {
      console.error('Error loading support tickets:', error);
      toast.error('Failed to load support tickets');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (ticketId: string, status: string) => {
    try {
      await updateTicketStatus(ticketId, status);
      toast.success('Ticket status updated successfully');
      loadTickets();
    } catch (error) {
      console.error('Error updating ticket status:', error);
      toast.error('Failed to update ticket status');
    }
  };

  if (loading) {
    return <div className="text-center py-8">Loading support tickets...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold flex items-center">
          <HeadphonesIcon className="h-5 w-5 mr-2 text-purple-500" />
          Support Tickets ({tickets.length})
        </h3>
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Subject</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Priority</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {tickets.map((ticket) => (
              <TableRow key={ticket.id}>
                <TableCell>
                  <div className="font-medium">{ticket.subject}</div>
                </TableCell>
                <TableCell>
                  <div className="max-w-md truncate">
                    {ticket.description}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      ticket.priority === 'high' ? 'destructive' :
                      ticket.priority === 'medium' ? 'default' :
                      'secondary'
                    }
                  >
                    {ticket.priority || 'medium'}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge 
                    variant={
                      ticket.status === 'closed' ? 'secondary' :
                      ticket.status === 'in_progress' ? 'default' :
                      'outline'
                    }
                  >
                    {ticket.status || 'open'}
                  </Badge>
                </TableCell>
                <TableCell>
                  {new Date(ticket.created_at).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <Select
                    value={ticket.status || 'open'}
                    onValueChange={(value) => handleStatusUpdate(ticket.id, value)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="open">Open</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {tickets.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          No support tickets found.
        </div>
      )}
    </div>
  );
};

export default SupportTicketsManager;