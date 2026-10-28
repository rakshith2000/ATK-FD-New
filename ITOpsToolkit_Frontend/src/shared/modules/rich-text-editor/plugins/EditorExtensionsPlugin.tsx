import { useEffect } from 'react';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { registerRichText } from '@lexical/rich-text';
import { registerLink } from '@lexical/link';
import { registerList } from '@lexical/list';
import { registerTablePlugin } from '@lexical/table';
import { namedSignals } from '@lexical/extension';
import type { LexicalEditor } from 'lexical';
import type { EditorExtensionsOptions } from '../RichTextEditorContext';

interface EditorExtensionsPluginProps {
    isEditable: boolean;
    extensions?: EditorExtensionsOptions;
    onEditorReady?: (editor: LexicalEditor) => void;
}

const DEFAULT_EXTENSIONS: EditorExtensionsOptions = {
    richText: true,
    link: true,
    list: true,
    table: true,
};

export default function EditorExtensionsPlugin({ isEditable, extensions, onEditorReady }: EditorExtensionsPluginProps): null {
    const [editor] = useLexicalComposerContext();

    const resolvedExtensions = { ...DEFAULT_EXTENSIONS, ...extensions };

    useEffect(() => {
        onEditorReady?.(editor);
    }, [editor, onEditorReady]);

    useEffect(() => {
        editor.setEditable(isEditable);
    }, [editor, isEditable]);

    useEffect(() => {
        const cleanups: Array<() => void> = [];

        if (resolvedExtensions.richText) {
            cleanups.push(registerRichText(editor));
        }

        if (resolvedExtensions.link) {
            cleanups.push(
                registerLink(
                    editor,
                    namedSignals({
                        validateUrl: undefined,
                        attributes: undefined,
                    }),
                ),
            );
        }

        if (resolvedExtensions.list) {
            cleanups.push(registerList(editor));
        }

        if (resolvedExtensions.table) {
            cleanups.push(registerTablePlugin(editor));
        }

        return mergeRegister(...cleanups);
    }, [editor, resolvedExtensions.richText, resolvedExtensions.link, resolvedExtensions.list, resolvedExtensions.table]);

    return null;
}
