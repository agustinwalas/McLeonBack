// Script de prueba para verificar variables de entorno
require('dotenv').config();

console.log('=== VARIABLES DE ENTORNO AFIP ===');
console.log('AFIP_CUIT:', process.env.AFIP_CUIT);
console.log('AFIP_CERT_PATH:', process.env.AFIP_CERT_PATH);
console.log('AFIP_KEY_PATH:', process.env.AFIP_KEY_PATH);
console.log('AFIP_ENVIRONMENT:', process.env.AFIP_ENVIRONMENT);
console.log('AFIP_ACCESS_TOKEN:', process.env.AFIP_ACCESS_TOKEN ? 'CONFIGURADO' : 'NO CONFIGURADO');
console.log('NODE_ENV:', process.env.NODE_ENV);

// Verificar archivos
const fs = require('fs');
const path = require('path');

if (process.env.AFIP_CERT_PATH) {
    const certPath = path.resolve(process.env.AFIP_CERT_PATH);
    console.log('Certificado existe:', fs.existsSync(certPath), '- Ruta:', certPath);
}

if (process.env.AFIP_KEY_PATH) {
    const keyPath = path.resolve(process.env.AFIP_KEY_PATH);
    console.log('Clave privada existe:', fs.existsSync(keyPath), '- Ruta:', keyPath);
}