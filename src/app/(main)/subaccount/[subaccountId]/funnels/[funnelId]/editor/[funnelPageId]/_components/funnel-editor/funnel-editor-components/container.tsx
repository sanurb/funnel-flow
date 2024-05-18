"use client";
import { Badge } from "@/components/ui/badge";
import {
	type EditorBtns,
	defaultStyles,
	editorActionType,
} from "@/lib/constants";
import {
	type EditorElement,
	useEditor,
} from "@/providers/editor/editor-provider";
import clsx from "clsx";
import { Trash } from "lucide-react";
import type React from "react";
import { v4 } from "uuid";
import Recursive from "./recursive";

type Props = { element: EditorElement };

const Container = ({ element }: Props) => {
	const { id, content, name, styles, type } = element;
	const { dispatch, state } = useEditor();

	const createBasicElementDetails = (
		id: string,
		name: string,
		type: EditorBtns,
		content: EditorElement["content"],
		additionalStyles: React.CSSProperties = {},
	): { containerId: string; elementDetails: EditorElement } => ({
		containerId: id,
		elementDetails: {
			id: v4(),
			name,
			styles: { ...defaultStyles, ...additionalStyles },
			type,
			content,
		},
	});

	const elementFactory: Record<
		string,
		(id: string) => { containerId: string; elementDetails: EditorElement }
	> = {
		text: (id: string) =>
			createBasicElementDetails(
				id,
				"Text",
				"text",
				{ innerText: "Text Element" },
				{ color: "black" },
			),
		link: (id: string) =>
			createBasicElementDetails(
				id,
				"Link",
				"link",
				{ innerText: "Link Element", href: "#" },
				{ color: "black" },
			),
		video: (id: string) =>
			createBasicElementDetails(id, "Video", "video", {
				src: "https://www.youtube.com/embed/TX9qSaGXFyg?si=fNsKJM7pkgWZamhU",
			}),
		container: (id: string) =>
			createBasicElementDetails(id, "Container", "container", []),
		contactForm: (id: string) =>
			createBasicElementDetails(id, "Contact Form", "contactForm", []),
		paymentForm: (id: string) =>
			createBasicElementDetails(id, "Contact Form", "paymentForm", []),
		"2Col": (id: string) => ({
			containerId: id,
			elementDetails: {
				id: v4(),
				name: "Two Columns",
				styles: { ...defaultStyles, display: "flex" },
				type: "2Col",
				content: [
					createBasicElementDetails(id, "Container", "container", [])
						.elementDetails,
					createBasicElementDetails(id, "Container", "container", [])
						.elementDetails,
				],
			},
		}),
	};

	const handleOnDrop = (e: React.DragEvent, id: string) => {
		e.stopPropagation();
		const componentType = e.dataTransfer.getData("componentType") as EditorBtns;

		if (!componentType) {
			return;
		}
		const action = elementFactory[componentType as keyof typeof elementFactory];
		if (action) {
			const payload = action(id);
			dispatch({
				type: editorActionType.ADD_ELEMENT,
				payload,
			});
		}
	};

	const handleDragOver = (e: React.DragEvent) => {
		e.preventDefault();
	};

	const handleDragStart = (e: React.DragEvent, type: string) => {
		if (type === "__body") return;
		e.dataTransfer.setData("componentType", type);
	};

	const handleOnClickBody = (e: React.MouseEvent) => {
		e.stopPropagation();
		dispatch({
			type: editorActionType.CHANGE_CLICKED_ELEMENT,
			payload: {
				elementDetails: element,
			},
		});
	};

	const handleDeleteElement = () => {
		dispatch({
			type: editorActionType.DELETE_ELEMENT,
			payload: {
				elementDetails: element,
			},
		});
	};

	return (
		<div
			style={styles}
			className={clsx("relative p-4 transition-all group", {
				"max-w-full w-full": type === "container" || type === "2Col",
				"h-fit": type === "container",
				"h-full": type === "__body",
				"overflow-scroll ": type === "__body",
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
			onDrop={(e) => handleOnDrop(e, id)}
			onDragOver={handleDragOver}
			draggable={type !== "__body"}
			onClick={handleOnClickBody}
			onDragStart={(e) => handleDragStart(e, "container")}
		>
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
					<div className="absolute bg-primary px-2.5 py-1 text-xs font-bold  -top-[25px] -right-[1px] rounded-none rounded-t-lg ">
						<Trash size={16} onClick={handleDeleteElement} />
					</div>
				)}
		</div>
	);
};

export default Container;
