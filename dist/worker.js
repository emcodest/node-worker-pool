const { parentPort } = require("worker_threads");

parentPort.on("message", (msg) => {
  setTimeout(() => {
    parentPort.postMessage({
      id: msg.id,
      result: { success: true, echo: msg.data },
    });
  }, 100);
});
