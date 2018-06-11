export default class JobScheduler {
  constructor() {
    this.jobs = [];
    this.time = 0;
  }

  addJob(id, fn, execDelay = 0) {
    this.jobs.push({
      id,
      fn,
      time: execDelay,
    });
  }

  jobExists(id) {
    return this.jobs.some((j) => j.id === id);
  }

  update(delta) {
    const { jobs } = this;
    for (let i = jobs.length - 1; i >= 0; i--) {
      const job = jobs[i];
      job.time -= delta;
      if (job.time < 0) {
        job.fn();
        jobs.splice(i, 1);
      }
    }
  }
}