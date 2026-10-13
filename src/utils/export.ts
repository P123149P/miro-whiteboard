import { CanvasElement } from '../types';
import { generateConnectorPath, getMultiElementBounds, pointsToSvgPath } from './geometry';

export function exportToJson(elements: CanvasElement[], title: string = 'miro-whiteboard') {
  const data = JSON.stringify({ version: '1.0', title, elements, exportedAt: new Date().toISOString() }, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.json`;
  a.click();
  URL.revokeObjectURL(url);
}

export function importFromJson(file: File): Promise<CanvasElement[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        if (Array.isArray(json.elements)) {
          resolve(json.elements);
        } else if (Array.isArray(json)) {
          resolve(json);
        } else {
          reject(new Error('无效的白板文件格式'));
        }
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('读取文件失败'));
    reader.readAsText(file);
  });
}

export function generateSvgContent(elements: CanvasElement[]): { svg: string; width: number; height: number } {
  const bounds = getMultiElementBounds(elements);
  const padding = 60;
  
  const minX = (bounds?.x ?? 0) - padding;
  const minY = (bounds?.y ?? 0) - padding;
  const width = Math.max((bounds?.width ?? 800) + padding * 2, 400);
  const height = Math.max((bounds?.height ?? 600) + padding * 2, 400);

  const sortedElements = [...elements].sort((a, b) => a.zIndex - b.zIndex);

  let innerSvg = '';

  for (const el of sortedElements) {
    if (el.type === 'frame') {
      innerSvg += `
        <g id="${el.id}">
          <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="12" fill="${el.fillColor}" stroke="${el.strokeColor}" stroke-width="2" />
          <rect x="${el.x}" y="${el.y}" width="${el.width}" height="38" rx="12" fill="${el.strokeColor}" fill-opacity="0.2" />
          <text x="${el.x + 16}" y="${el.y + 24}" font-family="system-ui, sans-serif" font-size="14" font-weight="bold" fill="#334155">${escapeXml(el.title)}</text>
        </g>
      `;
    } else if (el.type === 'sticky') {
      innerSvg += `
        <g id="${el.id}" filter="drop-shadow(0px 4px 6px rgba(0,0,0,0.08))">
          <rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="8" fill="${el.color}" />
          <foreignObject x="${el.x + 12}" y="${el.y + 12}" width="${el.width - 24}" height="${el.height - 24}">
            <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:system-ui,sans-serif;font-size:${el.fontSize}px;color:${el.textColor};text-align:${el.textAlign};word-break:break-word;white-space:pre-wrap;height:100%;display:flex;align-items:center;justify-content:${el.textAlign === 'center' ? 'center' : el.textAlign === 'right' ? 'flex-end' : 'flex-start'}">
              ${escapeXml(el.text)}
            </div>
          </foreignObject>
        </g>
      `;
    } else if (el.type === 'shape') {
      const strokeDash = el.strokeStyle === 'dashed' ? 'stroke-dasharray="6,4"' : '';
      let shapePath = '';

      if (el.shapeType === 'rectangle') {
        shapePath = `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="4" fill="${el.fillColor}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" ${strokeDash} />`;
      } else if (el.shapeType === 'rounded-rectangle') {
        shapePath = `<rect x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}" rx="16" fill="${el.fillColor}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" ${strokeDash} />`;
      } else if (el.shapeType === 'circle') {
        const rx = el.width / 2;
        const ry = el.height / 2;
        shapePath = `<ellipse cx="${el.x + rx}" cy="${el.y + ry}" rx="${rx}" ry="${ry}" fill="${el.fillColor}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" ${strokeDash} />`;
      } else if (el.shapeType === 'diamond') {
        const midX = el.x + el.width / 2;
        const midY = el.y + el.height / 2;
        shapePath = `<polygon points="${midX},${el.y} ${el.x + el.width},${midY} ${midX},${el.y + el.height} ${el.x},${midY}" fill="${el.fillColor}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" ${strokeDash} />`;
      } else if (el.shapeType === 'triangle') {
        const midX = el.x + el.width / 2;
        shapePath = `<polygon points="${midX},${el.y} ${el.x + el.width},${el.y + el.height} ${el.x},${el.y + el.height}" fill="${el.fillColor}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" ${strokeDash} />`;
      } else if (el.shapeType === 'star') {
        const cx = el.x + el.width / 2;
        const cy = el.y + el.height / 2;
        const outerR = Math.min(el.width, el.height) / 2;
        const innerR = outerR * 0.45;
        let pts = '';
        for (let i = 0; i < 10; i++) {
          const r = i % 2 === 0 ? outerR : innerR;
          const angle = (i * Math.PI) / 5 - Math.PI / 2;
          const px = cx + r * Math.cos(angle);
          const py = cy + r * Math.sin(angle);
          pts += `${px},${py} `;
        }
        shapePath = `<polygon points="${pts.trim()}" fill="${el.fillColor}" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" ${strokeDash} />`;
      }

      innerSvg += `
        <g id="${el.id}">
          ${shapePath}
          ${
            el.text
              ? `<foreignObject x="${el.x + 8}" y="${el.y + 8}" width="${el.width - 16}" height="${el.height - 16}">
                  <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:system-ui,sans-serif;font-size:${el.fontSize || 14}px;color:${el.textColor || '#1e293b'};text-align:${el.textAlign || 'center'};word-break:break-word;white-space:pre-wrap;height:100%;display:flex;align-items:center;justify-content:${el.textAlign === 'left' ? 'flex-start' : el.textAlign === 'right' ? 'flex-end' : 'center'}">
                    ${escapeXml(el.text)}
                  </div>
                </foreignObject>`
              : ''
          }
        </g>
      `;
    } else if (el.type === 'text') {
      innerSvg += `
        <g id="${el.id}">
          <foreignObject x="${el.x}" y="${el.y}" width="${el.width}" height="${el.height}">
            <div xmlns="http://www.w3.org/1999/xhtml" style="font-family:system-ui,sans-serif;font-size:${el.fontSize}px;font-weight:${el.fontWeight};color:${el.textColor};text-align:${el.textAlign};word-break:break-word;white-space:pre-wrap">
              ${escapeXml(el.text)}
            </div>
          </foreignObject>
        </g>
      `;
    } else if (el.type === 'pen') {
      const d = pointsToSvgPath(el.points);
      innerSvg += `
        <path d="${d}" fill="none" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" stroke-linecap="round" stroke-linejoin="round" />
      `;
    } else if (el.type === 'connector') {
      const d = generateConnectorPath(el.startPoint, el.endPoint, el.connectorType);
      const strokeDash = el.strokeStyle === 'dashed' ? 'stroke-dasharray="6,4"' : '';
      innerSvg += `
        <g id="${el.id}">
          <path d="${d}" fill="none" stroke="${el.strokeColor}" stroke-width="${el.strokeWidth}" ${strokeDash} marker-end="url(#arrow)" />
          ${
            el.text
              ? `<text x="${(el.startPoint.x + el.endPoint.x) / 2}" y="${(el.startPoint.y + el.endPoint.y) / 2 - 8}" font-family="system-ui,sans-serif" font-size="12" fill="#475569" text-anchor="middle" background="white">${escapeXml(el.text)}</text>`
              : ''
          }
        </g>
      `;
    }
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${minX} ${minY} ${width} height="${height}" width="${width}" height="${height}">
    <defs>
      <marker id="arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M 0 1 L 10 5 L 0 9 z" fill="#64748b" />
      </marker>
    </defs>
    <rect x="${minX}" y="${minY}" width="${width}" height="${height}" fill="#ffffff" />
    ${innerSvg}
  </svg>`;

  return { svg, width, height };
}

export function exportToSvg(elements: CanvasElement[], title: string = 'miro-whiteboard') {
  const { svg } = generateSvgContent(elements);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.svg`;
  a.click();
  URL.revokeObjectURL(url);
}

export function exportToPng(elements: CanvasElement[], title: string = 'miro-whiteboard') {
  const { svg, width, height } = generateSvgContent(elements);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const img = new Image();

  img.onload = () => {
    const scale = 2; // Retina 2x resolution
    const canvas = document.createElement('canvas');
    canvas.width = width * scale;
    canvas.height = height * scale;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.scale(scale, scale);
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, width, height);
    ctx.drawImage(img, 0, 0, width, height);

    canvas.toBlob((pngBlob) => {
      if (!pngBlob) return;
      const pngUrl = URL.createObjectURL(pngBlob);
      const a = document.createElement('a');
      a.href = pngUrl;
      a.download = `${title.toLowerCase().replace(/\s+/g, '-')}.png`;
      a.click();
      URL.revokeObjectURL(pngUrl);
      URL.revokeObjectURL(url);
    }, 'image/png');
  };

  img.src = url;
}

function escapeXml(unsafe: string): string {
  return unsafe
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}
