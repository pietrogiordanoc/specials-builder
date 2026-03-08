# Specials Builder

Aplicación para construir campañas de especiales con bloques arrastrables, editor visual y exportación de slices como imágenes PNG para email marketing.

## 🚀 Inicio Rápido

### Requisitos Previos
- Node.js (versión 16 o superior)
- npm o yarn

### Instalación

1. **Clonar o abrir el proyecto:**
   ```bash
   cd specials-builder
   ```

2. **Instalar dependencias:**
   ```bash
   npm install
   ```

3. **Iniciar servidor de desarrollo:**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador:**
   - La aplicación estará disponible en: `http://localhost:5173`
   - El puerto puede variar si 5173 está ocupado (Vite mostrará el puerto correcto en la terminal)

## 📋 Scripts Disponibles

- **`npm run dev`** - Inicia el servidor de desarrollo con hot reload
- **`npm run build`** - Compila la aplicación para producción
- **`npm run preview`** - Previsualiza la versión de producción localmente
- **`npm run lint`** - Ejecuta el linter para revisar código

## 🎨 Características

- **Drag & Drop**: Arrastra bloques desde la librería a la campaña
- **Editor Visual**: Edita contenido con doble clic en modo Edit
- **Tres Modos**:
  - ✏️ **Edit**: Editar y reorganizar bloques
  - 👁️ **Preview**: Vista previa sin controles
  - ✂️ **Slice**: Crear slices para exportar como imágenes PNG
- **Exportación de Slices**: Sistema estilo Photoshop para exportar secciones específicas como PNG de alta calidad
- **Gestión de Campañas**: Guardar/cargar campañas en formato JSON

## 🛠️ Tecnologías

- React 18 con TypeScript
- Vite (bundler y dev server)
- html2canvas (exportación de imágenes)
- LocalStorage (persistencia de datos)

## 📝 Uso del Slice Tool

1. Cambia a modo **Slice** (✂️)
2. Dibuja rectángulos sobre las áreas que quieres exportar
3. Edita nombres de slices en el panel izquierdo
4. Haz clic en **"Export All Slices"** para descargar todos como PNG

Los archivos se exportan con formato: `[nombre-campaña]-[nombre-slice].png`

---

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type aware lint rules:

- Configure the top-level `parserOptions` property like this:

```js
export default tseslint.config({
  languageOptions: {
    // other options...
    parserOptions: {
      project: ['./tsconfig.node.json', './tsconfig.app.json'],
      tsconfigRootDir: import.meta.dirname,
    },
  },
})
```

- Replace `tseslint.configs.recommended` to `tseslint.configs.recommendedTypeChecked` or `tseslint.configs.strictTypeChecked`
- Optionally add `...tseslint.configs.stylisticTypeChecked`
- Install [eslint-plugin-react](https://github.com/jsx-eslint/eslint-plugin-react) and update the config:

```js
// eslint.config.js
import react from 'eslint-plugin-react'

export default tseslint.config({
  // Set the react version
  settings: { react: { version: '18.3' } },
  plugins: {
    // Add the react plugin
    react,
  },
  rules: {
    // other rules...
    // Enable its recommended rules
    ...react.configs.recommended.rules,
    ...react.configs['jsx-runtime'].rules,
  },
})
```
