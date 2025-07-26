-- Create cron job to send notifications 4 times daily
SELECT cron.schedule(
  'send-product-notifications',
  '0 9,13,17,21 * * *', -- 9 AM, 1 PM, 5 PM, 9 PM daily
  $$
  SELECT
    net.http_post(
        url:='https://axihtddcqfotuyelfdqj.supabase.co/functions/v1/send-notifications',
        headers:='{"Content-Type": "application/json", "Authorization": "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImF4aWh0ZGRjcWZvdHV5ZWxmZHFqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NzY5MzYsImV4cCI6MjA2ODE1MjkzNn0.otx4djeBd8E7cJ7NOqMI5xTsN9Ll5Q8U13v7Fv3WQNM"}'::jsonb,
        body:='{"automated": true}'::jsonb
    ) as request_id;
  $$
);