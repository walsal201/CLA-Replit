import { Navbar } from "@/components/layout/Navbar";
import { HeroBanner } from "@/components/sections/HeroBanner";
import { AboutAgency } from "@/components/sections/AboutAgency";
import { Services } from "@/components/sections/Services";
import { Technology } from "@/components/sections/Technology";
import { MissingBoard } from "@/components/sections/MissingBoard";
import { ReportForm } from "@/components/sections/ReportForm";
import { Enrollment } from "@/components/sections/Enrollment";
import { LiveTracker } from "@/components/sections/LiveTracker";
import { AgentPortal } from "@/components/sections/AgentPortal";
import { WeaponDeployment } from "@/components/sections/WeaponDeployment";
import { SystemStatus } from "@/components/sections/SystemStatus";
import { AiVirtualAgent } from "@/components/AiVirtualAgent";

export default function Home() {
  return (
    <div className="min-h-screen w-full bg-background flex flex-col pb-24">
      <Navbar />
      <main className="flex-1">
        <HeroBanner />
        <AboutAgency />
        <Services />
        <Technology />
        <MissingBoard />
        <ReportForm />
        <Enrollment />
        <LiveTracker />
        <AgentPortal />
        <WeaponDeployment />
        <SystemStatus />
      </main>
      
      <footer className="bg-muted py-8 px-4 border-t border-border mt-auto">
        <div className="container mx-auto text-center font-mono text-sm text-muted-foreground">
          <p className="uppercase tracking-widest mb-2">The Child Lost Agency Command Center</p>
          <p>© {new Date().getFullYear()} Authorized Access Only. All operations monitored.</p>
        </div>
      </footer>

      <AiVirtualAgent />
    </div>
  );
}
