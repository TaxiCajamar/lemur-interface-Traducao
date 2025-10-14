// core/camera-vigilante.js - VERSÃO FINAL FUNCIONAL
class CameraVigilante {
    constructor() {
        this.estaMonitorando = false;
        this.intervaloMonitoramento = null;
        this.ultimoFrameTime = null;
        this.tentativasRecuperacao = 0;
        this.maxTentativas = 2;
        this.cameraAtual = 'user'; // 'user' (frontal) ou 'environment' (traseira)
        
        console.log('👁️ Vigia Mobile inicializado (Android/iOS)');
    }

    // ✅ INICIA A CÂMERA PELA PRIMEIRA VEZ
    async iniciarCamera(elementId = 'cameraPreview', tipoCamera = 'environment') {
        console.log(`📹 Iniciando câmera ${tipoCamera} em ${elementId}`);
        
        try {
            const videoElement = document.getElementById(elementId);
            if (!videoElement) {
                throw new Error(`Elemento ${elementId} não encontrado`);
            }

            // 🎥 INICIA A CÂMERA PELA PRIMEIRA VEZ
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
            
            // ✅ AGORA SIM PODE MONITORAR
            this.iniciarMonitoramento(elementId);
            
            console.log(`✅ Câmera ${tipoCamera} iniciada em ${elementId}`);
            return stream;

        } catch (error) {
            console.error(`❌ Falha ao iniciar câmera ${tipoCamera}:`, error);
            
            // 🔄 TENTA CÂMERA ALTERNATIVA
            const cameraAlternativa = tipoCamera === 'user' ? 'environment' : 'user';
            console.log(`🔄 Tentando câmera alternativa: ${cameraAlternativa}`);
            
            return await this.iniciarCamera(elementId, cameraAlternativa);
        }
    }

    // ✅ ALTERNAR ENTRE CÂMERAS
    async alternarCamera(elementId = 'cameraPreview') {
        console.log('🔄 Alternando câmera...');
        
        // Para a câmera atual
        const videoElement = document.getElementById(elementId);
        if (videoElement && videoElement.srcObject) {
            videoElement.srcObject.getTracks().forEach(track => track.stop());
        }

        // Alterna entre frontal/traseira
        const novaCamera = this.cameraAtual === 'user' ? 'environment' : 'user';
        
        // Reinicia com nova câmera
        return await this.iniciarCamera(elementId, novaCamera);
    }

    // ✅ MONITORAMENTO
    iniciarMonitoramento(elementId = 'cameraPreview') {
        if (this.estaMonitorando) return;
        
        console.log('👁️ Iniciando monitoramento...');
        this.estaMonitorando = true;
        this.ultimoFrameTime = Date.now();

        this.observarVideoLeve(elementId);
        
        this.intervaloMonitoramento = setInterval(() => {
            this.verificarSaudeCameraMobile(elementId);
        }, 8000);

        console.log('✅ Vigia mobile ativado');
    }

    // ✅ OBSERVAÇÃO DO VÍDEO
    observarVideoLeve(elementId) {
        const videoElement = document.getElementById(elementId);
        if (!videoElement) {
            console.log(`⚠️ Video ${elementId} não encontrado`);
            return;
        }

        const observer = () => {
            this.ultimoFrameTime = Date.now();
        };
        
        if (!videoElement._vigilanteObserver) {
            videoElement.addEventListener('timeupdate', observer);
            videoElement._vigilanteObserver = observer;
        }
    }

    // ✅ VERIFICA SAÚDE DA CÂMERA
    verificarSaudeCameraMobile(elementId) {
        if (!this.estaMonitorando) return;

        const agora = Date.now();
        const tempoSemFrames = agora - this.ultimoFrameTime;
        
        if (tempoSemFrames > 15000) {
            console.log('🚨 Câmera possivelmente congelada');
            this.tentarRecuperacaoMobile('congelada', elementId);
            return;
        }

        console.log('✅ Câmera saudável');
    }

    // ✅ TENTA RECUPERAR CÂMERA
    async tentarRecuperacaoMobile(motivo, elementId) {
        if (this.tentativasRecuperacao >= this.maxTentativas) {
            console.log('❌ Máximo de tentativas atingido');
            return;
        }

        this.tentativasRecuperacao++;
        console.log(`🔄 Tentativa ${this.tentativasRecuperacao}/${this.maxTentativas}`);

        try {
            this.pararMonitoramento();
            await this.recuperacaoMobileSimples(elementId);

            setTimeout(() => {
                this.iniciarMonitoramento(elementId);
                this.tentativasRecuperacao = 0;
                console.log('✅ Câmera recuperada');
            }, 1000);

        } catch (error) {
            console.log('❌ Falha na recuperação:', error);
        }
    }

    // ✅ RECUPERAÇÃO SIMPLES
    async recuperacaoMobileSimples(elementId) {
        console.log('🔧 Executando recuperação...');

        const videoElement = document.getElementById(elementId);
        if (videoElement && videoElement.srcObject) {
            videoElement.srcObject.getTracks().forEach(track => track.stop());
        }

        await new Promise(resolve => setTimeout(resolve, 800));

        try {
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

            console.log('✅ Recuperação concluída');

        } catch (error) {
            console.log('❌ Não foi possível recuperar câmera:', error);
            throw error;
        }
    }

    // ✅ PARA MONITORAMENTO
    pararMonitoramento() {
        if (this.intervaloMonitoramento) {
            clearInterval(this.intervaloMonitoramento);
            this.intervaloMonitoramento = null;
        }
        this.estaMonitorando = false;
    }

    // ✅ PARA CÂMERA COMPLETAMENTE
    pararCamera(elementId = 'cameraPreview') {
        this.pararMonitoramento();
        
        const videoElement = document.getElementById(elementId);
        if (videoElement && videoElement.srcObject) {
            videoElement.srcObject.getTracks().forEach(track => track.stop());
            videoElement.srcObject = null;
        }
    }
}

// ✅ EXPORTAÇÃO
export default CameraVigilante;
