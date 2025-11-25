'use client';

import { useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import { toast } from 'sonner';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CheckCircle2 } from 'lucide-react';

export function BillingSuccess() {
  const searchParams = useSearchParams();
  const success = searchParams.get('success');

  useEffect(() => {
    if (success === 'true') {
      toast.success('Subscription activated successfully!', {
        description: 'Your subscription is now active. You can manage it from this page.',
        duration: 5000,
      });
    }
  }, [success]);

  if (success !== 'true') {
    return null;
  }

  return (
    <Card className="border-green-200 bg-green-50 dark:bg-green-950 dark:border-green-800 mb-4">
      <CardHeader>
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
          <CardTitle className="text-lg text-green-900 dark:text-green-100">
            Payment Successful!
          </CardTitle>
        </div>
        <CardDescription className="text-green-800 dark:text-green-200">
          Your subscription has been activated. You now have full access to all features.
        </CardDescription>
      </CardHeader>
    </Card>
  );
}

