import type {EditorBtns} from '@/lib/constants';
import type React from 'react';

type Props = {};

const ContainerPlaceholder = (props: Props) => {
    const handleDragStart = (e: React.DragEvent, type: EditorBtns) => {
        if (type === null) return;
        e.dataTransfer.setData('componentType', type);
    };
    return (
        <div
            draggable
            onDragStart={(e) => handleDragStart(e, 'container')}
            className='cursor-move h-14 w-14 bg-muted/70 rounded-lg p-2 flex flex-row gap-[4px] transition duration-300 ease-in-out hover:brightness-150'>
            <div className='border-dashed border-[1px] h-full rounded-sm bg-muted border-muted-foreground/50 w-full hover:brightness-150' />
        </div>
    );
};

export default ContainerPlaceholder;
