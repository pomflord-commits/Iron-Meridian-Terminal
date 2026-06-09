import { useState, useEffect, useRef, useCallback } from "react";

// ═══════════════════════════════════════════════════════════════════════════════
// BLUEPRINT RENDERER SYSTEM
// Architecture: Blueprint JSON → Renderer → SVG
// Each renderer receives a blueprint object and produces SVG geometry.
// The AI never generates raw SVG — it generates structured data only.
// Future renderers can be registered here without touching the rest of the app.
// ═══════════════════════════════════════════════════════════════════════════════

// ── Shared SVG defs injected into every blueprint ─────────────────────────────
const BpDefs = () => (
  <defs>
    <filter id="bp-glow"><feGaussianBlur stdDeviation="2" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <filter id="bp-glow-strong"><feGaussianBlur stdDeviation="4" result="b"/><feMerge><feMergeNode in="b"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <radialGradient id="bp-holo" cx="50%" cy="50%" r="50%">
      <stop offset="0%" stopColor="#cc2200" stopOpacity="0.09"/>
      <stop offset="100%" stopColor="#cc2200" stopOpacity="0"/>
    </radialGradient>
  </defs>
);

// ── Blueprint grid background ─────────────────────────────────────────────────
const BpGrid = ({ w = 300, h = 340 }) => (
  <>
    <rect width={w} height={h} fill="url(#bp-holo)"/>
    {Array.from({length: Math.ceil(h/20)+1}).map((_,i) =>
      <line key={`h${i}`} x1="0" y1={i*20} x2={w} y2={i*20} stroke="#cc2200" strokeWidth="0.15" opacity="0.2"/>)}
    {Array.from({length: Math.ceil(w/20)+1}).map((_,i) =>
      <line key={`v${i}`} x1={i*20} y1="0" x2={i*20} y2={h} stroke="#cc2200" strokeWidth="0.15" opacity="0.2"/>)}
  </>
);

// ── Blueprint frame wrapper ───────────────────────────────────────────────────
const BpFrame = ({ viewBox, w, h, children }) => (
  <svg viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg" className="blueprint-svg">
    <BpDefs/>
    <BpGrid w={w} h={h}/>
    {children}
  </svg>
);

// ── Label with leader line (callout) ─────────────────────────────────────────
const BpCallout = ({ x, y, lx, ly, text, text2, anchor = "start" }) => (
  <g>
    <line x1={x} y1={y} x2={lx} y2={ly} stroke="#cc2200" strokeWidth="0.6" opacity="0.6"/>
    <text x={lx + (anchor==="end"?-3:3)} y={ly - 2} fill="#cc2200" fontSize="7" fontFamily="monospace"
      textAnchor={anchor} opacity="0.85">{text}</text>
    {text2 && <text x={lx + (anchor==="end"?-3:3)} y={ly + 7} fill="#cc2200" fontSize="7" fontFamily="monospace"
      textAnchor={anchor} opacity="0.85">{text2}</text>}
  </g>
);

// ═══════════════════════════════════════════════════════════════════════════════
// RENDERERS — one per blueprint type
// Each exports: render(blueprint, view) → JSX inside a BpFrame
// ═══════════════════════════════════════════════════════════════════════════════

// ── MECH renderer ─────────────────────────────────────────────────────────────
const renderMech = (bp, view) => {
  const name    = bp?.name    || "UNKNOWN UNIT";
  const sys     = bp?.systems || [];
  const feats   = bp?.features|| [];
  const all     = [...sys, ...feats];

  if (view === "top") return (
    <BpFrame viewBox="0 0 300 300" w={300} h={300}>
      {/* Top-down view */}
      <ellipse cx="150" cy="150" rx="55" ry="40" stroke="#cc2200" strokeWidth="1.5" fill="none" filter="url(#bp-glow)"/>
      <ellipse cx="150" cy="150" rx="28" ry="22" stroke="#cc2200" strokeWidth="0.7" fill="#cc22000a"/>
      {/* Shoulder pods */}
      <ellipse cx="90"  cy="150" rx="20" ry="12" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
      <ellipse cx="210" cy="150" rx="20" ry="12" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
      {/* Arms */}
      <rect x="58"  y="142" width="30" height="16" rx="2" stroke="#cc2200" strokeWidth="1" fill="none"/>
      <rect x="212" y="142" width="30" height="16" rx="2" stroke="#cc2200" strokeWidth="1" fill="none"/>
      {/* Feet */}
      <ellipse cx="126" cy="210" rx="16" ry="10" stroke="#cc2200" strokeWidth="1" fill="none"/>
      <ellipse cx="174" cy="210" rx="16" ry="10" stroke="#cc2200" strokeWidth="1" fill="none"/>
      <line x1="126" y1="190" x2="126" y2="200" stroke="#cc2200" strokeWidth="0.8"/>
      <line x1="174" y1="190" x2="174" y2="200" stroke="#cc2200" strokeWidth="0.8"/>
      {/* Head circle */}
      <ellipse cx="150" cy="100" rx="22" ry="16" stroke="#cc2200" strokeWidth="1.2" fill="none" filter="url(#bp-glow)"/>
      <circle  cx="150" cy="100" r="6" stroke="#cc2200" strokeWidth="0.6" fill="#cc220025"/>
      <line x1="150" y1="100" x2="150" y2="110" stroke="#cc2200" strokeWidth="0.8"/>
      {/* Centre dot */}
      <circle cx="150" cy="150" r="4" fill="#cc2200" opacity="0.7"/>
      {/* Cross-hairs */}
      <line x1="150" y1="10" x2="150" y2="290" stroke="#cc2200" strokeWidth="0.3" strokeDasharray="4 6" opacity="0.3"/>
      <line x1="10" y1="150" x2="290" y2="150" stroke="#cc2200" strokeWidth="0.3" strokeDasharray="4 6" opacity="0.3"/>
    </BpFrame>
  );

  if (view === "rear") return (
    <BpFrame viewBox="0 0 300 340" w={300} h={340}>
      {/* Mirror of front — simplified rear */}
      <rect x="110" y="12" width="80" height="52" rx="2" stroke="#cc2200" strokeWidth="1.2" fill="none" filter="url(#bp-glow)"/>
      <rect x="122" y="22" width="22" height="14" rx="1" stroke="#cc2200" strokeWidth="0.8" fill="#cc220018"/>
      <rect x="156" y="22" width="22" height="14" rx="1" stroke="#cc2200" strokeWidth="0.8" fill="#cc220018"/>
      <line x1="110" y1="44" x2="190" y2="44" stroke="#cc2200" strokeWidth="0.6"/>
      {/* Neck */}
      <rect x="132" y="64" width="36" height="16" stroke="#cc2200" strokeWidth="1" fill="none"/>
      {/* Torso with exhaust ports */}
      <rect x="80" y="80" width="140" height="100" rx="2" stroke="#cc2200" strokeWidth="1.5" fill="none" filter="url(#bp-glow)"/>
      {[0,1,2,3].map(i=><rect key={i} x={100+i*22} y="90" width="14" height="28" rx="1" stroke="#cc2200" strokeWidth="0.7" fill="#cc22000a"/>)}
      {/* Jump jet pods on shoulders */}
      <rect x="28"  y="82" width="50" height="36" rx="2" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
      <rect x="222" y="82" width="50" height="36" rx="2" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
      {[34,42,50].map(x=><ellipse key={x} cx={x} cy="118" rx="5" ry="4" stroke="#cc2200" strokeWidth="0.8" fill="#cc220020"/>)}
      {[228,236,244].map(x=><ellipse key={x} cx={x} cy="118" rx="5" ry="4" stroke="#cc2200" strokeWidth="0.8" fill="#cc220020"/>)}
      {/* Arms */}
      <rect x="22"  y="118" width="34" height="80" rx="2" stroke="#cc2200" strokeWidth="1" fill="none"/>
      <rect x="244" y="118" width="34" height="80" rx="2" stroke="#cc2200" strokeWidth="1" fill="none"/>
      {/* Hips */}
      <rect x="98" y="180" width="104" height="28" rx="1" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
      {/* Legs */}
      <rect x="100" y="208" width="44" height="96" rx="2" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
      <rect x="156" y="208" width="44" height="96" rx="2" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
      <rect x="92"  y="304" width="60" height="20" rx="1" stroke="#cc2200" strokeWidth="1" fill="none"/>
      <rect x="148" y="304" width="60" height="20" rx="1" stroke="#cc2200" strokeWidth="1" fill="none"/>
    </BpFrame>
  );

  if (view === "side") return (
    <BpFrame viewBox="0 0 300 340" w={300} h={340}>
      {/* Side profile */}
      {/* Head */}
      <rect x="100" y="12" width="90" height="52" rx="2" stroke="#cc2200" strokeWidth="1.2" fill="none" filter="url(#bp-glow)"/>
      <rect x="114" y="24" width="22" height="14" rx="1" stroke="#cc2200" strokeWidth="0.8" fill="#cc220018"/>
      {/* Neck */}
      <rect x="130" y="64" width="30" height="16" stroke="#cc2200" strokeWidth="1" fill="none"/>
      {/* Torso */}
      <rect x="90" y="80" width="130" height="100" rx="2" stroke="#cc2200" strokeWidth="1.5" fill="none" filter="url(#bp-glow)"/>
      {/* Arm (single visible) */}
      <rect x="30"  y="92" width="58" height="36" rx="2" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
      <rect x="22"  y="118" width="34" height="80" rx="2" stroke="#cc2200" strokeWidth="1" fill="none"/>
      <rect x="14"  y="162" width="22" height="52" rx="1" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
      {/* Core reactor */}
      <ellipse cx="155" cy="130" rx="28" ry="28" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
      <ellipse cx="155" cy="130" rx="14" ry="14" stroke="#cc2200" strokeWidth="0.6" fill="#cc220020"/>
      <circle  cx="155" cy="130" r="4" fill="#cc2200" opacity="0.8"/>
      {/* Hips */}
      <rect x="110" y="180" width="110" height="28" rx="1" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
      {/* Leg */}
      <rect x="120" y="208" width="70" height="96" rx="2" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
      <line  x1="120" y1="256" x2="190" y2="256" stroke="#cc2200" strokeWidth="0.5"/>
      {/* Foot */}
      <rect x="110" y="304" width="90" height="20" rx="1" stroke="#cc2200" strokeWidth="1" fill="none"/>
      {/* Dimension line */}
      <line x1="235" y1="12" x2="235" y2="324" stroke="#cc2200" strokeWidth="0.5" opacity="0.5"/>
      <line x1="229" y1="12"  x2="241" y2="12"  stroke="#cc2200" strokeWidth="0.5" opacity="0.5"/>
      <line x1="229" y1="324" x2="241" y2="324" stroke="#cc2200" strokeWidth="0.5" opacity="0.5"/>
    </BpFrame>
  );

  // Default: FRONT view with callouts
  return (
    <BpFrame viewBox="0 0 300 340" w={300} h={340}>
      {/* Head */}
      <rect x="110" y="12" width="80" height="52" rx="2" stroke="#cc2200" strokeWidth="1.2" fill="none" filter="url(#bp-glow)"/>
      <rect x="120" y="22" width="22" height="14" rx="1" stroke="#cc2200" strokeWidth="0.8" fill="#cc220018"/>
      <rect x="158" y="22" width="22" height="14" rx="1" stroke="#cc2200" strokeWidth="0.8" fill="#cc220018"/>
      <line x1="110" y1="44" x2="190" y2="44" stroke="#cc2200" strokeWidth="0.6"/>
      <line x1="150" y1="12" x2="150" y2="2" stroke="#cc2200" strokeWidth="0.8"/>
      <polygon points="140,2 150,2 150,10 140,10" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
      {/* Neck */}
      <rect x="132" y="64" width="36" height="16" stroke="#cc2200" strokeWidth="1" fill="none"/>
      {/* Torso */}
      <rect x="82" y="80" width="136" height="100" rx="2" stroke="#cc2200" strokeWidth="1.5" fill="none" filter="url(#bp-glow)"/>
      <rect x="100" y="92" width="100" height="68" rx="1" stroke="#cc2200" strokeWidth="0.6" fill="#cc22000a"/>
      <line x1="150" y1="80" x2="150" y2="180" stroke="#cc2200" strokeWidth="0.5"/>
      <circle cx="150" cy="128" r="26" stroke="#cc2200" strokeWidth="0.8" fill="none" filter="url(#bp-glow)"/>
      <circle cx="150" cy="128" r="13" stroke="#cc2200" strokeWidth="0.6" fill="#cc220025"/>
      <circle cx="150" cy="128" r="4" fill="#cc2200" opacity="0.8"/>
      {/* Shoulders */}
      <rect x="28"  y="84" width="52" height="36" rx="2" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
      <polygon points="28,102 6,94 6,112 28,118" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
      <rect x="220" y="84" width="52" height="36" rx="2" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
      <polygon points="272,102 294,94 294,112 272,118" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
      {/* Arms */}
      <rect x="18"  y="120" width="36" height="84" rx="2" stroke="#cc2200" strokeWidth="1" fill="none"/>
      <rect x="4"   y="164" width="20" height="60" rx="1" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
      <line x1="18" y1="156" x2="54" y2="156" stroke="#cc2200" strokeWidth="0.5"/>
      <rect x="246" y="120" width="36" height="84" rx="2" stroke="#cc2200" strokeWidth="1" fill="none"/>
      <rect x="276" y="164" width="20" height="60" rx="1" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
      <line x1="246" y1="156" x2="282" y2="156" stroke="#cc2200" strokeWidth="0.5"/>
      {/* Claws */}
      {[0,1,2,3].map(i=><line key={i}   x1={6+i*4}   y1="224" x2={4+i*4}   y2="238" stroke="#cc2200" strokeWidth="0.8"/>)}
      {[0,1,2,3].map(i=><line key={i+4} x1={278+i*4} y1="224" x2={276+i*4} y2="238" stroke="#cc2200" strokeWidth="0.8"/>)}
      {/* Hips */}
      <rect x="100" y="180" width="100" height="28" rx="1" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
      {/* Legs */}
      <rect x="102" y="208" width="44" height="96" rx="2" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
      <line x1="102" y1="256" x2="146" y2="256" stroke="#cc2200" strokeWidth="0.5"/>
      <rect x="154" y="208" width="44" height="96" rx="2" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
      <line x1="154" y1="256" x2="198" y2="256" stroke="#cc2200" strokeWidth="0.5"/>
      {/* Feet */}
      <rect x="92"  y="304" width="60" height="20" rx="1" stroke="#cc2200" strokeWidth="1" fill="none"/>
      <rect x="148" y="304" width="60" height="20" rx="1" stroke="#cc2200" strokeWidth="1" fill="none"/>
      {/* Dimension */}
      <line x1="300" y1="12" x2="300" y2="324" stroke="#cc2200" strokeWidth="0.5" opacity="0.5"/>
      <line x1="294" y1="12"  x2="306" y2="12"  stroke="#cc2200" strokeWidth="0.5" opacity="0.5"/>
      <line x1="294" y1="324" x2="306" y2="324" stroke="#cc2200" strokeWidth="0.5" opacity="0.5"/>
      <text x="292" y="168" fill="#cc2200" fontSize="7" fontFamily="monospace" opacity="0.7" transform="rotate(-90,292,168)">{bp?.height||"4.2m"}</text>
      {/* Dynamic callouts from systems */}
      {all[0] && <BpCallout x={110} y={36}  lx={60}  ly={36}  text={all[0].toUpperCase().slice(0,12)} anchor="end"/>}
      {all[1] && <BpCallout x={150} y={104} lx={60}  ly={90}  text={all[1].toUpperCase().slice(0,12)} anchor="end"/>}
      {all[2] && <BpCallout x={120} y={256} lx={60}  ly={256} text={all[2].toUpperCase().slice(0,12)} anchor="end"/>}
      {all[3] && <BpCallout x={190} y={36}  lx={248} ly={36}  text={all[3].toUpperCase().slice(0,12)} anchor="start"/>}
      {all[4] && <BpCallout x={218} y={104} lx={258} ly={90}  text={all[4].toUpperCase().slice(0,12)} anchor="start"/>}
      {all[5] && <BpCallout x={180} y={256} lx={248} ly={256} text={all[5].toUpperCase().slice(0,12)} anchor="start"/>}
    </BpFrame>
  );
};

// ── SERVER renderer ───────────────────────────────────────────────────────────
const renderServer = (bp, view) => {
  const rows = 6;
  return (
    <BpFrame viewBox="0 0 300 300" w={300} h={300}>
      <rect x="10" y="10" width="280" height="280" stroke="#cc2200" strokeWidth="0.8" fill="none" strokeDasharray="6 4"/>
      {Array.from({length:rows}).map((_,i)=>(
        <g key={i}>
          <rect x="24" y={24+i*42} width="252" height="30" rx="1" stroke="#cc2200" strokeWidth="1.2" fill="none" filter={i===0?"url(#bp-glow)":undefined}/>
          <rect x="32" y={30+i*42} width="10" height="18" rx="1" stroke="#cc2200" strokeWidth="0.6" fill="#cc220022"/>
          <rect x="48" y={30+i*42} width="10" height="18" rx="1" stroke="#cc2200" strokeWidth="0.6" fill="#cc220022"/>
          <line x1="68" y1={39+i*42} x2="240" y2={39+i*42} stroke="#cc2200" strokeWidth="0.4" strokeDasharray="5 3" opacity="0.6"/>
          <circle cx="254" cy={39+i*42} r="6" stroke="#cc2200" strokeWidth="0.8" fill={i%2===0?"#cc220040":"none"}/>
          <circle cx="254" cy={39+i*42} r="2" fill={i%2===0?"#cc2200":"none"} opacity="0.8"/>
        </g>
      ))}
    </BpFrame>
  );
};

// ── CASTLE renderer ───────────────────────────────────────────────────────────
const renderCastle = (bp, view) => (
  <BpFrame viewBox="0 0 300 320" w={300} h={320}>
    {/* Main keep */}
    <rect x="90" y="90" width="120" height="200" stroke="#cc2200" strokeWidth="1.5" fill="none" filter="url(#bp-glow)"/>
    {/* Battlements top */}
    {[90,106,122,138,154,170,186].map((x,i)=>i%2===0&&<rect key={x} x={x} y="76" width="14" height="16" stroke="#cc2200" strokeWidth="1" fill="none"/>)}
    {/* Gate arch */}
    <path d="M126 290 L126 244 Q150 226 174 244 L174 290" stroke="#cc2200" strokeWidth="1" fill="none"/>
    {/* Left tower */}
    <rect x="22" y="110" width="66" height="180" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
    {[22,38,54,66,78].map((x,i)=>i%2===0&&<rect key={x} x={x} y="96" width="12" height="16" stroke="#cc2200" strokeWidth="0.8" fill="none"/>)}
    {/* Right tower */}
    <rect x="212" y="110" width="66" height="180" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
    {[212,228,244,258,270].map((x,i)=>i%2===0&&<rect key={x} x={x} y="96" width="12" height="16" stroke="#cc2200" strokeWidth="0.8" fill="none"/>)}
    {/* Windows */}
    {[0,1,2].map(i=><rect key={i} x={122+i*22} y={118+i*36} width="14" height="20" rx="1" stroke="#cc2200" strokeWidth="0.6" fill="#cc220015"/>)}
    {/* Ground line */}
    <line x1="0" y1="290" x2="300" y2="290" stroke="#cc2200" strokeWidth="1.2"/>
  </BpFrame>
);

// ── DRONE renderer ────────────────────────────────────────────────────────────
const renderDrone = (bp, view) => {
  if (view === "top") return (
    <BpFrame viewBox="0 0 300 300" w={300} h={300}>
      <ellipse cx="150" cy="150" rx="40" ry="26" stroke="#cc2200" strokeWidth="1.5" fill="none" filter="url(#bp-glow)"/>
      <ellipse cx="150" cy="150" rx="20" ry="14" stroke="#cc2200" strokeWidth="0.8" fill="#cc220018"/>
      {[[64,76],[64,224],[236,76],[236,224]].map(([cx,cy],i)=>(
        <g key={i}>
          <line x1={cx<150?cx+24:cx-24} y1={cy<150?cy+14:cy-14} x2={150} y2={150} stroke="#cc2200" strokeWidth="1"/>
          <circle cx={cx} cy={cy} r="26" stroke="#cc2200" strokeWidth="0.6" fill="none" strokeDasharray="4 3"/>
          <line x1={cx-26} y1={cy} x2={cx+26} y2={cy} stroke="#cc2200" strokeWidth="0.9"/>
          <line x1={cx} y1={cy-26} x2={cx} y2={cy+26} stroke="#cc2200" strokeWidth="0.9"/>
          <circle cx={cx} cy={cy} r="5" stroke="#cc2200" strokeWidth="1" fill="none"/>
        </g>
      ))}
      <rect x="138" y="162" width="24" height="18" rx="2" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
      <circle cx="150" cy="171" r="6" stroke="#cc2200" strokeWidth="0.6" fill="#cc220020"/>
    </BpFrame>
  );
  return (
    <BpFrame viewBox="0 0 300 280" w={300} h={280}>
      <ellipse cx="150" cy="130" rx="46" ry="28" stroke="#cc2200" strokeWidth="1.5" fill="none" filter="url(#bp-glow)"/>
      <ellipse cx="150" cy="130" rx="24" ry="16" stroke="#cc2200" strokeWidth="0.8" fill="#cc220018"/>
      <line x1="104" y1="118" x2="48" y2="88" stroke="#cc2200" strokeWidth="1"/>
      <line x1="104" y1="142" x2="48" y2="172" stroke="#cc2200" strokeWidth="1"/>
      <line x1="196" y1="118" x2="252" y2="88" stroke="#cc2200" strokeWidth="1"/>
      <line x1="196" y1="142" x2="252" y2="172" stroke="#cc2200" strokeWidth="1"/>
      {[[48,88],[48,172],[252,88],[252,172]].map(([cx,cy],i)=>(
        <g key={i}>
          <circle cx={cx} cy={cy} r="26" stroke="#cc2200" strokeWidth="0.6" fill="none" strokeDasharray="4 3"/>
          <line x1={cx-26} y1={cy} x2={cx+26} y2={cy} stroke="#cc2200" strokeWidth="0.9"/>
          <line x1={cx} y1={cy-26} x2={cx} y2={cy+26} stroke="#cc2200" strokeWidth="0.9"/>
          <circle cx={cx} cy={cy} r="5" stroke="#cc2200" strokeWidth="1" fill="none"/>
        </g>
      ))}
      <rect x="136" y="150" width="28" height="20" rx="2" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
      <circle cx="150" cy="160" r="6" stroke="#cc2200" strokeWidth="0.6" fill="#cc220020"/>
      {/* Landing gear */}
      <line x1="120" y1="168" x2="110" y2="210" stroke="#cc2200" strokeWidth="0.8"/>
      <line x1="180" y1="168" x2="190" y2="210" stroke="#cc2200" strokeWidth="0.8"/>
      <line x1="94"  y1="210" x2="126" y2="210" stroke="#cc2200" strokeWidth="1"/>
      <line x1="174" y1="210" x2="206" y2="210" stroke="#cc2200" strokeWidth="1"/>
    </BpFrame>
  );
};

// ── SHIP renderer ─────────────────────────────────────────────────────────────
const renderShip = (bp, view) => {
  if (view === "top") return (
    <BpFrame viewBox="0 0 300 340" w={300} h={340}>
      {/* Top-down hull */}
      <path d="M150 20 L240 80 L260 200 L240 290 L150 320 L60 290 L40 200 L60 80 Z"
        stroke="#cc2200" strokeWidth="1.5" fill="none" filter="url(#bp-glow)"/>
      <path d="M150 50 L210 95 L226 195 L210 274 L150 296 L90 274 L74 195 L90 95 Z"
        stroke="#cc2200" strokeWidth="0.6" fill="#cc22000a"/>
      {/* Bridge */}
      <rect x="124" y="130" width="52" height="70" rx="2" stroke="#cc2200" strokeWidth="1" fill="none"/>
      <circle cx="150" cy="165" r="18" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
      <circle cx="150" cy="165" r="6" fill="#cc2200" opacity="0.7"/>
      {/* Engines top */}
      {[80,120,160,200].map(x=><rect key={x} x={x} y="285" width="20" height="30" rx="1" stroke="#cc2200" strokeWidth="0.8" fill="none"/>)}
      {/* Centre line */}
      <line x1="150" y1="20" x2="150" y2="320" stroke="#cc2200" strokeWidth="0.3" strokeDasharray="5 5" opacity="0.4"/>
    </BpFrame>
  );
  return (
    <BpFrame viewBox="0 0 300 240" w={300} h={240}>
      {/* Side profile */}
      <path d="M20 170 L60 60 L240 60 L280 170 L150 200 Z"
        stroke="#cc2200" strokeWidth="1.5" fill="none" filter="url(#bp-glow)"/>
      {/* Bridge superstructure */}
      <rect x="100" y="28" width="100" height="32" rx="2" stroke="#cc2200" strokeWidth="1" fill="none"/>
      <rect x="118" y="14" width="64"  height="16" rx="1" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
      {/* Portholes */}
      {[70,100,130,160,190,220].map(x=><circle key={x} cx={x} cy="120" r="6" stroke="#cc2200" strokeWidth="0.6" fill="none"/>)}
      {/* Waterline */}
      <line x1="0" y1="170" x2="300" y2="170" stroke="#cc2200" strokeWidth="1" strokeDasharray="8 4" opacity="0.6"/>
      {/* Hull below */}
      <path d="M20 170 Q150 210 280 170" stroke="#cc2200" strokeWidth="1" fill="none"/>
      {/* Engines */}
      <rect x="230" y="148" width="28" height="22" rx="1" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
      <ellipse cx="258" cy="159" rx="6" ry="10" stroke="#cc2200" strokeWidth="0.8" fill="#cc220020"/>
    </BpFrame>
  );
};

// ── TYPEWRITER (writing/narrative) renderer ───────────────────────────────────
const renderTypewriter = (bp, view) => (
  <BpFrame viewBox="0 0 300 300" w={300} h={300}>
    <rect x="20" y="30" width="260" height="170" rx="3" stroke="#cc2200" strokeWidth="1.5" fill="none" filter="url(#bp-glow)"/>
    <rect x="32" y="44" width="236" height="112" rx="1" stroke="#cc2200" strokeWidth="0.8" fill="#cc22000a"/>
    {[0,1,2,3,4,5].map(i=><line key={i} x1="44" y1={60+i*17} x2={44+140+((i*37)%80)} y2={60+i*17} stroke="#cc2200" strokeWidth="0.6" opacity="0.4"/>)}
    <rect x="60" y="218" width="180" height="28" rx="2" stroke="#cc2200" strokeWidth="1" fill="none"/>
    {[0,1,2,3,4,5,6,7,8,9,10].map(i=><rect key={i} x={65+i*15} y="222" width="11" height="20" rx="1" stroke="#cc2200" strokeWidth="0.6" fill="none"/>)}
    <line x1="150" y1="157" x2="150" y2="216" stroke="#cc2200" strokeWidth="0.8"/>
    <rect x="90" y="258" width="120" height="22" rx="1" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
    <line x1="10" y1="285" x2="290" y2="285" stroke="#cc2200" strokeWidth="1.2"/>
  </BpFrame>
);

// ── FANTASY renderer ──────────────────────────────────────────────────────────
const renderFantasy = (bp, view) => (
  <BpFrame viewBox="0 0 300 340" w={300} h={340}>
    {/* Dragon-ish silhouette */}
    <ellipse cx="150" cy="150" rx="60" ry="36" stroke="#cc2200" strokeWidth="1.5" fill="none" filter="url(#bp-glow)"/>
    {/* Head */}
    <ellipse cx="222" cy="118" rx="32" ry="22" stroke="#cc2200" strokeWidth="1.2" fill="none" filter="url(#bp-glow)"/>
    <rect x="238" y="112" width="28" height="12" rx="1" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
    {/* Eye */}
    <circle cx="228" cy="114" r="5" stroke="#cc2200" strokeWidth="0.8" fill="#cc220030"/>
    {/* Wings */}
    <path d="M120 130 Q60 60 20 80 Q50 130 100 148" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
    <path d="M120 130 Q80 90 40 100 Q70 135 108 148" stroke="#cc2200" strokeWidth="0.5" fill="none" opacity="0.5"/>
    <path d="M180 130 Q240 60 280 80 Q250 130 200 148" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
    <path d="M180 130 Q220 90 260 100 Q230 135 192 148" stroke="#cc2200" strokeWidth="0.5" fill="none" opacity="0.5"/>
    {/* Tail */}
    <path d="M100 165 Q60 200 50 240 Q70 260 90 240 Q80 210 110 180" stroke="#cc2200" strokeWidth="1" fill="none"/>
    {/* Horns */}
    <line x1="212" y1="98" x2="200" y2="68" stroke="#cc2200" strokeWidth="1"/>
    <line x1="224" y1="96" x2="218" y2="64" stroke="#cc2200" strokeWidth="1"/>
    {/* Claws */}
    {[0,1,2].map(i=><line key={i} x1={130+i*18} y1="186" x2={128+i*18} y2="205" stroke="#cc2200" strokeWidth="0.9"/>)}
  </BpFrame>
);

// ── RENDERER REGISTRY ─────────────────────────────────────────────────────────
// Future blueprint packs: add entries here. Each value is (blueprint, view) => JSX.
const RENDERERS = {
  mech:       renderMech,
  server:     renderServer,
  castle:     renderCastle,
  ship:       renderShip,
  drone:      renderDrone,
  typewriter: renderTypewriter,
  fantasy:    renderFantasy,
};

// Fallback: unknown type gets the server renderer
function renderBlueprint(blueprint, view = "front") {
  const renderer = RENDERERS[blueprint?.type] || renderServer;
  return renderer(blueprint, view);
}

// ── Thumbnail renderer (for view buttons) ─────────────────────────────────────
function renderThumbnail(blueprint, view) {
  const renderer = RENDERERS[blueprint?.type] || renderServer;
  return renderer(blueprint, view);
}

// ── Default blueprints per detected type ──────────────────────────────────────
const DEFAULT_BLUEPRINTS = {
  mech:       { type:"mech",       name:"BREACHER MK-IV",  role:"Urban Assault",    height:"4.2m", weight:"8.7t",
                specs:[["HEIGHT","4.20m"],["WEIGHT","8.70t"],["CHASSIS","REINFORCED COMPOSITE"],["POWER PLANT","COMPACT FUSION CORE"],["MAX SPEED","72 km/h"],["JUMP HEIGHT","18.7 m"],["ARMOR RATING","A-CLASS"]],
                systems:["Advanced Target Acquisition","Urban Terrain Mapping","Low-Signature Movement","Hydraulic Leg System","Jump Jets (Vector-4)","Reactive Armor","Thermal Management","Combat Data Link"] },
  server:     { type:"server",     name:"NODE CLUSTER",    role:"Compute Array",    height:"2.0m", weight:"—",
                specs:[["NODES","6x"],["COOLING","LIQUID"],["POWER","REDUNDANT"],["UPTIME","99.99%"]],
                systems:["Load Balancer","Redis Cache","PostgreSQL","API Gateway","Monitoring","CI/CD Pipeline"] },
  castle:     { type:"castle",     name:"IRON KEEP",       role:"Fortress Node",    height:"—",    weight:"—",
                specs:[["TOWERS","2x FLANKING"],["GATE","REINFORCED"],["WALLS","3m STONE"],["MOAT","ACTIVE"]],
                systems:["Drawbridge","Portcullis","Arrow Slits","Parapet Walk","Great Hall","Dungeon"] },
  ship:       { type:"ship",       name:"IRON MERIDIAN",   role:"Capital Vessel",   height:"—",    weight:"—",
                specs:[["LENGTH","420m"],["DRAFT","18m"],["DISPLACEMENT","80,000t"],["SPEED","28kn"]],
                systems:["Main Battery","Torpedo Tubes","Radar Suite","Engine Room","Bridge","Sonar Array"] },
  drone:      { type:"drone",      name:"RECON UAV",        role:"Aerial Ops",      height:"—",    weight:"12kg",
                specs:[["WINGSPAN","1.4m"],["RANGE","40km"],["CEILING","4000m"],["ENDURANCE","6hr"]],
                systems:["Optical Sensor","Thermal Camera","Data Link","GPS Navigation","Auto-Hover","Encrypted Comms"] },
  typewriter: { type:"typewriter", name:"SCRIBE ENGINE",   role:"Narrative AI",     height:"—",    weight:"—",
                specs:[["MODE","NARRATIVE"],["OUTPUT","TEXT"],["STYLE","ADAPTIVE"]],
                systems:["Prose Generator","Style Engine","Context Window","Grammar Core","Tone Modulator"] },
  fantasy:    { type:"fantasy",    name:"MYTHIC ENTITY",   role:"Fantasy World",    height:"—",    weight:"—",
                specs:[["CLASS","LEGENDARY"],["ELEMENT","FIRE"],["ALIGNMENT","NEUTRAL"]],
                systems:["Fire Breath","Wing Flight","Arcane Sight","Regeneration","Telepathy","Ancient Lore"] },
};

// ── Auto-detect blueprint type ────────────────────────────────────────────────
function detectBlueprintType(messages) {
  const t = messages.map(m => m.content).join(" ").toLowerCase();
  if (/ship|vessel|navy|submarine|frigate|destroyer|battleship|cruiser/.test(t)) return "ship";
  if (/mech|robot|assault|breacher|battlesuit|exo|bipedal/.test(t)) return "mech";
  if (/drone|uav|aerial|quadcopter|surveillance|rotor/.test(t)) return "drone";
  if (/castle|dungeon|fortress|keep|tower|siege|rampart/.test(t)) return "castle";
  if (/dragon|fantasy|magic|spell|wizard|realm|kingdom|lore/.test(t)) return "fantasy";
  if (/code|program|function|class|server|api|debug|deploy/.test(t)) return "server";
  if (/write|story|novel|essay|article|poem|narrative|prose/.test(t)) return "typewriter";
  return "mech";
}

// ═══════════════════════════════════════════════════════════════════════════════
// UI COMPONENTS
// ═══════════════════════════════════════════════════════════════════════════════

const VRAMBar = ({ used, total }) => {
  const pct = Math.min((used / Math.max(total,1)) * 100, 100);
  return (
    <div className="vram-bar">
      {Array.from({length:10}).map((_,i) => (
        <div key={i} className={`vram-seg ${(i/10)*100 < pct ? "vram-seg--on":""}`}/>
      ))}
    </div>
  );
};

const StatBox = ({ label, value, onClick, interactive, btnRef }) => (
  <div ref={btnRef} className={`stat-box ${interactive?"stat-box--interactive":""}`} onClick={onClick}>
    <div className="stat-label">{label}{interactive && <span className="stat-edit-hint"> ✎</span>}</div>
    <div className="stat-value">{value}</div>
  </div>
);

const SettingsPopup = ({ anchor, label, type, min, max, step, value, onChange, onClose }) => {
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);
  useEffect(() => { setDraft(value); }, [value]);
  useEffect(() => {
    let active = false;
    const tid = setTimeout(() => { active = true; }, 80);
    const handler = e => { if (!active) return; if (ref.current && !ref.current.contains(e.target)) onCloseRef.current(); };
    document.addEventListener("mousedown", handler);
    return () => { clearTimeout(tid); document.removeEventListener("mousedown", handler); };
  }, []); // eslint-disable-line
  const apply = () => { onChange(draft); onClose(); };
  return (
    <div className="settings-popup" ref={ref} style={anchor} onMouseDown={e => e.stopPropagation()}>
      <div className="settings-popup-title">{label}</div>
      <div className="settings-popup-divider"/>
      {type === "slider" ? (
        <>
          <input type="range" min={min} max={max} step={step} value={draft}
            onChange={e => setDraft(parseFloat(e.target.value))} className="settings-slider"/>
          <div className="settings-val">{draft.toFixed(step < 1 ? 2 : 0)}</div>
        </>
      ) : (
        <input type="number" min={min} max={max} step={step} value={draft}
          onChange={e => setDraft(parseInt(e.target.value) || min)} className="settings-number"/>
      )}
      <button className="settings-apply" onClick={apply}>[ APPLY ]</button>
    </div>
  );
};

const SystemPromptModal = ({ value, onChange, onClose }) => {
  const [draft, setDraft] = useState(value);
  return (
    <div className="modal-overlay" onClick={e => e.target===e.currentTarget && onClose()}>
      <div className="modal-panel">
        <div className="modal-header">
          <span className="modal-title">// SYSTEM PROMPT</span>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <div className="modal-body">
          <div className="modal-desc">Injected as <span style={{color:"var(--red)"}}>role: "system"</span> before all user messages.</div>
          <textarea className="modal-textarea" value={draft} onChange={e=>setDraft(e.target.value)}
            placeholder="You are Iron Meridian, a battle-hardened tactical AI..." spellCheck={false}/>
        </div>
        <div className="modal-footer">
          <span className="modal-hint">{draft.length} chars</span>
          <div style={{display:"flex",gap:"8px"}}>
            <button className="modal-btn modal-btn--ghost" onClick={()=>setDraft("")}>CLEAR</button>
            <button className="modal-btn" onClick={()=>{onChange(draft);onClose();}}>[ SAVE DIRECTIVE ]</button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CodeBlock = ({ code, lang }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(code).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),1500); };
  return (
    <div className="code-block">
      <div className="code-header"><span className="code-lang">{lang||"code"}</span><button className="code-copy" onClick={copy}>{copied?"COPIED":"COPY"}</button></div>
      <pre className="code-body"><code>{code}</code></pre>
    </div>
  );
};

function renderContent(text) {
  const parts=[]; const re=/```(\w*)\n?([\s\S]*?)```/g; let last=0,m;
  while((m=re.exec(text))!==null){if(m.index>last)parts.push({type:"text",content:text.slice(last,m.index)});parts.push({type:"code",lang:m[1],content:m[2]});last=m.index+m[0].length;}
  if(last<text.length)parts.push({type:"text",content:text.slice(last)});
  return parts.map((p,i)=>p.type==="code"?<CodeBlock key={i} code={p.content} lang={p.lang}/>:<span key={i} className="msg-text">{p.content.split("\n").map((l,j)=><span key={j}>{l}<br/></span>)}</span>);
}

const Message = ({ msg, isStreaming }) => {
  const isUser = msg.role==="user";
  return (
    <div className={`msg ${isUser?"msg--user":"msg--ai"}`}>
      <div className="msg-header"><span className="msg-role">{isUser?"YOU":"IRON MERIDIAN"}</span><span className="msg-time">{msg.time}</span></div>
      <div className="msg-body">{renderContent(msg.content)}{isStreaming&&<span className="cursor-blink">▌</span>}</div>
    </div>
  );
};

const ChatItem = ({ chat, active, onClick, onDelete }) => (
  <div className={`chat-item ${active?"chat-item--active":""}`} onClick={onClick}>
    <div className="chat-item-title">{chat.title}</div>
    <div className="chat-item-meta">
      <span className="chat-item-preview">{chat.preview}</span>
      <span className="chat-item-time">{chat.time}</span>
    </div>
  </div>
);

// ── Conversation action dropdown menu ────────────────────────────────────────
const ConvMenu = ({ onClear, onDelete }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div className="conv-menu-wrap" ref={ref}>
      <button className="conv-btn" title="Session options"
        onClick={() => setOpen(o => !o)}>✕</button>
      {open && (
        <div className="conv-menu" onMouseDown={e => e.stopPropagation()}>
          <button className="conv-menu-item" onClick={() => {
            setOpen(false);
            if (confirm("Clear conversation history?")) onClear();
          }}>
            <span className="conv-menu-icon">⟲</span>
            CLEAR HISTORY
          </button>
          <div className="conv-menu-divider"/>
          <button className="conv-menu-item conv-menu-item--danger" onClick={() => {
            setOpen(false);
            if (confirm("Delete this session entirely?")) onDelete();
          }}>
            <span className="conv-menu-icon">✕</span>
            DELETE SESSION
          </button>
        </div>
      )}
    </div>
  );
};

const Scanlines = () => <div className="scanlines" aria-hidden="true"><div className="scanlines-inner"/></div>;

// ── Blueprint animated wrapper ────────────────────────────────────────────────
function BlueprintWrapper({ children, isGenerating }) {
  const [flicker, setFlicker] = useState(false);
  useEffect(() => {
    const sched = () => { const t = setTimeout(()=>{ setFlicker(true); setTimeout(()=>setFlicker(false),120); sched(); }, 4000+Math.random()*12000); return t; };
    const t = sched(); return () => clearTimeout(t);
  }, []);
  return (
    <div className={`blueprint-wrap ${flicker?"flicker":""} ${isGenerating?"bp-generating":""}`}>
      {children}
      <div className="blueprint-scanlines"/>
    </div>
  );
}

// ── Thumbnail view button ─────────────────────────────────────────────────────
const ViewBtn = ({ view, label, active, blueprint, onClick }) => (
  <button className={`view-btn ${active?"view-btn--active":""}`} onClick={onClick} title={label}>
    <span className="view-btn-label">{label}</span>
    <div className="view-btn-thumb">
      <svg viewBox="0 0 300 340" style={{width:"100%",height:"100%"}}>
        {renderThumbnail(blueprint, view)}
      </svg>
    </div>
  </button>
);

// ── Blueprint Panel Header ────────────────────────────────────────────────────
// Blueprint modes: AUTO | LOCKED | CUSTOM
const VIEWS = ["front","side","rear","top"];

// ── Custom Model Selector ─────────────────────────────────────────────────────
const CustomModelSelector = ({ models, selected, onChange }) => {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return;
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    setTimeout(() => document.addEventListener("mousedown", handler), 50);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  if (!models || models.length === 0) {
    return <div className="model-name">{selected}</div>;
  }

  return (
    <div className="model-selector" ref={ref}>
      <div
        className={`model-selector-current ${open?"open":""}`}
        onMouseDown={e => { e.stopPropagation(); setOpen(o => !o); }}
      >
        <span style={{overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{selected}</span>
        <span className="model-selector-arrow">▼</span>
      </div>
      {open && (
        <div className="model-selector-dropdown" onMouseDown={e => e.stopPropagation()}>
          {models.map(m => (
            <div key={m} className={`model-selector-option ${m===selected?"selected":""}`}
              onClick={() => { onChange(m); setOpen(false); }}>
              {m}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// ═══════════════════════════════════════════════════════════════════════════════
// CHAT STATE
// ═══════════════════════════════════════════════════════════════════════════════

// ── Service config ────────────────────────────────────────────────────────────
const SERVICE_URL = "http://localhost:8765";

const MESH_MODELS = [
  { id:"shap-e",      label:"SHAP-E",       vram:"~6GB",  time:"~15s",  input:"TEXT",  note:"Fast preview" },
  { id:"triposr",     label:"TRIPOSR",      vram:"~4GB",  time:"~10s",  input:"IMAGE", note:"Low-poly" },
  { id:"instantmesh", label:"INSTANTMESH",  vram:"~16GB", time:"~60s",  input:"IMAGE", note:"High quality" },
  { id:"openlrm",     label:"OPENLRM",      vram:"~24GB", time:"~90s",  input:"IMAGE", note:"Maximum" },
];

const DEFAULT_CHAT_SETTINGS = {
  temperature: 0.7, topP: 0.95, maxTokens: 2048,
  // Per-chat blueprint state
  blueprintMode: "AUTO",
  customBlueprint: null,
  lockedBlueprint: null,
  blueprintView: "front",
  // Per-chat mesh model selection
  meshModel: "instantmesh",
  // Generated 3D SVGs (keyed by view name)
  generatedSVGs: null,
};

function hydrateChats(raw) {
  return raw.map(c => ({ ...DEFAULT_CHAT_SETTINGS, ...c }));
}

const INITIAL_CHATS = hydrateChats([
  { id:1, title:"Mech Design Concepts", preview:"Help me design a combat mech...", time:"23:49",
    temperature:0.7, topP:0.95, maxTokens:2048,
    messages:[
      {role:"user",content:"Help me design a combat mech for close range urban warfare.",time:"23:49"},
      {role:"assistant",content:"Designing a close-range urban combat mech requires a focus on maneuverability, armor, and devastating short-range weaponry.\n\nHere's a concept:\n\n> Role: Shock Assault / Breacher\n> Height: 4.2m\n> Weight: 8.7 tons\n> Chassis: Reinforced composite armor with reactive plating\n> Power Plant: Compact fusion core\n> Mobility: Hydraulic legs with enhanced jump jets for vertical movement\n\n> Armament:\n  - 2x Chainshot Shotguns (Primary)\n  - 1x Thermal Blade (Melee)\n  - 4x Smoke Grenade Launchers\n\n> Systems:\n  - Advanced target acquisition\n  - Urban terrain mapping\n  - Low-signature movement mode\n\nThis mech is built to dominate tight corridors and close-quarters engagements.",time:"23:49"},
      {role:"user",content:"Generate a blueprint of this mech.",time:"23:50"},
    ]},
  {id:2,title:"Gothic Castle Blueprint",preview:"Create a gothic castle bluep...",time:"21:17",temperature:0.9,topP:0.95,maxTokens:2048,messages:[]},
  {id:3,title:"AI System Prompts",preview:"Act as a battle-hardened tact...",time:"19:02",temperature:0.5,topP:0.9,maxTokens:1024,messages:[]},
  {id:4,title:"Dragon Lore & History",preview:"Tell me the history of the iro...",time:"Yesterday",temperature:0.85,topP:0.95,maxTokens:2048,messages:[]},
  {id:5,title:"Laser Weapons Research",preview:"Explain the physics behind...",time:"Yesterday",temperature:0.3,topP:0.9,maxTokens:2048,messages:[]},
  {id:6,title:"The Black Cathedral",preview:"Describe the architecture...",time:"2d ago",temperature:0.9,topP:0.98,maxTokens:4096,messages:[]},
  {id:7,title:"Coding Help: C++",preview:"How do I optimize this loop...",time:"3d ago",temperature:0.2,topP:0.85,maxTokens:2048,messages:[]},
]);

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN APP
// ═══════════════════════════════════════════════════════════════════════════════
export default function IronMeridianTerminal() {
  // ── Chat state ──
  const [chats, setChats] = useState(() => {
    try { const s=localStorage.getItem("im_chats"); if(s) return hydrateChats(JSON.parse(s)); } catch {}
    return INITIAL_CHATS;
  });
  const [activeChatId, setActiveChatId] = useState(() => {
    try { return parseInt(localStorage.getItem("im_active_chat"))||1; } catch { return 1; }
  });

  // ── Conversation ──
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);

  // ── Ollama ──
  const [ollamaModels, setOllamaModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("SUPERGEMMA4-26B");
  const [contextTokens, setContextTokens] = useState(8192);
  const [vramUsed, setVramUsed] = useState(0);
  const [vramTotal, setVramTotal] = useState(0);
  const [ollamaStatus, setOllamaStatus] = useState("CHECKING");

  // ── UI state ──
  const [searchQuery, setSearchQuery] = useState("");
  const [openPopup, setOpenPopup] = useState(null);
  const [popupAnchor, setPopupAnchor] = useState({top:62,left:400});
  const [showSysPrompt, setShowSysPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(()=>localStorage.getItem("im_system_prompt")||"");
  const [blueprintVisible, setBlueprintVisible] = useState(true);
  const [isGeneratingBp, setIsGeneratingBp] = useState(false);
  const [bpProgress, setBpProgress] = useState(0);
  const [bpStage, setBpStage] = useState("");
  const [serviceStatus, setServiceStatus] = useState("CHECKING");
  const [modelDropdownOpen, setModelDropdownOpen] = useState(false);
  const [textAlign, setTextAlign] = useState("left"); // left | center | right
  const bpJobRef = useRef(null);

  // Auto-resize textarea as content grows
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = "auto";
    const newH = Math.min(ta.scrollHeight, 200);
    ta.style.height = newH + "px";
  }, [input]); // current polling interval id

  // ── Refs ──
  const chatEndRef = useRef(null);
  const abortRef = useRef(null);
  const textareaRef = useRef(null);
  const tempBtnRef = useRef(null);
  const toppBtnRef = useRef(null);
  const maxTokBtnRef = useRef(null);

  const getPopupAnchor = (ref) => {
    if (!ref.current) return {top:62,left:400};
    const r = ref.current.getBoundingClientRect();
    return {top: r.bottom+4, left: r.left};
  };

  // ── Derived values ──
  const activeChat = chats.find(c=>c.id===activeChatId) || chats[0];
  const temperature = activeChat?.temperature ?? DEFAULT_CHAT_SETTINGS.temperature;
  const topP        = activeChat?.topP        ?? DEFAULT_CHAT_SETTINGS.topP;
  const maxTokens   = activeChat?.maxTokens   ?? DEFAULT_CHAT_SETTINGS.maxTokens;

  // Blueprint state derived from per-chat data
  const blueprintMode    = activeChat?.blueprintMode    ?? "AUTO";
  const customBlueprint  = activeChat?.customBlueprint  ?? null;
  const lockedBlueprint  = activeChat?.lockedBlueprint  ?? null;
  const activeView       = activeChat?.blueprintView    ?? "front";
  const meshModel        = activeChat?.meshModel        ?? "instantmesh";
  const generatedSVGs    = activeChat?.generatedSVGs    ?? null;

  // Resolve which blueprint to display
  const autoType = detectBlueprintType(activeChat?.messages || []);
  const autoBlueprint = DEFAULT_BLUEPRINTS[autoType] || DEFAULT_BLUEPRINTS.mech;
  const displayBlueprint =
    blueprintMode === "CUSTOM" && customBlueprint ? customBlueprint :
    blueprintMode === "LOCKED" && lockedBlueprint ? lockedBlueprint :
    autoBlueprint;

  const setChatSetting = useCallback((key, val) => {
    setChats(prev => prev.map(c => c.id!==activeChatId?c:{...c,[key]:val}));
  }, [activeChatId]);

  // ── Persistence ──
  useEffect(()=>{ try{localStorage.setItem("im_chats",JSON.stringify(chats));}catch{} },[chats]);
  useEffect(()=>{ try{localStorage.setItem("im_active_chat",String(activeChatId));}catch{} },[activeChatId]);
  useEffect(()=>{ localStorage.setItem("im_system_prompt",systemPrompt); },[systemPrompt]);

  // ── Ollama polling ──
  useEffect(()=>{
    const poll = async () => {
      try {
        const r = await fetch("http://localhost:11434/api/tags",{signal:AbortSignal.timeout(3000)});
        if (r.ok) {
          const d = await r.json();
          const models = (d.models||[]).map(m=>m.name);
          setOllamaModels(prev=>{
            if(JSON.stringify(prev)!==JSON.stringify(models)){
              if(models.length>0) setSelectedModel(s=>prev.includes(s)?s:models[0]);
              return models;
            }
            return prev;
          });
          setOllamaStatus("RUNNING");
        } else { setOllamaStatus("ERROR"); setVramUsed(0); setVramTotal(0); return; }
      } catch { setOllamaStatus("OFFLINE"); setVramUsed(0); setVramTotal(0); return; }
      try {
        const ps = await fetch("http://localhost:11434/api/ps",{signal:AbortSignal.timeout(3000)});
        if(ps.ok){
          const d=await ps.json(); const ms=d.models||[];
          if(ms.length>0){
            const m=ms[0];
            const usedGB=m.size_vram?+(m.size_vram/1e9).toFixed(1):0;
            setVramUsed(usedGB);
            if(m.details?.context_length) setContextTokens(m.details.context_length);
            const totalGB=m.size?+(m.size/1e9*1.15).toFixed(1):0;
            setVramTotal(prev=>totalGB>0?Math.max(totalGB,usedGB):prev);
          } else { setVramUsed(0); }
        }
      } catch {}
    };
    poll(); const id=setInterval(poll,5000); return ()=>clearInterval(id);
  },[]);

  // ── Service health polling ──
  useEffect(()=>{
    const poll = async () => {
      try {
        const r = await fetch(`${SERVICE_URL}/health`, {signal: AbortSignal.timeout(2000)});
        setServiceStatus(r.ok ? "ONLINE" : "ERROR");
      } catch { setServiceStatus("OFFLINE"); }
    };
    poll();
    const id = setInterval(poll, 8000);
    return () => clearInterval(id);
  }, []);

  const newChat = () => {
    const id=Date.now();
    setChats(prev=>[{id,title:"New Session",preview:"—",time:"now",messages:[],...DEFAULT_CHAT_SETTINGS},...prev]);
    setActiveChatId(id); setOpenPopup(null);
  };
  const switchChat = (id) => { setActiveChatId(id); setOpenPopup(null); };
  const deleteChat = (id) => {
    setChats(prev => {
      const remaining = prev.filter(c => c.id !== id);
      // If we deleted the active chat, switch to the first remaining one
      if (id === activeChatId && remaining.length > 0) {
        setActiveChatId(remaining[0].id);
      } else if (remaining.length === 0) {
        // Always keep at least one chat
        const newId = Date.now();
        setActiveChatId(newId);
        return [{id:newId,title:"New Session",preview:"—",time:"now",messages:[],...DEFAULT_CHAT_SETTINGS}];
      }
      return remaining;
    });
    // Clear service cache for deleted chat
    if (serviceStatus === "ONLINE") {
      fetch(`${SERVICE_URL}/blueprint/${id}`, {method:"DELETE"}).catch(()=>{});
    }
  };

  const sendMessage = useCallback(async () => {
    if(!input.trim()||isStreaming) return;
    const userMsg={role:"user",content:input.trim(),time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})};
    const updatedChats=chats.map(c=>{
      if(c.id!==activeChatId) return c;
      const msgs=[...c.messages,userMsg];
      return {...c,messages:msgs,title:msgs[0].content.slice(0,28)||c.title,preview:msgs[0].content.slice(0,30)+"..."};
    });
    setChats(updatedChats); setInput(""); setIsStreaming(true);
    const aiMsgId=Date.now();
    const aiTime=new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
    const aiMsg={id:aiMsgId,role:"assistant",content:"",time:aiTime};
    setChats(prev=>prev.map(c=>c.id!==activeChatId?c:{...c,messages:[...c.messages,aiMsg]}));
    const chat=updatedChats.find(c=>c.id===activeChatId);
    const sysMessages=systemPrompt.trim()?[{role:"system",content:systemPrompt.trim()}]:[];
    const ollamaMessages=[...sysMessages,...chat.messages.map(m=>({role:m.role,content:m.content}))];
    try {
      const ctrl=new AbortController(); abortRef.current=ctrl;
      const resp=await fetch("http://localhost:11434/api/chat",{
        method:"POST",headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:selectedModel,messages:ollamaMessages,stream:true,options:{temperature,top_p:topP,num_predict:maxTokens}}),
        signal:ctrl.signal,
      });
      if(!resp.ok) throw new Error("Ollama error");
      const reader=resp.body.getReader(); const decoder=new TextDecoder(); let full="";
      while(true){
        const {done,value}=await reader.read(); if(done) break;
        const lines=decoder.decode(value,{stream:true}).split("\n").filter(Boolean);
        for(const line of lines){
          try{const j=JSON.parse(line);if(j.message?.content){full+=j.message.content;setChats(prev=>prev.map(c=>c.id!==activeChatId?c:{...c,messages:c.messages.map(m=>m.id===aiMsgId?{...m,content:full}:m)}));}if(j.done)break;}catch{}
        }
      }
    } catch(err){
      if(err.name!=="AbortError") setChats(prev=>prev.map(c=>c.id!==activeChatId?c:{...c,messages:c.messages.map(m=>m.id===aiMsgId?{...m,content:"[SIGNAL LOST — OLLAMA UNREACHABLE]\n\nEnsure Ollama is running: `ollama serve`"}:m)}));
    } finally { setIsStreaming(false); abortRef.current=null; }
  },[input,isStreaming,chats,activeChatId,selectedModel,temperature,topP,maxTokens,systemPrompt]);

  const stopGeneration = () => { abortRef.current?.abort(); };

  const generateBlueprint = async () => {
    if (isGeneratingBp) return;

    // If service is online, use the full pipeline
    if (serviceStatus === "ONLINE") {
      await _generateViaService();
    } else {
      // Fallback: Ollama-direct brief extraction (original behaviour)
      await _generateViaOllama();
    }
  };

  const _generateViaService = async () => {
    setIsGeneratingBp(true); setBpProgress(5); setBpStage("CONNECTING");
    // Clear any previous polling
    if (bpJobRef.current) clearInterval(bpJobRef.current);

    try {
      const resp = await fetch(`${SERVICE_URL}/blueprint/generate`, {
        method: "POST",
        headers: {"Content-Type":"application/json"},
        body: JSON.stringify({
          chat_id:      String(activeChatId),
          messages:     (activeChat?.messages||[]).map(m=>({role:m.role,content:m.content})),
          ollama_model: selectedModel,
          mesh_model:   meshModel,
        }),
      });
      if (!resp.ok) throw new Error(`Service error ${resp.status}`);
      const { job_id, cached } = await resp.json();

      if (cached) {
        // Cache hit — fetch result immediately
        const res = await fetch(`${SERVICE_URL}/blueprint/result/${job_id}`);
        if (res.ok) {
          const data = await res.json();
          _applyServiceResult(data);
        }
        return;
      }

      // Poll for progress
      setBpStage("EXTRACTING BRIEF"); setBpProgress(10);
      bpJobRef.current = setInterval(async () => {
        try {
          const sr = await fetch(`${SERVICE_URL}/blueprint/status/${job_id}`);
          if (!sr.ok) return;
          const s = await sr.json();

          const STAGE_LABELS = {
            brief:    "EXTRACTING BRIEF",
            mesh:     "GENERATING MESH",
            render:   "RENDERING WIREFRAMES",
            complete: "BLUEPRINT READY",
            failed:   "GENERATION FAILED",
          };
          setBpStage(STAGE_LABELS[s.stage] || s.stage.toUpperCase());
          setBpProgress(s.progress);

          if (s.status === "done") {
            clearInterval(bpJobRef.current);
            const rr = await fetch(`${SERVICE_URL}/blueprint/result/${job_id}`);
            if (rr.ok) _applyServiceResult(await rr.json());
            setIsGeneratingBp(false);
          } else if (s.status === "failed") {
            clearInterval(bpJobRef.current);
            console.error("Blueprint generation failed:", s.error);
            setBpStage("FAILED — USING FALLBACK");
            // Fall through to Ollama fallback
            await _generateViaOllama();
          }
        } catch (e) { console.error("Poll error:", e); }
      }, 1200);

    } catch (e) {
      console.error("Service generate failed:", e);
      setIsGeneratingBp(false);
      setBpStage("");
      // Fallback to Ollama direct
      await _generateViaOllama();
    }
  };

  const _applyServiceResult = (data) => {
    const bp    = data.brief;
    const svgs  = data.svgs;
    const merged = bp?.type && RENDERERS[bp.type]
      ? { ...DEFAULT_BLUEPRINTS[bp.type], ...bp }
      : null;
    setChats(prev => prev.map(c => c.id !== activeChatId ? c : {
      ...c,
      blueprintMode:   "CUSTOM",
      customBlueprint: merged,
      generatedSVGs:   svgs,
      blueprintView:   "front",
    }));
    setIsGeneratingBp(false);
    setBpProgress(100);
    setBpStage("BLUEPRINT READY");
    setTimeout(() => { setBpProgress(0); setBpStage(""); }, 2000);
  };

  // Original Ollama-direct fallback (no service required)
  const _generateViaOllama = async () => {
    setIsGeneratingBp(true); setBpStage("EXTRACTING BRIEF"); setBpProgress(20);
    const context = (activeChat?.messages||[]).slice(-8).map(m=>`${m.role}: ${m.content}`).join("\n").slice(0,3000);
    const prompt = `You are a blueprint extraction system. Analyze this conversation and extract a structured blueprint JSON object.

Conversation:
${context}

Return ONLY valid JSON matching this schema (no markdown, no explanation):
{
  "type": "mech|server|castle|ship|drone|typewriter|fantasy",
  "name": "SHORT NAME IN CAPS",
  "role": "Brief role description",
  "height": "Xm or —",
  "weight": "Xt or —",
  "specs": [["KEY","VALUE"], ...],
  "systems": ["System 1", "System 2", ...]
}`;
    try {
      setBpProgress(40);
      const resp = await fetch("http://localhost:11434/api/chat",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:selectedModel,messages:[{role:"user",content:prompt}],stream:false,options:{temperature:0.1,num_predict:600}}),
        signal:AbortSignal.timeout(30000),
      });
      if(resp.ok){
        const d = await resp.json();
        const raw = d.message?.content || "";
        const clean = raw.replace(/```json|```/g,"").trim();
        const jsonMatch = clean.match(/\{[\s\S]*\}/);
        if(jsonMatch){
          const bp = JSON.parse(jsonMatch[0]);
          if(bp.type && RENDERERS[bp.type]){
            const merged = { ...DEFAULT_BLUEPRINTS[bp.type], ...bp };
            setChats(prev => prev.map(c => c.id!==activeChatId?c:{
              ...c, blueprintMode:"CUSTOM", customBlueprint:merged,
              generatedSVGs:null, blueprintView:"front"
            }));
          }
        }
      }
    } catch(e){ console.error("Ollama blueprint failed:", e); }
    finally {
      setIsGeneratingBp(false); setBpProgress(0); setBpStage("");
    }
  };

  const lockBlueprint = () => {
    if(blueprintMode==="LOCKED"){
      setChats(prev=>prev.map(c=>c.id!==activeChatId?c:{...c,blueprintMode:"AUTO",lockedBlueprint:null}));
    } else {
      setChats(prev=>prev.map(c=>c.id!==activeChatId?c:{...c,blueprintMode:"LOCKED",lockedBlueprint:displayBlueprint}));
    }
  };

  const resetBlueprint = () => {
    setChats(prev=>prev.map(c=>c.id!==activeChatId?c:{
      ...c, blueprintMode:"AUTO", customBlueprint:null,
      lockedBlueprint:null, blueprintView:"front", generatedSVGs:null,
    }));
    // Clear server-side cache for this chat
    if (serviceStatus === "ONLINE") {
      fetch(`${SERVICE_URL}/blueprint/${activeChatId}`, {method:"DELETE"}).catch(()=>{});
    }
  };

  const setActiveView = (v) => {
    setChats(prev=>prev.map(c=>c.id!==activeChatId?c:{...c,blueprintView:v}));
  };

  // ── Download blueprint as SVG ─────────────────────────────────────────────
  const downloadBlueprint = () => {
    const svgEl = document.querySelector(".blueprint-wrap svg");
    if(!svgEl) return;
    const serializer = new XMLSerializer();
    const source = serializer.serializeToString(svgEl);
    const blob = new Blob([`<?xml version="1.0" standalone="no"?>\n${source}`],{type:"image/svg+xml"});
    const a = document.createElement("a"); a.href=URL.createObjectURL(blob);
    a.download=`${displayBlueprint.name||"blueprint"}.svg`; a.click();
  };

  const filteredChats = chats.filter(c=>!searchQuery||c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const vramStr = ollamaStatus!=="RUNNING"?"OFFLINE":vramTotal===0?"NO MODEL":`${vramUsed}/${vramTotal} GB`;

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Share+Tech+Mono&family=Rajdhani:wght@300;400;500;600;700&display=swap');
        *,*::before,*::after{box-sizing:border-box;margin:0;padding:0;}
        :root{
          --bg:#050505;--panel:#0a0909;--panel2:#0e0c0c;
          --border:#1e1212;--border-accent:#2d1010;
          --red:#cc2200;--red-dim:#7a1500;
          --red-glow:rgba(204,34,0,0.15);--red-glow2:rgba(204,34,0,0.06);
          --green:#22cc44;
          --steel:#1a2a3a;--steel-light:#2a4060;
          --text:#d4ccc4;--text-dim:#6b5f58;--text-mid:#9a8a80;
          --mono:'Share Tech Mono','Courier New',monospace;
          --display:'Rajdhani',sans-serif;
        }
        html,body,#root{height:100%;width:100%;background:var(--bg);}

        /* ── Layout ── */
        .terminal{
          display:grid;
          grid-template-rows:56px 1fr 22px;
          grid-template-columns:260px 1fr var(--bp-width,360px);
          height:100vh;min-height:100vh;
          background:var(--bg);font-family:var(--mono);color:var(--text);
          overflow:hidden;
          transition:grid-template-columns .3s ease;
        }
        .terminal.bp-hidden{
          grid-template-columns:260px 1fr 0px;
        }
        /* Statusbar must not grow beyond its grid row */
        .statusbar{
          grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;
          padding:0 16px;height:22px;max-height:22px;overflow:hidden;
          border-top:1px solid var(--border-accent);background:var(--panel);
          font-size:8px;color:var(--text-dim);letter-spacing:.1em;
        }

        /* ── Scanlines ── */
        .scanlines{position:fixed;inset:0;pointer-events:none;z-index:100;}
        .scanlines-inner{width:100%;height:100%;
          background:repeating-linear-gradient(0deg,transparent,transparent 2px,rgba(0,0,0,0.07) 2px,rgba(0,0,0,0.07) 4px);
          animation:scanroll 8s linear infinite;}
        @keyframes scanroll{from{background-position:0 0}to{background-position:0 100px}}

        /* ── Blueprint animations ── */
        .blueprint-wrap{
          position:relative;
          animation:bp-pulse 4s ease-in-out infinite;
        }
        @keyframes bp-pulse{0%,100%{opacity:.88;filter:drop-shadow(0 0 3px rgba(204,34,0,.3));}50%{opacity:1;filter:drop-shadow(0 0 9px rgba(204,34,0,.55));}}
        .blueprint-wrap.flicker{animation:bp-pulse 4s ease-in-out infinite,bp-flicker .1s steps(1) 1;}
        @keyframes bp-flicker{0%{opacity:.2}50%{opacity:1}100%{opacity:.88}}
        .bp-generating{animation:bp-scan 1s linear infinite!important;}
        @keyframes bp-scan{0%{opacity:.4}50%{opacity:1}100%{opacity:.4}}
        .blueprint-scanlines{position:absolute;inset:0;pointer-events:none;
          background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,.12) 3px,rgba(0,0,0,.12) 4px);}
        .blueprint-svg{width:100%;display:block;}

        /* ── Top Bar ── */
        .topbar{
          grid-column:1/-1;display:flex;align-items:center;
          background:var(--panel);border-bottom:1px solid var(--border-accent);
          padding:0 16px;gap:0;position:relative;z-index:20;
        }
        .topbar::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:1px;background:linear-gradient(90deg,transparent,var(--red-dim),transparent);}
        .brand{display:flex;align-items:center;gap:12px;margin-right:20px;min-width:210px;}
        .brand-icon{width:36px;height:36px;}
        .brand-text{display:flex;flex-direction:column;}
        .brand-name{font-family:var(--display);font-weight:700;font-size:15px;letter-spacing:.15em;color:var(--text);line-height:1.1;}
        .brand-sub{font-size:9px;color:var(--red);letter-spacing:.2em;}
        .topbar-divider{width:1px;height:32px;background:var(--border-accent);margin:0 10px;}
        .stat-box{display:flex;flex-direction:column;padding:0 10px;border-right:1px solid var(--border);cursor:default;}
        .stat-box--interactive{cursor:pointer;transition:background .12s;}
        .stat-box--interactive:hover{background:var(--red-glow2);}
        .stat-label{font-size:8px;letter-spacing:.18em;color:var(--text-dim);text-transform:uppercase;user-select:none;}
        .stat-edit-hint{color:var(--red-dim);font-size:7px;}
        .stat-value{font-size:11px;color:var(--text);letter-spacing:.05em;margin-top:1px;}
        .topbar-spacer{flex:1;}
        .system-status{display:flex;align-items:center;gap:10px;padding-left:12px;}
        .sys-label{font-size:8px;letter-spacing:.15em;color:var(--text-dim);}
        .sys-val{font-size:10px;letter-spacing:.1em;color:var(--red);}
        .sys-val--ok{color:var(--green);}
        .sys-val--warn{color:#cc8800;}
        .vram-bar{display:flex;gap:2px;align-items:center;}
        .vram-seg{width:5px;height:12px;border:1px solid var(--red-dim);opacity:.3;}
        .vram-seg--on{background:var(--red);opacity:1;box-shadow:0 0 4px var(--red);}
        .vram-label{font-size:9px;color:var(--text-dim);margin-left:4px;min-width:76px;}

        /* ── Settings Popup ── */
        .settings-popup{position:fixed;z-index:200;background:var(--panel);border:1px solid var(--border-accent);padding:14px 16px;min-width:220px;box-shadow:0 0 24px rgba(204,34,0,.2),0 4px 32px rgba(0,0,0,.7);}
        .settings-popup-title{font-size:9px;letter-spacing:.2em;color:var(--red);margin-bottom:8px;}
        .settings-popup-divider{height:1px;background:var(--border-accent);margin-bottom:10px;}
        .settings-slider{width:100%;-webkit-appearance:none;appearance:none;height:2px;background:var(--border-accent);outline:none;accent-color:var(--red);cursor:pointer;margin-bottom:4px;display:block;}
        .settings-slider::-webkit-slider-thumb{-webkit-appearance:none;width:12px;height:12px;background:var(--red);border:1px solid var(--red-dim);box-shadow:0 0 6px var(--red);cursor:pointer;}
        .settings-val{font-size:18px;color:var(--text);font-family:var(--display);font-weight:700;letter-spacing:.1em;margin-bottom:10px;}
        .settings-number{width:100%;background:var(--bg);border:1px solid var(--border-accent);color:var(--text);font-family:var(--mono);font-size:13px;padding:5px 8px;outline:none;margin-bottom:10px;}
        .settings-number:focus{border-color:var(--red-dim);}
        .settings-apply{width:100%;background:none;border:1px solid var(--red-dim);color:var(--red);font-family:var(--mono);font-size:10px;padding:5px;cursor:pointer;letter-spacing:.12em;transition:all .15s;}
        .settings-apply:hover{background:var(--red-glow);border-color:var(--red);}

        /* ── System Prompt Modal ── */
        .modal-overlay{position:fixed;inset:0;z-index:300;background:rgba(0,0,0,.75);display:flex;align-items:center;justify-content:center;backdrop-filter:blur(2px);}
        .modal-panel{background:var(--panel);border:1px solid var(--border-accent);width:640px;max-width:90vw;display:flex;flex-direction:column;box-shadow:0 0 40px rgba(204,34,0,.2),0 8px 64px rgba(0,0,0,.8);}
        .modal-header{display:flex;justify-content:space-between;align-items:center;padding:12px 16px;border-bottom:1px solid var(--border-accent);background:var(--panel2);}
        .modal-title{font-size:10px;letter-spacing:.2em;color:var(--red);}
        .modal-close{background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:12px;}
        .modal-close:hover{color:var(--red);}
        .modal-body{padding:16px;}
        .modal-desc{font-size:10px;color:var(--text-dim);letter-spacing:.05em;margin-bottom:12px;line-height:1.5;}
        .modal-textarea{width:100%;height:220px;background:var(--bg);border:1px solid var(--border-accent);color:var(--text);font-family:var(--mono);font-size:11px;padding:12px;resize:vertical;outline:none;line-height:1.55;}
        .modal-textarea::placeholder{color:var(--text-dim);}
        .modal-textarea:focus{border-color:var(--red-dim);}
        .modal-footer{display:flex;justify-content:space-between;align-items:center;padding:10px 16px;border-top:1px solid var(--border);background:var(--panel2);}
        .modal-hint{font-size:9px;color:var(--text-dim);letter-spacing:.1em;}
        .modal-btn{background:var(--red);border:none;color:#fff;font-family:var(--mono);font-size:10px;padding:6px 16px;cursor:pointer;letter-spacing:.12em;}
        .modal-btn:hover{background:#ff3310;}
        .modal-btn--ghost{background:none;border:1px solid var(--border-accent);color:var(--text-dim);}
        .modal-btn--ghost:hover{border-color:var(--red-dim);color:var(--text);}

        /* ── Left Sidebar ── */
        .sidebar-left{background:var(--panel);border-right:1px solid var(--border-accent);display:flex;flex-direction:column;overflow:hidden;}
        .sidebar-section{padding:10px 14px 6px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
        .sidebar-section-label{font-size:9px;letter-spacing:.2em;color:var(--red);}
        .sidebar-section-actions{display:flex;gap:4px;}
        .sidebar-btn{background:none;border:1px solid var(--red-dim);color:var(--red);font-family:var(--mono);font-size:14px;width:22px;height:22px;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;}
        .sidebar-btn:hover{background:var(--red-glow);border-color:var(--red);}
        .sidebar-btn--sys{font-size:10px;width:auto;padding:0 7px;letter-spacing:.06em;}
        .search-wrap{padding:8px 12px;border-bottom:1px solid var(--border);}
        .search-input{width:100%;background:var(--bg);border:1px solid var(--border-accent);color:var(--text);font-family:var(--mono);font-size:10px;padding:5px 8px;outline:none;letter-spacing:.05em;}
        .search-input::placeholder{color:var(--text-dim);}
        .search-input:focus{border-color:var(--red-dim);}
        .chat-list{flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--red-dim) transparent;}
        .chat-item{padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border);transition:background .1s;}
        .chat-item:hover{background:var(--red-glow2);}
        .chat-item--active{background:var(--red-glow);border-left:2px solid var(--red);}
        .chat-item-title{font-size:11px;color:var(--text);letter-spacing:.03em;margin-bottom:3px;}
        .chat-item-meta{display:flex;justify-content:space-between;align-items:flex-end;}
        .chat-item-preview{font-size:9px;color:var(--text-dim);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .chat-item-right{display:flex;align-items:center;gap:4px;flex-shrink:0;margin-left:6px;}
        .chat-item-time{font-size:9px;color:var(--text-dim);}
        .chat-item-delete{
          background:none;border:none;color:var(--text-dim);cursor:pointer;
          font-size:9px;padding:1px 3px;opacity:0;transition:all .12s;line-height:1;
        }
        .chat-item:hover .chat-item-delete{opacity:1;}
        .chat-item-delete:hover{color:var(--red);}

        /* ── Text alignment toggle ── */
        .align-btn{
          background:none;border:1px solid var(--border);color:var(--text-dim);
          font-family:var(--mono);font-size:9px;padding:2px 7px;cursor:pointer;
          letter-spacing:.08em;transition:all .12s;
        }
        .align-btn:hover{border-color:var(--red-dim);color:var(--text);}
        .align-btn.active{border-color:var(--red);color:var(--red);}

        /* ── Textarea auto-resize ── */
        .cmd-input{
          flex:1;background:transparent;border:none;color:var(--text);
          font-family:var(--mono);font-size:12px;padding:11px 8px 11px 0;
          resize:none;outline:none;letter-spacing:.04em;
          min-height:44px;max-height:200px;
          overflow-y:auto;scrollbar-width:none;line-height:1.5;
          transition:height 0.1s ease;
        }
        .cmd-input::placeholder{color:var(--text-dim);}
        .model-panel{padding:10px 12px;border-top:1px solid var(--border-accent);background:var(--panel2);}
        .model-panel-label{font-size:8px;letter-spacing:.2em;color:var(--red);margin-bottom:6px;}
        .model-icon-wrap{display:flex;gap:10px;align-items:center;}
        .model-icon{width:44px;height:44px;flex-shrink:0;}
        .model-info{flex:1;overflow:hidden;}
        .model-name{font-size:11px;color:var(--text);letter-spacing:.05em;font-family:var(--display);font-weight:600;}
        .model-row{display:flex;justify-content:space-between;margin-top:3px;}
        .model-key{font-size:8px;color:var(--text-dim);}
        .model-val{font-size:8px;color:var(--text-mid);}
        .model-select{background:var(--bg);border:1px solid var(--border-accent);color:var(--text);font-family:var(--mono);font-size:10px;padding:2px 6px;outline:none;cursor:pointer;width:100%;margin-top:4px;}
        .model-select:focus{border-color:var(--red-dim);}
        .sys-prompt-indicator{font-size:8px;margin-top:4px;letter-spacing:.08em;color:var(--red-dim);display:flex;align-items:center;gap:4px;}
        .sys-prompt-indicator.active{color:var(--green);}
        .sys-dot{width:4px;height:4px;border-radius:50%;background:currentColor;display:inline-block;}

        /* ── Main Chat ── */
        .main-chat{display:flex;flex-direction:column;background:var(--bg);overflow:hidden;}
        .conv-header{padding:10px 18px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;background:var(--panel2);flex-shrink:0;}
        .conv-title{font-size:11px;letter-spacing:.18em;color:var(--red);}
        .conv-actions{display:flex;gap:8px;}
        .conv-btn{background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:14px;padding:2px 4px;transition:color .15s;}
        .conv-btn:hover{color:var(--red);}
        .messages-area{flex:1;overflow-y:auto;padding:20px 18px;scrollbar-width:thin;scrollbar-color:var(--red-dim) transparent;display:flex;flex-direction:column;gap:16px;}
        .msg{display:flex;flex-direction:column;gap:6px;max-width:100%;}
        .msg-header{display:flex;align-items:center;gap:10px;}
        .msg-role{font-size:9px;letter-spacing:.22em;color:var(--red);}
        .msg--user .msg-role{color:var(--steel-light);}
        .msg-time{font-size:9px;color:var(--text-dim);}
        .msg-body{background:var(--panel2);border:1px solid var(--border);padding:12px 14px;font-size:12px;line-height:1.65;letter-spacing:.02em;color:var(--text);}
        .msg--user .msg-body{border-color:var(--steel);background:var(--steel);color:#c0d8f0;}
        .msg-text{white-space:pre-wrap;}
        .code-block{margin:10px 0;border:1px solid var(--border-accent);}
        .code-header{display:flex;justify-content:space-between;align-items:center;padding:4px 10px;background:var(--panel);border-bottom:1px solid var(--border);}
        .code-lang{font-size:9px;color:var(--red);letter-spacing:.15em;}
        .code-copy{background:none;border:1px solid var(--red-dim);color:var(--red-dim);font-family:var(--mono);font-size:8px;padding:1px 6px;cursor:pointer;letter-spacing:.1em;transition:all .15s;}
        .code-copy:hover{border-color:var(--red);color:var(--red);}
        .code-body{padding:10px 12px;font-size:11px;overflow-x:auto;color:#a8c0b0;line-height:1.55;}
        .cursor-blink{animation:blink .8s steps(1) infinite;color:var(--red);}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}

        /* ── Input Area ── */
        .input-area{border-top:1px solid var(--border-accent);background:var(--panel);padding:10px 16px 8px;flex-shrink:0;}
        .input-row{display:flex;align-items:center;background:var(--bg);border:1px solid var(--border-accent);transition:border-color .15s;}
        .input-row:focus-within{border-color:var(--red-dim);}
        .input-prompt{color:var(--red);font-size:13px;padding:0 8px 0 12px;flex-shrink:0;align-self:center;user-select:none;pointer-events:none;}
        .send-btn{flex-shrink:0;align-self:stretch;background:var(--red);border:none;color:#fff;font-family:var(--display);font-weight:700;font-size:12px;letter-spacing:.18em;padding:0 20px;cursor:pointer;transition:background .15s;clip-path:polygon(8px 0%,100% 0%,100% 100%,0% 100%);white-space:nowrap;}
        .send-btn:hover{background:#ff3310;}
        .send-btn:disabled{background:var(--red-dim);cursor:default;}
        .stop-btn{flex-shrink:0;align-self:stretch;background:none;border-left:1px solid var(--red);color:var(--red);font-family:var(--mono);font-size:10px;padding:0 14px;cursor:pointer;letter-spacing:.1em;transition:all .15s;white-space:nowrap;}
        .stop-btn:hover{background:var(--red-glow);}
        .input-meta{display:flex;justify-content:space-between;padding-top:5px;font-size:8px;color:var(--text-dim);letter-spacing:.1em;}

        /* ── Right Sidebar (Blueprint Panel) ── */
        .sidebar-right{
          background:var(--panel);border-left:1px solid var(--border-accent);
          display:flex;flex-direction:column;overflow:hidden;
          transition:opacity .25s ease, border-color .25s ease;
          min-width:0;
        }
        .bp-hidden .sidebar-right{
          opacity:0;pointer-events:none;border-color:transparent;
        }

        /* ── Blueprint toggle button in conv-header ── */
        .bp-toggle-btn{
          background:none;border:1px solid var(--border-accent);color:var(--text-dim);
          font-family:var(--mono);font-size:8px;padding:2px 8px;cursor:pointer;
          letter-spacing:.12em;transition:all .15s;
        }
        .bp-toggle-btn:hover{border-color:var(--red-dim);color:var(--red);}
        .bp-toggle-btn.active{border-color:var(--red);color:var(--red);}

        /* ── Custom Model Selector ── */
        .model-selector{position:relative;width:100%;margin-top:4px;}
        .model-selector-current{
          width:100%;background:var(--bg);border:1px solid var(--border-accent);
          color:var(--text);font-family:var(--mono);font-size:10px;
          padding:4px 24px 4px 6px;cursor:pointer;
          display:flex;align-items:center;justify-content:space-between;
          transition:border-color .12s;user-select:none;
        }
        .model-selector-current:hover{border-color:var(--red-dim);}
        .model-selector-current.open{border-color:var(--red);border-bottom-color:transparent;}
        .model-selector-arrow{
          font-size:8px;color:var(--red-dim);transition:transform .15s;flex-shrink:0;margin-left:4px;
        }
        .model-selector-current.open .model-selector-arrow{transform:rotate(180deg);}
        .model-selector-dropdown{
          position:absolute;left:0;right:0;top:100%;z-index:150;
          background:var(--panel);border:1px solid var(--red);border-top:none;
          max-height:180px;overflow-y:auto;
          scrollbar-width:thin;scrollbar-color:var(--red-dim) transparent;
          box-shadow:0 8px 24px rgba(0,0,0,.7),0 0 12px rgba(204,34,0,.15);
        }
        .model-selector-option{
          padding:6px 8px;font-family:var(--mono);font-size:10px;color:var(--text-mid);
          cursor:pointer;letter-spacing:.03em;border-bottom:1px solid var(--border);
          transition:all .1s;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;
        }
        .model-selector-option:last-child{border-bottom:none;}
        .model-selector-option:hover{background:var(--red-glow);color:var(--text);}
        .model-selector-option.selected{color:var(--red);background:var(--red-glow2);}
        .model-selector-option.selected::before{content:"› ";}

        .bp-header{padding:8px 12px 6px;border-bottom:1px solid var(--border-accent);display:flex;align-items:flex-start;justify-content:space-between;}
        .bp-header-left{flex:1;}
        .bp-section-label{font-size:9px;letter-spacing:.2em;color:var(--red);}
        .bp-name{font-family:var(--display);font-weight:700;font-size:15px;letter-spacing:.12em;color:var(--text);margin-top:2px;line-height:1.1;}
        .bp-role{font-size:8px;color:var(--text-dim);letter-spacing:.18em;margin-top:1px;}
        .bp-header-right{display:flex;flex-direction:column;align-items:flex-end;gap:4px;}
        .bp-mode-label{font-size:8px;letter-spacing:.15em;color:var(--text-dim);}
        .bp-mode-val{font-size:10px;letter-spacing:.15em;
          color: var(--green);}
        .bp-mode-val--locked{color:#cc8800;}
        .bp-mode-val--custom{color:var(--red);}

        .bp-main{flex:0 0 auto;padding:6px 8px;border-bottom:1px solid var(--border);position:relative;}

        /* ── View Controls ── */
        .view-controls{display:flex;gap:3px;padding:6px 8px;border-bottom:1px solid var(--border);}
        .view-btn{flex:1;background:none;border:1px solid var(--border);cursor:pointer;padding:3px;display:flex;flex-direction:column;align-items:center;gap:2px;transition:all .15s;}
        .view-btn:hover{border-color:var(--red-dim);background:var(--red-glow2);}
        .view-btn--active{border-color:var(--red);background:var(--red-glow);}
        .view-btn-label{font-size:7px;letter-spacing:.12em;color:var(--text-dim);font-family:var(--mono);}
        .view-btn--active .view-btn-label{color:var(--red);}
        .view-btn-thumb{width:100%;height:44px;overflow:hidden;}

        /* ── Specs & Systems ── */
        .bp-info{flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--red-dim) transparent;display:grid;grid-template-columns:1fr 1fr;border-bottom:1px solid var(--border);}
        .bp-info-col{padding:8px 10px;overflow:hidden;}
        .bp-info-col:first-child{border-right:1px solid var(--border);}
        .bp-sub-label{font-size:8px;letter-spacing:.2em;color:var(--red);margin-bottom:6px;display:block;}
        .spec-row{display:flex;justify-content:space-between;align-items:baseline;padding:3px 0;border-bottom:1px solid var(--border);font-size:9px;}
        .spec-key{color:var(--text-dim);letter-spacing:.08em;font-size:8px;}
        .spec-val{color:var(--text);text-align:right;font-size:7px;max-width:55%;}
        .sys-item{padding:3px 0;border-bottom:1px solid var(--border);font-size:8px;color:var(--text-mid);letter-spacing:.05em;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;}
        .sys-item::before{content:"›";color:var(--red);margin-right:4px;}

        /* ── Blueprint Action Buttons ── */
        .bp-actions{padding:6px 8px;display:flex;gap:4px;flex-direction:column;flex-shrink:0;}
        .bp-actions-row{display:flex;gap:4px;}
        .bp-btn{flex:1;background:none;border:1px solid var(--border-accent);color:var(--text-dim);font-family:var(--mono);font-size:8px;padding:6px 4px;cursor:pointer;letter-spacing:.1em;transition:all .15s;white-space:nowrap;text-align:center;}
        .bp-btn:hover{border-color:var(--red-dim);color:var(--text);}
        .bp-btn--primary{border-color:var(--red-dim);color:var(--red);background:var(--red-glow2);}
        .bp-btn--primary:hover{background:var(--red-glow);border-color:var(--red);}
        .bp-btn--active{border-color:#cc8800;color:#cc8800;background:rgba(204,136,0,.08);}
        .bp-btn--active:hover{background:rgba(204,136,0,.15);}
        .bp-btn--reset{border-color:var(--border-accent);color:var(--text-dim);}
        .bp-btn--disabled{opacity:.4;cursor:not-allowed;}
        .bp-btn--generating{animation:bp-scan 1s linear infinite;border-color:var(--red);}

        /* ── Blueprint progress bar ── */
        .bp-progress{padding:6px 8px;border-bottom:1px solid var(--border);flex-shrink:0;}
        .bp-progress-track{height:2px;background:var(--border-accent);position:relative;overflow:hidden;}
        .bp-progress-fill{height:100%;background:var(--red);transition:width .4s ease;box-shadow:0 0 6px var(--red);}
        .bp-progress-label{font-size:8px;color:var(--red);letter-spacing:.15em;margin-bottom:4px;display:flex;justify-content:space-between;}
        .bp-progress-pct{color:var(--text-dim);}

        /* ── Mesh model selector ── */
        .mesh-model-wrap{padding:6px 8px;border-bottom:1px solid var(--border);flex-shrink:0;}
        .mesh-model-label{font-size:8px;letter-spacing:.18em;color:var(--text-dim);margin-bottom:5px;}
        .mesh-model-grid{display:flex;flex-direction:column;gap:2px;}
        .mesh-model-opt{
          display:flex;align-items:center;gap:6px;padding:4px 6px;
          border:1px solid var(--border);cursor:pointer;transition:all .12s;
        }
        .mesh-model-opt:hover{border-color:var(--red-dim);background:var(--red-glow2);}
        .mesh-model-opt.selected{border-color:var(--red);background:var(--red-glow);}
        .mesh-model-radio{
          width:8px;height:8px;border:1px solid var(--red-dim);border-radius:50%;flex-shrink:0;
          display:flex;align-items:center;justify-content:center;
        }
        .mesh-model-opt.selected .mesh-model-radio::after{
          content:'';width:4px;height:4px;border-radius:50%;background:var(--red);display:block;
        }
        .mesh-model-name{font-size:9px;color:var(--text);letter-spacing:.08em;flex:1;}
        .mesh-model-opt.selected .mesh-model-name{color:var(--red);}
        .mesh-model-meta{display:flex;gap:6px;flex-shrink:0;}
        .mesh-model-tag{font-size:7px;color:var(--text-dim);letter-spacing:.08em;}
        .mesh-model-tag--input{color:var(--steel-light);}

        /* ── Service status in topbar ── */
        .service-status-dot{
          width:6px;height:6px;border-radius:50%;display:inline-block;margin-right:4px;
          background:var(--text-dim);
        }
        .service-status-dot--online{background:var(--green);box-shadow:0 0 4px var(--green);}
        .service-status-dot--offline{background:var(--red-dim);}
        .service-status-dot--checking{background:#cc8800;animation:blink .8s steps(1) infinite;}

        /* ── Conversation menu dropdown ── */
        .conv-menu-wrap{position:relative;}
        .conv-menu{
          position:absolute;top:calc(100% + 4px);right:0;z-index:200;
          background:var(--panel);border:1px solid var(--border-accent);
          min-width:170px;
          box-shadow:0 8px 24px rgba(0,0,0,.7),0 0 12px rgba(204,34,0,.1);
        }
        .conv-menu-item{
          width:100%;background:none;border:none;
          color:var(--text-mid);font-family:var(--mono);font-size:9px;
          padding:9px 12px;cursor:pointer;letter-spacing:.12em;
          display:flex;align-items:center;gap:8px;
          transition:all .12s;text-align:left;
        }
        .conv-menu-item:hover{background:var(--red-glow2);color:var(--text);}
        .conv-menu-item--danger:hover{background:rgba(204,34,0,.12);color:var(--red);}
        .conv-menu-icon{font-size:10px;width:12px;text-align:center;flex-shrink:0;}
        .conv-menu-divider{height:1px;background:var(--border);}

        /* ── Status Bar ── */
        .statusbar-left{display:flex;gap:16px;overflow:hidden;white-space:nowrap;}
        .statusbar-right{display:flex;gap:16px;flex-shrink:0;white-space:nowrap;}
        .status-dot{width:5px;height:5px;border-radius:50%;background:var(--green);display:inline-block;margin-right:5px;box-shadow:0 0 4px var(--green);}
      `}</style>

      <div className={`terminal ${blueprintVisible?"":"bp-hidden"}`}>
        <Scanlines/>

        {/* ── Settings Popups ── */}
        {openPopup==="temp" && <SettingsPopup anchor={popupAnchor} label="TEMPERATURE" type="slider" min={0} max={2} step={0.01} value={temperature} onChange={v=>setChatSetting("temperature",v)} onClose={()=>setOpenPopup(null)}/>}
        {openPopup==="topp" && <SettingsPopup anchor={popupAnchor} label="TOP_P" type="slider" min={0} max={1} step={0.01} value={topP} onChange={v=>setChatSetting("topP",v)} onClose={()=>setOpenPopup(null)}/>}
        {openPopup==="maxtok" && <SettingsPopup anchor={popupAnchor} label="MAX TOKENS" type="number" min={64} max={32768} step={64} value={maxTokens} onChange={v=>setChatSetting("maxTokens",v)} onClose={()=>setOpenPopup(null)}/>}

        {/* ── System Prompt Modal ── */}
        {showSysPrompt && <SystemPromptModal value={systemPrompt} onChange={setSystemPrompt} onClose={()=>setShowSysPrompt(false)}/>}

        {/* ── Top Bar ── */}
        <header className="topbar">
          <div className="brand">
            <svg className="brand-icon" viewBox="0 0 36 36" fill="none">
              <polygon points="18,2 22,8 30,6 28,14 34,18 28,22 30,30 22,28 18,34 14,28 6,30 8,22 2,18 8,14 6,6 14,8" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
              <polygon points="18,8 21,13 26,11 24,16 29,18 24,20 26,25 21,23 18,28 15,23 10,25 12,20 7,18 12,16 10,11 15,13" stroke="#cc2200" strokeWidth="0.6" fill="#cc220015"/>
              <circle cx="18" cy="18" r="4" fill="#cc2200" opacity="0.8"/>
            </svg>
            <div className="brand-text">
              <span className="brand-name">IRON MERIDIAN TERMINAL</span>
              <span className="brand-sub">LOCAL AI INTERFACE v2.5.0</span>
            </div>
          </div>
          <div className="topbar-divider"/>
          <StatBox label="MODEL" value={selectedModel}/>
          <StatBox label="CONTEXT" value={`${contextTokens.toLocaleString()} TOKENS`}/>
          <StatBox label="TEMP" value={temperature.toFixed(2)} interactive btnRef={tempBtnRef}
            onClick={()=>{setPopupAnchor(getPopupAnchor(tempBtnRef));setOpenPopup(p=>p==="temp"?null:"temp");}}/>
          <StatBox label="TOP_P" value={topP.toFixed(2)} interactive btnRef={toppBtnRef}
            onClick={()=>{setPopupAnchor(getPopupAnchor(toppBtnRef));setOpenPopup(p=>p==="topp"?null:"topp");}}/>
          <StatBox label="MAX TOKENS" value={maxTokens.toLocaleString()} interactive btnRef={maxTokBtnRef}
            onClick={()=>{setPopupAnchor(getPopupAnchor(maxTokBtnRef));setOpenPopup(p=>p==="maxtok"?null:"maxtok");}}/>
          <div className="topbar-spacer"/>
          <div className="system-status">
            <span className="sys-label">OLLAMA</span>
            <span className={`sys-val ${ollamaStatus==="RUNNING"?"sys-val--ok":ollamaStatus==="CHECKING"?"sys-val--warn":""}`}>{ollamaStatus}</span>
            <span className="sys-label">SERVICE</span>
            <span className={`sys-val ${serviceStatus==="ONLINE"?"sys-val--ok":serviceStatus==="CHECKING"?"sys-val--warn":""}`}>
              <span className={`service-status-dot ${serviceStatus==="ONLINE"?"service-status-dot--online":serviceStatus==="CHECKING"?"service-status-dot--checking":"service-status-dot--offline"}`}/>
              {serviceStatus}
            </span>
            <span className="sys-label">VRAM</span>
            <VRAMBar used={vramUsed} total={vramTotal||1}/>
            <span className="vram-label">{vramStr}</span>
          </div>
        </header>

        {/* ── Left Sidebar ── */}
        <aside className="sidebar-left">
          <div className="sidebar-section">
            <span className="sidebar-section-label">// CHATS</span>
            <div className="sidebar-section-actions">
              <button className="sidebar-btn sidebar-btn--sys" onClick={()=>setShowSysPrompt(true)} title="Edit system prompt">SYS</button>
              <button className="sidebar-btn" onClick={newChat} title="New Chat">+</button>
            </div>
          </div>
          <div className="search-wrap">
            <input className="search-input" placeholder="SEARCH SESSIONS..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
          </div>
          <div className="chat-list">
            {filteredChats.map(c=><ChatItem key={c.id} chat={c} active={c.id===activeChatId} onClick={()=>switchChat(c.id)} onDelete={deleteChat}/>)}
          </div>
          <div className="model-panel">
            <div className="model-panel-label">// CURRENT MODEL</div>
            <div className="model-icon-wrap">
              <svg className="model-icon" viewBox="0 0 44 44" fill="none">
                <circle cx="22" cy="22" r="20" stroke="#cc2200" strokeWidth="0.8" fill="none" strokeDasharray="4 3"/>
                <circle cx="22" cy="22" r="12" stroke="#cc2200" strokeWidth="1" fill="none"/>
                <circle cx="22" cy="22" r="6" stroke="#cc2200" strokeWidth="0.6" fill="#cc220020"/>
                {[0,60,120,180,240,300].map(a=>{const r=Math.PI*a/180;return<line key={a} x1={22+12*Math.cos(r)} y1={22+12*Math.sin(r)} x2={22+20*Math.cos(r)} y2={22+20*Math.sin(r)} stroke="#cc2200" strokeWidth="0.8"/>;})}<circle cx="22" cy="22" r="2" fill="#cc2200"/>
              </svg>
              <div className="model-info">
                {ollamaModels.length>0
                  ? <CustomModelSelector models={ollamaModels} selected={selectedModel} onChange={setSelectedModel}/>
                  : <div className="model-name">{selectedModel}</div>}
                <div className="model-row"><span className="model-key">CONTEXT WINDOW</span><span className="model-val">{contextTokens.toLocaleString()}</span></div>
                <div className="model-row"><span className="model-key">TEMPERATURE</span><span className="model-val">{temperature.toFixed(2)}</span></div>
                <div className={`sys-prompt-indicator ${systemPrompt.trim()?"active":""}`}><span className="sys-dot"/>{systemPrompt.trim()?"DIRECTIVE ACTIVE":"NO DIRECTIVE"}</div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Chat ── */}
        <main className="main-chat">
          <div className="conv-header">
            <span className="conv-title">// CONVERSATION: {activeChat?.title?.toUpperCase()||"NEW SESSION"}</span>
            <div className="conv-actions">
              {/* Text alignment toggle */}
              <button className={`align-btn ${textAlign==="left"?"active":""}`} onClick={()=>setTextAlign("left")} title="Align left">≡</button>
              <button className={`align-btn ${textAlign==="center"?"active":""}`} onClick={()=>setTextAlign("center")} title="Align center">≡</button>
              <button className={`align-btn ${textAlign==="right"?"active":""}`} onClick={()=>setTextAlign("right")} title="Align right">≡</button>
              <button className={`bp-toggle-btn ${blueprintVisible?"active":""}`}
                onClick={()=>setBlueprintVisible(v=>!v)}
                title={blueprintVisible?"Hide blueprint panel":"Show blueprint panel"}>
                {blueprintVisible?"HIDE BP":"SHOW BP"}
              </button>
              <button className="conv-btn" title="Download transcript" onClick={()=>{
                const text=(activeChat?.messages||[]).map(m=>`[${m.role.toUpperCase()} ${m.time}]\n${m.content}`).join("\n\n---\n\n");
                const a=document.createElement("a");a.href=URL.createObjectURL(new Blob([text],{type:"text/plain"}));a.download=`${activeChat?.title||"session"}.txt`;a.click();
              }}>↓</button>
              <button className="conv-btn" title="Toggle fullscreen" onClick={()=>{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();}}>⤢</button>
              <ConvMenu
                onClear={()=>setChats(prev=>prev.map(c=>c.id!==activeChatId?c:{...c,messages:[]}))}
                onDelete={()=>deleteChat(activeChatId)}
              />
            </div>
          </div>
          <div className="messages-area" style={{textAlign}}>
            {(activeChat?.messages||[]).map((msg,i)=>(
              <Message key={i} msg={msg} isStreaming={isStreaming&&i===(activeChat.messages.length-1)&&msg.role==="assistant"}/>
            ))}
            {(activeChat?.messages||[]).length===0&&(
              <div style={{color:"var(--text-dim)",fontSize:"11px",letterSpacing:".08em",textAlign:"center",marginTop:"60px",opacity:.5}}>— AWAITING INPUT —</div>
            )}
            <div ref={chatEndRef}/>
          </div>
          <div className="input-area">
            <div className="input-row">
              <span className="input-prompt">&gt;</span>
              <textarea ref={textareaRef} className="cmd-input" placeholder="Ask the machine..."
                value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}} rows={1}/>
              {isStreaming
                ? <button className="stop-btn" onClick={stopGeneration}>■ STOP</button>
                : <button className="send-btn" onClick={sendMessage} disabled={!input.trim()}>SEND ›</button>}
            </div>
            <div className="input-meta">
              <span>INPUT MODE: COMMAND{systemPrompt.trim()?" · DIRECTIVE ARMED":""}</span>
              <span>SHIFT+ENTER FOR NEWLINE</span>
            </div>
          </div>
        </main>

        {/* ── Right Sidebar: Blueprint Panel ── */}
        <aside className="sidebar-right">
          {/* Header */}
          <div className="bp-header">
            <div className="bp-header-left">
              <div className="bp-section-label">// {displayBlueprint.type?.toUpperCase()||"MECH"} BLUEPRINT</div>
              <div className="bp-name">{displayBlueprint.name||"UNKNOWN"}</div>
              <div className="bp-role">{displayBlueprint.role||"—"}</div>
            </div>
            <div className="bp-header-right">
              <span className="bp-mode-label">BLUEPRINT MODE</span>
              <span className={`bp-mode-val ${blueprintMode==="LOCKED"?"bp-mode-val--locked":blueprintMode==="CUSTOM"?"bp-mode-val--custom":""}`}>{blueprintMode}</span>
            </div>
          </div>

          {/* Main display — use service-generated SVG if available */}
          <div className="bp-main">
            <BlueprintWrapper isGenerating={isGeneratingBp}>
              {generatedSVGs?.[activeView]
                ? <div dangerouslySetInnerHTML={{__html: generatedSVGs[activeView]}} style={{width:"100%"}}/>
                : renderBlueprint(displayBlueprint, activeView)
              }
            </BlueprintWrapper>
          </div>

          {/* Progress bar — visible only during generation */}
          {isGeneratingBp && (
            <div className="bp-progress">
              <div className="bp-progress-label">
                <span>{bpStage || "PROCESSING"}</span>
                <span className="bp-progress-pct">{bpProgress}%</span>
              </div>
              <div className="bp-progress-track">
                <div className="bp-progress-fill" style={{width:`${bpProgress}%`}}/>
              </div>
            </div>
          )}

          {/* View controls */}
          <div className="view-controls">
            {VIEWS.map(v=>(
              <ViewBtn key={v} view={v} label={v.toUpperCase()} active={activeView===v} blueprint={displayBlueprint} onClick={()=>setActiveView(v)}/>
            ))}
          </div>

          {/* Mesh model selector */}
          <div className="mesh-model-wrap">
            <div className="mesh-model-label">// MESH MODEL</div>
            <div className="mesh-model-grid">
              {MESH_MODELS.map(m=>(
                <div key={m.id}
                  className={`mesh-model-opt ${meshModel===m.id?"selected":""}`}
                  onClick={()=>setChatSetting("meshModel", m.id)}>
                  <div className="mesh-model-radio"/>
                  <span className="mesh-model-name">{m.label}</span>
                  <div className="mesh-model-meta">
                    <span className="mesh-model-tag mesh-model-tag--input">{m.input}</span>
                    <span className="mesh-model-tag">{m.vram}</span>
                    <span className="mesh-model-tag">{m.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Specs + Systems */}
          <div className="bp-info">
            <div className="bp-info-col">
              <span className="bp-sub-label">// SPECS</span>
              {(displayBlueprint.specs||[]).map(([k,v])=>(
                <div key={k} className="spec-row"><span className="spec-key">{k}</span><span className="spec-val">{v}</span></div>
              ))}
            </div>
            <div className="bp-info-col">
              <span className="bp-sub-label">// SYSTEMS</span>
              {(displayBlueprint.systems||[]).map((s,i)=>(
                <div key={i} className="sys-item">{s.toUpperCase()}</div>
              ))}
            </div>
          </div>

          {/* Action buttons */}
          <div className="bp-actions">
            <div className="bp-actions-row">
              <button
                className={`bp-btn bp-btn--primary ${isGeneratingBp?"bp-btn--generating":""}`}
                onClick={generateBlueprint}
                disabled={isGeneratingBp}
              >
                {isGeneratingBp
                  ? `⟳ ${bpStage||"GENERATING..."}`
                  : serviceStatus==="ONLINE"
                    ? "⬡ GENERATE 3D BLUEPRINT"
                    : "⬡ GENERATE PROJECT BLUEPRINT"
                }
              </button>
              <button
                className={`bp-btn ${blueprintMode==="LOCKED"?"bp-btn--active":""}`}
                onClick={lockBlueprint}
                title={blueprintMode==="LOCKED"?"Unlock blueprint":"Lock current blueprint"}
              >
                {blueprintMode==="LOCKED"?"🔒 UNLOCK":"🔒 LOCK BLUEPRINT"}
              </button>
            </div>
            <div className="bp-actions-row">
              <button className="bp-btn bp-btn--reset" onClick={resetBlueprint}>⟲ RESET BLUEPRINT</button>
              <button className="bp-btn" onClick={downloadBlueprint} title="Download as SVG">↓ DOWNLOAD SVG</button>
            </div>
          </div>
        </aside>

        {/* ── Status Bar ── */}
        <footer className="statusbar">
          <div className="statusbar-left">
            <span>INPUT MODE: COMMAND</span>
            <span>ENCRYPTION: <span style={{color:"var(--green)"}}>ON</span></span>
            <span>BLUEPRINT: <span style={{color:blueprintMode==="AUTO"?"var(--green)":blueprintMode==="LOCKED"?"#cc8800":"var(--red)"}}>{blueprintMode}</span></span>
          </div>
          <div className="statusbar-right">
            <span>LINK: LOCALHOST</span>
            <span><span className="status-dot"/>SYSTEM NOMINAL</span>
            <span>_</span>
          </div>
        </footer>
      </div>
    </>
  );
}
