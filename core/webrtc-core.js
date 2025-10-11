// core/webrtc-core.js
import { getIceServers, SIGNALING_SERVER_URL } from './internet-config.js';

class WebRTCCore {
  constructor(socketUrl = SIGNALING_SERVER_URL) {
    this.socket = io(socketUrl);
    this.peer = null;
    this.localStream = null;
    this.remoteStreamCallback = null;
    this.currentCaller = null;
    this.dataChannel = null;
    this.onDataChannelMessage = null;

    // ✅✅✅ MANTIDO EXATAMENTE COMO ESTAVA
    window.rtcDataChannel = {
        send: (message) => {
            if (this.dataChannel && this.dataChannel.readyState === 'open') {
                this.dataChannel.send(message);
            }
        },
        isOpen: () => {
            return this.dataChannel && this.dataChannel.readyState === 'open';
        }
    };

    this.iceServers = getIceServers();
  }

  // ✅✅✅ MÉTODOS ORIGINAIS - NENHUMA ALTERAÇÃO
  setupDataChannelHandlers() {
    if (!this.dataChannel) return;
    
    this.dataChannel.onopen = () => {
        console.log('DataChannel connected');
    };

    this.dataChannel.onmessage = (event) => {
        console.log('Message received:', event.data);
        if (this.onDataChannelMessage) {
            this.onDataChannelMessage(event.data);
        }
    };

    this.dataChannel.onerror = (error) => {
        console.error('DataChannel error:', error);
    };
  }

  initialize(userId) {
    this.socket.emit('register', userId);
  }

  startCall(targetId, stream, callerLang) {
    this.localStream = stream;
    this.peer = new RTCPeerConnection({ iceServers: this.iceServers });

    this.dataChannel = this.peer.createDataChannel('chat');
    this.setupDataChannelHandlers();

    stream.getTracks().forEach(track => {
        this.peer.addTrack(track, stream);
    });

    this.peer.ontrack = event => {
        if (this.remoteStreamCallback) {
            this.remoteStreamCallback(event.streams[0]);
        }
    };

    this.peer.onicecandidate = event => {
        if (event.candidate) {
            this.socket.emit('ice-candidate', {
                to: targetId,
                candidate: event.candidate
            });
        }
    };

    this.peer.createOffer()
        .then(offer => this.peer.setLocalDescription(offer))
        .then(() => {
            this.socket.emit('call', {
                to: targetId,
                offer: this.peer.localDescription,
                callerLang
            });
        });
  }

  handleIncomingCall(offer, localStream, callback) {
    this.peer = new RTCPeerConnection({ iceServers: this.iceServers });

    if (localStream) {
        localStream.getTracks().forEach(track => {
            this.peer.addTrack(track, localStream);
        });
    }

    this.peer.ondatachannel = (event) => {
        this.dataChannel = event.channel;
        this.setupDataChannelHandlers();
    };

    this.peer.ontrack = event => callback(event.streams[0]);

    this.peer.onicecandidate = event => {
        if (event.candidate) {
            this.socket.emit('ice-candidate', {
                to: this.currentCaller,
                candidate: event.candidate
            });
        }
    };

    this.peer.setRemoteDescription(new RTCSessionDescription(offer))
        .then(() => this.peer.createAnswer())
        .then(answer => this.peer.setLocalDescription(answer))
        .then(() => {
            this.socket.emit('answer', {
                to: this.currentCaller,
                answer: this.peer.localDescription
            });
        });
  }

  setupSocketHandlers() {
    this.socket.on('acceptAnswer', data => {
        if (this.peer) {
            this.peer.setRemoteDescription(new RTCSessionDescription(data.answer));
        }
    });

    this.socket.on('ice-candidate', candidate => {
        if (this.peer) {
            this.peer.addIceCandidate(new RTCIceCandidate(candidate));
        }
    });

    this.socket.on('incomingCall', data => {
        this.currentCaller = data.from;
        if (this.onIncomingCall) {
            this.onIncomingCall(data.offer, data.callerLang);
        }
    });
  }

  setRemoteStreamCallback(callback) {
    this.remoteStreamCallback = callback;
  }

  setDataChannelCallback(callback) {
    this.onDataChannelMessage = callback;
  }

  sendMessage(message) {
    if (this.dataChannel && this.dataChannel.readyState === 'open') {
        this.dataChannel.send(message);
    }
  }

  /**
   * 🎥 ATUALIZA STREAM DE VÍDEO DURANTA CHAMADA ATIVA
   * Método seguro para alternar câmeras sem quebrar WebRTC
   */
  updateVideoStream(newStream) {
    return new Promise(async (resolve, reject) => {
      try {
        if (!this.peer || this.peer.connectionState !== 'connected') {
          console.log('❌ WebRTC não está conectado para atualizar stream');
          reject(new Error('WebRTC não conectado'));
          return;
        }

        console.log('🔄 Atualizando stream de vídeo no WebRTC Core...');
        
        // Atualiza o stream local
        this.localStream = newStream;
        
        // Obtém a nova track de vídeo
        const newVideoTrack = newStream.getVideoTracks()[0];
        
        if (!newVideoTrack) {
          reject(new Error('Nenhuma track de vídeo encontrada'));
          return;
        }

        // Encontra e atualiza TODOS os senders de vídeo
        const senders = this.peer.getSenders();
        let videoSendersUpdated = 0;
        
        for (const sender of senders) {
          if (sender.track && sender.track.kind === 'video') {
            try {
              await sender.replaceTrack(newVideoTrack);
              videoSendersUpdated++;
              console.log(`✅ Sender de vídeo ${videoSendersUpdated} atualizado`);
            } catch (error) {
              console.error('❌ Erro ao atualizar sender:', error);
            }
          }
        }

        if (videoSendersUpdated > 0) {
          console.log(`✅ ${videoSendersUpdated} senders de vídeo atualizados com sucesso');
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

  // 🆕 🆕 🆕 NOVO MÉTODO ADICIONADO - COMPLETAMENTE SEGURO 🆕 🆕 🆕
  /**
   * 🎥 ATUALIZAÇÃO SEGURA DE CÂMERA - MÉTODO OTIMIZADO
   * Versão melhorada para troca de câmeras sem problemas
   * NÃO INTERFERE EM NENHUM MÉTODO EXISTENTE
   */
  async updateCameraStream(newStream) {
    try {
      console.log('🔄 Iniciando atualização segura de câmera...');
      
      // ✅ VERIFICA CONEXÃO WEBRTC
      if (!this.peer || this.peer.connectionState !== 'connected') {
        console.log('📞 WebRTC não conectado - apenas atualizando stream local');
        this.localStream = newStream;
        return false;
      }

      // ✅ CAPTURA A TRACK ANTES DE QUALQUER ALTERAÇÃO
      const newVideoTrack = newStream.getVideoTracks()[0];
      if (!newVideoTrack) {
        throw new Error('Nenhuma track de vídeo na nova stream');
      }

      // ✅ VERIFICA SE A TRACK ESTÁ PRONTA
      if (newVideoTrack.readyState !== 'live') {
        console.log('⏳ Aguardando track ficar pronta...');
        await new Promise((resolve) => {
          newVideoTrack.onstart = resolve;
          setTimeout(resolve, 500);
        });
      }

      // ✅ ATUALIZA SENDERS PRIMEIRO (CRÍTICO)
      const senders = this.peer.getSenders();
      let videoUpdated = false;
      
      for (const sender of senders) {
        if (sender.track && sender.track.kind === 'video') {
          console.log('🔄 Atualizando sender de vídeo no WebRTC...');
          await sender.replaceTrack(newVideoTrack);
          videoUpdated = true;
          console.log('✅ Sender de vídeo atualizado com sucesso');
          break; // ✅ Apenas um sender precisa ser atualizado
        }
      }

      // ✅ ATUALIZA LOCAL STREAM APÓS SUCESSO NO WEBRTC
      if (videoUpdated) {
        // 🛑 PARA STREAM ANTIGA APÓS SUCESSO (SE FOR DIFERENTE)
        if (this.localStream && this.localStream !== newStream) {
          this.localStream.getTracks().forEach(track => {
            if (track !== newVideoTrack) track.stop();
          });
        }
        
        this.localStream = newStream;
        console.log('✅✅✅ Câmera atualizada com SUCESSO no WebRTC');
        return true;
      } else {
        console.log('⚠️ Nenhum sender atualizado, mantendo stream local apenas');
        this.localStream = newStream;
        return false;
      }

    } catch (error) {
      console.error('❌ Erro na atualização de câmera:', error);
      // ✅ FALLBACK: Mantém nova stream local mesmo com erro WebRTC
      this.localStream = newStream;
      return false;
    }
  }
  // 🆕 🆕 🆕 FIM DO NOVO MÉTODO 🆕 🆕 🆕

}

export { WebRTCCore };
