# Script para sincronizar _BRANDS con public/_BRANDS
# Ejecuta esto después de actualizar archivos en _BRANDS

Write-Host "🔄 Sincronizando _BRANDS con public/_BRANDS..." -ForegroundColor Cyan

# Eliminar carpeta existente en public
if (Test-Path "public\_BRANDS") {
    Remove-Item "public\_BRANDS" -Recurse -Force
    Write-Host "✓ Carpeta anterior eliminada" -ForegroundColor Green
}

# Copiar carpeta actualizada
Copy-Item "_BRANDS" "public\_BRANDS" -Recurse -Force
Write-Host "✓ Carpeta sincronizada exitosamente" -ForegroundColor Green

Write-Host ""
Write-Host "✅ ¡Listo! Recarga el navegador para ver los cambios." -ForegroundColor Green
