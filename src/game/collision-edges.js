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

  copy(cE) {
    this.edges = [...cE.edges];
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
