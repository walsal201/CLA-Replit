import { useState } from "react";
import { useListCases, useGetCaseStats, useAiCaseAnalysis, useAiEmergencyAlert } from "@workspace/api-client-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Lock, Cpu, AlertTriangle, FileText, Shield } from "lucide-react";
import { format } from "date-fns";

const VALID_USERNAME = "walsal201";
const VALID_PASSWORD = "Alpha@188305";

export function AgentPortal() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [credentials, setCredentials] = useState({ id: "", pass: "" });
  const [loginError, setLoginError] = useState("");

  const { data: cases } = useListCases({ query: { enabled: isLoggedIn, queryKey: ["cases", isLoggedIn] } });
  const { data: stats } = useGetCaseStats({ query: { enabled: isLoggedIn, queryKey: ["cases-stats", isLoggedIn] } });

  const analysisMutation = useAiCaseAnalysis();
  const alertMutation = useAiEmergencyAlert();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError("");
    if (credentials.id === VALID_USERNAME && credentials.pass === VALID_PASSWORD) {
      setIsLoggedIn(true);
    } else {
      setLoginError("ACCESS DENIED — Invalid agent credentials.");
    }
  };

  if (!isLoggedIn) {
    return (
      <section id="portal" className="py-24 px-4 border-b border-border bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80')] bg-cover bg-center relative">
        <div className="absolute inset-0 bg-background/95 backdrop-blur-sm"></div>
        <div className="container mx-auto relative z-10 max-w-md">
          <Card className="border-primary/50 bg-background/80 shadow-2xl">
            <CardHeader className="text-center border-b border-border pb-6">
              <div className="mx-auto bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
                <Lock className="w-8 h-8 text-primary" />
              </div>
              <CardTitle className="uppercase text-2xl tracking-widest text-primary">Secure Agent Portal</CardTitle>
              <p className="text-xs font-mono text-muted-foreground mt-2">Level 4 Clearance Required — Authorized Personnel Only</p>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label className="uppercase text-xs tracking-widest text-muted-foreground">Agent Username</Label>
                  <Input
                    required
                    data-testid="input-agent-username"
                    value={credentials.id}
                    onChange={e => setCredentials({ ...credentials, id: e.target.value })}
                    className="font-mono bg-muted/50"
                    placeholder="Enter agent username"
                    autoComplete="username"
                  />
                </div>
                <div className="space-y-2">
                  <Label className="uppercase text-xs tracking-widest text-muted-foreground">Password</Label>
                  <Input
                    required
                    type="password"
                    data-testid="input-agent-password"
                    value={credentials.pass}
                    onChange={e => setCredentials({ ...credentials, pass: e.target.value })}
                    className="font-mono bg-muted/50"
                    autoComplete="current-password"
                  />
                </div>
                {loginError && (
                  <div className="p-3 bg-primary/10 border border-primary text-primary text-xs font-mono uppercase tracking-widest">
                    {loginError}
                  </div>
                )}
                <Button type="submit" data-testid="button-authenticate" className="w-full uppercase tracking-widest mt-6">
                  Authenticate
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="portal" className="py-16 px-4 border-b border-border bg-background">
      <div className="container mx-auto">
        <div className="flex justify-between items-end mb-8 border-b border-border pb-4">
          <div>
            <h2 className="text-3xl font-bold uppercase tracking-tighter text-foreground mb-2 flex items-center gap-2">
              <Shield className="text-primary w-8 h-8" />
              Agent Command Interface
            </h2>
            <p className="text-muted-foreground font-mono">Welcome, Agent <span className="text-primary font-bold">{credentials.id}</span>. Session secure.</p>
          </div>
          <Button onClick={() => { setIsLoggedIn(false); setCredentials({ id: "", pass: "" }); }} variant="outline" size="sm" className="font-mono uppercase">
            Terminate Session
          </Button>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3 space-y-6">
            <Card className="border-border bg-card">
              <CardHeader className="bg-muted/30 border-b border-border p-4">
                <CardTitle className="uppercase text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" />
                  Active Case Database
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-muted/50">
                    <TableRow>
                      <TableHead className="font-mono uppercase text-xs">Case ID</TableHead>
                      <TableHead className="font-mono uppercase text-xs">Target</TableHead>
                      <TableHead className="font-mono uppercase text-xs">Age</TableHead>
                      <TableHead className="font-mono uppercase text-xs">Type</TableHead>
                      <TableHead className="font-mono uppercase text-xs">Status</TableHead>
                      <TableHead className="font-mono uppercase text-xs">Reporter</TableHead>
                      <TableHead className="font-mono uppercase text-xs text-right">Date Missing</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="font-mono text-sm">
                    {cases?.map(c => (
                      <TableRow key={c.id} data-testid={`row-case-${c.id}`}>
                        <TableCell className="text-primary font-bold">{c.caseId}</TableCell>
                        <TableCell>{c.childName}</TableCell>
                        <TableCell>{c.childAge}</TableCell>
                        <TableCell className="text-xs uppercase">{c.caseType}</TableCell>
                        <TableCell>
                          <Badge
                            variant={c.status === "Open" ? "destructive" : "secondary"}
                            className="uppercase text-[10px]"
                          >
                            {c.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-xs">{c.reporterName}</TableCell>
                        <TableCell className="text-right text-muted-foreground">
                          {c.dateMissing ? format(new Date(c.dateMissing), "MMM dd, yyyy") : "—"}
                        </TableCell>
                      </TableRow>
                    ))}
                    {!cases?.length && (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground font-mono">
                          No active cases in database
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-border bg-card">
                <CardHeader className="bg-muted/30 border-b border-border p-4">
                  <CardTitle className="uppercase text-sm flex items-center gap-2">
                    <Cpu className="w-4 h-4 text-primary" />
                    AI Case Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <p className="text-sm font-mono text-muted-foreground">Run predictive modeling on active case vectors using CLA Intelligence Core.</p>
                  <Button
                    className="w-full font-mono uppercase"
                    variant="secondary"
                    data-testid="button-ai-analysis"
                    onClick={() => analysisMutation.mutate({ data: { caseData: { total: String(stats?.total ?? 0), open: String(stats?.open ?? 0), area: "Toronto Metro" } } })}
                    disabled={analysisMutation.isPending}
                  >
                    {analysisMutation.isPending ? "Computing..." : "Execute Analysis"}
                  </Button>
                  {analysisMutation.data && (
                    <div className="mt-4 p-3 bg-background border border-border text-xs font-mono text-green-400 rounded-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {analysisMutation.data.text}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-primary/50 bg-card">
                <CardHeader className="bg-primary/10 border-b border-primary/20 p-4">
                  <CardTitle className="uppercase text-sm flex items-center gap-2 text-primary">
                    <AlertTriangle className="w-4 h-4" />
                    Emergency Broadcast
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-4">
                  <p className="text-sm font-mono text-muted-foreground">Issue immediate AMBER/Network alert to all active units and public channels.</p>
                  <Button
                    className="w-full font-mono uppercase"
                    variant="destructive"
                    data-testid="button-emergency-alert"
                    onClick={() => alertMutation.mutate({ data: { area: "Toronto Metro", situation: "Missing child — immediate search required" } })}
                    disabled={alertMutation.isPending}
                  >
                    {alertMutation.isPending ? "Transmitting..." : "Initialize Alert"}
                  </Button>
                  {alertMutation.data && (
                    <div className="mt-4 p-3 bg-primary/20 border border-primary text-xs font-mono text-primary rounded-sm whitespace-pre-wrap max-h-48 overflow-y-auto">
                      {alertMutation.data.text}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="space-y-6">
            <Card className="border-border bg-card">
              <CardHeader className="bg-muted/30 border-b border-border p-4">
                <CardTitle className="uppercase text-sm font-bold tracking-widest">Global Stats</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-4 font-mono text-sm">
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-muted-foreground">Total Operations</span>
                  <span className="font-bold">{stats?.total ?? 0}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-muted-foreground">Active (Open)</span>
                  <span className="text-primary font-bold">{stats?.open ?? 0}</span>
                </div>
                <div className="flex justify-between items-center pb-2 border-b border-border/50">
                  <span className="text-muted-foreground">Resolved</span>
                  <span className="text-green-500 font-bold">{stats?.resolved ?? 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">GPS Enrolled</span>
                  <span className="font-bold">{stats?.gpsEnrolled ?? 0}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="border-border bg-card">
              <CardHeader className="bg-muted/30 border-b border-border p-4">
                <CardTitle className="uppercase text-sm font-bold tracking-widest">By Classification</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 font-mono text-xs">
                {stats?.byType.map((t, i) => (
                  <div key={i} className="flex justify-between items-center py-1 border-b border-border/30">
                    <span className="text-muted-foreground uppercase">{t.type}</span>
                    <span className="font-bold text-foreground">{t.count}</span>
                  </div>
                ))}
                {!stats?.byType.length && (
                  <p className="text-muted-foreground text-center py-2">No data</p>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
