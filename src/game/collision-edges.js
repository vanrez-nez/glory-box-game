export default class CollisionEdges {
  constructor() {
    this.reset();
  }

  get top()     { return this.edges[0]; }
  get right()   { return this.edges[1]; }
  get bottom()  { return this.edges[2]; }
  get left()    { return this.edges[3]; }
  set top(v)    { this.edges[0] = v; }
  set right(v)  { this.edges[1] = v; }
  set bottom(v) { this.edges[2] = v; }
  set left(v)   { this.edges[3] = v; }

  reset() {
    this.edges = [null, null, null, null];
  }

  isColliding() {
    return this.edges.find(v => v !== null) !== undefined;
  }

  equals(cE) {
    return cE.edges.every((v, i) => this.edges[i] === v);
  }

  hasType(type) {
    const { edges: cE } = this;
    return (
      (cE[0] && cE[0].opts.type === type) ||
      (cE[1] && cE[1].opts.type === type) ||
      (cE[2] && cE[2].opts.type === type) ||
      (cE[3] && cE[3].opts.type === type)
    );
  }

  set(top, right, bottom, left) {
    this.edges[0] = top;
    this.edges[1] = right;
    this.edges[2] = bottom;
    this.edges[3] = left;
  }

  copy(cE) {
    this.edges[0] = cE.edges[0];
    this.edges[1] = cE.edges[1];
    this.edges[2] = cE.edges[2];
    this.edges[3] = cE.edges[3];
  }

  diff(cE) {
    const dE = this.edges.map((v, i) => {
      if (cE.edges[i] !== this.edges[i]) {
        return cE.edges[i] || this.edges[i];
      }
      return null;
    });
    const result = new CollisionEdges();
    result.edges = dE;
    return result;
  }
}
