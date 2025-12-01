import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { getEffectiveSubscriptionStatus } from "@/lib/subscription";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    redirect("/");
  }

  await connectDB();
  const user = await User.findOne({ email: session.user.email }).select('-password');
  
  if (!user) {
    redirect("/");
  }

  // Check if subscription is expired and redirect to billing
  const effectiveStatus = getEffectiveSubscriptionStatus(
    user.subscriptionStatus,
    user.subscriptionEndDate,
    user.trialEndDate,
    user.subscriptionRenewalDate
  );

  if (effectiveStatus === 'expired') {
    redirect("/billing?expired=true");
  }

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Welcome back!</h2>
        <p className="text-muted-foreground">
          Here&apos;s what&apos;s happening with your account today.
        </p>
      </div>
    </div>
  );
}
