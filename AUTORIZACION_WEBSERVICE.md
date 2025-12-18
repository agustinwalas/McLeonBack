# GUÍA DE AUTORIZACIÓN DE WEB SERVICE AFIP

## 📋 Pasos para autorizar el web service

### 1. **Editar el archivo `authorize-afip-webservice.js`**

Abre el archivo y completa los datos:

```javascript
const CONFIG = {
    // ...otros datos...
    
    // ⚠️ CAMBIAR ESTA LÍNEA:
    password: "TU_CONTRASEÑA_AFIP_AQUI",
    
    // Por tu contraseña real de AFIP (Clave Fiscal):
    password: "tu_contraseña_real",
};
```

### 2. **Ejecutar el script**

```bash
node authorize-afip-webservice.js
```

### 3. **Verificar el resultado**

Si todo sale bien, verás:
```
✅ AUTORIZACIÓN COMPLETADA EXITOSAMENTE
🎉 ¡EL WEB SERVICE FUE AUTORIZADO CORRECTAMENTE!
```

---

## 🔧 Servicios web disponibles para autorizar

- **`wsfe`** - Facturación Electrónica (REQUERIDO)
- **`ws_sr_padron_a13`** - Consulta de padrón
- **`wsfex`** - Facturación Exportación

Para autorizar otro servicio, cambia la línea:
```javascript
service: "wsfe"  // Cambiar por el servicio deseado
```

---

## ❌ Errores comunes

### Error: "Contraseña incorrecta"
- Verifica tu Clave Fiscal de AFIP
- Asegúrate de no tener espacios extras

### Error: "CUIT sin permisos"
- Verifica que el CUIT tenga acceso al servicio
- Si administrás una sociedad, usa tu CUIT personal en `username`

### Error: "Access token inválido"
- Verifica el `AFIP_ACCESS_TOKEN` en tu archivo `.env`
- El token debe ser válido y no estar expirado

### Error: "Ya autorizado"
- El servicio ya está autorizado, no es necesario hacerlo nuevamente
- Puedes probar directamente con el endpoint de test

---

## ✅ Después de autorizar

1. **Reinicia el servidor backend**
   ```bash
   npm run dev
   ```

2. **Prueba la conexión AFIP**
   ```bash
   GET http://localhost:5000/api/afip/test
   ```

3. **Si funciona**, verás una respuesta como:
   ```json
   {
     "success": true,
     "message": "Conexión y autenticación con AFIP exitosa"
   }
   ```

---

## 🔐 Seguridad

**⚠️ IMPORTANTE:** 
- NO subas el archivo con la contraseña a Git
- La contraseña está en el `.gitignore` automáticamente
- Borra la contraseña del script después de usarlo

---

## 📞 Soporte

Si tienes problemas:
1. Revisa los logs del script
2. Verifica en el portal de AFIP que el certificado esté activo
3. Contacta al soporte de AFIP: 0810-999-2347
