import type { ReactElement } from 'react';

interface Props {
  rows: string[];
  palette: Record<string, string>;
  scale?: number;
  className?: string;
}

export function PixelSprite({ rows, palette, scale = 4, className }: Props) {
  const w = rows[0].length;
  const h = rows.length;
  const rects: ReactElement[] = [];
  rows.forEach((row, y) => {
    for (let x = 0; x < row.length; x++) {
      const c = row[x];
      if (c !== '.') {
        rects.push(<rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill={palette[c]} />);
      }
    }
  });
  return (
    <svg
      className={className}
      width={w * scale}
      height={h * scale}
      viewBox={`0 0 ${w} ${h}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
    >
      {rects}
    </svg>
  );
}
