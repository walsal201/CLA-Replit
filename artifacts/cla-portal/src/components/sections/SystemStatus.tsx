import { useAiMaintenance } from "@workspace/api-client-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Server, Wifi, Bot, Database, Locate, Wrench } from "lucide-react";
import { useState } from "react";

export function SystemStatus() {
  const [report, setReport] = useState<string | null>(null);
  const maintenanceMutation = useAiMaintenance();

  const systems = [
    { name: "GPS Network", icon: Locate, status: "99%", color: "text-green-500" },
    { name: "AI Core", icon: Server, status: "Online", color: "text-green-500" },
    { name: "Drone Fleet", icon: Wifi, status: "100%", color: "text-green-500" },
    { name: "Communications", icon: Wifi, status: "98%", color: "text-green-500" },
    { name: "Robot Units", icon: Bot, status: "72% (Maint)", color: "text-yellow-500" },
    { name: "Data Vault", icon: Database, status: "100%", color: "text-green-500" },
  ];

  const runDiagnostic = () => {
    maintenanceMutation.mutate(
      { data: { systems: ["Robot Units", "GPS Network"] } },
      { onSuccess: (data) => setReport(data.text) }
    );
  };

  return (
    <section id="status" className="py-16 px-4 bg-background">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold uppercase tracking-tighter text-foreground mb-2">System Infrastructure</h2>
            <p className="text-muted-foreground font-mono">Live telemetry from operational divisions.</p>
          </div>
          <Button 
            onClick={runDiagnostic} 
            disabled={maintenanceMutation.isPending}
            variant="outline" 
            className="uppercase font-mono tracking-widest border-primary text-primary hover:bg-primary hover:text-primary-foreground"
          >
            <Wrench className="w-4 h-4 mr-2" />
            {maintenanceMutation.isPending ? "Running Diagnostic..." : "Generate AI Maintenance Report"}
          </Button>
        </div>

        {report && (
          <div className="mb-8 p-6 bg-muted/30 border border-primary/30 rounded-sm font-mono text-sm leading-relaxed text-foreground">
            <h4 className="uppercase font-bold text-primary mb-2 flex items-center gap-2">
              <Server className="w-4 h-4" /> Diagnostic Output
            </h4>
            {report}
            <div className="mt-4 text-right">
              <Button size="sm" variant="ghost" onClick={() => setReport(null)} className="uppercase text-xs">Dismiss</Button>
            </div>
          </div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {systems.map((sys, i) => (
            <Card key={i} className="bg-card border-border rounded-sm">
              <CardContent className="p-4 flex flex-col items-center text-center gap-3">
                <sys.icon className={`w-8 h-8 ${sys.color}`} />
                <div>
                  <div className="text-xs text-muted-foreground uppercase font-mono tracking-widest">{sys.name}</div>
                  <div className={`font-bold font-mono mt-1 ${sys.color}`}>{sys.status}</div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
