import React from 'react';

interface BaseRelationProps {
  fontSize: number;
  x1?: number;
  x2?: number;
  dark?: boolean;
  label: string;
  labelWidth: number;
  level?: number;
  openLeft?: boolean;
  openRight?: boolean;
  rtl?: boolean;
  margin?: number;
  marker?: string;
  maxLevel?: number;
  selected?: boolean;
  onClickRelation?: (event: React.MouseEvent) => void;
  onContextmenuRelation?: (event: React.MouseEvent) => void;
  onMouseover?: () => void;
  onMouseleave?: () => void;
}

const BaseRelation: React.FC<BaseRelationProps> = ({
  fontSize, x1, x2, dark = false, label, labelWidth,
  level = 0, openLeft = false, openRight = false,
  rtl = false, margin = 0, marker, maxLevel = 0, selected = false,
  onClickRelation, onContextmenuRelation, onMouseover, onMouseleave,
}) => {
  const r = 12;
  const _x1 = (x1 ?? 0) - margin;
  const _x2 = (x2 ?? 0) - margin;
  const dy = 20 + fontSize * level;
  const y = 20 + fontSize * maxLevel + fontSize / 2;
  const lineY = y - dy - r;

  let d: string;
  if (openLeft && openRight) {
    d = `M ${_x1} ${y - dy - r} H ${_x2}`;
  } else if (openLeft) {
    d = `M ${_x1} ${y - dy - r} H ${_x2 - r} A ${r} ${r} 0 0 1 ${_x2} ${lineY + r} v ${dy - 3}`;
  } else if (openRight) {
    d = `M ${_x1} ${y} v -${dy} A ${r} ${r} 0 0 1 ${_x1 + r} ${lineY} H ${_x2}`;
  } else {
    d = `M ${_x1} ${y} v -${dy} A ${r} ${r} 0 0 1 ${_x1 + r} ${lineY} H ${_x2 - r} A ${r} ${r} 0 0 1 ${_x2} ${lineY + r} v ${dy - 3}`;
  }

  const markerProps: React.SVGAttributes<SVGPathElement> = {};
  if (marker === 'start') markerProps.markerStart = 'url(#v-annotator-arrow)';
  else if (marker === 'end') markerProps.markerEnd = 'url(#v-annotator-arrow)';

  const strokeWidth = selected ? 3 : 1;
  const fill = dark ? '#1E1E1E' : 'white';
  const center = _x1 + (_x2 - _x1) / 2;
  const rectX = center - labelWidth / 2;
  const rectY = lineY - fontSize / 2;
  const textY = lineY + fontSize / 2 - 3;

  return (
    <g
      style={{ cursor: 'pointer', userSelect: 'none' }}
      onClick={onClickRelation}
      onContextMenu={onContextmenuRelation}
      onMouseOver={onMouseover}
      onMouseLeave={onMouseleave}
    >
      <path d={d} {...markerProps} stroke="#74b8dc" strokeWidth={strokeWidth} fill="none" />
      {x1 != null && (
        <g>
          <rect x={rectX} y={rectY} width={labelWidth} height={fontSize} fill={fill} />
          <text x={center} y={textY} fill="currentColor" textAnchor="middle">{label}</text>
        </g>
      )}
    </g>
  );
};

export default BaseRelation;
