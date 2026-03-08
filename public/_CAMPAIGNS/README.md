# 📁 _CAMPAIGNS Folder

## Campañas Guardadas

Esta carpeta contiene tus campañas guardadas.

**📍 Ubicación:** Esta carpeta está en la **raíz del proyecto** para fácil acceso.

## 🔄 Workflow

### 1. **Exportar Campaña**
   - En Campaign Builder, haz click en **"💾 Export Campaign"**
   - Se descargará un archivo JSON (ej: `sotw-2026-03-08.json`)

### 2. **Guardar Campaña**
   - Copia el archivo descargado a `_CAMPAIGNS/`
   - El nombre del archivo aparecerá en el dropdown

### 3. **Registrar en el Índice**
   - Abre `_CAMPAIGNS/campaigns.json`
   - Agrega el nombre del archivo a la lista:
   ```json
   {
     "campaigns": [
       "sotw-2026-03-08.json",
       "nueva-campana.json"
     ]
   }
   ```

### 4. **Cargar Campaña**
   - En Campaign Builder, usa el dropdown **"📁 Saved Campaigns"**
   - Selecciona tu campaña
   - ¡Listo! Los bloques se cargarán automáticamente

## 📝 Formato de Campaña

```json
{
  "name": "SOTW - 2026-03-08",
  "blockIds": [
    "TC25",
    "TC26",
    "TC28"
  ],
  "exportedAt": "2026-03-08T14:30:00.000Z"
}
```

**Nota:** Las campañas guardan solo IDs de bloques (referencias), no el contenido completo. Los bloques se cargan desde `_BRANDS/`.
