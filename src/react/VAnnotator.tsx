import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useCallback,
  useMemo,
  useRef,
} from 'react';
import { debounce } from 'lodash-es';
import { v4 as uuidv4 } from 'uuid';
import { VariableSizeList, ListChildComponentProps } from 'react-window';
import VLine from './VLine';
import { Text } from '@/domain/models/Label/Text';
import {
  Label,
  LabelList,
  EntityLabelListItem,
  RelationLabelListItem,
} from '@/domain/models/Label/Label';
import { Entities, Entity } from '@/domain/models/Label/Entity';
import { Font } from '@/domain/models/Line/Font';
import { widthOf } from '@/domain/models/Line/Utils';
import { LineWidthManager } from '@/domain/models/Line/WidthManager';
import { TextLine } from '@/domain/models/Line/LineText';
import { TextLineSplitter } from '@/domain/models/Line/LineSplitter';
import { TextSelector } from '@/domain/models/EventHandler/TextSelectionHandler';
import { Relation, RelationList, RelationListItem } from '@/domain/models/Label/Relation';

interface ViewLine {
  id: string;
  textLine: TextLine;
  size: number;
}

export interface VAnnotatorProps {
  text: string;
  entities: Entity[];
  entityLabels: Label[];
  relations?: Relation[];
  relationLabels?: Label[];
  maxLabelLength?: number;
  allowOverlapping?: boolean;
  rtl?: boolean;
  graphemeMode?: boolean;
  dark?: boolean;
  selectedEntities?: Entity[];
  /** Height of the virtual scroll container (px). Defaults to window.innerHeight. */
  height?: number;
  onAddEntity?: (event: Event, startOffset: number, endOffset: number) => void;
  onClickEntity?: (event: Event, id: number) => void;
  onClickRelation?: (event: Event, relation: RelationListItem) => void;
  onContextmenuEntity?: (entity: Entity) => void;
  onContextmenuRelation?: (relation: RelationListItem) => void;
}

const EMPTY_ENTITIES: Entity[] = [];
const EMPTY_LABELS: Label[] = [];
const EMPTY_RELATIONS: Relation[] = [];

const VAnnotator: React.FC<VAnnotatorProps> = ({
  text = '',
  entities = EMPTY_ENTITIES,
  entityLabels = EMPTY_LABELS,
  relations = EMPTY_RELATIONS,
  relationLabels = EMPTY_LABELS,
  maxLabelLength = 12,
  allowOverlapping = false,
  rtl = false,
  graphemeMode = true,
  dark = false,
  selectedEntities = EMPTY_ENTITIES,
  height,
  onAddEntity,
  onClickEntity,
  onClickRelation,
  onContextmenuEntity,
  onContextmenuRelation,
}) => {
  const uuid = useRef(uuidv4()).current;
  const containerRef = useRef<HTMLDivElement>(null);
  const textElementRef = useRef<SVGTextElement>(null);
  const listRef = useRef<VariableSizeList>(null);

  const [font, setFont] = useState<Font | null>(null);
  const [entityLabelList, setEntityLabelList] = useState<LabelList | null>(null);
  const [relationLabelList, setRelationLabelList] = useState<LabelList | null>(null);
  const [heights, setHeights] = useState<Record<string, number>>({});
  const [maxWidth, setMaxWidth] = useState(0);
  const [baseX, setBaseX] = useState(0);
  const [left, setLeft] = useState(0);
  const [right, setRight] = useState(0);
  const [selectedRelation, setSelectedRelation] = useState<RelationListItem | null>(null);
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);

  // Measure container synchronously on mount and rtl changes — no debounce delay
  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const width = el.clientWidth;
    const rect = el.getBoundingClientRect();
    setMaxWidth(width);
    setLeft(rect.left);
    const rectWidth = rect.right - rect.left;
    setRight(rectWidth);
    setBaseX(rtl ? rectWidth : 0);
  }, [rtl]);

  // Debounce only for window resize
  const handleResize = useMemo(
    () =>
      debounce(() => {
        const el = containerRef.current;
        if (!el) return;
        const width = el.clientWidth;
        const rect = el.getBoundingClientRect();
        setMaxWidth(width);
        setLeft(rect.left);
        const rectWidth = rect.right - rect.left;
        setRight(rectWidth);
        setBaseX(rtl ? rectWidth : 0);
      }, 300),
    [rtl]
  );

  useEffect(() => {
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
      handleResize.cancel();
    };
  }, [handleResize]);

  // Compute font and label widths from the hidden SVG text element after mount
  useLayoutEffect(() => {
    const el = textElementRef.current;
    if (!el) return;
    setHeights({});
    setFont(Font.create(text, el));
    const eWidths = entityLabels.map((label) => widthOf(label.text, el));
    setEntityLabelList(LabelList.valueOf(maxLabelLength, entityLabels, eWidths, EntityLabelListItem));
    const rWidths = relationLabels.map((label) => widthOf(label.text, el));
    setRelationLabelList(LabelList.valueOf(maxLabelLength, relationLabels, rWidths, RelationLabelListItem));
  }, [text, entityLabels, relationLabels, maxLabelLength]);

  // Reset selection when entities/relations change
  useEffect(() => {
    setSelectedRelation(null);
    setSelectedEntity(null);
  }, [entities, relations]);

  const _text = useMemo(() => new Text(text), [text]);

  const entityList = useMemo(() => {
    if (graphemeMode) return Entities.valueOf(entities, _text);
    return Entities.valueOf(entities);
  }, [entities, graphemeMode, _text]);

  const relationList = useMemo(
    () => new RelationList(relations, entityList),
    [relations, entityList]
  );

  const textLines = useMemo<TextLine[]>(() => {
    if (!font || !entityLabelList || maxWidth === 0) return [];
    const calculator = new LineWidthManager(maxWidth, entityLabelList.maxLabelWidth);
    const splitter = new TextLineSplitter(calculator, font);
    return splitter.split(_text);
  }, [font, entityLabelList, maxWidth, _text]);

  const items = useMemo<ViewLine[]>(
    () =>
      textLines.map((textLine) => {
        const id = `${textLine.startOffset}:${textLine.endOffset}`;
        return { id, textLine, size: heights[id] ?? 64 };
      }),
    [textLines, heights]
  );

  const highlightedEntities = useMemo(
    () => (selectedEntity ? [...selectedEntities, selectedEntity] : selectedEntities),
    [selectedEntities, selectedEntity]
  );

  const updateHeight = useCallback(
    (id: string, newHeight: number) => {
      setHeights((prev) => {
        if (prev[id] === newHeight) return prev;
        return { ...prev, [id]: newHeight };
      });
      const index = textLines.findIndex(
        (line) => `${line.startOffset}:${line.endOffset}` === id
      );
      if (index !== -1 && listRef.current) {
        listRef.current.resetAfterIndex(index, false);
      }
    },
    [textLines]
  );

  const handleOpen = useCallback(
    (event: React.MouseEvent | React.TouchEvent) => {
      try {
        const selector = new TextSelector(allowOverlapping, graphemeMode);
        const [startOffset, endOffset] = selector.getOffsets(entityList, _text);
        onAddEntity?.(event as unknown as Event, startOffset, endOffset);
      } catch (err) {
        console.log(err);
        return;
      }
    },
    [allowOverlapping, graphemeMode, entityList, _text, onAddEntity]
  );

  const itemSize = useCallback((index: number) => items[index]?.size ?? 64, [items]);

  const listHeight = height ?? (typeof window !== 'undefined' ? window.innerHeight : 600);

  const itemsRef = useRef(items);
  itemsRef.current = items;

  const renderDataRef = useRef({
    font,
    entityLabelList,
    relationLabelList,
    entityList,
    relationList,
    rtl,
    dark,
    uuid,
    highlightedEntities,
    selectedRelation,
    text,
    baseX,
    left,
    right,
    onClickEntity,
    onClickRelation,
    onContextmenuEntity,
    onContextmenuRelation,
    updateHeight,
  });
  renderDataRef.current = {
    font,
    entityLabelList,
    relationLabelList,
    entityList,
    relationList,
    rtl,
    dark,
    uuid,
    highlightedEntities,
    selectedRelation,
    text,
    baseX,
    left,
    right,
    onClickEntity,
    onClickRelation,
    onContextmenuEntity,
    onContextmenuRelation,
    updateHeight,
  };

  const renderRow = useCallback(({ index, style }: ListChildComponentProps) => {
    const item = itemsRef.current[index];
    const d = renderDataRef.current;
    if (!item || !d.font || !d.entityLabelList) return null;

    return (
      <div style={style}>
        <VLine
          annotatorUuid={d.uuid}
          dark={d.dark}
          entities={d.entityList.filterByRange(item.textLine.startOffset, item.textLine.endOffset)}
          entityLabels={d.entityLabelList}
          relations={d.relationList.filterByRange(
            item.textLine.startOffset,
            item.textLine.endOffset
          )}
          relationLabels={d.relationLabelList}
          font={d.font}
          rtl={d.rtl}
          selectedEntities={d.highlightedEntities}
          selectedRelation={d.selectedRelation}
          text={d.text}
          textLine={item.textLine}
          baseX={d.baseX}
          left={d.left}
          right={d.right}
          onClickEntity={(e, entity) => d.onClickEntity?.(e, entity.id)}
          onClickRelation={(e, relation) => d.onClickRelation?.(e, relation)}
          onContextmenuEntity={d.onContextmenuEntity}
          onContextmenuRelation={d.onContextmenuRelation}
          onUpdateHeight={d.updateHeight}
          onSetSelectedEntity={setSelectedEntity}
          onSetSelectedRelation={setSelectedRelation}
        />
      </div>
    );
  }, []);

  return (
    <div
      id={`container-${uuid}`}
      ref={containerRef}
      onClick={handleOpen}
      onTouchEnd={handleOpen}
    >
      <svg version="1.1" xmlns="http://www.w3.org/2000/svg" width="0" height="0">
        <defs>
          <marker
            id="v-annotator-arrow"
            viewBox="0 0 10 10"
            refX="5"
            refY="5"
            markerWidth="6"
            markerHeight="6"
            orient="auto-start-reverse"
          >
            <path d="M 0 0 L 10 5 L 0 10 z" stroke="#74b8dc" fill="#74b8dc" />
          </marker>
        </defs>
      </svg>
      {items.length > 0 && (
        <VariableSizeList
          ref={listRef}
          height={listHeight}
          itemCount={items.length}
          itemSize={itemSize}
          width="100%"
          style={{ overflowX: 'hidden' }}
        >
          {renderRow}
        </VariableSizeList>
      )}
      {/* Hidden SVG used only for font metrics — kept out of normal flow */}
      <svg
        aria-hidden="true"
        style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none' }}
      >
        <text ref={textElementRef} style={{ whiteSpace: 'pre' }} />
      </svg>
    </div>
  );
};

export default VAnnotator;
