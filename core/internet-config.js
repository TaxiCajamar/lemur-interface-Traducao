// core/internet-config.js
/**
 * Configurações de rede e servidores para WebRTC
 */

export const SIGNALING_SERVER_URL = 'https://lemur-signal.onrender.com';

export const getIceServers = () => {
  return [
    // STUN servers públicos do Google
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
    
    // TURN server público do Jitsi (fallback)
    {
      urls: 'turn:meet-jit-si-turnrelay.jitsi.net:443?transport=tcp',
      username: 'guest',
      credential: 'guest'
    },
    
    // TURN servers adicionais como fallback
    {
      urls: 'turn:turn.anyfirewall.com:443?transport=tcp',
      username: 'webrtc',
      credential: 'webrtc'
    }
  ];
};

// Configurações de timeout e reconexão
export const CONNECTION_CONFIG = {
  iceConnectionTimeout: 10000,
  signalingTimeout: 5000,
  maxReconnectAttempts: 3
};

export default {
  SIGNALING_SERVER_URL,
  getIceServers,
  CONNECTION_CONFIG
};
