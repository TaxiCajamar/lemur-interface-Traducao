export const SIGNALING_SERVER_URL = 'https://lemur-signal-ings.onrender.com';

export const getIceServers = () => {
  return [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    {
      urls: 'turn:meet-jit-si-turnrelay.jitsi.net:443?transport=tcp',
      username: 'guest',
      credential: 'guest'
    }
  ];
};
