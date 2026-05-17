"use client";

import { useEffect, useRef } from "react";
import { useTheme } from "next-themes";

/**
 * Fragment-shader backdrop in the spirit of shaders.com — domain-warped fractal
 * noise rendered in the active accent color, tuned to feel like phosphor flow
 * on a CRT. Renders to a WebGL canvas behind the hero; degrades to nothing if
 * WebGL is unavailable or the user prefers reduced motion.
 */

const VERT = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAG = `
precision highp float;

uniform vec2  u_resolution;
uniform float u_time;
uniform float u_dpr;
uniform vec3  u_accent;
uniform vec3  u_bg;
uniform float u_dark;
uniform vec2  u_mouse;     // eased cursor offset in world space (aspect-corrected)
uniform float u_mouseAmt;  // 0..1 strength (drops to 0 when cursor leaves)

// ---------- ASCII Tunnel ----------
// Inspired by shaders.com / Ascii Tunnel preset:
// a forward-scrolling polar tunnel rendered in procedural glyph cells.

float hash(vec2 p) {
  p = fract(p * vec2(123.34, 456.21));
  p += dot(p, p + 45.32);
  return fract(p.x * p.y);
}

// Distance to a 2D line segment (a → b) in local glyph space.
float segDist(vec2 p, vec2 a, vec2 b) {
  vec2 ab = b - a;
  float h = clamp(dot(p - a, ab) / dot(ab, ab), 0.0, 1.0);
  return length(p - a - ab * h);
}

// Render a glyph chosen by intensity bucket. Returns 0..1 fill at point g in
// glyph-local space ([-1,1] x [-1,1]).
float glyphMask(vec2 g, float bin) {
  float m = 0.0;
  float stroke = 0.16;

  if (bin >= 6.0) {
    // █  block
    m = step(abs(g.x), 0.86) * step(abs(g.y), 0.86);
  } else if (bin >= 5.0) {
    // #  hash — two horizontal + two vertical strokes
    m  = step(abs(g.x - 0.35), stroke) + step(abs(g.x + 0.35), stroke);
    m += step(abs(g.y - 0.35), stroke) + step(abs(g.y + 0.35), stroke);
    m = clamp(m, 0.0, 1.0);
  } else if (bin >= 4.0) {
    // X  cross of two slashes
    float a = smoothstep(stroke, stroke * 0.4, abs(g.x - g.y));
    float b = smoothstep(stroke, stroke * 0.4, abs(g.x + g.y));
    m = max(a, b);
  } else if (bin >= 3.0) {
    // /  forward slash
    m = smoothstep(stroke, stroke * 0.4, abs(g.x - g.y));
  } else if (bin >= 2.0) {
    // |  vertical bar
    m = smoothstep(stroke, stroke * 0.4, abs(g.x));
  } else if (bin >= 1.0) {
    // :  colon (two dots)
    float d = min(length(g - vec2(0.0, 0.45)), length(g - vec2(0.0, -0.45)));
    m = smoothstep(0.22, 0.10, d);
  } else if (bin >= 0.5) {
    // ·  middot
    m = smoothstep(0.20, 0.08, length(g));
  }
  return clamp(m, 0.0, 1.0);
}

void main() {
  // ── glyph grid quantization
  vec2 cellPx = vec2(9.0, 14.0) * max(u_dpr, 1.0);
  vec2 cellIdx = floor(gl_FragCoord.xy / cellPx);
  vec2 cellUv  = fract(gl_FragCoord.xy / cellPx);
  vec2 centerPx = (cellIdx + 0.5) * cellPx;

  // ── world UV at cell center, aspect-corrected
  vec2 uv = (centerPx - 0.5 * u_resolution) / u_resolution.y;

  // ── tunnel vanishing point: shift right of the headline, proportional to
  // viewport aspect so it stays put on narrow screens.
  float aspect = u_resolution.x / max(u_resolution.y, 1.0);
  // tunnel vanishing point sits in the lower-right quadrant where the hero
  // has no text — fills the empty bottom-right with the densest pattern
  // instead of crowding the headline.
  vec2 origin = vec2(0.55 * aspect, -0.35);

  // ── cursor repulsion: push the sampled uv radially away from the cursor
  // with a gaussian falloff. Near the cursor the pattern is shoved outward,
  // leaving a softly cleared region.
  vec2 toCursor = uv - u_mouse;
  float dCursor = length(toCursor);
  float force   = exp(-dCursor * dCursor * 7.0) * u_mouseAmt;
  vec2  push    = (toCursor / max(dCursor, 0.0015)) * force * 0.22;
  uv += push;

  vec2 puv = uv - origin;

  // ── tunnel projection (polar → 1/r forward field)
  float r = max(length(puv), 0.04);
  float a = atan(puv.y, puv.x);

  float t = u_time * 0.42;
  float depth = 0.35 / r + t;
  float angle = a / 3.14159265;

  // ── pattern: rings × radial spokes + slow swirl
  float rings  = sin(depth * 5.2);
  float spokes = sin(angle * 9.0 + depth * 0.6);
  float swirl  = sin(angle * 3.0 - depth * 0.8 + u_time * 0.3);

  float pattern = rings * 0.55 + spokes * 0.35 + swirl * 0.25;
  pattern = pattern * 0.5 + 0.5;                  // 0..1
  pattern *= smoothstep(0.0, 0.18, r);            // mute the singularity
  pattern *= smoothstep(1.20, 0.55, r);           // tunnel mouth darkens out

  // slight stochastic dither per cell to break up bands
  pattern += (hash(cellIdx + floor(u_time * 8.0)) - 0.5) * 0.06;

  // ── intensity → glyph bucket (0..7)
  float bucket = floor(clamp(pattern, 0.0, 0.999) * 7.0);

  // glyph-local coords [-1, 1]
  vec2 g = cellUv * 2.0 - 1.0;
  float mask = glyphMask(g, bucket);

  // glyph brightness scales with bucket so denser glyphs read brighter
  float bright = (bucket + 1.0) / 7.0;
  float ink = mask * bright;

  // composite
  vec3 col;
  if (u_dark > 0.5) {
    col = u_bg + u_accent * ink * 0.85;
  } else {
    col = mix(u_bg, u_accent, ink * 0.55);
  }

  // very fine grain
  float grain = (hash(gl_FragCoord.xy + u_time) - 0.5) * 0.010;
  col += grain;

  gl_FragColor = vec4(col, 1.0);
}
`;

function hexToRgb(hex: string): [number, number, number] {
  const m = hex.replace("#", "");
  const n = m.length === 3 ? m.split("").map((c) => c + c).join("") : m;
  const v = parseInt(n, 16);
  return [((v >> 16) & 255) / 255, ((v >> 8) & 255) / 255, (v & 255) / 255];
}

function compile(gl: WebGLRenderingContext, type: number, src: string) {
  const sh = gl.createShader(type)!;
  gl.shaderSource(sh, src);
  gl.compileShader(sh);
  if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
    console.warn("shader compile failed", gl.getShaderInfoLog(sh));
    gl.deleteShader(sh);
    return null;
  }
  return sh;
}

export function HeroShader() {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const { resolvedTheme } = useTheme();

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;

    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const gl =
      (canvas.getContext("webgl", { antialias: false, alpha: false }) as
        | WebGLRenderingContext
        | null) ?? null;
    if (!gl) return;

    const vs = compile(gl, gl.VERTEX_SHADER, VERT);
    const fs = compile(gl, gl.FRAGMENT_SHADER, FRAG);
    if (!vs || !fs) return;

    const prog = gl.createProgram()!;
    gl.attachShader(prog, vs);
    gl.attachShader(prog, fs);
    gl.linkProgram(prog);
    if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) {
      console.warn("link failed", gl.getProgramInfoLog(prog));
      return;
    }
    gl.useProgram(prog);

    // fullscreen quad
    const buf = gl.createBuffer()!;
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(
      gl.ARRAY_BUFFER,
      new Float32Array([-1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1]),
      gl.STATIC_DRAW,
    );
    const aPos = gl.getAttribLocation(prog, "a_position");
    gl.enableVertexAttribArray(aPos);
    gl.vertexAttribPointer(aPos, 2, gl.FLOAT, false, 0, 0);

    const uRes = gl.getUniformLocation(prog, "u_resolution");
    const uTime = gl.getUniformLocation(prog, "u_time");
    const uDpr = gl.getUniformLocation(prog, "u_dpr");
    const uAccent = gl.getUniformLocation(prog, "u_accent");
    const uBg = gl.getUniformLocation(prog, "u_bg");
    const uDark = gl.getUniformLocation(prog, "u_dark");
    const uMouse = gl.getUniformLocation(prog, "u_mouse");
    const uMouseAmt = gl.getUniformLocation(prog, "u_mouseAmt");

    const dark = resolvedTheme === "dark";
    const accent = hexToRgb(dark ? "#e7e3d6" : "#0b0b0a");
    const bg = hexToRgb(dark ? "#0a0a09" : "#efece4");

    gl.uniform3f(uAccent, accent[0], accent[1], accent[2]);
    gl.uniform3f(uBg, bg[0], bg[1], bg[2]);
    gl.uniform1f(uDark, dark ? 1.0 : 0.0);

    let raf = 0;
    let start = performance.now();
    let lastResize = 0;

    // cursor tracking — target updated by mousemove, eased toward each frame
    const mouseTarget = { x: 0, y: 0, amt: 0 };
    const mouseEased = { x: 0, y: 0, amt: 0 };

    const onMove = (ev: MouseEvent) => {
      const r = canvas.getBoundingClientRect();
      const inside =
        ev.clientX >= r.left &&
        ev.clientX <= r.right &&
        ev.clientY >= r.top &&
        ev.clientY <= r.bottom;
      if (inside) {
        // world space: x = (px - cx) / h, y inverted (gl_FragCoord y is flipped)
        mouseTarget.x = (ev.clientX - r.left - r.width / 2) / r.height;
        mouseTarget.y = -(ev.clientY - r.top - r.height / 2) / r.height;
        mouseTarget.amt = 1;
      } else {
        mouseTarget.amt = 0;
      }
    };
    const onLeave = () => {
      mouseTarget.amt = 0;
    };
    if (!prefersReduced) {
      window.addEventListener("mousemove", onMove, { passive: true });
      window.addEventListener("blur", onLeave);
      document.addEventListener("mouseleave", onLeave);
    }

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;
      canvas.width = Math.max(1, Math.floor(w * dpr));
      canvas.height = Math.max(1, Math.floor(h * dpr));
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.uniform2f(uRes, canvas.width, canvas.height);
      gl.uniform1f(uDpr, dpr);
    };

    resize();
    const ro = new ResizeObserver(() => {
      const now = performance.now();
      if (now - lastResize < 80) return;
      lastResize = now;
      resize();
    });
    ro.observe(canvas);

    const draw = (t: number) => {
      const seconds = (t - start) / 1000;
      gl.uniform1f(uTime, prefersReduced ? 0 : seconds);

      // ease the cursor uniform toward its target (light smoothing)
      const k = 0.085;
      mouseEased.x += (mouseTarget.x - mouseEased.x) * k;
      mouseEased.y += (mouseTarget.y - mouseEased.y) * k;
      mouseEased.amt += (mouseTarget.amt - mouseEased.amt) * 0.06;
      gl.uniform2f(uMouse, mouseEased.x, mouseEased.y);
      gl.uniform1f(uMouseAmt, mouseEased.amt);

      gl.drawArrays(gl.TRIANGLES, 0, 6);
      if (!prefersReduced) {
        raf = requestAnimationFrame(draw);
      }
    };

    if (prefersReduced) {
      draw(performance.now());
    } else {
      raf = requestAnimationFrame(draw);
    }

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      if (!prefersReduced) {
        window.removeEventListener("mousemove", onMove);
        window.removeEventListener("blur", onLeave);
        document.removeEventListener("mouseleave", onLeave);
      }
      gl.deleteBuffer(buf);
      gl.deleteProgram(prog);
      gl.deleteShader(vs);
      gl.deleteShader(fs);
    };
  }, [resolvedTheme]);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="absolute inset-0 w-full h-full block pointer-events-none"
      style={{ opacity: 0.95 }}
    />
  );
}
