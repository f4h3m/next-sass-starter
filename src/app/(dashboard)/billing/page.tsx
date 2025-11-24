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

        <Card>
          <CardHeader>
            <CardTitle>Payment Method</CardTitle>
            <CardDescription>
              Manage your payment methods
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-muted rounded flex items-center justify-center">
                  <span className="text-xs font-semibold">••••</span>
                </div>
                <div>
                  <p className="text-sm font-medium">•••• •••• •••• 4242</p>
                  <p className="text-xs text-muted-foreground">Expires 12/25</p>
                </div>
              </div>
            </div>
            <Button variant="outline" className="w-full">
              Update Payment Method
            </Button>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>
            View your past invoices and payments
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">January 2024</p>
                <p className="text-xs text-muted-foreground">Invoice #INV-001</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">$9.99</p>
                <p className="text-xs text-green-600">Paid</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">December 2023</p>
                <p className="text-xs text-muted-foreground">Invoice #INV-002</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">$9.99</p>
                <p className="text-xs text-green-600">Paid</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <p className="text-sm font-medium">November 2023</p>
                <p className="text-xs text-muted-foreground">Invoice #INV-003</p>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">$9.99</p>
                <p className="text-xs text-green-600">Paid</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

