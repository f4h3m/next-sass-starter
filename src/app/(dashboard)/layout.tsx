import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { DashboardWrapper } from "@/components/dashboard-wrapper";
import connectDB from "@/lib/db";
import User from "@/models/User";
import { updateSubscriptionStatusIfExpired } from "@/lib/subscription";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect("/");
  }

  // Check and update subscription status if expired (but don't redirect here to avoid loops)
  await connectDB();
  const user = await User.findOne({ email: session.user?.email }).select('-password');
  
  if (user) {
    // Auto-update subscription status if expired
    await updateSubscriptionStatusIfExpired(user._id.toString());
  }

  return <DashboardWrapper>{children}</DashboardWrapper>;
}

