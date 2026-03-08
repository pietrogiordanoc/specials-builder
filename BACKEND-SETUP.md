# Backend Setup - Sistema Automático de Bloques

## 🎉 ¡Sistema Implementado!

Ahora puedes guardar bloques automáticamente sin necesidad de editar archivos manualmente.

---

## 🚀 Cómo Usar

### 1. Iniciar el Sistema

Abre una terminal en la carpeta del proyecto y ejecuta:

```bash
npm run dev
```

Esto iniciará:
- ✅ **Backend Server** en `http://localhost:3001`
- ✅ **Vite Dev Server** en `http://localhost:5173`

Verás en la consola:
```
🚀 Backend server running on http://localhost:3001
📁 Serving files from: C:\Users\pietr\OneDrive\Desktop\specials-builder

VITE v6.0.5  ready in XXX ms
➜  Local:   http://localhost:5173/
```

### 2. Guardar un Bloque Nuevo

1. **Edita un bloque** en el canvas (cambia texto, precio, tamaño, etc.)
2. **Click en 💾** (botón "Save" al lado izquierdo del bloque)
3. **Rellena el formulario:**
   - **Brand Name:** Nombre de la marca (e.g., "Viani", "Delizie Di Calabria")
   - **Block ID/SKU:** Identificador único (e.g., "MP113", "TC30")
   - **Image Filename:** Se auto-completa si subes imagen
   - **Upload Image:** Selecciona la imagen PNG del producto

4. **Click en "Save Block"**

¡Listo! El sistema:
- ✅ Guarda el JSON en `_BRANDS/[Marca]/`
- ✅ Sube la imagen automáticamente
- ✅ Actualiza `library.json` automáticamente

### 3. Ver el Bloque Nuevo

Recarga la página (F5) y verás tu bloque en la biblioteca lateral.

---

## 🔧 API Endpoints Disponibles

El backend expone estos endpoints:

### `POST /api/blocks`
Guarda un bloque nuevo

**Body:**
```json
{
  "brandName": "Viani",
  "blockId": "MP113",
  "blockData": {
    "id": "MP113",
    "title": "Producto...",
    "sku": "MP113",
    ...
  }
}
```

### `POST /api/images`
Sube una imagen

**FormData:**
- `image`: archivo PNG/JPG
- `brandName`: nombre de la marca

### `GET /api/brands`
Lista todas las marcas automáticamente desde `_BRANDS/`

### `POST /api/library/refresh`
Regenera `library.json` escaneando todas las carpetas en `_BRANDS/`

---

## ⚙️ Comandos Disponibles

```bash
# Iniciar todo (recomendado)
npm run dev

# Solo servidor backend
npm run server

# Solo Vite (frontend)
npm run client

# Build para producción
npm run build
```

---

## 🐛 Troubleshooting

### El backend no inicia
**Error:** `EADDRINUSE: address already in use :::3001`

**Solución:** Mata el proceso usando el puerto 3001:
```bash
# Windows
netstat -ano | findstr :3001
taskkill /PID [PID] /F

# O cambia el puerto en server.js (línea 11):
const PORT = 3002;  // Usar otro puerto
```

### No se guardan los bloques
**Error:** `Failed to save block`

**Verificar:**
1. ¿El servidor backend está corriendo? Busca el mensaje "🚀 Backend server running"
2. ¿Hay errores en la consola del navegador? (F12 → Console)
3. ¿Tienes permisos de escritura en la carpeta `_BRANDS/`?

### La imagen no se sube
**Error:** `Failed to upload image`

**Verificar:**
1. ¿El archivo es PNG o JPG?
2. ¿El tamaño es menor a 10MB?
3. ¿El nombre del archivo no tiene caracteres especiales?

---

## 📁 Estructura de Archivos

```
specials-builder/
├── server.js                    ← Backend Express
├── _BRANDS/                     ← Bloques guardados aquí
│   ├── Delizie Di Calabria/
│   │   ├── TC25.json
│   │   ├── TC25.png
│   │   └── ...
│   └── Viani/
│       ├── MP113.json
│       └── MP113.png
├── src/
│   ├── data/
│   │   └── library.json         ← Auto-actualizado por backend
│   └── pages/
│       └── CampaignBuilder.tsx  ← Frontend con API calls
└── package.json                 ← Scripts actualizados
```

---

## 🎯 Ventajas del Sistema

✅ **Sin editar archivos manualmente** - Todo automático via API  
✅ **Sube imágenes directamente** - No necesitas moverlas  
✅ **Actualiza library.json automáticamente** - No edites JSON  
✅ **Crea marcas nuevas automáticamente** - Solo escribe el nombre  
✅ **Local y seguro** - Tus archivos permanecen en tu PC  
✅ **Hot reload** - Recarga y ve los cambios inmediatamente  

---

## 🚀 Siguiente Paso

Abre tu terminal y ejecuta:

```bash
npm run dev
```

¡Empieza a guardar bloques automáticamente! 🎉
