import React from 'react';

interface BaseEntityTextProps {
  r: number;
  x: number;
  y: number;
  dx: number;
  color: string;
  text: string;
  rtl?: boolean;
  onClickEntity?: (event: React.MouseEvent) => void;
  onContextmenuEntity?: () => void;
}

const BaseEntityText: React.FC<BaseEntityTextProps> = ({
  r, x, y, dx, color, text, rtl = false,
  onClickEntity, onContextmenuEntity,
}) => {
  const cx = rtl ? x - r : x + r;

  return (
    <g
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onClick={onClickEntity}
      onContextMenu={(e) => { e.preventDefault(); onContextmenuEntity?.(); }}
    >
      <circle r={r} fill={color} cx={cx} cy={y} />
      <text x={x} y={y} fill="currentColor" dx={dx} dy="0.35em">{text}</text>
    </g>
  );
};

export default BaseEntityText;
