// /js/qr-code-utils.js
export class QRCodeGenerator {
  static generate(containerId, text, size = 150) {
    return new QRCode(document.getElementById(containerId), {
      text,
      width: size,
      height: size,
      colorDark: "#000000",
      colorLight: "#ffffff",
    });
  }
}

export class QRCodeScanner {
  static start(containerId, onScan) {
    const qrScanner = new Html5QrcodeScanner(containerId, { 
      fps: 10, 
      qrbox: 250 
    });
    qrScanner.render(onScan);
    return qrScanner; // Para controle externo se necessário
  }
}
