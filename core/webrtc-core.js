// core/webrtc-core.js
import { getIceServers, SIGNALING_SERVER_URL, CONNECTION_CONFIG } from './internet-config.js';

class WebRTCCore {
  constructor(socketUrl = SIGNALING_SERVER_URL) {
    // ✅ VERIFICAÇÃO CRÍTICA - Socket.IO disponível?
    if (typeof io === 'undefined') {
      const error = 'Socket.IO não carregado. Verifique a ordem dos scripts no HTML.';
      console.error('❌', error);
      throw new Error(error);
    }
    
    console.log('🎯 Inicializando WebRTCCore com URL:', socketUrl);
    
    // ✅ Configuração robusta do Socket.IO
    this.socket = io(socketUrl, {
      transports: ['websocket', 'polling'],
      withCredentials: false,
      timeout: CONNECTION_CONFIG.signalingTimeout
    });
    
    this.peer = null;
    this.localStream = null;
    this.remoteStreamCallback = null;
    this.currentCaller = null;
    this.dataChannel = null;
    this.onDataChannelMessage = null;
    this.onIncomingCall = null;
    this.onCallEnded = null;
    this.isCallActive = false;

    // ✅ Data Channel global para acesso externo
    window.rtcDataChannel = {
      send: (message) => {
        if (this.dataChannel && this.dataChannel.readyState === 'open') {
          this.dataChannel.send(message);
        } else {
          console.warn('⚠️ DataChannel não está aberto');
        }
      },
      isOpen: () => {
        return this.dataChannel && this.dataChannel.readyState === 'open';
      },
      getState: () => {
        return this.dataChannel ? this.dataChannel.readyState : 'none';
      }
    };

    this.iceServers = getIceServers();
    
    // ✅ Configura handlers do socket imediatamente
    this.setupSocketHandlers();
    
    console.log('✅ WebRTCCore inicializado com sucesso');
  }

  /**
   * 🔌 Configura handlers do Socket.IO
   */
  setupSocketHandlers() {
    console.log('🔧 Configurando handlers do Socket.IO...');
    
    // ✅ Conexão estabelecida
    this.socket.on('connect', () => {
      console.log('✅ Conectado ao servidor de signaling');
    });

    // ✅ Desconexão
    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Desconectado do signaling. Razão:', reason);
      this.isCallActive = false;
    });

    // ✅ Erro de conexão
    this.socket.on('connect_error', (error) => {
      console.error('❌ Erro de conexão com signaling:', error);
    });

    // ✅ Resposta da chamada
    this.socket.on('acceptAnswer', (data) => {
      console.log('✅ Answer recebido de:', data.from);
      if (this.peer && this.peer.signalingState !== 'closed') {
        this.peer.setRemoteDescription(new RTCSessionDescription(data.answer))
          .then(() => console.log('✅ Answer remoto configurado com sucesso'))
          .catch(error => console.error('❌ Erro ao configurar answer:', error));
      }
    });

    // ✅ ICE Candidates
    this.socket.on('ice-candidate', (data) => {
      console.log('🧊 ICE candidate recebido de:', data.from);
      if (this.peer && this.peer.connectionState !== 'closed') {
        this.peer.addIceCandidate(new RTCIceCandidate(data.candidate))
          .then(() => console.log('✅ ICE candidate adicionado'))
          .catch(error => console.error('❌ Erro ao adicionar ICE candidate:', error));
      }
    });

    // ✅ Chamada recebida
    this.socket.on('incomingCall', (data) => {
      console.log('📞 Chamada recebida de:', data.from, 'Idioma:', data.callerLang);
      this.currentCaller = data.from;
      this.isCallActive = true;
      
      if (this.onIncomingCall) {
        this.onIncomingCall(data.offer, data.callerLang);
      } else {
        console.warn('⚠️ Handler de chamada recebida não configurado');
      }
    });

    // ✅ Chamada rejeitada ou finalizada
    this.socket.on('callEnded', (data) => {
      console.log('📞 Chamada finalizada por:', data.from);
      this.isCallActive = false;
      if (this.onCallEnded) {
        this.onCallEnded(data.from);
      }
    });
  }

  /**
   * 🔌 Configura handlers do Data Channel
   */
  setupDataChannelHandlers() {
    if (!this.dataChannel) {
      console.warn('⚠️ DataChannel não disponível para configurar handlers');
      return;
    }
    
    this.dataChannel.onopen = () => {
      console.log('✅ DataChannel conectado - Pronto para mensagens');
    };

    this.dataChannel.onmessage = (event) => {
      console.log('📨 Mensagem recebida via DataChannel:', event.data);
      if (this.onDataChannelMessage) {
        this.onDataChannelMessage(event.data);
      }
    };

    this.dataChannel.onerror = (error) => {
      console.error('❌ Erro no DataChannel:', error);
    };

    this.dataChannel.onclose = () => {
      console.log('🔌 DataChannel fechado');
    };
  }

  /**
   * 👤 Registra usuário no servidor de signaling
   */
  initialize(userId) {
    console.log('👤 Registrando usuário no signaling:', userId);
    this.socket.emit('register', userId);
  }

  /**
   * 📞 Inicia uma chamada para outro usuário
   */
  startCall(targetId, stream, callerLang) {
    console.log('📞 Iniciando chamada para:', targetId, 'Idioma:', callerLang);
    
    if (this.isCallActive) {
      console.warn('⚠️ Chamada já em andamento');
      return;
    }

    this.localStream = stream;
    this.isCallActive = true;
    
    // ✅ Cria nova conexão peer
    this.peer = new RTCPeerConnection({ 
      iceServers: this.iceServers 
    });

    // ✅ Configura Data Channel para mensagens de texto
    this.dataChannel = this.peer.createDataChannel('chat', {
      ordered: true
    });
    this.setupDataChannelHandlers();

    // ✅ Adiciona tracks do stream local
    stream.getTracks().forEach(track => {
      this.peer.addTrack(track, stream);
      console.log(`✅ Track ${track.kind} adicionada à conexão`);
    });

    // ✅ Handler para stream remoto
    this.peer.ontrack = (event) => {
      console.log('🎥 Stream remoto recebido - Configurando...');
      if (event.streams && event.streams[0]) {
        if (this.remoteStreamCallback) {
          this.remoteStreamCallback(event.streams[0]);
        }
      }
    };

    // ✅ ICE Candidates
    this.peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Enviando ICE candidate para:', targetId);
        this.socket.emit('ice-candidate', {
          to: targetId,
          candidate: event.candidate
        });
      }
    };

    // ✅ Estado da conexão
    this.peer.onconnectionstatechange = () => {
      console.log('🔄 Estado da conexão:', this.peer.connectionState);
      if (this.peer.connectionState === 'connected') {
        console.log('✅ Conexão WebRTC estabelecida!');
      } else if (this.peer.connectionState === 'disconnected' || 
                 this.peer.connectionState === 'failed') {
        console.log('❌ Conexão WebRTC perdida');
        this.isCallActive = false;
      }
    };

    // ✅ Cria e envia offer
    this.peer.createOffer()
      .then(offer => {
        console.log('📨 Offer criado - Configurando descrição local...');
        return this.peer.setLocalDescription(offer);
      })
      .then(() => {
        console.log('📤 Enviando offer para:', targetId);
        this.socket.emit('call', {
          to: targetId,
          offer: this.peer.localDescription,
          callerLang: callerLang
        });
      })
      .catch(error => {
        console.error('❌ Erro ao iniciar chamada:', error);
        this.isCallActive = false;
      });
  }

  /**
   * 📞 Processa uma chamada recebida
   */
  handleIncomingCall(offer, localStream, callback) {
    console.log('📞 Processando chamada recebida de:', this.currentCaller);
    
    if (this.isCallActive) {
      console.warn('⚠️ Já existe uma chamada ativa');
      return;
    }

    this.localStream = localStream;
    this.isCallActive = true;
    
    // ✅ Cria nova conexão peer
    this.peer = new RTCPeerConnection({ 
      iceServers: this.iceServers 
    });

    // ✅ Adiciona tracks do stream local
    if (localStream) {
      localStream.getTracks().forEach(track => {
        this.peer.addTrack(track, localStream);
        console.log(`✅ Track ${track.kind} local adicionada`);
      });
    }

    // ✅ Data Channel (quando o caller cria)
    this.peer.ondatachannel = (event) => {
      console.log('🔌 DataChannel remoto recebido');
      this.dataChannel = event.channel;
      this.setupDataChannelHandlers();
    };

    // ✅ Stream remoto
    this.peer.ontrack = (event) => {
      console.log('🎥 Stream remoto recebido na resposta');
      if (event.streams && event.streams[0]) {
        callback(event.streams[0]);
      }
    };

    // ✅ ICE Candidates
    this.peer.onicecandidate = (event) => {
      if (event.candidate) {
        console.log('🧊 Enviando ICE candidate de resposta para:', this.currentCaller);
        this.socket.emit('ice-candidate', {
          to: this.currentCaller,
          candidate: event.candidate
        });
      }
    };

    // ✅ Estado da conexão
    this.peer.onconnectionstatechange = () => {
      console.log('🔄 Estado da conexão (resposta):', this.peer.connectionState);
    };

    // ✅ Processa a chamada recebida
    this.peer.setRemoteDescription(new RTCSessionDescription(offer))
      .then(() => {
        console.log('✅ Offer remoto configurado - Criando answer...');
        return this.peer.createAnswer();
      })
      .then(answer => {
        console.log('📨 Answer criado - Configurando descrição local...');
        return this.peer.setLocalDescription(answer);
      })
      .then(() => {
        console.log('📤 Enviando answer para:', this.currentCaller);
        this.socket.emit('answer', {
          to: this.currentCaller,
          answer: this.peer.localDescription
        });
      })
      .catch(error => {
        console.error('❌ Erro ao processar chamada recebida:', error);
        this.isCallActive = false;
      });
  }

  /**
   * 🎥 ATUALIZA STREAM DE VÍDEO DURANTE CHAMADA ATIVA
   */
  updateVideoStream(newStream) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.peer || !['connected', 'connecting'].includes(this.peer.connectionState)) {
          const error = 'WebRTC não está conectado para atualizar stream';
          console.log('❌', error);
          reject(new Error(error));
          return;
        }

        console.log('🔄 Atualizando stream de vídeo no WebRTC Core...');
        
        this.localStream = newStream;
        const newVideoTrack = newStream.getVideoTracks()[0];
        
        if (!newVideoTrack) {
          reject(new Error('Nenhuma track de vídeo encontrada no novo stream'));
          return;
        }

        const senders = this.peer.getSenders();
        let videoSendersUpdated = 0;
        
        console.log(`🔍 Procurando senders de vídeo entre ${senders.length} senders...`);
        
        for (const sender of senders) {
          if (sender.track && sender.track.kind === 'video') {
            try {
              console.log('🔄 Atualizando sender de vídeo...');
              await sender.replaceTrack(newVideoTrack);
              videoSendersUpdated++;
              console.log(`✅ Sender de vídeo ${videoSendersUpdated} atualizado`);
            } catch (error) {
              console.error('❌ Erro ao atualizar sender:', error);
            }
          }
        }

        if (videoSendersUpdated > 0) {
          console.log(`✅ ${videoSendersUpdated} senders de vídeo atualizados com sucesso`);
          resolve(true);
        } else {
          console.log('⚠️ Nenhum sender de vídeo encontrado para atualizar');
          resolve(false);
        }
        
      } catch (error) {
        console.error('❌ Erro crítico ao atualizar stream:', error);
        reject(error);
      }
    });
  }

  /**
   * 📤 Envia mensagem via Data Channel
   */
  sendMessage(message) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
      this.dataChannel.send(message);
      console.log('📤 Mensagem enviada via DataChannel:', message);
      return true;
    } else {
      console.warn('⚠️ DataChannel não está aberto para enviar mensagem');
      return false;
    }
  }

  /**
   * 🔌 Fecha conexão WebRTC
   */
  closeConnection() {
    console.log('🔌 Fechando conexão WebRTC...');
    
    this.isCallActive = false;
    
    if (this.dataChannel) {
      this.dataChannel.close();
      this.dataChannel = null;
      console.log('✅ DataChannel fechado');
    }
    
    if (this.peer) {
      this.peer.close();
      this.peer = null;
      console.log('✅ PeerConnection fechada');
    }
    
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => {
        track.stop();
        console.log(`✅ Track ${track.kind} parada`);
      });
      this.localStream = null;
    }
    
    console.log('✅ Conexão WebRTC completamente fechada');
  }

  /**
   * 🛑 Finaliza chamada ativa
   */
  endCall(targetId = null) {
    console.log('📞 Finalizando chamada...');
    
    if (targetId) {
      this.socket.emit('endCall', { to: targetId });
    }
    
    this.closeConnection();
  }

  // ===== CALLBACK SETTERS =====
  
  setRemoteStreamCallback(callback) {
    this.remoteStreamCallback = callback;
  }

  setDataChannelCallback(callback) {
    this.onDataChannelMessage = callback;
  }

  setIncomingCallCallback(callback) {
    this.onIncomingCall = callback;
  }

  setCallEndedCallback(callback) {
    this.onCallEnded = callback;
  }

  // ===== GETTERS PARA ESTADO =====
  
  getConnectionState() {
    return this.peer ? this.peer.connectionState : 'disconnected';
  }

  isCallActive() {
    return this.isCallActive;
  }

  getCurrentCaller() {
    return this.currentCaller;
  }
}

export { WebRTCCore };
