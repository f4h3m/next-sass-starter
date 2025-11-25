'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

interface BillingClientProps {
  subscriptionId: string;
}

export function BillingClient({ subscriptionId }: BillingClientProps) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel your subscription?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/subscription/cancel', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ subscriptionId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to cancel subscription');
      }

      toast.success('Subscription cancelled successfully');
      router.refresh();
    } catch (error) {
      console.error('Cancel error:', error);
      toast.error(error instanceof Error ? error.message : 'Failed to cancel subscription');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      onClick={handleCancel}
      disabled={loading}
      variant="outline"
      className="w-full"
    >
      {loading ? 'Cancelling...' : 'Cancel Subscription'}
    </Button>
  );
}

