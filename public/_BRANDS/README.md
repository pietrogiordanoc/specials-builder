# 📦 _BRANDS Folder

## Estructura Organizada por Marca

Esta carpeta contiene **todo** organizado por marca en un solo lugar.

**📍 Ubicación:** Esta carpeta está en la **raíz del proyecto** para fácil acceso.

## 📁 Estructura

```
_BRANDS/
└── [Nombre de Marca]/
    ├── blocks/          ← Archivos JSON de configuración
    │   └── *.json
    ├── images/          ← Imágenes de productos
    │   └── *.png
    └── banners/         ← Imágenes de banners
        └── *.png
```

## ✅ Ventajas

- **Todo junto**: Bloques, imágenes y banners de una marca en un solo lugar
- **Fácil de encontrar**: En la raíz del proyecto, no escondido en public/
- **Fácil exportar**: Copia la carpeta completa para llevar a otra PC
- **Fácil actualizar**: Reemplaza archivos en una sola ubicación
- **Escalable**: Agrega nuevas marcas creando carpetas similares

## 🔄 Workflow de Trabajo

### 1. **Editar Bloques en Campaign Builder**
   - Arrastra bloques a tu campaña
   - Edita imágenes, textos, tamaños
   
### 2. **Exportar Cambios**
   - Click **"Export All Blocks"** 📦
   - Se descargan: `TC25.json`, `TC26.json`, etc.

### 3. **Actualizar Archivos**
   - **Reemplaza los archivos descargados en:**
     ```
     _BRANDS/[Nombre Marca]/blocks/
     ```

### 4. **Sincronizar con Public**
   - **Copia la carpeta actualizada:**
     ```powershell
     Copy-Item "_BRANDS" "public\_BRANDS" -Recurse -Force
     ```
   - O simplemente copia la carpeta de la marca específica

### 5. **Listo!**
   - Recarga el navegador para ver cambios
   - Tus ediciones están guardadas

## 📝 Cómo agregar una nueva marca

1. **Crea la estructura:**
   ```bash
   mkdir "_BRANDS/Nueva Marca/blocks"
   mkdir "_BRANDS/Nueva Marca/images"
   mkdir "_BRANDS/Nueva Marca/banners"
   ```

2. **Agrega tus archivos:**
   - Coloca los JSON en `blocks/`
   - Coloca las imágenes de productos en `images/`
   - Coloca los banners en `banners/`

3. **Actualiza las rutas en los JSON:**
   ```json
   {
     "imageSrc": "/_BRANDS/Nueva Marca/images/producto.png"
   }
   ```

4. **Registra en src/data/library.json:**
   ```json
   {
     "id": "nueva-marca",
     "name": "Nueva Marca",
     "blockFiles": [
       "Nueva Marca/blocks/producto1.json",
       "Nueva Marca/blocks/producto2.json"
     ]
   }
   ```

5. **Sincroniza con public:**
   ```powershell
   Copy-Item "_BRANDS" "public\_BRANDS" -Recurse -Force
   ```

## 💾 Para llevar a otra PC

Simplemente copia estas carpetas:
- `_BRANDS/` (todo tu contenido)
- `public/_BRANDS/` (ya sincronizado)
- `src/data/library.json`

¡Y listo! Todo funcionará igual en la otra PC.
