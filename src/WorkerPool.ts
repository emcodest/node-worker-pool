import { Worker } from "worker_threads";
import path from "path";
import { WorkerPoolOptions, JobWrapper } from "./types";

export class WorkerPool {
  private workers: Worker[] = [];
  private queue: JobWrapper[] = [];
  private activeJobs = new Map<number, JobWrapper>();
  private nextId = 0;
  private workerPath: string;
  private poolSize: number;
  private options: Required<WorkerPoolOptions>;

  constructor(
    workerPath: string,
    poolSize: number = 4,
    options: WorkerPoolOptions = {}
  ) {
    this.workerPath = workerPath;
    this.poolSize = poolSize;
    this.options = {
      timeout: options.timeout ?? 5000,
      retries: options.retries ?? 0,
    };

    for (let i = 0; i < poolSize; i++) {
      this.spawnWorker(i);
    }
  }

  private spawnWorker(index: number) {
    const worker = new Worker(this.workerPath);

    worker.on("message", (msg: { id: number; result: any }) => {
      const job = this.activeJobs.get(msg.id);
      if (job) {
        clearTimeout((job as any).timer);
        job.resolve(msg.result);
        this.activeJobs.delete(msg.id);
        this.processQueue();
      }
    });

    worker.on("exit", () => {
      this.spawnWorker(index); // auto-restart
    });

    this.workers[index] = worker;
  }

  private processQueue() {
    const idle = this.getIdleWorker();
    if (!idle || this.queue.length === 0) return;

    const job = this.queue.shift()!;
    this.runJob(idle, job);
  }

  private getIdleWorker(): Worker | null {
    for (const w of this.workers) {
      if (![...this.activeJobs.values()].some((j) => j.worker === w)) return w;
    }
    return null;
  }

  private runJob(worker: Worker, job: JobWrapper & { worker?: Worker }) {
    const { id, data, resolve, reject, retriesLeft } = job;
    const timer = setTimeout(() => {
      this.activeJobs.delete(id);
      if (retriesLeft > 0) {
        this.queue.push({ ...job, retriesLeft: retriesLeft - 1 });
        this.processQueue();
      } else {
        reject(new Error("Job timed out"));
      }
    }, this.options.timeout);

    this.activeJobs.set(id, { ...job, worker, timer });
    worker.postMessage({ id, data });
  }

  public send(data: any): Promise<any> {
    const id = ++this.nextId;
    return new Promise((resolve, reject) => {
      this.queue.push({
        id,
        data,
        resolve,
        reject,
        retriesLeft: this.options.retries,
      });
      this.processQueue();
    });
  }

  public shutdown() {
    for (const w of this.workers) w.terminate();
  }
}
