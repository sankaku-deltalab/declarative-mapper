export type DeclarationId = string | number;
export type DeclarationType = string | number;

/**
 * Declaration is a data structure that represents a declaration of each element.
 * It must be immutable and contain id and type.
 */
export type Declaration<
  T extends DeclarationType,
  V extends Object = Object,
> = Readonly<
  {
    id: DeclarationId;
    type: T;
  } & Omit<V, 'id' | 'type'>
>;

/**
 * Mapped is any object that do non-declarative operations.
 */
export type Mapped = unknown;

/**
 * MappingContext is a context that is passed to Mapping.
 */
export type MappingContext = unknown;

/**
 * Mapping is a class that maps Declaration to Mapped.
 */
export interface Mapping<
  C extends MappingContext,
  T extends DeclarationType,
  D extends Declaration<T>,
  M extends Mapped,
> {
  /**
   * Returns the type of Declaration.
   */
  type(): T;

  /**
   * Create a new Mapped from Declaration and do non-declarative operation.
   */
  create(context: C, dec: D): M;

  /**
   * Update Mapped from Declaration and do non-declarative operation.
   */
  update(context: C, dec: D, oldDec: D, mapped: M): M;

  /**
   * Destroy Mapped.
   * This method is called when the Declaration is removed.
   */
  destroyed(context: C, oldDec: D, mapped: M): void;
}

/**
 * DeclarationMapper is a class that manages Declaration and Mapped.
 */
export class DeclarationMapper<C extends MappingContext> {
  private declarations: Map<
    DeclarationId,
    [Declaration<DeclarationType>, Mapped]
  > = new Map();

  private mappers = new Map<
    DeclarationType,
    Mapping<C, DeclarationType, Declaration<DeclarationType>, Mapped>
  >();

  /**
   * @param mappings Array of Mapping
   */
  constructor(
    mappings: Mapping<
      C,
      DeclarationType,
      Declaration<DeclarationType>,
      Mapped
    >[]
  ) {
    mappings.forEach(mapping => {
      this.mappers.set(mapping.type(), mapping);
    });
  }

  /**
   * Update Declaration and Mapped.
   * This method creates, updates, and deletes Mapped based on Declaration.
   */
  update(context: C, declarations: Declaration<DeclarationType>[]): void {
    const newDeclarations = new Map<
      DeclarationId,
      [Declaration<DeclarationType>, Mapped]
    >();

    const oldDeclarations = this.declarations;

    // Update or create
    declarations.forEach(dec => {
      const [oldDec, mapped] = oldDeclarations.get(dec.id) ?? [null, null];

      const mapper = this.mappers.get(dec.type);
      if (!mapper) {
        throw new Error(`No mapper found for declaration type: ${dec.type}`);
      }

      if (oldDec && oldDec.type === dec.type) {
        const newMapped = mapper.update(context, dec, oldDec, mapped);
        newDeclarations.set(dec.id, [dec, newMapped]);
      } else if (oldDec) {
        mapper.destroyed(context, oldDec, mapped);
        const newMapped = mapper.create(context, dec);
        newDeclarations.set(dec.id, [dec, newMapped]);
      } else {
        const newMapped = mapper.create(context, dec);
        newDeclarations.set(dec.id, [dec, newMapped]);
      }
    });

    // Delete
    oldDeclarations.forEach(([oldDec, mapped], id) => {
      if (newDeclarations.has(id)) return;

      const mapper = this.mappers.get(oldDec.type);
      if (!mapper) {
        throw new Error(`No mapper found for declaration type: ${oldDec.type}`);
      }
      mapper.destroyed(context, oldDec, mapped);
    });

    this.declarations = newDeclarations;
  }

  /**
   * Clear all Mapped.
   */
  clear(context: C): void {
    this.declarations.forEach(([dec, mapped]) => {
      const mapper = this.mappers.get(dec.type);
      if (!mapper) {
        throw new Error(`No mapper found for declaration type: ${dec.type}`);
      }
      mapper.destroyed(context, dec, mapped);
    });
    this.declarations.clear();
  }
}
