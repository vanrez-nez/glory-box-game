import * as ThreeModule from 'three';
import EventEmitter3 from 'eventemitter3';
import {
  TweenMax, TimelineMax, TweenLite, TimelineLite,
  Power0, Power1, Power2, Power3, Power4, Linear,
  Back, Elastic, Bounce, Circ, Expo, Sine,
} from 'gsap';

/*
  Expose dependencies as globals on `window`.

  This replaces webpack's ProvidePlugin + `global.THREE` assignment that the
  original toolchain relied on. The legacy `three/examples/js/*` scripts and the
  vendored ThreeCSG/Simple1DNoise scripts mutate/read a global `THREE`, and the
  game code references THREE / EventEmitter3 / gsap eases as free globals.

  three.js ships an ES module namespace which is frozen, so the example scripts
  cannot attach (EffectComposer, GLTFLoader, ...) to it directly. We copy it into
  a plain, mutable object before exposing it.
*/
const THREE = { ...ThreeModule };

Object.assign(window, {
  THREE,
  EventEmitter3,
  TweenMax,
  TimelineMax,
  TweenLite,
  TimelineLite,
  Power0,
  Power1,
  Power2,
  Power3,
  Power4,
  Linear,
  Back,
  Elastic,
  Bounce,
  Circ,
  Expo,
  Sine,
});
