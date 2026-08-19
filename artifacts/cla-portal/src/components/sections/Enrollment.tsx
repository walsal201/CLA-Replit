import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Shield } from "lucide-react";

export function Enrollment() {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [enrolled, setEnrolled] = useState(false);

  const plans = [
    { id: "basic", name: "Basic Protection", price: "$29", limit: "1 Child", features: ["Standard GPS Bracelet", "24/7 Monitoring", "Local Alerts"] },
    { id: "family", name: "Family Shield", price: "$59", limit: "Up to 3 Children", features: ["Choice of Subdermal/Wearable", "24/7 Monitoring", "National Alerts", "Priority Drone Dispatch"], popular: true },
    { id: "elite", name: "Elite Institutional", price: "$99", limit: "Up to 30 Children", features: ["Full Technology Suite", "Dedicated AI Agent", "School Perimeter Integration", "Direct Law Enforcement Link"] },
  ];

  if (enrolled) {
    return (
      <section id="enrollment" className="py-16 px-4 border-b border-border bg-card/30">
        <div className="container mx-auto max-w-xl text-center space-y-6">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-green-500/20 text-green-500">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-bold uppercase tracking-tighter text-foreground">Enrollment Verified</h2>
          <p className="font-mono text-muted-foreground">Your protection network is now active.</p>
          <div className="p-6 bg-background border border-border rounded-sm">
            <p className="text-sm uppercase text-muted-foreground mb-2">Network ID</p>
            <p className="text-2xl font-mono font-bold tracking-widest text-primary">CLA-NET-{Math.floor(Math.random()*100000)}</p>
          </div>
          <Button onClick={() => setEnrolled(false)} variant="outline" className="uppercase font-mono mt-8">Return to Plans</Button>
        </div>
      </section>
    );
  }

  return (
    <section id="enrollment" className="py-16 px-4 border-b border-border bg-card/30">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold uppercase tracking-tighter text-foreground mb-4">Protection Plans</h2>
          <p className="text-muted-foreground font-mono max-w-2xl mx-auto">Secure your family or institution with military-grade monitoring.</p>
        </div>

        {!selectedPlan ? (
          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {plans.map((plan) => (
              <Card key={plan.id} className={`bg-background border-border relative flex flex-col ${plan.popular ? 'border-primary shadow-[0_0_15px_rgba(204,0,0,0.2)]' : ''}`}>
                {plan.popular && (
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-primary text-primary-foreground text-xs font-bold uppercase tracking-widest py-1 px-3 rounded-full">
                    Recommended
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="uppercase text-xl">{plan.name}</CardTitle>
                  <div className="mt-4">
                    <span className="text-4xl font-black text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground font-mono">/mo</span>
                  </div>
                  <CardDescription className="uppercase tracking-widest text-primary font-bold mt-2">{plan.limit}</CardDescription>
                </CardHeader>
                <CardContent className="flex-1 pt-6">
                  <ul className="space-y-4 font-mono text-sm text-muted-foreground">
                    {plan.features.map((f, i) => (
                      <li key={i} className="flex items-start gap-3">
                        <Shield className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Button onClick={() => setSelectedPlan(plan.id)} className="w-full uppercase tracking-widest" variant={plan.popular ? "default" : "outline"}>
                    Select Plan
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="max-w-xl mx-auto border-border bg-background">
            <CardHeader className="border-b border-border bg-muted/30">
              <CardTitle className="uppercase text-xl flex items-center gap-2">
                <Shield className="w-6 h-6 text-primary" />
                Secure Checkout
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-6">
              <div className="p-4 bg-muted border border-border rounded-sm flex justify-between items-center font-mono">
                <div>
                  <div className="uppercase font-bold text-foreground">{plans.find(p => p.id === selectedPlan)?.name}</div>
                  <div className="text-xs text-muted-foreground mt-1">Billed monthly</div>
                </div>
                <div className="text-xl font-bold">{plans.find(p => p.id === selectedPlan)?.price}</div>
              </div>

              <div className="space-y-4 font-mono">
                <div>
                  <label className="text-xs uppercase text-muted-foreground block mb-2">Cardholder Name</label>
                  <input type="text" className="w-full bg-muted border border-border p-2 rounded-sm text-foreground focus:outline-none focus:border-primary" placeholder="J. DOE" />
                </div>
                <div>
                  <label className="text-xs uppercase text-muted-foreground block mb-2">Card Number</label>
                  <input type="text" className="w-full bg-muted border border-border p-2 rounded-sm text-foreground focus:outline-none focus:border-primary" placeholder="XXXX XXXX XXXX XXXX" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs uppercase text-muted-foreground block mb-2">Expiry</label>
                    <input type="text" className="w-full bg-muted border border-border p-2 rounded-sm text-foreground focus:outline-none focus:border-primary" placeholder="MM/YY" />
                  </div>
                  <div>
                    <label className="text-xs uppercase text-muted-foreground block mb-2">CVC</label>
                    <input type="text" className="w-full bg-muted border border-border p-2 rounded-sm text-foreground focus:outline-none focus:border-primary" placeholder="XXX" />
                  </div>
                </div>
              </div>
            </CardContent>
            <CardFooter className="p-6 border-t border-border flex justify-between bg-muted/10 gap-4">
              <Button onClick={() => setSelectedPlan(null)} variant="ghost" className="uppercase font-mono">Back</Button>
              <Button onClick={() => setEnrolled(true)} className="uppercase tracking-widest px-8">Process Payment</Button>
            </CardFooter>
          </Card>
        )}
      </div>
    </section>
  );
}
