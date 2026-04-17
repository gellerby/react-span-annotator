import React from 'react';
import BaseEntityLine from './BaseEntityLine';
import BaseEntityText from './BaseEntityText';
import { Ranges } from '@/domain/models/Line/LineEntity';
import config from '@/domain/models/Config/Config';

interface BaseEntityProps {
  ranges: Ranges;
  color: string;
  noText?: boolean;
  label: string;
  rtl?: boolean;
  margin?: number;
  level?: number;
  fontSize?: number;
  selected?: boolean;
  onMouseover?: () => void;
  onMouseleave?: () => void;
  onClickEntity?: (event: React.MouseEvent) => void;
  onContextmenuEntity?: () => void;
}

const BaseEntity: React.FC<BaseEntityProps> = ({
  ranges, color, noText, label, rtl = false, margin = 0,
  level = 0, fontSize = 17, selected = false,
  onMouseover, onMouseleave, onClickEntity, onContextmenuEntity,
}) => {
  const dx = rtl ? -config.labelMargin : config.labelMargin;
  const r = config.radius;
  const height = selected ? config.lineWidth * 1.5 : config.lineWidth;
  const lineY = config.lineWidth + (config.lineWidth + fontSize + 8) * level;
  const textX = (rtl ? ranges.first.x2 : ranges.first.x1) - margin;
  const textY = lineY + fontSize / 2 + 5;
  const coordinates = ranges.items.map(
    (range) => [range.x1 - margin, range.x2 - margin] as [number, number]
  );

  return (
    <g onMouseOver={onMouseover} onMouseLeave={onMouseleave}>
      {coordinates.map(([x1, x2], index) => (
        <BaseEntityLine key={index} x1={x1} x2={x2} y={lineY} color={color} height={height} />
      ))}
      {!noText && (
        <BaseEntityText
          r={r}
          x={textX}
          y={textY}
          dx={dx}
          rtl={rtl}
          text={label}
          color={color}
          onClickEntity={onClickEntity}
          onContextmenuEntity={onContextmenuEntity}
        />
      )}
    </g>
  );
};

export default BaseEntity;
