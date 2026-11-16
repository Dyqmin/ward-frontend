// The backend is the deployed ward-worker (the same address as on the day-5 branch).
// For a local ward-worker on port 8787 use `http://${location.hostname}:8787` and `ws://…:8787`.
export const environment = {
  apiUrl: `https://ward-worker.teesdomin.workers.dev`,
  wsUrl: `ws://ward-worker.teesdomin.workers.dev`,
  defaultRoomCode: 'ward-demo',
};
