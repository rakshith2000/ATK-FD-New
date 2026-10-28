import React, { useState, useMemo, useRef, useEffect } from 'react';
import { Search, FileText } from 'lucide-react';
import { twMerge } from 'tailwind-merge';
import { useVirtualizer } from '@tanstack/react-virtual';
import { FaThLarge, FaDesktop, FaCloud, FaLinux, FaDatabase, FaNetworkWired, FaMagic, FaTimes, FaSync } from 'react-icons/fa';
import Modal from '@/shared/components/ui/Modal/Modal';
import RichTextEditor, { RichTextEditorContent } from '@/shared/modules/rich-text-editor';
import SelectInput from '../../../shared/components/ui/InputFields/SelectInput';
import { sopTextToHtml, extractSOPContentText } from '../utils/sopFormatting';
import SOPContentActions from '../components/SopContentActions';

export interface SopCardData {
    id: string;
    title: string;
    author: string;
    status: 'Approved' | 'Awaiting Approval';
    category?: 'Windows' | 'Linux' | 'Network' | 'Database' | 'Cloud' | 'Others' | 'Application' | string;
    isHighlighted?: boolean;
    sop_content?: string;
    sop_type?: string;
    u_sop_type?: string;
}

interface SopBaseTemplateProps {
    pageTitle: string;
    items: SopCardData[];
    onEnhance: (item: SopCardData) => void;
    onCardClick?: (item: SopCardData) => void;
    onDelete?: (id: string) => void;
    showSidebar?: boolean;
    onRefresh?: () => void;
    isRefreshing?: boolean;
}

const SOP_TYPE_OPTIONS = [
    { value: 'all', label: 'All SOP Types' },
    { value: 'event_based', label: 'Event Based' },
    { value: 'schedule_based', label: 'Scheduled Based' },
];

const extractSopId = (content?: string): string | null => {
    const text = extractSOPContentText(content);
    if (!text) return null;
    const match = text.match(/SOP[_\s]*ID\s*:\s*(.+)/i);
    if (!match) return null;
    const id = match[1].split(/\r?\n/)[0].trim();
    return id || null;
};

function useGridColumnCount(containerRef: React.RefObject<HTMLDivElement | null>) {
    const [columns, setColumns] = useState(1);

    useEffect(() => {
        const updateColumns = () => {
            if (!containerRef.current) return;
            const width = containerRef.current.clientWidth;
            if (width >= 1280) {
                setColumns(4);
            } else if (width >= 1024) {
                setColumns(3);
            } else if (width >= 768) {
                setColumns(2);
            } else {
                setColumns(1);
            }
        };

        updateColumns();
        const observer = new ResizeObserver(updateColumns);
        if (containerRef.current) {
            observer.observe(containerRef.current);
        }

        return () => observer.disconnect();
    }, [containerRef]);

    return columns;
}

export default function SopBaseTemplate({ pageTitle, items, onEnhance, onCardClick, onDelete, showSidebar = false, onRefresh, isRefreshing = false }: SopBaseTemplateProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTower, setActiveTower] = useState('All');
    const [sopTypeFilter, setSopTypeFilter] = useState<'all' | 'event_based' | 'schedule_based'>('all');
    const [selectedSOP, setSelectedSOP] = useState<SopCardData | null>(null);

    const parentRef = useRef<HTMLDivElement>(null);
    const columnCount = useGridColumnCount(parentRef);

    const filteredItems = useMemo(() => {
        return items.filter((item) => {
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || String(item.id).toLowerCase().includes(searchQuery.toLowerCase());

            const matchesTower = activeTower === 'All' || item.category?.toLowerCase() === activeTower.toLowerCase();

            const rawType = (item.u_sop_type || item.sop_type || '').toLowerCase();
            let matchesType = true;
            if (sopTypeFilter === 'event_based') {
                matchesType = rawType.includes('event');
            } else if (sopTypeFilter === 'schedule_based') {
                matchesType = rawType.includes('sched');
            }

            return matchesSearch && matchesTower && matchesType;
        });
    }, [items, searchQuery, activeTower, sopTypeFilter]);

    const rows = useMemo(() => {
        const result: SopCardData[][] = [];
        for (let i = 0; i < filteredItems.length; i += columnCount) {
            result.push(filteredItems.slice(i, i + columnCount));
        }
        return result;
    }, [filteredItems, columnCount]);

    const virtualizer = useVirtualizer({
        count: rows.length,
        getScrollElement: () => parentRef.current,
        estimateSize: () => 140,
        overscan: 5,
    });

    const handleDelete = (e: React.MouseEvent, id: string) => {
        e.preventDefault();
        e.stopPropagation();
        if (onDelete) {
            onDelete(id);
        }
    };

    const handleCardClick = (item: SopCardData) => {
        setSelectedSOP(item);
        if (onCardClick) {
            onCardClick(item);
        }
    };

    const handleEnhanceClick = (e: React.MouseEvent, item: SopCardData) => {
        e.preventDefault();
        e.stopPropagation();
        onEnhance(item);
    };

    return (
        <div className="w-full h-screen max-h-screen overflow-hidden bg-[#f8fafd] flex flex-col p-4 md:p-5 relative">
            {/* Top Header Bar */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-4 shrink-0">
                <h1 className="text-lg font-bold text-[#011a80] tracking-wide">{pageTitle}</h1>

                <div className="flex items-center gap-2.5 w-full md:w-auto flex-wrap md:flex-nowrap">
                    <div className="relative flex-1 md:w-56">
                        <span className="absolute inset-y-0 left-3 flex items-center text-gray-400">
                            <Search size={15} />
                        </span>
                        <input
                            type="text"
                            placeholder="Search SOPs"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full bg-white border border-gray-200 rounded-xl pl-9 pr-3 py-1.5 text-xs focus:outline-none focus:border-[#3b5cd7] transition-all"
                        />
                    </div>

                    <div className="w-44">
                        <SelectInput
                            value={sopTypeFilter}
                            onChange={(val) => setSopTypeFilter((val || 'all') as 'all' | 'event_based' | 'schedule_based')}
                            options={SOP_TYPE_OPTIONS}
                            placeholder="Select SOP Type"
                            clearable={false}
                            triggerClassName="bg-white border-gray-200 text-gray-700 text-xs rounded-xl px-2.5 py-1.5 h-[34px] focus:border-[#3b5cd7]"
                        />
                    </div>

                    <div className="bg-[#011a80] text-white px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm whitespace-nowrap h-[34px] flex items-center">
                        Total SOPs: <span className="ml-1 text-sm">{filteredItems.length}</span>
                    </div>

                    {onRefresh && (
                        <button
                            type="button"
                            onClick={onRefresh}
                            disabled={isRefreshing}
                            className="bg-white text-[#3b5cd7] border border-[#bce0ff] hover:bg-blue-50 px-3 py-1.5 rounded-xl text-xs font-bold shadow-sm flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50 h-[34px]"
                            title="Refresh SOPs"
                        >
                            <FaSync className={isRefreshing ? 'animate-spin' : ''} size={12} />
                            <span>Refresh</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Area (Sidebar aligned with Cards start) */}
            <div className="flex-1 flex gap-4 overflow-hidden items-start">
                {showSidebar && (
                    <div className="w-14 bg-white border border-gray-200 rounded-2xl p-2 flex flex-col items-center gap-3 shadow-sm shrink-0 h-fit py-3">
                        {[
                            { id: 'All', icon: <FaThLarge size={15} /> },
                            { id: 'Windows', icon: <FaDesktop size={15} /> },
                            { id: 'Cloud', icon: <FaCloud size={15} /> },
                            { id: 'Linux', icon: <FaLinux size={15} /> },
                            { id: 'Database', icon: <FaDatabase size={14} /> },
                            { id: 'Network', icon: <FaNetworkWired size={14} /> },
                        ].map((tower) => (
                            <button
                                key={tower.id}
                                onClick={() => setActiveTower(tower.id)}
                                className={twMerge(
                                    'w-10 h-10 rounded-xl flex items-center justify-center transition-all border border-transparent cursor-pointer',
                                    activeTower === tower.id
                                        ? 'bg-[#e3f2fd] text-[#3b5cd7] border-[#bce0ff] shadow-sm font-bold'
                                        : 'bg-[#f8fafd] text-gray-400 hover:bg-gray-100 hover:text-gray-600',
                                )}
                                title={tower.id}
                            >
                                {tower.icon}
                            </button>
                        ))}
                    </div>
                )}

                {/* Scrollable Virtual Grid */}
                <div
                    ref={parentRef}
                    className="flex-1 h-full overflow-y-auto pr-1.5 pb-24 [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-track]:bg-transparent [&::-webkit-scrollbar-thumb]:bg-gray-200 [&::-webkit-scrollbar-thumb]:rounded-full hover:[&::-webkit-scrollbar-thumb]:bg-gray-300"
                >
                    <div
                        style={{
                            height: `${virtualizer.getTotalSize()}px`,
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        {virtualizer.getVirtualItems().map((virtualRow) => {
                            const rowItems = rows[virtualRow.index];
                            return (
                                <div
                                    key={virtualRow.key}
                                    ref={virtualizer.measureElement}
                                    data-index={virtualRow.index}
                                    style={{
                                        position: 'absolute',
                                        top: 0,
                                        left: 0,
                                        width: '100%',
                                        transform: `translateY(${virtualRow.start}px)`,
                                    }}
                                >
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 w-full pb-3">
                                        {rowItems.map((sop) => {
                                            const displayTitle = extractSopId(sop.sop_content) || sop.title;
                                            return (
                                                <div
                                                    key={sop.id}
                                                    onClick={() => handleCardClick(sop)}
                                                    className="bg-white border border-[#d6ebff] rounded-xl p-3.5 shadow-sm hover:bg-[#EEF6FF] cursor-pointer transition-all flex flex-col justify-between relative min-h-[125px]"
                                                    style={{ boxShadow: '0px 0px 16px 0px rgba(89, 172, 255, 0.35) inset' }}
                                                >
                                                    <span
                                                        onClick={(e) => handleDelete(e, sop.id)}
                                                        className="absolute top-3 right-3 text-gray-400 hover:text-red-500 font-bold text-sm cursor-pointer leading-none z-10 flex items-center justify-center border-none bg-transparent"
                                                    >
                                                        <FaTimes size={13} />
                                                    </span>

                                                    <div>
                                                        <h3 className="text-xs font-bold text-gray-800 mb-1 truncate pr-5" title={displayTitle}>
                                                            {displayTitle}
                                                        </h3>
                                                        <div className="text-[10px] text-gray-400 font-medium flex items-center gap-1">
                                                            By: <span className="font-semibold text-gray-600 truncate max-w-[90px]">{sop.author}</span>
                                                            <span
                                                                className={twMerge(
                                                                    'ml-1 px-1.5 py-0.5 rounded font-bold text-[9px] whitespace-nowrap',
                                                                    sop.status === 'Approved' ? 'text-[#2a9619] bg-[#e6f4ea]' : 'text-amber-700 bg-amber-50',
                                                                )}
                                                            >
                                                                {sop.status}
                                                            </span>
                                                        </div>
                                                    </div>

                                                    <div className="flex justify-end mt-2.5">
                                                        <button
                                                            type="button"
                                                            onClick={(e) => handleEnhanceClick(e, sop)}
                                                            className="px-3 py-1 rounded-full text-[11px] font-bold border transition-all flex items-center gap-1 shadow-xs bg-white text-[#004fc4] border-[#bce0ff] hover:bg-[#004fc4] hover:text-white hover:border-[#004fc4]"
                                                        >
                                                            <FaMagic className="text-[9px]" /> Enhance
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>

            {/* SOP Content View Modal */}
            <Modal open={Boolean(selectedSOP)} size="3xl" onClose={() => setSelectedSOP(null)}>
                <Modal.Header>
                    <div className="flex items-center justify-between w-full pr-6">
                        <div className="flex flex-col gap-0.5">
                            <span className="text-[var(--brand-title-primary-color,#011a80)] font-bold flex items-center gap-2 text-sm">
                                <FileText className="text-[var(--brand-title-primary-color,#011a80)]" size={16} />
                                {extractSopId(selectedSOP?.sop_content) || selectedSOP?.title || 'SOP Content Blueprint'}
                            </span>
                            {selectedSOP && (
                                <p className="text-[11px] text-gray-400 font-normal pl-6">
                                    Author: {selectedSOP.author} • Status: {selectedSOP.status}
                                </p>
                            )}
                        </div>

                        <SOPContentActions content={selectedSOP?.sop_content} fileName={selectedSOP?.title} />
                    </div>
                </Modal.Header>

                <Modal.Body className="p-3.5 border border-[rgba(187,221,255,0.6)] shadow-[inset_0px_0px_20px_0px_rgba(89,172,255,0.302)] rounded-xl space-y-2 max-h-[60vh] overflow-y-auto">
                    {selectedSOP?.sop_content ? (
                        <RichTextEditor
                            key={selectedSOP.id || selectedSOP.title}
                            initialHtml={sopTextToHtml(selectedSOP.sop_content)}
                            isEditable={false}
                            preserveInitialHtml={{ classes: true, styles: true, head: true }}
                            className="w-full my-0 border-0 shadow-none bg-transparent"
                        >
                            <RichTextEditorContent className="min-h-0 max-h-none overflow-visible bg-transparent p-0" />
                        </RichTextEditor>
                    ) : (
                        <p className="text-slate-400 text-xs italic">No description content provided for this SOP.</p>
                    )}
                </Modal.Body>

                <Modal.Footer className="justify-end pt-2 bg-slate-50/60 rounded-b-lg">
                    <button
                        type="button"
                        onClick={(e) => {
                            if (selectedSOP) {
                                const itemToEnhance = selectedSOP;
                                setSelectedSOP(null);
                                handleEnhanceClick(e, itemToEnhance);
                            }
                        }}
                        className="bg-[#004fc4] text-white px-4 py-1.5 rounded-xl text-xs font-bold shadow-sm hover:bg-[#003da1] transition-all flex items-center gap-1.5 cursor-pointer"
                    >
                        <FaMagic size={11} /> Enhance This SOP
                    </button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}
