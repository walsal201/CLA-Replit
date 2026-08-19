
      targetMarkerRef.current = null;
      childMarkerRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn, activeTab]);

  const makeTargetIcon = (color: string, label: string, pulse = false) =>
    L.divIcon({
      className: "",
      html: `<div style="display:flex;flex-direction:column;align-items:center;gap:2px;">
        <div style="width:44px;height:44px;border-radius:50%;background:${color};border:3px solid #fff;
          box-shadow:0 0 22px ${color};display:flex;align-items:center;justify-content:center;font-size:22px;
          ${pulse ? "animation:pulse 0.8s ease-in-out infinite;" : ""}">🎯</div>
        <div style="background:${color};color:#fff;font-size:9px;font-family:monospace;font-weight:bold;
          padding:2px 6px;border-radius:2px;white-space:nowrap;border:1px solid rgba(255,255,255,0.4);">${label}</div>
      </div>`,
      iconSize: [70, 58], iconAnchor: [35, 22], popupAnchor: [0, -26],
    });

  const placeTargetMarker = (color: string, label: string, pulse = false) => {
    const m = mapInstanceRef.current;
    if (!m) return;
    if (targetMarkerRef.current) { targetMarkerRef.current.remove(); targetMarkerRef.current = null; }
    const marker = L.marker([currentTarget.lat, currentTarget.lng], { icon: makeTargetIcon(color, label, pulse) })
      .bindPopup(`<b>HOSTILE TARGET</b><br>Lat: ${currentTarget.lat.toFixed(5)}<br>Lng: ${currentTarget.lng.toFixed(5)}<br>Distance from child: ${distanceKm.toFixed(2)} km`)
      .addTo(m);
    targetMarkerRef.current = marker;
    m.fitBounds([
      [currentTarget.lat, currentTarget.lng],
      [childPos.lat, childPos.lng],
    ], { padding: [60, 60] });
  };

  const setQty = (id: WeaponId, raw: string) => {
    const n = Math.min(Math.max(0, parseInt(raw.replace(/[^0-9]/g, "") || "0", 10)), MAX_QTY);
    setQuantities(prev => ({ ...prev, [id]: n }));
  };

  const handleRequestStrike = () => {
    if (!armedWeapons.length) return;
    // Show confirmation with distance visualization first
    placeTargetMarker("#f59e0b", "CONFIRM TARGET", false);
    setShowConfirm(true);
  };

  const handleConfirmStrike = () => {
    setShowConfirm(false);

    // YELLOW — deploying
    setDeployStatus("deploying");
    setStatusMsg("⚡ DEPLOYMENT IN PROGRESS — Drones en route to hostile target...");
    setShowCamera(true);
    setCameraPhase(0);
    placeTargetMarker("#f59e0b", "IN PROCESS", true);

    // RED — weapons deployed (4 s)
    timerRef.current = setTimeout(() => {
      setDeployStatus("deployed");
      setStatusMsg("🔴 WEAPONS DEPLOYED — Engaging hostile. Child confirmed safe at distance.");
      setCameraPhase(1);
      placeTargetMarker("#cc0000", "DEPLOYED", true);

      // GREEN — eliminated (6 s more)
      timerRef.current = setTimeout(() => {
        setDeployStatus("eliminated");
        setStatusMsg("✅ HOSTILE TARGET ELIMINATED — Child / Hostage secure. Threat neutralized. Mission complete.");
        setCameraPhase(2);
        placeTargetMarker("#22c55e", "ELIMINATED", false);

        const record: ArchiveRecord = {
          id: `DEP-${Date.now()}`,
          timestamp: new Date().toLocaleString(),
          weapons: armedWeapons.map(w => ({ name: w.name, qty: quantities[w.id] })),
          targetLat: currentTarget.lat,
          targetLng: currentTarget.lng,
          childLat: childPos.lat,
          childLng: childPos.lng,
          distanceKm,
          droneUnits: ["FALCON-1", "HAWK-2", "EAGLE-3"],
          status: "eliminated",
        };
        setArchive(prev => [record, ...prev]);

        // Reset (10 s)
        timerRef.current = setTimeout(() => {
          setDeployStatus("idle");
          setStatusMsg("");
          setShowCamera(false);
          setCameraPhase(0);
          setQuantities(Object.fromEntries(WEAPONS.map(w => [w.id, 0])) as Record<WeaponId, number>);
          setTargetIdx(prev => (prev + 1) % TARGET_POSITIONS.length);
          if (targetMarkerRef.current) { targetMarkerRef.current.remove(); targetMarkerRef.current = null; }
        }, 10_000);
      }, 6_000);
    }, 4_000);
  };

  const handleLogin = () => {
    if (creds.user === CMD_USER && creds.pass === CMD_PASS) {
      setIsLoggedIn(true);
      setLoginError("");
    } else {
      setLoginError("⛔ ACCESS DENIED — Invalid Commander credentials.");
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setCreds({ user: "", pass: "" });
    setDeployStatus("idle");
    setQuantities(Object.fromEntries(WEAPONS.map(w => [w.id, 0])) as Record<WeaponId, number>);
    setShowCamera(false);
    setShowConfirm(false);
    setActiveTab("deploy");
    if (timerRef.current) clearTimeout(timerRef.current);
    if (mapInstanceRef.current) { mapInstanceRef.current.remove(); mapInstanceRef.current = null; }
    targetMarkerRef.current = null;
    childMarkerRef.current = null;
  };

  // ─── Court Report Modal ──────────────────────────────────────────────────────
  const CourtReportModal = ({ rec }: { rec: ArchiveRecord }) => {
    const reportDate = new Date().toLocaleDateString("en-CA", { year: "numeric", month: "long", day: "numeric" });
    const totalUnitsRec = rec.weapons.reduce((s, w) => s + w.qty, 0);

    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto">
        <div className="bg-white text-black max-w-3xl w-full rounded-sm shadow-2xl overflow-hidden my-4">

          {/* Toolbar */}
          <div className="bg-zinc-900 text-white flex items-center justify-between px-4 py-2 print:hidden">
            <div className="flex items-center gap-2 text-sm font-mono">
              <FileText className="w-4 h-4 text-blue-400" />
              Court Evidence Document — {rec.id}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="text-xs font-mono border-zinc-600 text-white hover:bg-zinc-700 hover:text-white"
                onClick={() => window.print()}>
                <Printer className="w-3 h-3 mr-1" /> Print / Save PDF
              </Button>
              <Button size="sm" variant="ghost" className="text-white hover:bg-zinc-700 hover:text-white"
                onClick={() => setReportRecord(null)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Document */}
          <div className="p-8 font-serif text-sm leading-relaxed" id="court-report">
            {/* Letterhead */}
            <div className="text-center border-b-4 border-double border-black pb-4 mb-6">
              <div className="flex items-center justify-center gap-4 mb-2">
                <Shield className="w-10 h-10 text-red-700" />
                <div>
                  <h1 className="text-2xl font-bold tracking-wider uppercase">The Child Lost Agency</h1>
                  <p className="text-sm text-zinc-600 tracking-widest uppercase">Canadian Federal Child Protection Operations Division</p>
                </div>
                <Shield className="w-10 h-10 text-red-700" />
              </div>
              <div className="text-xs text-zinc-500 font-mono">
                Toronto Command Centre · Est. 2010 · Head Officer: Walid Ibrahim (ID: 000539337)
              </div>
            </div>

            {/* Document title */}
            <div className="text-center mb-6">
              <div className="inline-block border-2 border-black px-6 py-2">
                <h2 className="text-lg font-bold uppercase tracking-widest">CLASSIFIED MISSION INCIDENT REPORT</h2>
                <p className="text-xs font-mono text-zinc-600 mt-0.5">For Court Submission Only — Unauthorized Access Prohibited</p>
              </div>
            </div>

            {/* Reference block */}
            <div className="grid grid-cols-2 gap-6 mb-6 font-mono text-xs border border-zinc-300 p-4 bg-zinc-50">
              <div className="space-y-1">
                <div><span className="font-bold">Report Reference:</span> {rec.id}</div>
                <div><span className="font-bold">Report Date:</span> {reportDate}</div>
                <div><span className="font-bold">Mission Timestamp:</span> {rec.timestamp}</div>
                <div><span className="font-bold">Classification:</span> <span className="text-red-700 font-bold">TOP SECRET</span></div>
              </div>
              <div className="space-y-1">
                <div><span className="font-bold">Commanding Officer:</span> Walid Ibrahim</div>
                <div><span className="font-bold">Officer ID:</span> 000539337</div>
                <div><span className="font-bold">Clearance Level:</span> 5 (Maximum)</div>
                <div><span className="font-bold">Mission Status:</span> <span className="text-green-700 font-bold">TARGET ELIMINATED</span></div>
              </div>
            </div>

            {/* Section 1 — Mission Overview */}
            <div className="mb-5">
              <h3 className="font-bold uppercase text-sm border-b border-zinc-400 pb-1 mb-2 tracking-widest">1. Mission Overview</h3>
              <p className="text-zinc-700 leading-loose">
                On <strong>{rec.timestamp}</strong>, The Child Lost Agency (CLA) Toronto Command Centre authorized
                a precision strike operation against a confirmed hostile target who had taken a child/hostage
                in the Toronto Metropolitan area. Commander <strong>Walid Ibrahim (ID: 000539337)</strong> authorized
                the deployment of <strong>{rec.droneUnits.length} drone units</strong> armed with{" "}
                <strong>{rec.weapons.length} weapon system(s)</strong> comprising a total of{" "}
                <strong>{formatQty(totalUnitsRec)} combat units</strong>.
                The child/hostage was confirmed safe at a distance of{" "}
                <strong>{rec.distanceKm.toFixed(2)} km</strong> from the target prior to strike authorization.
              </p>
            </div>

            {/* Section 2 — Target Intelligence */}
            <div className="mb-5">
              <h3 className="font-bold uppercase text-sm border-b border-zinc-400 pb-1 mb-2 tracking-widest">2. Target Intelligence</h3>
              <table className="w-full font-mono text-xs border border-zinc-300">
                <tbody>
                  {[
                    ["Hostile Target Latitude", `${rec.targetLat.toFixed(6)}° N`],
                    ["Hostile Target Longitude", `${rec.targetLng.toFixed(6)}° W`],
                    ["Child / Victim Latitude", `${rec.childLat.toFixed(6)}° N`],
                    ["Child / Victim Longitude", `${rec.childLng.toFixed(6)}° W`],
                    ["Separation Distance", `${rec.distanceKm.toFixed(3)} km (SAFE — Child not at risk)`],
                    ["Operation Zone", "Toronto Metropolitan Area, Ontario, Canada"],
                    ["Drone Units Deployed", rec.droneUnits.join(", ")],
                  ].map(([label, value], i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50"}>
                      <td className="border border-zinc-300 px-3 py-1.5 font-bold text-zinc-700 w-48">{label}</td>
                      <td className="border border-zinc-300 px-3 py-1.5">{value}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Section 3 — Weapons Deployed */}
            <div className="mb-5">
              <h3 className="font-bold uppercase text-sm border-b border-zinc-400 pb-1 mb-2 tracking-widest">3. Weapons Systems Deployed</h3>
              <table className="w-full font-mono text-xs border border-zinc-300">
                <thead>
                  <tr className="bg-zinc-800 text-white">
                    <th className="border border-zinc-600 px-3 py-2 text-left">#</th>
                    <th className="border border-zinc-600 px-3 py-2 text-left">Weapon System</th>
                    <th className="border border-zinc-600 px-3 py-2 text-right">Units Deployed</th>
                    <th className="border border-zinc-600 px-3 py-2 text-left">Authorization</th>
                  </tr>
                </thead>
                <tbody>
                  {rec.weapons.map((w, i) => (
                    <tr key={i} className={i % 2 === 0 ? "bg-white" : "bg-zinc-50"}>
                      <td className="border border-zinc-300 px-3 py-1.5">{i + 1}</td>
                      <td className="border border-zinc-300 px-3 py-1.5 font-bold">{w.name}</td>
                      <td className="border border-zinc-300 px-3 py-1.5 text-right font-bold">{w.qty.toLocaleString()}</td>
                      <td className="border border-zinc-300 px-3 py-1.5 text-green-700 font-bold">Commander Authorized</td>
                    </tr>
                  ))}
                  <tr className="bg-zinc-800 text-white font-bold">
                    <td className="border border-zinc-600 px-3 py-1.5" colSpan={2}>TOTAL</td>
                    <td className="border border-zinc-600 px-3 py-1.5 text-right">{totalUnitsRec.toLocaleString()}</td>
                    <td className="border border-zinc-600 px-3 py-1.5">—</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Section 4 — Drone Camera Log */}
            <div className="mb-5">
              <h3 className="font-bold uppercase text-sm border-b border-zinc-400 pb-1 mb-2 tracking-widest">4. Drone Camera & Surveillance Log</h3>
              <div className="font-mono text-xs space-y-1 border border-zinc-300 p-3 bg-zinc-50">
                {rec.droneUnits.map((drone, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="text-zinc-500">[{rec.timestamp}]</span>
                    <span className="font-bold text-zinc-800">{drone}</span>
                    <span className="text-zinc-600">HD Camera Feed — 3 angles recorded — Evidence sealed</span>
                    <span className="ml-auto text-blue-700 font-bold">COURT SEALED</span>
                  </div>
                ))}
                <div className="border-t border-zinc-300 pt-2 mt-2 text-zinc-600">
                  Archive file: <span className="font-bold text-black">{rec.id}.CLA-CLASSIFIED.mp4</span>
                  {" "}— Available for judicial review upon formal court order only.
                </div>
              </div>
            </div>

            {/* Section 5 — Child Safety Confirmation */}
            <div className="mb-5">
              <h3 className="font-bold uppercase text-sm border-b border-zinc-400 pb-1 mb-2 tracking-widest">5. Child Safety Verification</h3>
              <div className="border-l-4 border-green-600 pl-4 py-2 bg-green-50 font-mono text-xs space-y-1">
                <div className="flex items-center gap-2 text-green-800 font-bold text-sm">
                  <CheckCircle className="w-4 h-4" /> SAFETY CLEARANCE CONFIRMED PRIOR TO STRIKE
                </div>
                <div>Child/Victim GPS confirmed at: <strong>{rec.childLat.toFixed(6)}°N, {rec.childLng.toFixed(6)}°W</strong></div>
                <div>Separation from hostile: <strong>{rec.distanceKm.toFixed(3)} km</strong> — Well outside strike radius</div>
                <div>Visual drone confirmation: <strong>Child not in danger zone</strong></div>
                <div>Commander verbal authorization logged: <strong>GRANTED</strong></div>
              </div>
            </div>

            {/* Section 6 — Outcome */}
            <div className="mb-5">
              <h3 className="font-bold uppercase text-sm border-b border-zinc-400 pb-1 mb-2 tracking-widest">6. Mission Outcome</h3>
              <p className="text-zinc-700 leading-loose">
                The hostile target was successfully neutralized at <strong>{rec.timestamp}</strong>.
                The child/victim was recovered safely with no injuries sustained. All drone units returned
                to base following mission completion. The incident has been logged in the CLA Command
                Archive and all footage sealed for court submission pending judicial review.
              </p>
            </div>

            {/* Signatures */}
            <div className="mt-8 pt-4 border-t-2 border-black grid grid-cols-2 gap-8 font-mono text-xs">
              <div className="space-y-6">
                <div>
                  <div className="border-b border-black mb-1 h-8 flex items-end pb-0.5">
                    <span className="italic text-zinc-500 text-base font-serif">Walid Ibrahim</span>
                  </div>
                  <div className="font-bold">Commanding Officer — Walid Ibrahim</div>
                  <div className="text-zinc-600">ID: 000539337 · Level 5 Clearance</div>
                  <div className="text-zinc-600">Date: {reportDate}</div>
                </div>
              </div>
              <div className="space-y-6">
                <div>
                  <div className="border-b border-black mb-1 h-8" />
                  <div className="font-bold">Judicial Authority Signature</div>
                  <div className="text-zinc-600">Court Case Reference: _______________</div>
                  <div className="text-zinc-600">Date Received: _______________</div>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-8 text-center text-[10px] font-mono text-zinc-400 border-t border-zinc-200 pt-3">
              This document is classified under the Canadian Child Protection Intelligence Act.
              Unauthorized reproduction, distribution or access is a criminal offence.
              The Child Lost Agency · Toronto Command Centre · {new Date().getFullYear()}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // ─── Login Gate ─────────────────────────────────────────────────────────────
  if (!isLoggedIn) {
    return (
      <section id="weapons" className="py-16 px-4 border-b border-border bg-background">
        <div className="container mx-auto max-w-md">
          <div className="mb-8 text-center">
            <h2 className="text-3xl font-bold uppercase tracking-tighter mb-2 flex items-center justify-center gap-2">
              <Shield className="text-red-500 w-8 h-8" />
              Commander Weapons Panel
            </h2>
            <p className="text-muted-foreground font-mono text-sm">RESTRICTED — COMMANDER LEVEL CLEARANCE ONLY</p>
          </div>
          <Card className="border-red-900 bg-card">
            <CardHeader className="border-b border-red-900 bg-red-950/20 p-4">
              <CardTitle className="flex items-center gap-2 text-red-500 uppercase text-sm font-mono tracking-widest">
                <Lock className="w-4 h-4" /> Secure Commander Authentication
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div className="space-y-1">
                <Label className="text-xs uppercase font-mono text-muted-foreground">Commander ID</Label>
                <Input value={creds.user} onChange={e => setCreds({ ...creds, user: e.target.value })} placeholder="Enter Commander ID" className="font-mono" />
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase font-mono text-muted-foreground">Access Code</Label>
                <Input type="password" value={creds.pass} onChange={e => setCreds({ ...creds, pass: e.target.value })} placeholder="Enter Access Code" className="font-mono" onKeyDown={e => e.key === "Enter" && handleLogin()} />
              </div>
              {loginError && <p className="text-red-500 font-mono text-xs border border-red-800 bg-red-950/30 p-2">{loginError}</p>}
              <Button onClick={handleLogin} className="w-full uppercase font-mono tracking-widest bg-red-700 hover:bg-red-600">Authenticate</Button>
              <p className="text-[10px] text-muted-foreground font-mono text-center">Unauthorized access attempts are logged and prosecuted.</p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  // ─── Confirmation Modal ──────────────────────────────────────────────────────
  const ConfirmModal = () => (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="bg-card border-2 border-yellow-600 rounded-sm max-w-lg w-full mx-4 overflow-hidden shadow-2xl">
        <div className="bg-yellow-900/40 border-b border-yellow-700 p-4 flex items-center gap-3">
          <AlertTriangle className="w-6 h-6 text-yellow-400 flex-shrink-0" />
          <div>
            <h3 className="text-yellow-300 font-bold uppercase font-mono tracking-widest text-sm">Strike Authorization Required</h3>
            <p className="text-yellow-500/70 font-mono text-[10px]">Confirm hostile is clear of child before proceeding</p>
          </div>
        </div>

        <div className="p-5 space-y-4">
          {/* Visual distance indicator */}
          <div className="bg-black rounded-sm border border-border p-4 font-mono text-xs space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-muted-foreground uppercase text-[10px]">Spatial Safety Confirmation</span>
              <Badge className="bg-green-800 text-green-200 text-[9px]">SAFE DISTANCE</Badge>
            </div>

            {/* Visual separation bar */}
            <div className="relative h-10 flex items-center">
              {/* Child icon */}
              <div className="flex flex-col items-center gap-0.5 z-10">
                <span className="text-xl">👶</span>
                <span className="text-[8px] text-green-400 font-bold">CHILD</span>
              </div>
              {/* Distance line */}
              <div className="flex-1 mx-3 relative h-1 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full">
                <div className="absolute inset-y-0 left-0 right-0 flex items-center justify-center">
                  <div className="bg-black px-2 text-[9px] text-white font-bold border border-yellow-600 rounded whitespace-nowrap">
                    ← {distanceKm.toFixed(2)} km CLEAR →
                  </div>
                </div>
              </div>
              {/* Target icon */}
              <div className="flex flex-col items-center gap-0.5 z-10">
                <span className="text-xl">🎯</span>
                <span className="text-[8px] text-red-400 font-bold">HOSTILE</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-[9px]">
              <div className="bg-green-950/40 border border-green-800 p-2 rounded-sm">
                <div className="text-green-400 font-bold">👶 Child Position</div>
                <div className="text-muted-foreground mt-0.5">{childPos.lat.toFixed(4)}°N</div>
                <div className="text-muted-foreground">{childPos.lng.toFixed(4)}°W</div>
                <div className="text-green-400 mt-1 font-bold">STATUS: SAFE</div>
              </div>
              <div className="bg-red-950/40 border border-red-800 p-2 rounded-sm">
                <div className="text-red-400 font-bold">🎯 Hostile Position</div>
                <div className="text-muted-foreground mt-0.5">{currentTarget.lat.toFixed(4)}°N</div>
                <div className="text-muted-foreground">{currentTarget.lng.toFixed(4)}°W</div>
                <div className="text-red-400 mt-1 font-bold">STATUS: TARGETED</div>
              </div>
            </div>

            <div className="border border-green-800 bg-green-950/20 p-2 rounded-sm text-[9px] text-green-300">
              <CheckCircle className="w-3 h-3 inline mr-1" />
              Child confirmed at safe distance. Strike will not endanger child or bystanders.
            </div>
          </div>

          {/* Weapons summary */}
          <div className="bg-muted/20 border border-border p-3 rounded-sm font-mono text-xs">
            <div className="text-muted-foreground uppercase text-[10px] mb-2">Weapons to deploy:</div>
            {armedWeapons.map(w => (
              <div key={w.id} className="flex justify-between text-[10px]">
                <span>{w.emoji} {w.name}</span>
                <span className="text-yellow-400 font-bold">{formatQty(quantities[w.id])} units</span>
              </div>
            ))}
            <div className="border-t border-border/50 mt-2 pt-2 flex justify-between font-bold">
              <span>Total Units</span>
              <span className="text-red-400">{formatQty(totalUnits)}</span>
            </div>
          </div>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 uppercase font-mono text-xs border-border"
              onClick={() => { setShowConfirm(false); if (targetMarkerRef.current) { targetMarkerRef.current.remove(); targetMarkerRef.current = null; } }}
            >
              Abort Strike
            </Button>
            <Button
              className="flex-1 uppercase font-mono text-xs bg-red-700 hover:bg-red-600 font-bold"
              onClick={handleConfirmStrike}
            >
              ✅ Confirm & Strike
            </Button>
          </div>
        </div>
      </div>
    </div>
  );

  // ─── Commander Panel ─────────────────────────────────────────────────────────
  return (
    <section id="weapons" className="py-16 px-4 border-b border-border bg-background">
      {showConfirm && <ConfirmModal />}

      {reportRecord && <CourtReportModal rec={reportRecord} />}

      <div className="container mx-auto">
        {/* Header */}
        <div className="mb-6 flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-3xl font-bold uppercase tracking-tighter flex items-center gap-2">
              <Shield className="text-red-500 w-8 h-8" />
              Commander Weapons Deployment Panel
            </h2>
            <p className="text-muted-foreground font-mono text-xs mt-1">
              AUTHORIZED: {CMD_USER} · COMMANDER LEVEL · ALL ACTIVITY SEALED FOR COURT
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0 flex-wrap">
            <Button
              variant={activeTab === "deploy" ? "default" : "outline"}
              size="sm"
              className="font-mono uppercase text-xs"
              onClick={() => setActiveTab("deploy")}
            >
              <Crosshair className="w-3 h-3 mr-1" /> Deploy
            </Button>
            <Button
              variant={activeTab === "archive" ? "default" : "outline"}
              size="sm"
              className="font-mono uppercase text-xs"
              onClick={() => setActiveTab("archive")}
            >
              <Archive className="w-3 h-3 mr-1" /> Court Archive ({archive.length})
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="font-mono uppercase text-xs text-red-400 hover:text-red-300 border border-red-900"
              onClick={handleLogout}
            >
              <LogOut className="w-3 h-3 mr-1" /> Logout
            </Button>
          </div>
        </div>

        {/* ─── Archive / Court Video Tab ──────────────────────────────────────── */}
        {activeTab === "archive" && (
          <div className="space-y-4">
            <Card className="border-border bg-card">
              <CardHeader className="p-4 border-b border-border bg-muted/30">
                <CardTitle className="uppercase text-sm font-mono flex items-center gap-2">
                  <Archive className="w-4 h-4 text-blue-400" />
                  Sealed Deployment Archive — Court Evidence Records
                </CardTitle>
                <p className="text-[10px] font-mono text-muted-foreground mt-1">
                  All records are sealed under Commander authority. Access restricted to judicial review.
                </p>
              </CardHeader>
              <CardContent className="p-4">
                {archive.length === 0 ? (
                  <div className="text-center py-12 font-mono">
                    <Archive className="w-10 h-10 text-muted-foreground mx-auto mb-3 opacity-30" />
                    <p className="text-muted-foreground text-sm">No deployments recorded yet.</p>
                    <p className="text-muted-foreground text-xs mt-1">Records will appear here after a strike is authorized.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {archive.map(rec => (
                      <div key={rec.id} className="border border-border rounded-sm overflow-hidden bg-muted/10">
                        {/* Record header */}
                        <div className="flex items-center justify-between bg-muted/30 px-4 py-2 border-b border-border">
                          <span className="font-mono font-bold text-sm text-white">{rec.id}</span>
                          <Badge className="bg-green-700 text-white text-[10px] uppercase">ELIMINATED</Badge>
                        </div>
                        <div className="p-4 grid md:grid-cols-2 gap-4 font-mono text-xs">
                          <div className="space-y-1.5">
                            <div className="text-muted-foreground">Timestamp: <span className="text-white">{rec.timestamp}</span></div>
                            <div className="text-muted-foreground">Drone Units: <span className="text-blue-400">{rec.droneUnits.join(", ")}</span></div>
                            <div className="text-muted-foreground">Hostile: <span className="text-red-400">{rec.targetLat.toFixed(5)}°N, {rec.targetLng.toFixed(5)}°W</span></div>
                            <div className="text-muted-foreground">Child Safe Zone: <span className="text-green-400">{rec.childLat.toFixed(5)}°N, {rec.childLng.toFixed(5)}°W</span></div>
                            <div className="text-muted-foreground">Separation Distance: <span className="text-yellow-400 font-bold">{rec.distanceKm.toFixed(2)} km</span></div>
                          </div>
                          <div className="space-y-1.5">
                            <div className="text-muted-foreground text-[10px] uppercase mb-1">Weapons Deployed:</div>
                            {rec.weapons.map((w, i) => (
                              <div key={i} className="flex justify-between text-[10px]">
                                <span className="text-white">{w.name}</span>
                                <span className="text-yellow-400 font-bold">{formatQty(w.qty)} units</span>
                              </div>
                            ))}
                          </div>
                        </div>
                        {/* Court Video + Report */}
                        <div className="border-t border-border bg-black/40 p-3 space-y-2">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-sm bg-red-900/50 border border-red-700 flex items-center justify-center flex-shrink-0">
                              <Video className="w-4 h-4 text-red-400" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-mono text-[10px] text-white font-bold truncate">{rec.id}.CLA-CLASSIFIED.mp4</div>
                              <div className="font-mono text-[9px] text-muted-foreground">Drone cam feed · 3 angles · HD · Sealed for court</div>
                            </div>
                            <div className="flex gap-2 flex-shrink-0">
                              <Badge className="bg-blue-900 text-blue-300 text-[9px] border border-blue-700">
                                <Eye className="w-2 h-2 mr-1" />COURT VIEW
                              </Badge>
                              <Badge className="bg-zinc-800 text-zinc-400 text-[9px] border border-zinc-700">SEALED</Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            className="w-full font-mono uppercase text-[10px] tracking-widest bg-blue-800 hover:bg-blue-700 h-7"
                            onClick={() => setReportRecord(rec)}
                          >
                            <FileText className="w-3 h-3 mr-1.5" />
                            Generate Court Incident Report
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* ─── Deployment Tab ──────────────────────────────────────────────────── */}
        {activeTab === "deploy" && (
          <div className="grid lg:grid-cols-3 gap-6">

            {/* Map + Camera */}
            <div className="lg:col-span-2 space-y-4">
              {/* Map */}
              <div className="h-[420px] bg-muted border border-border rounded-sm relative overflow-hidden">
                <div ref={mapRef} style={{ position: "absolute", inset: 0, zIndex: 0 }} />

                {/* Status HUD */}
                <div className="absolute top-3 left-3 z-[400]">
                  <div className={`px-3 py-1.5 text-xs font-mono uppercase font-bold border flex items-center gap-2 ${
                    deployStatus === "eliminated" ? "bg-green-900/90 border-green-500 text-green-300" :
                    deployStatus === "deployed"   ? "bg-red-900/90 border-red-500 text-red-300" :
                    deployStatus === "deploying"  ? "bg-yellow-900/90 border-yellow-500 text-yellow-300" :
                    "bg-black/80 border-border text-gray-400"
                  }`}>
                    <span className={`w-2 h-2 rounded-full inline-block ${
                      deployStatus === "eliminated" ? "bg-green-400" :
                      deployStatus === "deployed"   ? "bg-red-400 animate-pulse" :
                      deployStatus === "deploying"  ? "bg-yellow-400 animate-pulse" :
                      "bg-gray-500"
                    }`} />
                    {deployStatus === "idle"       && "Map View — Awaiting Strike Order"}
                    {deployStatus === "deploying"  && "⚡ In Process — Drones Deployed"}
                    {deployStatus === "deployed"   && "🔴 Weapons Engaged — Red Alert"}
                    {deployStatus === "eliminated" && "✅ Target Eliminated"}
                  </div>
                </div>

                {/* Distance badge */}
                <div className="absolute top-3 right-3 z-[400] bg-black/80 border border-green-700 px-3 py-1.5 font-mono text-[10px] text-green-400 flex items-center gap-1">
                  <CheckCircle className="w-3 h-3" />
                  Child {distanceKm.toFixed(1)} km from target — SAFE
                </div>

                {/* Idle overlay */}
                {deployStatus === "idle" && (
                  <div className="absolute bottom-3 left-3 z-[400] bg-black/75 border border-border px-4 py-2 font-mono text-center">
                    <p className="text-yellow-400 uppercase text-xs font-bold">👶 Green = Child Safe Zone · 🎯 Red = Hostile Target</p>
                  </div>
                )}

                {/* Eliminated overlay */}
                {deployStatus === "eliminated" && (
                  <div className="absolute inset-0 z-[400] flex items-center justify-center pointer-events-none">
                    <div className="bg-green-950/90 border-2 border-green-500 px-10 py-6 font-mono text-center">
                      <CheckCircle className="w-12 h-12 text-green-400 mx-auto mb-3" />
                      <p className="text-green-300 uppercase text-lg font-bold tracking-widest">HOSTILE ELIMINATED</p>
                      <p className="text-green-400 text-sm mt-1">Child / Hostage Secure</p>
                      <p className="text-green-500/70 text-xs mt-2">Mission sealed in court archive</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Status bar */}
              {statusMsg && (
                <div className={`p-3 font-mono text-sm border rounded-sm ${
                  deployStatus === "eliminated" ? "bg-green-950/50 border-green-700 text-green-300" :
                  deployStatus === "deployed"   ? "bg-red-950/50 border-red-700 text-red-300" :
                  "bg-yellow-950/50 border-yellow-700 text-yellow-300"
                }`}>{statusMsg}</div>
              )}

              {/* Drone Camera Feeds */}
              {showCamera && (
                <Card className="border-border bg-black">
                  <CardHeader className="p-3 border-b border-zinc-800 bg-zinc-950">
                    <CardTitle className="uppercase text-xs font-mono flex items-center justify-between text-green-400">
                      <div className="flex items-center gap-2">
                        <Video className="w-3 h-3 text-red-500" />
                        Live Drone Surveillance — 3-Camera Authentication Feed
                      </div>
                      <span className={`text-[9px] px-2 py-0.5 border font-bold ${cameraPhase === 2 ? "border-blue-600 text-blue-400 bg-blue-950/40" : "border-red-700 text-red-400 bg-red-950/40 animate-pulse"}`}>
                        {cameraPhase === 2 ? "■ SEALED FOR COURT" : "● RECORDING"}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <div className="grid grid-cols-3 border-t border-zinc-800">

                      {/* ── CAM-1 FALCON-1: CHILD SAFE ZONE ── */}
                      <div className="relative bg-black h-52 border-r border-zinc-800 overflow-hidden">
                        {/* CRT scanlines */}
                        <div className="absolute inset-0 pointer-events-none z-10" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,255,100,0.03) 2px,rgba(0,255,100,0.03) 4px)" }} />
                        {/* Green tint — child safe */}
                        <div className="absolute inset-0 opacity-20" style={{ background: cameraPhase === 2 ? "#22c55e" : "#16a34a" }} />

                        {/* Child scene */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                          {/* Safe zone circle */}
                          <div className="relative">
                            <div className="w-16 h-16 border-2 border-green-400 rounded-full opacity-40 absolute inset-0"
                              style={{ animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite" }} />
                            <div className="w-16 h-16 border border-green-500 rounded-full flex items-center justify-center relative z-10">
                              <span className="text-3xl">👶</span>
                            </div>
                          </div>
                          {/* Safe pulse ring */}
                          <div className={`text-[10px] font-mono font-bold px-2 py-0.5 border rounded-sm ${
                            cameraPhase === 2 ? "border-green-500 text-green-300 bg-green-900/50" : "border-green-600 text-green-400 bg-green-950/60"
                          }`}>
                            {cameraPhase === 2 ? "✅ CHILD RECOVERED" : "✅ CHILD — SAFE ZONE"}
                          </div>
                        </div>

                        {/* Corner brackets */}
                        {["top-1 left-1","top-1 right-1","bottom-1 left-1","bottom-1 right-1"].map((pos, j) => (
                          <div key={j} className={`absolute ${pos} w-3 h-3 border-green-500 opacity-70`}
                            style={{ borderTop: j<2?"2px solid":"none", borderBottom: j>=2?"2px solid":"none", borderLeft: j%2===0?"2px solid":"none", borderRight: j%2===1?"2px solid":"none" }} />
                        ))}

                        {/* GPS label */}
                        <div className="absolute top-2 left-2 font-mono text-[7px] text-green-400/70 z-20">
                          <div>FALCON-1 · CAM-1</div>
                          <div>{childPos.lat.toFixed(4)}°N</div>
                          <div>{childPos.lng.toFixed(4)}°W</div>
                        </div>

                        <div className="absolute top-2 right-2 font-mono text-[8px] z-20">
                          {cameraPhase < 2
                            ? <span className="text-red-500 animate-pulse">● REC</span>
                            : <span className="text-blue-400">■ SEALED</span>}
                        </div>

                        {/* Bottom status */}
                        <div className="absolute bottom-0 left-0 right-0 bg-green-900/60 border-t border-green-800 px-2 py-1 font-mono text-[9px] text-green-300 font-bold text-center z-20">
                          CHILD LOCATION — {distanceKm.toFixed(2)} km FROM HOSTILE
                        </div>
                      </div>

                      {/* ── CAM-2 HAWK-2: HOSTILE TARGET ── */}
                      <div className="relative bg-black h-52 border-r border-zinc-800 overflow-hidden">
                        {/* CRT scanlines */}
                        <div className="absolute inset-0 pointer-events-none z-10" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(255,50,50,0.04) 2px,rgba(255,50,50,0.04) 4px)" }} />
                        {/* Red tint — hostile */}
                        <div className="absolute inset-0 opacity-20" style={{
                          background: cameraPhase === 2 ? "#22c55e" : cameraPhase === 1 ? "#cc0000" : "#b45309"
                        }} />

                        {/* Hostile targeting scene */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-1">
                          <div className="relative w-20 h-20">
                            {/* Outer ring pulse */}
                            {cameraPhase === 1 && (
                              <div className="absolute inset-0 border-2 border-red-500 rounded-full opacity-60"
                                style={{ animation: "ping 0.8s cubic-bezier(0,0,0.2,1) infinite" }} />
                            )}
                            {/* Main reticle */}
                            <div className={`absolute inset-2 border-2 rounded-full ${cameraPhase === 2 ? "border-green-400" : "border-red-500"} opacity-90`} />
                            {/* Inner dot */}
                            <div className={`absolute inset-0 flex items-center justify-center`}>
                              {cameraPhase === 2
                                ? <span className="text-3xl">💀</span>
                                : <span className="text-3xl">🎯</span>}
                            </div>
                            {/* Crosshair lines */}
                            <div className={`absolute top-1/2 left-0 right-0 h-px ${cameraPhase === 2 ? "bg-green-500" : "bg-red-500"} opacity-80`} />
                            <div className={`absolute top-0 bottom-0 left-1/2 w-px ${cameraPhase === 2 ? "bg-green-500" : "bg-red-500"} opacity-80`} />
                            {/* Corner ticks */}
                            {[[0,0],[0,1],[1,0],[1,1]].map(([r,c],k)=>(
                              <div key={k} className={`absolute w-2 h-2 ${cameraPhase===2?"border-green-500":"border-red-500"} opacity-80`}
                                style={{ top: r ? "auto":"2px", bottom: r ? "2px":"auto", left: c ? "auto":"2px", right: c ? "2px":"auto",
                                  borderTop: !r?"2px solid":"none", borderBottom: r?"2px solid":"none", borderLeft: !c?"2px solid":"none", borderRight: c?"2px solid":"none" }} />
                            ))}
                          </div>
                          <div className={`text-[10px] font-mono font-bold px-2 py-0.5 border rounded-sm ${
                            cameraPhase === 2 ? "border-green-500 text-green-300 bg-green-900/50" :
                            cameraPhase === 1 ? "border-red-500 text-red-300 bg-red-950/60 animate-pulse" :
                            "border-yellow-600 text-yellow-300 bg-yellow-950/50"
                          }`}>
                            {cameraPhase === 2 ? "✅ HOSTILE ELIMINATED" :
                             cameraPhase === 1 ? "⚡ ENGAGING TARGET" :
                             "🎯 TARGET LOCKED"}
                          </div>
                        </div>

                        {/* Corner brackets */}
                        {["top-1 left-1","top-1 right-1","bottom-1 left-1","bottom-1 right-1"].map((pos, j) => (
                          <div key={j} className={`absolute ${pos} w-3 h-3 ${cameraPhase===2?"border-green-500":"border-red-500"} opacity-70`}
                            style={{ borderTop: j<2?"2px solid":"none", borderBottom: j>=2?"2px solid":"none", borderLeft: j%2===0?"2px solid":"none", borderRight: j%2===1?"2px solid":"none" }} />
                        ))}

                        <div className="absolute top-2 left-2 font-mono text-[7px] text-red-400/70 z-20">
                          <div>HAWK-2 · CAM-2</div>
                          <div>{currentTarget.lat.toFixed(4)}°N</div>
                          <div>{currentTarget.lng.toFixed(4)}°W</div>
                        </div>
                        <div className="absolute top-2 right-2 font-mono text-[8px] z-20">
                          {cameraPhase < 2
                            ? <span className="text-red-500 animate-pulse">● REC</span>
                            : <span className="text-blue-400">■ SEALED</span>}
                        </div>

                        <div className={`absolute bottom-0 left-0 right-0 px-2 py-1 font-mono text-[9px] font-bold text-center z-20 border-t ${
                          cameraPhase === 2 ? "bg-green-900/60 border-green-800 text-green-300" :
                          cameraPhase === 1 ? "bg-red-900/60 border-red-800 text-red-300" :
                          "bg-yellow-950/60 border-yellow-900 text-yellow-300"
                        }`}>
                          HOSTILE TARGET — {cameraPhase === 2 ? "NEUTRALIZED" : cameraPhase === 1 ? "UNDER FIRE" : "ACQUIRED"}
                        </div>
                      </div>

                      {/* ── CAM-3 EAGLE-3: DISTANCE VERIFICATION ── */}
                      <div className="relative bg-black h-52 overflow-hidden">
                        {/* CRT scanlines */}
                        <div className="absolute inset-0 pointer-events-none z-10" style={{ backgroundImage: "repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(100,150,255,0.04) 2px,rgba(100,150,255,0.04) 4px)" }} />
                        <div className="absolute inset-0 opacity-15" style={{ background: cameraPhase === 2 ? "#22c55e" : "#1d4ed8" }} />

                        {/* Distance verification scene */}
                        <div className="absolute inset-0 flex flex-col items-center justify-center px-3 gap-2 z-20">
                          <div className="text-[8px] font-mono text-blue-300 font-bold uppercase tracking-widest mb-0.5">
                            Safety Separation Verification
                          </div>

                          {/* Visual distance bar */}
                          <div className="w-full flex items-center gap-1">
                            {/* Child side */}
                            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                              <span className="text-xl">👶</span>
                              <span className="text-[7px] font-mono text-green-400 font-bold">SAFE</span>
                            </div>

                            {/* Distance bar */}
                            <div className="flex-1 relative">
                              <div className="h-1.5 bg-gradient-to-r from-green-500 via-yellow-400 to-red-500 rounded-full opacity-80" />
                              <div className="absolute inset-x-0 -top-3 flex justify-center">
                                <div className="bg-black border border-blue-600 px-1.5 py-0.5 text-[8px] font-mono text-blue-300 font-bold whitespace-nowrap">
                                  {distanceKm.toFixed(2)} km
                                </div>
                              </div>
                            </div>

                            {/* Hostile side */}
                            <div className="flex flex-col items-center gap-0.5 flex-shrink-0">
                              <span className="text-xl">{cameraPhase === 2 ? "💀" : "👿"}</span>
                              <span className="text-[7px] font-mono text-red-400 font-bold">TARGET</span>
                            </div>
                          </div>

                          {/* Coordinate comparison */}
                          <div className="w-full grid grid-cols-2 gap-1 mt-1">
                            <div className="bg-green-950/60 border border-green-800 rounded-sm p-1.5 font-mono text-[7px]">
                              <div className="text-green-400 font-bold mb-0.5">👶 Child GPS</div>
                              <div className="text-green-300/80">{childPos.lat.toFixed(4)}°N</div>
                              <div className="text-green-300/80">{childPos.lng.toFixed(4)}°W</div>
                              <div className="text-green-400 font-bold mt-0.5">NOT IN ZONE ✓</div>
                            </div>
                            <div className="bg-red-950/60 border border-red-800 rounded-sm p-1.5 font-mono text-[7px]">
                              <div className="text-red-400 font-bold mb-0.5">🎯 Hostile GPS</div>
                              <div className="text-red-300/80">{currentTarget.lat.toFixed(4)}°N</div>
                              <div className="text-red-300/80">{currentTarget.lng.toFixed(4)}°W</div>
                              <div className={`font-bold mt-0.5 ${cameraPhase===2?"text-green-400":"text-red-400"}`}>
                                {cameraPhase===2 ? "ELIMINATED ✓" : "STRIKE ZONE"}
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Corner brackets */}
                        {["top-1 left-1","top-1 right-1","bottom-1 left-1","bottom-1 right-1"].map((pos, j) => (
                          <div key={j} className="absolute w-3 h-3 border-blue-500 opacity-70"
                            style={{ top: j<2?"4px":"auto", bottom: j>=2?"4px":"auto", left: j%2===0?"4px":"auto", right: j%2===1?"4px":"auto",
                              borderTop: j<2?"2px solid":"none", borderBottom: j>=2?"2px solid":"none", borderLeft: j%2===0?"2px solid":"none", borderRight: j%2===1?"2px solid":"none" }} />
                        ))}

                        <div className="absolute top-2 left-2 font-mono text-[7px] text-blue-400/70 z-20">
                          EAGLE-3 · CAM-3
                        </div>
                        <div className="absolute top-2 right-2 font-mono text-[8px] z-20">
                          {cameraPhase < 2
                            ? <span className="text-red-500 animate-pulse">● REC</span>
                            : <span className="text-blue-400">■ SEALED</span>}
                        </div>

                        <div className={`absolute bottom-0 left-0 right-0 px-2 py-1 font-mono text-[9px] font-bold text-center z-20 border-t ${
                          cameraPhase === 2 ? "bg-green-900/60 border-green-800 text-green-300" : "bg-blue-950/60 border-blue-900 text-blue-300"
                        }`}>
                          {cameraPhase === 2 ? "✅ CHILD SAFE — MISSION COMPLETE" : "SAFETY AUTH: CHILD CLEAR OF STRIKE ZONE"}
                        </div>
                      </div>

                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* Right Sidebar */}
            <div className="space-y-4">
              {/* Weapon quantity inputs */}
              <Card className="border-red-900/60 bg-card">
                <CardHeader className="p-4 border-b border-red-900/50 bg-red-950/20">
                  <CardTitle className="uppercase text-sm font-bold font-mono text-red-400 flex items-center gap-2">
                    <Crosshair className="w-4 h-4" /> Attack Mode — Set Quantities
                  </CardTitle>
                  <p className="text-[10px] font-mono text-muted-foreground mt-1">
                    Enter units per weapon (1 – 10,000,000,000)
                  </p>
                </CardHeader>
                <CardContent className="p-3 space-y-3">
                  {WEAPONS.map(w => {
                    const qty = quantities[w.id];
                    const armed = qty > 0;
                    return (
                      <div key={w.id} className={`border rounded-sm p-2.5 transition-all ${armed ? "border-red-700 bg-red-900/20" : "border-border bg-muted/10"}`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-base leading-none">{w.emoji}</span>
                          <div className="flex-1 min-w-0">
                            <div className="font-mono font-bold uppercase text-[11px] flex items-center gap-1">
                              {w.name}
                              {armed && <span className="text-green-400 text-[9px] font-bold ml-1">✓ ARMED</span>}
                            </div>
                            <div className="text-[9px] opacity-50 truncate">{w.desc}</div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <input
                            type="number"
                            min={0}
                            max={MAX_QTY}
                            value={qty || ""}
                            placeholder="0"
                            onChange={e => setQty(w.id, e.target.value)}
                            disabled={deployStatus !== "idle"}
                            className="flex-1 bg-background border border-border rounded-sm px-2 py-1 text-xs font-mono text-white text-right disabled:opacity-40 focus:border-red-600 outline-none"
                          />
                          <span className="text-[10px] font-mono text-muted-foreground">units</span>
                          {qty > 0 && (
                            <span className="text-[10px] font-mono text-yellow-400 font-bold min-w-8 text-right">
                              {formatQty(qty)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </CardContent>
              </Card>

              {/* Deploy Summary + Button */}
              <Card className="border-border bg-card">
                <CardContent className="p-4 space-y-3 font-mono text-xs">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground uppercase">Weapons Armed</span>
                    <span className="text-white">{armedWeapons.length} / {WEAPONS.length}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground uppercase">Total Units</span>
                    <span className="text-yellow-400 font-bold">{formatQty(totalUnits)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground uppercase">Child Safe Distance</span>
                    <span className="text-green-400 font-bold">{distanceKm.toFixed(2)} km</span>
                  </div>

                  <div className={`p-2 border rounded-sm text-[10px] flex items-center gap-2 ${
                    distanceKm > 1
                      ? "border-green-800 bg-green-950/30 text-green-400"
                      : "border-red-800 bg-red-950/30 text-red-400"
                  }`}>
                    <CheckCircle className="w-3 h-3 flex-shrink-0" />
                    {distanceKm > 1
                      ? "Child confirmed safe — strike authorized"
                      : "WARNING: Child too close — abort recommended"}
                  </div>

                  <Button
                    onClick={handleRequestStrike}
                    disabled={!armedWeapons.length || deployStatus !== "idle"}
                    className={`w-full uppercase font-mono tracking-widest text-sm ${
                      deployStatus === "eliminated" ? "bg-green-700 hover:bg-green-600" : "bg-red-700 hover:bg-red-600"
                    } disabled:opacity-40`}
                  >
                    {deployStatus === "idle"       && "🚀 Request Strike Authority"}
                    {deployStatus === "deploying"  && "⚡ In Process..."}
                    {deployStatus === "deployed"   && "🔴 Engaging Hostile..."}
                    {deployStatus === "eliminated" && "✅ Mission Complete"}
                  </Button>

                  {deployStatus === "idle" && (
                    <p className="text-[9px] text-muted-foreground text-center leading-relaxed">
                      A visual confirmation screen will appear before strike.<br />
                      All footage archived automatically for court review.
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Target info */}
              <Card className="border-border bg-card">
                <CardHeader className="p-3 border-b border-border bg-muted/20">
                  <CardTitle className="uppercase text-xs font-mono text-muted-foreground">Target Intel</CardTitle>
                </CardHeader>
                <CardContent className="p-3 font-mono text-xs space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hostile Lat</span>
                    <span className="text-red-400">{currentTarget.lat.toFixed(5)}°N</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Hostile Lng</span>
                    <span className="text-red-400">{currentTarget.lng.toFixed(5)}°W</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Child Lat</span>
                    <span className="text-green-400">{childPos.lat.toFixed(5)}°N</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Child Lng</span>
                    <span className="text-green-400">{childPos.lng.toFixed(5)}°W</span>
                  </div>
                  <div className="flex justify-between pt-1 border-t border-border/50">
                    <span className="text-muted-foreground">Status</span>
                    <span className={
                      deployStatus === "eliminated" ? "text-green-400" :
                      deployStatus !== "idle" ? "text-red-400 animate-pulse" :
                      "text-yellow-400"
                    }>
                      {deployStatus === "idle" ? "ACQUIRED" :
                       deployStatus === "deploying" ? "IN PROCESS" :
                       deployStatus === "deployed" ? "ENGAGED" : "ELIMINATED"}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
