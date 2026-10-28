import { useCallback, useEffect, useId, useMemo, useRef, useState, type FC, type ReactNode } from 'react';
import { twMerge, type ClassNameValue } from 'tailwind-merge';
import { LexicalComposer, type InitialConfigType } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HistoryPlugin } from '@lexical/react/LexicalHistoryPlugin';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalErrorBoundary } from '@lexical/react/LexicalErrorBoundary';
import { ParagraphNode, TextNode, $getRoot, $isElementNode, $isDecoratorNode, $createParagraphNode, type LexicalEditor } from 'lexical';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { CodeBlockNode } from './nodes/CodeBlockNode';
import { ContainerNode } from './nodes/ContainerNode';
import { ListNode, ListItemNode } from '@lexical/list';
import { TableNode, TableRowNode, TableCellNode } from '@lexical/table';
import { LinkNode, AutoLinkNode } from '@lexical/link';
import { $generateNodesFromDOM } from '@lexical/html';
import { Save } from 'lucide-react';
import logger from '@/shared/utils/logger';
import defaultTheme from './themes/default/default-theme';
import './themes/default/default-style.css';
import ToolbarPlugin from './plugins/ToolbarPlugin';
import EditorExtensionsPlugin from './plugins/EditorExtensionsPlugin';
import ShadowDomSelectionPlugin from './plugins/ShadowDomSelectionPlugin';
import { exportEditorHtml } from './utils/exportHtml';
import { sanitizeHtml } from './utils/sanitizeHtml';
import { mergeOriginalAttributes, mergeInlineStyles, type MergeAttributeOptions } from './utils/mergeOriginalClasses';
import { scopeCss } from './utils/scopeCss';
import { ImageNode } from './nodes/ImageNode';
import RichTextEditorContext, {
    useRichTextEditorContext,
    type EditorExtensionsOptions,
    type RichTextEditorContextValue,
    type RichTextEditorActions,
} from './RichTextEditorContext';

const placeholder = 'Enter some rich text...';

function onError(error: unknown) {
    logger.error(error);
}

interface SubComponentProps {
    className?: ClassNameValue;
}

export type { MergeAttributeOptions as PreserveInitialHtmlOptions };

interface RichTextEditorProps {
    children?: ReactNode;
    className?: ClassNameValue;
    initialHtml?: string;
    /** Controlled editable state - when provided, parent owns edit mode */
    isEditable?: boolean;
    /** Callback when editable state changes (for controlled mode) */
    onEditableChange?: (editable: boolean) => void;
    onSave?: (htmlDocument: string) => void;
    /** Called when copy HTML is triggered */
    onCopyHtml?: (html: string) => void;
    /** Ref to imperatively call save/discard/copyHtml from outside the editor tree */
    actionsRef?: React.RefObject<RichTextEditorActions | null>;
    /** Enable/disable specific editor extensions */
    extensions?: EditorExtensionsOptions;
    /**
     * Preserve parts of the initial HTML through the editor round-trip.
     * When provided, the specified parts are kept alongside editor output.
     *
     * - `classes` - keep original CSS classes on elements alongside editor classes
     * - `styles` - keep original inline styles on elements
     * - `head` - keep original `<head>` content (style, meta, title, link tags)
     *
     * Omit entirely to disable all preservation (default editor behaviour).
     */
    preserveInitialHtml?: MergeAttributeOptions;
}

interface RichTextEditorComposition {
    Toolbar: FC<SubComponentProps>;
    Content: FC<SubComponentProps>;
    ActionBar: FC<SubComponentProps>;
}

// --- Sub-components ---

const Toolbar: FC<SubComponentProps> = ({ className }) => {
    const { isEditable } = useRichTextEditorContext();
    if (!isEditable) return null;
    return <ToolbarPlugin className={className} />;
};
Toolbar.displayName = 'RichTextEditor.Toolbar';

const Content: FC<SubComponentProps> = ({ className }) => {
    return (
        <div className={twMerge('bg-white relative min-h-80 max-h-80 overflow-auto', className)}>
            <RichTextPlugin
                contentEditable={
                    <ContentEditable
                        className="min-h-37.5 resize-none text-[15px] caret-black! relative tab-1 outline-none py-4 px-2.5 whitespace-pre-wrap"
                        aria-placeholder={placeholder}
                        placeholder={
                            <div className="text-gray-400 overflow-hidden absolute text-ellipsis top-4 left-2.5 text-[15px] select-none inline-block pointer-events-none">
                                {placeholder}
                            </div>
                        }
                    />
                }
                ErrorBoundary={LexicalErrorBoundary}
            />
            <HistoryPlugin />
            <AutoFocusPlugin />
        </div>
    );
};
Content.displayName = 'RichTextEditor.Content';

const ACTION_BUTTON_BASE =
    'inline-flex items-center gap-2 border rounded-lg px-3.5 py-2 cursor-pointer font-semibold text-[13px] transition-all hover:brightness-95 disabled:cursor-not-allowed disabled:opacity-55';

const ActionBar: FC<SubComponentProps> = ({ className }) => {
    const { isEditable, isEditorReady, startEditing, discardChanges, saveHtml } = useRichTextEditorContext();

    return (
        <div className={twMerge('flex gap-2.5 flex-wrap p-3 border-t border-slate-300/20 bg-white justify-end', className)}>
            {!isEditable ? (
                <button className={twMerge(ACTION_BUTTON_BASE, 'bg-blue-600 text-white border-transparent')} type="button" onClick={startEditing} disabled={!isEditorReady}>
                    <Save size={16} />
                    <span>{isEditorReady ? 'Edit' : 'Loading...'}</span>
                </button>
            ) : (
                <>
                    <button className={twMerge(ACTION_BUTTON_BASE, 'bg-slate-50 text-gray-900 border-slate-300')} type="button" onClick={discardChanges} disabled={!isEditorReady}>
                        Discard
                    </button>
                    <button className={twMerge(ACTION_BUTTON_BASE, 'bg-green-600 text-white border-transparent')} type="button" onClick={saveHtml} disabled={!isEditorReady}>
                        <Save size={16} />
                        <span>Save</span>
                    </button>
                </>
            )}
        </div>
    );
};
ActionBar.displayName = 'RichTextEditor.ActionBar';

// --- Main component ---

const RichTextEditor: FC<RichTextEditorProps> & RichTextEditorComposition = ({
    children,
    className,
    initialHtml,
    isEditable: controlledEditable,
    onEditableChange,
    onSave,
    onCopyHtml,
    actionsRef,
    extensions = {},
    preserveInitialHtml,
}) => {
    const scopeId = useId();
    const isControlled = controlledEditable !== undefined;
    const [internalEditable, setInternalEditable] = useState(false);
    const isEditable = isControlled ? controlledEditable : internalEditable;

    const [editorInstance, setEditorInstance] = useState<LexicalEditor | null>(null);
    const [isEditorReady, setIsEditorReady] = useState(false);
    const [savedHtml, setSavedHtml] = useState(initialHtml ?? '');
    const hasLoadedInitialHtml = useRef(false);
    const justSavedRef = useRef(false);

    // Refs for preserved initial HTML parts
    const initialHeadContentRef = useRef('');
    const originalBodyHtmlRef = useRef('');
    const originalBodyAttrsRef = useRef<Record<string, string>>({});
    /** CSS text extracted from original <style> tags - injected into editor container */
    const [injectedStyles, setInjectedStyles] = useState('');

    const initialConfig = useMemo<InitialConfigType>(
        () => ({
            namespace: 'rich-text-editor',
            nodes: [
                ParagraphNode,
                TextNode,
                HeadingNode,
                QuoteNode,
                CodeBlockNode,
                ContainerNode,
                ListNode,
                ListItemNode,
                TableNode,
                TableRowNode,
                TableCellNode,
                LinkNode,
                AutoLinkNode,
                ImageNode,
            ],
            theme: defaultTheme,
            onError,
        }),
        [],
    );

    const handleEditorReady = useCallback((editor: LexicalEditor) => {
        setEditorInstance(editor);
        setIsEditorReady(true);
    }, []);

    useEffect(() => {
        const newHtml = initialHtml ?? '';
        setSavedHtml(newHtml);
        if (justSavedRef.current) {
            // Parent echoed back what we just saved - editor state is authoritative,
            // don't re-parse HTML (which would lose inline styles like color)
            return;
        }
        hasLoadedInitialHtml.current = false;
    }, [initialHtml]);

    const getExportOptions = useCallback(() => {
        if (!preserveInitialHtml) return {};
        return {
            initialHeadContent: initialHeadContentRef.current,
            originalBodyHtml: originalBodyHtmlRef.current,
            originalBodyAttrs: originalBodyAttrsRef.current,
            preserve: preserveInitialHtml,
        };
    }, [preserveInitialHtml]);

    const restoreEditorContent = useCallback(
        (html: string) => {
            if (!editorInstance) return;

            const domParser = new DOMParser();
            // Parse the full document first to preserve <head> and <style> tags
            const htmlDocument = domParser.parseFromString(html, 'text/html');

            // Store original head content, body HTML, and body attributes
            initialHeadContentRef.current = htmlDocument.head.innerHTML;
            const sanitizedBody = sanitizeHtml(htmlDocument.body.innerHTML);
            htmlDocument.body.innerHTML = sanitizedBody;
            originalBodyHtmlRef.current = sanitizedBody;
            originalBodyAttrsRef.current = {
                class: htmlDocument.body.getAttribute('class') ?? '',
                style: htmlDocument.body.getAttribute('style') ?? '',
            };

            // Extract <style> CSS from head for injection into the editor container
            if (preserveInitialHtml?.head) {
                const styleContent = Array.from(htmlDocument.head.querySelectorAll('style'))
                    .map((s) => s.textContent ?? '')
                    .filter(Boolean)
                    .join('\n');
                setInjectedStyles(styleContent);
            } else {
                setInjectedStyles('');
            }

            editorInstance.update(() => {
                const root = $getRoot();
                root.clear();
                if (sanitizedBody) {
                    const nodes = $generateNodesFromDOM(editorInstance, htmlDocument.body);
                    let currentParagraph: ParagraphNode | null = null;
                    nodes.forEach((node) => {
                        if ($isElementNode(node) || $isDecoratorNode(node)) {
                            currentParagraph = null;
                            root.append(node);
                        } else {
                            const textContent = node.getTextContent();
                            if (!currentParagraph && textContent.trim() === '') {
                                return;
                            }
                            if (!currentParagraph) {
                                currentParagraph = $createParagraphNode();
                                root.append(currentParagraph);
                            }
                            currentParagraph.append(node);
                        }
                    });
                }
            });

            // After Lexical commits the DOM, merge original attributes onto editor elements
            if (preserveInitialHtml?.classes || preserveInitialHtml?.styles) {
                const bodyAttrs = originalBodyAttrsRef.current;
                const removeListener = editorInstance.registerUpdateListener(() => {
                    removeListener();
                    const rootElement = editorInstance.getRootElement();
                    if (!rootElement) return;

                    // Merge original classes/styles on child elements
                    if (sanitizedBody) {
                        const originalDoc = domParser.parseFromString(`<body>${sanitizedBody}</body>`, 'text/html');
                        mergeOriginalAttributes(rootElement, originalDoc.body, preserveInitialHtml);
                    }

                    // Apply original <body> tag attributes to the editor root element
                    if (preserveInitialHtml.classes && bodyAttrs.class) {
                        const current = rootElement.getAttribute('class') ?? '';
                        const merged = [...new Set([...bodyAttrs.class.split(/\s+/), ...current.split(/\s+/)])].filter(Boolean).join(' ');
                        rootElement.setAttribute('class', merged);
                    }
                    if (preserveInitialHtml.styles && bodyAttrs.style) {
                        const current = rootElement.getAttribute('style') ?? '';
                        rootElement.setAttribute('style', mergeInlineStyles(bodyAttrs.style, current));
                    }
                });
            }
        },
        [editorInstance, preserveInitialHtml],
    );

    useEffect(() => {
        if (!editorInstance || hasLoadedInitialHtml.current) return;
        restoreEditorContent(savedHtml);
        hasLoadedInitialHtml.current = true;
    }, [editorInstance, restoreEditorContent, savedHtml]);

    // Inject scoped <style> into <head> so original CSS only affects this editor instance
    useEffect(() => {
        if (!injectedStyles) return;
        const scopeSelector = `[data-rte-scope="${scopeId}"]`;
        const scoped = scopeCss(injectedStyles, scopeSelector);
        if (!scoped) return;

        const styleEl = document.createElement('style');
        styleEl.textContent = scoped;
        // Inject into shadow root if available, otherwise document.head
        const shadowRoot = document.getElementById('itops-mfe-root')?.shadowRoot;
        (shadowRoot ?? document.head).appendChild(styleEl);

        return () => {
            styleEl.remove();
        };
    }, [injectedStyles, scopeId]);

    const updateEditable = useCallback(
        (value: boolean) => {
            if (isControlled) {
                onEditableChange?.(value);
            } else {
                setInternalEditable(value);
            }
        },
        [isControlled, onEditableChange],
    );

    const startEditing = useCallback(() => {
        updateEditable(true);
        editorInstance?.focus();
    }, [editorInstance, updateEditable]);

    const discardChanges = useCallback(() => {
        restoreEditorContent(savedHtml);
        updateEditable(false);
    }, [restoreEditorContent, savedHtml, updateEditable]);

    const saveHtml = useCallback(() => {
        if (!editorInstance) return;
        const html = exportEditorHtml(editorInstance, getExportOptions());
        setSavedHtml(html);
        justSavedRef.current = true;
        updateEditable(false);
        onSave?.(html);
    }, [editorInstance, getExportOptions, onSave, updateEditable]);

    const copyHtml = useCallback(() => {
        if (!editorInstance) return '';
        const html = exportEditorHtml(editorInstance, getExportOptions());
        onCopyHtml?.(html);
        return html;
    }, [editorInstance, getExportOptions, onCopyHtml]);

    // Auto-restore content when controlled isEditable transitions true -> false (discard only)
    const prevEditableRef = useRef(isEditable);
    useEffect(() => {
        if (isControlled && prevEditableRef.current === true && isEditable === false) {
            if (justSavedRef.current) {
                // Save just happened - editor already has correct state, skip restore
                justSavedRef.current = false;
            } else {
                // Discard - restore from last saved HTML
                restoreEditorContent(savedHtml);
            }
        }
        prevEditableRef.current = isEditable;
    }, [isControlled, isEditable, restoreEditorContent, savedHtml]);

    // Expose imperative actions to parent via actionsRef
    useEffect(() => {
        if (!actionsRef) return;
        (actionsRef as React.RefObject<RichTextEditorActions | null>).current = {
            save: saveHtml,
            discard: discardChanges,
            getHtml: () => (editorInstance ? exportEditorHtml(editorInstance, getExportOptions()) : ''),
            copyHtml,
        };
        return () => {
            (actionsRef as React.RefObject<RichTextEditorActions | null>).current = null;
        };
    }, [actionsRef, saveHtml, discardChanges, copyHtml, editorInstance, getExportOptions]);

    const contextValue = useMemo<RichTextEditorContextValue>(
        () => ({
            editorInstance,
            isEditorReady,
            isEditable,
            savedHtml,
            extensions,
            startEditing,
            discardChanges,
            saveHtml,
            copyHtml,
            setEditorInstance: handleEditorReady,
            restoreEditorContent,
        }),
        [editorInstance, isEditorReady, isEditable, savedHtml, extensions, startEditing, discardChanges, saveHtml, copyHtml, handleEditorReady, restoreEditorContent],
    );

    const hasChildren = children !== undefined && children !== null;

    return (
        <LexicalComposer initialConfig={initialConfig}>
            <RichTextEditorContext.Provider value={contextValue}>
                <div
                    data-rte-scope={scopeId}
                    className={twMerge(
                        'relative text-black leading-5 font-normal text-left overflow-hidden mx-auto my-5 w-[min(760px,100%)] rounded-2xl border border-slate-300/35 shadow-lg bg-[#fafbfc]',
                        className,
                    )}
                >
                    <EditorExtensionsPlugin isEditable={isEditable} extensions={extensions} onEditorReady={handleEditorReady} />
                    <ShadowDomSelectionPlugin />
                    {hasChildren ? (
                        children
                    ) : (
                        <>
                            <Toolbar />
                            <Content />
                            <ActionBar />
                        </>
                    )}
                </div>
            </RichTextEditorContext.Provider>
        </LexicalComposer>
    );
};

RichTextEditor.Toolbar = Toolbar;
RichTextEditor.Content = Content;
RichTextEditor.ActionBar = ActionBar;

export { Toolbar as RichTextEditorToolbar, Content as RichTextEditorContent, ActionBar as RichTextEditorActionBar };
export default RichTextEditor;
