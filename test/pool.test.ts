import { WorkerPool } from "../src/index";
import path from "path";

test("WorkerPool processes multiple jobs", async () => {
  const pool = new WorkerPool(path.join(__dirname, "../work.js"), 60);

  const results = await Promise.all(
    Array.from({ length: 1000 }).map((_, i) => pool.send({ job: i }))
  );

  // expect(results.length).toBe(10);
  results.forEach((res) => expect(res.success).toBe(true));

  pool.shutdown();
});
