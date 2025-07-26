-- Enable real-time updates for support ticket messages
ALTER TABLE public.support_ticket_messages REPLICA IDENTITY FULL;

-- Add table to real-time publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.support_ticket_messages;