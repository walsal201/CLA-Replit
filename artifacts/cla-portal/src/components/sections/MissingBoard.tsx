import { useListCases } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { MapPin, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import childPhoto1 from "@assets/Untitled_-_Copy_1782494222657.jpg";
import childPhoto2 from "@assets/Untitled_10_-_Copy_1782494233261.jpg";
import childPhoto3 from "@assets/Untitled_2_1782494243628.jpg";

const DEFAULT_PHOTOS = [childPhoto1, childPhoto2, childPhoto3];

const DEFAULT_CASES = [
  {
    id: 1, caseId: "CLA-2024-001", childName: "Redacted", childAge: 7,
    province: "Ontario", lastSeen: "Toronto", dateMissing: new Date().toISOString(),
    caseType: "Lost Child", status: "Open",
  },
  {
    id: 2, caseId: "CLA-2024-002", childName: "Redacted", childAge: 1,
    province: "Ontario", lastSeen: "Mississauga", dateMissing: new Date().toISOString(),
    caseType: "Kidnapping", status: "Open",
  },
  {
    id: 3, caseId: "CLA-2024-003", childName: "Redacted", childAge: 3,
    province: "Ontario", lastSeen: "Toronto", dateMissing: new Date().toISOString(),
    caseType: "Stolen Newborn", status: "Open",
  },
];

export function MissingBoard() {
  const { data: cases } = useListCases();

  const displayCases = cases?.length ? cases.slice(0, 3) : DEFAULT_CASES;

  return (
    <section id="board" className="py-16 px-4 border-b border-border bg-card/30">
      <div className="container mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
          <div>
            <h2 className="text-3xl font-bold uppercase tracking-tighter text-foreground mb-2 flex items-center gap-2">
              <AlertTriangle className="text-primary w-8 h-8" />
              Active Target Board
            </h2>
            <p className="text-muted-foreground font-mono">Current priority search operations</p>
          </div>
          <div className="px-4 py-2 bg-primary/10 border border-primary text-primary font-mono text-sm animate-pulse rounded-sm uppercase tracking-widest">
            Live Feed Active
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {displayCases.map((c, index) => (
            <Card key={c.id} className="border-border bg-background rounded-sm overflow-hidden border-t-4 border-t-primary">
              {/* Child photo */}
              <div className="relative w-full h-52 overflow-hidden bg-muted">
                <img
                  src={DEFAULT_PHOTOS[index % DEFAULT_PHOTOS.length]}
                  alt={`Missing child — Case ${c.caseId}`}
                  className="w-full h-full object-cover object-top"
                  data-testid={`img-missing-child-${c.id}`}
                />
                {/* MISSING overlay stamp */}
                <div className="absolute inset-0 flex items-start justify-between p-3">
                  <Badge variant="destructive" className="uppercase tracking-widest rounded-sm text-xs font-bold shadow-lg">
                    Missing
                  </Badge>
                  <span className="bg-black/70 text-white text-[10px] font-mono px-2 py-1 rounded-sm">
                    {c.caseId}
                  </span>
                </div>
                <div className="absolute bottom-0 left-0 right-0 h-12 bg-gradient-to-t from-background to-transparent" />
              </div>

              <CardHeader className="pb-2 pt-3 px-4 border-b border-border bg-muted/30">
                <p className="text-xl font-bold uppercase tracking-tight">{c.childAge} YR OLD</p>
                <span className="text-foreground uppercase text-xs px-2 py-0.5 bg-secondary rounded-sm inline-block w-fit mt-1">
                  {c.caseType}
                </span>
              </CardHeader>

              <CardContent className="pt-4 pb-4 px-4 space-y-3 font-mono text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4 text-primary shrink-0" />
                  <span>{c.lastSeen}, {c.province}</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="w-4 h-4 text-primary shrink-0" />
                  <span>{c.dateMissing ? format(new Date(c.dateMissing), "MMM dd, yyyy HH:mm") : "—"}</span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
