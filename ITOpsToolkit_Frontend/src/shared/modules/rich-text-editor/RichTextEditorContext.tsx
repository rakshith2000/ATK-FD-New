import { createContext, useContext } from 'react';
import type { LexicalEditor } from 'lexical';

export interface EditorExtensionsOptions {
    /** Headings, bold, italic, underline, strikethrough, sub/superscript */
    richText?: boolean;
    /** Insert/edit links */
    link?: boolean;
    /** Bullet and numbered lists */
    list?: boolean;
    /** Insert table */
    table?: boolean;
    /** Text alignment (left, center, right, justify) */
    alignment?: boolean;
    /** Font family and font size controls */
    fontControls?: boolean;
    /** Uppercase, lowercase, capitalize */
    textCase?: boolean;
    /** Text color, background color, clear formatting */
    colorAndClear?: boolean;
    /** Insert/edit/remove container nodes (div, section, etc.) */
    container?: boolean;
}

export interface RichTextEditorActions {
    save: () => void;
    discard: () => void;
    getHtml: () => string;
    copyHtml: () => string;
}

export interface RichTextEditorContextValue {
    editorInstance: LexicalEditor | null;
    isEditorReady: boolean;
    isEditable: boolean;
    savedHtml: string;
    extensions: EditorExtensionsOptions;
    startEditing: () => void;
    discardChanges: () => void;
    saveHtml: () => void;
    copyHtml: () => string;
    setEditorInstance: (editor: LexicalEditor) => void;
    restoreEditorContent: (html: string) => void;
}

const RichTextEditorContext = createContext<RichTextEditorContextValue | null>(null);

export function useRichTextEditorContext(): RichTextEditorContextValue {
    const ctx = useContext(RichTextEditorContext);
    if (!ctx) {
        throw new Error('RichTextEditor compound components must be used within <RichTextEditor>');
    }
    return ctx;
}

export default RichTextEditorContext;
