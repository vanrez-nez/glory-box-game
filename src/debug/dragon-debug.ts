import * as THREE from 'three/webgpu';
import { GAME } from '@/game/const';
import GameEnemyDragon from '@/game/enemy/enemy-dragon';
import { denWorld, worldRadius } from '@/game/enemy/dragon-serpentine';

/*
  DEV-only den entry/exit visualizer. It does NOT re-implement any movement — it instantiates the
  real `GameEnemyDragon` and only reads its outputs (`getDebugState().head`, `dragon.D`).

  This is DETERMINISTIC and STATIC (no animation): on load it replays a fixed number of fixed-dt
  steps twice and draws the result once, so every reload is pixel-identical. There is ONE rendered
  den; we visualise the head EXITING it (emerge) and ENTERING it (dive) — one of each, per plot —
  by running two short captures. The dragon's cycle needs a second endpoint, so an off-screen
  ANCHOR den supplies direction only; it is never drawn. Den `direction` (input/output) forces
  `pickHop` to a single legal choice, so there is no `Math.random` and no movement-code change.

  Three panels, each zoomed on the den: Front (X/Y), Top (X/Z, best for radial entry), 3/4 persp.
  Controls: [ / ] change the step budget, r recomputes — all deterministic.
*/

const R = GAME.CylinderRadius;            // wall radius
const OUT = R + 2;                         // travel radius (≈ R + circleHeight)
const DT = 1 / 60;                         // fixed timestep — no wall-clock, so replays are identical
const DEFAULT_STEPS = 120;                 // the "x steps": near-den steps recorded per capture (max)
const ZOOM_SPAN = 46;                      // world units shown across a panel's short side (zoom level)
const ENTER_FROM = ZOOM_SPAN * 0.55;       // begin recording once the head is this close to the den

interface FakeDen { body: { position: { x: number; y: number } }; opts: { direction: string } }

// The single rendered den, and an off-screen anchor that only gives the dragon its other endpoint.
// Both must sit in the player's segment band (|y| ≤ SegmentHeight/2) or pickHop drops them.
const DEN: FakeDen = { body: { position: { x: 0, y: 0 } }, opts: { direction: 'both' } };
const ANCHOR: FakeDen = { body: { position: { x: 40, y: 16 } }, opts: { direction: 'both' } };

interface Panel { x: number; y: number; w: number; h: number; label: string }
interface Proj { sx: number; sy: number; vis: boolean }
type Project = (w: THREE.Vector3) => Proj;
interface Capture { pts: THREE.Vector3[]; body: THREE.Vector3[] | null }

export default class DragonDebug {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private dragon: GameEnemyDragon;
  private parent = new THREE.Group();
  private cam = new THREE.PerspectiveCamera(45, 1, 0.1, 1000);

  private steps = DEFAULT_STEPS;
  private exit: Capture = { pts: [], body: null };  // head emerging OUT of the den
  private enter: Capture = { pts: [], body: null };  // head diving INTO the den

  private static SS = 3; // canvas supersample factor (capture resolution = CSS size × SS)
  private static PERSP_OFFSET = new THREE.Vector3(14, 16, 24); // 3/4 camera offset from the den

  // scratch
  private _w = new THREE.Vector3();
  private _c = new THREE.Vector3();   // zoom centre = the den's wall point
  private _tmp = new THREE.Vector3();

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.dragon = new GameEnemyDragon({ parent: this.parent, tailSize: 100 });
    denWorld(this._c, DEN, R); // den hole centre on the wall — the zoom focus for every panel
    (window as any).__dbg = this; // DEV: console handle
    this.resize();
    window.addEventListener('resize', this.resizeAndDraw);
    window.addEventListener('keydown', this.onKey);
    this.compute();
    this.draw();
  }

  dispose() {
    window.removeEventListener('resize', this.resizeAndDraw);
    window.removeEventListener('keydown', this.onKey);
  }

  private resize = () => {
    // Fixed supersample (ignore DPR) so the thin trails stay crisp and a real kink is
    // distinguishable from pixel aliasing.
    const ss = DragonDebug.SS;
    this.canvas.width = Math.round(window.innerWidth * ss);
    this.canvas.height = Math.round(window.innerHeight * ss);
    this.canvas.style.width = `${window.innerWidth}px`;
    this.canvas.style.height = `${window.innerHeight}px`;
    this.ctx.setTransform(ss, 0, 0, ss, 0, 0);
  };

  private resizeAndDraw = () => { this.resize(); this.draw(); };

  private onKey = (e: KeyboardEvent) => {
    if (e.key === '[') { this.steps = Math.max(20, this.steps - 10); this.compute(); this.draw(); }
    else if (e.key === ']') { this.steps += 10; this.compute(); this.draw(); }
    else if (e.key === 'r') { this.compute(); this.draw(); }
  };

  // --- deterministic capture --------------------------------------------------

  // One deterministic near-den capture. Spawns the appearance, fast-forwards through the off-screen
  // traverse until the head is approaching the den's out-point, then records up to `steps` of the
  // near-den event, stopping when the appearance ends. `denDir`/`anchorDir` pin pickHop's choice:
  //   EXIT  → DEN='input',  ANCHOR='output'  ⇒ entry=DEN  (head spawns IN the den, emerges OUT)
  //   ENTER → DEN='output', ANCHOR='input'   ⇒ target=DEN (head arrives from the anchor, dives IN)
  // Also keeps a body snapshot at the wall crossing (the threading moment) so shape kinks show.
  private capture(denDir: string, anchorDir: string): Capture {
    DEN.opts.direction = denDir;
    ANCHOR.opts.direction = anchorDir;
    const map = { getActiveDens: () => [DEN, ANCHOR] };
    const player = { x: 0, y: DEN.body.position.y, z: 0 };
    const denOut = denWorld(new THREE.Vector3(), DEN, OUT);
    this.dragon.restart();
    this.dragon.spawnAppearance(map, player.y);
    let guard = 0;
    while (guard++ < 1200 && this.dragon.getDebugState().head.distanceTo(denOut) > ENTER_FROM) {
      this.dragon.update(DT, player, map);
    }
    const pts: THREE.Vector3[] = [this.dragon.getDebugState().head.clone()];
    let body: THREE.Vector3[] | null = null;
    let bestWallGap = Infinity;
    for (let i = 0; i < this.steps; i++) {
      this.dragon.update(DT, player, map);
      if (this.dragon.state !== 'active') { break; } // appearance ended (entry drained → hidden)
      const head = this.dragon.getDebugState().head;
      pts.push(head.clone());
      const r = worldRadius(head);
      if (r <= R + 1.5) { const gap = Math.abs(r - R); if (gap < bestWallGap) { bestWallGap = gap; body = this.dragon.D.map((v) => v.clone()); } }
    }
    return { pts, body };
  }

  private compute() {
    this.exit = this.capture('input', 'output');
    this.enter = this.capture('output', 'input');
  }

  // --- projections (zoomed + centred on the den) ------------------------------

  private fitScale(p: Panel) {
    const m = 24;
    return (Math.min(p.w, p.h) - 2 * m) / ZOOM_SPAN;
  }

  // Front X/Y and Top X/Z share the same centred-orthographic form; persp uses the THREE camera.
  private projectorFront(p: Panel): Project {
    const s = this.fitScale(p); const c = this._c;
    return (w) => ({ sx: p.x + p.w / 2 + (w.x - c.x) * s, sy: p.y + p.h / 2 - (w.y - c.y) * s, vis: true });
  }

  private projectorTop(p: Panel): Project {
    const s = this.fitScale(p); const c = this._c;
    return (w) => ({ sx: p.x + p.w / 2 + (w.x - c.x) * s, sy: p.y + p.h / 2 - (w.z - c.z) * s, vis: true });
  }

  private projectorPersp(p: Panel): Project {
    this.cam.aspect = p.w / p.h;
    this.cam.position.copy(this._c).add(DragonDebug.PERSP_OFFSET);
    this.cam.lookAt(this._c);
    this.cam.updateProjectionMatrix();
    this.cam.updateMatrixWorld();
    return (w) => {
      this._w.copy(w).project(this.cam);
      return {
        sx: p.x + (this._w.x * 0.5 + 0.5) * p.w,
        sy: p.y + (1 - (this._w.y * 0.5 + 0.5)) * p.h,
        vis: this._w.z < 1,
      };
    };
  }

  // --- draw -------------------------------------------------------------------

  private draw() {
    const ctx = this.ctx;
    const W = window.innerWidth;
    const H = window.innerHeight;
    ctx.fillStyle = '#000';
    ctx.fillRect(0, 0, W, H);

    const headH = 30;
    const halfW = W / 2;
    const rowH = (H - headH) / 2;
    const panels: { panel: Panel; make: (p: Panel) => Project }[] = [
      { panel: { x: 0, y: headH, w: halfW, h: rowH, label: 'FRONT  X/Y   (zoom on den)' }, make: this.projectorFront.bind(this) },
      { panel: { x: halfW, y: headH, w: halfW, h: rowH, label: 'TOP  X/Z   (radial entry, zoom on den)' }, make: this.projectorTop.bind(this) },
      { panel: { x: 0, y: headH + rowH, w: W, h: rowH, label: '3/4 PERSPECTIVE   (zoom on den)' }, make: this.projectorPersp.bind(this) },
    ];
    for (const { panel, make } of panels) { this.drawPanel(panel, make(panel)); }
    this.drawHeader(W, headH);
  }

  private drawPanel(p: Panel, project: Project) {
    const ctx = this.ctx;
    ctx.save();
    ctx.beginPath();
    ctx.rect(p.x, p.y, p.w, p.h);
    ctx.clip();
    ctx.strokeStyle = '#1c2233';
    ctx.lineWidth = 1;
    ctx.strokeRect(p.x + 0.5, p.y + 0.5, p.w - 1, p.h - 1);
    ctx.fillStyle = '#5f6b90';
    ctx.font = '11px monospace';
    ctx.fillText(p.label, p.x + 10, p.y + 16);

    this.drawWallRefs(project);
    this.drawDen(project);
    // exit = amber, enter = cyan; under-wall (hidden) runs drawn dimmer so threading is legible.
    this.strokeTrail(project, this.exit.pts, '#e7b15a', 'rgba(231,177,90,0.35)');
    this.strokeTrail(project, this.enter.pts, '#49d6ff', 'rgba(73,214,255,0.35)');
    this.drawBody(project, this.exit.body, '#e7b15a');
    this.drawBody(project, this.enter.body, '#49d6ff');
    ctx.restore();
  }

  // Faint wall (R) + travel (OUT) rings sampled around the den; clipping shows only the local arc.
  private drawWallRefs(project: Project) {
    const ctx = this.ctx;
    ctx.strokeStyle = '#161a28';
    ctx.lineWidth = 1;
    for (const rad of [R, OUT]) {
      ctx.beginPath();
      for (let i = 0; i <= 160; i++) {
        const a = (i / 160) * Math.PI * 2;
        this._tmp.set(rad * Math.sin(a), DEN.body.position.y, rad * Math.cos(a));
        const q = project(this._tmp);
        if (i === 0) { ctx.moveTo(q.sx, q.sy); } else { ctx.lineTo(q.sx, q.sy); }
      }
      ctx.stroke();
    }
  }

  // The den hole: a ring at its wall point plus a crosshair so the entry/exit offset is readable.
  private drawDen(project: Project) {
    const ctx = this.ctx;
    denWorld(this._tmp, DEN, R);
    const q = project(this._tmp);
    ctx.strokeStyle = '#8a93b8';
    ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(q.sx, q.sy, 7, 0, Math.PI * 2); ctx.stroke();
    ctx.strokeStyle = 'rgba(138,147,184,0.4)';
    ctx.beginPath();
    ctx.moveTo(q.sx - 14, q.sy); ctx.lineTo(q.sx + 14, q.sy);
    ctx.moveTo(q.sx, q.sy - 14); ctx.lineTo(q.sx, q.sy + 14);
    ctx.stroke();
  }

  // Stroke a world polyline, switching to the dim colour for runs inside the wall (hidden).
  private strokeTrail(project: Project, pts: THREE.Vector3[], outCol: string, inCol: string) {
    if (pts.length < 2) { return; }
    const ctx = this.ctx;
    ctx.lineWidth = 1.5;
    let cur = worldRadius(pts[0]) < R - 0.5;
    ctx.beginPath();
    let q = project(pts[0]); ctx.moveTo(q.sx, q.sy);
    for (let i = 1; i < pts.length; i++) {
      const inside = worldRadius(pts[i]) < R - 0.5;
      q = project(pts[i]);
      if (inside !== cur) {
        ctx.strokeStyle = cur ? inCol : outCol; ctx.stroke();
        ctx.beginPath(); const qp = project(pts[i - 1]); ctx.moveTo(qp.sx, qp.sy); cur = inside;
      }
      ctx.lineTo(q.sx, q.sy);
    }
    ctx.strokeStyle = cur ? inCol : outCol; ctx.stroke();
  }

  // Body beads at the threading moment, so kinks/pinches in the shape are visible.
  private drawBody(project: Project, body: THREE.Vector3[] | null, col: string) {
    if (!body) { return; }
    const ctx = this.ctx;
    // connecting line
    ctx.strokeStyle = col;
    ctx.globalAlpha = 0.5;
    ctx.lineWidth = 1;
    ctx.beginPath();
    for (let i = 0; i < body.length; i++) {
      const q = project(body[i]);
      if (i === 0) { ctx.moveTo(q.sx, q.sy); } else { ctx.lineTo(q.sx, q.sy); }
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
    // beads (dim if inside the wall)
    for (let i = 0; i < body.length; i++) {
      const inside = worldRadius(body[i]) < R - 0.5;
      const q = project(body[i]);
      if (!q.vis) { continue; }
      ctx.fillStyle = col;
      ctx.globalAlpha = inside ? 0.25 : 1;
      ctx.beginPath(); ctx.arc(q.sx, q.sy, inside ? 1.4 : 2.2, 0, Math.PI * 2); ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  private drawHeader(W: number, headH: number) {
    const ctx = this.ctx;
    ctx.fillStyle = '#0a0d16';
    ctx.fillRect(0, 0, W, headH);
    ctx.fillStyle = '#cdd6f0';
    ctx.font = '12px monospace';
    ctx.fillText(
      `dragon-debug (static)   den (${DEN.body.position.x},${DEN.body.position.y})   steps:${this.steps}   `
      + 'amber=exit  cyan=enter   [ / ] steps   r recompute',
      10, 20,
    );
  }
}
