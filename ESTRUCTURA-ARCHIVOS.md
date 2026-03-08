# 📂 Estructura de Archivos y Base de Datos - Specials Builder

## Resumen del Sistema

El sistema ahora funciona como una **base de datos JSON** donde:
- ✅ Cada bloque es un archivo JSON individual
- ✅ Todo está organizado por marca en una sola carpeta
- ✅ Las campañas guardan solo IDs (referencias), no contenido completo
- ✅ JSON de campañas es ligero y rápido
- ✅ Fácil de exportar y mover entre PCs

---

## 📁 Estructura de Carpetas (Nueva Organización)

### Todo por Marca (_BRANDS/)
```
public/_BRANDS/
└── Delizie Di Calabria/         ← Una carpeta por marca
    ├── banner-01.json           ← Archivos JSON de bloques
    ├── TC25.json
    ├── TC26.json
    ├── TC28.json
    ├── TC29.json
    ├── TC25.png                 ← Imágenes de productos
    ├── TC26.png
    ├── TC28.png
    ├── TC29.png
    └── _banner-01.png           ← Banners de marca
```

**✅ Ventajas de esta estructura:**
- Todo de una marca está junto en una sola carpeta
- Sin subcarpetas - estructura plana y simple
- Fácil copiar/pegar archivos exportados directamente aquí
- Escalable para múltiples marcas
- Sin sincronización - trabaja directamente en public/

### Ejemplo de archivo de bloque (`TC25.json`):
```json
{
  "id": "TC25",
  "title": "Delizie Di Calabria Cherry Peppers With Pecorino Cheese 270 gr.",
  "sku": "TC25",
  "imageSrc": "/_BRANDS/Delizie Di Calabria/TC25.png",
  "imageOffsetY": -36,
  "imageOffsetX": -20,
  "imageScale": 1.05,
  "price": "$6.50/ea. $78.00/cs.",
  "packSize": "12/9.87 oz.",
  "description": "Delizie di Calabria Cherry Peppers...",
  "template": "zig_product",
  "visible": true
}
```

---

## 🗂️ Índice de Librería (src/data/library.json)

Este archivo es el **índice maestro** que lista todas las marcas y sus bloques:

```json
{
  "brands": [
    {
      "id": "delizie",
      "name": "Delizie Di Calabria",
      "blockFiles": [
        "delizie-di-calabria/banner-01.json",
        "delizie-di-calabria/TC25.json",
        "delizie-di-calabria/TC26.json",
        "delizie-di-calabria/TC28.json",
        "delizie-di-calabria/TC29.json"
      ]
    }
  ]
}
```

**Función:**
- Lista qué archivos JSON pertenecen a cada marca
- Se carga al iniciar la aplicación
- Es ligero (solo rutas, no contenido)

---

## 💾 Formato de Campañas

### Archivo exportado (.json)

Las campañas ahora se guardan así:

```json
{
  "name": "SOTW - 2026-03-08",
  "blockIds": [
    "TC25",
    "delizie-banner-01",
    "TC26",
    "TC28"
  ],
  "exportedAt": "2026-03-08T10:30:00.000Z"
}
```

**Ventajas:**
- ✅ **Ligero**: Solo IDs, no contenido completo
- ✅ **Rápido**: Archivo pequeño (<1KB en lugar de 50KB+)
- ✅ **Sincronizado**: Si cambias un bloque, todas las campañas usan la última versión
- ✅ **Sin duplicación**: Contenido de bloques existe solo una vez

### LocalStorage (auto-guardado)

El navegador guarda automáticamente:
```json
{
  "name": "SOTW - 2026-03-08",
  "blockIds": ["TC25", "TC26", "TC28"]
}
```

---

## 🔄 Cómo Funciona el Sistema

### 1. Al Iniciar la App

```
1. Cargar library.json
   ↓
2. Por cada marca, cargar sus blockFiles
   ↓
3. Guardar bloques en cache (blockCache Map)
   ↓
4. Mostrar bloques en sidebar derecho
   ↓
5. Si hay campaña guardada, cargar bloques por ID desde cache
```

### 2. Al Arrastrar un Bloque

```
1. Usuario arrastra TC25 desde sidebar
   ↓
2. Se busca bloque en cache por ID
   ↓
3. Se crea copia con nuevo ID único
   ↓
4. Se agrega a campaña (centro)
   ↓
5. Auto-save guarda solo IDs en localStorage
```

### 3. Al Guardar Campaña

```
1. Usuario hace clic en "Save to File"
   ↓
2. Se extraen solo los IDs de los bloques: blocks.map(b => b.id)
   ↓
3. Se crea objeto: { name, blockIds, exportedAt }
   ↓
4. Se exporta como JSON (archivo ligero)
```

### 4. Al Cargar Campaña

```
1. Usuario importa archivo JSON
   ↓
2. Se lee array de blockIds
   ↓
3. Por cada ID, se busca bloque en blockCache
   ↓
4. Se crean copias de bloques con IDs únicos
   ↓
5. Se renderiza campaña completa
```

---

## ➕ Agregar Nueva Marca

### Paso 1: Crear Carpeta de la Marca
```bash
mkdir "public\_BRANDS\Nueva Marca"
```

### Paso 2: Agregar Archivos
Todos los archivos van directamente en la carpeta de la marca:
```
public/_BRANDS/Nueva Marca/
├── SKU1.json
├── SKU2.json
├── SKU1.png
├── SKU2.png
└── _banner.png
```

### Paso 3: Crear Archivos JSON
**Ejemplo:** `public/_BRANDS/Nueva Marca/SKU1.json`
```json
{
  "id": "SKU1",
  "title": "Nombre del Producto",
  "sku": "SKU1",
  "imageSrc": "/_BRANDS/Nueva Marca/SKU1.png",
  "imageOffsetY": 0,
  "imageOffsetX": 0,
  "imageScale": 1.0,
  "price": "$5.00/ea.",
  "packSize": "12/10 oz.",
  "description": "Descripción del producto...",
  "template": "zig_product",
  "visible": true
}
```

### Paso 4: Actualizar library.json
```json
{
  "brands": [
    {
      "id": "delizie",
      "name": "Delizie Di Calabria",
      "blockFiles": ["..."]
    },
    {
      "id": "nueva-marca",
      "name": "Nueva Marca",
      "blockFiles": [
        "Nueva Marca/SKU1.json",
        "Nueva Marca/SKU2.json",
        "Nueva Marca/banner.json"
      ]
    }
  ]
}
```

### Paso 5: Sincronizar con public/
```bash
.\sync-brands.ps1
```

### Paso 6: Reiniciar Servidor
```bash
npm run dev
```

---

## 🔧 Cache de Bloques (blockCache)

El sistema mantiene un **Map** en memoria con todos los bloques cargados:

```typescript
const blockCache: Map<string, Block> = new Map();

// Ejemplo de contenido:
// "TC25" → { id: "TC25", title: "...", imageSrc: "...", ... }
// "TC26" → { id: "TC26", title: "...", imageSrc: "...", ... }
// "delizie-banner-01" → { id: "delizie-banner-01", bannerImage: "...", ... }
```

**Ventajas:**
- ⚡ **Rápido**: No necesita recargar JSON cada vez
- 💾 **Eficiente**: Carga solo una vez
- 🔄 **Consistente**: Todas las campañas usan la misma referencia

---

## 📊 Comparación: Antes vs Después

### ANTES ❌
```json
{
  "name": "Campaign",
  "blocks": [
    {
      "id": "1",
      "title": "Product 1",
      "sku": "TC25",
      "imageSrc": "/images/products/tc25.png",
      "description": "Long description text here...",
      "price": "$6.50/ea. $78.00/cs.",
      "packSize": "12/9.87 oz.",
      "imageOffsetY": -36,
      "imageOffsetX": -20,
      "imageScale": 1.05,
      "template": "zig_product",
      "visible": true
    },
    // ... 20 bloques más = ~50KB
  ]
}
```
**Problema:** JSON gigante, duplicación de datos

### DESPUÉS ✅
```json
{
  "name": "Campaign",
  "blockIds": ["TC25", "TC26", "TC28", "delizie-banner-01"],
  "exportedAt": "2026-03-08T10:30:00.000Z"
}
```
**Ventaja:** JSON ligero (~1KB), sin duplicación

---

## 🚀 Beneficios del Nuevo Sistema

1. **Campañas Ligeras**: Archivos JSON de <1KB en lugar de 50KB+
2. **Sin Duplicación**: Cada bloque existe una sola vez en el código
3. **Fácil Actualización**: Cambias un bloque → se actualiza en todas las campañas
4. **Escalable**: Puedes tener 100+ campañas sin problemas
5. **Organizado**: Cada marca tiene su carpeta independiente
6. **Rápido**: Cache en memoria = carga instantánea
7. **Versionado**: Fácil de rastrear cambios en Git (archivos pequeños)

---

## 🆘 Resolución de Problemas

### Bloques no aparecen en sidebar
**Causa:** Archivos JSON no se cargaron correctamente
**Solución:** 
1. Verifica que los archivos existen en `public/_BRANDS/[Marca]/`
2. Verifica que `library.json` tiene las rutas correctas
3. Abre la consola del navegador para ver errores

### Imágenes no se ven
**Causa:** Ruta incorrecta en el JSON del bloque
**Solución:**
- Verifica que `imageSrc` o `bannerImage` apunta a `/_BRANDS/[Marca]/[archivo].png`
- Verifica que el archivo existe en `public/_BRANDS/[Marca]/`

### Campaña importada aparece vacía
**Causa:** blockCache aún no tiene los bloques cargados
**Solución:**
- Espera 1-2 segundos después de iniciar la app
- Los bloques se cargan asíncronamente al inicio

---

## 📝 Notas Importantes

- **IDs Únicos**: Cada vez que arrastras un bloque, se crea con un ID único generado (`block-[timestamp]-[random]`)
- **ID Original Preservado**: El SKU o ID original del bloque se mantiene para referencia
- **Backwards Compatible**: El sistema aún puede cargar campañas viejas con formato completo
- **Auto-save**: Cada cambio guarda automáticamente en localStorage
- **Formato Exportación**: Los archivos exportados usan el nuevo formato ligero

---

¡El sistema ahora funciona como una verdadera base de datos JSON! 🎉
