export function generateSVGPath(data: { importe: number }[], width = 300, height = 60) {
  if (!data || data.length < 2) return { path: "", areaPath: "" };

  const values = data.map((d) => Number(d.importe));
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min === 0 ? 1 : max - min;

  // Calculamos las coordenadas de cada punto dentro del SVG
  const points = values.map((val, idx) => {
    const x = (idx / (values.length - 1)) * width;
    // Margen superior e inferior de 8px para que la línea no se corte
    const y = height - 8 - ((val - min) / range) * (height - 16);
    return { x, y };
  });

  // Crear la línea principal
  const path = points.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
    ""
  );

  // Crear la ruta del área sombreada por debajo de la línea
  const areaPath = `${path} L ${width},${height} L 0,${height} Z`;

  return { path, areaPath, lastPoint: points[points.length - 1] };
}