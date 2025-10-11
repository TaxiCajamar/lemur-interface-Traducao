// browser-detector.js - VERSÃO SUPER SIMPLES
console.log('🎯 DETECTOR: Iniciado...');

// SEMPRE redireciona no Safari - VAMOS TESTAR!
if (true) { // ⬅️ Mude para true para TESTAR
    console.log('🔴 TESTE: REDIRECIONANDO FORÇADO!');
    
    const pagina = window.location.pathname.split('/').pop();
    
    if (pagina === 'receiver.html') {
        window.location.href = 'safari-version/safari-receiver.html' + window.location.search;
    }
}
