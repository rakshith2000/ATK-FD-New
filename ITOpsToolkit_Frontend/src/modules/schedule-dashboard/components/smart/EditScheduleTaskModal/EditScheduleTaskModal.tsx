import React, { useMemo } from 'react';
import Modal from '@/shared/components/ui/Modal/Modal';
import { TextInput, SelectInput, MultiSelectInput, DateInput, type SelectOption } from '@/shared/components/ui/InputFields';
import type { ScheduleTask, Tower, TaskStatus } from '../../../types/types';

interface EditScheduleTaskModalProps {
    open: boolean;
    editingItem: ScheduleTask | null;
    isLoadingCis: boolean;
    isPending: boolean;
    cis: Array<{ name: string; sys_id: string }>;
    onClose: () => void;
    onChange: (updatedItem: ScheduleTask) => void;
    onSave: (task: ScheduleTask) => void;
}

export const EditScheduleTaskModal: React.FC<EditScheduleTaskModalProps> = ({ open, editingItem, isLoadingCis, isPending, cis, onClose, onChange, onSave }) => {
    const towerOptions: SelectOption[] = useMemo(
        () => [
            { label: 'Windows', value: 'Windows' },
            { label: 'Linux', value: 'Linux' },
            { label: 'Network', value: 'Network' },
            { label: 'Database', value: 'Database' },
        ],
        [],
    );

    const reportTypeOptions: SelectOption[] = useMemo(
        () => [
            { label: 'Email', value: 'Email' },
            { label: 'Self download', value: 'Self download' },
        ],
        [],
    );

    const reportFormatOptions: SelectOption[] = useMemo(
        () => [
            { label: 'PDF', value: 'PDF' },
            { label: 'CSV', value: 'CSV' },
            { label: 'Excel', value: 'Excel' },
            { label: 'DOC', value: 'DOC' },
        ],
        [],
    );

    const statusOptions: SelectOption[] = useMemo(
        () => [
            { label: 'Scheduled', value: 'Scheduled' },
            { label: 'Awaiting', value: 'Awaiting' },
            { label: 'Completed', value: 'Completed' },
            { label: 'Failed', value: 'Failed' },
            { label: 'Triggered', value: 'Triggered' },
        ],
        [],
    );

    const ticketOptions: SelectOption[] = useMemo(
        () => [
            { label: 'Yes', value: 'true' },
            { label: 'No', value: 'false' },
        ],
        [],
    );

    const recurrenceOptions: SelectOption[] = useMemo(
        () => [
            { label: 'Daily', value: 'Daily' },
            { label: 'Weekly', value: 'Weekly' },
            { label: 'Monthly', value: 'Monthly' },
        ],
        [],
    );

    const mappedCiOptions = useMemo(() => {
        let list = cis || [];
        if (editingItem?.tower) {
            list = list.filter((ci) => ci.name.toLowerCase().includes(editingItem.tower.toLowerCase()));
        }
        return list.map((c) => ({ label: c.name, value: c.sys_id }));
    }, [cis, editingItem?.tower]);

    const handleTimeClick = (e: React.MouseEvent<HTMLInputElement>) => {
        try {
            e.currentTarget.showPicker();
        } catch {}
    };

    if (!editingItem) return null;

    return (
        <Modal open={open} size="xl" onClose={onClose} className="p-0">
            <Modal.Header className="px-5 py-4 bg-[#DEEEFF] border-b border-slate-200/60 flex items-center justify-between">
                <span className="font-extrabold text-[var(--brand-title-primary-color)] text-sm tracking-tight">Edit - {editingItem.taskName}</span>
            </Modal.Header>

            <Modal.Body className="px-6 pt-2 pb-6 space-y-4 max-h-[70dvh] overflow-y-auto mb-0">
                <div className="grid grid-cols-12 gap-4">
                    <div className="col-span-12">
                        <label className="text-[11px] font-bold text-slate uppercase tracking-wider block mb-1">Task Name</label>
                        <TextInput value={editingItem.taskName} onChange={(v) => onChange({ ...editingItem, taskName: v })} />
                    </div>

                    <div className="col-span-12">
                        <label className="text-[11px] font-bold text-slate uppercase tracking-wider block mb-1">Description</label>
                        <TextInput value={editingItem.description || ''} onChange={(v) => onChange({ ...editingItem, description: v })} />
                    </div>

                    <div className="col-span-6">
                        <label className="text-[11px] font-bold text-slate uppercase tracking-wider block mb-1">Tower</label>
                        <SelectInput value={editingItem.tower} options={towerOptions} onChange={(v) => onChange({ ...editingItem, tower: v as Tower, ciItems: [] })} />
                    </div>

                    <div className="col-span-6">
                        <label className="text-[11px] font-bold text-slate uppercase tracking-wider block mb-1">SOP Reference</label>
                        <TextInput value={editingItem.sop} onChange={(v) => onChange({ ...editingItem, sop: v })} />
                    </div>

                    <div className="col-span-6">
                        <label className="text-[11px] font-bold text-slate uppercase tracking-wider block mb-1">Report Type</label>
                        <SelectInput value={editingItem.reportType} options={reportTypeOptions} onChange={(v) => onChange({ ...editingItem, reportType: v })} />
                    </div>

                    <div className="col-span-6">
                        <label className="text-[11px] font-bold text-slate uppercase tracking-wider block mb-1">Report Format</label>
                        <SelectInput value={editingItem.reportFormat} options={reportFormatOptions} onChange={(v) => onChange({ ...editingItem, reportFormat: v })} />
                    </div>

                    <div className="col-span-6">
                        <label className="text-[11px] font-bold text-slate uppercase tracking-wider block mb-1">Status</label>
                        <SelectInput value={editingItem.status} options={statusOptions} onChange={(v) => onChange({ ...editingItem, status: v as TaskStatus })} />
                    </div>

                    <div className="col-span-6">
                        <label className="text-[11px] font-bold text-slate uppercase tracking-wider block mb-1">Ticket Required</label>
                        <SelectInput
                            value={editingItem.ticketRequired ? 'true' : 'false'}
                            options={ticketOptions}
                            onChange={(v) => onChange({ ...editingItem, ticketRequired: v === 'true' })}
                        />
                    </div>

                    <div className="col-span-12">
                        <label className="text-[11px] font-bold text-slate uppercase tracking-wider block mb-1">CI Items</label>
                        <MultiSelectInput
                            value={editingItem.ciItems || []}
                            options={mappedCiOptions}
                            isLoading={isLoadingCis}
                            onChange={(v) => onChange({ ...editingItem, ciItems: v })}
                        />
                    </div>

                    <div className="col-span-12 pt-2 border-t border-slate-100 mt-2">
                        <label className="text-xs font-black text-blue-950">Schedule Period Configuration</label>
                    </div>

                    <div className="col-span-6">
                        <label className="text-[11px] font-bold text-slate uppercase tracking-wider block mb-1">Start Date</label>
                        <DateInput
                            value={editingItem.schedulePeriod?.startdata || ''}
                            onChange={(v) =>
                                onChange({
                                    ...editingItem,
                                    schedulePeriod: { ...editingItem.schedulePeriod, startdata: v || '' },
                                })
                            }
                        />
                    </div>

                    <div className="col-span-6">
                        <label className="text-[11px] font-bold text-slate uppercase tracking-wider block mb-1">Start Time</label>
                        <input
                            type="time"
                            className="w-full bg-slate-50 border border-gray-300 rounded px-3 py-1 text-xs outline-none focus:border-blue-500 h-[26px] cursor-pointer"
                            value={editingItem.schedulePeriod?.starttime || ''}
                            onClick={handleTimeClick}
                            onChange={(e) =>
                                onChange({
                                    ...editingItem,
                                    schedulePeriod: { ...editingItem.schedulePeriod, starttime: e.target.value },
                                })
                            }
                        />
                    </div>

                    <div className="col-span-6">
                        <label className="text-[11px] font-bold text-slate uppercase tracking-wider block mb-1">End Date</label>
                        <DateInput
                            value={editingItem.schedulePeriod?.enddate || ''}
                            min={editingItem.schedulePeriod?.startdata || undefined}
                            onChange={(v) =>
                                onChange({
                                    ...editingItem,
                                    schedulePeriod: { ...editingItem.schedulePeriod, enddate: v || '' },
                                })
                            }
                        />
                    </div>

                    <div className="col-span-6">
                        <label className="text-[11px] font-bold text-slate uppercase tracking-wider block mb-1">Recurrence</label>
                        <SelectInput
                            value={editingItem.schedulePeriod?.weekly ? 'Weekly' : editingItem.schedulePeriod?.monthly ? 'Monthly' : 'Daily'}
                            options={recurrenceOptions}
                            onChange={(v) =>
                                onChange({
                                    ...editingItem,
                                    schedulePeriod: {
                                        ...editingItem.schedulePeriod,
                                        weekly: v === 'Weekly',
                                        monthly: v === 'Monthly',
                                    },
                                })
                            }
                        />
                    </div>
                </div>
            </Modal.Body>

            <Modal.Footer className="p-4 border-t border-slate-200 bg-slate-50 flex justify-end gap-2 rounded-b-lg">
                <button
                    type="button"
                    onClick={onClose}
                    className="bg-white border border-slate-200 text-slate-700 font-bold text-xs px-4 py-2.5 rounded-xl shadow-sm hover:bg-slate-50 active:scale-95 transition-all cursor-pointer"
                >
                    Discard
                </button>
                <button
                    type="button"
                    onClick={() => onSave(editingItem)}
                    disabled={isPending}
                    className="bg-[var(--brand-title-primary-color)] text-white font-bold text-xs px-5 py-2.5 rounded-xl shadow hover:bg-blue-900 active:scale-95 transition-all flex items-center justify-center min-w-[120px] cursor-pointer"
                >
                    {isPending ? <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> : 'Save Changes'}
                </button>
            </Modal.Footer>
        </Modal>
    );
};
