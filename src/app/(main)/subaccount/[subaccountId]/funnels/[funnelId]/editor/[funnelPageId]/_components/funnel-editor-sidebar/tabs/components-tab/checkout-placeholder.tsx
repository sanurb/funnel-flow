import type {EditorBtns} from '@/lib/constants';
import {Youtube} from 'lucide-react';
import Image from 'next/image';
import type React from 'react';

type Props = {};

const CheckoutPlaceholder = (props: Props) => {
    const handleDragStart = (e: React.DragEvent, type: EditorBtns) => {
        if (type === null) return;
        e.dataTransfer.setData('componentType', type);
    };
    return (
        <div
            draggable
            onDragStart={(e) => handleDragStart(e, 'paymentForm')}
            className='cursor-move h-14 w-14 bg-muted rounded-lg flex items-center justify-center transition duration-300 ease-in-out hover:brightness-150'>
            <Image
                src='/stripelogo.png'
                height={40}
                width={40}
                alt='stripe logo'
                className='object-cover'
            />
        </div>
    );
};

export default CheckoutPlaceholder;
