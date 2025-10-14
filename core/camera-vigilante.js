// core/camera-vigilante.js - VERSÃO OTIMIZADA
class CameraVigilante {
    constructor() {
        this.estaMonitorando = false;
        this.intervaloMonitoramento = null;
        this.ultimoFrameTime = null;
        this.tentativasRecuperacao = 0;
        this.maxTentativas = 2; // ✅ REDUZIDO para menos agressivo
        
        console.log('👁️ Vigia Mobile inicializado (Android/iOS)');
    }

    // ✅ MÉTODO SIMPLIFICADO - apenas monitora, não interfere
    iniciarMonitoramento() {
        if (this.estaMonitorando) return;
        
        console.log('👁️ Iniciando monitoramento mobile...');
        this.estaMonitorando = true;
        this.ultimoFrameTime = Date.now();

        // 👁️ OBSERVAÇÃO LEVE - não modifica eventos existentes
        this.observarVideoLeve();
        
        // ⚡ VERIFICAÇÃO SUAVE (a cada 8s em vez de 5s)
        this.intervaloMonitoramento = setInterval(() => {
            this.verificarSaudeCameraMobile();
        }, 8000);

        console.log('✅ Vigia mobile ativado');
    }

    // ✅ OBSERVAÇÃO LEVE - não substitui eventos existentes
    observarVideoLeve() {
        const localVideo = document.getElementById('localVideo');
        if (!localVideo) {
            console.log('⚠️ Video local não encontrado - vigilância leve');
            return;
        }

        // 🎥 APENAS DETECTA frames, não substitui eventos
        const observer = () => {
            this.ultimoFrameTime = Date.now();
        };
        
        // ✅ USA eventListener existente se possível
        if (!localVideo._vigilanteObserver) {
            localVideo.addEventListener('timeupdate', observer);
            localVideo._vigilanteObserver = observer;
        }
    }

    // ✅ VERIFICAÇÃO MOBILE OTIMIZADA
    verificarSaudeCameraMobile() {
        if (!this.estaMonitorando) return;

        const agora = Date.now();
        const tempoSemFrames = agora - this.ultimoFrameTime;
        
        // 🚨 DETECTA CONGELAMENTO (15s em vez de 10s - mais tolerante)
        if (tempoSemFrames > 15000) {
            console.log('🚨 Câmera mobile possivelmente congelada');
            this.tentarRecuperacaoMobile('congelada');
            return;
        }

        console.log('✅ Câmera mobile saudável');
    }

    // ✅ RECUPERAÇÃO MOBILE - MENOS AGRESSIVA
    async tentarRecuperacaoMobile(motivo) {
        if (this.tentativasRecuperacao >= this.maxTentativas) {
            console.log('❌ Máximo de tentativas mobile atingido');
            return; // ✅ NÃO TRAVA - apenas para tentativas
        }

        this.tentativasRecuperacao++;
        console.log(`🔄 Tentativa ${this.tentativasRecuperacao}/${this.maxTentativas}`);

        try {
            // 🛑 PARA MONITORAMENTO TEMPORARIAMENTE
            this.pararMonitoramento();

            // 🔧 RECUPERAÇÃO SIMPLES
            await this.recuperacaoMobileSimples();

            // ✅ REINICIA MONITORAMENTO
            setTimeout(() => {
                this.iniciarMonitoramento();
                this.tentativasRecuperacao = 0;
                console.log('✅ Câmera mobile recuperada');
            }, 1000);

        } catch (error) {
            console.log('❌ Falha na recuperação mobile:', error);
        }
    }

    // ✅ RECUPERAÇÃO SIMPLES - não mexe no WebRTC
    async recuperacaoMobileSimples() {
        console.log('🔧 Executando recuperação mobile...');

        // 1. 🛑 PARA STREAM ATUAL (apenas se existir)
        if (window.localStream) {
            window.localStream.getTracks().forEach(track => track.stop());
        }

        // 2. ⏳ AGUARDA BREVEMENTE
        await new Promise(resolve => setTimeout(resolve, 800));

        // 3. 📹 TENTA NOVA CÂMERA (usa facingMode atual)
        try {
            const novaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: 'user', // ✅ Sempre frontal na recuperação
                    width: { ideal: 1280 },
                    height: { ideal: 720 }
                },
                audio: false
            });

            // 4. 🎥 ATUALIZA APENAS VÍDEO LOCAL
            const localVideo = document.getElementById('localVideo');
            if (localVideo) {
                localVideo.srcObject = novaStream;
            }

            // 5. 🔄 ATUALIZA STREAM GLOBAL
            window.localStream = novaStream;

            console.log('✅ Recuperação mobile concluída');

        } catch (error) {
            console.log('❌ Não foi possível recuperar câmera mobile:', error);
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

    // 🔄 REINICIAR (para trocas de câmera)
    reiniciarMonitoramento() {
        this.pararMonitoramento();
        this.tentativasRecuperacao = 0;
        this.ultimoFrameTime = Date.now();
        setTimeout(() => this.iniciarMonitoramento(), 500);
    }

    // 🧹 LIMPAR
    destruir() {
        this.pararMonitoramento();
    }
}

export { CameraVigilante };
