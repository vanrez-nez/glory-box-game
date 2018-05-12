const DEFAULT = {
  maxDistance: 80,
  maxVisibleNodes: 100,
  updateRate: 10,
};

export default class ObjectCulling {
  constructor(opts) {
    this.opts = { ...DEFAULT, ...opts };
    this.prevNearest = [];
    this.objects = [];
    // force first frame to render
    this.updateFrame = opts.updateRate;
    this.rebuild();
  }

  add(object) {
    const arr = [].concat(object);
    arr.forEach((o) => {
      if (o.positionCulled === true) {
        this.objects.push({
          target: o,
          parent: o.parent,
          y: o.position.y,
        });
      }
      if (o.children.length > 0) {
        this.add(o.children);
      }
    });
  }

  rebuild() {
    // eslint-disable-next-line
    this.kdTree = new kdTree(this.objects, this.distance, ['y']);
    this.setVisible(this.objects, false);
  }

  distance(a, b) {
    return Math.abs(a.y - b.y);
  }

  setVisible(objects, visible) {
    for (let i = 0; i < objects.length; i++) {
      let obj = objects[i];
      if (Array.isArray(obj)) {
        obj = obj[0];
      }
      if (visible && obj.target.parent === null) {
        obj.parent.add(obj.target);
      } else if (!visible && obj.target.parent !== null) {
        obj.parent.remove(obj.target);
      }
    }
  }

  updateVisibilityFrom(position) {
    const { updateRate, maxVisibleNodes, maxDistance } = this.opts;
    this.updateFrame++;
    if (this.updateFrame % updateRate === 0) {
      const nearest = this.kdTree.nearest({
        y: position.y,
      }, maxVisibleNodes, maxDistance);
      this.setVisible(this.prevNearest, false);
      this.setVisible(nearest, true);
      this.prevNearest = nearest;
    }
  }
}
