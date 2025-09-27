// js/receiver-notification.js - VERSÃO CORRIGIDA
import { WebRTCCore } from '../core/webrtc-core.js';

// 🔥 FUNÇÃO PRINCIPAL - APENAS COMPLEMENTA O receiver-ui.js
function iniciarModoNotificacao() {
    console.log('🚀 INICIANDO MODO NOTIFICAÇÃO (COMPLEMENTAR)');
    
    // ✅ 1. VERIFICA SE É MODO NOTIFICAÇÃO
    const params = new URLSearchParams(window.location.search);
    const pendingCaller = params.get('pendingCaller');
    const callerLang = params.get('callerLang');
    
    if (!pendingCaller) {
        console.log('❌ Não é modo notificação, ignorando...');
        return;
    }

    console.log('🔔 Modo Notificação detectado - Caller:', pendingCaller);

    // ✅ 2. CONFIGURA TELA PARA MODO CHAMADA
    const configurarTelaChamada = () => {
        console.log('🎬 Configurando tela para modo chamada...');
        
        // ✅ ESCONDE ELEMENTOS DO QR CODE
        const qrModal = document.querySelector('.qr-modal');
        const qrContainer = document.getElementById('qrcode');
        if (qrModal) qrModal.style.display = 'none';
        if (qrContainer) qrContainer.style.display = 'none';
        
        // ✅ STATUS DE CONEXÃO
        const statusElement = document.createElement('div');
        statusElement.id = 'notification-status';
        statusElement.innerHTML = `
            <div style="position: fixed; top: 0; left: 0; width: 100%; 
                        background: linear-gradient(90deg, #006400, #008000);
                        color: white; padding: 15px; text-align: center; 
                        z-index: 10000; font-size: 16px; font-weight: bold;">
                📞 CONECTANDO COM CHAMADOR...
            </div>
        `;
        document.body.insertBefore(statusElement, document.body.firstChild);
    };

    // ✅ 3. CONEXÃO AUTOMÁTICA COM CALLER
    const conectarComCaller = () => {
        console.log('📞 Tentando conexão automática com caller...');
        
        // 🔄 AGUARDA O WEBRTC DO receiver-ui.js FICAR PRONTO
        const aguardarWebRTCPronto = () => {
            if (window.rtcCore && window.localStream) {
                console.log('✅ WebRTC pronto, configurando conexão...');
                
                // ✅ CONFIGURA CALLBACK PARA QUANDO A CHAMADA CHEGAR
                const callbackOriginal = window.rtcCore.onIncomingCall;
                
                window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
                    console.log('🎯 Offer recebido do caller via notificação!');
                    
                    // ✅ RESTAURA CALLBACK ORIGINAL
                    if (callbackOriginal) {
                        window.rtcCore.onIncomingCall = callbackOriginal;
                    }
                    
                    // ✅ REMOVE STATUS DE CONEXÃO
                    const statusElement = document.getElementById('notification-status');
                    if (statusElement) statusElement.remove();
                    
                    console.log('✅ Conexão estabelecida via notificação!');
                    
                    // ✅ A CHAMADA SERÁ ACEITA AUTOMATICAMENTE PELO receiver-ui.js
                };
                
                // ✅ APLICA BANDEIRA DO CALLER SE ESPECIFICADA
                if (callerLang) {
                    console.log('🎯 Aplicando bandeira do caller:', callerLang);
                    aplicarBandeiraRemota(callerLang);
                }
                
            } else {
                console.log('⏳ Aguardando WebRTC ficar pronto...');
                setTimeout(aguardarWebRTCPronto, 500);
            }
        };
        
        aguardarWebRTCPronto();
    };

    // 🏳️ Função auxiliar para bandeira remota
    async function aplicarBandeiraRemota(langCode) {
        try {
            const response = await fetch('assets/bandeiras/language-flags.json');
            const flags = await response.json();
            const bandeira = flags[langCode] || flags[langCode.split('-')[0]] || '🔴';
            
            const remoteLangElement = document.querySelector('.remoter-Lang');
            if (remoteLangElement) remoteLangElement.textContent = bandeira;
        } catch (error) {
            console.error('Erro ao carregar bandeira remota:', error);
        }
    }

    // ✅ 4. INICIA TUDO
    configurarTelaChamada();
    
    // ✅ Aguarda um pouco para o receiver-ui.js iniciar
    setTimeout(conectarComCaller, 1000);
}

// ✅ INICIA QUANDO A PÁGINA ESTIVER PRONTA
document.addEventListener('DOMContentLoaded', iniciarModoNotificacao);
