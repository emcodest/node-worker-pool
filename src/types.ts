export interface WorkerPoolOptions {
  timeout?: number;
  retries?: number;
}

export interface JobWrapper {
  id: number;
  data: any;
  resolve: (value: any) => void;
  reject: (reason?: any) => void;
  retriesLeft: number;
}
