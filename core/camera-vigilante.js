// core/camera-vigilante.js - VERSÃO SEM CONFLITO
class CameraVigilante {
    constructor() {
        this.estaMonitorando = false;
        this.intervaloMonitoramento = null;
        this.ultimoFrameTime = null;
        this.tentativasRecuperacao = 0;
        this.maxTentativas = 3;
        this.cameraAtual = 'user';
        this.elementId = 'cameraPreview';
        
        console.log('👁️ Vigia Mobile - Apenas monitoramento');
    }

    // ✅ INICIA APENAS O MONITORAMENTO - NÃO MEXE NO BOTÃO
    async iniciarVigilancia() {
        console.log('📹 Vigilante: Apenas monitorando...');
        
        try {
            // ✅ APENAS MONITORAMENTO - NÃO CONFIGURA BOTÃO
            this.iniciarMonitoramento();
            console.log('✅ Vigilante: Monitoramento ativo (sem conflitos)');
            
        } catch (error) {
            console.error('❌ Vigilante: Falha:', error);
        }
    }

    // ✅ MONITORAMENTO SIMPLES
    iniciarMonitoramento() {
        if (this.estaMonitorando) return;
        
        this.estaMonitorando = true;
        this.ultimoFrameTime = Date.now();

        const videoElement = document.getElementById(this.elementId);
        if (videoElement && !videoElement._vigilanteObserver) {
            const observer = () => {
                this.ultimoFrameTime = Date.now();
            };
            videoElement.addEventListener('timeupdate', observer);
            videoElement._vigilanteObserver = observer;
        }
        
        this.intervaloMonitoramento = setInterval(() => {
            this.verificarSaudeCamera();
        }, 10000);
    }

    // ✅ VERIFICAÇÃO (mantém a função proativa)
    verificarSaudeCamera() {
        if (!this.estaMonitorando) return;

        const tempoSemFrames = Date.now() - this.ultimoFrameTime;
        
        if (tempoSemFrames > 15000) {
            console.log('🚨 Vigilante: Câmera congelada - recuperando...');
            this.tentarRecuperacaoProativa();
        }
    }

    async tentarRecuperacaoProativa() {
        if (this.tentativasRecuperacao >= this.maxTentativas) return;

        this.tentativasRecuperacao++;

        try {
            this.pararMonitoramento();
            await this.recuperacaoProativa();

            setTimeout(() => {
                this.iniciarMonitoramento();
            }, 1000);

        } catch (error) {
            console.log('❌ Vigilante: Falha na recuperação');
        }
    }

    async recuperacaoProativa() {
        const videoElement = document.getElementById(this.elementId);
        if (videoElement?.srcObject) {
            videoElement.srcObject.getTracks().forEach(track => track.stop());
        }

        await new Promise(resolve => setTimeout(resolve, 800));

        const novaStream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: this.cameraAtual,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        if (videoElement) {
            videoElement.srcObject = novaStream;
        }
    }

    pararMonitoramento() {
        if (this.intervaloMonitoramento) {
            clearInterval(this.intervaloMonitoramento);
            this.intervaloMonitoramento = null;
        }
        this.estaMonitorando = false;
    }
}

export { CameraVigilante };
