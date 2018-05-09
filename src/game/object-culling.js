export default class ObjectCulling {
  constructor(maxDistance, maxVisibleNodes) {
    this.maxVisibleNodes = maxVisibleNodes;
    this.maxDistance = maxDistance;
    this.position = new THREE.Vector2();
    this.prevNearest = [];
    this.objects = [];
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
    const { kdTree, maxVisibleNodes, maxDistance } = this;
    const nearest = kdTree.nearest({
      y: position.y,
    }, maxVisibleNodes, maxDistance);
    this.setVisible(this.prevNearest, false);
    this.setVisible(nearest, true);
    this.prevNearest = nearest;
  }
}
