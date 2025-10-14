// core/camera-vigilante.js - VERSÃO PARA INTEGRAÇÃO NOS UI.js
class CameraVigilante {
    constructor(elementId = 'cameraPreview') {
        this.elementId = elementId;
        this.estaMonitorando = false;
        this.intervaloMonitoramento = null;
        this.ultimoFrameTime = null;
        this.tentativasRecuperacao = 0;
        this.maxTentativas = 3;
        this.cameraAtual = 'user'; // Respeita a câmera que já está ativa
        
        console.log(`👁️ Vigia Mobile para ${elementId}`);
    }

    // ✅ INTEGRAÇÃO COM SEUS UI.js EXISTENTES
    async iniciarVigilancia() {
        console.log(`📹 Vigilante: Iniciando em ${this.elementId} (${this.cameraAtual})`);
        
        try {
            // VERIFICA SE JÁ EXISTE CÂMERA ATIVA
            const videoElement = document.getElementById(this.elementId);
            if (videoElement && videoElement.srcObject) {
                console.log('✅ Vigilante: Usando câmera já existente');
            }
            
            // INICIA MONITORAMENTO
            this.iniciarMonitoramento();
            
            // CONFIGURA BOTÃO SE EXISTIR
            this.configurarBotaoAlternar();
            
            console.log(`✅ Vigilante integrado em ${this.elementId}`);
            
        } catch (error) {
            console.error('❌ Vigilante: Falha na integração:', error);
        }
    }

    // ✅ CONFIGURA BOTÃO EXISTENTE NOS SEUS UI.js
    configurarBotaoAlternar() {
        const toggleBtn = document.getElementById('toggleCamera');
        if (toggleBtn && !toggleBtn._vigilanteConfigurado) {
            toggleBtn.addEventListener('click', () => {
                this.alternarCamera();
            });
            toggleBtn._vigilanteConfigurado = true;
            console.log('🔄 Botão integrado pelo vigilante');
        }
    }

    // ✅ ALTERNAR CÂMERAS - INTEGRADO
    async alternarCamera() {
        console.log('🔄 Vigilante: Alternando câmera...');
        
        this.pararMonitoramento();
        
        const novaCamera = this.cameraAtual === 'user' ? 'environment' : 'user';
        
        try {
            await this.iniciarCamera(novaCamera);
            
            setTimeout(() => {
                this.iniciarMonitoramento();
                console.log(`✅ Vigilante: Alternado para ${novaCamera}`);
            }, 500);
            
        } catch (error) {
            console.error('❌ Vigilante: Falha ao alternar:', error);
        }
    }

    // ✅ INICIAR CÂMERA - PARA ALTERNÂNCIA
    async iniciarCamera(tipoCamera) {
        const videoElement = document.getElementById(this.elementId);
        if (!videoElement) return;

        if (videoElement.srcObject) {
            videoElement.srcObject.getTracks().forEach(track => track.stop());
        }

        const stream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: tipoCamera,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        videoElement.srcObject = stream;
        this.cameraAtual = tipoCamera;
        
        return stream;
    }

    // ✅ MONITORAMENTO PROATIVO
    iniciarMonitoramento() {
        if (this.estaMonitorando) return;
        
        this.estaMonitorando = true;
        this.ultimoFrameTime = Date.now();
        this.tentativasRecuperacao = 0;

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
        }, 8000);
    }

    // ✅ AÇÃO PROATIVA
    verificarSaudeCamera() {
        if (!this.estaMonitorando) return;

        const tempoSemFrames = Date.now() - this.ultimoFrameTime;
        
        if (tempoSemFrames > 15000) {
            console.log('🚨 Vigilante: Câmera congelada - CONSERTANDO!');
            this.tentarRecuperacaoProativa();
        }
    }

    async tentarRecuperacaoProativa() {
        if (this.tentativasRecuperacao >= this.maxTentativas) {
            console.log('❌ Máximo de tentativas - alternando...');
            await this.alternarCamera();
            return;
        }

        this.tentativasRecuperacao++;

        try {
            this.pararMonitoramento();
            await this.recuperacaoProativa();

            setTimeout(() => {
                this.iniciarMonitoramento();
            }, 1000);

        } catch (error) {
            console.log('❌ Vigilante: Falha na recuperação:', error);
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

    // ✅ PARA INTEGRAÇÃO TOTAL
    destruir() {
        this.pararMonitoramento();
        const videoElement = document.getElementById(this.elementId);
        if (videoElement && videoElement._vigilanteObserver) {
            videoElement.removeEventListener('timeupdate', videoElement._vigilanteObserver);
            delete videoElement._vigilanteObserver;
        }
    }
}

export default CameraVigilante;
