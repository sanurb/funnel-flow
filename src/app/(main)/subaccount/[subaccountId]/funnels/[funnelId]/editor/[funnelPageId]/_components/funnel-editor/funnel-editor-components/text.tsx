"use client";
import { Badge } from "@/components/ui/badge";
import { editorActionType } from "@/lib/constants";
import {
	type EditorElement,
	useEditor,
} from "@/providers/editor/editor-provider";
import clsx from "clsx";
import { Trash } from "lucide-react";
import type React from "react";

type Props = {
	element: EditorElement;
};

const TextComponent = (props: Props) => {
	const { dispatch, state } = useEditor();

	const handleDeleteElement = () => {
		dispatch({
			type: editorActionType.DELETE_ELEMENT,
			payload: { elementDetails: props.element },
		});
	};
	const styles = props.element.styles;

	const handleOnClickBody = (e: React.MouseEvent) => {
		e.stopPropagation();
		dispatch({
			type: editorActionType.CHANGE_CLICKED_ELEMENT,
			payload: {
				elementDetails: props.element,
			},
		});
	};

	//WE ARE NOT ADDING DRAG DROP
	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<div
			style={styles}
			className={clsx(
				"p-[2px] w-full m-[5px] relative text-[16px] transition-all",
				{
					"!border-blue-500":
						state.editor.selectedElement.id === props.element.id,

					"!border-solid": state.editor.selectedElement.id === props.element.id,
					"border-dashed border-[1px] border-slate-300": !state.editor.liveMode,
				},
			)}
			onClick={handleOnClickBody}
		>
			{state.editor.selectedElement.id === props.element.id &&
				!state.editor.liveMode && (
					<Badge className="absolute -top-[23px] -left-[1px] rounded-none rounded-t-lg">
						{state.editor.selectedElement.name}
					</Badge>
				)}
			<span
				className="focus:outline-none"
				contentEditable={!state.editor.liveMode}
				suppressContentEditableWarning={true}
				onBlur={(e) => {
					const spanElement = e.target as HTMLSpanElement;
					dispatch({
						type: editorActionType.UPDATE_ELEMENT,
						payload: {
							elementDetails: {
								...props.element,
								content: {
									innerText: spanElement.innerText,
								},
							},
						},
					});
				}}
			>
				{!Array.isArray(props.element.content) &&
					props.element.content.innerText}
			</span>
			{state.editor.selectedElement.id === props.element.id &&
				!state.editor.liveMode && (
					<div className="absolute bg-primary px-2.5 py-1 text-xs font-bold -top-[25px] -right-[1px] rounded-none rounded-t-lg !text-white">
						<Trash
							className="cursor-pointer"
							size={16}
							onClick={handleDeleteElement}
						/>
					</div>
				)}
		</div>
	);
};

export default TextComponent;
