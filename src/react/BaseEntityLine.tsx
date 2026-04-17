import React from 'react';

interface BaseEntityLineProps {
  x1: number;
  x2: number;
  y: number;
  height?: number;
  color: string;
}

const BaseEntityLine: React.FC<BaseEntityLineProps> = ({ x1, x2, y, height = 5, color }) => {
  const minX = x1 < x2 ? x1 : x2;
  const maxX = x1 < x2 ? x2 : x1;
  const _x1 = minX + height / 2;
  const _x2 = maxX - height / 2;

  return (
    <line
      x1={_x1}
      y1={y}
      x2={_x2}
      y2={y}
      stroke={color}
      strokeWidth={height}
      strokeLinecap="round"
    />
  );
};

export default BaseEntityLine;
