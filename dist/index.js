"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.WorkerPool = void 0;
const worker_threads_1 = require("worker_threads");
class WorkerPool {
    constructor(workerPath, poolSize = 4, options = {}) {
        var _a, _b;
        this.workers = [];
        this.queue = [];
        this.activeJobs = new Map();
        this.nextId = 0;
        this.workerPath = workerPath;
        this.poolSize = poolSize;
        this.options = {
            timeout: (_a = options.timeout) !== null && _a !== void 0 ? _a : 5000,
            retries: (_b = options.retries) !== null && _b !== void 0 ? _b : 0,
        };
        for (let i = 0; i < poolSize; i++) {
            this.spawnWorker(i);
        }
    }
    spawnWorker(index) {
        const worker = new worker_threads_1.Worker(this.workerPath);
        worker.on("message", (msg) => {
            const job = this.activeJobs.get(msg.id);
            if (job) {
                clearTimeout(job.timer);
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
    processQueue() {
        const idle = this.getIdleWorker();
        if (!idle || this.queue.length === 0)
            return;
        const job = this.queue.shift();
        this.runJob(idle, job);
    }
    getIdleWorker() {
        for (const w of this.workers) {
            if (![...this.activeJobs.values()].some((j) => j.worker === w))
                return w;
        }
        return null;
    }
    runJob(worker, job) {
        const { id, data, resolve, reject, retriesLeft } = job;
        const timer = setTimeout(() => {
            this.activeJobs.delete(id);
            if (retriesLeft > 0) {
                this.queue.push(Object.assign(Object.assign({}, job), { retriesLeft: retriesLeft - 1 }));
                this.processQueue();
            }
            else {
                reject(new Error("Job timed out"));
            }
        }, this.options.timeout);
        this.activeJobs.set(id, Object.assign(Object.assign({}, job), { worker, timer }));
        worker.postMessage({ id, data });
    }
    send(data) {
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
    shutdown() {
        for (const w of this.workers)
            w.terminate();
    }
}
exports.WorkerPool = WorkerPool;
