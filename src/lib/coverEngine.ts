
import { CATEGORIES } from '../constants';

interface TemplateConfig {
  bg: string;
  accent: string;
  icon: string;
  theme: 'dark' | 'light';
  pattern: 'geometric' | 'academic' | 'modern' | 'organic';
}

const TEMPLATES: Record<string, TemplateConfig> = {
  'Economia': { bg: '#0f172a', accent: '#22c55e', icon: '📈', theme: 'dark', pattern: 'geometric' },
  'Direito': { bg: '#1e293b', accent: '#f59e0b', icon: '⚖️', theme: 'dark', pattern: 'academic' },
  'Informática': { bg: '#020617', accent: '#3b82f6', icon: '💻', theme: 'dark', pattern: 'modern' },
  'Medicina': { bg: '#f8fafc', accent: '#ef4444', icon: '🏥', theme: 'light', pattern: 'modern' },
  'Engenharia': { bg: '#f1f5f9', accent: '#0f172a', icon: '⚙️', theme: 'light', pattern: 'geometric' },
  'História': { bg: '#451a03', accent: '#fbbf24', icon: '🏺', theme: 'dark', pattern: 'academic' },
  'Outros': { bg: '#171717', accent: '#da291c', icon: '📄', theme: 'dark', pattern: 'organic' }
};

/**
 * Calculates luminance to ensure accessible contrast
 */
function isLight(color: string): boolean {
  const hex = color.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b);
  return luminance > 160;
}

/**
 * Ensures critical fonts are loaded before canvas rendering
 */
async function loadFonts() {
  try {
    // Attempt to load Inter Black if available, otherwise fallback to system
    // In a real environment, you'd host these localy
    const font = new FontFace(
      'InterBlack', 
      'url(https://fonts.gstatic.com/s/inter/v13/UcCO3FwrR2Uv9m1fOnA.woff2)', 
      { weight: '900' }
    );
    const loadedFont = await font.load();
    document.fonts.add(loadedFont);
    return 'InterBlack';
  } catch (e) {
    console.warn('Could not load specific Inter font, falling back to sans-serif');
    return 'sans-serif';
  }
}

export async function generateCoverBlob(title: string, category: string, author: string): Promise<Blob> {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Could not get canvas context');

  canvas.width = 600;
  canvas.height = 800;

  const fontName = await loadFonts();
  const template = TEMPLATES[category] || TEMPLATES['Outros'];
  const isBgLight = isLight(template.bg);
  const textColor = isBgLight ? '#0f172a' : '#ffffff';
  const subTextColor = isBgLight ? '#475569' : '#94a3b8';

  // 1. Background Gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, template.bg);
  // Create a slightly darker version for depth
  gradient.addColorStop(1, template.bg); 
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // 2. Advanced Padrões Gráficos
  ctx.save();
  ctx.globalAlpha = 0.08;
  ctx.strokeStyle = template.accent;
  ctx.lineWidth = 1.5;
  
  if (template.pattern === 'geometric') {
    for (let i = 0; i < canvas.width + 100; i += 30) {
      ctx.beginPath();
      ctx.moveTo(i, 0);
      ctx.lineTo(i - 200, canvas.height);
      ctx.stroke();
    }
  } else if (template.pattern === 'academic') {
    for (let j = 0; j < 5; j++) {
      ctx.beginPath();
      ctx.arc(canvas.width / 2, canvas.height / 2, 200 + (j * 40), 0, Math.PI * 2);
      ctx.stroke();
    }
  } else if (template.pattern === 'organic') {
    ctx.beginPath();
    ctx.moveTo(0, 400);
    ctx.bezierCurveTo(200, 300, 400, 500, 600, 400);
    ctx.lineTo(600, 800);
    ctx.lineTo(0, 800);
    ctx.fillStyle = template.accent;
    ctx.fill();
  }
  ctx.restore();

  // 3. Layout Constants
  const layout = {
    headerHeight: 12,
    iconY: 180,
    badgeY: 240,
    titleY: 380,
    footerY: canvas.height - 80
  };

  // 4. Header Bar
  ctx.fillStyle = template.accent;
  ctx.fillRect(0, 0, canvas.width, layout.headerHeight);

  // 5. Icon
  ctx.font = '85px serif';
  ctx.textAlign = 'center';
  ctx.fillText(template.icon, canvas.width / 2, layout.iconY);

  // 6. Category Badge
  ctx.fillStyle = template.accent;
  const badgeWidth = ctx.measureText(category.toUpperCase()).width + 40;
  const badgeHeight = 28;
  const bx = (canvas.width - badgeWidth) / 2;
  ctx.beginPath();
  ctx.roundRect(bx, layout.badgeY - 20, badgeWidth, badgeHeight, 14);
  ctx.fill();

  ctx.fillStyle = isLight(template.accent) ? '#000000' : '#ffffff';
  ctx.font = `900 12px ${fontName}, sans-serif`;
  ctx.fillText(category.toUpperCase(), canvas.width / 2, layout.badgeY);

  // 7. Dynamic Title Rendering
  const MAX_LINES = 5;
  const PADDING = 60;
  
  // Set initial font size based on title length
  let fontSize = title.length > 50 ? 32 : (title.length > 30 ? 38 : 44);
  ctx.font = `900 ${fontSize}px ${fontName}, sans-serif`;
  ctx.fillStyle = textColor;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  const words = title.split(' ');
  let lines: string[] = [];
  let currentLine = '';

  for (let word of words) {
    const testLine = currentLine + word + ' ';
    if (ctx.measureText(testLine).width > (canvas.width - PADDING * 2)) {
      lines.push(currentLine.trim());
      currentLine = word + ' ';
    } else {
      currentLine = testLine;
    }
  }
  lines.push(currentLine.trim());

  // Handle overflow
  if (lines.length > MAX_LINES) {
    lines = lines.slice(0, MAX_LINES);
    lines[MAX_LINES - 1] = lines[MAX_LINES - 1].slice(0, -3) + '...';
  }

  // Draw lines with vertical centering adjustment
  const lineHeight = fontSize * 1.2;
  const totalTextHeight = lines.length * lineHeight;
  const startY = layout.titleY - (totalTextHeight / 2) + (lineHeight / 2);

  lines.forEach((line, i) => {
    ctx.fillText(line, canvas.width / 2, startY + (i * lineHeight));
  });

  // 8. Footer & Branding
  ctx.fillStyle = template.accent;
  ctx.fillRect(canvas.width / 2 - 25, layout.footerY - 35, 50, 3);

  ctx.fillStyle = subTextColor;
  ctx.font = `bold 18px ${fontName}, sans-serif`;
  ctx.fillText(author, canvas.width / 2, layout.footerY);

  ctx.font = `900 11px ${fontName}, sans-serif`;
  ctx.fillStyle = template.accent;
  ctx.letterSpacing = '2px';
  ctx.fillText('BUKI ANGOLANO • BIBLIOTECA DIGITAL', canvas.width / 2, canvas.height - 35);

  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob!), 'image/png');
  });
}
