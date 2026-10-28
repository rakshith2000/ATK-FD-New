import {
    $createParagraphNode,
    $createTextNode,
    $getSelection,
    $isRangeSelection,
    $isTextNode,
    $isParagraphNode,
    ElementNode,
    type LexicalEditor,
    type LexicalNode,
    type TextFormatType,
    FORMAT_TEXT_COMMAND,
    FORMAT_ELEMENT_COMMAND,
} from 'lexical';
import { $patchStyleText } from '@lexical/selection';
import { $createHeadingNode, $isHeadingNode, type HeadingTagType, $createQuoteNode, $isQuoteNode } from '@lexical/rich-text';
import { type ListType, $insertList, $removeList, $isListItemNode, $isListNode } from '@lexical/list';
import { TOGGLE_LINK_COMMAND, $isLinkNode } from '@lexical/link';
import { INSERT_TABLE_COMMAND } from '@lexical/table';
import { $createImageNode, $isImageNode } from '../nodes/ImageNode';
import { $createCodeBlockNode, $isCodeBlockNode } from '../nodes/CodeBlockNode';
import { $createContainerNode, $isContainerNode, type ContainerNode } from '../nodes/ContainerNode';

const normalizeStyle = (style: string): Record<string, string> => {
    const styleObject: Record<string, string> = {};
    for (const chunk of style.split(';')) {
        const [key, value] = chunk.split(':').map((item) => item.trim());
        if (key && value) {
            styleObject[key] = value;
        }
    }
    return styleObject;
};

const styleToString = (styleObject: Record<string, string>): string =>
    Object.entries(styleObject)
        .map(([key, value]) => `${key}: ${value}`)
        .join('; ');

export function toggleTextFormat(editor: LexicalEditor, format: TextFormatType): void {
    editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || selection.isCollapsed()) {
            return;
        }
        editor.dispatchCommand(FORMAT_TEXT_COMMAND, format);
    });
}

export function setTextAlignment(editor: LexicalEditor, alignment: 'left' | 'center' | 'right' | 'justify'): void {
    editor.dispatchCommand(FORMAT_ELEMENT_COMMAND, alignment);
}

export function setBlockType(editor: LexicalEditor, blockType: 'normal' | 'h1' | 'h2' | 'h3' | 'h4' | 'quote' | 'code'): void {
    editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
            return;
        }
        const seen = new WeakSet<object>();
        selection.getNodes().forEach((node) => {
            const topElement = node.getTopLevelElement();
            if (!topElement || seen.has(topElement)) {
                return;
            }
            seen.add(topElement);
            if (blockType === 'normal') {
                if (!$isParagraphNode(topElement) && topElement instanceof ElementNode) {
                    const paragraph = $createParagraphNode();
                    paragraph.append(...topElement.getChildren());
                    topElement.replace(paragraph);
                }
                return;
            }
            if (blockType === 'quote') {
                if ($isQuoteNode(topElement)) {
                    return;
                }
                if (topElement instanceof ElementNode) {
                    const quote = $createQuoteNode();
                    quote.append(...topElement.getChildren());
                    topElement.replace(quote);
                }
                return;
            }
            if (blockType === 'code') {
                if ($isCodeBlockNode(topElement)) {
                    return;
                }
                if (topElement instanceof ElementNode) {
                    const code = $createCodeBlockNode();
                    code.append(...topElement.getChildren());
                    topElement.replace(code);
                }
                return;
            }
            const headingTag = blockType as HeadingTagType;
            if ($isHeadingNode(topElement)) {
                topElement.setTag(headingTag);
                return;
            }
            if (!(topElement instanceof ElementNode)) {
                return;
            }
            const heading = $createHeadingNode(headingTag);
            heading.append(...topElement.getChildren());
            topElement.replace(heading);
        });
    });
}

export function toggleListType(editor: LexicalEditor, listType: ListType): void {
    editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
            return;
        }

        let currentListType: ListType | null = null;

        for (const node of selection.getNodes()) {
            let current: LexicalNode | null = node;
            while (current && !($isListItemNode(current) || $isListNode(current))) {
                current = current.getParent();
            }
            if ($isListNode(current)) {
                currentListType = current.getListType();
                break;
            }
            if ($isListItemNode(current)) {
                const parent = current.getParent();
                if ($isListNode(parent)) {
                    currentListType = parent.getListType();
                    break;
                }
            }
        }

        if (currentListType === listType) {
            $removeList();
            return;
        }

        $insertList(listType);
    });
}

export function insertLink(editor: LexicalEditor, url: string, displayText?: string): void {
    if (!url) {
        return;
    }

    editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
            return;
        }

        const text = displayText?.trim() || url;

        // Check if cursor is already inside a LinkNode - edit it in place
        const anchorNode = selection.anchor.getNode();
        let linkNode: LexicalNode | null = anchorNode;
        while (linkNode && !$isLinkNode(linkNode)) {
            linkNode = linkNode.getParent();
        }

        if ($isLinkNode(linkNode)) {
            // Update existing link URL
            linkNode.setURL(url);
            // Update display text if provided and different
            if (displayText?.trim()) {
                const currentText = linkNode.getTextContent();
                if (currentText !== text) {
                    // Append new text first, then remove old children
                    // (clearing first would empty the node -> Lexical auto-deletes it)
                    const newTextNode = $createTextNode(text);
                    linkNode.append(newTextNode);
                    const children = linkNode.getChildren();
                    for (const child of children) {
                        if (child !== newTextNode) {
                            child.remove();
                        }
                    }
                }
            }
            linkNode.selectEnd();
            return;
        }

        // No existing link - insert a new one
        if (selection.isCollapsed()) {
            const textNode = $createTextNode(text);
            selection.insertNodes([textNode]);
            textNode.select();
        } else if (displayText?.trim() && displayText.trim() !== selection.getTextContent()) {
            selection.removeText();
            const textNode = $createTextNode(text);
            selection.insertNodes([textNode]);
            textNode.select();
        }

        editor.dispatchCommand(TOGGLE_LINK_COMMAND, url);
    });
}

export function insertImage(editor: LexicalEditor, src: string, alt?: string, width?: string, height?: string, alignment?: 'left' | 'center' | 'right'): void {
    if (!src) {
        return;
    }
    editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
            return;
        }
        selection.insertNodes([$createImageNode(src, alt, width, height, alignment)]);
    });
}

export function editImage(editor: LexicalEditor, src: string, alt?: string, width?: string, height?: string, alignment?: 'left' | 'center' | 'right'): void {
    editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
            return;
        }
        const imageNode = selection.getNodes().find($isImageNode);
        if (imageNode) {
            imageNode.setSrc(src);
            imageNode.setAlt(alt);
            imageNode.setWidth(width);
            imageNode.setHeight(height);
            imageNode.setAlignment(alignment);
            return;
        }
        selection.insertNodes([$createImageNode(src, alt, width, height, alignment)]);
    });
}

export function insertTable(editor: LexicalEditor, rows = 2, columns = 2): void {
    editor.dispatchCommand(INSERT_TABLE_COMMAND, { rows: String(rows), columns: String(columns) });
}

export function adjustFontSize(editor: LexicalEditor, delta: number): void {
    editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || selection.isCollapsed()) {
            return;
        }
        // extract() splits TextNodes at selection boundaries so we only modify selected text
        const nodes = selection.extract();
        for (const node of nodes) {
            if ($isTextNode(node)) {
                const currentStyle = normalizeStyle(node.getStyle());
                const currentSize = Number(currentStyle['font-size']?.replace('px', '') ?? 16);
                const nextSize = Math.max(8, Math.min(72, currentSize + delta));
                node.setStyle(styleToString({ ...normalizeStyle(node.getStyle()), 'font-size': `${nextSize}px` }));
            }
        }
    });
}

export function setFontFamily(editor: LexicalEditor, family: string): void {
    editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || selection.isCollapsed()) {
            return;
        }
        $patchStyleText(selection, { 'font-family': family });
    });
}

export function applyTextColor(editor: LexicalEditor, property: 'color' | 'background-color', value: string): void {
    editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection) || selection.isCollapsed()) {
            return;
        }
        $patchStyleText(selection, { [property]: value });
    });
}

export function clearFormatting(editor: LexicalEditor): void {
    editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
            return;
        }
        // extract() splits nodes at selection boundaries so we only clear selected text
        const nodes = selection.extract();
        for (const node of nodes) {
            if ($isTextNode(node)) {
                node.setFormat(0);
                node.setStyle('');
            }
        }
    });
}

export function transformTextCase(editor: LexicalEditor, casing: 'uppercase' | 'lowercase' | 'capitalize'): void {
    editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
            return;
        }
        // extract() splits nodes at selection boundaries so we only transform selected text
        const nodes = selection.extract();
        for (const node of nodes) {
            if ($isTextNode(node)) {
                const original = node.getTextContent();
                const transformed =
                    casing === 'uppercase'
                        ? original.toUpperCase()
                        : casing === 'lowercase'
                          ? original.toLowerCase()
                          : original.replace(/\w\S*/g, (word) => word[0].toUpperCase() + word.slice(1).toLowerCase());
                node.setTextContent(transformed);
            }
        }
    });
}

// ---------------------------------------------------------------------------
// Container node operations
// ---------------------------------------------------------------------------

/** Find the nearest ContainerNode ancestor of the current selection */
export function $getContainerNode(): ContainerNode | null {
    const selection = $getSelection();
    if (!$isRangeSelection(selection)) return null;
    let node: LexicalNode | null = selection.anchor.getNode();
    while (node) {
        if ($isContainerNode(node)) return node;
        node = node.getParent();
    }
    return null;
}

/** Update class/style on the nearest ContainerNode at the cursor */
export function updateContainer(editor: LexicalEditor, className: string, style: string): void {
    editor.update(() => {
        const container = $getContainerNode();
        if (!container) return;
        container.setOriginalClass(className);
        container.setOriginalStyle(style);
    });
}

/** Wrap the selected block elements in a new ContainerNode */
export function insertContainer(editor: LexicalEditor, tag: string, className: string, style: string): void {
    editor.update(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) return;

        const nodes = selection.getNodes();
        // Collect unique top-level block elements from the selection
        const blocks: ElementNode[] = [];
        const seen = new WeakSet<object>();
        for (const node of nodes) {
            let block: LexicalNode | null = node;
            while (block && block.getParent() && block.getParent()?.getType() !== 'root') {
                block = block.getParent();
            }
            if (block instanceof ElementNode && !seen.has(block)) {
                seen.add(block);
                blocks.push(block);
            }
        }

        if (blocks.length === 0) return;

        const container = $createContainerNode(tag, className, style);
        // Insert the container where the first block is
        blocks[0].insertBefore(container);
        // Move all selected blocks into the container
        for (const block of blocks) {
            container.append(block);
        }
    });
}

/** Remove a ContainerNode, promoting its children to its parent */
export function removeContainer(editor: LexicalEditor): void {
    editor.update(() => {
        const container = $getContainerNode();
        if (!container) return;
        const parent = container.getParent();
        if (!parent) return;
        const children = container.getChildren();
        for (const child of children) {
            container.insertBefore(child);
        }
        container.remove();
    });
}
