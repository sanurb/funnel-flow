'use client';
import {
    type EditorElement,
    useEditor
} from '@/providers/editor/editor-provider';
import type React from 'react';
import RecursiveElement from './recursive';

import {Badge} from '@/components/ui/badge';
import {
    type EditorBtns,
    defaultStyles,
    editorActionType
} from '@/lib/constants';
import clsx from 'clsx';
import {useMemo} from 'react';
import {v4} from 'uuid';

const TYPE_BODY = '__body';
const TYPE_CONTAINER = 'container';
const TYPE_TEXT = 'text';
const TYPE_2COL = '2Col';

const elementConfig = {
    [TYPE_TEXT]: {
        getContent: () => ({innerText: 'Text Component'}),
        name: TYPE_TEXT,
        type: TYPE_TEXT
    },
    [TYPE_CONTAINER]: {
        getContent: () => [],
        name: TYPE_CONTAINER,
        type: TYPE_CONTAINER
    },
    [TYPE_2COL]: {
        getContent: () => [],
        name: TYPE_2COL,
        type: TYPE_2COL
    }
};

type Props = {
    element: EditorElement;
};

const TwoColumns = ({element}: Props) => {
    const {id, content, type, styles} = element;
    const {dispatch, state} = useEditor();

    const handleOnDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.stopPropagation();
        const componentType = e.dataTransfer.getData(
            'componentType'
        ) as EditorBtns;

        if (!componentType) return;

        const config =
            elementConfig[componentType as keyof typeof elementConfig];
        if (!config) return;

        const elementDetails: EditorElement = {
            id: v4(),
            content: config.getContent(),
            name: config.name,
            type: config.type as EditorBtns,
            styles: {...defaultStyles}
        };

        dispatch({
            type: editorActionType.ADD_ELEMENT,
            payload: {
                containerId: id,
                elementDetails: elementDetails
            }
        });
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleOnClickBody = (e: React.MouseEvent<HTMLDivElement>) => {
        e.stopPropagation();
        dispatch({
            type: editorActionType.CHANGE_CLICKED_ELEMENT,
            payload: {elementDetails: element}
        });
    };

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        if (!type) return;
        if (type === TYPE_BODY) return;
        e.dataTransfer.setData('componentType', type);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
        if (e.key === 'Enter' || e.key === ' ') {
            handleOnClickBody(e as unknown as React.MouseEvent<HTMLDivElement>);
        }
    };

    const className = useMemo(
        () =>
            clsx('relative p-4 transition-all', {
                'h-fit': type === TYPE_CONTAINER,
                'h-full': type === TYPE_BODY,
                'm-4': type === TYPE_CONTAINER,
                '!border-blue-500':
                    state.editor.selectedElement.id === id &&
                    !state.editor.liveMode,
                '!border-solid':
                    state.editor.selectedElement.id === id &&
                    !state.editor.liveMode,
                'border-dashed border-[1px] border-slate-300':
                    !state.editor.liveMode
            }),
        [type, id, state.editor.selectedElement.id, state.editor.liveMode]
    );

    return (
        <div
            style={styles}
            className={className}
            id='innerContainer'
            onDrop={handleOnDrop}
            onDragOver={handleDragOver}
            onClick={handleOnClickBody}
            onDragStart={handleDragStart}
            onKeyDown={handleKeyDown}
            draggable={type !== TYPE_BODY}>
            {state.editor.selectedElement.id === id &&
                !state.editor.liveMode && (
                    <Badge className='absolute -top-[23px] -left-[1px] rounded-none rounded-t-lg '>
                        {state.editor.selectedElement.name}
                    </Badge>
                )}
            {Array.isArray(content) &&
                content.map((childElement) => (
                    <RecursiveElement
                        key={childElement.id}
                        element={childElement}
                    />
                ))}
        </div>
    );
};

export default TwoColumns;
