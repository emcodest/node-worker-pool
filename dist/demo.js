const path = require("path");
const { WorkerPool } = require("./index");
const pool = new WorkerPool(path.join(__dirname, "worker.js"), 8, {
  timeout: 5000,
  retries: 3
}); // 8 threads

async function run() {
  const tasks = [];

  for (let i = 0; i < 1000; i++) {
    tasks.push(pool.send({ job: i }));
  }

  const results = await Promise.all(tasks);
  console.log("Done. Sample result:", results[0]);

  pool.shutdown();
}

run();
