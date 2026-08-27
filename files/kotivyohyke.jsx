import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Droplet, TreePine, Coins, Crown, Sparkles, Play, Pause, RotateCcw } from 'lucide-react';

// ---------- Constants ----------
const HEX_METERS = 22;       // hex "size" (center-to-corner) in real meters
const PX_PER_M = 1.6;        // pixels per meter for rendering
const HEX_PX = HEX_METERS * PX_PER_M;
const HEX_PX_DRAW = HEX_PX * 0.92; // small gap between hexes
const MAX_GAP_MS = 40 * 60 * 1000; // cap dwell attribution at 40 min
const BASE_THRESHOLD_MS = 90 * 60 * 1000; // 1.5h dwell to crown a base
const CENTER_X = 200, CENTER_Y = 250;
const DEMO_ORIGIN = { lat: 65.0121, lng: 25.4651 };
const EARTH_R = 6371000;

const TERRAIN = {
  water: { label: 'Järvi', resource: 'water', fill: '#1f4d5c', stroke: '#4fc3dc' },
  forest: { label: 'Metsä', resource: 'wood', fill: '#2c4a29', stroke: '#7cbf63' },
  shop: { label: 'Kauppa', resource: 'gold', fill: '#4a3a18', stroke: '#e0b04a' },
  plain: { label: 'Nurmikko', resource: null, fill: '#252b3b', stroke: '#414a61' },
};

// ---------- Hex + geo math ----------
function toLocalMeters(lat, lng, lat0, lng0) {
  const x = (lng - lng0) * Math.PI / 180 * EARTH_R * Math.cos(lat0 * Math.PI / 180);
  const y = (lat - lat0) * Math.PI / 180 * EARTH_R;
  return { x, y };
}
function metersToLatLng(x, y, lat0, lng0) {
  const lat = lat0 + (y / EARTH_R) * (180 / Math.PI);
  const lng = lng0 + (x / (EARTH_R * Math.cos(lat0 * Math.PI / 180))) * (180 / Math.PI);
  return { lat, lng };
}
function pixelToAxial(x, y, size) {
  const q = (Math.sqrt(3) / 3 * x - 1 / 3 * y) / size;
  const r = (2 / 3 * y) / size;
  return { q, r };
}
function axialRound({ q, r }) {
  let x = q, z = r, y = -x - z;
  let rx = Math.round(x), ry = Math.round(y), rz = Math.round(z);
  const xd = Math.abs(rx - x), yd = Math.abs(ry - y), zd = Math.abs(rz - z);
  if (xd > yd && xd > zd) rx = -ry - rz;
  else if (yd > zd) ry = -rx - rz;
  else rz = -rx - ry;
  return { q: rx, r: rz };
}
function axialToMeters(q, r, size) {
  return { x: size * (Math.sqrt(3) * q + Math.sqrt(3) / 2 * r), y: size * (3 / 2 * r) };
}
const AXIAL_DIRS = [[1, 0], [1, -1], [0, -1], [-1, 0], [-1, 1], [0, 1]];
function axialNeighbors(q, r) { return AXIAL_DIRS.map(([dq, dr]) => `${q + dq},${r + dr}`); }
function hashStr(s) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return ((h >>> 0) % 1000) / 1000;
}
function terrainFor(q, r) {
  const v = hashStr(`reg-${Math.floor(q / 3)}-${Math.floor(r / 3)}`);
  if (v < 0.14) return TERRAIN.water;
  if (v < 0.34) return TERRAIN.forest;
  if (v < 0.46) return TERRAIN.shop;
  return TERRAIN.plain;
}
function hexPolygonPoints(cx, cy, r) {
  const pts = [];
  for (let i = 0; i < 6; i++) {
    const a = Math.PI / 180 * (60 * i - 30);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(' ');
}
function fmtTime(t) { return new Date(t).toLocaleTimeString('fi-FI', { hour: '2-digit', minute: '2-digit', second: '2-digit' }); }
function fmtCoord(lat, lng) { return `${lat.toFixed(5)}, ${lng.toFixed(5)}`; }
function fmtDur(ms) {
  const totalMin = Math.round(ms / 60000);
  const h = Math.floor(totalMin / 60), m = totalMin % 60;
  return h > 0 ? `${h}h ${m}min` : `${m}min`;
}

// ---------- Simulated day generator (local meters) ----------
function generateSimulatedDay() {
  const pts = [];
  const start = new Date(); start.setHours(6, 0, 0, 0);
  let t = start.getTime();
  const dwellAt = (cx, cy, totalMin, stepMin, jitter) => {
    const n = Math.max(1, Math.round(totalMin / stepMin));
    for (let i = 0; i < n; i++) {
      pts.push({ x: cx + (Math.random() - 0.5) * jitter, y: cy + (Math.random() - 0.5) * jitter, t });
      t += stepMin * 60000;
    }
  };
  const walkTo = (fx, fy, tx, ty, totalMin) => {
    const dist = Math.hypot(tx - fx, ty - fy);
    const steps = Math.max(2, Math.ceil(dist / 18));
    for (let i = 1; i <= steps; i++) {
      const f = i / steps;
      pts.push({ x: fx + (tx - fx) * f, y: fy + (ty - fy) * f, t });
      t += (totalMin * 60000) / steps;
    }
  };
  const HOME = { x: 0, y: 0 }, TEMPLE = { x: 300, y: 220 }, SHOP = { x: 150, y: -180 };
  dwellAt(HOME.x, HOME.y, 480, 20, 12);
  walkTo(HOME.x, HOME.y, TEMPLE.x, TEMPLE.y, 25);
  dwellAt(TEMPLE.x, TEMPLE.y, 300, 20, 14);
  walkTo(TEMPLE.x, TEMPLE.y, SHOP.x, SHOP.y, 20);
  dwellAt(SHOP.x, SHOP.y, 60, 15, 8);
  walkTo(SHOP.x, SHOP.y, HOME.x, HOME.y, 25);
  dwellAt(HOME.x, HOME.y, 480, 20, 12);
  return pts;
}

export default function TerritoryDemo() {
  const [resources, setResources] = useState({ water: 0, wood: 0, gold: 0 });
  const [territory, setTerritory] = useState(new Set());
  const [dwell, setDwell] = useState({});
  const [playerLocal, setPlayerLocal] = useState({ x: 0, y: 0 });
  const [trail, setTrail] = useState([]);
  const [log, setLog] = useState([]);
  const [lastPing, setLastPing] = useState(null);
  const [tracking, setTracking] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [gpsError, setGpsError] = useState('');
  const [defense, setDefense] = useState(null);

  const territoryRef = useRef(new Set());
  const originRef = useRef(null);
  const lastCellRef = useRef(null);
  const lastTimeRef = useRef(null);
  const watchIdRef = useRef(null);
  const simTimeoutRef = useRef(null);

  useEffect(() => () => {
    if (watchIdRef.current != null && navigator.geolocation) navigator.geolocation.clearWatch(watchIdRef.current);
    if (simTimeoutRef.current) clearTimeout(simTimeoutRef.current);
  }, []);

  // passive trickle from owned resource hexes
  useEffect(() => {
    const id = setInterval(() => {
      const gain = { water: 0, wood: 0, gold: 0 };
      territoryRef.current.forEach(key => {
        const [q, r] = key.split(',').map(Number);
        const terrain = terrainFor(q, r);
        if (terrain.resource) gain[terrain.resource] += 1;
      });
      if (gain.water || gain.wood || gain.gold) {
        setResources(prev => ({ water: prev.water + gain.water, wood: prev.wood + gain.wood, gold: prev.gold + gain.gold }));
      }
    }, 4000);
    return () => clearInterval(id);
  }, []);

  function processLocalReading(x, y, tMs) {
    const { q, r } = axialRound(pixelToAxial(x, y, HEX_METERS));
    const key = `${q},${r}`;

    setDwell(prev => {
      const lastKey = lastCellRef.current, lastT = lastTimeRef.current;
      if (lastKey != null && lastT != null) {
        let dt = tMs - lastT;
        if (dt > 0) { dt = Math.min(dt, MAX_GAP_MS); return { ...prev, [lastKey]: (prev[lastKey] || 0) + dt }; }
      }
      return prev;
    });
    lastCellRef.current = key; lastTimeRef.current = tMs;

    const owned = territoryRef.current.has(key);
    let event = { type: 'known' };
    if (!owned) {
      const isSeed = territoryRef.current.size === 0;
      const adjacentOwned = isSeed || axialNeighbors(q, r).some(nk => territoryRef.current.has(nk));
      const terrain = terrainFor(q, r);
      if (adjacentOwned) {
        territoryRef.current.add(key);
        setTerritory(new Set(territoryRef.current));
        if (terrain.resource) setResources(prev => ({ ...prev, [terrain.resource]: prev[terrain.resource] + 10 }));
        event = { type: 'captured', terrain };
      } else {
        event = { type: 'skipped', terrain };
      }
    }

    setPlayerLocal({ x, y });
    setTrail(prev => [...prev.slice(-14), { x, y }]);

    if (!originRef.current) originRef.current = DEMO_ORIGIN;
    const { lat, lng } = metersToLatLng(x, y, originRef.current.lat, originRef.current.lng);
    setLastPing({ t: tMs, lat, lng });
    if (event.type !== 'known') setLog(prev => [{ t: tMs, lat, lng, event }, ...prev].slice(0, 8));
  }

  function handleRealGpsPosition(pos) {
    const { latitude: lat, longitude: lng } = pos.coords;
    const tMs = pos.timestamp || Date.now();
    if (!originRef.current) originRef.current = { lat, lng };
    const { x, y } = toLocalMeters(lat, lng, originRef.current.lat, originRef.current.lng);
    processLocalReading(x, y, tMs);
  }

  function startTracking() {
    if (!navigator.geolocation) { setGpsError('Selain ei tue GPS-sijaintia.'); return; }
    setGpsError(''); setTracking(true);
    watchIdRef.current = navigator.geolocation.watchPosition(
      handleRealGpsPosition,
      (err) => { setGpsError('GPS ei käytettävissä: ' + err.message); setTracking(false); },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
    );
  }
  function stopTracking() {
    if (watchIdRef.current != null) navigator.geolocation.clearWatch(watchIdRef.current);
    watchIdRef.current = null; setTracking(false);
  }
  function runSimulateDay() {
    if (simulating || tracking) return;
    setSimulating(true);
    const pts = generateSimulatedDay();
    let i = 0;
    const step = () => {
      if (i >= pts.length) { setSimulating(false); return; }
      processLocalReading(pts[i].x, pts[i].y, pts[i].t);
      i++;
      simTimeoutRef.current = setTimeout(step, 45);
    };
    step();
  }
  function handleReset() {
    stopTracking();
    if (simTimeoutRef.current) clearTimeout(simTimeoutRef.current);
    setSimulating(false);
    territoryRef.current = new Set(); setTerritory(new Set());
    setDwell({}); setResources({ water: 0, wood: 0, gold: 0 });
    setTrail([]); setLog([]); setLastPing(null); setDefense(null);
    lastCellRef.current = null; lastTimeRef.current = null; originRef.current = null;
    setPlayerLocal({ x: 0, y: 0 }); setGpsError('');
  }

  const significantPlaces = useMemo(() => {
    const entries = Object.entries(dwell).filter(([, v]) => v >= BASE_THRESHOLD_MS);
    entries.sort((a, b) => b[1] - a[1]);
    return entries.map(([key, dwellMs]) => {
      const [q, r] = key.split(',').map(Number);
      return { key, dwellMs, pos: axialToMeters(q, r, HEX_METERS) };
    });
  }, [dwell]);
  const baseInfo = significantPlaces[0] || null;
  const temples = significantPlaces.slice(1);

  const distToBase = baseInfo ? Math.round(Math.hypot(playerLocal.x - baseInfo.pos.x, playerLocal.y - baseInfo.pos.y)) : null;

  const hexSets = useMemo(() => {
    const owned = new Set(territory);
    const frontier = new Set();
    owned.forEach(k => {
      const [q, r] = k.split(',').map(Number);
      axialNeighbors(q, r).forEach(nk => { if (!owned.has(nk)) frontier.add(nk); });
    });
    const preview = new Set();
    const { q: pq, r: pr } = axialRound(pixelToAxial(playerLocal.x, playerLocal.y, HEX_METERS));
    for (let dq = -2; dq <= 2; dq++) {
      for (let dr = -2; dr <= 2; dr++) {
        const ds = -dq - dr;
        if (Math.max(Math.abs(dq), Math.abs(dr), Math.abs(ds)) > 2) continue;
        const k = `${pq + dq},${pr + dr}`;
        if (!owned.has(k) && !frontier.has(k)) preview.add(k);
      }
    }
    return { owned, frontier, preview };
  }, [territory, playerLocal]);

  const pan = { x: CENTER_X - playerLocal.x * PX_PER_M, y: CENTER_Y + playerLocal.y * PX_PER_M };
  const toPx = (m) => ({ x: m.x * PX_PER_M, y: -m.y * PX_PER_M });

  return (
    <div className="min-h-screen w-full bg-[#0b0e1a] flex items-center justify-center p-4">
      <style>{`
        @keyframes glowPulse { 0%,100% { opacity: 0.55; } 50% { opacity: 0.12; } }
        .glow-pulse { animation: glowPulse 2.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .glow-pulse { animation: none !important; } }
      `}</style>
      <div className="w-full max-w-md">
        <div className="mb-3 px-1">
          <h1 className="text-slate-100 text-lg font-semibold tracking-wide">KOTIVYÖHYKE</h1>
          <p className="text-slate-500 text-xs">Kävely muodostaa läänisi — Base ja temppelit paljastuvat ajan myötä</p>
        </div>

        <div className="relative w-full h-[420px] rounded-3xl overflow-hidden border border-slate-800/80 bg-[#0d1220]">
          <svg viewBox="0 0 400 500" width="100%" height="100%" preserveAspectRatio="xMidYMid meet">
            <defs>
              <radialGradient id="bg" cx="50%" cy="40%" r="75%">
                <stop offset="0%" stopColor="#141a2e" />
                <stop offset="100%" stopColor="#090c16" />
              </radialGradient>
            </defs>
            <rect width="400" height="500" fill="url(#bg)" />
            <path d="M10,90 Q140,40 260,100 T400,70" stroke="#1c2338" strokeWidth="2" fill="none" opacity="0.6" />
            <path d="M0,220 Q120,260 240,210 T400,240" stroke="#1c2338" strokeWidth="2" fill="none" opacity="0.5" />
            <path d="M20,400 Q160,350 300,410 T400,380" stroke="#1c2338" strokeWidth="2" fill="none" opacity="0.5" />

            <g transform={`translate(${pan.x},${pan.y})`}>
              {[...hexSets.preview].map(key => {
                const [q, r] = key.split(',').map(Number);
                const terrain = terrainFor(q, r);
                const px = toPx(axialToMeters(q, r, HEX_METERS));
                return <polygon key={'p' + key} points={hexPolygonPoints(px.x, px.y, HEX_PX_DRAW)} fill={terrain.fill} fillOpacity="0.18" stroke="#333c52" strokeWidth="1" />;
              })}
              {[...hexSets.frontier].map(key => {
                const [q, r] = key.split(',').map(Number);
                const terrain = terrainFor(q, r);
                const px = toPx(axialToMeters(q, r, HEX_METERS));
                return <polygon key={'f' + key} points={hexPolygonPoints(px.x, px.y, HEX_PX_DRAW)} fill={terrain.fill} fillOpacity="0.3" stroke="#9b8fd9" strokeWidth="1.5" strokeDasharray="4 3" />;
              })}
              {[...hexSets.owned].map(key => {
                const [q, r] = key.split(',').map(Number);
                const terrain = terrainFor(q, r);
                const px = toPx(axialToMeters(q, r, HEX_METERS));
                return <polygon key={'o' + key} points={hexPolygonPoints(px.x, px.y, HEX_PX_DRAW)} fill={terrain.fill} fillOpacity="0.88" stroke={terrain.stroke} strokeWidth="1.5" />;
              })}
              {trail.length > 1 && (
                <polyline
                  points={trail.map(p => { const px = toPx(p); return `${px.x.toFixed(1)},${px.y.toFixed(1)}`; }).join(' ')}
                  fill="none" stroke="#f2b544" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.85"
                />
              )}
              {baseInfo && (() => {
                const px = toPx(baseInfo.pos);
                return (
                  <g>
                    <circle className="glow-pulse" cx={px.x} cy={px.y} r="16" fill="none" stroke="#f2c94c" strokeWidth="2" />
                    <circle cx={px.x} cy={px.y} r="7" fill="#f2c94c" />
                  </g>
                );
              })()}
              {temples.map(t => {
                const px = toPx(t.pos);
                return (
                  <g key={'temple' + t.key}>
                    <circle className="glow-pulse" cx={px.x} cy={px.y} r="13" fill="none" stroke="#b18cf0" strokeWidth="2" />
                    <circle cx={px.x} cy={px.y} r="5.5" fill="#b18cf0" />
                  </g>
                );
              })}
            </g>

            <circle className="glow-pulse" cx={CENTER_X} cy={CENTER_Y} r="18" fill="#3fd1c9" />
            <circle cx={CENTER_X} cy={CENTER_Y} r="6" fill="#3fd1c9" stroke="#0b0e1a" strokeWidth="2" />
          </svg>

          <div className="absolute top-3 left-3 bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-cyan-200/90 leading-tight">
            <div className="uppercase tracking-wider text-cyan-400/70 text-[9px]">Aikaleima</div>
            <div>{lastPing ? fmtTime(lastPing.t) : '--:--:--'}</div>
            <div>{lastPing ? fmtCoord(lastPing.lat, lastPing.lng) : '—'}</div>
          </div>
          <div className="absolute top-3 right-3 bg-black/40 backdrop-blur-sm rounded-lg px-2.5 py-1.5 text-[10px] font-mono text-amber-200/90 text-right leading-tight">
            <div className="uppercase tracking-wider text-amber-400/70 text-[9px]">Base</div>
            <div>{baseInfo ? 'löytyi' : 'ei löytynyt'}</div>
            {baseInfo && <div>{distToBase} m päässä</div>}
          </div>

          {territory.size === 0 && (
            <div className="absolute inset-0 flex items-center justify-center px-10 text-center pointer-events-none">
              <p className="text-slate-500 text-sm">Aloita GPS-seuranta tai simuloi päivä nähdäksesi oman alueesi kasvavan.</p>
            </div>
          )}
        </div>

        <div className="mt-3 rounded-2xl bg-slate-900/70 border border-slate-800/80 p-4">
          <div className="flex justify-between mb-3">
            <div className="flex items-center gap-1.5 text-cyan-300 text-sm"><Droplet size={15} /> {resources.water}</div>
            <div className="flex items-center gap-1.5 text-emerald-300 text-sm"><TreePine size={15} /> {resources.wood}</div>
            <div className="flex items-center gap-1.5 text-amber-300 text-sm"><Coins size={15} /> {resources.gold}</div>
          </div>

          <div className="text-xs text-slate-400 mb-3 space-y-1">
            <div className="flex items-center gap-1.5">
              <Crown size={13} className={baseInfo ? 'text-amber-400' : 'text-slate-600'} />
              {baseInfo ? `Base · ${fmtDur(baseInfo.dwellMs)} viihdytty` : 'Ei vielä havaittuja paikkoja'}
            </div>
            {temples.map((t, i) => (
              <div key={t.key} className="flex items-center gap-1.5 pl-4 text-violet-300/80">
                <Sparkles size={12} /> Temppeli {i + 1} · {fmtDur(t.dwellMs)} viihdytty
              </div>
            ))}
          </div>

          {baseInfo && (
            <div className="mb-3">
              <p className="text-[11px] text-slate-500 mb-1.5">Rajan puolustus — vaikuttaa kun aluettasi vastaan hyökätään:</p>
              <div className="flex gap-2">
                <button onClick={() => setDefense('wall')}
                  className={`flex-1 rounded-xl text-xs py-2 border transition-colors ${defense === 'wall' ? 'bg-slate-700 border-slate-400 text-slate-100' : 'border-slate-700 text-slate-400'}`}>
                  Rakenna muuri
                </button>
                <button onClick={() => setDefense('orcs')}
                  className={`flex-1 rounded-xl text-xs py-2 border transition-colors ${defense === 'orcs' ? 'bg-emerald-900/40 border-emerald-500 text-emerald-200' : 'border-slate-700 text-slate-400'}`}>
                  Örkkejä rajalle
                </button>
              </div>
            </div>
          )}

          {gpsError && <p className="text-amber-400 text-[11px] mb-2">{gpsError}</p>}

          <div className="flex gap-2">
            <button onClick={tracking ? stopTracking : startTracking} disabled={simulating}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium py-2.5 text-slate-100 transition-colors">
              {tracking ? <Pause size={14} /> : <Play size={14} />} {tracking ? 'Pysäytä' : 'Aloita GPS'}
            </button>
            <button onClick={runSimulateDay} disabled={tracking || simulating}
              className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700 disabled:opacity-40 text-xs font-medium py-2.5 text-slate-100 transition-colors">
              <Play size={14} /> {simulating ? 'Simuloidaan…' : 'Simuloi päivä'}
            </button>
            <button onClick={handleReset}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-slate-800/50 hover:bg-slate-700 text-xs font-medium py-2.5 px-3 text-slate-300 transition-colors">
              <RotateCcw size={14} />
            </button>
          </div>
        </div>

        <div className="mt-3 rounded-2xl bg-slate-900/50 border border-slate-800/60 p-3">
          <div className="flex gap-3 text-[10px] text-slate-500 mb-2">
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: TERRAIN.water.stroke }} /> Vesi</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: TERRAIN.forest.stroke }} /> Puu</span>
            <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full inline-block" style={{ background: TERRAIN.shop.stroke }} /> Kulta</span>
          </div>
          <div className="max-h-32 overflow-y-auto space-y-1 font-mono text-[10px]">
            {log.length === 0 && <p className="text-slate-600">Ei vielä tapahtumia.</p>}
            {log.map((entry, i) => (
              <div key={i} className={entry.event.type === 'captured' ? 'text-emerald-300' : 'text-amber-500/80'}>
                {fmtTime(entry.t)} · {fmtCoord(entry.lat, entry.lng)} ·{' '}
                {entry.event.type === 'captured'
                  ? `+10 ${entry.event.terrain.label.toLowerCase()}`
                  : 'ohitettu — ei oman alueen vieressä'}
              </div>
            ))}
          </div>
        </div>

        <p className="text-slate-600 text-[11px] mt-3 px-1">Alkuun rakennat vain omaa linnaasi näillä resursseilla — muuri/örkit-valinta ratkeaa vasta kun toista pelaajaa vastaan taistellaan alueesta.</p>
      </div>
    </div>
  );
}
