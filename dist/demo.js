const path = require("path");
const { WorkerPool } = require("./index");
console.log('\x1b[41m%s\x1b[0m', 'xxx', WorkerPool)
const pool = new WorkerPool(path.join(__dirname, "worker.js"), 8, {}); // 8 threads

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
