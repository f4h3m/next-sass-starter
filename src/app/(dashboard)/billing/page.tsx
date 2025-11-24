import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function BillingPage() {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Billing</h2>
        <p className="text-muted-foreground">
          Manage your subscription and billing information.
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Current Plan</CardTitle>
            <CardDescription>
              Your current subscription plan details
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Plan</span>
                <span className="text-sm font-semibold">Monthly</span>
              </div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Price</span>
                <span className="text-sm font-semibold">$9.99/month</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Status</span>
                <span className="text-sm font-semibold text-green-600">Active</span>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Change Plan
            </Button>
          </CardContent>
        </Card>
      </div>
    <div className="grid gap-4 md:grid-cols-3 mt-8">
      <Card>
        <CardHeader>
          <CardTitle>Free</CardTitle>
          <CardDescription>
            Basic features for individuals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-3xl font-bold">$0</span>
            <span className="text-muted-foreground ml-2 text-sm">/month</span>
          </div>
          <ul className="text-sm space-y-1">
            <li>✓ 1 Project</li>
            <li>✓ Community Support</li>
            <li className="text-muted-foreground">⨉ No team members</li>
          </ul>
          <Button className="w-full" variant="outline">
            Select
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Pro</CardTitle>
          <CardDescription>
            Advanced features for professionals
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-3xl font-bold">$9.99</span>
            <span className="text-muted-foreground ml-2 text-sm">/month</span>
          </div>
          <ul className="text-sm space-y-1">
            <li>✓ 10 Projects</li>
            <li>✓ Priority Support</li>
            <li>✓ Up to 5 team members</li>
          </ul>
          <Button className="w-full">
            Select
          </Button>
        </CardContent>
      </Card>
      <Card>
        <CardHeader>
          <CardTitle>Enterprise</CardTitle>
          <CardDescription>
            Custom solutions for teams
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <span className="text-3xl font-bold">Contact us</span>
          </div>
          <ul className="text-sm space-y-1">
            <li>✓ Unlimited Projects</li>
            <li>✓ Dedicated Support</li>
            <li>✓ Unlimited team members</li>
            <li>✓ Custom Integrations</li>
          </ul>
          <Button className="w-full" variant="outline">
            Contact Sales
          </Button>
        </CardContent>
      </Card>
    </div>

    </div>
  );
}

