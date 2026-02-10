# 📄 Sistema de Generación de PDFs Premium

Sistema mejorado de generación de reportes PDF con diseño premium y fuentes personalizadas.

## 🎨 Mejoras Implementadas

### 1. **Fuentes Personalizadas Embebidas**
- ✅ **Plus Jakarta Sans** (la misma fuente de la aplicación)
- ✅ Fuentes embebidas en base64 para máxima compatibilidad
- ✅ Sin dependencias externas (Google Fonts CDN)
- ✅ Pesos incluidos: 400 (Regular), 600 (SemiBold), 700 (Bold), 900 (Black)

**Ubicación:** `src/assets/fonts/` y `src/reports/shared/fontStyles.ts`

### 2. **Sistema de Diseño Premium**
- ✅ Paleta de colores alineada con la aplicación
  - Primary: `#4f46e5` (indigo)
  - Accent: `#06b6d4` (cyan)
  - Highlight: `#d946ef` (fuchsia)
- ✅ Gradientes sutiles en cards y headers
- ✅ Sombras premium con profundidad
- ✅ Bordes redondeados consistentes
- ✅ Espaciado uniforme usando escala Tailwind

**Módulo:** `src/reports/shared/premiumStyles.ts`

### 3. **Optimización de Puppeteer**
- ✅ Viewport aumentado a 1920x1080 para mejor calidad
- ✅ Emulación de media print para renderizado óptimo
- ✅ Espera explícita de carga de fuentes (`document.fonts.ready`)
- ✅ Múltiples estrategias de espera (`networkidle0`, `load`, `domcontentloaded`)
- ✅ Font hinting deshabilitado para mejor renderizado

### 4. **Reportes Actualizados**
Todos los reportes ahora usan el sistema de diseño premium:
- ✅ Reporte CAAS individual (`renderCaasReportHtml`)
- ✅ Reporte INAPV individual (`renderInapvReportHtml`)
- ✅ Reporte CAAS por período (`renderCaasPeriodReportHtml`)
- ✅ Reporte INAPV por período (`renderInapvPeriodReportHtml`)

## 🏗️ Estructura de Archivos

```
src/
├── assets/
│   └── fonts/                           # Fuentes descargadas (.woff2)
│       ├── plus-jakarta-sans-v12-latin-regular.woff2
│       ├── plus-jakarta-sans-v12-latin-600.woff2
│       └── plus-jakarta-sans-v12-latin-700.woff2
├── reports/
│   ├── shared/
│   │   ├── fontStyles.ts                # Fuentes embebidas en base64 (auto-generado)
│   │   └── premiumStyles.ts             # Estilos base premium
│   ├── caas/
│   │   ├── renderCaasReportHtml.ts      # Reporte individual CAAS
│   │   └── renderCaasPeriodReportHtml.ts# Reporte por período CAAS
│   └── inapv/
│       ├── renderInapvReportHtml.ts     # Reporte individual INAPV
│       └── renderInapvPeriodReportHtml.ts# Reporte por período INAPV
├── scripts/
│   └── generateFontBase64.ts            # Script para convertir fuentes a base64
└── services/
    ├── generatePdfFromHtml.service.ts   # Servicio base optimizado
    ├── generateCaasPdfBuffer.service.ts # Servicio CAAS optimizado
    └── generateInapvPdfBuffer.service.ts# Servicio INAPV optimizado
```

## 🔄 Regenerar Fuentes

Si necesitas actualizar las fuentes o agregar nuevos pesos:

1. Descarga las fuentes en formato `.woff2` a `src/assets/fonts/`
2. Actualiza el array `fonts` en `src/scripts/generateFontBase64.ts`
3. Ejecuta el script de generación:
   ```bash
   npx tsx src/scripts/generateFontBase64.ts
   ```

Esto regenerará automáticamente `src/reports/shared/fontStyles.ts` con las fuentes en base64.

## 🎯 Variables CSS Disponibles

El módulo `premiumStyles.ts` exporta las siguientes variables CSS:

### Tipografía
- `--font-primary`: Plus Jakarta Sans + fallbacks

### Colores
- `--color-primary`, `--color-primary-light`
- `--color-accent`, `--color-highlight`
- `--color-success`, `--color-warning`, `--color-danger`, `--color-info`
- `--color-bg`, `--color-fg`, `--color-muted`
- `--color-border`, `--color-surface`, `--color-surface-2`, `--color-surface-3`

### Sombras
- `--shadow-sm`, `--shadow-md`, `--shadow-lg`, `--shadow-xl`
- `--shadow-premium`: Sombra especial para elementos destacados

### Bordes
- `--radius-sm` (8px), `--radius-md` (14px), `--radius-lg` (20px), `--radius-xl` (24px)

### Espaciado
- `--space-1` (4px) hasta `--space-10` (40px)

## 📝 Ejemplo de Uso

```typescript
import { PREMIUM_BASE_STYLES } from "../shared/premiumStyles.js";

const customStyles = `
/* Tus estilos específicos aquí */
.custom-element {
  background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-accent) 100%);
  border-radius: var(--radius-lg);
  padding: var(--space-5);
  box-shadow: var(--shadow-premium);
}
`;

const html = `
<!DOCTYPE html>
<html>
<head>
  <style>
${PREMIUM_BASE_STYLES}
${customStyles}
  </style>
</head>
<body>
  <!-- Tu contenido aquí -->
</body>
</html>
`;
```

## ✨ Componentes Premium Predefinidos

### Cards
```html
<div class="card">Contenido básico</div>
<div class="card-premium">Contenido premium con gradiente</div>
```

### Badges
```html
<span class="badge">Normal</span>
<span class="badge badge-primary">Primary</span>
<span class="badge badge-accent">Accent</span>
<span class="badge badge-success">Success</span>
```

### Estadísticas
```html
<div class="stat-box">
  <div class="stat-value">98%</div>
  <div class="stat-label">Aprobación</div>
</div>
```

### Barras de Progreso
```html
<div class="progress-bar">
  <div class="progress-fill" style="width: 75%; background: var(--color-success);">
    75%
  </div>
</div>
```

### Notas/Alertas
```html
<div class="note">Nota general</div>
<div class="note note-info">Información</div>
<div class="note note-success">Éxito</div>
<div class="note note-warning">Advertencia</div>
```

## 🖨️ Optimización para Impresión

Los estilos incluyen automáticamente:
- ✅ `print-color-adjust: exact` para colores precisos
- ✅ Eliminación de sombras en impresión (opcional por componente)
- ✅ `break-inside: avoid` para prevenir cortes en elementos
- ✅ Clases utilitarias `.avoid-break` y `.page-break`

## 📊 Rendimiento

- **Tamaño de fuentes embebidas:** ~36KB (comprimido en base64)
- **Tiempo de carga de fuentes:** Instantáneo (sin red)
- **Compatibilidad:** 100% offline, sin dependencias externas
- **Calidad de renderizado:** Optimizada con viewport 1920x1080

## 🎨 Futuras Mejoras

Posibles mejoras futuras:
- [ ] Tema oscuro para PDFs (si se requiere)
- [ ] Fuentes variable para reducir tamaño
- [ ] Componentes adicionales (tablas, gráficos, etc.)
- [ ] Soporte para múltiples idiomas en fuentes
- [ ] Plantillas pre-diseñadas adicionales

---

**Última actualización:** Febrero 2026
**Mantenedor:** Portal Vocacional Team
