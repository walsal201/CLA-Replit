import { Microchip, Cpu, Locate, Wifi } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Technology() {
  const techCategories = [
    {
      title: "GPS Devices",
      icon: Locate,
      items: ["Garmin G-162", "Garmin G-176", "Garmin G76", "Magellan Meridian", "Sport Rack"],
      color: "text-blue-500"
    },
    {
      title: "Robotic Platforms",
      icon: Cpu,
      items: ["Flying Insect Robot", "Spider Robot", "Stereo Camera Unit", "Tranquilizer Module"],
      color: "text-red-500"
    },
    {
      title: "Subdermal & Wearable Microchips",
      icon: Microchip,
      items: ["Bracelet Chip", "Necklace Chip", "Shoe Chip", "Clothing Embedded Chip"],
      color: "text-green-500"
    },
    {
      title: "Drone Fleet",
      icon: Wifi,
      items: ["High-Altitude Surveillance", "Thermal Imaging", "Night Vision", "Signal Relay"],
      color: "text-yellow-500"
    }
  ];

  return (
    <section id="tech" className="py-16 px-4 border-b border-border bg-background">
      <div className="container mx-auto">
        <div className="mb-12">
          <h2 className="text-3xl font-bold uppercase tracking-tighter text-foreground mb-4">Technology & Equipment</h2>
          <p className="text-muted-foreground font-mono max-w-2xl">Classified hardware deployed for locating and securing individuals.</p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {techCategories.map((cat, i) => (
            <Card key={i} className="bg-card border-border rounded-sm hover:border-primary/50 transition-colors">
              <CardHeader className="pb-2">
                <cat.icon className={`w-8 h-8 mb-4 ${cat.color}`} />
                <CardTitle className="uppercase text-lg">{cat.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 font-mono text-sm text-muted-foreground">
                  {cat.items.map((item, j) => (
                    <li key={j} className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full bg-current ${cat.color}`}></div>
                      {item}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
