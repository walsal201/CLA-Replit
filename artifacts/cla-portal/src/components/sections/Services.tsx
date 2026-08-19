import { Satellite, Bot, School, Hospital, BatteryCharging, ShieldCheck } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Services() {
  const services = [
    { title: "GPS Tracking", icon: Satellite, desc: "Real-time global positioning system for instant location verification." },
    { title: "Robotic Surveillance", icon: Bot, desc: "Autonomous ground and aerial units for search in hazardous environments." },
    { title: "School Monitoring", icon: School, desc: "Integrated campus attendance verification and perimeter breach alerts." },
    { title: "Hospital Network", icon: Hospital, desc: "Direct secure feed to trauma centers and pediatric wards." },
    { title: "Solar/Electric Power", icon: BatteryCharging, desc: "Self-sustaining infrastructure ensuring continuous operational uptime." },
    { title: "Secure Data Portal", icon: ShieldCheck, desc: "Military-grade encrypted database for sensitive case information." },
  ];

  return (
    <section id="services" className="py-16 px-4 border-b border-border">
      <div className="container mx-auto">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold uppercase tracking-tighter text-foreground mb-4">Operational Capabilities</h2>
          <p className="text-muted-foreground font-mono max-w-2xl mx-auto">Advanced technological divisions deployed for search and recovery operations.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {services.map((service, i) => (
            <Card key={i} className="bg-card border-border rounded-sm hover:border-primary/50 transition-colors group">
              <CardHeader className="flex flex-row items-center gap-4 pb-2">
                <div className="p-3 bg-muted rounded-sm text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <service.icon className="w-6 h-6" />
                </div>
                <CardTitle className="uppercase text-lg">{service.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground font-mono leading-relaxed">{service.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
