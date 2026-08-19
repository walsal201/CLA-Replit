import { AlertTriangle, MapPin, Search, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import claLogo from "@assets/Untitled_18_-_Copy_1782493659888.jpg";
import canadaFlag from "@assets/Untitled_8_-_Copy_1782493659886.jpg";
import torontoNight from "@assets/Untitled_4_-_Copy_1782493659885.jpg";

export function HeroBanner() {
  const stats = [
    { label: "Cases Resolved", value: "2,400+", icon: CheckCircle, color: "text-green-500" },
    { label: "Provinces Covered", value: "14", icon: MapPin, color: "text-blue-400" },
    { label: "GPS Tracking", value: "24/7", icon: Search, color: "text-yellow-500" },
    { label: "Recovery Rate", value: "98%", icon: AlertTriangle, color: "text-primary" },
  ];

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section id="hero" className="pt-20 pb-0 bg-background border-b border-border relative overflow-hidden">
      {/* Toronto night skyline background */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-15"
        style={{ backgroundImage: `url(${torontoNight})` }}
      />
      <div className="absolute inset-0 bg-gradient-to-b from-background/80 via-background/60 to-background" />

      <div className="container mx-auto relative z-10 px-4">
        {/* CLA Banner */}
        <div className="flex justify-center mb-6 pt-8">
          <img
            src={claLogo}
            alt="The Child Lost Agency"
            className="h-20 object-contain"
            data-testid="img-cla-logo"
          />
        </div>

        <div className="max-w-5xl mx-auto text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-sm bg-primary/10 border border-primary/30 text-primary text-xs font-mono uppercase tracking-widest">
            <AlertTriangle className="w-3 h-3" />
            Official Canadian Government Operations Portal
          </div>

          <h1 className="text-5xl md:text-7xl font-black text-foreground tracking-tighter uppercase leading-none">
            THE CHILD LOST AGENCY
          </h1>
          <p className="text-xl text-primary font-mono tracking-widest uppercase">
            Toronto Command Center — Est. 2010
          </p>

          <p className="text-base text-muted-foreground font-mono max-w-3xl mx-auto leading-relaxed">
            Advanced GPS microchip technology, drone surveillance networks, and robotic systems
            deployed to locate missing, stolen, runaway, kidnapped and abducted children across Canada.
            Founded by Head Officer Walid Ibrahim — serving families since 2010.
          </p>

          {/* Canadian flag strip */}
          <div className="flex justify-center">
            <img
              src={canadaFlag}
              alt="Canada"
              className="h-40 object-cover rounded-sm border border-border opacity-90 shadow-lg"
              data-testid="img-canada-flag"
            />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4">
            {stats.map((stat, i) => (
              <div
                key={i}
                className="p-4 border border-border bg-card/80 rounded-sm flex flex-col items-center justify-center gap-2 backdrop-blur-sm"
              >
                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                <span className="text-2xl font-bold text-foreground">{stat.value}</span>
                <span className="text-xs text-muted-foreground uppercase font-mono tracking-wider text-center">{stat.label}</span>
              </div>
            ))}
          </div>

          <div className="flex gap-4 justify-center pt-4 pb-12">
            <Button
              size="lg"
              variant="destructive"
              className="uppercase font-bold tracking-widest px-8"
              data-testid="button-report-hero"
              onClick={() => scrollTo("report")}
            >
              Report Missing Child
            </Button>
            <Button
              size="lg"
              variant="outline"
              className="uppercase font-bold tracking-widest px-8 border-primary text-primary hover:bg-primary/10"
              data-testid="button-agent-login-hero"
              onClick={() => scrollTo("portal")}
            >
              Agent Login
            </Button>
          </div>
        </div>
      </div>

      {/* Toronto city strip */}
      <div className="w-full h-32 overflow-hidden relative">
        <img
          src={torontoNight}
          alt="Toronto"
          className="w-full h-full object-cover opacity-40"
          data-testid="img-toronto-strip"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background to-transparent" />
      </div>
    </section>
  );
}
