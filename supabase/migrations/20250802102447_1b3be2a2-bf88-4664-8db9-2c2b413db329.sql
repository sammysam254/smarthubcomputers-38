-- Enable pg_cron extension for scheduled tasks
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Create a cron job to send notifications every 6 hours
SELECT cron.schedule(
  'send-scheduled-notifications',
  '0 */6 * * *', -- Every 6 hours
  $$
  SELECT
    net.http_post(
        url:='https://axihtddcqfotuyelfdqj.supabase.co/functions/v1/scheduled-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4aWh0ZGRjcWZvdHV5ZWxmZHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NzY5MzYsImV4cCI6MjA2ODE1MjkzNn0.otx4djeBd8E7cJ7NOqMI5xTsN9Ll5Q8U13v7Fv3WQNM"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);