import { useMantineColorScheme } from "@mantine/core";
import { useInterval } from "@mantine/hooks";
import { useState } from "react";
import { catppuccin } from "../catppuccin";

const CX = 110,
  CY = 110;
const R_FACE = 92,
  R_TICK_OUT = 88,
  R_TICK_IN = 84,
  R_MINOR_IN = 86,
  R_NUM = 102;
const RADII = [78, 56, 36];

function angleXY(r: number, angleDeg: number) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return { x: CX + r * Math.cos(rad), y: CY + r * Math.sin(rad) };
}

function angDist(a: number, b: number) {
  const d = Math.abs(a - b) % 360;
  return Math.min(d, 360 - d);
}

interface Item {
  i: number;
  angle: number;
  isPM: boolean;
  drawRadius: number;
}

function computeDrawPositions(items: Item[]) {
  const parent = items.map((_, i) => i);
  const find = (i: number): number =>
    parent[i] === i ? i : (parent[i] = find(parent[i]));

  for (let i = 0; i < items.length; i++)
    for (let j = i + 1; j < items.length; j++)
      if (angDist(items[i].angle, items[j].angle) < 14)
        parent[find(i)] = find(j);

  const groups = new Map<number, number[]>();
  items.forEach((_, i) => {
    const r = find(i);
    if (!groups.has(r)) groups.set(r, []);
    groups.get(r)!.push(i);
  });

  items.forEach((it) => {
    it.drawRadius = RADII[0];
  });
  for (const indices of groups.values()) {
    if (indices.length > 1) {
      indices.sort((a, b) => a - b);
      indices.forEach((idx, k) => {
        items[idx].drawRadius = RADII[Math.min(k, RADII.length - 1)];
      });
    }
  }
}

interface ClockProps {
  times: string[]; // "HH:MM"
  nextIdx: number;
  size?: number | string;
}

export function Clock({ times, nextIdx, size = 320 }: ClockProps) {
  const { colorScheme } = useMantineColorScheme();
  const C = colorScheme === "light" ? catppuccin.latte : catppuccin.mocha;
  const [now, setNow] = useState(() => new Date());
  useInterval(() => setNow(new Date()), 1000);

  const nowMins =
    now.getHours() * 60 + now.getMinutes() + now.getSeconds() / 60;
  const hp = angleXY(42, (((nowMins / 60) % 12) / 12) * 360);
  const mp = angleXY(60, ((nowMins % 60) / 60) * 360);

  const items: Item[] = times.map((t, i) => {
    const [h, m] = t.split(":").map(Number);
    const mins = h * 60 + m;
    const angle = (((mins / 60) % 12) / 12) * 360;
    return {
      i,
      angle,
      isPM: Math.floor(mins / 60) >= 12,
      drawRadius: RADII[0],
    };
  });
  computeDrawPositions(items);

  return (
    <svg
      viewBox="0 0 220 220"
      width={size}
      style={{ maxWidth: "100%", height: "auto", display: "block" }}
      aria-label="Analog clock with meal markers"
    >
      <circle
        cx={CX}
        cy={CY}
        r={R_FACE}
        fill={C.base}
        stroke={C.surface1}
        strokeWidth={1}
      />

      {Array.from({ length: 60 }, (_, i) => {
        const p1 = angleXY(R_TICK_OUT, i * 6);
        const p2 = angleXY(i % 5 === 0 ? R_TICK_IN : R_MINOR_IN, i * 6);
        return (
          <line
            key={i}
            x1={p1.x}
            y1={p1.y}
            x2={p2.x}
            y2={p2.y}
            stroke={C.overlay0}
            strokeWidth={i % 5 === 0 ? 1.5 : 0.5}
            opacity={i % 5 === 0 ? 0.85 : 0.4}
          />
        );
      })}

      {([12, 3, 6, 9] as const).map((h) => {
        const p = angleXY(R_NUM, ((h % 12) / 12) * 360);
        return (
          <text
            key={h}
            x={p.x}
            y={p.y}
            fill={C.overlay2}
            textAnchor="middle"
            dominantBaseline="central"
            fontSize={12}
            fontWeight={500}
            fontFamily="inherit"
          >
            {h}
          </text>
        );
      })}

      {items.map((item) => {
        const p = angleXY(item.drawRadius, item.angle);
        return (
          <g key={item.i}>
            <circle
              cx={p.x}
              cy={p.y}
              r={9}
              fill={item.isPM ? C.blue : C.base}
              stroke={C.blue}
              strokeWidth={item.i === nextIdx ? 3 : 2}
            />
            <text
              x={p.x}
              y={p.y}
              textAnchor="middle"
              dominantBaseline="central"
              fontSize={9}
              fontWeight={700}
              fontFamily="inherit"
              fill={item.isPM ? C.base : C.text}
              style={{ pointerEvents: "none" }}
            >
              {item.i + 1}
            </text>
          </g>
        );
      })}

      <line
        x1={CX}
        y1={CY}
        x2={hp.x}
        y2={hp.y}
        stroke={C.text}
        strokeWidth={3}
        strokeLinecap="round"
      />
      <line
        x1={CX}
        y1={CY}
        x2={mp.x}
        y2={mp.y}
        stroke={C.text}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <circle cx={CX} cy={CY} r={2.5} fill={C.text} />
    </svg>
  );
}
