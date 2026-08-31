"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import {
  GLOBE_CENTER,
  GLOBE_DOTS,
  GLOBE_RINGS,
  GLOBE_CITIES,
} from "@/lib/globe-data";

const SIZE = 440;
const R = SIZE / 2 - 6;
const CX = SIZE / 2;
const CY = SIZE / 2;

const rad = (deg: number) => (deg * Math.PI) / 180;

/**
 * Traz (lon, lat) para a frente da câmera: gira −lon em torno de z, depois
 * +lat em torno de y. Devolve os senos e cossenos porque a rotação roda
 * milhares de vezes por quadro e refazer a trigonometria por ponto seria caro.
 */
function rotator(lon: number, lat: number) {
  return {
    cl: Math.cos(rad(lon)),
    sl: Math.sin(rad(lon)),
    cp: Math.cos(rad(lat)),
    sp: Math.sin(rad(lat)),
  };
}

type Rot = ReturnType<typeof rotator>;

/** Aplica a rotação e devolve [profundidade, telaX, telaY]. */
function project(x: number, y: number, z: number, r: Rot) {
  const x1 = x * r.cl + y * r.sl;
  const y1 = -x * r.sl + y * r.cl;
  const x2 = x1 * r.cp + z * r.sp;
  const z2 = -x1 * r.sp + z * r.cp;
  return [x2, CX + R * y1, CY - R * z2] as const;
}

export function Globe({
  className,
  /**
   * Como fundo o globo é enfeite: sai da árvore de acessibilidade e da ordem
   * de tabulação, para não virar uma parada de foco antes do formulário.
   * O arraste continua funcionando fora do card.
   */
  decorative = false,
}: {
  className?: string;
  decorative?: boolean;
}) {
  const [lon, setLon] = useState(GLOBE_CENTER[0]);
  const [lat, setLat] = useState(GLOBE_CENTER[1]);
  const [dragging, setDragging] = useState(false);
  const drag = useRef<{ x: number; y: number; lon: number; lat: number } | null>(null);

  const onPointerDown = useCallback(
    (e: React.PointerEvent<SVGSVGElement>) => {
      e.currentTarget.setPointerCapture(e.pointerId);
      drag.current = { x: e.clientX, y: e.clientY, lon, lat };
      setDragging(true);
    },
    [lon, lat]
  );

  const onPointerMove = useCallback((e: React.PointerEvent<SVGSVGElement>) => {
    const start = drag.current;
    if (!start) return;
    setLon(start.lon + (e.clientX - start.x) * 0.32);
    // Trava perto dos polos: passar deles inverteria o globo de cabeça para baixo.
    setLat(Math.max(-72, Math.min(72, start.lat - (e.clientY - start.y) * 0.32)));
  }, []);

  const endDrag = useCallback(() => {
    drag.current = null;
    setDragging(false);
  }, []);

  // Teclado: o globo é focável, então as setas também giram.
  const onKeyDown = useCallback((e: React.KeyboardEvent<SVGSVGElement>) => {
    const step = e.shiftKey ? 15 : 5;
    if (e.key === "ArrowLeft") setLon((v) => v - step);
    else if (e.key === "ArrowRight") setLon((v) => v + step);
    else if (e.key === "ArrowUp") setLat((v) => Math.min(72, v + step));
    else if (e.key === "ArrowDown") setLat((v) => Math.max(-72, v - step));
    else return;
    e.preventDefault();
  }, []);

  // Deriva devagar enquanto ninguém mexe, para o globo não parecer estático.
  useEffect(() => {
    if (dragging) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = now - last;
      last = now;
      setLon((v) => v + dt * 0.0022);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [dragging]);

  const rot = rotator(lon, lat);

  // Pontos de terra do hemisfério visível.
  const dots: string[] = [];
  for (let i = 0; i < GLOBE_DOTS.length; i += 3) {
    const [depth, sx, sy] = project(
      GLOBE_DOTS[i],
      GLOBE_DOTS[i + 1],
      GLOBE_DOTS[i + 2],
      rot
    );
    if (depth <= 0.02) continue;
    dots.push(`${sx.toFixed(1)},${sy.toFixed(1)},${depth.toFixed(2)}`);
  }

  // Contornos: quebra o traço quando o anel cruza a borda do disco.
  const paths: string[] = [];
  for (const ring of GLOBE_RINGS) {
    let d = "";
    let pen = false;
    for (let i = 0; i < ring.length; i += 3) {
      const [depth, sx, sy] = project(ring[i], ring[i + 1], ring[i + 2], rot);
      if (depth <= 0.02) {
        pen = false;
        continue;
      }
      d += `${pen ? "L" : "M"}${sx.toFixed(1)} ${sy.toFixed(1)}`;
      pen = true;
    }
    if (d) paths.push(d);
  }

  const cities = GLOBE_CITIES.map((city) => {
    const [depth, sx, sy] = project(city.vec[0], city.vec[1], city.vec[2], rot);
    return { name: city.name, sx, sy, visible: depth > 0.06 };
  });
  const visibleCities = cities.filter((c) => c.visible);

  return (
    <svg
      viewBox={`0 0 ${SIZE} ${SIZE}`}
      className={cn(
        "touch-none select-none outline-none",
        dragging ? "cursor-grabbing" : "cursor-grab",
        className
      )}
      {...(decorative
        ? { "aria-hidden": true as const }
        : {
            role: "img",
            "aria-label":
              "Globo interativo destacando Caxias do Sul, Farroupilha e Nova Petrópolis, no Rio Grande do Sul. Arraste ou use as setas para girar.",
            tabIndex: 0,
          })}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onKeyDown={onKeyDown}
    >
      <defs>
        <radialGradient id="globe-sphere" cx="42%" cy="36%" r="72%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.10" />
          <stop offset="65%" stopColor="var(--color-primary)" stopOpacity="0.03" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0.12" />
        </radialGradient>
        <radialGradient id="cluster-glow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="var(--color-primary)" stopOpacity="0.30" />
          <stop offset="100%" stopColor="var(--color-primary)" stopOpacity="0" />
        </radialGradient>
      </defs>

      <circle
        cx={CX}
        cy={CY}
        r={R}
        fill="url(#globe-sphere)"
        stroke="currentColor"
        strokeOpacity="0.14"
      />

      {/* Contorno das costas — o que dá a leitura dos continentes. */}
      <g
        fill="none"
        stroke="currentColor"
        strokeOpacity="0.42"
        strokeWidth="0.9"
        strokeLinejoin="round"
        strokeLinecap="round"
      >
        {paths.map((d, i) => (
          <path key={i} d={d} />
        ))}
      </g>

      {/* Preenchimento pontilhado, mais fraco que o contorno. */}
      <g fill="currentColor">
        {dots.map((dot, i) => {
          const [sx, sy, depth] = dot.split(",");
          return (
            <circle
              key={i}
              cx={sx}
              cy={sy}
              r={0.95}
              opacity={0.1 + Number(depth) * 0.3}
            />
          );
        })}
      </g>

      {visibleCities.length > 0 ? (
        <>
          <circle
            cx={visibleCities[0].sx}
            cy={visibleCities[0].sy}
            r="58"
            fill="url(#cluster-glow)"
          />
          <g
            stroke="var(--color-primary)"
            strokeOpacity="0.6"
            strokeWidth="1"
            strokeLinecap="round"
          >
            {visibleCities.map((from, i) =>
              visibleCities.slice(i + 1).map((to) => (
                <line
                  key={`${from.name}-${to.name}`}
                  x1={from.sx}
                  y1={from.sy}
                  x2={to.sx}
                  y2={to.sy}
                />
              ))
            )}
          </g>
        </>
      ) : null}

      {visibleCities.map((city, index) => {
        const side = city.sx < CX ? -1 : 1;
        const tipX = city.sx + side * 24;
        return (
          <g key={city.name}>
            {/* Como fundo os rótulos viram ruído e ainda ficam cortados pelo
                card por cima — restam só os pontos pulsando. */}
            {decorative ? null : (
              <>
            <line
              x1={city.sx}
              y1={city.sy}
              x2={tipX}
              y2={city.sy}
              stroke="var(--color-primary)"
              strokeOpacity="0.4"
              strokeWidth="1"
            />
            <text
              x={tipX + side * 4}
              y={city.sy}
              textAnchor={side < 0 ? "end" : "start"}
              dominantBaseline="middle"
              className="fill-current text-[9.5px]"
              opacity="0.8"
            >
              {city.name}
            </text>
              </>
            )}
            <circle cx={city.sx} cy={city.sy} r="3" fill="var(--color-primary)" opacity="0.35">
              <animate
                attributeName="r"
                values="3;11;3"
                dur="3.2s"
                begin={`${index * 1.05}s`}
                repeatCount="indefinite"
              />
              <animate
                attributeName="opacity"
                values="0.35;0;0.35"
                dur="3.2s"
                begin={`${index * 1.05}s`}
                repeatCount="indefinite"
              />
            </circle>
            <circle cx={city.sx} cy={city.sy} r="2.4" fill="var(--color-primary)" />
          </g>
        );
      })}
    </svg>
  );
}
