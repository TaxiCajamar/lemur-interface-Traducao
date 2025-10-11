// browser-detector.js - VERSÃO SUPER PODEROSA
console.log('🎯 DETECTOR: Versão Super Poderosa ativada!');

// Método MAIS EFICAZ para Safari
function redirecionarParaSafari() {
    const pagina = window.location.pathname.split('/').pop();
    
    if (pagina === 'receiver.html') {
        console.log('🔄 REDIRECIONANDO AGORA para versão Safari!');
        
        // 🚨 MÉTODO 1: Tenta substituir a página completamente
        window.location.replace('safari-version/safari-receiver.html' + window.location.search);
        
        // 🚨 MÉTODO 2: Força recarregamento se o primeiro falhar
        setTimeout(() => {
            window.location.href = 'safari-version/safari-receiver.html' + window.location.search;
        }, 100);
        
        // 🚨 MÉTODO 3: Se tudo falhar, mostra alerta
        setTimeout(() => {
            alert('📱 Por favor, acesse a versão Safari manualmente:\n\n' + 
                  'safari-version/safari-receiver.html');
        }, 500);
    }
}

// Executa IMEDIATAMENTE
redirecionarParaSafari();
