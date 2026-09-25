// The backend (ward-worker) runs on port 8787 of the machine that serves the app. Using the page's
// own hostname means the same build works on localhost and for phones on the workshop LAN.
const host = typeof location === 'undefined' ? 'localhost' : location.hostname;

export const environment = {
  apiUrl: `http://${host}:8787`,
  wsUrl: `ws://${host}:8787`,
  defaultRoomCode: 'ward-demo',
};
