# 🚀 Configuración AFIP para Producción

## Problema
Los certificados AFIP no se suben a GitHub por seguridad y no están disponibles en producción.

## ✅ Solución Implementada

El código ahora soporta **dos métodos** para cargar certificados:

### 1. **Archivos locales** (Desarrollo)
```env
AFIP_CERT_PATH=./certificates/cert.crt
AFIP_KEY_PATH=./certificates/private.key
AFIP_CUIT=30719099730
```

### 2. **Variables de entorno** (Producción) ⭐
```env
AFIP_CERT_CONTENT=-----BEGIN CERTIFICATE-----\nMIID...tu certificado completo...\n-----END CERTIFICATE-----
AFIP_KEY_CONTENT=-----BEGIN PRIVATE KEY-----\nMIIE...tu clave privada completa...\n-----END PRIVATE KEY-----
AFIP_CUIT=30719099730
```

## 🔧 Configuración en tu Plataforma de Hosting

### **Vercel / Netlify / Railway / etc.**

1. Ve a la configuración de variables de entorno de tu proyecto
2. Agrega estas variables:

```bash
# Certificado AFIP (contenido completo)
AFIP_CERT_CONTENT=-----BEGIN CERTIFICATE-----
MIIDXzCCAkegAwIBAgIJAK...
[contenido del certificado]
...K8wRQIhAP7Q==
-----END CERTIFICATE-----

# Clave privada AFIP (contenido completo)  
AFIP_KEY_CONTENT=-----BEGIN PRIVATE KEY-----
MIIEvQIBADANBgkqhkiG9w0...
[contenido de la clave privada]
...Qrx2zK8wRQIhAP7Q==
-----END PRIVATE KEY-----

# CUIT de tu empresa
AFIP_CUIT=30719099730

# Ambiente (testing/production)
AFIP_ENVIRONMENT=production
```

## 📋 Cómo obtener el contenido de los certificados

### **Método 1: Desde archivos locales**
```bash
# Ver contenido del certificado
cat certificates/cert.crt

# Ver contenido de la clave privada
cat certificates/private.key
```

### **Método 2: Usar script Node.js**
```javascript
// scripts/get-cert-content.js
const fs = require('fs');

const certContent = fs.readFileSync('./certificates/cert.crt', 'utf8');
const keyContent = fs.readFileSync('./certificates/private.key', 'utf8');

console.log('AFIP_CERT_CONTENT:');
console.log(certContent);
console.log('\nAFIP_KEY_CONTENT:');
console.log(keyContent);
```

## ⚠️ Importante

1. **Nunca commits los certificados** al repositorio
2. **Copia el contenido exacto** incluyendo los headers `-----BEGIN` y `-----END`
3. **Mantén los saltos de línea** (el código los maneja automáticamente)
4. **Usa comillas dobles** al pegar en las variables de entorno

## 🧪 Variables completas de ejemplo

```env
# === AFIP Configuration ===
AFIP_CUIT=30719099730
AFIP_ENVIRONMENT=production
AFIP_MOCK_MODE=false

# Certificados (usa UNO de estos dos métodos)
# Método 1: Archivos (desarrollo)
AFIP_CERT_PATH=./certificates/cert.crt
AFIP_KEY_PATH=./certificates/private.key

# Método 2: Contenido (producción) - REEMPLAZA con tus certificados reales
AFIP_CERT_CONTENT=-----BEGIN CERTIFICATE-----\nMIID...contenido...\n-----END CERTIFICATE-----
AFIP_KEY_CONTENT=-----BEGIN PRIVATE KEY-----\nMIIE...contenido...\n-----END PRIVATE KEY-----
```

## 🚀 Resultado

Una vez configurado, el sistema:
- ✅ Funcionará en desarrollo con archivos locales
- ✅ Funcionará en producción con variables de entorno
- ✅ Mostrará logs informativos sobre qué método está usando
- ✅ Validará el formato de los certificados automáticamente
