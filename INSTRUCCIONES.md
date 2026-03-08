# 🚀 Guía de Instalación y Ejecución - Specials Builder

## Requisitos Previos
- Node.js (versión 16 o superior) - [Descargar aquí](https://nodejs.org/)
- npm (viene incluido con Node.js)

## Pasos para Iniciar la Aplicación

### 1. Abrir Terminal en el Proyecto
```bash
cd c:\Users\pietr\OneDrive\Desktop\specials-builder
```

### 2. Instalar Dependencias (solo la primera vez)
```bash
npm install
```
Este comando descargará todas las librerías necesarias (React, TypeScript, Vite, html2canvas, etc.)

### 3. Iniciar el Servidor de Desarrollo
```bash
npm run dev
```

### 4. Abrir en el Navegador
Después de ejecutar `npm run dev`, verás un mensaje similar a:
```
  VITE v6.0.5  ready in 500 ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

Abre tu navegador en: **http://localhost:5173**

---

## 🎯 Comandos Útiles

| Comando | Descripción |
|---------|-------------|
| `npm run dev` | Inicia servidor de desarrollo con hot reload |
| `npm run build` | Compila para producción (carpeta `dist/`) |
| `npm run preview` | Previsualiza la versión compilada |
| `npm run lint` | Revisa errores de código |

---

## 🎨 Cómo Usar la Aplicación

### Modos de Trabajo

1. **✏️ Edit Mode (Azul)**
   - Arrastra bloques desde la librería (derecha) a la campaña (centro)
   - Reorganiza bloques arrastrándolos dentro de la campaña
   - Doble clic en cualquier bloque para editar su contenido
   - Usa el botón ❌ para eliminar bloques

2. **👁️ Preview Mode (Verde)**
   - Vista previa limpia sin controles de edición
   - Ideal para ver cómo se verá la campaña final

3. **✂️ Slice Mode (Naranja)**
   - Dibuja rectángulos sobre la campaña para crear "slices"
   - Cada slice se puede exportar como imagen PNG
   - Edita los nombres de los slices en el panel izquierdo
   - Haz clic en "📥 Export All Slices" para descargar todas las imágenes

### Exportación de Imágenes

**¿Por qué usar slices?**
- Los emails no soportan HTML complejo
- Las imágenes son más confiables en clientes de email
- Puedes dividir la campaña en secciones específicas

**Proceso:**
1. Cambia a modo **✂️ Slice**
2. Haz clic y arrastra para dibujar un rectángulo sobre el área que quieres exportar
3. Repite para crear más slices
4. En el panel izquierdo, edita los nombres (ej: "header", "producto-1", "footer")
5. Clic en **"Export All Slices"**
6. Se descargarán archivos PNG: `[nombre-campaña]-[nombre-slice].png`

### Guardar y Cargar Campañas

- **Save to File**: Exporta la campaña completa como JSON
- **Open from File**: Carga una campaña previamente guardada
- **Auto-save**: La campaña se guarda automáticamente en el navegador

---

## ❗ Solución de Problemas

### El comando `npm` no se reconoce
- **Problema**: Node.js no está instalado
- **Solución**: Descarga e instala Node.js desde https://nodejs.org/

### Error: "Cannot find module"
- **Problema**: Dependencias no instaladas
- **Solución**: Ejecuta `npm install` nuevamente

### El puerto 5173 está ocupado
- **Problema**: Otra aplicación usa ese puerto
- **Solución**: Vite asignará automáticamente otro puerto (ej: 5174). Checa el mensaje en la terminal.

### Cambios no se reflejan en el navegador
- **Problema**: Cache del navegador
- **Solución**: 
  - Presiona `Ctrl + Shift + R` (Windows) para refrescar sin cache
  - O cierra y vuelve a ejecutar `npm run dev`

---

## 📦 Stack Tecnológico

- **React 18**: Framework UI
- **TypeScript**: Tipado estático
- **Vite**: Build tool y dev server rápido
- **html2canvas**: Captura de pantalla para exportar PNG
- **LocalStorage**: Persistencia de datos en el navegador

---

## 🆘 Ayuda Adicional

Si tienes problemas:
1. Verifica que Node.js esté instalado: `node --version`
2. Verifica que npm funcione: `npm --version`
3. Borra `node_modules` y reinstala: 
   ```bash
   rm -rf node_modules
   npm install
   ```
4. Borra cache de Vite:
   ```bash
   npm run dev -- --force
   ```

---

## 🎉 ¡Listo para Empezar!

Ya puedes ejecutar:
```bash
npm run dev
```

Y abrir http://localhost:5173 en tu navegador.
