"use client";
import { Badge } from "@/components/ui/badge";
import { useDebouncedObservable } from "@/hooks/useDebouncedObservable";
import { type EditorBtns, editorActionType } from "@/lib/constants";
import {
	type Editor,
	type EditorElement,
	useEditor,
} from "@/providers/editor/editor-provider";
import clsx from "clsx";
import { Trash } from "lucide-react";
import type React from "react";
import { memo, useCallback, useMemo } from "react";
import { elementFactory } from "../../../utils/elementFactory";
import Recursive from "./recursive";

type Props = { element: EditorElement };

const Container = ({ element }: Props) => {
	const { id, content, styles, type } = element;
	const { dispatch, state } = useEditor();
	const isContainerEmpty =
		!Array.isArray(element.content) || element.content.length === 0;

	const handleDrop = useCallback(
		(e: React.DragEvent, id: string) => {
			e.stopPropagation();
			const componentType = e.dataTransfer.getData(
				"componentType",
			) as EditorBtns;

			if (!componentType) {
				return;
			}
			const action = elementFactory[componentType];
			if (action) {
				const payload = action(id);
				dispatch({
					type: editorActionType.ADD_ELEMENT,
					payload,
				});
			}
			dispatch({
				type: editorActionType.CLEAR_DROP_TARGET,
			});
		},
		[dispatch],
	);

	/**
	 * Determines the drop position within a container based on the Y offset.
	 * This function only handles 'center' and 'bottom' positions.
	 * The 'top' position is not handled as new components are always added below existing ones.
	 *
	 * @param offsetY - The Y offset within the container.
	 * @param height - The height of the container.
	 * @param isContainerEmpty - Flag indicating if the container is empty.
	 * @returns The drop position as 'center' or 'bottom'.
	 */
	const getDropPosition = useCallback(
		(
			offsetY: number,
			height: number,
			isContainerEmpty: boolean,
		): "center" | "bottom" => {
			// Define a margin to reduce sensitivity to small changes in the cursor position
			const MARGIN = height * 0.1;
			const CENTER_THRESHOLD_START = height / 3;
			const CENTER_THRESHOLD_END = (height / 3) * 2;

			const isCenter =
				isContainerEmpty ||
				(offsetY >= CENTER_THRESHOLD_START - MARGIN &&
					offsetY <= CENTER_THRESHOLD_END + MARGIN);
			const isBottom =
				!isContainerEmpty && offsetY > CENTER_THRESHOLD_END + MARGIN;

			// Mapping positions to boolean checks with adjusted margins
			const positions: { [key: string]: boolean } = {
				center: isCenter,
				bottom: isBottom,
			};

			// Find and return the position key that is true
			return Object.keys(positions).find((key) => positions[key]) as
				| "center"
				| "bottom";
		},
		[],
	);

	const handleDragOver = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();

			const container = e.currentTarget as HTMLElement;
			if (!container) return;

			const boundingRect = container.getBoundingClientRect();

			const offsetY = e.clientY - boundingRect.top;
			const dropPosition =
				getDropPosition(offsetY, boundingRect.height, isContainerEmpty) ??
				"bottom";

			dispatch({
				type: editorActionType.SET_DROP_TARGET,
				payload: { dropTargetId: id, dropPosition },
			});
		},
		[dispatch, getDropPosition, id, isContainerEmpty],
	);

	const handleDragEnter = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			dispatch({
				type: editorActionType.SET_DROP_TARGET,
				payload: { dropTargetId: id, dropPosition: "center" },
			});
		},
		[dispatch, id],
	);

	const handleDragLeave = useCallback(
		(e: React.DragEvent) => {
			e.preventDefault();
			e.stopPropagation();
			dispatch({
				type: editorActionType.CLEAR_DROP_TARGET,
			});
			console.log(`drag leave ${id} on date ${new Date()}`);
		},
		[dispatch, id],
	);

	const handleDragStart = useCallback((e: React.DragEvent, type: string) => {
		if (type === "__body") return;
		e.dataTransfer.setData("componentType", type);
	}, []);

	const handleOnClickBody = useCallback(
		(e: React.MouseEvent) => {
			e.stopPropagation();
			dispatch({
				type: editorActionType.CHANGE_CLICKED_ELEMENT,
				payload: {
					elementDetails: element,
				},
			});
		},
		[dispatch, element],
	);

	const handleDeleteElement = useCallback(() => {
		dispatch({
			type: editorActionType.DELETE_ELEMENT,
			payload: {
				elementDetails: element,
			},
		});
	}, [dispatch, element]);

	const dropRef = useDebouncedObservable<React.DragEvent>(
		"dragover",
		handleDragOver,
		200,
	);

	const dropIndicator = useMemo(() => {
		const renderDropIndicator = (
			dropPosition: Pick<Editor, "dropPosition">["dropPosition"],
			isContainerEmpty: boolean,
		) => {
			if (dropPosition === "center" && isContainerEmpty) {
				return (
					<div
						className="absolute w-full border-t-4 border-blue-400 transition-opacity duration-200 ease-in-out"
						style={{
							left: 0,
							right: 0,
						}}
					/>
				);
			}
			if (dropPosition === "bottom" && !isContainerEmpty) {
				return (
					<div
						className="absolute w-full border-b-4 border-blue-400 transition-opacity duration-200 ease-in-out"
						style={{
							bottom: 0,
							left: 0,
							right: 0,
						}}
					/>
				);
			}
			return null;
		};

		return state.editor.dropTargetId === id
			? renderDropIndicator(state.editor.dropPosition, isContainerEmpty)
			: null;
	}, [
		state.editor.dropTargetId,
		state.editor.dropPosition,
		id,
		isContainerEmpty,
	]);

	return (
		// biome-ignore lint/a11y/useKeyWithClickEvents: <explanation>
		<div
			ref={dropRef}
			style={styles}
			className={clsx("relative p-4 transition-all group", {
				"max-w-full w-full": type === "container" || type === "2Col",
				"h-fit": type === "container",
				"h-full": type === "__body",
				"overflow-scroll": type === "__body",
				"flex flex-col md:!flex-row": type === "2Col",
				"!border-blue-500":
					state.editor.selectedElement.id === id &&
					!state.editor.liveMode &&
					state.editor.selectedElement.type !== "__body",
				"!border-yellow-400 !border-4":
					state.editor.selectedElement.id === id &&
					!state.editor.liveMode &&
					state.editor.selectedElement.type === "__body",
				"!border-solid":
					state.editor.selectedElement.id === id && !state.editor.liveMode,
				"border-dashed border-[1px] border-slate-300": !state.editor.liveMode,
			})}
			onDrop={(e) => handleDrop(e, id)}
			onDragOver={handleDragOver}
			onDragEnter={handleDragEnter}
			onDragLeave={handleDragLeave}
			draggable={type !== "__body"}
			onClick={handleOnClickBody}
			onDragStart={(e) => handleDragStart(e, "container")}
		>
			{dropIndicator}
			<Badge
				className={clsx(
					"absolute -top-[23px] -left-[1px] rounded-none rounded-t-lg hidden",
					{
						block:
							state.editor.selectedElement.id === element.id &&
							!state.editor.liveMode,
					},
				)}
			>
				{element.name}
			</Badge>

			{Array.isArray(content) &&
				content.map((childElement) => (
					<Recursive key={childElement.id} element={childElement} />
				))}

			{state.editor.selectedElement.id === element.id &&
				!state.editor.liveMode &&
				state.editor.selectedElement.type !== "__body" && (
					<div className="absolute bg-primary px-2.5 py-1 text-xs font-bold -top-[25px] -right-[1px] rounded-none rounded-t-lg ">
						<Trash size={16} onClick={handleDeleteElement} />
					</div>
				)}
		</div>
	);
};

export default memo(Container);
