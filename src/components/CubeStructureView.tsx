import { cubesToDraw } from "../cube/logic";
import type { Structure } from "../cube/types";

/** Projected dimensions of one cube face, in SVG user units. */
const TILE_W = 64; // width of the top diamond
const TILE_H = 36; // height of the top diamond
const CUBE_H = 46; // height of the side faces

const PAD = 8;

/** Isometric screen position of a cube's top-face center. */
function project(col: number, row: number, z: number) {
  return {
    x: (col - row) * (TILE_W / 2),
    y: (col + row) * (TILE_H / 2) - z * CUBE_H,
  };
}

/**
 * Renders a cube structure as an isometric SVG: each unit cube is drawn as
 * three shaded rhombi (top / right / left faces) in back-to-front,
 * bottom-to-top order so nearer/taller cubes correctly occlude the ones
 * behind and beneath them.
 */
export function CubeStructureView({ structure }: { structure: Structure }) {
  const cubes = cubesToDraw(structure);

  let minX = Infinity;
  let maxX = -Infinity;
  let minY = Infinity;
  let maxY = -Infinity;

  const track = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (x > maxX) maxX = x;
    if (y < minY) minY = y;
    if (y > maxY) maxY = y;
  };

  for (const { col, row, z } of cubes) {
    const { x, y } = project(col, row, z);
    track(x - TILE_W / 2, y - TILE_H / 2);
    track(x + TILE_W / 2, y + TILE_H / 2 + CUBE_H);
  }

  if (!Number.isFinite(minX)) {
    minX = 0;
    maxX = TILE_W;
    minY = 0;
    maxY = TILE_H;
  }

  const viewW = maxX - minX + PAD * 2;
  const viewH = maxY - minY + PAD * 2;
  const offsetX = -minX + PAD;
  const offsetY = -minY + PAD;

  return (
    <div className="cubes__stage" style={{ aspectRatio: `${viewW} / ${viewH}` }}>
      <svg
        viewBox={`0 0 ${viewW} ${viewH}`}
        role="img"
        aria-label={`A 3D structure made of ${structure.total} cubes`}
      >
        {cubes.map(({ col, row, z }) => (
          <Cube key={`${col}-${row}-${z}`} col={col} row={row} z={z} offsetX={offsetX} offsetY={offsetY} />
        ))}
      </svg>
    </div>
  );
}

function Cube({
  col,
  row,
  z,
  offsetX,
  offsetY,
}: {
  col: number;
  row: number;
  z: number;
  offsetX: number;
  offsetY: number;
}) {
  const { x, y } = project(col, row, z);
  const cx = x + offsetX;
  const cy = y + offsetY;

  const top = `${cx},${cy - TILE_H / 2} ${cx + TILE_W / 2},${cy} ${cx},${cy + TILE_H / 2} ${cx - TILE_W / 2},${cy}`;
  const right = `${cx},${cy + TILE_H / 2} ${cx + TILE_W / 2},${cy} ${cx + TILE_W / 2},${cy + CUBE_H} ${cx},${cy + TILE_H / 2 + CUBE_H}`;
  const left = `${cx - TILE_W / 2},${cy} ${cx},${cy + TILE_H / 2} ${cx},${cy + TILE_H / 2 + CUBE_H} ${cx - TILE_W / 2},${cy + CUBE_H}`;

  return (
    <g className="cube">
      <polygon points={left} className="cube__face cube__face--left" />
      <polygon points={right} className="cube__face cube__face--right" />
      <polygon points={top} className="cube__face cube__face--top" />
    </g>
  );
}
