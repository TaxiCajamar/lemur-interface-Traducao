// browser-detector.js - VERSÃO CORRIGIDA
console.log('🎯 DETECTOR: Iniciado - REDIRECIONANDO AGORA!');

// PARA tudo e redireciona IMEDIATAMENTE
const pagina = window.location.pathname.split('/').pop();

if (pagina === 'receiver.html') {
    console.log('🔄 Redirecionando para versão Safari...');
    
    // Para TODOS os outros scripts
    window.stop(); // ⬅️ PARA o carregamento da página
    
    // Redireciona
    window.location.href = 'safari-version/safari-receiver.html' + window.location.search;
}
