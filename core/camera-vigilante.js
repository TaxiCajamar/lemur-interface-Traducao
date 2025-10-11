// 🎯 VIGIA DE CÂMERA BILATERAL - PARA RECEIVER, CALLER E NOTIFICADOR
// 📍 Localização: core/camera-vigilante.js

class CameraVigilante {
    constructor() {
        this.estaMonitorando = false;
        this.intervaloMonitoramento = null;
        this.ultimoFrameTimeLocal = null;
        this.ultimoFrameTimeRemoto = null;
        this.tentativasRecuperacaoLocal = 0;
        this.tentativasRecuperacaoRemoto = 0;
        this.maxTentativas = 3;
        
        // 🔍 ESTADO DAS CÂMERAS
        this.estadoCameras = {
            local: 'ativa', // 'ativa', 'congelada', 'erro', 'inativa'
            remota: 'ativa'
        };
        
        console.log('👁️ Vigia de Câmera Bilateral inicializado');
    }

    // 🎯 INICIAR MONITORAMENTO BILATERAL
    iniciarMonitoramento() {
        if (this.estaMonitorando) {
            console.log('👁️ Vigia já está monitorando');
            return;
        }

        console.log('👁️ Iniciando monitoramento bilateral das câmeras...');
        this.estaMonitorando = true;
        this.ultimoFrameTimeLocal = Date.now();
        this.ultimoFrameTimeRemoto = Date.now();

        // 👁️ OBSERVA AMBAS AS CÂMERAS
        this.observarCameraLocal();
        this.observarCameraRemota();
        
        // ⚡ VERIFICAÇÃO PERIÓDICA BILATERAL
        this.intervaloMonitoramento = setInterval(() => {
            this.verificarSaudeCameras();
        }, 5000);

        console.log('✅ Vigia bilateral ativado');
    }

    // 👁️ OBSERVAR CÂMERA LOCAL
    observarCameraLocal() {
        const localVideo = document.getElementById('localVideo');
        if (!localVideo) {
            console.log('⚠️ Elemento localVideo não encontrado');
            this.estadoCameras.local = 'inativa';
            return;
        }

        localVideo.addEventListener('timeupdate', () => {
            this.ultimoFrameTimeLocal = Date.now();
            this.estadoCameras.local = 'ativa';
        });

        localVideo.addEventListener('error', (error) => {
            console.log('❌ Erro na câmera local:', error);
            this.estadoCameras.local = 'erro';
            this.tentarRecuperarCameraLocal('erro_no_video');
        });

        console.log('👀 Vigia observando câmera local');
    }

    // 👁️ OBSERVAR CÂMERA REMOTA
    observarCameraRemota() {
        const remoteVideo = document.getElementById('remoteVideo');
        if (!remoteVideo) {
            console.log('⚠️ Elemento remoteVideo não encontrado');
            this.estadoCameras.remota = 'inativa';
            return;
        }

        remoteVideo.addEventListener('timeupdate', () => {
            this.ultimoFrameTimeRemoto = Date.now();
            this.estadoCameras.remota = 'ativa';
        });

        remoteVideo.addEventListener('error', (error) => {
            console.log('❌ Erro na câmera remota:', error);
            this.estadoCameras.remota = 'erro';
            this.notificarProblemaRemoto('erro_remoto');
        });

        // 🔍 DETECTA SE O VÍDEO REMOTO ESTÁ VISÍVEL
        this.observarVisibilidadeRemota();

        console.log('👀 Vigia observando câmera remota');
    }

    // 🔍 OBSERVAR VISIBILIDADE DA CÂMERA REMOTA
    observarVisibilidadeRemota() {
        const remoteVideo = document.getElementById('remoteVideo');
        if (!remoteVideo) return;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (!entry.isIntersecting) {
                    console.log('⚠️ Câmera remota não está visível na tela');
                    this.notificarProblemaRemoto('nao_visivel');
                }
            });
        }, { threshold: 0.1 });

        observer.observe(remoteVideo);
    }

    // ⚡ VERIFICAR SAÚDE DE AMBAS AS CÂMERAS
    verificarSaudeCameras() {
        if (!this.estaMonitorando) return;

        const agora = Date.now();
        
        // 🎥 VERIFICA CÂMERA LOCAL
        const tempoSemFramesLocal = agora - this.ultimoFrameTimeLocal;
        if (tempoSemFramesLocal > 10000 && this.estadoCameras.local === 'ativa') {
            console.log('🚨 Câmera LOCAL congelada - sem frames há', tempoSemFramesLocal + 'ms');
            this.estadoCameras.local = 'congelada';
            this.tentarRecuperarCameraLocal('congelada');
        }

        // 📡 VERIFICA CÂMERA REMOTA
        const tempoSemFramesRemoto = agora - this.ultimoFrameTimeRemoto;
        if (tempoSemFramesRemoto > 15000 && this.estadoCameras.remota === 'ativa') {
            console.log('🚨 Câmera REMOTA congelada - sem frames há', tempoSemFramesRemoto + 'ms');
            this.estadoCameras.remota = 'congelada';
            this.notificarProblemaRemoto('congelada_remota');
        }

        // ✅ VERIFICA STREAMS ATIVAS
        this.verificarStreamsAtivas();

        console.log(`📊 Status: Local=${this.estadoCameras.local}, Remota=${this.estadoCameras.remota}`);
    }

    // 🔄 VERIFICAR STREAMS ATIVAS
    verificarStreamsAtivas() {
        // 🎥 VERIFICA STREAM LOCAL
        if (window.localStream) {
            const videoTrackLocal = window.localStream.getVideoTracks()[0];
            if (videoTrackLocal) {
                if (videoTrackLocal.readyState === 'ended') {
                    console.log('🚨 Track de vídeo LOCAL terminou');
                    this.estadoCameras.local = 'erro';
                    this.tentarRecuperarCameraLocal('track_terminada');
                }
            } else {
                console.log('🚨 Nenhuma track de vídeo LOCAL encontrada');
                this.estadoCameras.local = 'inativa';
            }
        }

        // 📡 VERIFICA STREAM REMOTA (se disponível)
        if (window.remoteStream) {
            const videoTrackRemoto = window.remoteStream.getVideoTracks()[0];
            if (videoTrackRemoto && videoTrackRemoto.readyState === 'ended') {
                console.log('🚨 Track de vídeo REMOTA terminou');
                this.estadoCameras.remota = 'erro';
                this.notificarProblemaRemoto('track_remota_terminada');
            }
        }
    }

    // 🔄 TENTAR RECUPERAR CÂMERA LOCAL
    async tentarRecuperarCameraLocal(motivo) {
        if (this.tentativasRecuperacaoLocal >= this.maxTentativas) {
            console.log('❌ Máximo de tentativas de recuperação LOCAL atingido');
            this.mostrarAvisoFinal('local');
            return;
        }

        this.tentativasRecuperacaoLocal++;
        console.log(`🔄 Tentativa LOCAL ${this.tentativasRecuperacaoLocal}/${this.maxTentativas} - Motivo: ${motivo}`);

        this.mostrarAvisoRecuperacao('local');

        try {
            this.pararMonitoramentoTemporario();

            await this.executarRecuperacaoLocal();

            this.iniciarMonitoramento();
            this.tentativasRecuperacaoLocal = 0;
            this.mostrarSucessoRecuperacao('local');

        } catch (error) {
            console.log('❌ Falha na recuperação LOCAL:', error);
            if (this.tentativasRecuperacaoLocal < this.maxTentativas) {
                setTimeout(() => {
                    this.tentarRecuperarCameraLocal(motivo);
                }, 2000);
            }
        }
    }

    // 🔧 EXECUTAR RECUPERAÇÃO DA CÂMERA LOCAL
    async executarRecuperacaoLocal() {
        console.log('🔧 Executando recuperação da câmera LOCAL...');

        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
            window.localStream = null;
        }

        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            const novaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = novaStream;
            }

            window.localStream = novaStream;
            this.atualizarWebRTC(novaStream);

            console.log('✅ Câmera LOCAL recuperada com sucesso!');
            this.estadoCameras.local = 'ativa';
            return true;

        } catch (error) {
            console.log('❌ Não foi possível recuperar câmera LOCAL:', error);
            this.estadoCameras.local = 'erro';
            throw error;
        }
    }

    // 📢 NOTIFICAR PROBLEMA NA CÂMERA REMOTA
    notificarProblemaRemoto(motivo) {
        console.log(`🚨 Problema na câmera REMOTA: ${motivo}`);
        
        // 📱 MOSTRA INDICADOR VISUAL PARA O USUÁRIO
        this.mostrarIndicadorProblemaRemoto();
        
        // 🔄 TENTA REESTABELECER CONEXÃO (se aplicável)
        if (motivo.includes('congelada') || motivo.includes('erro')) {
            this.tentarReconexaoRemota();
        }
    }

    // 📱 MOSTRAR INDICADOR DE PROBLEMA REMOTO
    mostrarIndicadorProblemaRemoto() {
        const videoWrapper = document.querySelector('.video-wrapper');
        if (videoWrapper) {
            // 🎨 ADICIONA BORDA VERMELHA PARA INDICAR PROBLEMA
            videoWrapper.style.border = '0.3vw solid #ff4444';
            videoWrapper.style.animation = 'pulse-alert 2s infinite';
            
            // 🔄 RESTAURA QUANDO A CÂMERA VOLTAR
            setTimeout(() => {
                if (this.estadoCameras.remota === 'ativa') {
                    videoWrapper.style.border = '0.3vw solid #4CAF50';
                    videoWrapper.style.animation = 'none';
                }
            }, 5000);
        }
    }

    // 🔄 TENTAR RECONEXÃO REMOTA
    tentarReconexaoRemota() {
        if (window.rtcCore && typeof window.rtcCore.tentarReconexao === 'function') {
            console.log('🔄 Tentando reconexão remota...');
            window.rtcCore.tentarReconexao();
        }
    }

    // 📡 ATUALIZAR WEBRTC COM NOVA STREAM
    atualizarWebRTC(novaStream) {
        if (window.rtcCore && window.rtcCore.peer) {
            const connectionState = window.rtcCore.peer.connectionState;
            
            if (connectionState === 'connected') {
                console.log('🔄 Atualizando WebRTC com câmera LOCAL recuperada...');
                
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
                        console.log('✅ WebRTC atualizado com nova câmera LOCAL');
                    }
                } catch (webrtcError) {
                    console.error('❌ Erro ao atualizar WebRTC:', webrtcError);
                }
            }
        }
    }

    // 📊 OBTER STATUS DAS CÂMERAS
    obterStatusCameras() {
        return {
            local: this.estadoCameras.local,
            remota: this.estadoCameras.remota,
            timestamp: Date.now()
        };
    }

    // 🛑 PARAR MONITORAMENTO TEMPORÁRIO
    pararMonitoramentoTemporario() {
        if (this.intervaloMonitoramento) {
            clearInterval(this.intervaloMonitoramento);
            this.intervaloMonitoramento = null;
        }
        this.estaMonitorando = false;
    }

    // 📢 MOSTRAR AVISOS
    mostrarAvisoRecuperacao(tipo) {
        console.log(`🔄 Recuperando câmera ${tipo.toUpperCase()}...`);
    }

    mostrarSucessoRecuperacao(tipo) {
        console.log(`✅ Câmera ${tipo.toUpperCase()} recuperada!`);
    }

    mostrarAvisoFinal(tipo) {
        console.log(`❌ Câmera ${tipo.toUpperCase()} indisponível.`);
    }

    // 🛑 PARAR MONITORAMENTO COMPLETO
    pararMonitoramento() {
        if (this.intervaloMonitoramento) {
            clearInterval(this.intervaloMonitoramento);
            this.intervaloMonitoramento = null;
        }
        this.estaMonitorando = false;
        console.log('🛑 Vigia bilateral pausado');
    }

    // 🔄 REINICIAR MONITORAMENTO
    reiniciarMonitoramento() {
        this.pararMonitoramento();
        this.tentativasRecuperacaoLocal = 0;
        this.tentativasRecuperacaoRemoto = 0;
        this.ultimoFrameTimeLocal = Date.now();
        this.ultimoFrameTimeRemoto = Date.now();
        this.estadoCameras.local = 'ativa';
        this.estadoCameras.remota = 'ativa';
        this.iniciarMonitoramento();
    }

    // 🧹 LIMPAR RECURSOS
    destruir() {
        this.pararMonitoramento();
        console.log('🧹 Vigia bilateral finalizado');
    }
}

// 🌐 EXPORTAR PARA OS TRÊS ARQUIVOS USAREM
export { CameraVigilante };
