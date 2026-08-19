import { useState, useEffect, useRef } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Battery, Satellite, Activity, Crosshair, Wind, Gauge, Radio } from "lucide-react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

// Fix Leaflet default icon issue with bundlers
delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
});

const TORONTO_STREETS = [
  "43 King St W, Toronto",
  "200 Bay St, Toronto",
  "1 Yonge St, Toronto",
  "330 University Ave, Toronto",
  "180 Queen St W, Toronto",
  "80 Front St E, Toronto",
  "55 Bloor St W, Toronto",
  "160 Spadina Ave, Toronto",
  "401 Richmond St W, Toronto",
  "25 Sheppard Ave W, Toronto",
];

interface Session {
  id: string;
  deviceId: string;
  deviceType: string;
  childName: string;
  caseRef: string;
  lat: number;
  lng: number;
  battery: number;
  satellites: number;
  address: string;
  log: string[];
}

export function LiveTracker() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersRef = useRef<{ child?: L.Marker; drones: L.Marker[] }>({ drones: [] });

  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // Live drone telemetry — updates every second
  const [droneTelemetry, setDroneTelemetry] = useState([
    { id: "FALCON-1", color: "#3b82f6", alt: 142, speed: 38, battery: 87, signal: 94, heading: 217, mode: "Aerial Surveillance" },
    { id: "HAWK-2",   color: "#a855f7", alt: 98,  speed: 52, battery: 71, signal: 89, heading: 43,  mode: "Target Tracking" },
    { id: "EAGLE-3",  color: "#f59e0b", alt: 175, speed: 29, battery: 95, signal: 97, heading: 310, mode: "Perimeter Patrol" },
  ]);

  useEffect(() => {
    const tick = setInterval(() => {
      setDroneTelemetry(prev => prev.map(d => ({
        ...d,
        alt:     Math.min(Math.max(d.alt     + Math.round((Math.random() - 0.5) * 8),  50, 250), 250),
        speed:   Math.min(Math.max(d.speed   + Math.round((Math.random() - 0.5) * 6),  10, 80),  80),
        battery: Math.min(Math.max(d.battery - (Math.random() < 0.04 ? 1 : 0),          5, 100), 100),
        signal:  Math.min(Math.max(d.signal  + Math.round((Math.random() - 0.5) * 3),  60, 100), 100),
        heading: (d.heading + Math.round((Math.random() - 0.5) * 12) + 360) % 360,
      })));
    }, 1000);
    return () => clearInterval(tick);
  }, []);

  const [form, setForm] = useState({
    deviceType: "Bracelet Chip",
    deviceId: "",
    childName: "",
    caseRef: "",
  });

  // Init map once
  useEffect(() => {
    if (mapInstanceRef.current || !mapRef.current) return;

    const m = L.map(mapRef.current, { zoomControl: true }).setView([43.65, -79.38], 12);

    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "&copy; OpenStreetMap contributors",
      subdomains: "abc",
      maxZoom: 19,
    }).addTo(m);

    mapInstanceRef.current = m;

    // Add static drone markers — large, labeled, colorful
    const makeDroneIcon = (label: string, color: string) => L.divIcon({
      className: "",
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
          <div style="
            width:36px;height:36px;border-radius:50%;
            background:${color};
            border:3px solid #fff;
            box-shadow:0 0 14px ${color},0 0 4px rgba(0,0,0,0.6);
            display:flex;align-items:center;justify-content:center;
            font-size:18px;
          ">&#9992;</div>
          <div style="
            background:rgba(0,0,0,0.75);
            color:#fff;
            font-size:9px;
            font-family:monospace;
            font-weight:bold;
            padding:1px 5px;
            border-radius:2px;
            white-space:nowrap;
            letter-spacing:0.05em;
          ">${label}</div>
        </div>`,
      iconSize: [60, 52],
      iconAnchor: [30, 18],
      popupAnchor: [0, -20],
    });

    const drones = [
      L.marker([43.668, -79.395], { icon: makeDroneIcon("FALCON-1", "#3b82f6") })
        .bindPopup("<b>FALCON-1 Drone</b><br>Status: Active<br>Mode: Aerial Surveillance")
        .addTo(m),
      L.marker([43.636, -79.368], { icon: makeDroneIcon("HAWK-2", "#a855f7") })
        .bindPopup("<b>HAWK-2 Drone</b><br>Status: Active<br>Mode: Target Tracking")
        .addTo(m),
      L.marker([43.672, -79.352], { icon: makeDroneIcon("EAGLE-3", "#f59e0b") })
        .bindPopup("<b>EAGLE-3 Drone</b><br>Status: Active<br>Mode: Perimeter Patrol")
        .addTo(m),
    ];
    markersRef.current.drones = drones;

    return () => {
      m.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Move the active session's child marker every 3 seconds
  useEffect(() => {
    const active = sessions.find(s => s.id === activeSessionId);
    if (!active || !mapInstanceRef.current) return;

    const m = mapInstanceRef.current;

    const childIcon = L.divIcon({
      className: "",
      html: `
        <div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
          <div style="
            width:40px;height:40px;border-radius:50%;
            background:#cc0000;
            border:3px solid #fff;
            box-shadow:0 0 18px rgba(204,0,0,1),0 0 6px rgba(0,0,0,0.5);
            display:flex;align-items:center;justify-content:center;
            font-size:20px;
            animation:pulse 1.2s ease-in-out infinite;
          ">&#128100;</div>
          <div style="
            background:rgba(204,0,0,0.9);
            color:#fff;
            font-size:9px;
            font-family:monospace;
            font-weight:bold;
            padding:1px 5px;
            border-radius:2px;
            white-space:nowrap;
            letter-spacing:0.05em;
            border:1px solid #fff;
          ">TARGET</div>
        </div>`,
      iconSize: [60, 56],
      iconAnchor: [30, 20],
      popupAnchor: [0, -24],
    });

    if (!markersRef.current.child) {
      const marker = L.marker([active.lat, active.lng], { icon: childIcon })
        .bindPopup(`<b>${active.childName}</b><br>${active.deviceId}`)
        .addTo(m);
      markersRef.current.child = marker;
      m.panTo([active.lat, active.lng]);
    }

    const interval = setInterval(() => {
      setSessions(prev => prev.map(s => {
        if (s.id !== activeSessionId) return s;

        const newLat = Math.min(Math.max(s.lat + (Math.random() - 0.5) * 0.004, 43.596), 43.775);
        const newLng = Math.min(Math.max(s.lng + (Math.random() - 0.5) * 0.004, -79.616), -79.120);
        const addr = TORONTO_STREETS[Math.floor(Math.random() * TORONTO_STREETS.length)];
        const time = new Date().toLocaleTimeString();
        const entry = `[${time}] Lat: ${newLat.toFixed(5)}, Lng: ${newLng.toFixed(5)} — ${addr}`;

        if (markersRef.current.child && mapInstanceRef.current) {
          markersRef.current.child.setLatLng([newLat, newLng]);
          mapInstanceRef.current.panTo([newLat, newLng], { animate: true, duration: 1 });
        }

        return {
          ...s,
          lat: newLat,
          lng: newLng,
          address: addr,
          satellites: Math.floor(Math.random() * 4) + 10,
          log: [entry, ...s.log].slice(0, 12),
        };
      }));
    }, 3000);

    return () => {
      clearInterval(interval);
      if (markersRef.current.child) {
        markersRef.current.child.remove();
        markersRef.current.child = undefined;
      }
    };
  }, [activeSessionId, sessions.length]);

  const startSession = () => {
    if (!form.deviceId || !form.childName) return;
    const id = `SES-${Date.now()}`;
    const newSession: Session = {
      id,
      deviceId: form.deviceId.toUpperCase(),
      deviceType: form.deviceType,
      childName: form.childName,
      caseRef: form.caseRef,
      lat: 43.65 + (Math.random() - 0.5) * 0.05,
      lng: -79.38 + (Math.random() - 0.5) * 0.05,
      battery: Math.floor(Math.random() * 30) + 65,
      satellites: 12,
      address: TORONTO_STREETS[0],
      log: [],
    };
    setSessions(prev => [...prev, newSession]);
    setActiveSessionId(id);
    setForm({ deviceType: "Bracelet Chip", deviceId: "", childName: "", caseRef: "" });
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <section id="tracker" className="py-16 px-4 border-b border-border bg-background">
      <div className="container mx-auto">
        <div className="mb-8">
          <h2 className="text-3xl font-bold uppercase tracking-tighter text-foreground mb-4 flex items-center gap-2">
            <Crosshair className="text-primary w-8 h-8" />
            GPS Live Tracker — Command Center
          </h2>
          <p className="text-muted-foreground font-mono">Real-time microchip signal acquisition and drone network surveillance — Toronto Metro</p>
        </div>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Map */}
          <div className="lg:col-span-3 space-y-4">
            <div className="h-[500px] bg-muted border border-border rounded-sm relative overflow-hidden">
              <div ref={mapRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />

              {/* HUD overlays */}
              <div className="absolute top-3 left-3 z-[400] flex gap-2">
                <div className="bg-black/80 border border-red-800 px-3 py-1.5 text-xs font-mono uppercase text-red-500 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                  Live GPS Feed
                </div>
                {activeSession && (
                  <div className="bg-black/80 border border-border px-3 py-1.5 text-xs font-mono uppercase text-white">
                    Target: {activeSession.childName} / {activeSession.deviceId}
                  </div>
                )}
              </div>

              <div className="absolute top-3 right-3 z-[400] flex flex-col gap-1">
                <div className="bg-black/80 border border-blue-700 px-2 py-1 text-[10px] font-mono text-blue-400">DRONE UNIT: FALCON-1</div>
                <div className="bg-black/80 border border-blue-700 px-2 py-1 text-[10px] font-mono text-blue-400">DRONE UNIT: HAWK-2</div>
                <div className="bg-black/80 border border-blue-700 px-2 py-1 text-[10px] font-mono text-blue-400">DRONE UNIT: EAGLE-3</div>
              </div>

              {activeSession && (
                <div className="absolute bottom-3 left-3 right-3 z-[400] bg-black/85 border border-border p-3 font-mono text-xs">
                  <div className="flex justify-between items-center mb-2 pb-2 border-b border-border/50">
                    <span className="uppercase font-bold text-white">Signal Activity Log</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 text-[10px] uppercase text-red-400 hover:text-red-300"
                      onClick={() => {
                        setSessions(prev => prev.filter(s => s.id !== activeSessionId));
                        setActiveSessionId(null);
                      }}
                    >
                      Terminate
                    </Button>
                  </div>
                  <div className="h-20 overflow-y-auto space-y-0.5">
                    {activeSession.log.map((entry, i) => (
                      <div key={i} className={i === 0 ? "text-red-400" : "text-gray-400"}>{entry}</div>
                    ))}
                    {!activeSession.log.length && <div className="text-gray-500">Acquiring signal...</div>}
                  </div>
                </div>
              )}

              {!activeSession && (
                <div className="absolute inset-0 z-[400] flex items-center justify-center pointer-events-none">
                  <div className="bg-black/70 border border-border px-6 py-4 font-mono text-center">
                    <p className="text-yellow-500 uppercase text-sm">No Active Tracking Session</p>
                    <p className="text-gray-500 text-xs mt-1">Initialize a session to begin target acquisition</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sessions list */}
            {sessions.length > 0 && (
              <div className="flex gap-2 flex-wrap">
                {sessions.map(s => (
                  <button
                    key={s.id}
                    data-testid={`button-session-${s.id}`}
                    onClick={() => setActiveSessionId(s.id)}
                    className={`px-3 py-1.5 text-xs font-mono uppercase border rounded-sm transition-colors ${
                      s.id === activeSessionId
                        ? "bg-primary text-white border-primary"
                        : "bg-background text-muted-foreground border-border hover:border-primary"
                    }`}
                  >
                    {s.childName} / {s.deviceId}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* New session form */}
            <Card className="border-border bg-card">
              <CardHeader className="p-4 border-b border-border bg-muted/30">
                <CardTitle className="uppercase text-sm font-bold tracking-widest">Initialize Tracking Session</CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-3">
                <div className="space-y-1">
                  <Label className="text-xs uppercase font-mono text-muted-foreground">Device Type</Label>
                  <select
                    value={form.deviceType}
                    onChange={e => setForm({ ...form, deviceType: e.target.value })}
                    className="w-full bg-muted border border-border p-2 text-sm font-mono text-foreground rounded-sm"
                    data-testid="select-device-type"
                  >
                    <option>Bracelet Chip</option>
                    <option>Necklace Chip</option>
                    <option>Shoe Chip</option>
                    <option>Clothing Embedded</option>
                    <option>Ear Chip</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase font-mono text-muted-foreground">Device ID / Frequency</Label>
                  <Input
                    value={form.deviceId}
                    onChange={e => setForm({ ...form, deviceId: e.target.value })}
                    placeholder="e.g. CLA-FRQ-8821"
                    className="bg-muted font-mono uppercase text-sm"
                    data-testid="input-device-id"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase font-mono text-muted-foreground">Child Name</Label>
                  <Input
                    value={form.childName}
                    onChange={e => setForm({ ...form, childName: e.target.value })}
                    placeholder="e.g. JANE DOE"
                    className="bg-muted font-mono uppercase text-sm"
                    data-testid="input-child-name"
                  />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs uppercase font-mono text-muted-foreground">Case Reference</Label>
                  <Input
                    value={form.caseRef}
                    onChange={e => setForm({ ...form, caseRef: e.target.value })}
                    placeholder="e.g. CLA-2024-001"
                    className="bg-muted font-mono uppercase text-sm"
                    data-testid="input-case-ref"
                  />
                </div>
                <Button
                  onClick={startSession}
                  disabled={!form.deviceId || !form.childName}
                  className="w-full uppercase tracking-widest font-mono text-sm mt-2"
                  data-testid="button-establish-uplink"
                >
                  Establish Uplink
                </Button>
              </CardContent>
            </Card>

            {/* Telemetry */}
            {activeSession && (
              <Card className="border-border bg-card">
                <CardHeader className="p-4 border-b border-border bg-muted/30">
                  <CardTitle className="uppercase text-sm font-bold tracking-widest flex items-center gap-2">
                    <Activity className="w-4 h-4 text-primary" />
                    Live Telemetry
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 space-y-3 font-mono text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Battery className="w-4 h-4" /> Power
                    </span>
                    <span className={activeSession.battery < 20 ? "text-red-500" : "text-green-500"}>
                      {activeSession.battery}%
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground flex items-center gap-2">
                      <Satellite className="w-4 h-4" /> Satellites
                    </span>
                    <span>{activeSession.satellites} Locked</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Lat</span>
                    <span className="text-xs">{activeSession.lat.toFixed(5)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Lng</span>
                    <span className="text-xs">{activeSession.lng.toFixed(5)}</span>
                  </div>
                  <div className="pt-2 border-t border-border/50">
                    <p className="text-muted-foreground text-xs">Last Known Address</p>
                    <p className="text-foreground text-xs mt-1">{activeSession.address}</p>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">Status</span>
                    <span className="text-primary uppercase animate-pulse text-xs">Signal Active</span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Live Drone Telemetry */}
            <Card className="border-border bg-card">
              <CardHeader className="p-3 border-b border-border bg-muted/30">
                <CardTitle className="uppercase text-xs font-bold tracking-widest flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Radio className="w-3 h-3 text-green-400 animate-pulse" />
                    Live Drone Telemetry
                  </div>
                  <span className="text-[9px] text-green-400 font-mono animate-pulse">● 1 Hz</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 divide-y divide-border/50">
                {droneTelemetry.map(d => (
                  <div key={d.id} className="p-3 space-y-2">
                    {/* Drone header */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5">
                        <span className="text-lg">✈</span>
                        <span className="font-mono text-xs font-bold" style={{ color: d.color }}>{d.id}</span>
                      </div>
                      <span className="text-[9px] font-mono text-green-400 bg-green-950/50 border border-green-800 px-1.5 py-0.5 rounded-sm">
                        ACTIVE
                      </span>
                    </div>
                    <div className="text-[9px] font-mono text-muted-foreground uppercase tracking-widest">{d.mode}</div>

                    {/* Metrics grid */}
                    <div className="grid grid-cols-2 gap-1.5 font-mono">
                      {/* Altitude */}
                      <div className="bg-muted/40 border border-border/50 rounded-sm p-1.5 space-y-0.5">
                        <div className="flex items-center gap-1 text-[8px] text-muted-foreground uppercase">
                          <Gauge className="w-2.5 h-2.5" /> ALT
                        </div>
                        <div className="text-xs font-bold text-sky-400">{d.alt} m</div>
                        <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-sky-500 transition-all duration-700" style={{ width: `${(d.alt / 250) * 100}%` }} />
                        </div>
                      </div>

                      {/* Speed */}
                      <div className="bg-muted/40 border border-border/50 rounded-sm p-1.5 space-y-0.5">
                        <div className="flex items-center gap-1 text-[8px] text-muted-foreground uppercase">
                          <Wind className="w-2.5 h-2.5" /> SPEED
                        </div>
                        <div className="text-xs font-bold text-amber-400">{d.speed} km/h</div>
                        <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-amber-500 transition-all duration-700" style={{ width: `${(d.speed / 80) * 100}%` }} />
                        </div>
                      </div>

                      {/* Battery */}
                      <div className="bg-muted/40 border border-border/50 rounded-sm p-1.5 space-y-0.5">
                        <div className="flex items-center gap-1 text-[8px] text-muted-foreground uppercase">
                          <Battery className="w-2.5 h-2.5" /> BATT
                        </div>
                        <div className={`text-xs font-bold ${d.battery < 20 ? "text-red-400" : d.battery < 40 ? "text-yellow-400" : "text-green-400"}`}>
                          {d.battery}%
                        </div>
                        <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className={`h-full transition-all duration-1000 ${d.battery < 20 ? "bg-red-500" : d.battery < 40 ? "bg-yellow-500" : "bg-green-500"}`}
                            style={{ width: `${d.battery}%` }} />
                        </div>
                      </div>

                      {/* Signal */}
                      <div className="bg-muted/40 border border-border/50 rounded-sm p-1.5 space-y-0.5">
                        <div className="flex items-center gap-1 text-[8px] text-muted-foreground uppercase">
                          <Satellite className="w-2.5 h-2.5" /> LINK
                        </div>
                        <div className="text-xs font-bold text-purple-400">{d.signal}%</div>
                        <div className="h-0.5 bg-zinc-800 rounded-full overflow-hidden">
                          <div className="h-full bg-purple-500 transition-all duration-700" style={{ width: `${d.signal}%` }} />
                        </div>
                      </div>
                    </div>

                    {/* Heading compass bar */}
                    <div className="flex items-center gap-2 font-mono">
                      <span className="text-[8px] text-muted-foreground uppercase">HDG</span>
                      <div className="flex-1 h-3 bg-zinc-900 border border-zinc-700 rounded-sm relative overflow-hidden">
                        <div className="absolute inset-0 flex items-center justify-center text-[7px] text-zinc-600 tracking-widest select-none pointer-events-none">
                          N · · · E · · · S · · · W · · ·
                        </div>
                        <div className="absolute top-0.5 bottom-0.5 w-0.5 bg-white rounded-full transition-all duration-500"
                          style={{ left: `${(d.heading / 360) * 100}%` }} />
                      </div>
                      <span className="text-[8px] font-bold text-white w-7">{String(d.heading).padStart(3, "0")}°</span>
                    </div>
                  </div>
                ))}

                {/* Ground units */}
                <div className="p-3 space-y-1.5 font-mono">
                  <div className="text-[9px] text-muted-foreground uppercase tracking-widest mb-2">Ground Units</div>
                  {[["SPIDER-01", "Standby"], ["SPIDER-02", "Standby"]].map(([name, status]) => (
                    <div key={name} className="flex justify-between items-center">
                      <span className="text-[11px] text-yellow-500">🕷 {name}</span>
                      <span className="text-[9px] text-yellow-500/70 border border-yellow-900/50 px-1.5 py-0.5">{status}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
