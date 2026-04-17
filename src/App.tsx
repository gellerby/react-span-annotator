import { useState } from 'react';
import { ReactSpanAnnotator } from './react';
import { Entity } from './domain/models/Label/Entity';
import type { Label } from './domain/models/Label/Label';
import type { Relation } from './domain/models/Label/Relation';

const text =
  'Tokyo is the capital of Japan. Alice works at Acme Corp in New York.';

const entityLabels: Label[] = [
  { id: 1, text: 'Location', color: '#ff9999' },
  { id: 2, text: 'Person', color: '#a0c4ff' },
  { id: 3, text: 'Organization', color: '#b9fbc0' },
];

const initialEntities: Entity[] = [
  new Entity(1, 1, 0, 5),   // Tokyo       - Location
  new Entity(2, 1, 24, 29), // Japan        - Location
  new Entity(3, 2, 31, 37), // Alice        - Person
  new Entity(4, 3, 46, 56), // Acme Corp    - Organization
  new Entity(5, 1, 59, 68), // New York     - Location
];

let nextId = 10;

export default function App() : JSX.Element {
  const [entities, setEntities] = useState<Entity[]>(initialEntities);
  const [selectedEntities, setSelectedEntities] = useState<Entity[]>([]);
  const [log, setLog] = useState<string[]>([]);
  const [pending, setPending] = useState<{ start: number; end: number } | null>(null);

  const addLog = (msg: string) =>
    setLog((prev) => [msg, ...prev].slice(0, 8));

  const handleAddEntity = (_e: Event, start: number, end: number) => {
    if (start === end) return;
    setPending({ start, end });
  };

  const confirmLabel = (label: Label) => {
    if (!pending) return;
    const entity = new Entity(nextId++, label.id, pending.start, pending.end);
    setEntities((prev) => [...prev, entity]);
    addLog(`Added entity [${pending.start}, ${pending.end}) — label: ${label.text}`);
    setPending(null);
  };

  const handleClickEntity = (_e: Event, id: number) => {
    const entity = entities.find((e) => e.id === id);
    if (!entity) return;
    setSelectedEntities((prev) =>
      prev.some((e) => e.id === id)
        ? prev.filter((e) => e.id !== id)
        : [...prev, entity]
    );
    addLog(`Clicked entity #${id} [${entity.startOffset}, ${entity.endOffset})`);
  };

  const handleContextmenuEntity = (entity: Entity) => {
    setEntities((prev) => prev.filter((e) => e.id !== entity.id));
    setSelectedEntities((prev) => prev.filter((e) => e.id !== entity.id));
    addLog(`Removed entity #${entity.id}`);
  };

  return (
    <div style={{ fontFamily: 'sans-serif', maxWidth: 900, margin: '0 auto', padding: 24 }}>
      <h1 style={{ fontSize: 20, marginBottom: 4 }}>react-span-annotator demo</h1>
      <p style={{ color: '#666', fontSize: 14, marginBottom: 16 }}>
        Select text to add an entity label. Click an entity to highlight it. Right-click to remove.
      </p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        {pending ? (
          <>
            <span style={{ fontSize: 13, color: '#333', fontWeight: 600 }}>
              [{pending.start}, {pending.end}) — add as:
            </span>
            {entityLabels.map((l) => (
              <button
                key={l.id}
                onClick={() => confirmLabel(l)}
                style={{
                  background: l.color,
                  border: '2px solid rgba(0,0,0,0.2)',
                  borderRadius: 4,
                  padding: '2px 10px',
                  fontSize: 13,
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {l.text}
              </button>
            ))}
            <button
              onClick={() => setPending(null)}
              style={{ fontSize: 12, color: '#888', background: 'none', border: 'none', cursor: 'pointer' }}
            >
              cancel
            </button>
          </>
        ) : (
          entityLabels.map((l) => (
            <span
              key={l.id}
              style={{
                background: l.color,
                borderRadius: 4,
                padding: '2px 8px',
                fontSize: 13,
              }}
            >
              {l.text}
            </span>
          ))
        )}
      </div>

      <div style={{ border: '1px solid #ddd', borderRadius: 6, padding: 8 }}>
        <ReactSpanAnnotator
          text={text}
          entities={entities}
          entityLabels={entityLabels}
          selectedEntities={selectedEntities}
          height={300}
          onAddEntity={handleAddEntity}
          onClickEntity={handleClickEntity}
          onContextmenuEntity={handleContextmenuEntity}
        />
      </div>

      {log.length > 0 && (
        <div style={{ marginTop: 16 }}>
          <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>Event log</p>
          <ul style={{ fontSize: 13, color: '#444', margin: 0, padding: '0 0 0 16px' }}>
            {log.map((msg, i) => (
              <li key={i}>{msg}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
