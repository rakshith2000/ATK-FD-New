import { useState, useEffect, useRef, useCallback } from 'react';
import { FaCheckCircle, FaBold, FaItalic, FaUnderline, FaListOl, FaListUl, FaCode, FaUndo, FaRedo, FaMinus, FaTimes } from 'react-icons/fa';
import { MdFormatQuote } from 'react-icons/md';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { SOP_QUERY_KEYS } from '../constants/query-keys';
import fasteaiApiClient from '@/api/axios-clients/fasteai/fasteai-api-client';
import { sopTextToHtml, extractSOPContentText } from '../utils/sopFormatting';
import SOPContentActions from '../components/SopContentActions';
import SOPWorkflowDiagram, { type WorkflowItem } from '../components/SopWorkflowDiagram';

type SopMessageContent =
    | string
    | {
          text?: string;
          content?: string;
          message?: string;
          body?: string;
          workflow?: WorkflowItem[];
      }
    | null;

interface SopMessage {
    role: 'assistant' | 'user' | 'error';
    sop_content?: unknown;
    content?: SopMessageContent;
    workflow?: WorkflowItem[];
    u_sop_type?: string;
    sop_type?: string;
}

interface SopDocumentPreviewProps {
    messages: SopMessage[];
    isGenerating: boolean;
    sopData?: {
        id?: string;
        sop_name?: string;
        sop_content?: string;
        category?: string;
        is_approved?: string;
        created_by?: string;
        u_sop_type?: string;
        sop_type?: string;
        workflow?: WorkflowItem[];
    } | null;
    onApproveSuccess?: () => void;
}

export default function SopDocumentPreview({ messages, sopData = null, onApproveSuccess }: SopDocumentPreviewProps) {
    const [hasContent, setHasContent] = useState(false);
    const [viewMode, setViewMode] = useState<'full' | 'workflow'>('full');
    const [showExportMenu, setShowExportMenu] = useState(false);
    const [showToast, setShowToast] = useState(false);
    const [toastMessage, setToastMessage] = useState('');
    const [toastVariant, setToastVariant] = useState<'success' | 'danger'>('success');
    const [currentRawContent, setCurrentRawContent] = useState('');
    const [workflowData, setWorkflowData] = useState<WorkflowItem[]>([]);

    const editorRef = useRef<HTMLDivElement>(null);
    const lastAgentContentRef = useRef('');
    const queryClient = useQueryClient();

    const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null;

    const getWorkflowFromPayload = useCallback((payload: unknown): WorkflowItem[] => {
        if (!isRecord(payload)) return [];
        if (Array.isArray(payload.workflow) && payload.workflow.length > 0) return payload.workflow as WorkflowItem[];
        if (isRecord(payload.content) && Array.isArray(payload.content.workflow) && payload.content.workflow.length > 0) return payload.content.workflow as WorkflowItem[];
        if (isRecord(payload.sop_content) && Array.isArray(payload.sop_content.workflow) && payload.sop_content.workflow.length > 0)
            return payload.sop_content.workflow as WorkflowItem[];

        const targets = [payload.sop_content, payload.content];
        for (const t of targets) {
            if (typeof t === 'string' && t.trim().startsWith('{')) {
                try {
                    const parsed: unknown = JSON.parse(t);
                    if (isRecord(parsed) && Array.isArray(parsed.workflow) && parsed.workflow.length > 0) return parsed.workflow as WorkflowItem[];
                    if (isRecord(parsed) && isRecord(parsed.content) && Array.isArray(parsed.content.workflow)) return parsed.content.workflow as WorkflowItem[];
                    if (isRecord(parsed) && isRecord(parsed.sop_content) && Array.isArray(parsed.sop_content.workflow)) return parsed.sop_content.workflow as WorkflowItem[];
                } catch {}
            }
        }
        return [];
    }, []);

    const syncEditorDOM = useCallback((content: string) => {
        if (editorRef.current && content) {
            editorRef.current.innerHTML = sopTextToHtml(content);
        }
    }, []);

    // Sync content and workflow from sopData prop when editing
    useEffect(() => {
        if (sopData?.sop_content) {
            const textContent = extractSOPContentText(sopData.sop_content);
            lastAgentContentRef.current = textContent;
            setCurrentRawContent(textContent);
            setHasContent(Boolean(textContent.trim()));
            syncEditorDOM(textContent);

            const workflow = getWorkflowFromPayload(sopData);
            if (workflow.length > 0) setWorkflowData(workflow);
        }
    }, [sopData, getWorkflowFromPayload, syncEditorDOM]);

    // Sync state with messages array
    useEffect(() => {
        if (messages.length === 0) {
            if (editorRef.current) editorRef.current.innerHTML = '';
            lastAgentContentRef.current = '';
            setCurrentRawContent('');
            setHasContent(false);
            setWorkflowData([]);
            return;
        }

        const assistantMessages = messages.filter((m) => m.role === 'assistant');

        for (let i = assistantMessages.length - 1; i >= 0; i--) {
            const wf = getWorkflowFromPayload(assistantMessages[i]);
            if (wf && wf.length > 0) {
                setWorkflowData(wf);
                break;
            }
        }

        if (assistantMessages.length > 0) {
            const latest = assistantMessages[assistantMessages.length - 1];
            const rawContent = extractSOPContentText(latest.sop_content || latest.content);

            if (rawContent && rawContent.trim() && rawContent !== lastAgentContentRef.current) {
                lastAgentContentRef.current = rawContent;
                setCurrentRawContent(rawContent);
                syncEditorDOM(rawContent);
                setHasContent(true);
            }
        }
    }, [messages, getWorkflowFromPayload, syncEditorDOM]);

    useEffect(() => {
        if (viewMode === 'full' && lastAgentContentRef.current) {
            setTimeout(() => {
                syncEditorDOM(lastAgentContentRef.current);
            }, 0);
        }
    }, [viewMode, syncEditorDOM]);

    const execCmd = useCallback((cmd: string, value: string | null = null) => {
        editorRef.current?.focus();
        document.execCommand(cmd, false, value ?? undefined);
    }, []);

    const getEditorText = useCallback(() => editorRef.current?.innerText || editorRef.current?.textContent || currentRawContent, [currentRawContent]);

    const getEditorHtml = useCallback(() => editorRef.current?.innerHTML || sopTextToHtml(lastAgentContentRef.current), []);

    const handleEditorInput = useCallback(() => {
        const text = editorRef.current?.innerText?.trim() || '';
        setHasContent(text.length > 0);
        setCurrentRawContent(getEditorText());
    }, [getEditorText]);

    const exportAsWord = () => {
        const defaultName = `SOP_Document_${new Date().toISOString().split('T')[0]}.doc`;
        const fileName = prompt('Enter filename for Word document:', defaultName);
        if (!fileName) return;
        const body = getEditorHtml();
        const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>SOP</title></head><body>${body}</body></html>`;
        const blob = new Blob([html], { type: 'application/msword' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = fileName.endsWith('.doc') ? fileName : `${fileName}.doc`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    const exportAsPdf = () => {
        const defaultName = `SOP_Document_${new Date().toISOString().split('T')[0]}`;
        const fileName = prompt('Enter filename for PDF:', defaultName);
        if (!fileName) return;
        const body = getEditorHtml();

        const iframe = document.createElement('iframe');
        iframe.style.position = 'fixed';
        iframe.style.right = '0';
        iframe.style.bottom = '0';
        iframe.style.width = '0';
        iframe.style.height = '0';
        iframe.style.border = '0';
        document.body.appendChild(iframe);

        const doc = iframe.contentWindow?.document;
        if (!doc) return;

        doc.open();
        doc.write(`
            <!DOCTYPE html>
            <html>
                <head>
                    <meta charset="utf-8">
                    <title>${fileName}</title>
                </head>
                <body>
                    ${body}
                </body>
            </html>
        `);
        doc.close();

        setTimeout(() => {
            iframe.contentWindow?.focus();
            iframe.contentWindow?.print();
            setTimeout(() => document.body.removeChild(iframe), 1000);
        }, 200);
    };

    const handleExport = (format: 'pdf' | 'word') => {
        setShowExportMenu(false);
        if (!hasContent) return;
        if (format === 'pdf') exportAsPdf();
        else if (format === 'word') exportAsWord();
    };

    const extractField = (text: string, fieldName: string) => {
        const m = text.match(new RegExp(`${fieldName}:\\s*(.+)`, 'i'));
        return m ? m[1].trim() : null;
    };

    const mapSopType = useCallback((sopType?: string) => {
        if (!sopType || typeof sopType !== 'string') return '';
        const normalized = sopType.trim().toLowerCase();
        if (normalized === 'schedule') return 'schedule_based';
        if (normalized === 'event') return 'event_based';
        return sopType;
    }, []);

    const getGeneratedSopType = useCallback(() => {
        const latest = [...messages].reverse().find((m) => m.role === 'assistant' && (m.u_sop_type || m.sop_type));
        const rawType = latest?.u_sop_type || latest?.sop_type || '';
        return mapSopType(rawType);
    }, [messages, mapSopType]);

    const approveMutation = useMutation({
        mutationFn: async (content: string) => {
            const detectedSopType =
                getGeneratedSopType() || extractField(content, 'Ticket Type') || extractField(content, 'TICKET_TYPE') || extractField(content, 'Ticket_Type') || '';

            if (sopData) {
                await fasteaiApiClient.put(`/sops/${sopData.id}`, {
                    ...sopData,
                    sop_content: content,
                    u_sop_type: detectedSopType || sopData.u_sop_type || sopData.sop_type || '',
                    created_by: 'UI',
                    LastObserved_On: new Date().toISOString(),
                });
            } else {
                const sopId = extractField(content, 'SOP_ID') || extractField(content, 'SOP ID') || `SOP-${Date.now()}`;
                const osType = (extractField(content, 'Operating_System') || extractField(content, 'Operating System') || '').toLowerCase();
                const category = osType.includes('windows') ? 'windows' : osType.includes('linux') ? 'linux' : 'application';

                await fasteaiApiClient.post('/sops', {
                    sop_name: `${sopId}.docx`,
                    sop_content: content,
                    category,
                    u_sop_type: detectedSopType,
                    is_approved: 'False',
                    created_by: 'UI',
                    Created_On: new Date().toISOString(),
                    LastObserved_On: new Date().toISOString(),
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: SOP_QUERY_KEYS.UNIFIED_DATASET });
            setToastMessage('SOP submitted successfully!');
            setToastVariant('success');
            setShowToast(true);
            if (onApproveSuccess) onApproveSuccess();
        },
        onError: (err: unknown) => {
            const errorMessage = err instanceof Error ? err.message : String(err);
            setToastMessage(errorMessage || 'Failed to submit SOP.');
            setToastVariant('danger');
            setShowToast(true);
        },
    });

    const handleApprove = () => {
        const text = getEditorText();
        if (!text.trim()) return;
        approveMutation.mutate(text);
    };

    const handleActionResult = (msg: string) => {
        setToastMessage(msg);
        setToastVariant('success');
        setShowToast(true);
    };

    return (
        <div className="bg-white border border-[#d6ebff] rounded-2xl shadow-[inset_0px_0px_20px_0px_rgba(89,172,255,0.5019607843)] flex flex-col h-full w-full box-border overflow-hidden relative">
            {showToast && (
                <div
                    className={`absolute top-4 right-4 z-50 min-w-[260px] p-4 rounded-xl shadow-lg border text-white font-semibold flex items-center justify-between ${
                        toastVariant === 'success' ? 'bg-emerald-600 border-emerald-500' : 'bg-rose-600 border-rose-500'
                    }`}
                >
                    <span>{toastMessage}</span>
                    <button
                        onClick={() => setShowToast(false)}
                        className="ml-4 text-white hover:text-gray-200 cursor-pointer flex items-center justify-center p-1 transition-colors border-none bg-transparent"
                    >
                        <FaTimes size={14} />
                    </button>
                </div>
            )}

            {/* Header Bar */}
            <div className="flex items-center justify-between bg-[#bbddff] border-b border-[#a5d2ff] px-5 py-3 h-16 min-h-[64px] max-h-[64px] shrink-0 box-border gap-4 mb-4">
                <h2 className="text-[15px] font-bold text-[#011a80] leading-none m-0 flex items-center">Standard Operating Procedure</h2>
                <div className="flex items-center gap-2 h-8">
                    {/* Export Menu */}
                    <div className="relative">
                        <button
                            className="px-3 py-1.5 border border-gray-200 bg-white text-gray-600 hover:bg-gray-50 disabled:opacity-40 rounded-xl text-xs font-bold transition-all cursor-pointer h-8 flex items-center box-border"
                            onClick={() => setShowExportMenu((v) => !v)}
                            disabled={!hasContent}
                        >
                            Export
                        </button>
                        {showExportMenu && (
                            <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-xl shadow-lg py-1.5 z-50 flex flex-col min-w-[160px]">
                                <button
                                    className="px-4 py-2 text-left text-xs text-gray-700 hover:bg-slate-50 cursor-pointer font-medium border-none bg-transparent"
                                    onClick={() => handleExport('pdf')}
                                >
                                    Export as PDF
                                </button>
                                <button
                                    className="px-4 py-2 text-left text-xs text-gray-700 hover:bg-slate-50 cursor-pointer font-medium border-none bg-transparent"
                                    onClick={() => handleExport('word')}
                                >
                                    Export as Word (.doc)
                                </button>
                            </div>
                        )}
                    </div>

                    <button
                        className="px-3 py-1.5 border border-[#3b5cd7] text-[#3b5cd7] bg-white hover:bg-blue-50 disabled:opacity-40 rounded-xl text-xs font-bold transition-all cursor-pointer h-8 flex items-center box-border"
                        onClick={() => setViewMode(viewMode === 'full' ? 'workflow' : 'full')}
                        disabled={!hasContent}
                    >
                        {viewMode === 'full' ? 'View Workflow Diagram' : 'Back to SOP text'}
                    </button>

                    {hasContent && (
                        <SOPContentActions content={currentRawContent || getEditorText()} fileName={sopData?.sop_name || 'SOP_Document'} onResult={handleActionResult} />
                    )}

                    <button
                        className="px-3 py-1.5 bg-[#16a34a] hover:bg-[#128a3e] disabled:bg-gray-100 text-white disabled:text-gray-400 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer h-8 box-border border-none"
                        onClick={handleApprove}
                        disabled={!hasContent || approveMutation.isPending}
                    >
                        <FaCheckCircle /> {approveMutation.isPending ? 'Submitting...' : 'Submit'}
                    </button>
                </div>
            </div>

            {viewMode === 'full' && (
                <div className="mx-5 flex items-center gap-1.5 p-2 bg-slate-50 border border-gray-100 rounded-xl shrink-0 flex-wrap mb-4 box-border">
                    <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer border-none bg-transparent flex items-center justify-center"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            execCmd('bold');
                        }}
                        title="Bold (Ctrl+B)"
                    >
                        <FaBold size={11} />
                    </button>
                    <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer border-none bg-transparent flex items-center justify-center"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            execCmd('italic');
                        }}
                        title="Italic (Ctrl+I)"
                    >
                        <FaItalic size={11} />
                    </button>
                    <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer border-none bg-transparent flex items-center justify-center"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            execCmd('underline');
                        }}
                        title="Underline (Ctrl+U)"
                    >
                        <FaUnderline size={11} />
                    </button>

                    <div className="w-[1px] h-4 bg-gray-200 mx-1" />

                    <button
                        type="button"
                        className="px-2 py-1 text-xs font-bold text-gray-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer border-none bg-transparent"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            execCmd('formatBlock', 'h1');
                        }}
                    >
                        H1
                    </button>
                    <button
                        type="button"
                        className="px-2 py-1 text-xs font-bold text-gray-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer border-none bg-transparent"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            execCmd('formatBlock', 'h2');
                        }}
                    >
                        H2
                    </button>
                    <button
                        type="button"
                        className="px-2 py-1 text-xs font-bold text-gray-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer border-none bg-transparent"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            execCmd('formatBlock', 'h3');
                        }}
                    >
                        H3
                    </button>

                    <div className="w-[1px] h-4 bg-gray-200 mx-1" />

                    <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer border-none bg-transparent flex items-center justify-center"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            execCmd('insertOrderedList');
                        }}
                    >
                        <FaListOl size={11} />
                    </button>
                    <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer border-none bg-transparent flex items-center justify-center"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            execCmd('insertUnorderedList');
                        }}
                    >
                        <FaListUl size={11} />
                    </button>

                    <div className="w-[1px] h-4 bg-gray-200 mx-1" />

                    <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer border-none bg-transparent flex items-center justify-center"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            execCmd('undo');
                        }}
                    >
                        <FaUndo size={10} />
                    </button>
                    <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer border-none bg-transparent flex items-center justify-center"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            execCmd('redo');
                        }}
                    >
                        <FaRedo size={10} />
                    </button>
                    <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer border-none bg-transparent flex items-center justify-center"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            execCmd('insertHorizontalRule');
                        }}
                    >
                        <FaMinus size={11} />
                    </button>
                    <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer border-none bg-transparent flex items-center justify-center"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            execCmd('formatBlock', 'blockquote');
                        }}
                    >
                        <MdFormatQuote size={12} />
                    </button>
                    <button
                        type="button"
                        className="p-2 text-gray-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-all cursor-pointer border-none bg-transparent flex items-center justify-center"
                        onMouseDown={(e) => {
                            e.preventDefault();
                            execCmd('formatBlock', 'pre');
                        }}
                    >
                        <FaCode size={12} />
                    </button>
                </div>
            )}

            {/* Main Document Body Box */}
            <div className="flex-1 overflow-hidden rounded-xl bg-slate-50 border border-gray-100 p-5 mx-5 mb-5 box-border flex flex-col relative">
                <div className="w-full h-full flex-1 flex flex-col overflow-y-auto" style={{ display: viewMode === 'full' ? 'flex' : 'none' }}>
                    <div
                        ref={editorRef}
                        contentEditable
                        onInput={handleEditorInput}
                        className="w-full flex-1 outline-none text-gray-800 leading-relaxed text-xs min-h-[200px] pb-8"
                        style={{ whiteSpace: 'normal' }}
                    />
                    {!hasContent && (
                        <div className="h-full flex items-center justify-center p-4 my-auto pointer-events-none">
                            <div className="text-center max-w-xs">
                                <h3 className="text-xs font-bold text-[#011a80] mb-1">Awaiting SOP Generation</h3>
                                <p className="text-[11px] text-gray-400 leading-normal">
                                    Your standard operating procedure will render here. You can then edit it, export, or submit.
                                </p>
                            </div>
                        </div>
                    )}
                </div>

                <div className="w-full h-full flex-1 flex flex-col overflow-y-auto" style={{ display: viewMode === 'workflow' ? 'flex' : 'none' }}>
                    <SOPWorkflowDiagram workflowData={workflowData} />
                </div>
            </div>
        </div>
    );
}
