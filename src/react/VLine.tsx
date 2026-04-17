import React, {
  useState,
  useCallback,
  useLayoutEffect,
  useMemo,
  useRef,
} from 'react';
import { Entity } from '@/domain/models/Label/Entity';
import { RelationListItem } from '@/domain/models/Label/Relation';
import { Font } from '@/domain/models/Line/Font';
import { LabelList } from '@/domain/models/Label/Label';
import { TextLine } from '@/domain/models/Line/LineText';
import BaseEntity from './BaseEntity';
import BaseText from './BaseText';
import BaseRelation from './BaseRelation';
import { EntityLine, GeometricEntity } from '@/domain/models/Line/LineEntity';
import { RelationLine, LineRelation } from '@/domain/models/Line/LineRelation';

export interface VLineProps {
  annotatorUuid: string;
  entities: Entity[];
  relations?: RelationListItem[];
  textLine: TextLine;
  dark?: boolean;
  font: Font;
  text: string;
  entityLabels: LabelList;
  relationLabels?: LabelList | null;
  rtl?: boolean;
  baseX?: number;
  left?: number;
  right?: number;
  selectedEntities?: Entity[];
  selectedRelation?: RelationListItem | null;
  onClickEntity?: (event: Event, entity: Entity) => void;
  onClickRelation?: (event: Event, relation: RelationListItem) => void;
  onContextmenuEntity?: (entity: Entity) => void;
  onContextmenuRelation?: (relation: RelationListItem) => void;
  onUpdateHeight?: (id: string, height: number) => void;
  onSetSelectedEntity?: (entity: Entity | null) => void;
  onSetSelectedRelation?: (relation: RelationListItem | null) => void;
}

const VLine: React.FC<VLineProps> = ({
  annotatorUuid,
  entities,
  relations = [],
  textLine,
  dark = false,
  font,
  text,
  entityLabels,
  relationLabels,
  rtl = false,
  baseX = 0,
  left = 0,
  right = 0,
  selectedEntities = [],
  selectedRelation = null,
  onClickEntity,
  onClickRelation,
  onContextmenuEntity,
  onContextmenuRelation,
  onUpdateHeight,
  onSetSelectedEntity,
  onSetSelectedRelation,
}) => {
  const [textElement, setTextElement] = useState<SVGTextElement | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const prevHeightRef = useRef<number>(0);

  const id = `${textLine.startOffset}:${textLine.endOffset}`;
  const basetextId = `basetext-${annotatorUuid}-${id}`;
  const svgId = `svg-${annotatorUuid}-${id}`;

  const textCallbackRef = useCallback((el: SVGTextElement | null) => {
    setTextElement((prev) => (prev === el ? prev : el));
  }, []);

  const geometricEntities = useMemo<GeometricEntity[]>(() => {
    if (!textElement) return [];
    const view = new EntityLine(textLine, rtl);
    return view.render(textElement, entities, entityLabels);
  }, [textElement, textLine, rtl, entities, entityLabels]);

  const lineRelations = useMemo<LineRelation[]>(() => {
    if (!relationLabels) return [];
    const view = new RelationLine(relations, relationLabels, textLine, left, right);
    return view.render(geometricEntities, rtl);
  }, [geometricEntities, relations, relationLabels, textLine, left, right, rtl]);

  const maxRelationLevel = useMemo(
    () => Math.max(...lineRelations.map((r) => r.level), 0),
    [lineRelations]
  );

  const entityTranslateY = useMemo(() => {
    const level = Math.max(...lineRelations.map((item) => item.level), -1);
    if (level < 0) return 0;
    return 20 + font.fontSize * (level + 1.5);
  }, [lineRelations, font.fontSize]);

  useLayoutEffect(() => {
    if (!svgRef.current) return;
    const bbox = svgRef.current.getBBox();
    const height = bbox.height + 30;
    svgRef.current.style.height = `${height}px`;
    if (prevHeightRef.current !== height) {
      prevHeightRef.current = height;
      onUpdateHeight?.(id, height);
    }
  });

  const noText = (entity: Entity) => entity.startOffset < textLine.startOffset;
  const getColor = (entity: Entity) => entityLabels.getColor(entity.label)!;
  const getLabelText = (entity: Entity) => entityLabels.getText(entity.label)!;

  const isSelectedRelation = (relation: RelationListItem) => selectedRelation === relation;

  const isSelectedEntity = (entity: Entity) => {
    if (selectedRelation) return selectedRelation.consistOf(entity);
    return selectedEntities.some((e) => e.id === entity.id);
  };

  return (
    <svg
      version="1.1"
      xmlns="http://www.w3.org/2000/svg"
      direction={rtl ? 'rtl' : 'ltr'}
      id={svgId}
      ref={svgRef}
      width="100%"
      style={{ overflowWrap: 'normal' } as React.CSSProperties}
    >
      <g transform={`translate(0, ${font.lineHeight})`}>
        {lineRelations.map((relation) => (
          <BaseRelation
            key={relation.relation.id}
            dark={dark}
            fontSize={font.fontSize}
            x1={relation.x1}
            x2={relation.x2}
            level={relation.level}
            label={relation.label}
            labelWidth={relation.labelWidth}
            marker={relation.marker}
            maxLevel={maxRelationLevel}
            openLeft={relation.openLeft}
            openRight={relation.openRight}
            rtl={rtl}
            margin={left}
            selected={isSelectedRelation(relation.relation)}
            onClickRelation={(e) => onClickRelation?.(e as unknown as Event, relation.relation)}
            onContextmenuRelation={(e) => {
              e.preventDefault();
              onContextmenuRelation?.(relation.relation);
            }}
            onMouseover={() => onSetSelectedRelation?.(relation.relation)}
            onMouseleave={() => onSetSelectedRelation?.(null)}
          />
        ))}
        <g transform={`translate(0, ${entityTranslateY})`}>
          <BaseText
            ref={textCallbackRef}
            id={basetextId}
            textLine={textLine}
            text={text}
            x={baseX}
          />
          {geometricEntities.map((gEntity) => (
            <BaseEntity
              key={gEntity.entity.id}
              ranges={gEntity.ranges}
              color={getColor(gEntity.entity)}
              label={getLabelText(gEntity.entity)}
              noText={noText(gEntity.entity)}
              rtl={rtl}
              margin={left}
              level={gEntity.level}
              fontSize={font.fontSize}
              selected={isSelectedEntity(gEntity.entity)}
              onClickEntity={(e) => onClickEntity?.(e as unknown as Event, gEntity.entity)}
              onContextmenuEntity={() => onContextmenuEntity?.(gEntity.entity)}
              onMouseover={() => onSetSelectedEntity?.(gEntity.entity)}
              onMouseleave={() => onSetSelectedEntity?.(null)}
            />
          ))}
        </g>
      </g>
    </svg>
  );
};

export default VLine;
