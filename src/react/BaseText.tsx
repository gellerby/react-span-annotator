import React, { forwardRef, useCallback, useRef } from 'react';
import { TextLine } from '@/domain/models/Line/LineText';

interface BaseTextProps {
  id?: string;
  text: string;
  textLine: TextLine;
  x?: number;
}

const BaseText = forwardRef<SVGTextElement, BaseTextProps>(({ id, text, textLine, x = 0 }, ref) => {
  const snippet = text.substring(textLine.startOffset, textLine.endOffset);
  const textLineRef = useRef(textLine);
  textLineRef.current = textLine;

  const setRef = useCallback(
    (el: SVGTextElement | null) => {
      if (el) (el as any).annotatorElement = textLineRef.current;
      if (typeof ref === 'function') ref(el);
      else if (ref) (ref as React.MutableRefObject<SVGTextElement | null>).current = el;
    },
    [ref]
  );

  if (snippet) {
    return (
      <text ref={setRef} id={id} fill="currentColor" style={{ whiteSpace: 'pre' }} x={x}>
        {snippet}
      </text>
    );
  }
  return (
    <text ref={setRef} id={id} style={{ fontSize: '6px', whiteSpace: 'pre' }} fill="currentColor" x={x}>
      &nbsp;
    </text>
  );
});

BaseText.displayName = 'BaseText';
export default BaseText;
