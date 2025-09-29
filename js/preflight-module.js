// js/preflight-module.js - MÓDULO INTELIGENTE CORRIGIDO
class WebRTCPreflight {
    constructor() {
        this.isPreheated = false;
        this.mediaStream = null;
    }

    // 1. Tela inicial com SUA imagem
    showInitialScreen() {
        console.log('🖼️ Mostrando tela inicial...');
        const preflightHTML = `
            <div id="preflight-screen" style="
                position: fixed; top: 0; left: 0; width: 100%; height: 100%;
                background: #000; display: flex; justify-content: center;
                align-items: center; z-index: 9999; flex-direction: column;
            ">
                <img src="assets/images/telalemur.png" alt="Lemur Interface" 
                     style="max-width: 90%; max-height: 70%; object-fit: contain;">
                <p style="color: white; margin-top: 20px; font-size: 18px;">
                    Preparando tradução em tempo real...
                </p>
            </div>
        `;
        document.body.insertAdjacentHTML('afterbegin', preflightHTML);
    }

    // 2. Remove tela inicial
    hideInitialScreen() {
        console.log('🔄 Removendo tela inicial...');
        const element = document.getElementById('preflight-screen');
        if (element) {
            element.style.opacity = '0';
            element.style.transition = 'opacity 0.5s ease';
            setTimeout(() => {
                element.remove();
                console.log('✅ Tela inicial removida!');
            }, 500);
        }
    }

    // 3. Pré-aquecimento do narrador (SIMPLIFICADO)
    preheatSpeechSynthesis() {
        console.log('🎙️ Pré-aquecendo narrador...');
        try {
            // Apenas tenta carregar as vozes, sem falar
            if (speechSynthesis.getVoices().length === 0) {
                speechSynthesis.onvoiceschanged = () => {
                    console.log('✅ Vozes carregadas');
                    this.isPreheated = true;
                };
            } else {
                console.log('✅ Vozes já disponíveis');
                this.isPreheated = true;
            }
        } catch (error) {
            console.log('⚠️ Narrador não disponível, continuando...');
            this.isPreheated = true; // Continua mesmo sem narrador
        }
    }

    // 4. Solicitação de mídia (SIMPLIFICADA)
    async requestMediaWithDelay(delay = 3000) { // REDUZIDO para 3 segundos
        return new Promise((resolve) => {
            console.log(`⏳ Aguardando ${delay}ms antes de solicitar mídia...`);
            
            setTimeout(() => {
                console.log('🎥 Solicitando câmera e microfone...');
                
                // Tenta rapidamente, mas não trava se der erro
                navigator.mediaDevices.getUserMedia({ video: true, audio: true })
                    .then(stream => {
                        console.log('✅ Mídia autorizada');
                        this.mediaStream = stream;
                        resolve(stream);
                    })
                    .catch(error => {
                        console.log('⚠️ Mídia não autorizada, continuando...');
                        resolve(null); // Não trava - continua sem mídia
                    });
                    
            }, delay);
        });
    }

    // 5. Inicialização completa (CORRIGIDA)
    async initialize() {
        console.log('🚀 INICIANDO PRÉ-CARREGAMENTO...');
        
        try {
            // Mostra tela inicial IMEDIATAMENTE
            this.showInitialScreen();
            
            // FAZ TUDO EM PARALELO - não espera uma coisa terminar para começar outra
            const promises = [
                this.requestMediaWithDelay(3000), // 3 segundos
                this.preheatSpeechSynthesis()
            ];

            // AGUARDA APENAS A MÍDIA (narrador é independente)
            await Promise.race([
                promises[0], // Espera principalmente pela mídia
                new Promise(resolve => setTimeout(resolve, 4000)) // Timeout de segurança
            ]);

            console.log('✅ PRÉ-CARREGAMENTO CONCLUÍDO! Removendo tela...');
            
            // Remove tela inicial INDEPENDENTE do resultado
            this.hideInitialScreen();
            
            return {
                mediaStream: this.mediaStream,
                isSpeechReady: this.isPreheated
            };
            
        } catch (error) {
            console.error('❌ Erro no pré-carregamento:', error);
            // MESMO COM ERRO, REMOVE A TELA INICIAL
            this.hideInitialScreen();
            return { mediaStream: null, isSpeechReady: false };
        }
    }
}
