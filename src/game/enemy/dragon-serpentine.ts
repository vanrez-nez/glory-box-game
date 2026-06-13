import * as THREE from 'three/webgpu';
import { GameConfigInstance as GameConfig, type DRAGON } from '@/game/config';
import { GAME } from '@/game/const';
import type GameDragonDen from '@/game/props/dragon-den';

/*
  Gait-first serpenoid helpers for the dragon (ported from the reference demo; see the
  memory note dragon-gait-first). The dragon is NOT railed: a sinusoid drives the head's
  heading, the head writes a world-space trail, and the body follows that trail at fixed
  arc spacing. This module holds the pure math — den selection (goals), the gait amplitude
  conversion, and the trail resampler. The per-frame controller/state machine lives in
  enemy-dragon.ts.

  Coordinates: the head/body live in full world space. The cylinder only enters through
  den targets and "altitude" = distance from the cylinder axis (the wall sits at
  GAME.CylinderRadius; the dragon travels just beyond it and dives back through dens).
*/

export const HIDDEN_DEPTH = 9;        // radial depth below the wall the dragon hides at
const PSI_MAX = 1.2;                  // no-fold cap on angular swing (rad)

export type DragonParams = typeof DRAGON;

// --- world <-> cylinder ----------------------------------------------------

// Cylinder coords (theta, y, radius) → world XYZ (unbounded theta winds correctly).
export function cylToWorld(out: THREE.Vector3, theta: number, y: number, radius: number) {
  out.set(radius * Math.sin(theta), y, radius * Math.cos(theta));
  return out;
}

// Distance of a world point from the cylinder axis (its "altitude" / radius).
export function worldRadius(p: THREE.Vector3) { return Math.hypot(p.x, p.z); }

// A den's world position at a given radius (theta from its map-x, y from its map-y).
export function denWorld(out: THREE.Vector3, den: GameDragonDen, radius: number) {
  return cylToWorld(out, denTheta(den), den.body.position.y, radius);
}

// --- den helpers -----------------------------------------------------------

const denDir = (den: GameDragonDen): string => (den.opts as any)?.direction ?? 'both';
export const denTheta = (den: GameDragonDen) => den.body.position.x * GameConfig.ThetaPerUnit;
const segmentCenterY = (playerY: number) =>
  Math.round(playerY / GAME.SegmentHeight) * GAME.SegmentHeight;

// Dens whose Y falls within the player's current segment band (±SegmentHeight/2).
export function densInSegment(dens: GameDragonDen[], playerY: number): GameDragonDen[] {
  const center = segmentCenterY(playerY);
  const half = GAME.SegmentHeight * 0.5;
  return dens.filter((d) => Math.abs(d.body.position.y - center) <= half);
}

function weightedPick<T>(items: T[], weights: number[]): T | null {
  let total = 0;
  for (const w of weights) { total += w; }
  if (total <= 0) { return items.length ? items[(Math.random() * items.length) | 0] : null; }
  let r = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    r -= weights[i];
    if (r <= 0) { return items[i]; }
  }
  return items[items.length - 1];
}

// Entry (emerge) den: any non-output den (≠ the last-used den), weighted by a Gaussian
// on |denY − playerY| so it tends to surface near the player.
function pickEntry(
  dens: GameDragonDen[], playerY: number, sigma: number, exclude: GameDragonDen | null,
): GameDragonDen | null {
  const cands = dens.filter((d) => denDir(d) !== 'output' && d !== exclude);
  if (!cands.length) { return null; }
  const weights = cands.map((d) => {
    const dy = (d.body.position.y - playerY) / Math.max(1, sigma);
    return Math.exp(-dy * dy);
  });
  return weightedPick(cands, weights);
}

// Target (dive) den: a uniform-random non-input den (≠ entry).
function pickTargetDen(dens: GameDragonDen[], entry: GameDragonDen): GameDragonDen | null {
  const cands = dens.filter((d) => d !== entry && denDir(d) !== 'input');
  if (!cands.length) { return null; }
  return cands[(Math.random() * cands.length) | 0];
}

// Pick one hop: emerge from a fresh den (≠ lastDen), dive into a random other den. Returns
// null if the player's segment has fewer than 2 usable dens.
export function pickHop(
  dens: GameDragonDen[], playerY: number, params: DragonParams, lastDen: GameDragonDen | null,
): { entry: GameDragonDen; target: GameDragonDen } | null {
  const seg = densInSegment(dens, playerY);
  if (seg.length < 2) { return null; }
  const entry = pickEntry(seg, playerY, params.playerYSigma, lastDen);
  if (!entry) { return null; }
  const target = pickTargetDen(seg, entry);
  if (!target) { return null; }
  return { entry, target };
}

// --- gait math -------------------------------------------------------------

export interface Gait { lambda: number; kw: number; psiH: number; }

// Convert the world-unit lateral semi-amplitude to the angular swing the heading wave uses:
// ψ = a·k_w (k_w = 2π/λ), capped at PSI_MAX so the tangent always keeps a forward component
// (no fold/cusp). Shorter wavelength ⇒ lower physical-amplitude ceiling before the cap bites.
// Single lateral axis only: on the cylinder surface that one weave already serpentines both
// around (theta) and along (y); a second (radial) axis would lift off / clip the wall.
export function gait(p: DragonParams): Gait {
  const lambda = Math.max(0.5, p.wavelength);
  const kw = (2 * Math.PI) / lambda;
  return { lambda, kw, psiH: Math.min(p.amplitude * kw, PSI_MAX) };
}

// Path speed that holds net forward speed ~constant as amplitude changes: a wigglier path
// covers less ground per unit length, so divide by the mean forward projection.
export function pathSpeed(p: DragonParams, g: Gait) {
  const loss = Math.max(0.35, 1 - 0.25 * (g.psiH * g.psiH));
  return p.speed / loss;
}

// --- body = trail follower -------------------------------------------------

// Fill `out[0..N-1]` by sampling the head's world `trail` (newest position last) at fixed
// arc length `segLen` behind the head. out[0] = head. Spacing is enforced in arc length, so
// it is invariant to frame rate / speed — the body never bunches (no pinch) and the tail
// retraces the exact curve the head carved (no rigid pivot, no jump).
export function resampleTrail(
  trail: THREE.Vector3[], N: number, segLen: number, out: THREE.Vector3[],
) {
  if (trail.length === 0) { return; }
  let k = trail.length - 1;
  out[0].copy(trail[k]);
  let target = segLen;
  let accum = 0;
  for (let i = 1; i < N; i++) {
    while (k > 0) {
      const dd = trail[k].distanceTo(trail[k - 1]);
      if (accum + dd >= target) { break; }
      accum += dd; k -= 1;
    }
    if (k <= 0) { out[i].copy(trail[0]); continue; }
    const dd = trail[k].distanceTo(trail[k - 1]);
    const f = dd > 1e-6 ? (target - accum) / dd : 0;
    out[i].lerpVectors(trail[k], trail[k - 1], f);
    target += segLen;
  }
}
