import { Badge } from "@/components/ui/badge";
import { type EditorBtns, editorActionType } from "@/lib/constants";
import {
	type EditorElement,
	useEditor,
} from "@/providers/editor/editor-provider";
import clsx from "clsx";
import { Trash } from "lucide-react";
import Link from "next/link";
import type React from "react";
import { useCallback } from "react";

type Props = {
	element: EditorElement;
};

const LinkComponent = ({ element }: Props) => {
	const { dispatch, state } = useEditor();

	const handleDragStart = useCallback(
		(e: React.DragEvent, type: EditorBtns) => {
			if (!type) return;
			e.dataTransfer.setData("componentType", type);
		},
		[],
	);

	const handleOnClickBody = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			dispatch({
				type: editorActionType.CHANGE_CLICKED_ELEMENT,
				payload: { elementDetails: element },
			});
		},
		[dispatch, element],
	);

	const handleDeleteElement = useCallback(() => {
		dispatch({
			type: editorActionType.DELETE_ELEMENT,
			payload: { elementDetails: element },
		});
	}, [dispatch, element]);

	const renderBadge = () => {
		if (
			state.editor.selectedElement.id === element.id &&
			!state.editor.liveMode
		) {
			return (
				<Badge className="absolute -top-[23px] -left-[1px] rounded-none rounded-t-lg">
					{state.editor.selectedElement.name}
				</Badge>
			);
		}
		return null;
	};

	const renderContent = () => {
		const { content } = element;
		if (!Array.isArray(content)) {
			if (state.editor?.previewMode || state.editor?.liveMode) {
				return (
					<Link href={content.href || "#"} target={content.target}>
						{content.innerText}
					</Link>
				);
			}

			return (
				<span
					className="focus:outline-none"
					contentEditable={!state.editor.liveMode}
					onBlur={(e) => {
						const spanElement = e.target as HTMLSpanElement;
						dispatch({
							type: editorActionType.UPDATE_ELEMENT,
							payload: {
								elementDetails: {
									...element,
									content: {
										...content,
										innerText: spanElement.innerText,
									},
								},
							},
						});
					}}
				>
					{content.innerText}
				</span>
			);
		}
		return null;
	};

	const renderDeleteIcon = () => {
		if (
			state.editor.selectedElement.id === element.id &&
			!state.editor.liveMode
		) {
			return (
				<div className="absolute bg-primary px-2.5 py-1 text-xs font-bold -top-[25px] -right-[1px] rounded-none rounded-t-lg !text-white">
					<Trash
						className="cursor-pointer"
						size={16}
						onClick={handleDeleteElement}
					/>
				</div>
			);
		}
		return null;
	};

	const elementClasses = clsx(
		"p-[2px] w-full m-[5px] relative text-[16px] transition-all",
		{
			"!border-blue-500": state.editor.selectedElement.id === element.id,
			"!border-solid": state.editor.selectedElement.id === element.id,
			"border-dashed border-[1px] border-slate-300": !state.editor.liveMode,
		},
	);

	return (
		<div
			style={element.styles}
			draggable
			onDragStart={(e) => handleDragStart(e, "text")}
			onClick={handleOnClickBody}
			className={elementClasses}
		>
			{renderBadge()}
			{renderContent()}
			{renderDeleteIcon()}
		</div>
	);
};

export default LinkComponent;
