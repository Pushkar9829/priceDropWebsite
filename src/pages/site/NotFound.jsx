import { Compass } from 'lucide-react';
import { Button, EmptyState } from '../../components/ui';
import { useDocumentTitle } from '../../lib/hooks';

export default function NotFound() {
  useDocumentTitle('Page not found');
  return (
    <div className="container-page py-20">
      <EmptyState
        as="h1"
        icon={Compass}
        title="Page not found"
        description="The page you're looking for doesn't exist or has moved."
        action={<Button to="/">Back to home</Button>}
      />
    </div>
  );
}
