import React, { useRef, useState } from 'react';
import { useNavigate } from '@tanstack/react-router';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { twMerge, type ClassNameValue } from 'tailwind-merge';
import type { DashboardMetrics, ScheduleTask, ScheduleState } from '../../../types/types';

export interface MetricCardItem {
    id: string;
    label: string;
    value: number;
    status?: string;
}

export interface MetricCardProps {
    item: MetricCardItem;
    isActive?: boolean;
    onClick?: () => void;
    onMouseEnter?: () => void;
    onMouseLeave?: () => void;
    className?: ClassNameValue;
    valueClassName?: ClassNameValue;
    labelClassName?: ClassNameValue;
    accent?: string;
}

interface MetricCardsProps {
    metrics: DashboardMetrics;
    tasks: ScheduleTask[];
    setShowActiveSchedules?: (show: boolean) => void;
}

const MetricCard: React.FC<MetricCardProps> = ({ item, isActive = false, onClick, onMouseEnter, onMouseLeave, className, valueClassName, labelClassName, accent }) => {
    return (
        <div
            onClick={onClick}
            onMouseEnter={onMouseEnter}
            onMouseLeave={onMouseLeave}
            style={{
                borderColor: !isActive ? accent || 'rgb(187, 221, 255)' : undefined,
            }}
            className={twMerge(
                'flex-shrink-0 min-w-[200px] h-20 rounded-[12px] flex items-center px-[20px] mx-[10px] transition-[background-color] duration-200 shadow-sm border',
                isActive ? 'bg-blue-100/70 border-blue-300' : 'bg-white hover:bg-blue-100/30 hover:border-blue-300/50',
                onClick ? 'cursor-pointer' : 'cursor-default',
                className,
            )}
        >
            <div className={twMerge('text-3xl font-extrabold text-blue-950 mr-4', valueClassName)}>{item.value}</div>
            <div className={twMerge('text-sm font-semibold text-gray-800', labelClassName)}>{item.label}</div>
        </div>
    );
};

export const MetricCards: React.FC<MetricCardsProps> = ({ metrics, tasks, setShowActiveSchedules }) => {
    const navigate = useNavigate();
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    const [hoveredCardId, setHoveredCardId] = useState<string | null>(null);

    const getCount = (key: string, val: string) => {
        if (key === 'status') {
            switch (val.toLowerCase()) {
                case 'scheduled':
                    return metrics.scheduled;
                case 'completed':
                    return metrics.completed;
                case 'failed':
                    return metrics.failed;
                case 'triggered':
                    return metrics.triggered;
                default:
                    return 0;
            }
        }
        return 0;
    };

    const cards = [
        { label: 'Scheduled', count: metrics.scheduled, key: 'status', val: 'Scheduled' },
        { label: 'Completed', count: metrics.completed, key: 'status', val: 'Completed' },
        { label: 'Failed', count: metrics.failed, key: 'status', val: 'Failed' },
        { label: 'Triggered', count: metrics.triggered, key: 'status', val: 'Triggered' },
        { label: 'Awaiting', count: metrics.awaiting, key: 'awaiting', val: 'Awaiting' },
        {
            label: 'Active Schedules',
            count: getCount('status', 'Triggered'),
            key: 'active',
            val: 'schedules',
            accent: '#7c3aed',
            onCardClick: () => setShowActiveSchedules?.(true),
        },
    ];

    const handleScroll = (direction: 'left' | 'right') => {
        if (scrollContainerRef.current) {
            scrollContainerRef.current.scrollBy({
                left: direction === 'left' ? -300 : 300,
                behavior: 'smooth',
            });
        }
    };

    const handleCardClick = (card: (typeof cards)[number]) => {
        if (card.onCardClick) {
            card.onCardClick();
            return;
        }

        let filtered = tasks;

        if (card.key === 'status') {
            filtered = tasks.filter((t) => t.status === card.val);
        } else if (card.key === 'awaiting') {
            filtered = tasks.filter((t) => t.status === 'Awaiting');
        }

        const partialState: ScheduleState = {
            filterKey: card.key,
            filterValue: card.val,
            tasks: filtered,
        };

        navigate({
            to: '/faste-ai/schedule-dashboard/schedule-details',
            state: (prev) => ({
                ...prev,
                ...partialState,
            }),
        });
    };

    return (
        <div className="relative flex items-center mb-5 w-full select-none">
            <button
                onClick={() => handleScroll('left')}
                className="w-8 h-8 flex items-center justify-center border border-blue-200 rounded-lg bg-white text-blue-900 shadow-sm hover:bg-slate-50 transition-colors mr-2 active:scale-95 flex-shrink-0"
                type="button"
            >
                <ChevronLeft size={16} />
            </button>

            <div ref={scrollContainerRef} className="flex overflow-x-auto scroll-smooth flex-1 py-1 no-scrollbar gap-4" style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
                {cards.map((card) => {
                    const id = `${card.key}-${card.val}`;
                    return (
                        <MetricCard
                            key={id}
                            item={{
                                id,
                                label: card.label,
                                value: card.count,
                                status: card.val,
                            }}
                            accent={card.accent}
                            isActive={hoveredCardId === id}
                            onClick={() => handleCardClick(card)}
                            onMouseEnter={() => setHoveredCardId(id)}
                            onMouseLeave={() => setHoveredCardId(null)}
                        />
                    );
                })}
            </div>

            <button
                onClick={() => handleScroll('right')}
                className="w-8 h-8 flex items-center justify-center border border-blue-200 rounded-lg bg-white text-blue-900 shadow-sm hover:bg-slate-50 transition-colors ml-2 active:scale-95 flex-shrink-0"
                type="button"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
};
