import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { CheckoutButton } from "@/components/checkout-button";
import { BillingClient } from "@/components/billing-client";
import { BillingSuccess } from "@/components/billing-success";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { isInTrial, isTrialExpired, getTrialDaysRemaining } from "@/lib/trial";

export default async function BillingPage() {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // Fetch subscription status directly from database
  await connectDB();
  const user = await User.findOne({ email: session.user?.email }).select('-password');
  
  let subscriptionData = null;
  if (user) {
    const inTrial = isInTrial(user.trialEndDate);
    const trialExpired = isTrialExpired(user.trialEndDate);
    const trialDaysRemaining = getTrialDaysRemaining(user.trialEndDate);
    
    let effectiveStatus = user.subscriptionStatus;
    if (user.subscriptionStatus === 'trial' && trialExpired) {
      effectiveStatus = 'expired';
    }
    
    subscriptionData = {
      subscriptionStatus: effectiveStatus,
      currentPlan: user.currentPlan,
      trialStartDate: user.trialStartDate,
      trialEndDate: user.trialEndDate,
      inTrial,
      trialExpired,
      trialDaysRemaining,
      lemonSqueezyCustomerId: user.lemonSqueezyCustomerId,
      lemonSqueezySubscriptionId: user.lemonSqueezySubscriptionId,
      lemonSqueezyVariantId: user.lemonSqueezyVariantId,
    };
  }

  const monthlyVariantId = process.env.LEMONSQUEEZY_MONTHLY_VARIANT_ID || '';
  const yearlyVariantId = process.env.LEMONSQUEEZY_YEARLY_VARIANT_ID || '';

  const getPlanPrice = (plan: string) => {
    switch (plan) {
      case 'monthly':
        return '$9.99/month';
      case 'yearly':
        return '$48/year';
      case 'trial':
        return 'Free (Trial)';
      default:
        return 'N/A';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600';
      case 'trial':
        return 'text-blue-600';
      case 'cancelled':
        return 'text-yellow-600';
      case 'expired':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing</h2>
        <p className="text-muted-foreground">
          Manage your subscription and billing information.
        </p>
      </div>

      <Suspense fallback={null}>
        <BillingSuccess />
      </Suspense>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              Your current subscription plan details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {subscriptionData ? (
              <>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Plan</span>
                    <span className="text-sm font-semibold capitalize">
                      {subscriptionData.currentPlan}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Price</span>
                    <span className="text-sm font-semibold">
                      {getPlanPrice(subscriptionData.currentPlan)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">Status</span>
                    <span className={`text-sm font-semibold ${getStatusColor(subscriptionData.subscriptionStatus)}`}>
                      {subscriptionData.subscriptionStatus.charAt(0).toUpperCase() + subscriptionData.subscriptionStatus.slice(1)}
                    </span>
                  </div>
                  {subscriptionData.inTrial && subscriptionData.trialDaysRemaining > 0 && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Trial Days Remaining</span>
                      <span className="text-sm font-semibold">
                        {subscriptionData.trialDaysRemaining} days
                      </span>
                    </div>
                  )}
                  {subscriptionData.trialEndDate && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm font-medium">Trial Ends</span>
                      <span className="text-sm text-muted-foreground">
                        {new Date(subscriptionData.trialEndDate).toLocaleDateString()}
                      </span>
                    </div>
                  )}
                </div>
                {subscriptionData.subscriptionStatus === 'active' && subscriptionData.lemonSqueezySubscriptionId && (
                  <BillingClient subscriptionId={subscriptionData.lemonSqueezySubscriptionId} />
                )}
                {(subscriptionData.subscriptionStatus === 'trial' || subscriptionData.subscriptionStatus === 'expired') && (
                  <div className="space-y-2">
                    {monthlyVariantId ? (
                      <CheckoutButton variantId={monthlyVariantId} className="w-full" variant="outline">
                        Upgrade to Monthly
                      </CheckoutButton>
                    ) : (
                      <Button className="w-full" variant="outline" disabled>
                        Monthly Plan Not Configured
                      </Button>
                    )}
                    {yearlyVariantId ? (
                      <CheckoutButton variantId={yearlyVariantId} className="w-full">
                        Upgrade to Yearly
                      </CheckoutButton>
                    ) : (
                      <Button className="w-full" disabled>
                        Yearly Plan Not Configured
                      </Button>
                    )}
                  </div>
                )}
              </>
            ) : (
              <div className="text-sm text-muted-foreground">
                Loading subscription information...
              </div>
            )}
          </CardContent>
        </Card>

      </div>

      <Card>
        <CardHeader>
          <CardTitle>Available Plans</CardTitle>
          <CardDescription>
            Choose a plan that works for you
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>Monthly</CardTitle>
                <CardDescription>$9.99/month</CardDescription>
              </CardHeader>
              <CardContent>
                {monthlyVariantId ? (
                  subscriptionData?.currentPlan === 'monthly' && subscriptionData?.subscriptionStatus === 'active' ? (
                    <Button className="w-full" variant="outline" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <CheckoutButton variantId={monthlyVariantId} className="w-full" variant="outline">
                      Select Monthly
                    </CheckoutButton>
                  )
                ) : (
                  <Button className="w-full" variant="outline" disabled>
                    Not Configured
                  </Button>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Yearly</CardTitle>
                <CardDescription>$48/year - Save 60%</CardDescription>
              </CardHeader>
              <CardContent>
                {yearlyVariantId ? (
                  subscriptionData?.currentPlan === 'yearly' && subscriptionData?.subscriptionStatus === 'active' ? (
                    <Button className="w-full" disabled>
                      Current Plan
                    </Button>
                  ) : (
                    <CheckoutButton variantId={yearlyVariantId} className="w-full">
                      Select Yearly
                    </CheckoutButton>
                  )
                ) : (
                  <Button className="w-full" disabled>
                    Not Configured
                  </Button>
                )}
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
