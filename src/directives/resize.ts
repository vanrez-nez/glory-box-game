import { debounce } from 'lodash';

/*
  Vue 3 replacement for the (Vue 2 only) `vue-resize-directive` package.
  Calls the bound handler whenever the element resizes, via ResizeObserver.
  Supports the `.debounce` modifier used by the original directive.
*/
const KEY = '__resizeObserver__';

export default {
  mounted(el: any, binding: any) {
    const handler = binding.value;
    if (typeof handler !== 'function') return;
    const callback = binding.modifiers.debounce ? debounce(handler, 200) : handler;
    const observer = new ResizeObserver(() => callback());
    observer.observe(el);
    el[KEY] = observer;
  },
  unmounted(el: any) {
    if (el[KEY]) {
      el[KEY].disconnect();
      delete el[KEY];
    }
  },
};
