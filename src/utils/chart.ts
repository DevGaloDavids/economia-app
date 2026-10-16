interface SVGPathData {
  path: string;
  areaPath: string;
  lastPoint?: { x: number; y: number };
  comparisonPath?: string;
  comparisonLastPoint?: { x: number; y: number };
}

export function generateSVGPath(
  data: { importe: number; comparison?: number }[],
  width = 300,
  height = 60
): SVGPathData {
  if (!data || data.length < 2) return { path: "", areaPath: "" };

  const values = data.flatMap((point) =>
    point.comparison === undefined
      ? [Number(point.importe)]
      : [Number(point.importe), Number(point.comparison)]
  );
  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min === 0 ? 1 : max - min;

  const createPoints = (series: number[]) => series.map((val, idx) => {
    const x = (idx / (data.length - 1)) * width;
    const y = height - 8 - ((val - min) / range) * (height - 16);
    return { x, y };
  });

  const mainValues = data.map((point) => Number(point.importe));
  const points = createPoints(mainValues);
  const path = points.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
    ""
  );

  const areaPath = `${path} L ${width},${height} L 0,${height} Z`;

  const comparisonValues = data.flatMap((point) =>
    point.comparison === undefined ? [] : [Number(point.comparison)]
  );
  const comparisonPoints =
    comparisonValues.length === data.length ? createPoints(comparisonValues) : [];
  const comparisonPath = comparisonPoints.reduce(
    (acc, pt, i) => (i === 0 ? `M ${pt.x},${pt.y}` : `${acc} L ${pt.x},${pt.y}`),
    ""
  );

  return {
    path,
    areaPath,
    lastPoint: points[points.length - 1],
    ...(comparisonPath && {
      comparisonPath,
      comparisonLastPoint: comparisonPoints[comparisonPoints.length - 1],
    }),
  };
}