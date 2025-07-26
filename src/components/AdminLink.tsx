
import { useAuth } from '@/hooks/useAuth';
import { useAdmin } from '@/hooks/useAdmin';
import { Link } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { Button } from '@/components/ui/button';

const AdminLink = () => {
  const { user } = useAuth();
  const { isAdmin, loading } = useAdmin();

  // Only show admin link if user exists, is not loading, and is actually an admin
  if (!user || loading || !isAdmin) {
    return null;
  }

  return (
    <Link to="/admin">
      <Button variant="outline" size="sm" className="flex items-center space-x-2">
        <Settings className="h-4 w-4" />
        <span>Admin Panel</span>
      </Button>
    </Link>
  );
};

export default AdminLink;
