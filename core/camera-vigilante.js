// core/camera-vigilante.js - VERSÃO MÍNIMA INTERVENÇÃO
class CameraVigilante {
    constructor() {
        this.estaMonitorando = false;
        this.intervaloMonitoramento = null;
        this.ultimoFrameTime = null;
        this.tentativasRecuperacao = 0;
        this.maxTentativas = 2;
        
        console.log('👁️ Vigia MÍNIMO - Só observa, não interfere');
    }

    // ✅ INICIA APENAS OBSERVAÇÃO
    iniciarMonitoramento() {
        if (this.estaMonitorando) return;

        console.log('👁️ Vigia MÍNIMO: Apenas observando...');
        this.estaMonitorando = true;
        this.ultimoFrameTime = Date.now();

        // 🎥 OBSERVA SILENCIOSAMENTE
        this.observarVideoSilencioso();
        
        // ⏰ VERIFICAÇÃO MENOS FREQUENTE
        this.intervaloMonitoramento = setInterval(() => {
            this.verificarSaudeCamera();
        }, 12000); // 12 segundos - menos intrusivo
    }

    // ✅ OBSERVAÇÃO DISCRETA
    observarVideoSilencioso() {
        const videoElement = this.encontrarVideoAtivo();
        if (!videoElement) return;

        if (!videoElement._vigilanteObserver) {
            const observer = () => {
                this.ultimoFrameTime = Date.now();
            };
            videoElement.addEventListener('timeupdate', observer);
            videoElement._vigilanteObserver = observer;
        }
    }

    // ✅ ENCONTRA VÍDEO ATIVO
    encontrarVideoAtivo() {
        let videoElement = document.getElementById('cameraPreview');
        if (videoElement && videoElement.srcObject) return videoElement;
        
        videoElement = document.getElementById('localVideo');
        if (videoElement && videoElement.srcObject) return videoElement;
        
        const videos = document.getElementsByTagName('video');
        for (let video of videos) {
            if (video.srcObject) return video;
        }
        
        return null;
    }

    // ✅ VERIFICAÇÃO COM TOLERÂNCIA
    verificarSaudeCamera() {
        if (!this.estaMonitorando) return;

        const tempoSemFrames = Date.now() - this.ultimoFrameTime;
        
        // 🚨 SÓ AGE SE REALMENTE CONGELOU (>20s)
        if (tempoSemFrames > 20000) {
            console.log('🚨 Vigia: Câmera realmente congelada - agindo...');
            this.tentarRecuperacaoDiscreta();
        }
    }

    // ✅ RECUPERAÇÃO DISCRETA
    async tentarRecuperacaoDiscreta() {
        if (this.tentativasRecuperacao >= this.maxTentativas) {
            console.log('❌ Vigia: Desistindo - não atrapalhando mais');
            return;
        }

        this.tentativasRecuperacao++;

        try {
            this.pararMonitoramento();
            await this.recuperacaoMinima();

            // ⏳ ESPERA MAIS TEMPO ANTES DE REINICIAR
            setTimeout(() => {
                this.iniciarMonitoramento();
                this.tentativasRecuperacao = 0;
            }, 2000);

        } catch (error) {
            console.log('❌ Vigia: Falha discreta');
        }
    }

    // ✅ RECUPERAÇÃO MÍNIMA
    async recuperacaoMinima() {
        const videoElement = this.encontrarVideoAtivo();
        if (!videoElement?.srcObject) return;

        // 1. 🛑 PARA STREAM
        videoElement.srcObject.getTracks().forEach(track => track.stop());

        // 2. ⏳ AGUARDA MAIS TEMPO
        await new Promise(resolve => setTimeout(resolve, 1500));

        // 3. 📹 TENTA NOVA CÂMERA (SEM facingMode)
        try {
            const novaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                    // ✅ SEM facingMode - sistema decide
                },
                audio: false
            });

            videoElement.srcObject = novaStream;

        } catch (error) {
            throw error;
        }
    }

    // 🛑 PARAR
    pararMonitoramento() {
        if (this.intervaloMonitoramento) {
            clearInterval(this.intervaloMonitoramento);
            this.intervaloMonitoramento = null;
        }
        this.estaMonitorando = false;
    }

    // 🔄 REINICIAR (chame quando trocar câmera manualmente)
    reiniciarMonitoramento() {
        this.pararMonitoramento();
        setTimeout(() => {
            this.iniciarMonitoramento();
        }, 3000); // ⏳ ESPERA 3s APÓS TROCA MANUAL
    }
}

export { CameraVigilante };
