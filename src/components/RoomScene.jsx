// Illustrated sample interiors (vector drawings, not photographs).
const BASE = {
  wall: '#d9cdb4', wallShade: '#cfc2a7', floor: '#a98a64', floorLine: '#977a57', trim: '#efe8d8',
  curtain: null, sofa: '#5f5a52', sofaDark: '#4c4841', sofaShape: 'boxy', rug: null, table: null,
  lamp: null, pendant: null, plant: false, art: false, shelf: false, clutter: true, cushion: null, light: 0,
}

export const SCENES = {
  before: { ...BASE },
  sage: { ...BASE, wall: '#b8c4a8', wallShade: '#aab698', clutter: true },
  scandi: {
    ...BASE, wall: '#f0ede5', wallShade: '#e6e2d6', floor: '#d6bf97', floorLine: '#c7ae83', curtain: '#f7f5ef',
    sofa: '#a9b79c', sofaDark: '#93a186', cushion: '#f3efe4', rug: '#e9e1cf', table: '#cdb48c', lamp: '#e7d8a6', plant: true, art: true, clutter: false,
  },
  japandi: {
    ...BASE, wall: '#e8e0cf', wallShade: '#ded5c1', floor: '#bfa27a', floorLine: '#b09368', curtain: '#efe8d8', sofaShape: 'low',
    sofa: '#7c7566', sofaDark: '#6a6457', cushion: '#d8cdb5', rug: '#d4c7ac', table: '#6e5a45', pendant: '#e9e0c9', plant: true, art: true, shelf: true, clutter: false,
  },
  classic: {
    ...BASE, wall: '#c9d1bb', wallShade: '#bcc5ae', floor: '#8b6a49', floorLine: '#7a5b3d', curtain: '#e8e3d3', sofaShape: 'curved',
    sofa: '#7f8c6f', sofaDark: '#6d7a5f', cushion: '#e9e3d2', rug: '#d9cfb6', table: '#5d4630', lamp: '#d7c28a', plant: true, art: true, clutter: false,
  },
  minimal: {
    ...BASE, wall: '#f2f0ea', wallShade: '#e9e6de', floor: '#ddd2bd', floorLine: '#d0c4ab', sofaShape: 'low',
    sofa: '#cfc8b8', sofaDark: '#bdb5a3', table: '#2f3133', plant: true, clutter: false,
  },
  furniture: { ...BASE, sofaShape: 'curved', sofa: '#a9b79c', sofaDark: '#93a186', cushion: '#f3efe4', table: '#cdb48c', clutter: true },
  decor: { ...BASE, rug: '#e0d3b8', lamp: '#e7d8a6', plant: true, art: true, cushion: '#d6a98c', clutter: false },
}

function Sofa({ c }) {
  const { sofa, sofaDark, sofaShape, cushion } = c
  if (sofaShape === 'low') {
    return (
      <g>
        <rect x="100" y="300" width="340" height="62" rx="10" fill={sofaDark} />
        <rect x="100" y="268" width="340" height="50" rx="10" fill={sofa} />
        <rect x="108" y="312" width="156" height="40" rx="8" fill={sofa} />
        <rect x="276" y="312" width="156" height="40" rx="8" fill={sofa} />
        <rect x="116" y="360" width="10" height="14" fill="#3b3a36" /><rect x="414" y="360" width="10" height="14" fill="#3b3a36" />
        {cushion && <rect x="130" y="286" width="56" height="40" rx="8" fill={cushion} />}
      </g>
    )
  }
  if (sofaShape === 'curved') {
    return (
      <g>
        <path d="M100 350 Q100 232 230 226 Q370 232 440 350 Z" fill={sofaDark} />
        <path d="M112 350 Q112 262 230 256 Q352 262 430 350 Z" fill={sofa} />
        <rect x="112" y="320" width="318" height="44" rx="14" fill={sofa} />
        <rect x="130" y="366" width="10" height="16" fill="#4b3a2b" /><rect x="400" y="366" width="10" height="16" fill="#4b3a2b" />
        {cushion && <><rect x="150" y="290" width="62" height="48" rx="12" fill={cushion} /><rect x="330" y="290" width="62" height="48" rx="12" fill="#d8b89a" /></>}
      </g>
    )
  }
  return (
    <g>
      <rect x="96" y="236" width="348" height="80" rx="8" fill={sofaDark} />
      <rect x="96" y="290" width="348" height="72" rx="8" fill={sofa} />
      <rect x="84" y="262" width="32" height="100" rx="8" fill={sofaDark} />
      <rect x="424" y="262" width="32" height="100" rx="8" fill={sofaDark} />
      <rect x="124" y="296" width="140" height="50" rx="6" fill={sofa} stroke={sofaDark} strokeWidth="2" />
      <rect x="276" y="296" width="140" height="50" rx="6" fill={sofa} stroke={sofaDark} strokeWidth="2" />
      <rect x="104" y="362" width="10" height="14" fill="#3b3a36" /><rect x="426" y="362" width="10" height="14" fill="#3b3a36" />
      {cushion && <rect x="138" y="250" width="58" height="46" rx="8" fill={cushion} transform="rotate(-6 167 273)" />}
    </g>
  )
}

export default function RoomScene({ scene = 'before', overrides, className = '', label }) {
  const c = { ...(typeof scene === 'string' ? SCENES[scene] : scene), ...overrides }
  return (
    <svg viewBox="0 0 800 500" className={className} role="img" aria-label={label || 'Illustrated living room'} preserveAspectRatio="xMidYMid slice">
      <rect width="800" height="500" fill={c.wall} />
      <rect y="0" width="800" height="60" fill={c.wallShade} opacity="0.55" />
      <rect y="324" width="800" height="12" fill={c.trim} />
      <rect y="336" width="800" height="164" fill={c.floor} />
      {[0, 1, 2, 3, 4, 5, 6].map((i) => <line key={i} x1={0} x2={800} y1={350 + i * 24} y2={350 + i * 24} stroke={c.floorLine} strokeWidth="1.5" />)}

      <g>
        <rect x="520" y="64" width="200" height="190" fill="#dce8ea" stroke={c.trim} strokeWidth="10" />
        <line x1="620" y1="64" x2="620" y2="254" stroke={c.trim} strokeWidth="6" />
        <line x1="520" y1="159" x2="720" y2="159" stroke={c.trim} strokeWidth="6" />
        <rect x="528" y="72" width="84" height="80" fill="#f6fbfb" opacity="0.7" />
        {c.curtain && <><path d="M500 40 H540 V300 Q520 300 500 292 Z" fill={c.curtain} /><path d="M700 40 H740 V292 Q720 300 700 300 Z" fill={c.curtain} /></>}
      </g>

      {c.art && (
        <g>
          <rect x="170" y="86" width="120" height="86" fill={c.trim} stroke="#6b6558" strokeWidth="3" />
          <rect x="182" y="98" width="96" height="62" fill={c.sofa} opacity="0.55" />
          <circle cx="232" cy="124" r="16" fill={c.cushion || '#e8dcc0'} />
          <rect x="310" y="104" width="54" height="68" fill={c.trim} stroke="#6b6558" strokeWidth="3" />
          <path d="M318 160 q16 -40 38 0" fill="none" stroke={c.sofaDark} strokeWidth="4" />
        </g>
      )}
      {c.pendant && (
        <g>
          <line x1="400" y1="0" x2="400" y2="40" stroke="#4b4a45" strokeWidth="3" />
          <path d="M362 90 Q400 28 438 90 Z" fill={c.pendant} stroke="#8a826c" strokeWidth="3" />
        </g>
      )}
      {c.shelf && (
        <g>
          <rect x="392" y="188" width="108" height="8" fill="#5a4a38" />
          <rect x="404" y="158" width="14" height="30" fill="#c9b894" /><rect x="424" y="150" width="12" height="38" fill="#7d8a6c" />
          <circle cx="470" cy="172" r="16" fill="#cbbd9f" />
        </g>
      )}

      {c.rug && <ellipse cx="270" cy="428" rx="250" ry="50" fill={c.rug} />}
      <Sofa c={c} />
      {c.table && (
        <g>
          <rect x="190" y="396" width="160" height="16" rx="3" fill={c.table} />
          <rect x="204" y="412" width="8" height="34" fill={c.table} /><rect x="328" y="412" width="8" height="34" fill={c.table} />
          <rect x="226" y="380" width="26" height="16" fill="#efe8d8" /><rect x="276" y="384" width="18" height="12" rx="6" fill="#8e9b82" />
        </g>
      )}
      {c.lamp && (
        <g>
          <line x1="488" y1="214" x2="488" y2="370" stroke="#4b4a45" strokeWidth="5" />
          <path d="M462 214 L514 214 L504 168 L472 168 Z" fill={c.lamp} stroke="#8a826c" strokeWidth="2" />
          <ellipse cx="488" cy="372" rx="22" ry="6" fill="#4b4a45" />
        </g>
      )}
      {c.plant && (
        <g>
          <path d="M656 400 h54 l-8 52 h-38 z" fill="#b9a587" />
          {[[683, 340, -28], [683, 332, 0], [683, 340, 28], [670, 360, -50], [696, 360, 50]].map(([x, y, r], i) => (
            <ellipse key={i} cx={x} cy={y} rx="12" ry="46" fill={i % 2 ? '#6f8a5c' : '#587547'} transform={`rotate(${r} 683 400)`} />
          ))}
        </g>
      )}
      {c.clutter && (
        <g>
          <rect x="592" y="392" width="84" height="60" fill="#b99a6c" stroke="#8d7348" strokeWidth="2" />
          <rect x="606" y="352" width="60" height="42" fill="#c9ab7d" stroke="#8d7348" strokeWidth="2" />
          <rect x="190" y="400" width="140" height="14" fill="#7a6a56" />
          <rect x="220" y="372" width="30" height="28" fill="#a8483a" opacity="0.8" />
        </g>
      )}
    </svg>
  )
}
