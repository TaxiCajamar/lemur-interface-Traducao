// core/camera-vigilante.js - VIGILANTE HÍBRIDO
class CameraVigilante {
    constructor() {
        this.estaMonitorando = false;
        this.intervaloMonitoramento = null;
        this.ultimoFrameTime = null;
        this.tentativasRecuperacao = 0;
        this.maxTentativas = 3;
        
        // ✅ NÃO controla câmera - apenas monitora
        this.cameraAtual = null; 
        
        console.log('👁️ Vigia HÍBRIDO - Amiguinho do botão');
    }

    // ✅ INICIA APENAS MONITORAMENTO - NÃO MEXE NO BOTÃO
    iniciarMonitoramento() {
        if (this.estaMonitorando) {
            console.log('👁️ Vigia já está monitorando');
            return;
        }

        console.log('👁️ Vigia HÍBRIDO: Monitorando ambas câmeras...');
        this.estaMonitorando = true;
        this.ultimoFrameTime = Date.now();

        // 👁️ OBSERVA QUALQUER CÂMERA QUE ESTEJA ATIVA
        this.observarVideo();
        
        // ⚡ VERIFICAÇÃO PROATIVA
        this.intervaloMonitoramento = setInterval(() => {
            this.verificarSaudeCamera();
        }, 8000);

        console.log('✅ Vigia HÍBRIDO ativo - respeitando seu botão');
    }

    // 👁️ OBSERVA A CÂMERA ATUAL (SEJA QUAL FOR)
    observarVideo() {
        const videoElement = this.encontrarVideoAtivo();
        if (!videoElement) {
            console.log('⚠️ Aguardando câmera ficar ativa...');
            return;
        }

        // 🎥 DETECTA FRAMES (qualquer câmera)
        videoElement.addEventListener('timeupdate', () => {
            this.ultimoFrameTime = Date.now();
        });

        console.log('👀 Vigia observando câmera ativa');
    }

    // ✅ ENCONTRA QUALQUER VÍDEO ATIVO (frontal OU traseira)
    encontrarVideoAtivo() {
        // Tenta primeiro o vídeo principal
        let videoElement = document.getElementById('cameraPreview');
        if (videoElement && videoElement.srcObject) {
            return videoElement;
        }
        
        // Tenta o vídeo PIP
        videoElement = document.getElementById('localVideo');
        if (videoElement && videoElement.srcObject) {
            return videoElement;
        }
        
        // Tenta qualquer vídeo na página
        const videos = document.getElementsByTagName('video');
        for (let video of videos) {
            if (video.srcObject) {
                return video;
            }
        }
        
        return null;
    }

    // ⚡ VERIFICA SAÚDE (qualquer câmera ativa)
    verificarSaudeCamera() {
        if (!this.estaMonitorando) return;

        const agora = Date.now();
        const tempoSemFrames = agora - this.ultimoFrameTime;
        
        // 🚨 DETECTA CÂMERA CONGELADA (>15s)
        if (tempoSemFrames > 15000) {
            console.log('🚨 Vigia HÍBRIDO: Câmera congelada - CONSERTANDO!');
            this.tentarRecuperacaoProativa();
            return;
        }

        console.log('✅ Vigia: Câmera saudável');
    }

    // 🔄 TENTA RECUPERAR (qualquer câmera)
    async tentarRecuperacaoProativa() {
        if (this.tentativasRecuperacao >= this.maxTentativas) {
            console.log('❌ Máximo de tentativas do vigia');
            return;
        }

        this.tentativasRecuperacao++;
        console.log(`🔄 Vigia HÍBRIDO: Tentativa ${this.tentativasRecuperacao}/${this.maxTentativas}`);

        try {
            this.pararMonitoramento();
            await this.recuperacaoInteligente();

            // ✅ REINICIA MONITORAMENTO
            setTimeout(() => {
                this.iniciarMonitoramento();
                this.tentativasRecuperacao = 0;
                console.log('✅ Vigia: Recuperação concluída');
            }, 1000);

        } catch (error) {
            console.log('❌ Vigia: Falha na recuperação');
        }
    }

    // 🔧 RECUPERAÇÃO INTELIGENTE - NÃO ALTERA CÂMERA ATUAL
    async recuperacaoInteligente() {
        console.log('🔧 Vigia HÍBRIDO: Recuperação inteligente...');

        const videoElement = this.encontrarVideoAtivo();
        if (!videoElement || !videoElement.srcObject) {
            console.log('ℹ️ Nenhuma câmera ativa para recuperar');
            return;
        }

        // 1. 🛑 PARA STREAM ATUAL
        const streamOriginal = videoElement.srcObject;
        streamOriginal.getTracks().forEach(track => track.stop());

        // 2. ⏳ AGUARDA
        await new Promise(resolve => setTimeout(resolve, 800));

        // 3. 📹 TENTA MESMA CÂMERA (não altera facingMode)
        try {
            // ⚠️ NÃO especifica facingMode - deixa o sistema decidir
            const novaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                    // ✅ SEM facingMode - respeita câmera atual
                },
                audio: false
            });

            // 4. 🎥 RESTAURA VÍDEO
            videoElement.srcObject = novaStream;
            
            console.log('✅ Vigia: Câmera recuperada (mesma câmera)');

        } catch (error) {
            console.log('❌ Vigia: Não foi possível recuperar');
            throw error;
        }
    }

    // 🛑 PARAR MONITORAMENTO
    pararMonitoramento() {
        if (this.intervaloMonitoramento) {
            clearInterval(this.intervaloMonitoramento);
            this.intervaloMonitoramento = null;
        }
        this.estaMonitorando = false;
    }

    // 🔄 REINICIAR (chame isso quando seu botão alternar câmera)
    reiniciarMonitoramento() {
        console.log('🔄 Vigia: Reiniciando após troca de câmera...');
        this.pararMonitoramento();
        this.tentativasRecuperacao = 0;
        this.ultimoFrameTime = Date.now();
        
        setTimeout(() => {
            this.iniciarMonitoramento();
        }, 1000);
    }

    // 🧹 LIMPAR
    destruir() {
        this.pararMonitoramento();
    }
}

export { CameraVigilante };
