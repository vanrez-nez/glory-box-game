// Module augmentation: the engine attaches these custom props to THREE objects.
// This file must be a module (the `export {}`) for the augmentation to merge
// with the real `three` types rather than replace them.
import 'three';

declare module 'three' {
  interface Object3D {
    positionOffset: import('three').Vector2;
    scaleOffset: import('three').Vector3;
    positionCulled?: boolean;
  }
}

declare module '@vue/runtime-core' {
  interface ComponentCustomProperties {
    $store: import('vuex').Store<any>;
    $router: import('vue-router').Router;
    $route: import('vue-router').RouteLocationNormalizedLoaded;
  }
}

export {};
