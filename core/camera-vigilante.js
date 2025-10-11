// 🎯 VIGIA DE CÂMERA INTELIGENTE - ENTENDE RELAÇÃO LOCAL/REMOTO
class CameraVigilante {
    constructor() {
        this.estaMonitorando = false;
        this.intervaloMonitoramento = null;
        this.ultimoFrameLocal = null;
        this.ultimoFrameRemoto = null;
        this.tentativasRecuperacao = 0;
        this.maxTentativas = 3;
        this.meuId = this.obterMeuId();
        
        console.log('👁️ Vigia INTELIGENTE inicializado - ID:', this.meuId);
    }

    // 🔍 OBTER IDENTIFICAÇÃO DO DISPOSITIVO
    obterMeuId() {
        // Tenta obter da URL ou gera um ID único
        const params = new URLSearchParams(window.location.search);
        return params.toString().split('&')[0] || 'device-' + Math.random().toString(36).substr(2, 9);
    }

    // 🎯 INICIAR MONITORAMENTO INTELIGENTE
    iniciarMonitoramento() {
        if (this.estaMonitorando) return;

        console.log('👁️ Iniciando monitoramento INTELIGENTE...');
        this.estaMonitorando = true;
        this.ultimoFrameLocal = Date.now();
        this.ultimoFrameRemoto = Date.now();

        this.observarVideoLocal();
        this.observarVideoRemoto();
        
        this.intervaloMonitoramento = setInterval(() => {
            this.verificarSaudeInteligente();
        }, 5000);

        console.log('✅ Vigia INTELIGENTE ativado');
    }

    // 👁️ OBSERVAR VÍDEO LOCAL
    observarVideoLocal() {
        const localVideo = document.getElementById('localVideo');
        if (!localVideo) return;

        localVideo.addEventListener('timeupdate', () => {
            this.ultimoFrameLocal = Date.now();
        });

        localVideo.addEventListener('error', (error) => {
            console.log('❌ Erro no VÍDEO LOCAL (MINHA câmera):', error);
            this.analisarProblema('local_error', error);
        });

        console.log('👀 Vigia observando MINHA câmera local');
    }

    // 👁️ OBSERVAR VÍDEO REMOTO
    observarVideoRemoto() {
        const remoteVideo = document.getElementById('remoteVideo');
        if (!remoteVideo) return;

        remoteVideo.addEventListener('timeupdate', () => {
            this.ultimoFrameRemoto = Date.now();
        });

        remoteVideo.addEventListener('error', (error) => {
            console.log('❌ Erro no VÍDEO REMOTO (CÂMERA DO OUTRO):', error);
            this.analisarProblema('remoto_error', error);
        });

        console.log('👀 Vigia observando CÂMERA DO OUTRO usuário');
    }

    // 🧠 ANÁLISE INTELIGENTE DO PROBLEMA
    analisarProblema(tipo, error) {
        console.log(`🔍 Analisando problema: ${tipo}`);
        
        switch(tipo) {
            case 'local_error':
                // ❌ PROBLEMA NA MINHA CÂMERA - EU RESOLVO
                console.log('🚨 MINHA câmera com problema - recuperando...');
                this.tentarRecuperarMinhaCamera();
                break;
                
            case 'remoto_error':
                // ❌ PROBLEMA NA CÂMERA DO OUTRO - NOTIFICO ELE
                console.log('🚨 CÂMERA DO OUTRO com problema - notificando...');
                this.notificarOutroUsuario('sua_camera_com_problema');
                break;
        }
    }

    // ⚡ VERIFICAÇÃO INTELIGENTE DA SAÚDE
    verificarSaudeInteligente() {
        if (!this.estaMonitorando) return;

        const agora = Date.now();
        const tempoSemFramesLocal = agora - this.ultimoFrameLocal;
        const tempoSemFramesRemoto = agora - this.ultimoFrameRemoto;
        
        // 🚨 MINHA CÂMERA TRAVOU
        if (tempoSemFramesLocal > 10000) {
            console.log('🚨 MINHA câmera travou - recuperando...');
            this.tentarRecuperarMinhaCamera();
            return;
        }

        // 🚨 CÂMERA DO OUTRO TRAVOU
        if (tempoSemFramesRemoto > 15000) {
            console.log('🚨 CÂMERA DO OUTRO travou - notificando...');
            this.notificarOutroUsuario('sua_camera_travou');
            return;
        }

        console.log('✅ Ambas câmeras OK - Minha:', tempoSemFramesLocal + 'ms', 'Outro:', tempoSemFramesRemoto + 'ms');
    }

    // 🔧 RECUPERAR MINHA CÂMERA (EU MESMO RESOLVO)
    async tentarRecuperarMinhaCamera() {
        if (this.tentativasRecuperacao >= this.maxTentativas) {
            console.log('❌ Máximo de tentativas para MINHA câmera');
            this.notificarOutroUsuario('minha_camera_indisponivel');
            return;
        }

        this.tentativasRecuperacao++;
        console.log(`🔄 Tentativa ${this.tentativasRecuperacao} para MINHA câmera`);

        try {
            // 🛑 PARA MINHA STREAM
            if (window.localStream) {
                window.localStream.getTracks().forEach(track => track.stop());
                window.localStream = null;
            }

            await new Promise(resolve => setTimeout(resolve, 1000));

            // 📹 RECUPERA MINHA CÂMERA
            const novaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            // 🎥 ATUALIZA MEU VÍDEO LOCAL
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = novaStream;
            }

            // 🔄 ATUALIZA MINHA STREAM
            window.localStream = novaStream;

            // 📡 ATUALIZA WEBRTC (PARA O OUTRO USUÁRIO ME VER)
            this.atualizarWebRTC(novaStream);

            // ✅ NOTIFICA SUCESSO
            this.ultimoFrameLocal = Date.now();
            this.tentativasRecuperacao = 0;
            
            console.log('✅ MINHA câmera recuperada!');
            this.notificarOutroUsuario('minha_camera_recuperada');

        } catch (error) {
            console.log('❌ Falha ao recuperar MINHA câmera:', error);
            this.notificarOutroUsuario('minha_camera_falhou');
        }
    }

    // 📡 NOTIFICAR OUTRO USUÁRIO SOBRE STATUS DA CÂMERA
    notificarOutroUsuario(mensagem) {
        if (window.rtcCore && window.rtcCore.dataChannel) {
            try {
                const notificacao = {
                    type: 'camera_status',
                    message: mensagem,
                    from: this.meuId,
                    timestamp: Date.now()
                };
                
                window.rtcCore.dataChannel.send(JSON.stringify(notificacao));
                console.log('📢 Notificando outro usuário:', mensagem);
                
            } catch (error) {
                console.log('❌ Não foi possível notificar outro usuário:', error);
            }
        }
    }

    // 🎯 CONFIGURAR RECEBIMENTO DE NOTIFICAÇÕES
    configurarReceptorNotificacoes() {
        if (window.rtcCore && window.rtcCore.dataChannel) {
            window.rtcCore.dataChannel.onmessage = (event) => {
                try {
                    const data = JSON.parse(event.data);
                    if (data.type === 'camera_status') {
                        this.processarNotificacaoCamera(data);
                    }
                } catch (error) {
                    // Não é JSON, ignora
                }
            };
        }
    }

    // 📨 PROCESSAR NOTIFICAÇÕES DO OUTRO USUÁRIO
    processarNotificacaoCamera(data) {
        console.log('📨 Notificação do outro usuário:', data.message);
        
        switch(data.message) {
            case 'sua_camera_com_problema':
                console.log('⚠️ O OUTRO usuário diz que MINHA câmera tem problema');
                // Pode tentar recuperação automática ou mostrar aviso
                break;
                
            case 'sua_camera_travou':
                console.log('⚠️ O OUTRO usuário diz que MINHA câmera travou');
                this.tentarRecuperarMinhaCamera();
                break;
                
            case 'minha_camera_recuperada':
                console.log('✅ O OUTRO usuário recuperou a câmera DELE');
                break;
                
            case 'minha_camera_indisponivel':
                console.log('❌ O OUTRO usuário não conseguiu recuperar a câmera');
                break;
        }
    }

    // 📡 ATUALIZAR WEBRTC (MESMA LÓGICA)
    atualizarWebRTC(novaStream) {
        if (window.rtcCore && window.rtcCore.peer && window.rtcCore.peer.connectionState === 'connected') {
            try {
                window.rtcCore.localStream = novaStream;
                const newVideoTrack = novaStream.getVideoTracks()[0];
                const senders = window.rtcCore.peer.getSenders();
                
                for (const sender of senders) {
                    if (sender.track && sender.track.kind === 'video') {
                        sender.replaceTrack(newVideoTrack);
                        console.log('✅ WebRTC atualizado - outro usuário verá minha nova câmera');
                        break;
                    }
                }
            } catch (error) {
                console.error('❌ Erro ao atualizar WebRTC:', error);
            }
        }
    }

    // 🎯 INICIAR VIGILÂNCIA COMPLETA
    iniciarVigilanciaCompleta() {
        this.iniciarMonitoramento();
        this.configurarReceptorNotificacoes();
        console.log('🛡️ Vigilância completa ativada - monitoramento + notificações');
    }

    // 🛑 PARAR MONITORAMENTO
    pararMonitoramento() {
        if (this.intervaloMonitoramento) {
            clearInterval(this.intervaloMonitoramento);
        }
        this.estaMonitorando = false;
        console.log('🛑 Vigia INTELIGENTE pausado');
    }

    destruir() {
        this.pararMonitoramento();
        console.log('🧹 Vigia INTELIGENTE finalizado');
    }
}

export { CameraVigilante };
