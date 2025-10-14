// core/camera-vigilante.js - VIGILANTE PROATIVO PARA 2 CÂMERAS
class CameraVigilante {
    constructor() {
        this.estaMonitorando = false;
        this.intervaloMonitoramento = null;
        this.ultimoFrameTime = null;
        this.tentativasRecuperacao = 0;
        this.maxTentativas = 3;
        this.cameraAtual = 'user'; // Começa com frontal
        this.elementId = 'cameraPreview';
        
        console.log('👁️ Vigia Mobile PROATIVO - 2 Câmeras (Frontal/Traseira)');
    }

    // ✅ INICIA VIGILÂNCIA PROATIVA
    async iniciarVigilancia() {
        console.log(`📹 Vigilante PROATIVO: Iniciando vigilância (${this.cameraAtual})`);
        
        try {
            // CONFIGURA BOTÃO DE ALTERNAR
            this.configurarBotaoAlternar();
            
            // INICIA MONITORAMENTO CONTÍNUO
            this.iniciarMonitoramento();
            
            console.log('✅ Vigilante PROATIVO ativo - monitorando 2 câmeras');
            
        } catch (error) {
            console.error('❌ Vigilante: Falha na inicialização:', error);
        }
    }

    // ✅ CONFIGURA BOTÃO DE ALTERNAR CÂMERAS
    configurarBotaoAlternar() {
        const toggleBtn = document.getElementById('toggleCamera');
        if (toggleBtn && !toggleBtn._vigilanteConfigurado) {
            toggleBtn.addEventListener('click', () => {
                this.alternarCamera();
            });
            toggleBtn._vigilanteConfigurado = true;
            console.log('🔄 Botão de alternar câmeras configurado');
        }
    }

    // ✅ ALTERNAR ENTRE FRONTAL E TRASEIRA
    async alternarCamera() {
        console.log('🔄 Vigilante PROATIVO: Alternando câmera...');
        
        // PARA MONITORAMENTO TEMPORARIAMENTE
        this.pararMonitoramento();
        
        // DETERMINA NOVA CÂMERA
        const novaCamera = this.cameraAtual === 'user' ? 'environment' : 'user';
        
        try {
            // ALTERNA PARA NOVA CÂMERA
            await this.iniciarCamera(novaCamera);
            
            // REINICIA VIGILÂNCIA
            setTimeout(() => {
                this.iniciarMonitoramento();
                console.log(`✅ Vigilante: Alternado para ${novaCamera} (${novaCamera === 'user' ? 'Frontal' : 'Traseira'})`);
            }, 500);
            
        } catch (error) {
            console.error(`❌ Falha ao alternar para ${novaCamera}:`, error);
            
            // TENTA VOLTAR PARA CÂMERA ANTERIOR EM CASO DE FALHA
            try {
                await this.iniciarCamera(this.cameraAtual);
                this.iniciarMonitoramento();
                console.log('✅ Voltou para câmera anterior após falha');
            } catch (fallbackError) {
                console.error('❌ Falha crítica no fallback:', fallbackError);
            }
        }
    }

    // ✅ INICIA CÂMERA ESPECÍFICA
    async iniciarCamera(tipoCamera) {
        const videoElement = document.getElementById(this.elementId);
        if (!videoElement) {
            throw new Error('Elemento de vídeo não encontrado');
        }

        // PARA CÂMERA ATUAL SE EXISTIR
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

    // ✅ MONITORAMENTO PROATIVO CONTÍNUO
    iniciarMonitoramento() {
        if (this.estaMonitorando) return;
        
        this.estaMonitorando = true;
        this.ultimoFrameTime = Date.now();
        this.tentativasRecuperacao = 0;

        // OBSERVAÇÃO DE FRAMES
        const videoElement = document.getElementById(this.elementId);
        if (videoElement && !videoElement._vigilanteObserver) {
            const observer = () => {
                this.ultimoFrameTime = Date.now();
            };
            videoElement.addEventListener('timeupdate', observer);
            videoElement._vigilanteObserver = observer;
        }
        
        // VERIFICAÇÃO PROATIVA A CADA 8 SEGUNDOS
        this.intervaloMonitoramento = setInterval(() => {
            this.verificarSaudeCamera();
        }, 8000);

        console.log('👁️ Vigilante: Monitoramento proativo ativo');
    }

    // ✅ VERIFICAÇÃO PROATIVA - DETECTA PROBLEMAS
    verificarSaudeCamera() {
        if (!this.estaMonitorando) return;

        const tempoSemFrames = Date.now() - this.ultimoFrameTime;
        
        // 🚨 DETECTA CÂMERA CONGELADA (>15s SEM FRAMES)
        if (tempoSemFrames > 15000) {
            console.log('🚨 Vigilante PROATIVO: Câmera congelada - INICIANDO RECUPERAÇÃO!');
            this.tentarRecuperacaoProativa();
            return;
        }

        console.log('✅ Vigilante: Câmera saudável');
    }

    // ✅ AÇÃO PROATIVA - CONSERTA CÂMERA AUTOMATICAMENTE
    async tentarRecuperacaoProativa() {
        if (this.tentativasRecuperacao >= this.maxTentativas) {
            console.log('❌ Vigilante: Máximo de tentativas - ALTERNANDO CÂMERA AUTOMATICAMENTE!');
            
            // COMO ÚLTIMO RECURSO, ALTERNA PARA OUTRA CÂMERA
            await this.alternarCamera();
            return;
        }

        this.tentativasRecuperacao++;
        console.log(`🔄 Vigilante PROATIVO: Tentativa ${this.tentativasRecuperacao}/${this.maxTentativas} de recuperação`);

        try {
            this.pararMonitoramento();
            await this.recuperacaoProativa();

            // REINICIA VIGILÂNCIA APÓS RECUPERAÇÃO
            setTimeout(() => {
                this.iniciarMonitoramento();
                console.log('✅ Vigilante PROATIVO: Câmera recuperada com sucesso!');
            }, 1000);

        } catch (error) {
            console.log('❌ Vigilante: Falha na recuperação:', error);
        }
    }

    // ✅ RECUPERAÇÃO PROATIVA - PARA E REINICIA CÂMERA
    async recuperacaoProativa() {
        console.log('🔧 Vigilante PROATIVO: Executando recuperação...');

        const videoElement = document.getElementById(this.elementId);
        
        // 1. 🛑 PARA STREAM ATUAL
        if (videoElement && videoElement.srcObject) {
            videoElement.srcObject.getTracks().forEach(track => track.stop());
        }

        // 2. ⏳ AGUARDA ESTABILIZAÇÃO
        await new Promise(resolve => setTimeout(resolve, 800));

        // 3. 📹 REINICIA CÂMERA (MESMA CÂMERA)
        const novaStream = await navigator.mediaDevices.getUserMedia({
            video: { 
                facingMode: this.cameraAtual,
                width: { ideal: 1280 },
                height: { ideal: 720 }
            },
            audio: false
        });

        // 4. 🎥 ATUALIZA ELEMENTO DE VÍDEO
        if (videoElement) {
            videoElement.srcObject = novaStream;
        }

        console.log('✅ Vigilante: Recuperação proativa concluída');
    }

    // ✅ PARA VIGILÂNCIA
    pararMonitoramento() {
        if (this.intervaloMonitoramento) {
            clearInterval(this.intervaloMonitoramento);
            this.intervaloMonitoramento = null;
        }
        this.estaMonitorando = false;
    }

    // ✅ OBTÉM STATUS DO VIGILANTE
    getStatus() {
        return {
            cameraAtual: this.cameraAtual === 'user' ? 'Frontal' : 'Traseira',
            monitorando: this.estaMonitorando,
            tentativasRecuperacao: this.tentativasRecuperacao,
            ultimoFrame: new Date(this.ultimoFrameTime).toLocaleTimeString()
        };
    }
}

// ✅ EXPORTAÇÃO PARA SEUS UI.js
export { CameraVigilante };
