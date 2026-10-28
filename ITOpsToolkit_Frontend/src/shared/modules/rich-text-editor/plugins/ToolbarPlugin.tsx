import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { mergeRegister } from '@lexical/utils';
import { $createTextNode, $getNodeByKey, $getSelection, $isRangeSelection, $isTextNode, COMMAND_PRIORITY_LOW, SELECTION_CHANGE_COMMAND } from 'lexical';
import { useCallback, useEffect, useMemo, useState, type ChangeEvent } from 'react';
import { twMerge, type ClassNameValue } from 'tailwind-merge';
import { TextInput, NumberInput, SelectInput } from '@/shared/components/ui/InputFields';
import {
    Bold,
    Italic,
    Underline,
    Strikethrough,
    Subscript,
    Superscript,
    Link2,
    Image,
    AlignLeft,
    AlignCenter,
    AlignRight,
    AlignJustify,
    PaintBucket,
    Eraser,
    X,
    CaseUpperIcon,
    CaseLowerIcon,
    Plus,
    Minus,
    ALargeSmall,
    List,
    ListOrdered,
    Pencil,
    Table,
    Box,
    Trash2,
    Baseline,
} from 'lucide-react';
import {
    applyTextColor,
    adjustFontSize,
    clearFormatting,
    editImage,
    insertLink,
    insertTable,
    insertContainer,
    updateContainer,
    removeContainer,
    $getContainerNode,
    setBlockType,
    setFontFamily,
    setTextAlignment,
    toggleListType,
    toggleTextFormat,
    transformTextCase,
} from '../utils/formatting';
import { $isHeadingNode, $isQuoteNode } from '@lexical/rich-text';
import { $isImageNode } from '../nodes/ImageNode';
import { $isLinkNode } from '@lexical/link';
import { $isListNode } from '@lexical/list';
import { CodeBlockNode } from '../nodes/CodeBlockNode';
import { useRichTextEditorContext } from '../RichTextEditorContext';

const FONT_FAMILIES = ['Arial', 'Georgia', 'Times New Roman', 'Verdana', 'Courier New'];

type ToolbarModalType = 'link' | 'image' | 'table' | 'container' | null;

type ToolbarModalState = {
    url: string;
    displayText: string;
    alt: string;
    width: string;
    height: string;
    alignment: 'left' | 'center' | 'right';
    rows: string;
    columns: string;
    /** Key of existing LinkNode being edited (null = inserting new) */
    linkNodeKey: string | null;
    containerTag: string;
    containerClass: string;
    containerStyle: string;
};

const DEFAULT_MODAL_STATE: ToolbarModalState = {
    url: '',
    displayText: '',
    alt: '',
    width: '',
    height: '',
    alignment: 'center',
    rows: '2',
    columns: '2',
    linkNodeKey: null,
    containerTag: 'div',
    containerClass: '',
    containerStyle: '',
};

// --- Tailwind style constants ---

const ICON_BUTTON =
    'border-0 inline-flex items-center justify-center bg-transparent rounded-md p-0 w-7 h-7 cursor-pointer transition-colors text-slate-600 hover:bg-slate-100 hover:text-slate-900 disabled:cursor-not-allowed disabled:opacity-40';
const ICON_BUTTON_ACTIVE = 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100';
const COLOR_PICKER_LABEL = 'inline-flex items-center gap-1 text-slate-600 cursor-pointer hover:text-slate-900 transition-colors';
const COLOR_PICKER_INPUT = 'w-5 h-5 p-0 border-none rounded cursor-pointer bg-transparent';
const GROUP_DIVIDER = 'w-px h-5 bg-slate-200 mx-0.5';
const MODAL_LABEL = 'flex flex-col gap-1.5 text-[13px] text-slate-700';
const MODAL_INPUT = 'py-2.5 px-3 border border-slate-300 rounded-[10px] bg-slate-50 outline-none';
const MODAL_BUTTON_BASE = 'inline-flex items-center justify-center min-w-9 min-h-9 rounded-[10px] cursor-pointer transition-colors px-2.5 py-2 flex-1';

function ToolbarModal({
    open,
    title,
    error,
    children,
    onClose,
    onSubmit,
}: {
    open: boolean;
    title: string;
    error?: string;
    onClose: () => void;
    onSubmit: () => void;
    children: React.ReactNode;
}) {
    if (!open) {
        return null;
    }

    return (
        <div className="fixed inset-0 z-999 bg-slate-100/20 backdrop-blur-[1px] flex items-center justify-center p-4" role="dialog" aria-modal="true">
            <div className="w-[min(420px,100%)] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col min-h-40 max-h-[70dvh]" onClick={(event) => event.stopPropagation()}>
                {/* Fixed Header */}
                <div className="flex-none flex items-center justify-between p-4 border-b border-slate-100">
                    <span className="text-sm font-semibold">{title}</span>
                    <button type="button" className="border-none bg-transparent cursor-pointer text-slate-700" onClick={onClose} aria-label="Close modal" title="Close modal">
                        <X size={18} />
                    </button>
                </div>

                {/* Scrollable Body */}
                <div className="flex-1 overflow-y-auto px-4 py-4">{children}</div>

                {/* Error */}
                {error && <div className="flex-none px-4 pb-3 text-red-700 text-[13px]">{error}</div>}

                {/* Fixed Footer */}
                <div className="flex-none flex items-center justify-between p-4 gap-2.5 border-t border-slate-100">
                    <button type="button" className={twMerge(MODAL_BUTTON_BASE, 'bg-slate-50 text-gray-800 border border-slate-300')} onClick={onClose}>
                        Cancel
                    </button>
                    <button type="button" className={twMerge(MODAL_BUTTON_BASE, 'bg-blue-600 text-white border border-transparent')} onClick={onSubmit}>
                        Confirm
                    </button>
                </div>
            </div>
        </div>
    );
}

const validateUrl = (value: string) => {
    if (!value.trim()) {
        return false;
    }
    try {
        new URL(value.trim());
        return true;
    } catch {
        return false;
    }
};

export default function ToolbarPlugin({ className }: { className?: ClassNameValue }) {
    const [editor] = useLexicalComposerContext();
    const { extensions } = useRichTextEditorContext();
    const [isBold, setIsBold] = useState(false);
    const [isItalic, setIsItalic] = useState(false);
    const [isUnderline, setIsUnderline] = useState(false);
    const [isStrikethrough, setIsStrikethrough] = useState(false);
    const [isSubscript, setIsSubscript] = useState(false);
    const [isSuperscript, setIsSuperscript] = useState(false);
    const [blockType, setBlockTypeState] = useState<'normal' | 'h1' | 'h2' | 'h3' | 'h4' | 'quote' | 'code'>('normal');
    const [alignment, setAlignment] = useState<'left' | 'center' | 'right' | 'justify'>('left');
    const [listType, setListType] = useState<'bullet' | 'number' | null>(null);
    const [isInsideLink, setIsInsideLink] = useState(false);
    const [isOnImage, setIsOnImage] = useState(false);
    const [modalType, setModalType] = useState<ToolbarModalType>(null);
    const [modalState, setModalState] = useState<ToolbarModalState>(DEFAULT_MODAL_STATE);
    const [fontSize, setFontSize] = useState<string | null>(null);
    const [fontFamily, setFontFamily_] = useState<string>('Arial');
    const [textColor, setTextColor] = useState<string>('#000000');
    const [bgColor, setBgColor] = useState<string>('#ffffff');
    const [isInsideContainer, setIsInsideContainer] = useState(false);
    const [containerTag, setContainerTag] = useState('');
    const [modalError, setModalError] = useState('');

    const updateToolbar = useCallback(() => {
        const selection = $getSelection();
        if (!$isRangeSelection(selection)) {
            return;
        }

        const anchorNode = selection.anchor.getNode();

        // Read inline styles from the anchor text node (cursor position)
        const anchorTextNode = $isTextNode(anchorNode) ? anchorNode : null;
        const anchorStyle = anchorTextNode?.getStyle() ?? '';

        // Font size - show from anchor or "Mixed" if selection spans different sizes
        const selectedTextNodes = selection.getNodes().filter($isTextNode);
        const fontSizes = selectedTextNodes
            .map((node) => {
                const style = node.getStyle();
                const match = /font-size\s*:\s*([^;]+)/.exec(style);
                return match ? match[1].trim() : null;
            })
            .filter(Boolean);

        if (fontSizes.length === 0) {
            setFontSize(null);
        } else if (fontSizes.every((value) => value === fontSizes[0])) {
            setFontSize(fontSizes[0]);
        } else {
            setFontSize('Mixed');
        }

        // Font family from anchor
        const familyMatch = /font-family\s*:\s*([^;]+)/.exec(anchorStyle);
        setFontFamily_(familyMatch ? familyMatch[1].trim() : 'Arial');

        // Text color from anchor
        const colorMatch = /(?:^|;)\s*color\s*:\s*([^;]+)/.exec(anchorStyle);
        setTextColor(colorMatch ? colorMatch[1].trim() : '#000000');

        // Background color from anchor
        const bgMatch = /background-color\s*:\s*([^;]+)/.exec(anchorStyle);
        setBgColor(bgMatch ? bgMatch[1].trim() : '#ffffff');

        setIsBold(selection.hasFormat('bold'));
        setIsItalic(selection.hasFormat('italic'));
        setIsUnderline(selection.hasFormat('underline'));
        setIsStrikethrough(selection.hasFormat('strikethrough'));
        setIsSubscript(selection.hasFormat('subscript'));
        setIsSuperscript(selection.hasFormat('superscript'));
        // Walk up from the anchor to find the nearest block element (heading, quote, code, paragraph).
        // We can't use getTopLevelElement() because ContainerNodes may wrap block elements,
        // and getTopLevelElement() would return the outermost container instead.
        let blockElement = anchorNode.getParent();
        while (blockElement) {
            if ($isHeadingNode(blockElement) || $isQuoteNode(blockElement) || blockElement.getType() === CodeBlockNode.getType() || blockElement.getType() === 'paragraph') {
                break;
            }
            const parent = blockElement.getParent();
            if (!parent) break;
            blockElement = parent;
        }

        if ($isHeadingNode(blockElement)) {
            const tag = blockElement.getTag();
            setBlockTypeState(tag === 'h1' || tag === 'h2' || tag === 'h3' || tag === 'h4' ? tag : 'normal');
        } else if ($isQuoteNode(blockElement)) {
            setBlockTypeState('quote');
        } else if (blockElement?.getType() === CodeBlockNode.getType()) {
            setBlockTypeState('code');
        } else {
            setBlockTypeState('normal');
        }

        const formatType = blockElement?.getFormatType?.();
        setAlignment(formatType === 'center' || formatType === 'right' || formatType === 'justify' ? formatType : 'left');

        // Detect list type
        let detectedListType: 'bullet' | 'number' | null = null;
        let current = anchorNode.getParent();
        while (current) {
            if ($isListNode(current)) {
                const lt = current.getListType();
                detectedListType = lt === 'number' ? 'number' : 'bullet';
                break;
            }
            current = current.getParent();
        }
        setListType(detectedListType);

        // Detect link at cursor
        let linkDetected = false;
        let node = anchorNode;
        let parent = node.getParent();
        while (parent) {
            if ($isLinkNode(parent)) {
                linkDetected = true;
                break;
            }
            node = parent;
            parent = node.getParent();
        }
        setIsInsideLink(linkDetected);

        // Detect image at cursor
        const imageDetected = selection.getNodes().some($isImageNode);
        setIsOnImage(imageDetected);

        // Detect container at cursor
        const container = $getContainerNode();
        setIsInsideContainer(container !== null);
        setContainerTag(container?.getTag() ?? '');
    }, [editor]);

    useEffect(() => {
        return mergeRegister(
            editor.registerUpdateListener(({ editorState }) => {
                editorState.read(() => {
                    updateToolbar();
                });
            }),
            editor.registerCommand(
                SELECTION_CHANGE_COMMAND,
                () => {
                    updateToolbar();
                    return false;
                },
                COMMAND_PRIORITY_LOW,
            ),
        );
    }, [editor, updateToolbar]);

    const selectHeading = (value: string) => {
        const heading = value as typeof blockType;
        setBlockType(editor, heading);
    };

    const openLinkModal = useCallback(() => {
        editor.focus();
        let url = '';
        let displayText = '';
        let linkNodeKey: string | null = null;

        editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                // Walk up to find a parent LinkNode
                let node = selection.anchor.getNode();
                let parent = node.getParent();
                while (parent) {
                    if ($isLinkNode(parent)) {
                        url = parent.getURL();
                        displayText = parent.getTextContent();
                        linkNodeKey = parent.getKey();
                        break;
                    }
                    node = parent;
                    parent = node.getParent();
                }

                // If no existing link, use selected text as display text
                if (!url && !selection.isCollapsed()) {
                    displayText = selection.getTextContent();
                }
            }
        });

        setModalError('');
        setModalState({ ...DEFAULT_MODAL_STATE, url, displayText, linkNodeKey });
        setModalType('link');
    }, [editor]);

    const openImageModal = useCallback(() => {
        editor.focus();
        let url = '';
        let alt = '';
        let width = '';
        let height = '';
        let imgAlignment: 'left' | 'center' | 'right' = 'center';

        editor.getEditorState().read(() => {
            const selection = $getSelection();
            if ($isRangeSelection(selection)) {
                const node = selection.getNodes().find($isImageNode);
                if (node) {
                    url = node.getSrc();
                    alt = node.getAlt() ?? '';
                    width = node.getWidth() ?? '';
                    height = node.getHeight() ?? '';
                    imgAlignment = node.getAlignment() ?? 'center';
                }
            }
        });

        setModalError('');
        setModalState({ ...DEFAULT_MODAL_STATE, url, alt, width, height, alignment: imgAlignment });
        setModalType('image');
    }, [editor]);

    const openContainerModal = useCallback(() => {
        editor.focus();
        let tag = 'div';
        let cls = '';
        let style = '';

        editor.getEditorState().read(() => {
            const container = $getContainerNode();
            if (container) {
                tag = container.getTag();
                cls = container.getOriginalClass();
                style = container.getOriginalStyle();
            }
        });

        setModalError('');
        setModalState({ ...DEFAULT_MODAL_STATE, containerTag: tag, containerClass: cls, containerStyle: style });
        setModalType('container');
    }, [editor]);

    const closeModal = useCallback(() => {
        setModalType(null);
        setModalError('');
        setModalState(DEFAULT_MODAL_STATE);
    }, []);

    const handleModalSubmit = useCallback(() => {
        if (!modalType) {
            return;
        }

        if (modalType === 'link') {
            if (!validateUrl(modalState.url)) {
                setModalError('Please enter a valid URL.');
                return;
            }

            if (modalState.linkNodeKey) {
                // Editing an existing link - update by key (selection may be lost to modal)
                const key = modalState.linkNodeKey;
                const text = modalState.displayText.trim() || modalState.url;
                editor.update(() => {
                    const linkNode = $getNodeByKey(key);
                    if ($isLinkNode(linkNode)) {
                        linkNode.setURL(modalState.url);
                        const currentText = linkNode.getTextContent();
                        if (currentText !== text) {
                            // Insert new text node first, then remove old children
                            // (clearing first would make the node empty -> Lexical auto-deletes it)
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
                });
            } else {
                // Inserting a new link
                insertLink(editor, modalState.url, modalState.displayText.trim());
            }

            closeModal();
            return;
        }

        if (modalType === 'image') {
            if (!validateUrl(modalState.url)) {
                setModalError('Please enter a valid image URL.');
                return;
            }
            editImage(editor, modalState.url, modalState.alt.trim(), modalState.width.trim() || undefined, modalState.height.trim() || undefined, modalState.alignment);
            closeModal();
            return;
        }

        if (modalType === 'table') {
            const rows = Number(modalState.rows);
            const columns = Number(modalState.columns);
            if (!Number.isInteger(rows) || rows < 1 || rows > 10) {
                setModalError('Rows must be a number between 1 and 10.');
                return;
            }
            if (!Number.isInteger(columns) || columns < 1 || columns > 10) {
                setModalError('Columns must be a number between 1 and 10.');
                return;
            }
            insertTable(editor, rows, columns);
            closeModal();
            return;
        }

        if (modalType === 'container') {
            const tag = modalState.containerTag.trim() || 'div';
            const cls = modalState.containerClass.trim();
            const style = modalState.containerStyle.trim();

            if (isInsideContainer) {
                updateContainer(editor, cls, style);
            } else {
                insertContainer(editor, tag, cls, style);
            }
            closeModal();
        }
    }, [editor, closeModal, modalState, modalType, isInsideContainer]);

    const changeTextColor = (event: ChangeEvent<HTMLInputElement>) => {
        applyTextColor(editor, 'color', event.target.value);
    };

    const changeBackgroundColor = (event: ChangeEvent<HTMLInputElement>) => {
        applyTextColor(editor, 'background-color', event.target.value);
    };

    const modalTitle = useMemo(() => {
        if (modalType === 'link') return 'Insert or edit link';
        if (modalType === 'image') return 'Insert or edit image';
        if (modalType === 'table') return 'Insert table';
        if (modalType === 'container') return isInsideContainer ? `Edit container <${containerTag}>` : 'Insert container';
        return '';
    }, [modalType, isInsideContainer, containerTag]);

    const showRichText = extensions.richText !== false;
    const showLink = extensions.link !== false;
    const showList = extensions.list !== false;
    const showTable = extensions.table !== false;
    const showAlignment = extensions.alignment !== false;
    const showFontControls = extensions.fontControls !== false;
    const showTextCase = extensions.textCase !== false;
    const showColorAndClear = extensions.colorAndClear !== false;
    const showContainer = extensions.container !== false;

    return (
        <>
            <div className={twMerge('flex flex-wrap items-center gap-0.5 bg-slate-50 border-b border-slate-200 px-1.5 py-1', className)}>
                {/* Block type */}
                {showRichText && (
                    <>
                        <div className="flex items-center gap-0.5">
                            <SelectInput
                                className="min-w-24"
                                triggerClassName="h-7 text-xs"
                                value={blockType}
                                onChange={(val) => selectHeading(val)}
                                options={[
                                    { label: 'Normal', value: 'normal' },
                                    { label: 'H1', value: 'h1' },
                                    { label: 'H2', value: 'h2' },
                                    { label: 'H3', value: 'h3' },
                                    { label: 'H4', value: 'h4' },
                                    { label: 'Quote', value: 'quote' },
                                    { label: 'Code', value: 'code' },
                                ]}
                                clearable={false}
                                aria-label="Block type"
                                title="Block type"
                            />
                        </div>
                        <div className={GROUP_DIVIDER} />
                    </>
                )}

                {/* Inline formatting */}
                {showRichText && (
                    <>
                        <div className="flex items-center gap-0.5">
                            <button
                                type="button"
                                className={twMerge(ICON_BUTTON, isBold && ICON_BUTTON_ACTIVE)}
                                aria-label="Bold"
                                title="Bold"
                                onClick={() => toggleTextFormat(editor, 'bold')}
                            >
                                <Bold size={14} />
                            </button>
                            <button
                                type="button"
                                className={twMerge(ICON_BUTTON, isItalic && ICON_BUTTON_ACTIVE)}
                                aria-label="Italic"
                                title="Italic"
                                onClick={() => toggleTextFormat(editor, 'italic')}
                            >
                                <Italic size={14} />
                            </button>
                            <button
                                type="button"
                                className={twMerge(ICON_BUTTON, isUnderline && ICON_BUTTON_ACTIVE)}
                                aria-label="Underline"
                                title="Underline"
                                onClick={() => toggleTextFormat(editor, 'underline')}
                            >
                                <Underline size={14} />
                            </button>
                            <button
                                type="button"
                                className={twMerge(ICON_BUTTON, isStrikethrough && ICON_BUTTON_ACTIVE)}
                                aria-label="Strikethrough"
                                title="Strikethrough"
                                onClick={() => toggleTextFormat(editor, 'strikethrough')}
                            >
                                <Strikethrough size={14} />
                            </button>
                            <button
                                type="button"
                                className={twMerge(ICON_BUTTON, isSubscript && ICON_BUTTON_ACTIVE)}
                                aria-label="Subscript"
                                title="Subscript"
                                onClick={() => toggleTextFormat(editor, 'subscript')}
                            >
                                <Subscript size={14} />
                            </button>
                            <button
                                type="button"
                                className={twMerge(ICON_BUTTON, isSuperscript && ICON_BUTTON_ACTIVE)}
                                aria-label="Superscript"
                                title="Superscript"
                                onClick={() => toggleTextFormat(editor, 'superscript')}
                            >
                                <Superscript size={14} />
                            </button>
                        </div>
                        <div className={GROUP_DIVIDER} />
                    </>
                )}

                {/* Lists */}
                {showList && (
                    <>
                        <div className="flex items-center gap-0.5">
                            <button
                                type="button"
                                className={twMerge(ICON_BUTTON, listType === 'bullet' && ICON_BUTTON_ACTIVE)}
                                aria-label="Bullet list"
                                title="Bullet list"
                                onClick={() => toggleListType(editor, 'bullet')}
                            >
                                <List size={14} />
                            </button>
                            <button
                                type="button"
                                className={twMerge(ICON_BUTTON, listType === 'number' && ICON_BUTTON_ACTIVE)}
                                aria-label="Numbered list"
                                title="Numbered list"
                                onClick={() => toggleListType(editor, 'number')}
                            >
                                <ListOrdered size={14} />
                            </button>
                        </div>
                        <div className={GROUP_DIVIDER} />
                    </>
                )}

                {/* Link & Image */}
                {showLink && (
                    <>
                        <div className="flex items-center gap-0.5">
                            <button
                                type="button"
                                className={twMerge(ICON_BUTTON, isInsideLink && ICON_BUTTON_ACTIVE)}
                                aria-label="Insert link"
                                title="Insert link"
                                onClick={openLinkModal}
                            >
                                <Link2 size={14} />
                            </button>
                            {isInsideLink && (
                                <button
                                    type="button"
                                    className={twMerge(ICON_BUTTON, 'text-amber-600 hover:text-amber-700')}
                                    aria-label="Edit link"
                                    title="Edit link"
                                    onClick={openLinkModal}
                                >
                                    <Pencil size={12} />
                                </button>
                            )}
                            <button
                                type="button"
                                className={twMerge(ICON_BUTTON, isOnImage && ICON_BUTTON_ACTIVE)}
                                aria-label="Insert image"
                                title="Insert image"
                                onClick={openImageModal}
                            >
                                <Image size={14} />
                            </button>
                            {isOnImage && (
                                <button
                                    type="button"
                                    className={twMerge(ICON_BUTTON, 'text-amber-600 hover:text-amber-700')}
                                    aria-label="Edit image"
                                    title="Edit image"
                                    onClick={openImageModal}
                                >
                                    <Pencil size={12} />
                                </button>
                            )}
                        </div>
                        <div className={GROUP_DIVIDER} />
                    </>
                )}

                {/* Table */}
                {showTable && (
                    <>
                        <div className="flex items-center gap-0.5">
                            <button type="button" className={ICON_BUTTON} aria-label="Insert table" title="Insert table" onClick={() => setModalType('table')}>
                                <Table size={14} />
                            </button>
                        </div>
                        <div className={GROUP_DIVIDER} />
                    </>
                )}

                {/* Container */}
                {showContainer && (
                    <>
                        <div className="flex items-center gap-0.5">
                            <button
                                type="button"
                                className={twMerge(ICON_BUTTON, isInsideContainer && ICON_BUTTON_ACTIVE)}
                                aria-label={isInsideContainer ? 'Edit container' : 'Insert container'}
                                title={isInsideContainer ? `Edit container <${containerTag}>` : 'Insert container'}
                                onClick={openContainerModal}
                            >
                                <Box size={14} />
                            </button>
                            {isInsideContainer && (
                                <button
                                    type="button"
                                    className={twMerge(ICON_BUTTON, 'text-red-500 hover:text-red-600')}
                                    aria-label="Remove container"
                                    title="Remove container"
                                    onClick={() => removeContainer(editor)}
                                >
                                    <Trash2 size={12} />
                                </button>
                            )}
                        </div>
                        <div className={GROUP_DIVIDER} />
                    </>
                )}

                {/* Alignment */}
                {showAlignment && (
                    <>
                        <div className="flex items-center gap-0.5">
                            <button
                                type="button"
                                className={twMerge(ICON_BUTTON, alignment === 'left' && ICON_BUTTON_ACTIVE)}
                                aria-label="Align left"
                                title="Align left"
                                onClick={() => setTextAlignment(editor, 'left')}
                            >
                                <AlignLeft size={14} />
                            </button>
                            <button
                                type="button"
                                className={twMerge(ICON_BUTTON, alignment === 'center' && ICON_BUTTON_ACTIVE)}
                                aria-label="Align center"
                                title="Align center"
                                onClick={() => setTextAlignment(editor, 'center')}
                            >
                                <AlignCenter size={14} />
                            </button>
                            <button
                                type="button"
                                className={twMerge(ICON_BUTTON, alignment === 'right' && ICON_BUTTON_ACTIVE)}
                                aria-label="Align right"
                                title="Align right"
                                onClick={() => setTextAlignment(editor, 'right')}
                            >
                                <AlignRight size={14} />
                            </button>
                            <button
                                type="button"
                                className={twMerge(ICON_BUTTON, alignment === 'justify' && ICON_BUTTON_ACTIVE)}
                                aria-label="Align justify"
                                title="Align justify"
                                onClick={() => setTextAlignment(editor, 'justify')}
                            >
                                <AlignJustify size={14} />
                            </button>
                        </div>
                        <div className={GROUP_DIVIDER} />
                    </>
                )}

                {/* Font family & size */}
                {showFontControls && (
                    <>
                        <div className="flex items-center gap-2">
                            <SelectInput
                                className="min-w-24"
                                triggerClassName="h-7 text-xs"
                                value={fontFamily}
                                onChange={(val) => setFontFamily(editor, val)}
                                options={FONT_FAMILIES.map((family) => ({ label: family, value: family }))}
                                clearable={false}
                                aria-label="Font family"
                                title="Font family"
                            />
                            <div className="flex items-center gap-0.5 shadow-2xs ring ring-zinc-300 rounded" title="font size">
                                <button type="button" className={ICON_BUTTON} aria-label="Decrease font size" title="Decrease font size" onClick={() => adjustFontSize(editor, -1)}>
                                    <Minus size={14} />
                                </button>
                                <span className="inline-flex items-center justify-center min-w-14 h-7 text-[11px] text-slate-500 tabular-nums" aria-label="Current font size">
                                    {fontSize ?? 'Auto (16px)'}
                                </span>
                                <button type="button" className={ICON_BUTTON} aria-label="Increase font size" title="Increase font size" onClick={() => adjustFontSize(editor, 1)}>
                                    <Plus size={14} />
                                </button>
                            </div>
                        </div>
                        <div className={GROUP_DIVIDER} />
                    </>
                )}

                {/* Text case */}
                {showTextCase && (
                    <>
                        <div className="flex items-center gap-0.5">
                            <button type="button" className={ICON_BUTTON} aria-label="Uppercase" title="Uppercase" onClick={() => transformTextCase(editor, 'uppercase')}>
                                <CaseUpperIcon size={14} />
                            </button>
                            <button type="button" className={ICON_BUTTON} aria-label="Lowercase" title="Lowercase" onClick={() => transformTextCase(editor, 'lowercase')}>
                                <CaseLowerIcon size={14} />
                            </button>
                            <button type="button" className={ICON_BUTTON} aria-label="Capitalize" title="Capitalize" onClick={() => transformTextCase(editor, 'capitalize')}>
                                <ALargeSmall size={14} />
                            </button>
                        </div>
                        <div className={GROUP_DIVIDER} />
                    </>
                )}

                {/* Colors & clear */}
                {showColorAndClear && (
                    <div className="flex items-center gap-1">
                        <button type="button" className={ICON_BUTTON} title="Clear formatting" aria-label="Clear formatting" onClick={() => clearFormatting(editor)}>
                            <Eraser size={14} />
                        </button>
                        <label className={twMerge(COLOR_PICKER_LABEL, 'px-1 shadow-2xs ring ring-zinc-300 rounded-2xl')} title="Text color">
                            <Baseline size={14} />
                            <input type="color" className={COLOR_PICKER_INPUT} value={textColor} onChange={changeTextColor} aria-label="Text color" />
                        </label>
                        <label className={twMerge(COLOR_PICKER_LABEL, 'px-1 shadow-2xs ring ring-zinc-300 rounded-2xl')} title="Background color">
                            <PaintBucket size={14} />
                            <input type="color" className={COLOR_PICKER_INPUT} value={bgColor} onChange={changeBackgroundColor} aria-label="Background color" />
                        </label>
                    </div>
                )}
            </div>

            <ToolbarModal open={modalType !== null} title={modalTitle} error={modalError} onClose={closeModal} onSubmit={handleModalSubmit}>
                {modalType === 'table' ? (
                    <div className="grid gap-3">
                        <label className={MODAL_LABEL}>
                            Rows
                            <NumberInput
                                className={MODAL_INPUT}
                                min={1}
                                max={10}
                                value={modalState.rows === '' ? undefined : Number(modalState.rows)}
                                onChange={(v) => setModalState((prev) => ({ ...prev, rows: v === undefined ? '' : String(v) }))}
                            />
                        </label>
                        <label className={MODAL_LABEL}>
                            Columns
                            <NumberInput
                                className={MODAL_INPUT}
                                min={1}
                                max={10}
                                value={modalState.columns === '' ? undefined : Number(modalState.columns)}
                                onChange={(v) => setModalState((prev) => ({ ...prev, columns: v === undefined ? '' : String(v) }))}
                            />
                        </label>
                    </div>
                ) : null}
                {modalType === 'link' ? (
                    <div className="grid gap-3">
                        <label className={MODAL_LABEL}>
                            Display text
                            <TextInput className={MODAL_INPUT} value={modalState.displayText} onChange={(val) => setModalState((prev) => ({ ...prev, displayText: val }))} />
                        </label>
                        <label className={MODAL_LABEL}>
                            Link URL
                            <TextInput className={MODAL_INPUT} value={modalState.url} onChange={(val) => setModalState((prev) => ({ ...prev, url: val }))} />
                        </label>
                    </div>
                ) : null}
                {modalType === 'image' ? (
                    <div className="grid gap-3">
                        <label className={MODAL_LABEL}>
                            Image URL
                            <TextInput className={MODAL_INPUT} value={modalState.url} onChange={(val) => setModalState((prev) => ({ ...prev, url: val }))} />
                        </label>
                        <label className={MODAL_LABEL}>
                            Alt text
                            <TextInput className={MODAL_INPUT} value={modalState.alt} onChange={(val) => setModalState((prev) => ({ ...prev, alt: val }))} />
                        </label>
                        <label className={MODAL_LABEL}>
                            Width
                            <TextInput
                                className={MODAL_INPUT}
                                placeholder="e.g. 200px or 50%"
                                value={modalState.width}
                                onChange={(val) => setModalState((prev) => ({ ...prev, width: val }))}
                            />
                        </label>
                        <label className={MODAL_LABEL}>
                            Height
                            <TextInput
                                className={MODAL_INPUT}
                                placeholder="e.g. 150px"
                                value={modalState.height}
                                onChange={(val) => setModalState((prev) => ({ ...prev, height: val }))}
                            />
                        </label>
                        <label className={MODAL_LABEL}>
                            Alignment
                            <SelectInput
                                className={MODAL_INPUT}
                                value={modalState.alignment}
                                onChange={(val) =>
                                    setModalState((prev) => ({
                                        ...prev,
                                        alignment: val as 'left' | 'center' | 'right',
                                    }))
                                }
                                options={[
                                    { label: 'Left', value: 'left' },
                                    { label: 'Center', value: 'center' },
                                    { label: 'Right', value: 'right' },
                                ]}
                                clearable={false}
                            />
                        </label>
                    </div>
                ) : null}
                {modalType === 'container' ? (
                    <div className="grid gap-3">
                        {!isInsideContainer && (
                            <label className={MODAL_LABEL}>
                                Tag
                                <SelectInput
                                    className={MODAL_INPUT}
                                    value={modalState.containerTag}
                                    onChange={(val) => setModalState((prev) => ({ ...prev, containerTag: val }))}
                                    options={[
                                        { label: 'div', value: 'div' },
                                        { label: 'section', value: 'section' },
                                        { label: 'article', value: 'article' },
                                        { label: 'aside', value: 'aside' },
                                        { label: 'header', value: 'header' },
                                        { label: 'footer', value: 'footer' },
                                        { label: 'nav', value: 'nav' },
                                        { label: 'main', value: 'main' },
                                    ]}
                                    clearable={false}
                                />
                            </label>
                        )}
                        <label className={MODAL_LABEL}>
                            CSS Classes
                            <TextInput
                                className={MODAL_INPUT}
                                placeholder="e.g. container my-4 bg-light"
                                value={modalState.containerClass}
                                onChange={(val) => setModalState((prev) => ({ ...prev, containerClass: val }))}
                            />
                        </label>
                        <label className={MODAL_LABEL}>
                            Inline Styles
                            <TextInput
                                className={MODAL_INPUT}
                                placeholder="e.g. padding: 1rem; background: #f0f0f0"
                                value={modalState.containerStyle}
                                onChange={(val) => setModalState((prev) => ({ ...prev, containerStyle: val }))}
                            />
                        </label>
                    </div>
                ) : null}
            </ToolbarModal>
        </>
    );
}
