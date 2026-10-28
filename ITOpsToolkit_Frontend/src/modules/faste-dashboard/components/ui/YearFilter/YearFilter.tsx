import React, { useState, useMemo, useRef, useEffect } from 'react';
import { IoIosArrowDown, IoIosArrowUp } from 'react-icons/io';

interface YearFilterProps {
    selectedYear: string;
    setSelectedYear: React.Dispatch<React.SetStateAction<string>>;
    filterOpen: boolean;
    setFilterOpen: React.Dispatch<React.SetStateAction<boolean>>;
    yearsList?: string[];
    onFilterChange?: (filterData: { mode: string; year: string; quarter: number | null; month: number | null; start: Date | null; end: Date | null }) => void;
}

export const YearFilter: React.FC<YearFilterProps> = ({ selectedYear, setSelectedYear, filterOpen, setFilterOpen, onFilterChange }) => {
    const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const CUR_YR = 2026;
    const YEARS = [String(CUR_YR - 2), String(CUR_YR - 1), String(CUR_YR), String(CUR_YR + 1)];

    const [filterMode, setFilterMode] = useState<string>('year');
    const [filterQuarter, setFilterQuarter] = useState<number | null>(null);
    const [filterMonth, setFilterMonth] = useState<number | null>(null);
    const [customStart, setCustomStart] = useState<string>('');
    const [customEnd, setCustomEnd] = useState<string>('');

    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleOutsideClick = (e: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setFilterOpen(false);
            }
        };
        document.addEventListener('mousedown', handleOutsideClick);
        return () => document.removeEventListener('mousedown', handleOutsideClick);
    }, [setFilterOpen]);

    const dispatchDateRangeChanges = (mode: string, targetYear: string, quarter: number | null, month: number | null, startStr: string, endStr: string) => {
        const yr = parseInt(targetYear, 10);
        const now = new Date();
        const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

        let start: Date | null = null;
        let end: Date | null = null;

        const eod = (d: Date) => {
            const e = new Date(d);
            e.setHours(23, 59, 59, 999);
            return e;
        };

        if (mode === 'today') {
            start = today;
            end = eod(today);
        } else if (mode === 'yesterday') {
            const s = new Date(today);
            s.setDate(s.getDate() - 1);
            start = s;
            end = eod(s);
        } else if (mode === 'year') {
            start = new Date(yr, 0, 1);
            end = eod(new Date(yr, 11, 31));
        } else if (mode === 'quarter' && quarter) {
            const sm = (quarter - 1) * 3;
            start = new Date(yr, sm, 1);
            end = eod(new Date(yr, sm + 3, 0));
        } else if (mode === 'month' && month !== null) {
            start = new Date(yr, month, 1);
            end = eod(new Date(yr, month + 1, 0));
        } else if (mode === 'custom' && startStr && endStr) {
            start = new Date(startStr);
            end = eod(new Date(endStr));
        }

        if (onFilterChange) {
            onFilterChange({ mode, year: targetYear, quarter, month, start, end });
        }
    };

    const filterLabel = useMemo(() => {
        switch (filterMode) {
            case 'today':
                return 'Today';
            case 'yesterday':
                return 'Yesterday';
            case 'year':
                return `Year: ${selectedYear}`;
            case 'quarter':
                return filterQuarter ? `Q${filterQuarter} ${selectedYear}` : `Quarter ${selectedYear}`;
            case 'month':
                return filterMonth !== null ? `${MONTHS[filterMonth]} ${selectedYear}` : `Month ${selectedYear}`;
            case 'custom':
                if (customStart && customEnd) {
                    return `${new Date(customStart).toLocaleDateString()} – ${new Date(customEnd).toLocaleDateString()}`;
                }
                return 'Custom Range';
            default:
                return 'All Time';
        }
    }, [filterMode, selectedYear, filterQuarter, filterMonth, customStart, customEnd]);

    return (
        <div ref={containerRef} className="relative inline-block text-left">
            <button
                type="button"
                onClick={() => setFilterOpen(!filterOpen)}
                className="px-3 py-1.5 text-xs font-bold tracking-wide rounded-xl bg-white border border-gray-200 text-[#011A80] hover:bg-slate-50 flex items-center gap-2 transition-all min-w-[150px] justify-between shadow-sm cursor-pointer select-none outline-none"
            >
                <span className="truncate">{filterLabel}</span>
                {filterOpen ? <IoIosArrowUp size={14} className="text-[#011A80]" /> : <IoIosArrowDown size={14} className="text-[#011A80]" />}
            </button>

            {filterOpen && (
                <div className="absolute right-0 top-full mt-1.5 z-50 bg-white border border-gray-100 rounded-2xl shadow-xl p-3.5 w-[340px] max-h-[85vh] overflow-y-auto select-none">
                    {/* QUICK SELECT */}
                    <div className="mb-2">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">QUICK SELECT</div>
                        <div className="flex gap-1.5">
                            {['all', 'today', 'yesterday'].map((m) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => {
                                        setFilterMode(m);
                                        setFilterOpen(false);
                                        dispatchDateRangeChanges(m, selectedYear, null, null, '', '');
                                    }}
                                    className={`px-3 py-1 leading-none rounded-full text-[11px] font-bold border-none cursor-pointer transition-colors ${
                                        filterMode === m ? 'bg-[#011A80] text-white' : 'bg-[#e8f0fe] text-[#011A80] hover:bg-blue-100'
                                    }`}
                                >
                                    {m === 'all' ? 'All Time' : m.charAt(0).toUpperCase() + m.slice(1)}
                                </button>
                            ))}
                        </div>
                    </div>

                    <hr className="my-1.5 border-t border-slate-100" />

                    {/* YEAR */}
                    <div className="mb-2">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">YEAR</div>
                        <div className="flex gap-1.5">
                            {YEARS.map((y) => {
                                const isActive = String(selectedYear) === String(y);
                                return (
                                    <button
                                        key={y}
                                        type="button"
                                        onClick={() => {
                                            setFilterMode('year');
                                            setSelectedYear(y);
                                            setFilterOpen(false);
                                            dispatchDateRangeChanges('year', y, null, null, '', '');
                                        }}
                                        className={`flex-1 py-1 leading-none rounded-full text-[11px] font-bold border-none cursor-pointer text-center transition-colors ${
                                            isActive ? 'bg-[#011A80] text-white' : 'bg-[#e8f0fe] text-[#011A80] hover:bg-blue-100'
                                        }`}
                                    >
                                        {y}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <hr className="my-1.5 border-t border-slate-100" />

                    {/* QUARTER */}
                    <div className="mb-2">
                        <div className="flex justify-between items-center mb-1.5">
                            <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">QUARTER</div>
                            <select
                                value={selectedYear}
                                onChange={(e) => {
                                    const y = e.target.value;
                                    setSelectedYear(y);
                                    dispatchDateRangeChanges(filterMode, y, filterQuarter, filterMonth, customStart, customEnd);
                                }}
                                className="text-[11px] border border-gray-200 rounded px-1.5 py-0.5 text-[#011A80] font-semibold bg-white outline-none cursor-pointer"
                            >
                                {YEARS.map((y) => (
                                    <option key={y} value={y}>
                                        {y}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="flex gap-1.5">
                            {[1, 2, 3, 4].map((q) => (
                                <button
                                    key={q}
                                    type="button"
                                    onClick={() => {
                                        setFilterMode('quarter');
                                        setFilterQuarter(q);
                                        setFilterMonth(null);
                                        setFilterOpen(false);
                                        dispatchDateRangeChanges('quarter', selectedYear, q, null, '', '');
                                    }}
                                    className={`flex-1 py-1 leading-none rounded-full text-[11px] font-bold border-none cursor-pointer text-center transition-colors ${
                                        filterMode === 'quarter' && filterQuarter === q ? 'bg-[#011A80] text-white' : 'bg-[#e8f0fe] text-[#011A80] hover:bg-blue-100'
                                    }`}
                                >
                                    Q{q}
                                </button>
                            ))}
                        </div>
                    </div>

                    <hr className="my-1.5 border-t border-slate-100" />

                    {/* MONTH */}
                    <div className="mb-2">
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">MONTH</div>
                        <div className="grid grid-cols-4 gap-1.5">
                            {MONTHS.map((m, idx) => (
                                <button
                                    key={m}
                                    type="button"
                                    onClick={() => {
                                        setFilterMode('month');
                                        setFilterMonth(idx);
                                        setFilterQuarter(null);
                                        setFilterOpen(false);
                                        dispatchDateRangeChanges('month', selectedYear, null, idx, '', '');
                                    }}
                                    className={`py-1 leading-none rounded-md text-[11px] font-bold border-none cursor-pointer text-center transition-colors ${
                                        filterMode === 'month' && filterMonth === idx ? 'bg-[#011A80] text-white' : 'bg-[#e8f0fe] text-[#011A80] hover:bg-blue-100'
                                    }`}
                                >
                                    {m}
                                </button>
                            ))}
                        </div>
                    </div>

                    <hr className="my-1.5 border-t border-slate-100" />

                    {/* CUSTOM RANGE */}
                    <div>
                        <div className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1.5">CUSTOM RANGE</div>
                        <div className="grid grid-cols-2 gap-2 mb-2">
                            <div>
                                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wide block mb-0.5">From</label>
                                <input
                                    type="date"
                                    value={customStart}
                                    onChange={(e) => setCustomStart(e.target.value)}
                                    className="w-full px-2 py-1 text-xs text-gray-700 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 h-[30px]"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] text-gray-400 font-bold uppercase tracking-wide block mb-0.5">To</label>
                                <input
                                    type="date"
                                    value={customEnd}
                                    min={customStart}
                                    onChange={(e) => setCustomEnd(e.target.value)}
                                    className="w-full px-2 py-1 text-xs text-gray-700 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:border-blue-400 h-[30px]"
                                />
                            </div>
                        </div>
                        <button
                            type="button"
                            disabled={!customStart || !customEnd}
                            onClick={() => {
                                setFilterMode('custom');
                                setFilterOpen(false);
                                dispatchDateRangeChanges('custom', selectedYear, null, null, customStart, customEnd);
                            }}
                            className={`w-full py-1.5 leading-none rounded-xl text-xs font-bold tracking-wide transition-colors text-white border-none ${
                                customStart && customEnd ? 'bg-[#011A80] hover:bg-opacity-90 cursor-pointer' : 'bg-[#d0e4ff] text-[#011A80] cursor-not-allowed'
                            }`}
                        >
                            Apply Custom Range
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
