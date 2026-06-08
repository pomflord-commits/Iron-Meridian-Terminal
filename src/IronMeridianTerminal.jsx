import { useState, useEffect, useRef, useCallback } from "react";

// ── Blueprint SVGs (with animated wrapper) ────────────────────────────────────

const BlueprintFrame = ({ children, viewBox }) => (
  <svg viewBox={viewBox} fill="none" xmlns="http://www.w3.org/2000/svg" className="blueprint-svg">
    <defs>
      <filter id="bp-glow">
        <feGaussianBlur stdDeviation="2" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <filter id="bp-glow-strong">
        <feGaussianBlur stdDeviation="3.5" result="blur"/>
        <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
      </filter>
      <radialGradient id="bp-holo" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stopColor="#cc2200" stopOpacity="0.08"/>
        <stop offset="100%" stopColor="#cc2200" stopOpacity="0"/>
      </radialGradient>
    </defs>
    {/* Holographic background glow */}
    <rect width="100%" height="100%" fill="url(#bp-holo)"/>
    {/* Blueprint grid */}
    {Array.from({length:20}).map((_,i) => (
      <line key={`bgh${i}`} x1="0" y1={i*20} x2="9999" y2={i*20} stroke="#cc2200" strokeWidth="0.18" opacity="0.18"/>
    ))}
    {Array.from({length:20}).map((_,i) => (
      <line key={`bgv${i}`} x1={i*20} y1="0" x2={i*20} y2="9999" stroke="#cc2200" strokeWidth="0.18" opacity="0.18"/>
    ))}
    {children}
  </svg>
);

const MechBlueprint = () => (
  <BlueprintFrame viewBox="0 0 260 320">
    {/* Head */}
    <rect x="100" y="10" width="60" height="45" rx="2" stroke="#cc2200" strokeWidth="1.2" fill="none" filter="url(#bp-glow)"/>
    <rect x="108" y="18" width="18" height="12" rx="1" stroke="#cc2200" strokeWidth="0.8" fill="#cc220018"/>
    <rect x="134" y="18" width="18" height="12" rx="1" stroke="#cc2200" strokeWidth="0.8" fill="#cc220018"/>
    <line x1="100" y1="38" x2="160" y2="38" stroke="#cc2200" strokeWidth="0.6"/>
    <line x1="130" y1="10" x2="130" y2="0" stroke="#cc2200" strokeWidth="0.8"/>
    <polygon points="120,0 130,0 130,8 120,8" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
    {/* Neck */}
    <rect x="118" y="55" width="24" height="14" stroke="#cc2200" strokeWidth="1" fill="none"/>
    {/* Torso */}
    <rect x="75" y="69" width="110" height="85" rx="2" stroke="#cc2200" strokeWidth="1.5" fill="none" filter="url(#bp-glow)"/>
    <rect x="90" y="80" width="80" height="55" rx="1" stroke="#cc2200" strokeWidth="0.6" fill="#cc22000a"/>
    <line x1="130" y1="69" x2="130" y2="154" stroke="#cc2200" strokeWidth="0.5"/>
    <circle cx="130" cy="111" r="20" stroke="#cc2200" strokeWidth="0.8" fill="none" filter="url(#bp-glow)"/>
    <circle cx="130" cy="111" r="10" stroke="#cc2200" strokeWidth="0.6" fill="#cc220025"/>
    <circle cx="130" cy="111" r="3" fill="#cc2200" opacity="0.8"/>
    {/* Shoulders */}
    <rect x="30" y="72" width="44" height="30" rx="2" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
    <polygon points="30,86 10,80 10,96 30,102" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
    <rect x="186" y="72" width="44" height="30" rx="2" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
    <polygon points="230,86 250,80 250,96 230,102" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
    {/* Arms */}
    <rect x="18" y="102" width="28" height="70" rx="2" stroke="#cc2200" strokeWidth="1" fill="none"/>
    <rect x="6" y="142" width="16" height="50" rx="1" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
    <line x1="18" y1="137" x2="46" y2="137" stroke="#cc2200" strokeWidth="0.5"/>
    <rect x="214" y="102" width="28" height="70" rx="2" stroke="#cc2200" strokeWidth="1" fill="none"/>
    <rect x="238" y="142" width="16" height="50" rx="1" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
    <line x1="214" y1="137" x2="242" y2="137" stroke="#cc2200" strokeWidth="0.5"/>
    {/* Claws */}
    {[0,1,2,3].map(i => <line key={i} x1={8+i*3} y1="192" x2={6+i*4} y2="204" stroke="#cc2200" strokeWidth="0.8"/>)}
    {[0,1,2,3].map(i => <line key={i+4} x1={240+i*3} y1="192" x2={238+i*4} y2="204" stroke="#cc2200" strokeWidth="0.8"/>)}
    {/* Hips + Legs + Feet */}
    <rect x="88" y="154" width="84" height="24" rx="1" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
    <rect x="88" y="178" width="34" height="80" rx="2" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
    <line x1="88" y1="218" x2="122" y2="218" stroke="#cc2200" strokeWidth="0.5"/>
    <rect x="138" y="178" width="34" height="80" rx="2" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
    <line x1="138" y1="218" x2="172" y2="218" stroke="#cc2200" strokeWidth="0.5"/>
    <rect x="82" y="258" width="46" height="18" rx="1" stroke="#cc2200" strokeWidth="1" fill="none"/>
    <rect x="132" y="258" width="46" height="18" rx="1" stroke="#cc2200" strokeWidth="1" fill="none"/>
    {/* Dimension lines */}
    <line x1="265" y1="10" x2="265" y2="276" stroke="#cc2200" strokeWidth="0.5" opacity="0.5"/>
    <line x1="260" y1="10" x2="270" y2="10" stroke="#cc2200" strokeWidth="0.5" opacity="0.5"/>
    <line x1="260" y1="276" x2="270" y2="276" stroke="#cc2200" strokeWidth="0.5" opacity="0.5"/>
    <text x="242" y="143" fill="#cc2200" fontSize="7" fontFamily="monospace" opacity="0.7" transform="rotate(-90,242,143)">4.20m</text>
  </BlueprintFrame>
);

const ServerBlueprint = () => (
  <BlueprintFrame viewBox="0 0 260 280">
    {[0,1,2,3,4,5].map(i => (
      <g key={i}>
        <rect x="20" y={20+i*40} width="220" height="28" rx="1" stroke="#cc2200" strokeWidth="1.2" fill="none" filter={i===0?"url(#bp-glow)":undefined}/>
        <rect x="28" y={26+i*40} width="8" height="16" rx="1" stroke="#cc2200" strokeWidth="0.6" fill="#cc220022"/>
        <rect x="42" y={26+i*40} width="8" height="16" rx="1" stroke="#cc2200" strokeWidth="0.6" fill="#cc220022"/>
        <line x1="60" y1={34+i*40} x2="200" y2={34+i*40} stroke="#cc2200" strokeWidth="0.4" strokeDasharray="4 3"/>
        <circle cx="220" cy={34+i*40} r="5" stroke="#cc2200" strokeWidth="0.8" fill={i%2===0?"#cc220040":"none"}/>
      </g>
    ))}
    <rect x="10" y="10" width="240" height="260" stroke="#cc2200" strokeWidth="0.8" fill="none" strokeDasharray="6 4"/>
  </BlueprintFrame>
);

const TypewriterBlueprint = () => (
  <BlueprintFrame viewBox="0 0 260 280">
    <rect x="20" y="30" width="220" height="160" rx="3" stroke="#cc2200" strokeWidth="1.5" fill="none" filter="url(#bp-glow)"/>
    <rect x="30" y="42" width="200" height="100" rx="1" stroke="#cc2200" strokeWidth="0.8" fill="#cc22000a"/>
    {[0,1,2,3,4].map(i => <line key={i} x1="38" y1={55+i*18} x2={38+110} y2={55+i*18} stroke="#cc2200" strokeWidth="0.6" opacity="0.45"/>)}
    <rect x="60" y="200" width="140" height="25" rx="2" stroke="#cc2200" strokeWidth="1" fill="none"/>
    {[0,1,2,3,4,5,6,7,8,9].map(i => <rect key={i} x={65+i*13} y="204" width="10" height="17" rx="1" stroke="#cc2200" strokeWidth="0.6" fill="none"/>)}
    <line x1="130" y1="155" x2="130" y2="198" stroke="#cc2200" strokeWidth="0.8"/>
    <line x1="20" y1="265" x2="240" y2="265" stroke="#cc2200" strokeWidth="1.2"/>
  </BlueprintFrame>
);

const CastleBlueprint = () => (
  <BlueprintFrame viewBox="0 0 260 280">
    <rect x="80" y="80" width="100" height="160" stroke="#cc2200" strokeWidth="1.5" fill="none" filter="url(#bp-glow)"/>
    {[80,96,112,128,144,160,176].map((x,i) => i%2===0 && <rect key={x} x={x} y="68" width="12" height="14" stroke="#cc2200" strokeWidth="1" fill="none"/>)}
    <path d="M108 240 L108 200 Q130 185 152 200 L152 240" stroke="#cc2200" strokeWidth="1" fill="none"/>
    <rect x="20" y="100" width="56" height="140" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
    {[20,34,48,60,70].map((x,i) => i%2===0 && <rect key={x} x={x} y="88" width="10" height="14" stroke="#cc2200" strokeWidth="0.8" fill="none"/>)}
    <rect x="184" y="100" width="56" height="140" stroke="#cc2200" strokeWidth="1.2" fill="none"/>
    {[184,198,212,226,236].map((x,i) => i%2===0 && <rect key={x} x={x} y="88" width="10" height="14" stroke="#cc2200" strokeWidth="0.8" fill="none"/>)}
    {[0,1,2].map(i => <rect key={i} x={105+i*20} y={110+i*30} width="12" height="18" rx="1" stroke="#cc2200" strokeWidth="0.6" fill="#cc220015"/>)}
    <line x1="0" y1="240" x2="260" y2="240" stroke="#cc2200" strokeWidth="1"/>
  </BlueprintFrame>
);

const DroneBlueprint = () => (
  <BlueprintFrame viewBox="0 0 260 240">
    <ellipse cx="130" cy="120" rx="36" ry="22" stroke="#cc2200" strokeWidth="1.5" fill="none" filter="url(#bp-glow)"/>
    <ellipse cx="130" cy="120" rx="18" ry="12" stroke="#cc2200" strokeWidth="0.8" fill="#cc220018"/>
    <line x1="94" y1="110" x2="44" y2="80" stroke="#cc2200" strokeWidth="1"/>
    <line x1="94" y1="130" x2="44" y2="160" stroke="#cc2200" strokeWidth="1"/>
    <line x1="166" y1="110" x2="216" y2="80" stroke="#cc2200" strokeWidth="1"/>
    <line x1="166" y1="130" x2="216" y2="160" stroke="#cc2200" strokeWidth="1"/>
    {[[44,80],[44,160],[216,80],[216,160]].map(([cx,cy],i) => (
      <g key={i}>
        <circle cx={cx} cy={cy} r="22" stroke="#cc2200" strokeWidth="0.6" fill="none" strokeDasharray="4 3"/>
        <line x1={cx-22} y1={cy} x2={cx+22} y2={cy} stroke="#cc2200" strokeWidth="0.8"/>
        <line x1={cx} y1={cy-22} x2={cx} y2={cy+22} stroke="#cc2200" strokeWidth="0.8"/>
        <circle cx={cx} cy={cy} r="4" stroke="#cc2200" strokeWidth="1" fill="none"/>
      </g>
    ))}
    <rect x="118" y="138" width="24" height="16" rx="2" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
    <circle cx="130" cy="146" r="5" stroke="#cc2200" strokeWidth="0.6" fill="#cc220020"/>
  </BlueprintFrame>
);

// ── Blueprint detection ───────────────────────────────────────────────────────
function detectBlueprintType(messages) {
  const t = messages.map(m => m.content).join(" ").toLowerCase();
  if (/mech|robot|assault|breacher|battlesuit|exo/.test(t)) return "mech";
  if (/code|program|function|class|algorithm|server|api|debug/.test(t)) return "server";
  if (/write|story|novel|essay|article|poem|narrative|prose/.test(t)) return "typewriter";
  if (/castle|dungeon|fantasy|world|kingdom|realm|dragon|magic/.test(t)) return "castle";
  if (/drone|uav|aerial|flight|quadcopter|surveillance/.test(t)) return "drone";
  return "mech";
}
function getBlueprintLabel(t) { return {mech:"BREACHER MK-IV",server:"NODE CLUSTER",typewriter:"SCRIBE ENGINE",castle:"IRON KEEP",drone:"RECON UAV"}[t]||"BREACHER MK-IV"; }
function getBlueprintClass(t) { return {mech:"SHOCK ASSAULT",server:"COMPUTE NODE",typewriter:"NARRATIVE AI",castle:"FORTRESS NODE",drone:"AERIAL OPS"}[t]||"SHOCK ASSAULT"; }

// ── VRAM Bar ──────────────────────────────────────────────────────────────────
const VRAMBar = ({ used, total }) => {
  const pct = Math.min((used / Math.max(total,1)) * 100, 100);
  const segs = 10;
  return (
    <div className="vram-bar">
      {Array.from({length:segs}).map((_,i) => (
        <div key={i} className={`vram-seg ${(i/segs)*100 < pct ? "vram-seg--on":""}`}/>
      ))}
    </div>
  );
};

// ── Interactive Stat Box ──────────────────────────────────────────────────────
const StatBox = ({ label, value, onClick, interactive, btnRef }) => (
  <div ref={btnRef} className={`stat-box ${interactive?"stat-box--interactive":""}`} onClick={onClick} title={interactive?"Click to adjust":undefined}>
    <div className="stat-label">{label}{interactive && <span className="stat-edit-hint"> ✎</span>}</div>
    <div className="stat-value">{value}</div>
  </div>
);

// ── Settings Popup ────────────────────────────────────────────────────────────
const SettingsPopup = ({ anchor, label, type, min, max, step, value, onChange, onClose }) => {
  const [draft, setDraft] = useState(value);
  const ref = useRef(null);
  // Keep a stable ref to onClose so the effect never needs to re-run
  const onCloseRef = useRef(onClose);
  useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

  useEffect(() => { setDraft(value); }, [value]);

  useEffect(() => {
    // Use a short delay so the mousedown that opened the popup doesn't
    // immediately re-trigger the outside-click handler on the same frame.
    let active = false;
    const tid = setTimeout(() => { active = true; }, 80);
    const handler = e => {
      if (!active) return;
      if (ref.current && !ref.current.contains(e.target)) {
        onCloseRef.current();
      }
    };
    document.addEventListener("mousedown", handler);
    return () => { clearTimeout(tid); document.removeEventListener("mousedown", handler); };
  // Empty deps: register once on mount, use the stable ref for the callback
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const apply = () => { onChange(draft); onClose(); };

  return (
    <div className="settings-popup" ref={ref} style={anchor}
      // Stop any mousedown inside the popup from bubbling to the document
      // handler above — belt-and-suspenders safety
      onMouseDown={e => e.stopPropagation()}>
      <div className="settings-popup-title">{label}</div>
      <div className="settings-popup-divider" />
      {type === "slider" ? (
        <>
          <div className="settings-slider-wrap">
            <input
              type="range" min={min} max={max} step={step}
              value={draft}
              onChange={e => setDraft(parseFloat(e.target.value))}
              className="settings-slider"
            />
          </div>
          <div className="settings-val">{draft.toFixed(step < 1 ? 2 : 0)}</div>
        </>
      ) : (
        <input
          type="number" min={min} max={max} step={step}
          value={draft}
          onChange={e => setDraft(parseInt(e.target.value) || min)}
          className="settings-number"
        />
      )}
      <button className="settings-apply" onClick={apply}>[ APPLY ]</button>
    </div>
  );
};

// ── System Prompt Modal ───────────────────────────────────────────────────────
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
          <div className="modal-desc">
            Injected as <span style={{color:"var(--red)"}}>role: "system"</span> before all user messages. Defines the machine's behaviour and persona.
          </div>
          <textarea
            className="modal-textarea"
            value={draft}
            onChange={e => setDraft(e.target.value)}
            placeholder="You are Iron Meridian, a battle-hardened tactical AI operating from a fortified command node..."
            spellCheck={false}
          />
        </div>
        <div className="modal-footer">
          <span className="modal-hint">{draft.length} chars</span>
          <div style={{display:"flex",gap:"8px"}}>
            <button className="modal-btn modal-btn--ghost" onClick={() => setDraft("")}>CLEAR</button>
            <button className="modal-btn" onClick={() => { onChange(draft); onClose(); }}>[ SAVE DIRECTIVE ]</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// ── Message rendering ─────────────────────────────────────────────────────────
const CodeBlock = ({ code, lang }) => {
  const [copied, setCopied] = useState(false);
  const copy = () => { navigator.clipboard?.writeText(code).catch(()=>{}); setCopied(true); setTimeout(()=>setCopied(false),1500); };
  return (
    <div className="code-block">
      <div className="code-header">
        <span className="code-lang">{lang||"code"}</span>
        <button className="code-copy" onClick={copy}>{copied?"COPIED":"COPY"}</button>
      </div>
      <pre className="code-body"><code>{code}</code></pre>
    </div>
  );
};

function renderContent(text) {
  const parts = []; const codeRe = /```(\w*)\n?([\s\S]*?)```/g; let last=0,m;
  while ((m=codeRe.exec(text))!==null) {
    if (m.index>last) parts.push({type:"text",content:text.slice(last,m.index)});
    parts.push({type:"code",lang:m[1],content:m[2]}); last=m.index+m[0].length;
  }
  if (last<text.length) parts.push({type:"text",content:text.slice(last)});
  return parts.map((p,i) => p.type==="code"
    ? <CodeBlock key={i} code={p.content} lang={p.lang}/>
    : <span key={i} className="msg-text">{p.content.split("\n").map((l,j)=><span key={j}>{l}<br/></span>)}</span>
  );
}

const Message = ({ msg, isStreaming }) => {
  const isUser = msg.role==="user";
  return (
    <div className={`msg ${isUser?"msg--user":"msg--ai"}`}>
      <div className="msg-header">
        <span className="msg-role">{isUser?"YOU":"IRON MERIDIAN"}</span>
        <span className="msg-time">{msg.time}</span>
      </div>
      <div className="msg-body">
        {renderContent(msg.content)}
        {isStreaming && <span className="cursor-blink">▌</span>}
      </div>
    </div>
  );
};

const ChatItem = ({ chat, active, onClick }) => (
  <div className={`chat-item ${active?"chat-item--active":""}`} onClick={onClick}>
    <div className="chat-item-title">{chat.title}</div>
    <div className="chat-item-meta">
      <span className="chat-item-preview">{chat.preview}</span>
      <span className="chat-item-time">{chat.time}</span>
    </div>
  </div>
);

const Scanlines = () => (
  <div className="scanlines" aria-hidden="true"><div className="scanlines-inner"/></div>
);

// ── Default settings for a new chat ──────────────────────────────────────────
const DEFAULT_CHAT_SETTINGS = { temperature: 0.7, topP: 0.95, maxTokens: 2048 };

function hydrateChats(raw) {
  // Ensure every chat has settings fields (handles older stored data)
  return raw.map(c => ({
    ...DEFAULT_CHAT_SETTINGS,
    ...c,
  }));
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

// ── Main App ──────────────────────────────────────────────────────────────────
export default function IronMeridianTerminal() {
  const [chats, setChats] = useState(() => {
    try {
      const stored = localStorage.getItem("im_chats");
      if (stored) return hydrateChats(JSON.parse(stored));
    } catch {}
    return INITIAL_CHATS;
  });
  const [activeChatId, setActiveChatId] = useState(() => {
    try { return parseInt(localStorage.getItem("im_active_chat")) || 1; } catch { return 1; }
  });
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [ollamaModels, setOllamaModels] = useState([]);
  const [selectedModel, setSelectedModel] = useState("SUPERGEMMA4-26B");
  const [contextTokens, setContextTokens] = useState(8192);
  const [vramUsed, setVramUsed] = useState(0);
  const [vramTotal, setVramTotal] = useState(0);
  const [loadedModelName, setLoadedModelName] = useState("");
  const [ollamaStatus, setOllamaStatus] = useState("CHECKING");
  const [searchQuery, setSearchQuery] = useState("");
  const [openPopup, setOpenPopup] = useState(null);
  const [popupAnchor, setPopupAnchor] = useState({ top: 62, left: 400 });
  const [showSysPrompt, setShowSysPrompt] = useState(false);
  const [systemPrompt, setSystemPrompt] = useState(
    () => localStorage.getItem("im_system_prompt") || ""
  );
  const chatEndRef = useRef(null);
  const abortRef = useRef(null);
  const textareaRef = useRef(null);
  const tempBtnRef = useRef(null);
  const toppBtnRef = useRef(null);
  const maxTokBtnRef = useRef(null);

  const getPopupAnchor = (ref) => {
    if (!ref.current) return { top: 62, left: 400 };
    const r = ref.current.getBoundingClientRect();
    return { top: r.bottom + 4, left: r.left };
  };

  const activeChat = chats.find(c => c.id === activeChatId) || chats[0];
  const blueprintType = detectBlueprintType(activeChat?.messages || []);

  // Derive per-chat settings from the active chat
  const temperature = activeChat?.temperature ?? DEFAULT_CHAT_SETTINGS.temperature;
  const topP        = activeChat?.topP        ?? DEFAULT_CHAT_SETTINGS.topP;
  const maxTokens   = activeChat?.maxTokens   ?? DEFAULT_CHAT_SETTINGS.maxTokens;

  // Helper: write a settings field back into the active chat
  const setChatSetting = useCallback((key, val) => {
    setChats(prev => prev.map(c => c.id !== activeChatId ? c : { ...c, [key]: val }));
  }, [activeChatId]);

  // ── Persist chats + active chat to localStorage ──
  useEffect(() => {
    try { localStorage.setItem("im_chats", JSON.stringify(chats)); } catch {}
  }, [chats]);
  useEffect(() => {
    try { localStorage.setItem("im_active_chat", String(activeChatId)); } catch {}
  }, [activeChatId]);

  // ── Persist system prompt ──
  useEffect(() => { localStorage.setItem("im_system_prompt", systemPrompt); }, [systemPrompt]);

  // ── Ollama polling ──
  useEffect(() => {
    const poll = async () => {
      try {
        const r = await fetch("http://localhost:11434/api/tags", {signal:AbortSignal.timeout(3000)});
        if (r.ok) {
          const d = await r.json();
          const models = (d.models||[]).map(m=>m.name);
          setOllamaModels(prev => {
            if (JSON.stringify(prev)!==JSON.stringify(models)) {
              if (models.length>0) setSelectedModel(s => prev.includes(s)?s:models[0]);
              return models;
            }
            return prev;
          });
          setOllamaStatus("RUNNING");
        } else { setOllamaStatus("ERROR"); setVramUsed(0); setVramTotal(0); return; }
      } catch { setOllamaStatus("OFFLINE"); setVramUsed(0); setVramTotal(0); return; }

      try {
        const ps = await fetch("http://localhost:11434/api/ps", {signal:AbortSignal.timeout(3000)});
        if (ps.ok) {
          const d = await ps.json();
          const ms = d.models||[];
          if (ms.length>0) {
            const m = ms[0];
            setLoadedModelName(m.name||"");
            const usedGB = m.size_vram ? +(m.size_vram/1e9).toFixed(1) : 0;
            setVramUsed(usedGB);
            if (m.details?.context_length) setContextTokens(m.details.context_length);
            const totalGB = m.size ? +(m.size/1e9*1.15).toFixed(1) : 0;
            setVramTotal(prev => totalGB>0 ? Math.max(totalGB,usedGB) : prev);
          } else {
            setLoadedModelName(""); setVramUsed(0);
          }
        }
      } catch {}
    };
    poll();
    const id = setInterval(poll, 5000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [activeChat?.messages]);

  const newChat = () => {
    const id = Date.now();
    setChats(prev => [{
      id, title:"New Session", preview:"—", time:"now", messages:[],
      ...DEFAULT_CHAT_SETTINGS,
    }, ...prev]);
    setActiveChatId(id);
    setOpenPopup(null);
  };

  const switchChat = (id) => { setActiveChatId(id); setOpenPopup(null); };

  const sendMessage = useCallback(async () => {
    if (!input.trim()||isStreaming) return;
    const userMsg = {role:"user",content:input.trim(),time:new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"})};
    const updatedChats = chats.map(c => {
      if (c.id!==activeChatId) return c;
      const msgs = [...c.messages,userMsg];
      return {...c,messages:msgs,title:msgs[0].content.slice(0,28)||c.title,preview:msgs[0].content.slice(0,30)+"..."};
    });
    setChats(updatedChats); setInput(""); setIsStreaming(true);

    const aiMsgId = Date.now();
    const aiTime = new Date().toLocaleTimeString("en-GB",{hour:"2-digit",minute:"2-digit"});
    const aiMsg = {id:aiMsgId,role:"assistant",content:"",time:aiTime};
    setChats(prev => prev.map(c => c.id!==activeChatId?c:{...c,messages:[...c.messages,aiMsg]}));

    const chat = updatedChats.find(c=>c.id===activeChatId);
    // Prepend system prompt if set
    const sysMessages = systemPrompt.trim()
      ? [{role:"system",content:systemPrompt.trim()}]
      : [];
    const ollamaMessages = [...sysMessages, ...chat.messages.map(m=>({role:m.role,content:m.content}))];

    try {
      const ctrl = new AbortController();
      abortRef.current = ctrl;
      const resp = await fetch("http://localhost:11434/api/chat",{
        method:"POST", headers:{"Content-Type":"application/json"},
        body:JSON.stringify({model:selectedModel,messages:ollamaMessages,stream:true,options:{temperature,top_p:topP,num_predict:maxTokens}}),
        signal:ctrl.signal,
      });
      if (!resp.ok) throw new Error("Ollama error");
      const reader = resp.body.getReader(); const decoder = new TextDecoder(); let full="";
      while(true) {
        const {done,value} = await reader.read(); if(done) break;
        const lines = decoder.decode(value,{stream:true}).split("\n").filter(Boolean);
        for (const line of lines) {
          try {
            const j = JSON.parse(line);
            if (j.message?.content) { full+=j.message.content; setChats(prev=>prev.map(c=>c.id!==activeChatId?c:{...c,messages:c.messages.map(m=>m.id===aiMsgId?{...m,content:full}:m)})); }
            if (j.done) break;
          } catch {}
        }
      }
    } catch(err) {
      if (err.name!=="AbortError") setChats(prev=>prev.map(c=>c.id!==activeChatId?c:{...c,messages:c.messages.map(m=>m.id===aiMsgId?{...m,content:"[SIGNAL LOST — OLLAMA UNREACHABLE]\n\nEnsure Ollama is running: `ollama serve`"}:m)}));
    } finally { setIsStreaming(false); abortRef.current=null; }
  }, [input,isStreaming,chats,activeChatId,selectedModel,temperature,topP,maxTokens,systemPrompt,activeChat]);

  const stopGeneration = () => { abortRef.current?.abort(); };
  const filteredChats = chats.filter(c => !searchQuery||c.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const BlueprintComp = {mech:MechBlueprint,server:ServerBlueprint,typewriter:TypewriterBlueprint,castle:CastleBlueprint,drone:DroneBlueprint}[blueprintType];

  // VRAM status string
  const vramStr = ollamaStatus!=="RUNNING" ? "OFFLINE"
    : vramTotal===0 ? "NO MODEL"
    : `${vramUsed}/${vramTotal} GB`;

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
          grid-template-columns:280px 1fr 260px;
          height:100vh;min-height:100vh;
          background:var(--bg);font-family:var(--mono);color:var(--text);
          position:relative;overflow:hidden;
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
        @keyframes bp-pulse{
          0%,100%{opacity:0.88;filter:drop-shadow(0 0 3px rgba(204,34,0,0.3));}
          50%{opacity:1;filter:drop-shadow(0 0 8px rgba(204,34,0,0.55));}
        }
        .blueprint-wrap.flicker{animation:bp-pulse 4s ease-in-out infinite,bp-flicker 0.1s steps(1) 1;}
        @keyframes bp-flicker{0%{opacity:0.2}50%{opacity:1}100%{opacity:0.88}}
        .blueprint-scanlines{
          position:absolute;inset:0;pointer-events:none;
          background:repeating-linear-gradient(0deg,transparent,transparent 3px,rgba(0,0,0,0.12) 3px,rgba(0,0,0,0.12) 4px);
          border-radius:0;
        }
        .blueprint-svg{width:100%;opacity:1;}

        /* ── Top Bar ── */
        .topbar{
          grid-column:1/-1;display:flex;align-items:center;
          background:var(--panel);border-bottom:1px solid var(--border-accent);
          padding:0 16px;gap:0;position:relative;z-index:20;
        }
        .topbar::after{content:'';position:absolute;bottom:-2px;left:0;right:0;height:1px;
          background:linear-gradient(90deg,transparent,var(--red-dim),transparent);}
        .brand{display:flex;align-items:center;gap:12px;margin-right:28px;min-width:220px;}
        .brand-icon{width:36px;height:36px;}
        .brand-text{display:flex;flex-direction:column;}
        .brand-name{font-family:var(--display);font-weight:700;font-size:15px;letter-spacing:.15em;color:var(--text);line-height:1.1;}
        .brand-sub{font-size:9px;color:var(--red);letter-spacing:.2em;}
        .topbar-divider{width:1px;height:32px;background:var(--border-accent);margin:0 12px;}
        .stat-box{display:flex;flex-direction:column;padding:0 12px;border-right:1px solid var(--border);cursor:default;}
        .stat-box--interactive{cursor:pointer;transition:background .12s;}
        .stat-box--interactive:hover{background:var(--red-glow2);}
        .stat-label{font-size:8px;letter-spacing:.18em;color:var(--text-dim);text-transform:uppercase;user-select:none;}
        .stat-edit-hint{color:var(--red-dim);font-size:7px;}
        .stat-value{font-size:11px;color:var(--text);letter-spacing:.05em;margin-top:1px;}
        .topbar-spacer{flex:1;}
        .system-status{display:flex;align-items:center;gap:12px;padding-left:16px;}
        .sys-label{font-size:8px;letter-spacing:.18em;color:var(--text-dim);}
        .sys-val{font-size:10px;letter-spacing:.1em;color:var(--red);}
        .sys-val--ok{color:#22cc44;}
        .sys-val--warn{color:#cc8800;}
        .vram-bar{display:flex;gap:2px;align-items:center;}
        .vram-seg{width:5px;height:12px;border:1px solid var(--red-dim);opacity:.3;}
        .vram-seg--on{background:var(--red);opacity:1;box-shadow:0 0 4px var(--red);}
        .vram-label{font-size:9px;color:var(--text-dim);margin-left:4px;min-width:80px;}

        /* ── Settings Popup ── */
        .settings-popup{
          position:fixed;z-index:200;
          background:var(--panel);border:1px solid var(--border-accent);
          padding:14px 16px;min-width:220px;
          box-shadow:0 0 24px rgba(204,34,0,0.2),0 4px 32px rgba(0,0,0,0.7);
        }
        .settings-popup-title{font-size:9px;letter-spacing:.2em;color:var(--red);margin-bottom:8px;}
        .settings-popup-divider{height:1px;background:var(--border-accent);margin-bottom:10px;}
        .settings-slider-wrap{margin-bottom:6px;}
        .settings-slider{
          width:100%;-webkit-appearance:none;appearance:none;
          height:2px;background:var(--border-accent);outline:none;
          accent-color:var(--red);cursor:pointer;
        }
        .settings-slider::-webkit-slider-thumb{
          -webkit-appearance:none;width:12px;height:12px;
          background:var(--red);border:1px solid var(--red-dim);
          box-shadow:0 0 6px var(--red);cursor:pointer;
        }
        .settings-val{font-size:18px;color:var(--text);font-family:var(--display);font-weight:700;letter-spacing:.1em;margin-bottom:10px;}
        .settings-number{
          width:100%;background:var(--bg);border:1px solid var(--border-accent);
          color:var(--text);font-family:var(--mono);font-size:13px;
          padding:5px 8px;outline:none;margin-bottom:10px;
        }
        .settings-number:focus{border-color:var(--red-dim);}
        .settings-apply{
          width:100%;background:none;border:1px solid var(--red-dim);
          color:var(--red);font-family:var(--mono);font-size:10px;
          padding:5px;cursor:pointer;letter-spacing:.12em;
          transition:all .15s;
        }
        .settings-apply:hover{background:var(--red-glow);border-color:var(--red);}

        /* ── System Prompt Modal ── */
        .modal-overlay{
          position:fixed;inset:0;z-index:300;
          background:rgba(0,0,0,0.75);
          display:flex;align-items:center;justify-content:center;
          backdrop-filter:blur(2px);
        }
        .modal-panel{
          background:var(--panel);border:1px solid var(--border-accent);
          width:640px;max-width:90vw;
          display:flex;flex-direction:column;
          box-shadow:0 0 40px rgba(204,34,0,0.2),0 8px 64px rgba(0,0,0,0.8);
        }
        .modal-header{
          display:flex;justify-content:space-between;align-items:center;
          padding:12px 16px;border-bottom:1px solid var(--border-accent);
          background:var(--panel2);
        }
        .modal-title{font-size:10px;letter-spacing:.2em;color:var(--red);}
        .modal-close{background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:12px;transition:color .12s;}
        .modal-close:hover{color:var(--red);}
        .modal-body{padding:16px;}
        .modal-desc{font-size:10px;color:var(--text-dim);letter-spacing:.05em;margin-bottom:12px;line-height:1.5;}
        .modal-textarea{
          width:100%;height:220px;
          background:var(--bg);border:1px solid var(--border-accent);
          color:var(--text);font-family:var(--mono);font-size:11px;
          padding:12px;resize:vertical;outline:none;line-height:1.55;
          letter-spacing:.03em;
        }
        .modal-textarea::placeholder{color:var(--text-dim);}
        .modal-textarea:focus{border-color:var(--red-dim);}
        .modal-footer{
          display:flex;justify-content:space-between;align-items:center;
          padding:10px 16px;border-top:1px solid var(--border);
          background:var(--panel2);
        }
        .modal-hint{font-size:9px;color:var(--text-dim);letter-spacing:.1em;}
        .modal-btn{
          background:var(--red);border:none;color:#fff;
          font-family:var(--mono);font-size:10px;padding:6px 16px;
          cursor:pointer;letter-spacing:.12em;transition:background .15s;
        }
        .modal-btn:hover{background:#ff3310;}
        .modal-btn--ghost{background:none;border:1px solid var(--border-accent);color:var(--text-dim);}
        .modal-btn--ghost:hover{border-color:var(--red-dim);color:var(--text);}

        /* ── Left Sidebar ── */
        .sidebar-left{background:var(--panel);border-right:1px solid var(--border-accent);display:flex;flex-direction:column;overflow:hidden;}
        .sidebar-section{padding:10px 14px 6px;border-bottom:1px solid var(--border);display:flex;align-items:center;justify-content:space-between;}
        .sidebar-section-label{font-size:9px;letter-spacing:.2em;color:var(--red);}
        .sidebar-section-actions{display:flex;gap:4px;}
        .sidebar-btn{
          background:none;border:1px solid var(--red-dim);color:var(--red);
          font-family:var(--mono);font-size:14px;width:22px;height:22px;
          cursor:pointer;display:flex;align-items:center;justify-content:center;transition:all .15s;
        }
        .sidebar-btn:hover{background:var(--red-glow);border-color:var(--red);}
        .sidebar-btn--sys{font-size:10px;width:auto;padding:0 7px;letter-spacing:.06em;}
        .search-wrap{padding:8px 12px;border-bottom:1px solid var(--border);}
        .search-input{
          width:100%;background:var(--bg);border:1px solid var(--border-accent);
          color:var(--text);font-family:var(--mono);font-size:10px;
          padding:5px 8px;outline:none;letter-spacing:.05em;
        }
        .search-input::placeholder{color:var(--text-dim);}
        .search-input:focus{border-color:var(--red-dim);}
        .chat-list{flex:1;overflow-y:auto;scrollbar-width:thin;scrollbar-color:var(--red-dim) transparent;}
        .chat-item{padding:8px 12px;cursor:pointer;border-bottom:1px solid var(--border);transition:background .1s;}
        .chat-item:hover{background:var(--red-glow2);}
        .chat-item--active{background:var(--red-glow);border-left:2px solid var(--red);}
        .chat-item-title{font-size:11px;color:var(--text);letter-spacing:.03em;margin-bottom:3px;}
        .chat-item-meta{display:flex;justify-content:space-between;align-items:flex-end;}
        .chat-item-preview{font-size:9px;color:var(--text-dim);flex:1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;}
        .chat-item-time{font-size:9px;color:var(--text-dim);margin-left:8px;flex-shrink:0;}
        .model-panel{padding:10px 12px;border-top:1px solid var(--border-accent);background:var(--panel2);}
        .model-panel-label{font-size:8px;letter-spacing:.2em;color:var(--red);margin-bottom:6px;}
        .model-icon-wrap{display:flex;gap:10px;align-items:center;}
        .model-icon{width:44px;height:44px;flex-shrink:0;}
        .model-info{flex:1;overflow:hidden;}
        .model-name{font-size:11px;color:var(--text);letter-spacing:.05em;font-family:var(--display);font-weight:600;}
        .model-row{display:flex;justify-content:space-between;margin-top:3px;}
        .model-key{font-size:8px;color:var(--text-dim);}
        .model-val{font-size:8px;color:var(--text-mid);}
        .model-select{
          background:var(--bg);border:1px solid var(--border-accent);
          color:var(--text);font-family:var(--mono);font-size:10px;
          padding:2px 6px;outline:none;cursor:pointer;width:100%;margin-top:4px;
        }
        .model-select:focus{border-color:var(--red-dim);}
        .sys-prompt-indicator{
          font-size:8px;margin-top:4px;letter-spacing:.08em;
          color:var(--red-dim);display:flex;align-items:center;gap:4px;
        }
        .sys-prompt-indicator.active{color:#22cc44;}
        .sys-dot{width:4px;height:4px;border-radius:50%;background:currentColor;display:inline-block;}

        /* ── Main Chat ── */
        .main-chat{display:flex;flex-direction:column;background:var(--bg);overflow:hidden;}
        .conv-header{
          padding:10px 18px;border-bottom:1px solid var(--border);
          display:flex;align-items:center;justify-content:space-between;
          background:var(--panel2);flex-shrink:0;
        }
        .conv-title{font-size:11px;letter-spacing:.18em;color:var(--red);}
        .conv-actions{display:flex;gap:8px;}
        .conv-btn{background:none;border:none;color:var(--text-dim);cursor:pointer;font-size:14px;padding:2px 4px;transition:color .15s;}
        .conv-btn:hover{color:var(--red);}
        .messages-area{
          flex:1;overflow-y:auto;padding:20px 18px;
          scrollbar-width:thin;scrollbar-color:var(--red-dim) transparent;
          display:flex;flex-direction:column;gap:16px;
        }
        .msg{display:flex;flex-direction:column;gap:6px;max-width:100%;}
        .msg-header{display:flex;align-items:center;gap:10px;}
        .msg-role{font-size:9px;letter-spacing:.22em;color:var(--red);}
        .msg--user .msg-role{color:var(--steel-light);}
        .msg-time{font-size:9px;color:var(--text-dim);}
        .msg-body{
          background:var(--panel2);border:1px solid var(--border);
          padding:12px 14px;font-size:12px;line-height:1.65;letter-spacing:.02em;color:var(--text);
        }
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
        .input-row{
          display:flex;align-items:center;gap:0;
          background:var(--bg);border:1px solid var(--border-accent);transition:border-color .15s;
        }
        .input-row:focus-within{border-color:var(--red-dim);}
        .input-prompt{color:var(--red);font-size:13px;padding:0 8px 0 12px;flex-shrink:0;line-height:1;align-self:center;user-select:none;pointer-events:none;}
        .cmd-input{
          flex:1;background:transparent;border:none;color:var(--text);
          font-family:var(--mono);font-size:12px;padding:11px 8px 11px 0;
          resize:none;outline:none;letter-spacing:.04em;
          min-height:44px;max-height:120px;scrollbar-width:none;line-height:1.4;
        }
        .cmd-input::placeholder{color:var(--text-dim);}
        .send-btn{
          flex-shrink:0;align-self:stretch;background:var(--red);border:none;
          color:#fff;font-family:var(--display);font-weight:700;
          font-size:12px;letter-spacing:.18em;padding:0 20px;cursor:pointer;
          transition:background .15s;clip-path:polygon(8px 0%,100% 0%,100% 100%,0% 100%);white-space:nowrap;
        }
        .send-btn:hover{background:#ff3310;}
        .send-btn:disabled{background:var(--red-dim);cursor:default;}
        .stop-btn{
          flex-shrink:0;align-self:stretch;background:none;border-left:1px solid var(--red);
          color:var(--red);font-family:var(--mono);font-size:10px;
          padding:0 14px;cursor:pointer;letter-spacing:.1em;transition:all .15s;white-space:nowrap;
        }
        .stop-btn:hover{background:var(--red-glow);}
        .input-meta{display:flex;justify-content:space-between;padding-top:5px;font-size:8px;color:var(--text-dim);letter-spacing:.1em;}

        /* ── Right Sidebar ── */
        .sidebar-right{background:var(--panel);border-left:1px solid var(--border-accent);display:flex;flex-direction:column;overflow:hidden;}
        .blueprint-header{padding:10px 14px 8px;border-bottom:1px solid var(--border-accent);}
        .blueprint-section-label{font-size:9px;letter-spacing:.2em;color:var(--red);}
        .blueprint-name{font-family:var(--display);font-weight:700;font-size:16px;letter-spacing:.12em;color:var(--text);margin-top:4px;}
        .blueprint-class{font-size:9px;color:var(--text-dim);letter-spacing:.2em;margin-top:1px;}
        .blueprint-main{flex:0 0 auto;padding:8px 10px;border-bottom:1px solid var(--border);position:relative;}
        .mech-views{display:flex;gap:4px;padding:6px 14px;border-bottom:1px solid var(--border);}
        .mech-view{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;}
        .mech-view-label{font-size:7px;letter-spacing:.15em;color:var(--text-dim);}
        .mech-view-img{width:100%;height:52px;border:1px solid var(--border);background:var(--panel2);display:flex;align-items:center;justify-content:center;}
        .mech-specs{flex:1;overflow-y:auto;padding:10px 14px;scrollbar-width:thin;scrollbar-color:var(--red-dim) transparent;}
        .specs-section-label{font-size:8px;letter-spacing:.2em;color:var(--red);margin-bottom:6px;display:block;}
        .spec-row{display:flex;justify-content:space-between;align-items:center;padding:4px 0;border-bottom:1px solid var(--border);font-size:9px;}
        .spec-key{color:var(--text-dim);letter-spacing:.1em;}
        .spec-val{color:var(--text);text-align:right;max-width:60%;font-size:8px;}
        .weapon-row{display:flex;align-items:center;gap:8px;padding:5px 0;border-bottom:1px solid var(--border);}
        .weapon-icon{width:36px;height:14px;border:1px solid var(--border-accent);background:var(--panel2);}
        .weapon-name{flex:1;font-size:9px;color:var(--text);letter-spacing:.05em;}
        .weapon-tag{font-size:7px;letter-spacing:.12em;padding:1px 5px;background:var(--red);color:#fff;}
        .weapon-tag--melee{background:var(--steel-light);}
        .weapon-tag--support{background:#1a3020;color:#22cc44;}

        /* ── Status Bar ── */
        .statusbar{
          grid-column:1/-1;display:flex;align-items:center;justify-content:space-between;
          padding:0 16px;
          border-top:1px solid var(--border-accent);background:var(--panel);
          font-size:8px;color:var(--text-dim);letter-spacing:.12em;
        }
        .statusbar-left{display:flex;gap:20px;}
        .statusbar-right{display:flex;gap:20px;}
        .status-dot{width:5px;height:5px;border-radius:50%;background:#22cc44;display:inline-block;margin-right:5px;box-shadow:0 0 4px #22cc44;}
      `}</style>

      <div className="terminal">
        <Scanlines/>

        {/* ── Settings Popups ── */}
        {openPopup==="temp" && (
          <SettingsPopup anchor={popupAnchor} label="TEMPERATURE" type="slider"
            min={0} max={2} step={0.01} value={temperature}
            onChange={v => setChatSetting("temperature", v)} onClose={()=>setOpenPopup(null)}/>
        )}
        {openPopup==="topp" && (
          <SettingsPopup anchor={popupAnchor} label="TOP_P" type="slider"
            min={0} max={1} step={0.01} value={topP}
            onChange={v => setChatSetting("topP", v)} onClose={()=>setOpenPopup(null)}/>
        )}
        {openPopup==="maxtok" && (
          <SettingsPopup anchor={popupAnchor} label="MAX TOKENS" type="number"
            min={64} max={32768} step={64} value={maxTokens}
            onChange={v => setChatSetting("maxTokens", v)} onClose={()=>setOpenPopup(null)}/>
        )}

        {/* ── System Prompt Modal ── */}
        {showSysPrompt && (
          <SystemPromptModal
            value={systemPrompt}
            onChange={setSystemPrompt}
            onClose={()=>setShowSysPrompt(false)}
          />
        )}

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
              <span className="brand-sub">LOCAL AI INTERFACE v2.4.1</span>
            </div>
          </div>
          <div className="topbar-divider"/>
          <StatBox label="MODEL" value={selectedModel}/>
          <StatBox label="CONTEXT" value={`${contextTokens.toLocaleString()} TOKENS`}/>
          <StatBox label="TEMP" value={temperature.toFixed(2)} interactive btnRef={tempBtnRef}
            onClick={()=>{ setPopupAnchor(getPopupAnchor(tempBtnRef)); setOpenPopup(p=>p==="temp"?null:"temp"); }}/>
          <StatBox label="TOP_P" value={topP.toFixed(2)} interactive btnRef={toppBtnRef}
            onClick={()=>{ setPopupAnchor(getPopupAnchor(toppBtnRef)); setOpenPopup(p=>p==="topp"?null:"topp"); }}/>
          <StatBox label="MAX TOKENS" value={maxTokens.toLocaleString()} interactive btnRef={maxTokBtnRef}
            onClick={()=>{ setPopupAnchor(getPopupAnchor(maxTokBtnRef)); setOpenPopup(p=>p==="maxtok"?null:"maxtok"); }}/>
          <div className="topbar-spacer"/>
          <div className="system-status">
            <span className="sys-label">OLLAMA</span>
            <span className={`sys-val ${ollamaStatus==="RUNNING"?"sys-val--ok":ollamaStatus==="CHECKING"?"sys-val--warn":""}`}>
              {ollamaStatus}
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
            <input className="search-input" placeholder="SEARCH SESSIONS..."
              value={searchQuery} onChange={e=>setSearchQuery(e.target.value)}/>
          </div>
          <div className="chat-list">
            {filteredChats.map(c => <ChatItem key={c.id} chat={c} active={c.id===activeChatId} onClick={()=>switchChat(c.id)}/>)}
          </div>
          <div className="model-panel">
            <div className="model-panel-label">// CURRENT MODEL</div>
            <div className="model-icon-wrap">
              <svg className="model-icon" viewBox="0 0 44 44" fill="none">
                <circle cx="22" cy="22" r="20" stroke="#cc2200" strokeWidth="0.8" fill="none" strokeDasharray="4 3"/>
                <circle cx="22" cy="22" r="12" stroke="#cc2200" strokeWidth="1" fill="none"/>
                <circle cx="22" cy="22" r="6" stroke="#cc2200" strokeWidth="0.6" fill="#cc220020"/>
                {[0,60,120,180,240,300].map(a => { const rr=Math.PI*a/180; return <line key={a} x1={22+12*Math.cos(rr)} y1={22+12*Math.sin(rr)} x2={22+20*Math.cos(rr)} y2={22+20*Math.sin(rr)} stroke="#cc2200" strokeWidth="0.8"/>; })}
                <circle cx="22" cy="22" r="2" fill="#cc2200"/>
              </svg>
              <div className="model-info">
                {ollamaModels.length>0
                  ? <select className="model-select" value={selectedModel} onChange={e=>setSelectedModel(e.target.value)}>
                      {ollamaModels.map(m=><option key={m} value={m}>{m}</option>)}
                    </select>
                  : <div className="model-name">{selectedModel}</div>
                }
                <div className="model-row"><span className="model-key">CONTEXT WINDOW</span><span className="model-val">{contextTokens.toLocaleString()}</span></div>
                <div className="model-row"><span className="model-key">TEMPERATURE</span><span className="model-val">{temperature.toFixed(2)}</span></div>
                <div className={`sys-prompt-indicator ${systemPrompt.trim()?"active":""}`}>
                  <span className="sys-dot"/>
                  {systemPrompt.trim() ? "DIRECTIVE ACTIVE" : "NO DIRECTIVE"}
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* ── Main Chat ── */}
        <main className="main-chat">
          <div className="conv-header">
            <span className="conv-title">// CONVERSATION: {activeChat?.title?.toUpperCase()||"NEW SESSION"}</span>
            <div className="conv-actions">
              <button className="conv-btn" title="Download transcript" onClick={()=>{
                const text=(activeChat?.messages||[]).map(m=>`[${m.role.toUpperCase()} ${m.time}]\n${m.content}`).join("\n\n---\n\n");
                const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob([text],{type:"text/plain"}));
                a.download=`${activeChat?.title||"session"}.txt`; a.click();
              }}>↓</button>
              <button className="conv-btn" title="Toggle fullscreen" onClick={()=>{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();}}>⤢</button>
              <button className="conv-btn" title="Clear conversation" onClick={()=>{if(confirm("Clear this conversation?"))setChats(prev=>prev.map(c=>c.id!==activeChatId?c:{...c,messages:[]}));}}>✕</button>
            </div>
          </div>

          <div className="messages-area">
            {(activeChat?.messages||[]).map((msg,i) => (
              <Message key={i} msg={msg}
                isStreaming={isStreaming && i===(activeChat.messages.length-1) && msg.role==="assistant"}/>
            ))}
            {(activeChat?.messages||[]).length===0 && (
              <div style={{color:"var(--text-dim)",fontSize:"11px",letterSpacing:".08em",textAlign:"center",marginTop:"60px",opacity:.5}}>
                — AWAITING INPUT —
              </div>
            )}
            <div ref={chatEndRef}/>
          </div>

          <div className="input-area">
            <div className="input-row">
              <span className="input-prompt">&gt;</span>
              <textarea ref={textareaRef} className="cmd-input"
                placeholder="Ask the machine..."
                value={input} onChange={e=>setInput(e.target.value)}
                onKeyDown={e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMessage();}}}
                rows={1}/>
              {isStreaming
                ? <button className="stop-btn" onClick={stopGeneration}>■ STOP</button>
                : <button className="send-btn" onClick={sendMessage} disabled={!input.trim()}>SEND ›</button>
              }
            </div>
            <div className="input-meta">
              <span>INPUT MODE: COMMAND{systemPrompt.trim()?" · DIRECTIVE ARMED":""}</span>
              <span>SHIFT+ENTER FOR NEWLINE</span>
            </div>
          </div>
        </main>

        {/* ── Right Sidebar ── */}
        <aside className="sidebar-right">
          <div className="blueprint-header">
            <div className="blueprint-section-label">// MECH BLUEPRINT</div>
            <div className="blueprint-name">{getBlueprintLabel(blueprintType)}</div>
            <div className="blueprint-class">CLASS: {getBlueprintClass(blueprintType)}</div>
          </div>

          <div className="blueprint-main">
            <BlueprintWrapper>
              <BlueprintComp/>
            </BlueprintWrapper>
          </div>

          {blueprintType==="mech" && (
            <div className="mech-views">
              {["FRONT","SIDE","REAR"].map(v => (
                <div key={v} className="mech-view">
                  <span className="mech-view-label">{v}</span>
                  <div className="mech-view-img">
                    <svg viewBox="0 0 48 52" style={{width:"90%",height:"90%"}} fill="none">
                      <rect x="18" y="2" width="12" height="9" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
                      <rect x="12" y="11" width="24" height="18" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
                      <rect x="4" y="12" width="8" height="14" stroke="#cc2200" strokeWidth="0.6" fill="none"/>
                      <rect x="36" y="12" width="8" height="14" stroke="#cc2200" strokeWidth="0.6" fill="none"/>
                      <rect x="14" y="29" width="8" height="18" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
                      <rect x="26" y="29" width="8" height="18" stroke="#cc2200" strokeWidth="0.8" fill="none"/>
                      <rect x="10" y="47" width="16" height="4" stroke="#cc2200" strokeWidth="0.6" fill="none"/>
                      <rect x="22" y="47" width="16" height="4" stroke="#cc2200" strokeWidth="0.6" fill="none"/>
                    </svg>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="mech-specs">
            <span className="specs-section-label">// SPECS</span>
            {[["HEIGHT","4.20m"],["WEIGHT","8.70t"],["CHASSIS","REINFORCED COMPOSITE"],
              ["POWER PLANT","COMPACT FUSION CORE"],["MAX SPEED","72 km/h"],
              ["JUMP HEIGHT","18.7 m"],["ARMOR RATING","A-CLASS"]
            ].map(([k,v]) => (
              <div key={k} className="spec-row">
                <span className="spec-key">{k}</span><span className="spec-val">{v}</span>
              </div>
            ))}
            <span className="specs-section-label" style={{marginTop:"10px"}}>// WEAPON SYSTEMS</span>
            {[["2x CHAINSHOT SHOTGUNS","PRIMARY"],["1x THERMAL BLADE","MELEE"],["4x SMOKE GRENADE LAUNCHERS","SUPPORT"]].map(([name,tag]) => (
              <div key={name} className="weapon-row">
                <div className="weapon-icon"/>
                <span className="weapon-name">{name}</span>
                <span className={`weapon-tag ${tag==="MELEE"?"weapon-tag--melee":tag==="SUPPORT"?"weapon-tag--support":""}`}>{tag}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* ── Status Bar ── */}
        <footer className="statusbar">
          <div className="statusbar-left">
            <span>INPUT MODE: COMMAND</span>
            <span>ENCRYPTION: <span style={{color:"#22cc44"}}>ON</span></span>
          </div>
          <div className="statusbar-right">
            <span>LINK: LOCALHOST</span>
            <span><span className="status-dot"/>SYSTEM NOMINAL</span>
          </div>
        </footer>
      </div>
    </>
  );
}

// ── Blueprint animated wrapper ────────────────────────────────────────────────
function BlueprintWrapper({ children }) {
  const [flicker, setFlicker] = useState(false);
  useEffect(() => {
    const scheduleFlicker = () => {
      const delay = 4000 + Math.random() * 12000;
      return setTimeout(() => {
        setFlicker(true);
        setTimeout(() => setFlicker(false), 120);
        scheduleFlicker();
      }, delay);
    };
    const t = scheduleFlicker();
    return () => clearTimeout(t);
  }, []);
  return (
    <div className={`blueprint-wrap ${flicker?"flicker":""}`}>
      {children}
      <div className="blueprint-scanlines"/>
    </div>
  );
}
