/* eslint-disable @typescript-eslint/no-unused-vars */
import {Declaration, DeclarationMapper, Mapping} from '../src/index';

//
// Definition part
//

// 1. Define context. Context is mutable.
type DrawContext = {};

// 2. Given or define declarations. Declarations are immutable.
type DecLine = Declaration<'line', {length: number}>;
type DecCircle = Declaration<'circle', {radius: number}>;

// 3. Given non-declarative class for each types. It can contain mutable state.
class DrawLine {
  drawLine(context: DrawContext, length: number): void {
    // impl later
  }

  clear(context: DrawContext): void {
    // impl later
  }
}
class DrawCircle {
  drawCircle(context: DrawContext, radius: number): void {
    // impl later
  }

  clear(context: DrawContext): void {
    // impl later
  }
}

// 4. Define mappers for each types.
class MapperLine implements Mapping<DrawContext, 'line', DecLine, DrawLine> {
  type(): 'line' {
    return 'line';
  }

  create(context: DrawContext, dec: DecLine): DrawLine {
    const drawLine = new DrawLine();
    drawLine.drawLine(context, dec.length);
    return drawLine;
  }

  update(
    context: DrawContext,
    dec: DecLine,
    oldDec: DecLine,
    mapped: DrawLine
  ): DrawLine {
    if (dec.length === oldDec.length) return mapped;

    mapped.clear(context);
    mapped.drawLine(context, dec.length);
    return mapped;
  }

  destroyed(context: DrawContext, oldDec: DecLine, mapped: DrawLine): void {
    mapped.clear(context);
  }
}
class MapperCircle
  implements Mapping<DrawContext, 'circle', DecCircle, DrawCircle>
{
  type(): 'circle' {
    return 'circle';
  }

  create(context: DrawContext, dec: DecCircle): DrawCircle {
    const drawCircle = new DrawCircle();
    drawCircle.drawCircle(context, dec.radius);
    return drawCircle;
  }

  update(
    context: DrawContext,
    dec: DecCircle,
    oldDec: DecCircle,
    mapped: DrawCircle
  ): DrawCircle {
    if (dec.radius === oldDec.radius) return mapped;

    mapped.clear(context);
    mapped.drawCircle(context, dec.radius);
    return mapped;
  }

  destroyed(context: DrawContext, oldDec: DecCircle, mapped: DrawCircle): void {
    mapped.clear(context);
  }
}

//
// Usage part
//

// Create mapper only once
const mapper = new DeclarationMapper<DrawContext>([
  new MapperLine(),
  new MapperCircle(),
]);

// Update both line and circle
const context: DrawContext = {};

// Create them
mapper.update(context, [
  {id: '1', type: 'line', length: 10} as DecLine,
  {id: '2', type: 'circle', radius: 5} as DecCircle,
]);

// Update only circle
mapper.update(context, [
  {id: '1', type: 'line', length: 10} as DecLine,
  {id: '2', type: 'circle', radius: 555} as DecCircle, // radius changed
]);

// Delete only line
mapper.update(context, [
  // line removed
  {id: '2', type: 'circle', radius: 555} as DecCircle,
]);

// Clear state and destroy non-declarative instances
mapper.clear(context);
