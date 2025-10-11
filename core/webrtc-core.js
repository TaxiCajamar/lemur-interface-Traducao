// 🎯 VIGIA DE CÂMERA BILATERAL - CONEXÃO É PRIORIDADE
// 📍 Localização: core/camera-vigilante.js

class CameraVigilante {
    constructor() {
        this.estaMonitorando = false;
        this.intervaloMonitoramento = null;
        this.ultimoFrameTimeLocal = null;
        this.ultimoFrameTimeRemoto = null;
        this.tentativasRecuperacaoLocal = 0;
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
            // ⚠️ APENAS LOG - NÃO TENTA RECUPERAR RECEPÇÃO
            console.log('⚠️ Problema na recepção da câmera remota - mantendo conexão');
        });

        console.log('👀 Vigia observando câmera remota');
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

        // 📡 VERIFICA CÂMERA REMOTA (APENAS DETECÇÃO)
        const tempoSemFramesRemoto = agora - this.ultimoFrameTimeRemoto;
        if (tempoSemFramesRemoto > 15000 && this.estadoCameras.remota === 'ativa') {
            console.log('🚨 Câmera REMOTA congelada - sem frames há', tempoSemFramesRemoto + 'ms');
            this.estadoCameras.remota = 'congelada';
            // ⚠️ APENAS LOG - NÃO INTERFERE NA CONEXÃO
            console.log('⚠️ Câmera remota congelada - mantendo conexão WebRTC ativa');
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

        // 📡 VERIFICA STREAM REMOTA (APENAS DETECÇÃO)
        if (window.remoteStream) {
            const videoTrackRemoto = window.remoteStream.getVideoTracks()[0];
            if (videoTrackRemoto && videoTrackRemoto.readyState === 'ended') {
                console.log('🚨 Track de vídeo REMOTA terminou');
                this.estadoCameras.remota = 'erro';
                // ⚠️ APENAS LOG - NÃO TENTA RECUPERAR
                console.log('⚠️ Stream remota terminou - mantendo conexão data channel');
            }
        }
    }

    // 🔄 TENTAR RECUPERAR CÂMERA LOCAL (APENAS SE NÃO QUEBRAR CONEXÃO)
    async tentarRecuperarCameraLocal(motivo) {
        if (this.tentativasRecuperacaoLocal >= this.maxTentativas) {
            console.log('❌ Máximo de tentativas de recuperação LOCAL atingido - continuando sem vídeo local');
            return;
        }

        this.tentativasRecuperacaoLocal++;
        console.log(`🔄 Tentativa LOCAL ${this.tentativasRecuperacaoLocal}/${this.maxTentativas} - Motivo: ${motivo}`);

        try {
            // ⏸️ PAUSA MONITORAMENTO DURANTE RECUPERAÇÃO
            this.pararMonitoramentoTemporario();

            await this.executarRecuperacaoLocal();

            // 🔄 REINICIA MONITORAMENTO
            this.iniciarMonitoramento();
            this.tentativasRecuperacaoLocal = 0;
            console.log(`✅ Câmera LOCAL recuperada!`);

        } catch (error) {
            console.log('❌ Falha na recuperação LOCAL:', error);
            console.log('🟡 Continuando sem câmera local - conexão WebRTC mantida');
            
            // 🔄 REINICIA MESMO COM FALHA (PARA MONITORAR NOVAMENTE)
            this.iniciarMonitoramento();
            
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

        // 🛑 PARA STREAM ATUAL (SE EXISTIR)
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
            window.localStream = null;
        }

        // ⏳ AGUARDA LIBERAÇÃO
        await new Promise(resolve => setTimeout(resolve, 1000));

        try {
            // 📹 TENTA NOVA CÂMERA
            const novaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'user',
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            // 🎥 ATUALIZA VÍDEO LOCAL
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = novaStream;
            }

            // 🔄 ATUALIZA STREAM GLOBAL
            window.localStream = novaStream;

            // 📡 ATUALIZA WEBRTC (SE CONECTADO) - MAS NÃO CRITICO
            if (window.rtcCore && window.rtcCore.peer) {
                const connectionState = window.rtcCore.peer.connectionState;
                
                if (connectionState === 'connected') {
                    console.log('🔄 Tentando atualizar WebRTC com nova câmera...');
                    try {
                        await window.rtcCore.updateVideoStream(novaStream);
                        console.log('✅ WebRTC atualizado com nova câmera');
                    } catch (webrtcError) {
                        console.log('⚠️ Falha ao atualizar WebRTC, mas conexão mantida:', webrtcError);
                        // ⚠️ NÃO LANÇA ERRO - CONEXÃO CONTINUA
                    }
                }
            }

            console.log('✅ Câmera LOCAL recuperada com sucesso!');
            this.estadoCameras.local = 'ativa';
            return true;

        } catch (error) {
            console.log('❌ Não foi possível recuperar câmera LOCAL:', error);
            this.estadoCameras.local = 'erro';
            throw error;
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

// 🌐 EXPORTAR PARA OS TRÊNS ARQUIVOS USAREM
export { CameraVigilante };
