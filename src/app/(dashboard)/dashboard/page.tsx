import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { isInTrial, getTrialDaysRemaining } from "@/lib/trial";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  let subscriptionInfo = null;
  if (session?.user?.email) {
    await connectDB();
    const user = await User.findOne({ email: session.user.email }).select('-password');
    
    if (user) {
      const inTrial = isInTrial(user.trialEndDate);
      const trialDaysRemaining = getTrialDaysRemaining(user.trialEndDate);
      
      subscriptionInfo = {
        status: user.subscriptionStatus,
        plan: user.currentPlan,
        inTrial,
        trialDaysRemaining,
      };
    }
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
        <p className="text-muted-foreground">
          Here's what's happening with your account today.
        </p>
      </div>

      {subscriptionInfo?.inTrial && subscriptionInfo.trialDaysRemaining > 0 && (
        <Card className="border-blue-200 bg-blue-50 dark:bg-blue-950 dark:border-blue-800">
          <CardHeader>
            <CardTitle className="text-lg">Free Trial Active</CardTitle>
            <CardDescription>
              You have {subscriptionInfo.trialDaysRemaining} day{subscriptionInfo.trialDaysRemaining !== 1 ? 's' : ''} remaining in your trial.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/billing">Upgrade Now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      {subscriptionInfo?.status === 'expired' && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950 dark:border-red-800">
          <CardHeader>
            <CardTitle className="text-lg">Trial Expired</CardTitle>
            <CardDescription>
              Your trial has ended. Subscribe to continue using the service.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <Link href="/billing">Subscribe Now</Link>
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Dashboard</CardTitle>
          <CardDescription>
            Welcome, {session?.user?.email}!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Subscription Status:</p>
            <p className="text-sm font-medium capitalize">
              {subscriptionInfo?.status || 'Unknown'} - {subscriptionInfo?.plan || 'No plan'}
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            This is a protected page with sidebar navigation.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
