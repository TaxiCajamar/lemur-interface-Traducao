// js/preflight-module.js - MÓDULO PRINCIPAL
class WebRTCPreflight {
    constructor() {
        this.isPreheated = false;
        this.mediaStream = null;
        this.isInitialized = false;
    }

    // 1. Tela inicial com SUA imagem
    showInitialScreen() {
        console.log('🖼️ Mostrando tela inicial Lemur...');
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
        console.log('🎯 Removendo tela inicial...');
        const element = document.getElementById('preflight-screen');
        if (element) {
            element.style.opacity = '0';
            element.style.transition = 'opacity 0.3s ease';
            setTimeout(() => {
                element.remove();
                console.log('✅ Tela inicial removida!');
            }, 300);
        }
    }

    // 3. Pré-aquecimento do narrador
    preheatSpeechSynthesis() {
        console.log('🎙️ Pré-aquecendo narrador...');
        if (this.isPreheated) return;
        
        const language = navigator.language || 'pt-BR';
        const ghostText = 'Sistema de tradução pronto';

        const utterance = new SpeechSynthesisUtterance(ghostText);
        utterance.volume = 0;
        utterance.lang = language;

        const speak = () => {
            const voices = speechSynthesis.getVoices();
            const preferredVoice = voices.find(v => v.lang === language) || voices[0];
            if (preferredVoice) {
                utterance.voice = preferredVoice;
                speechSynthesis.speak(utterance);
                this.isPreheated = true;
                console.log('✅ Narrador pré-aquecido');
            }
        };

        if (speechSynthesis.getVoices().length > 0) {
            speak();
        } else {
            speechSynthesis.onvoiceschanged = speak;
        }
    }

    // 4. SOLICITAÇÃO PRINCIPAL de câmera+microfone
    async requestMediaWithDelay(delay = 3000) {
        return new Promise((resolve) => {
            setTimeout(async () => {
                try {
                    console.log('🎥 SOLICITANDO CÂMERA E MICROFONE (Módulo Principal)...');
                    const stream = await navigator.mediaDevices.getUserMedia({
                        video: true,
                        audio: true
                    });
                    this.mediaStream = stream;
                    console.log('✅ Câmera e microfone autorizados pelo Módulo Principal');
                    
                    // 🔥 DISPONIBILIZA PARA TODO O SISTEMA
                    window.preflightMediaStream = stream;
                    window.isPreflightActive = true;
                    
                    resolve(stream);
                } catch (error) {
                    console.log('⚠️ Mídia não autorizada, continuando sem...');
                    window.isPreflightActive = true; // Mesmo sem mídia, marca como ativo
                    resolve(null);
                }
            }, delay);
        });
    }

    // 5. Inicialização completa - AGORA É A PRINCIPAL
    async initialize() {
        console.log('🚀 MÓDULO PRINCIPAL INICIANDO...');
        
        if (this.isInitialized) {
            console.log('✅ Módulo já inicializado');
            return;
        }
        
        // Mostra tela inicial
        this.showInitialScreen();
        
        // Pré-aquecimento paralelo
        this.preheatSpeechSynthesis();
        
        // SOLICITA MÍDIA (isso substitui as solicitações dos seus arquivos)
        const mediaStream = await this.requestMediaWithDelay(3000);
        
        // Remove tela inicial
        this.hideInitialScreen();
        
        this.isInitialized = true;
        
        console.log('✅ MÓDULO PRINCIPAL CONCLUÍDO - Seus arquivos podem iniciar');
        
        return {
            mediaStream: mediaStream,
            isSpeechReady: this.isPreheated
        };
    }
}
