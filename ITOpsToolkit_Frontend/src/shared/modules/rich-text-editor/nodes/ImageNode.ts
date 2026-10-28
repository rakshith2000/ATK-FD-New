import {
    ElementNode,
    type DOMConversionMap,
    type DOMExportOutput,
    type EditorConfig,
    type LexicalEditor,
    type LexicalNode,
    type NodeKey,
    type RangeSelection,
    ParagraphNode,
    type SerializedElementNode,
    type Spread,
    isHTMLElement,
} from 'lexical';

export type SerializedImageNode = Spread<
    {
        src: string;
        alt?: string | null | undefined;
        width?: string | null | undefined;
        height?: string | null | undefined;
        alignment?: 'left' | 'center' | 'right' | null | undefined;
    },
    SerializedElementNode
>;

export class ImageNode extends ElementNode {
    __src: string;
    __alt: string | null | undefined;
    __width: string | null | undefined;
    __height: string | null | undefined;
    __alignment: 'left' | 'center' | 'right' | null | undefined;

    static getType(): string {
        return 'image';
    }

    static clone(node: ImageNode): ImageNode {
        return new ImageNode(node.__src, node.__alt, node.__width, node.__height, node.__alignment, node.__key);
    }

    constructor(
        src: string,
        alt?: string | null | undefined,
        width?: string | null | undefined,
        height?: string | null | undefined,
        alignment?: 'left' | 'center' | 'right' | null | undefined,
        key?: NodeKey,
    ) {
        super(key);
        this.__src = src;
        this.__alt = alt ?? null;
        this.__width = width ?? null;
        this.__height = height ?? null;
        this.__alignment = alignment ?? null;
    }

    getSrc(): string {
        return this.__src;
    }

    getAlt(): string | null | undefined {
        return this.__alt;
    }

    getWidth(): string | null | undefined {
        return this.__width;
    }

    getHeight(): string | null | undefined {
        return this.__height;
    }

    getAlignment(): 'left' | 'center' | 'right' | null | undefined {
        return this.__alignment;
    }

    setSrc(src: string): void {
        const writable = this.getWritable();
        writable.__src = src;
    }

    setAlt(alt?: string | null | undefined): void {
        const writable = this.getWritable();
        writable.__alt = alt ?? null;
    }

    setWidth(width?: string | null | undefined): void {
        const writable = this.getWritable();
        writable.__width = width ?? null;
    }

    setHeight(height?: string | null | undefined): void {
        const writable = this.getWritable();
        writable.__height = height ?? null;
    }

    setAlignment(alignment?: 'left' | 'center' | 'right' | null | undefined): void {
        const writable = this.getWritable();
        writable.__alignment = alignment ?? null;
    }

    createDOM(_config: EditorConfig): HTMLElement {
        const img = document.createElement('img');
        img.src = this.__src;
        img.alt = this.__alt ?? '';
        img.className = 'editor-image';
        img.style.maxWidth = '100%';
        img.style.display = 'block';
        img.style.margin = '0.5rem 0';
        if (this.__width) {
            img.style.width = this.__width;
        }
        if (this.__height) {
            img.style.height = this.__height;
            img.style.objectFit = 'cover';
        }
        if (this.__alignment === 'center') {
            img.style.marginLeft = 'auto';
            img.style.marginRight = 'auto';
        } else if (this.__alignment === 'left') {
            img.style.float = 'left';
            img.style.marginRight = '1rem';
        } else if (this.__alignment === 'right') {
            img.style.float = 'right';
            img.style.marginLeft = '1rem';
        }
        return img;
    }

    updateDOM(prevNode: ImageNode, dom: HTMLElement): boolean {
        if (dom instanceof HTMLImageElement) {
            if (prevNode.__src !== this.__src) {
                dom.src = this.__src;
            }
            if (prevNode.__alt !== this.__alt) {
                dom.alt = this.__alt ?? '';
            }
            if (prevNode.__width !== this.__width) {
                if (this.__width) {
                    dom.style.width = this.__width;
                } else {
                    dom.style.removeProperty('width');
                }
            }
            if (prevNode.__height !== this.__height) {
                if (this.__height) {
                    dom.style.height = this.__height;
                    dom.style.objectFit = 'cover';
                } else {
                    dom.style.removeProperty('height');
                    dom.style.removeProperty('object-fit');
                }
            }
            if (prevNode.__alignment !== this.__alignment) {
                dom.style.removeProperty('float');
                dom.style.marginLeft = '';
                dom.style.marginRight = '';
                if (this.__alignment === 'center') {
                    dom.style.marginLeft = 'auto';
                    dom.style.marginRight = 'auto';
                    dom.style.float = 'none';
                } else if (this.__alignment === 'left') {
                    dom.style.float = 'left';
                    dom.style.marginRight = '1rem';
                } else if (this.__alignment === 'right') {
                    dom.style.float = 'right';
                    dom.style.marginLeft = '1rem';
                }
            }
        }
        return false;
    }

    static importDOM(): DOMConversionMap | null {
        return {
            img: (domNode) => {
                if (isHTMLElement(domNode)) {
                    const src = domNode.getAttribute('src');
                    return src
                        ? {
                              conversion: () => {
                                  let alignment = domNode.getAttribute('data-alignment') as 'left' | 'center' | 'right' | null;
                                  // Fallback: detect alignment from inline styles
                                  if (!alignment && domNode instanceof HTMLElement) {
                                      const style = domNode.style;
                                      if (style.float === 'left') {
                                          alignment = 'left';
                                      } else if (style.float === 'right') {
                                          alignment = 'right';
                                      } else if (style.marginLeft === 'auto' && style.marginRight === 'auto') {
                                          alignment = 'center';
                                      }
                                  }
                                  const node = $createImageNode(
                                      src,
                                      domNode.getAttribute('alt'),
                                      domNode.getAttribute('width') ?? undefined,
                                      domNode.getAttribute('height') ?? undefined,
                                      alignment ?? undefined,
                                  );
                                  return { node };
                              },
                              priority: 0,
                          }
                        : null;
                }
                return null;
            },
        };
    }

    exportDOM(_editor: LexicalEditor): DOMExportOutput {
        const element = document.createElement('img');
        element.src = this.__src;
        element.alt = this.__alt ?? '';
        element.className = 'editor-image';
        element.style.maxWidth = '100%';
        element.style.display = 'block';
        element.style.margin = '0.5rem 0';
        if (this.__width) {
            element.style.width = this.__width;
            element.setAttribute('width', this.__width);
        }
        if (this.__height) {
            element.style.height = this.__height;
            element.setAttribute('height', this.__height);
            element.style.objectFit = 'cover';
        }
        if (this.__alignment) {
            element.setAttribute('data-alignment', this.__alignment);
            if (this.__alignment === 'center') {
                element.style.marginLeft = 'auto';
                element.style.marginRight = 'auto';
            } else if (this.__alignment === 'left') {
                element.style.float = 'left';
                element.style.marginRight = '1rem';
            } else if (this.__alignment === 'right') {
                element.style.float = 'right';
                element.style.marginLeft = '1rem';
            }
        }
        return { element };
    }

    static importJSON(serializedNode: SerializedImageNode): ImageNode {
        return $createImageNode(serializedNode.src, serializedNode.alt, serializedNode.width, serializedNode.height, serializedNode.alignment);
    }

    exportJSON(): SerializedImageNode {
        return {
            type: 'image',
            version: 1,
            src: this.__src,
            alt: this.__alt ?? undefined,
            width: this.__width ?? undefined,
            height: this.__height ?? undefined,
            alignment: this.__alignment ?? undefined,
            direction: null,
            format: '',
            indent: 0,
            textStyle: '',
            children: [],
        };
    }

    insertNewAfter(_selection: RangeSelection, restoreSelection?: boolean): ParagraphNode {
        const paragraph = new ParagraphNode();
        if (restoreSelection) {
            paragraph.select();
        }
        return paragraph;
    }
}

export function $createImageNode(
    src: string,
    alt?: string | null | undefined,
    width?: string | null | undefined,
    height?: string | null | undefined,
    alignment?: 'left' | 'center' | 'right' | null | undefined,
): ImageNode {
    return new ImageNode(src, alt, width, height, alignment);
}

export function $isImageNode(node: LexicalNode | null | undefined): node is ImageNode {
    return node instanceof ImageNode;
}
