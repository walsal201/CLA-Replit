import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import headOfficer from "@assets/DSC_0463_copy_1782519888488.jpg";
import torontoCity from "@assets/Untitled_14_-_Copy_1782493659887.jpg";
import toronto1 from "@assets/Untitled_4_1782518574941.jpg";
import toronto2 from "@assets/Untitled_5_-_Copy_1782518583146.jpg";
import toronto3 from "@assets/Untitled_9_-_Copy_1782518592027.jpg";
import toronto4 from "@assets/Untitled_15_-_Copy_1782518605819.jpg";
import toronto5 from "@assets/Untitled_16_1782518616874.jpg";
import toronto6 from "@assets/Untitled_17_1782518625973.jpg";

export function AboutAgency() {
  return (
    <section id="about" className="py-16 px-4 border-b border-border bg-card/50">
      <div className="container mx-auto">
        <div className="grid md:grid-cols-2 gap-12 items-start">
          {/* Left — mission text */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h2 className="text-3xl font-bold uppercase tracking-tighter text-foreground">Agency Directive</h2>
              <div className="h-1 w-20 bg-primary"></div>
            </div>

            <p className="text-muted-foreground font-mono leading-relaxed text-sm">
              Founded in 2010 by Head Officer Walid Ibrahim (ID: 000539337) in Toronto, Canada.
              The Child Lost Agency operates at the bleeding edge of recovery technology, integrating
              subdermal GPS microchips, autonomous drone networks, and AI-driven tactical analysis
              to locate and recover children under 18 years of age anywhere in Canada.
            </p>

            <p className="text-muted-foreground font-mono leading-relaxed text-sm">
              Our robotic units — flying insect robots and spider robots — are armed with
              tranquilizers to neutralize threats without public disturbance. The command center
              operates on Python &amp; AI controlling camera rotation, stereo reconstruction algorithms,
              and real-time robot activity. Solar power by day, electric by night.
            </p>

            <div className="space-y-3 pt-2">
              <h3 className="text-xs uppercase text-primary font-bold tracking-widest">Case Types Handled</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  "Missing Children",
                  "Runaway Teens",
                  "Kidnapping",
                  "Stolen Newborns",
                  "Parental Abduction",
                  "Gang Involvement",
                  "Child Exploitation",
                  "School Non-Attendance",
                ].map(type => (
                  <Badge key={type} variant="outline" className="border-border text-foreground font-mono text-xs">
                    {type}
                  </Badge>
                ))}
              </div>
            </div>

            {/* Toronto City Network */}
            <div className="pt-4 space-y-3">
              {/* Label + banner above the grid */}
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <div className="h-1 w-6 bg-primary flex-shrink-0" />
                  <h3 className="text-sm uppercase font-bold tracking-widest text-primary">Toronto City Network</h3>
                  <div className="h-1 flex-1 bg-primary/20" />
                </div>
                <div className="w-full overflow-hidden rounded-sm border border-border">
                  <img
                    src={torontoCity}
                    alt="Toronto City"
                    className="w-full h-16 object-cover"
                    data-testid="img-toronto-city-button"
                  />
                </div>
                <p className="text-[10px] font-mono text-muted-foreground">Command Zone — Ontario, Canada</p>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { src: toronto1, alt: "Toronto Skyline Night" },
                  { src: toronto2, alt: "Toronto Towers" },
                  { src: toronto3, alt: "Toronto City Hall" },
                  { src: toronto4, alt: "Toronto CN Tower" },
                  { src: toronto5, alt: "Toronto City Centre" },
                  { src: toronto6, alt: "Toronto Downtown" },
                ].map((img, i) => (
                  <div key={i} className="overflow-hidden rounded-sm border border-border">
                    <img
                      src={img.src}
                      alt={img.alt}
                      className="w-full h-36 object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Right — Head Officer card */}
          <div className="space-y-6">
            <Card className="border-border bg-background rounded-sm overflow-hidden">
              <CardContent className="p-0 flex flex-col sm:flex-row">
                <div className="w-full sm:w-2/5 overflow-hidden">
                  <img
                    src={headOfficer}
                    alt="Head Officer Walid Ibrahim"
                    className="w-full h-full object-cover object-top min-h-[220px]"
                    data-testid="img-head-officer"
                  />
                </div>
                <div className="p-6 w-full sm:w-3/5 space-y-4 bg-background">
                  <div>
                    <h3 className="text-xl font-bold uppercase">Walid Ibrahim</h3>
                    <p className="text-sm text-primary font-mono tracking-widest">Head Officer / Founder</p>
                  </div>
                  <div className="space-y-2 font-mono text-sm">
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Officer ID</span>
                      <span className="text-foreground font-bold">000539337</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Founded</span>
                      <span className="text-foreground">April 17, 2010</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Clearance</span>
                      <span className="text-foreground">Level 5 (Maximum)</span>
                    </div>
                    <div className="flex justify-between border-b border-border pb-2">
                      <span className="text-muted-foreground">Base</span>
                      <span className="text-foreground">Toronto, Ontario</span>
                    </div>
                    <div className="flex justify-between pb-1">
                      <span className="text-muted-foreground">Status</span>
                      <span className="text-green-500 animate-pulse">Active Duty</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Mission stats */}
            <div className="grid grid-cols-2 gap-3">
              {[
                { label: "Provinces Active", value: "14" },
                { label: "GPS Units Deployed", value: "340+" },
                { label: "Robot Units", value: "28" },
                { label: "Years Operating", value: "15+" },
              ].map((item, i) => (
                <div key={i} className="p-4 border border-border bg-background rounded-sm text-center">
                  <p className="text-2xl font-bold text-primary">{item.value}</p>
                  <p className="text-xs font-mono text-muted-foreground uppercase tracking-wider mt-1">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
