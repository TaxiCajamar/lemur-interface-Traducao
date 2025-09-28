// 📦 Importa o núcleo WebRTC (para comunicação)
import { WebRTCCore } from '../../core/webrtc-core.js';

// 🎯 FUNÇÃO PARA OBTER IDIOMA COMPLETO
async function obterIdiomaCompleto(lang) {
  if (!lang) return 'pt-BR';
  if (lang.includes('-')) return lang;

  try {
    const response = await fetch('assets/bandeiras/language-flags.json');
    const flags = await response.json();
    const codigoCompleto = Object.keys(flags).find(key => key.startsWith(lang + '-'));
    return codigoCompleto || `${lang}-${lang.toUpperCase()}`;
  } catch (error) {
    console.error('Erro ao carregar JSON de bandeiras:', error);
    const fallback = {
      'pt': 'pt-BR', 'es': 'es-ES', 'en': 'en-US',
      'fr': 'fr-FR', 'de': 'de-DE', 'it': 'it-IT',
      'ja': 'ja-JP', 'zh': 'zh-CN', 'ru': 'ru-RU'
    };
    return fallback[lang] || 'en-US';
  }
}

// 🔔 FUNÇÃO SIMPLES: Notificar servidor que estou online
async function notificarServidorOnline(meuId, meuIdioma) {
  try {
    console.log('📢 Notificando servidor que estou online:', meuId);
    
    // ✅ ENVIA APENAS UMA MENSAGEM SIMPLES PARA O SERVIDOR
    const response = await fetch('https://serve-app-e9ia.onrender.com/user-online', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: meuId,
        userLang: meuIdioma,
        status: 'online',
        timestamp: new Date().toISOString()
      })
    });

    const result = await response.json();
    console.log('✅ Servidor notificado:', result);
    return result.success;
  } catch (error) {
    console.error('❌ Erro ao notificar servidor:', error);
    return false;
  }
}

// 🎯 FUNÇÃO PRINCIPAL: Configurar interface simples de "aguardando"
function configurarInterfaceAguardando(meuId, meuIdioma) {
  // ✅ REMOVE qualquer elemento complexo existente
  const elementosComplexos = document.querySelectorAll('#aguardando-status, .call-interface');
  elementosComplexos.forEach(el => el.remove());
  
  // ✅ CRIA INTERFACE SIMPLES DE "AGUARDANDO"
  const statusElement = document.createElement('div');
  statusElement.id = 'aguardando-status';
  statusElement.innerHTML = `
    <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                display: flex; flex-direction: column; align-items: center; 
                justify-content: center; color: white; text-align: center;
                font-family: Arial, sans-serif; z-index: 1000;">
      
      <div style="font-size: 80px; margin-bottom: 20px;">📞</div>
      
      <div style="font-size: 24px; font-weight: bold; margin-bottom: 10px;">
        Aguardando Chamada
      </div>
      
      <div style="font-size: 16px; opacity: 0.9; margin-bottom: 20px;">
        ID: <strong>${meuId}</strong>
      </div>
      
      <div style="font-size: 14px; opacity: 0.7; margin-bottom: 30px;">
        Idioma: ${meuIdioma}
      </div>
      
      <div class="pulsating-dot" style="
        width: 20px; height: 20px; background: #4CAF50; border-radius: 50%;
        animation: pulse 1.5s infinite; margin-top: 20px;
      "></div>
      
      <div style="font-size: 12px; opacity: 0.6; margin-top: 10px;">
        Disponível para receber chamadas
      </div>
    </div>
    
    <style>
      @keyframes pulse {
        0% { transform: scale(0.8); opacity: 0.7; }
        50% { transform: scale(1.2); opacity: 1; }
        100% { transform: scale(0.8); opacity: 0.7; }
      }
    </style>
  `;
  
  document.body.appendChild(statusElement);
}

// 🚀 INICIALIZAÇÃO SIMPLIFICADA
window.onload = async () => {
  try {
    console.log('🚀 Iniciando Notificador - Modo Simples');
    
    // ✅ OBTÉM ID E IDIOMA DOS PARÂMETROS DA URL
    const urlParams = new URLSearchParams(window.location.search);
    const meuId = urlParams.get('id') || crypto.randomUUID().substr(0, 8);
    const meuIdioma = await obterIdiomaCompleto(urlParams.get('lang') || navigator.language);
    
    console.log('👤 Meu ID:', meuId);
    console.log('🌐 Meu Idioma:', meuIdioma);
    
    // ✅ CONFIGURA INTERFACE SIMPLES
    configurarInterfaceAguardando(meuId, meuIdioma);
    
    // ✅ NOTIFICA SERVIDOR QUE ESTOU ONLINE
    await notificarServidorOnline(meuId, meuIdioma);
    
    // ✅ INICIALIZA WebRTC (APENAS PARA RECEBER)
    window.rtcCore = new WebRTCCore();
    window.rtcCore.initialize(meuId);
    window.rtcCore.setupSocketHandlers();
    
    console.log('✅ Notificador inicializado e aguardando chamadas');
    
    // ✅ CONFIGURA CALLBACK PARA RECEBER MENSAGENS
    window.rtcCore.setDataChannelCallback((mensagem) => {
      console.log('📩 Mensagem recebida no notificador:', mensagem);
      // O tradutor (notificador-trz.js) cuidará das mensagens
    });
    
    // ✅ CONFIGURA CALLBACK PARA RECEBER CHAMADAS
    window.rtcCore.onIncomingCall = (offer, idiomaDoCaller) => {
      console.log('📞 Chamada recebida no notificador!');
      console.log('🎯 Idioma do caller:', idiomaDoCaller);
      
      // ✅ ACEITA CHAMADA AUTOMATICAMENTE
      window.rtcCore.handleIncomingCall(offer, null, (remoteStream) => {
        console.log('✅ Chamada atendida automaticamente');
        // O stream será usado pelo tradutor
      });
    };
    
  } catch (error) {
    console.error('❌ Erro ao inicializar notificador:', error);
    
    // ✅ FALLBACK SIMPLES EM CASO DE ERRO
    const errorElement = document.createElement('div');
    errorElement.innerHTML = `
      <div style="position: fixed; top: 0; left: 0; width: 100%; height: 100%; 
                  background: #f44336; color: white; display: flex; 
                  align-items: center; justify-content: center; text-align: center;">
        <div>
          <div style="font-size: 60px; margin-bottom: 20px;">❌</div>
          <div style="font-size: 18px; margin-bottom: 10px;">Erro ao carregar</div>
          <div style="font-size: 14px; opacity: 0.8;">Recarregue a página</div>
        </div>
      </div>
    `;
    document.body.appendChild(errorElement);
  }
};
