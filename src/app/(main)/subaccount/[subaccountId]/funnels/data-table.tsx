'use client';
import CustomModal from '@/components/global/custom-modal';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow
} from '@/components/ui/table';
import {useModal} from '@/providers/modal-provider';
import {
    ColumnDef,
    flexRender,
    getCoreRowModel,
    getFilteredRowModel,
    useReactTable
} from '@tanstack/react-table';
import {Search} from 'lucide-react';
import React from 'react';

interface FunnelsDataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    filterValue: string;
    actionButtonText?: React.ReactNode;
    modalChildren?: React.ReactNode;
}

function useFilterColumn<TData, TValue>(table: any, filterValue: string) {
    const filter =
        (table.getColumn(filterValue)?.getFilterValue() as string) ?? '';
    const setFilter = (value: string) =>
        table.getColumn(filterValue)?.setFilterValue(value);
    return {filter, setFilter};
}

function ModalOpener({
    children,
    modalChildren
}: {
    children: React.ReactNode;
    modalChildren?: React.ReactNode;
}) {
    const {setOpen} = useModal();

    const openModal = () => {
        setOpen(
            <CustomModal
                title='Create A Funnel'
                subheading='Funnels are a like websites, but better! Try creating one!'>
                {modalChildren}
            </CustomModal>
        );
    };

    return (
        <Button className='flex gap-2' onClick={openModal}>
            {children}
        </Button>
    );
}

export default function FunnelsDataTable<TData, TValue>({
    columns,
    data,
    filterValue,
    modalChildren,
    actionButtonText
}: FunnelsDataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getFilteredRowModel: getFilteredRowModel()
    });

    const {filter, setFilter} = useFilterColumn<TData, TValue>(
        table,
        filterValue
    );

    return (
        <>
            <div className='flex items-center justify-between py-4 gap-2'>
                <div className='flex items-center gap-2'>
                    <Search />
                    <Input
                        placeholder='Search funnel name...'
                        value={filter}
                        onChange={(event) => setFilter(event.target.value)}
                        className='h-12'
                    />
                </div>
                {modalChildren && (
                    <ModalOpener modalChildren={modalChildren}>
                        {actionButtonText}
                    </ModalOpener>
                )}
            </div>
            <div className='border bg-background rounded-lg'>
                <Table>
                    <TableHeader>
                        {table.getHeaderGroups().map((headerGroup) => (
                            <TableRow key={headerGroup.id}>
                                {headerGroup.headers.map((header) => (
                                    <TableHead key={header.id}>
                                        {header.isPlaceholder
                                            ? null
                                            : flexRender(
                                                  header.column.columnDef
                                                      .header,
                                                  header.getContext()
                                              )}
                                    </TableHead>
                                ))}
                            </TableRow>
                        ))}
                    </TableHeader>
                    <TableBody>
                        {table.getRowModel().rows.length > 0 ? (
                            table.getRowModel().rows.map((row) => (
                                <TableRow
                                    key={row.id}
                                    data-state={
                                        row.getIsSelected()
                                            ? 'selected'
                                            : undefined
                                    }>
                                    {row.getVisibleCells().map((cell) => (
                                        <TableCell key={cell.id}>
                                            {flexRender(
                                                cell.column.columnDef.cell,
                                                cell.getContext()
                                            )}
                                        </TableCell>
                                    ))}
                                </TableRow>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell
                                    colSpan={columns.length}
                                    className='h-24 text-center'>
                                    No Results.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </>
    );
}
