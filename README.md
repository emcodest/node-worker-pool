# @emcode/worker-pool

> Ultra-fast, typed in-memory worker thread pool for Node.js with retries, timeouts, auto-respawn, and queueing.

___

## 🚀 Installation

```bash
npm install @emcode/worker-pool
```

## 🧠 Features

- ✅ Timeout per job
- 🔁 Retry on failure
- 🚀 Queueing system
- ♻️ Auto-restarts workers
- 🧵 Uses `worker_threads`

---

## ✨ Example

```ts
import { WorkerPool } from "@emcode/worker-pool";

const pool = new WorkerPool("./index.js", 4, {
  timeout: 3000,
  retries: 2
});

(async () => {
  const result = await pool.send({ name: "Emmanuel" });
  console.log("Result:", result);
  pool.shutdown();
})();
```

## 📄 Worker (worker.js)

```js
const { parentPort } = require("worker_threads");

parentPort.on("message", (msg) => {
  setTimeout(() => {
    parentPort.postMessage({
      id: msg.id,
      result: { success: true, echo: msg.data },
    });
  }, 100);
});
```

## 🧪 Run Tests

```bash
npm run test
```
