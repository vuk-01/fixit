// Drawings of the sign-in repair scene (UI.md "Sign-in page"): the four problems and the worker, an
// original character in a Fixit-amber hard hat. Colours are theme tokens only (app/globals.css, the
// `--scene-*` group for the illustration); class names are the animation hooks in repair-scene.module.css.

import type { ProblemKind } from "./repair-scene-plan"
import s from "./repair-scene.module.css"

const C = {
  navy: "var(--primary)",
  white: "var(--primary-foreground)",
  amber: "var(--highlight)",
  amberShade: "var(--highlight-shade)",
  road: "var(--muted)",
  slate: "var(--muted-foreground)",
  hole: "var(--scene-hole)",
  stone: "var(--scene-stone)",
  steel: "var(--scene-steel)",
  skin: "var(--scene-skin)",
  wood: "var(--scene-wood)",
  straw: "var(--scene-straw)",
  cardboard: "var(--scene-cardboard)",
  check: "var(--scene-check)",
}

// ---------- problems: drawn around (0, 0) = the ground point; dir = side the worker comes from ----------

function RoadPiece() {
  return <rect x={-40} y={-7} width={80} height={13} rx={6.5} fill={C.road} />
}

export function Problem({ kind, dir }: { kind: ProblemKind; dir: 1 | -1 }) {
  if (kind === "pothole") {
    return (
      <>
        <RoadPiece />
        <ellipse rx={14.5} ry={5.4} fill={C.stone} />
        <ellipse rx={13} ry={4.4} fill={C.hole} />
        <path d="M-14 1 l-6 2.5 M13 -2 l7 -2 M5 4 l3 3" stroke={C.stone} strokeWidth={1} strokeLinecap="round" />
        {/* fresh asphalt grows over the hole */}
        <g className={s.patch}>
          <ellipse rx={15} ry={5.6} fill={C.steel} />
        </g>
      </>
    )
  }

  if (kind === "manhole") {
    return (
      <>
        <RoadPiece />
        <ellipse rx={12} ry={4.6} fill={C.hole} stroke={C.steel} strokeWidth={1.5} />
        {/* the lid lies on the far side from the worker and slides back on */}
        <g className={s.lid} style={{ "--lid-x": `${dir * 24}px` } as React.CSSProperties}>
          <ellipse rx={12} ry={4.6} fill={C.slate} stroke={C.navy} strokeOpacity={0.35} strokeWidth={1} />
          <path
            d="M-7 -1.5 H7 M-8 1.5 H8 M-3 -3.5 V3.5 M3 -3.5 V3.5"
            stroke={C.navy}
            strokeOpacity={0.35}
            strokeWidth={0.8}
          />
        </g>
      </>
    )
  }

  if (kind === "street_light") {
    const hx = -dir * 9 // the head leans toward the worker
    const side = Math.sign(hx)
    return (
      <>
        {/* flickers until fixed, then glows steadily */}
        <g className={s.lampLight}>
          <path d={`M${hx - 4} -40 L${hx - 14} -2 H${hx + 14} L${hx + 4} -40 Z`} fill={C.amber} opacity={0.22} />
          <circle cx={hx} cy={-39} r={9} fill={C.amber} opacity={0.35} />
          <circle cx={hx} cy={-39.5} r={2.4} fill={C.amber} />
        </g>
        <rect x={-3.5} y={-3} width={7} height={3.5} rx={1} fill={C.navy} />
        <path
          d={`M0 -2 V-42 Q0 -46 ${side * 4} -46 H${hx}`}
          fill="none"
          stroke={C.slate}
          strokeWidth={2.2}
          strokeLinecap="round"
        />
        <path d={`M${hx - 5.5} -45.5 h11 l-2.2 4.4 h-6.6 z`} fill={C.navy} />
      </>
    )
  }

  return (
    <>
      <ellipse cy={0.5} rx={26} ry={3} fill={C.road} />
      {/* bags, a box, a bottle and a can; swept away to nothing */}
      <g className={s.pile}>
        <path d="M-22 0 q-3 -12 7 -14 q10 1 7 14 z" fill={C.slate} />
        <path d="M-15 -14 l-2 -3 M-15 -14 l2 -3" stroke={C.slate} strokeWidth={1.2} strokeLinecap="round" />
        <path d="M-6 0 q-2 -17 9 -18 q11 1 8 18 z" fill={C.navy} />
        <path d="M3 -18 l-2 -3 M3 -18 l2 -3" stroke={C.navy} strokeWidth={1.2} strokeLinecap="round" />
        <rect x={10} y={-11} width={13} height={11} rx={1} fill={C.cardboard} transform="rotate(-8 16 -5)" />
        <path d="M11 -9 h11" stroke={C.wood} strokeWidth={1} transform="rotate(-8 16 -5)" />
        <rect x={-27} y={-4} width={9} height={3.6} rx={1.6} fill={C.steel} opacity={0.75} />
        <circle cx={24} cy={-2} r={2.2} fill={C.stone} />
      </g>
      <g className={s.flies} transform="translate(0 -24)">
        <g className={s.fly}>
          <circle cx={9} r={1.1} fill={C.navy} />
        </g>
        <g className={s.fly2}>
          <circle cx={-6} cy={2} r={1} fill={C.navy} />
        </g>
      </g>
    </>
  )
}

export function Check() {
  return (
    <>
      <circle r={7.5} fill={C.check} stroke={C.white} strokeWidth={1.5} />
      <path
        d="M-3.4 0.2 l2.3 2.4 l4.6 -5"
        fill="none"
        stroke={C.white}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </>
  )
}

// ---------- worker: feet at (0, 0), facing right, about 33 units tall ----------

// the tool for each problem, held in the hand at (6.5, 3.2) of the arm
function Tool({ kind }: { kind: ProblemKind }) {
  if (kind === "pothole") {
    // shovel
    return (
      <>
        <path d="M2 -1 L14 13" stroke={C.wood} strokeWidth={1.5} strokeLinecap="round" />
        <path d="M11.5 14.5 L16.5 11.2 L19.4 16.6 L14.6 19.8 Z" fill={C.stone} />
      </>
    )
  }
  if (kind === "manhole") {
    // wrench
    return (
      <>
        <path d="M6.5 3.2 L13.5 6.6" stroke={C.steel} strokeWidth={2} strokeLinecap="round" />
        <path d="M13 4.6 a2.6 2.6 0 1 1 1.4 4.4" fill="none" stroke={C.steel} strokeWidth={1.8} strokeLinecap="round" />
      </>
    )
  }
  if (kind === "street_light") {
    // screwdriver
    return (
      <>
        <path d="M6.5 3.2 L10 5" stroke={C.navy} strokeWidth={2.6} strokeLinecap="round" />
        <path d="M10 5 L15.5 7.7" stroke={C.stone} strokeWidth={1.1} strokeLinecap="round" />
      </>
    )
  }
  // broom
  return (
    <>
      <path d="M1 -2 L13 14" stroke={C.wood} strokeWidth={1.4} strokeLinecap="round" />
      <path d="M10.4 14.4 L15.6 10.8 L19.6 17.6 L13.2 20.4 Z" fill={C.straw} />
      <path d="M14 15 L16.4 19.4 M15.4 13.6 L18.2 18.2" stroke={C.cardboard} strokeWidth={0.7} />
    </>
  )
}

export function Worker({ kind }: { kind: ProblemKind }) {
  return (
    <g>
      <g transform="translate(-1.6 -11)">
        <g className={s.legBack}>
          <path
            d="M0 0 V9.4 h2.6"
            fill="none"
            stroke={C.navy}
            strokeWidth={3}
            strokeLinecap="round"
            strokeLinejoin="round"
            opacity={0.7}
          />
        </g>
      </g>
      <g transform="translate(1.6 -11)">
        <g className={s.legFront}>
          <path d="M0 0 V9.4 h2.6" fill="none" stroke={C.navy} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
        </g>
      </g>
      {/* safety vest with a reflective band */}
      <rect x={-5.2} y={-22.5} width={10.4} height={12.5} rx={3.2} fill={C.amber} />
      <rect x={-5.2} y={-17.4} width={10.4} height={1.9} fill={C.white} />
      <rect x={-0.5} y={-22.5} width={1} height={12.5} fill={C.amberShade} />
      {/* head */}
      <circle cx={0.6} cy={-26.6} r={4.1} fill={C.skin} />
      <circle cx={3} cy={-26.4} r={0.65} fill={C.navy} />
      {/* yellow hard hat: dome, brim forward, ridge */}
      <path d="M-3.9 -27.6 a4.6 4.6 0 0 1 9.2 0 z" fill={C.amber} />
      <rect x={-4.6} y={-28.3} width={11.6} height={1.7} rx={0.85} fill={C.amber} />
      <rect x={0.1} y={-32.1} width={1.1} height={3.9} rx={0.5} fill={C.amberShade} />
      {/* arm with the tool, pivot at the shoulder */}
      <g transform="translate(1.2 -20)">
        <g className={s.arm}>
          <Tool kind={kind} />
          <path d="M0 0 L6.5 3.2" stroke={C.navy} strokeWidth={2.6} strokeLinecap="round" />
        </g>
      </g>
    </g>
  )
}
