// 🎯 VIGIA DE CÂMERA UNIVERSAL - PARA RECEIVER, CALLER E NOTIFICADOR
// 📍 Localização: core/camera-vigilante.js (NA SUA ESTRUTURA ATUAL)

class CameraVigilante {
    constructor() {
        this.estaMonitorando = false;
        this.intervaloMonitoramento = null;
        this.ultimoFrameTime = null;
        this.tentativasRecuperacao = 0;
        this.maxTentativas = 3;
        
        console.log('👁️ Vigia de Câmera inicializado');
    }

    // 🎯 INICIAR MONITORAMENTO DA CÂMERA
    iniciarMonitoramento() {
        if (this.estaMonitorando) {
            console.log('👁️ Vigia já está monitorando');
            return;
        }

        console.log('👁️ Iniciando monitoramento da câmera...');
        this.estaMonitorando = true;
        this.ultimoFrameTime = Date.now();

        // 👁️ OBSERVA MUDANÇAS NO VÍDEO
        this.observarVideo();
        
        // ⚡ VERIFICAÇÃO PERIÓDICA
        this.intervaloMonitoramento = setInterval(() => {
            this.verificarSaudeCamera();
        }, 5000); // A cada 5 segundos

        console.log('✅ Vigia de câmera ativado');
    }

    // 👁️ OBSERVAR MUDANÇAS NO ELEMENTO DE VÍDEO
    observarVideo() {
        const localVideo = document.getElementById('localVideo');
        if (!localVideo) {
            console.log('⚠️ Elemento localVideo não encontrado');
            return;
        }

        // 🎥 DETECTA QUANDO FRAMES ESTÃO SENDO ATUALIZADOS
        localVideo.addEventListener('timeupdate', () => {
            this.ultimoFrameTime = Date.now();
        });

        // 🔍 DETECTA ERROS NO VÍDEO
        localVideo.addEventListener('error', (error) => {
            console.log('❌ Erro detectado no elemento de vídeo:', error);
            this.tentarRecuperarCamera('erro_no_video');
        });

        console.log('👀 Vigia observando elemento de vídeo');
    }

    // ⚡ VERIFICAR SAÚDE DA CÂMERA
    verificarSaudeCamera() {
        if (!this.estaMonitorando) return;

        const agora = Date.now();
        const tempoSemFrames = agora - this.ultimoFrameTime;
        
        // 🚨 DETECTA CÂMERA CONGELADA (mais de 10 segundos sem frames)
        if (tempoSemFrames > 10000) {
            console.log('🚨 Câmera possivelmente congelada - sem frames há', tempoSemFrames + 'ms');
            this.tentarRecuperarCamera('congelada');
            return;
        }

        // ✅ VERIFICA SE A STREAM AINDA EXISTE E ESTÁ ATIVA
        if (window.localStream) {
            const videoTrack = window.localStream.getVideoTracks()[0];
            if (videoTrack) {
                if (videoTrack.readyState === 'ended') {
                    console.log('🚨 Track de vídeo terminou');
                    this.tentarRecuperarCamera('track_terminada');
                }
            } else {
                console.log('🚨 Nenhuma track de vídeo encontrada');
                this.tentarRecuperarCamera('sem_track');
            }
        } else {
            console.log('ℹ️ Nenhuma stream local ativa');
        }

        console.log('✅ Câmera saudável - frames atualizando normalmente');
    }

    // 🔄 TENTAR RECUPERAR CÂMERA AUTOMATICAMENTE
    async tentarRecuperarCamera(motivo) {
        if (this.tentativasRecuperacao >= this.maxTentativas) {
            console.log('❌ Máximo de tentativas de recuperação atingido');
            this.mostrarAvisoFinal();
            return;
        }

        this.tentativasRecuperacao++;
        console.log(`🔄 Tentativa ${this.tentativasRecuperacao}/${this.maxTentativas} - Motivo: ${motivo}`);

        // 📢 AVISA O USUÁRIO
        this.mostrarAvisoRecuperacao();

        try {
            // 🛑 PARA MONITORAMENTO DURANTE A RECUPERAÇÃO
            this.pararMonitoramento();

            // 🔧 TENTA RECUPERAR
            await this.executarRecuperacao();

            // ✅ REINICIA MONITORAMENTO SE RECUPEROU
            this.iniciarMonitoramento();
            this.tentativasRecuperacao = 0; // Reseta contador
            this.mostrarSucessoRecuperacao();

        } catch (error) {
            console.log('❌ Falha na recuperação:', error);
            // ⏳ AGUARDA E TENTA NOVAMENTE (SE AINDA TIVER TENTATIVAS)
            if (this.tentativasRecuperacao < this.maxTentativas) {
                setTimeout(() => {
                    this.tentarRecuperarCamera(motivo);
                }, 2000);
            }
        }
    }

    // 🔧 EXECUTAR PROCESSO DE RECUPERAÇÃO
    async executarRecuperacao() {
        console.log('🔧 Executando recuperação de câmera...');

        // 1. 🛑 PARA STREAM ATUAL
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
            window.localStream = null;
        }

        // 2. ⏳ AGUARDA LIBERAÇÃO
        await new Promise(resolve => setTimeout(resolve, 1000));

        // 3. 📹 TENTA NOVA CÂMERA (FRONTAL - MAIS CONFIÁVEL)
        try {
            const novaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'user', // ✅ Sempre frontal na recuperação
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            // 4. 🎥 ATUALIZA VÍDEO LOCAL
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = novaStream;
            }

            // 5. 🔄 ATUALIZA STREAM GLOBAL
            window.localStream = novaStream;

            // 6. 📡 ATUALIZA WEBRTC (SE CONECTADO)
            this.atualizarWebRTC(novaStream);

            console.log('✅ Câmera recuperada com sucesso!');
            return true;

        } catch (error) {
            console.log('❌ Não foi possível recuperar câmera:', error);
            throw error;
        }
    }

    // 📡 ATUALIZAR WEBRTC COM NOVA STREAM
    atualizarWebRTC(novaStream) {
        if (window.rtcCore && window.rtcCore.peer) {
            const connectionState = window.rtcCore.peer.connectionState;
            
            if (connectionState === 'connected') {
                console.log('🔄 Atualizando WebRTC com câmera recuperada...');
                
                try {
                    window.rtcCore.localStream = novaStream;
                    
                    const newVideoTrack = novaStream.getVideoTracks()[0];
                    const senders = window.rtcCore.peer.getSenders();
                    
                    let videoUpdated = false;
                    for (const sender of senders) {
                        if (sender.track && sender.track.kind === 'video') {
                            sender.replaceTrack(newVideoTrack);
                            videoUpdated = true;
                        }
                    }
                    
                    if (videoUpdated) {
                        console.log('✅ WebRTC atualizado com nova câmera');
                    }
                } catch (webrtcError) {
                    console.error('❌ Erro ao atualizar WebRTC:', webrtcError);
                }
            }
        }
    }

    // 📢 MOSTRAR AVISOS PARA O USUÁRIO
    mostrarAvisoRecuperacao() {
        // ✅ MENSAGEM NO CONSOLE - SEM MODIFICAR SUA ESTRUTURA
        console.log('🔄 Recuperando câmera...');
    }

    mostrarSucessoRecuperacao() {
        console.log('✅ Câmera recuperada!');
    }

    mostrarAvisoFinal() {
        console.log('❌ Câmera indisponível. Continuando sem vídeo.');
    }

    // 🛑 PARAR MONITORAMENTO
    pararMonitoramento() {
        if (this.intervaloMonitoramento) {
            clearInterval(this.intervaloMonitoramento);
            this.intervaloMonitoramento = null;
        }
        this.estaMonitorando = false;
        console.log('🛑 Vigia de câmera pausado');
    }

    // 🔄 REINICIAR MONITORAMENTO (APÓS TROCA DE CÂMERA)
    reiniciarMonitoramento() {
        this.pararMonitoramento();
        this.tentativasRecuperacao = 0;
        this.ultimoFrameTime = Date.now();
        this.iniciarMonitoramento();
    }

    // 🧹 LIMPAR RECURSOS
    destruir() {
        this.pararMonitoramento();
        console.log('🧹 Vigia de câmera finalizado');
    }
}

// 🌐 EXPORTAR PARA OS TRÊS ARQUIVOS USAREM
export { CameraVigilante };
