# 🚀 Specials Builder - Inicio Rápido

## Cómo iniciar la aplicación

### Método más fácil (Doble Click):

1. **Doble click en `START.bat`**
2. Espera 10 segundos
3. El navegador se abrirá automáticamente en http://localhost:5173

---

## Archivos de inicio:

### 📂 `START.bat`
- Inicia el servidor backend (puerto 3001)
- Inicia el servidor frontend Vite (puerto 5173)
- Abre el navegador automáticamente
- **Doble click para iniciar**

### 🛑 `STOP.bat`
- Cierra todos los servidores
- Mata todos los procesos de Node.js
- **Doble click para detener todo**

---

## Ventanas que se abren:

Cuando ejecutas `START.bat` verás 3 ventanas:

1. **Backend API (Port 3001)** - Servidor Express
   - Mensaje: `🚀 Backend server running on http://localhost:3001`
   - NO CIERRES esta ventana

2. **Frontend Vite (Port 5173)** - Servidor de desarrollo
   - Mensaje: `➜ Local: http://localhost:5173/`
   - NO CIERRES esta ventana

3. **Navegador** - Se abre automáticamente
   - URL: http://localhost:5173

---

## ⚠️ Importante:

- **NO cierres** las ventanas del backend y frontend mientras uses la app
- Para detener todo, ejecuta `STOP.bat` o cierra todas las ventanas
- Si algo falla, ejecuta `STOP.bat` y luego `START.bat` de nuevo

---

## 🔧 Alternativa manual:

Si prefieres usar PowerShell:

```bash
cd C:\Users\pietr\OneDrive\Desktop\specials-builder
npm run dev
```

Luego abre: http://localhost:5173

---

## 📖 Documentación completa:

Ver `BACKEND-SETUP.md` para más detalles técnicos.
