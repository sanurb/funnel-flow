"use client";
import { type EditorBtns, editorActionType } from "@/lib/constants";
import type { FunnelPage } from "@prisma/client";
import { type Dispatch, createContext, useContext, useReducer } from "react";
import type { EditorAction } from "./editor-actions";

export type DeviceTypes = "Desktop" | "Mobile" | "Tablet";

export type EditorElement = {
	id: string;
	styles: React.CSSProperties;
	name: string;
	type: EditorBtns;
	content:
		| EditorElement[]
		| { href?: string; innerText?: string; src?: string };
};

export type Editor = {
	liveMode: boolean;
	elements: EditorElement[];
	selectedElement: EditorElement;
	device: DeviceTypes;
	previewMode: boolean;
	funnelPageId: string;
};

export type HistoryState = {
	history: Editor[];
	currentIndex: number;
};

export type EditorState = {
	editor: Editor;
	history: HistoryState;
};

const initialEditorState: EditorState["editor"] = {
	elements: [
		{
			content: [],
			id: "__body",
			name: "Body",
			styles: {},
			type: "__body",
		},
	],
	selectedElement: {
		id: "",
		content: [],
		name: "",
		styles: {},
		type: null,
	},
	device: "Desktop",
	previewMode: false,
	liveMode: false,
	funnelPageId: "",
};

const initialHistoryState: HistoryState = {
	history: [initialEditorState],
	currentIndex: 0,
};

const initialState: EditorState = {
	editor: initialEditorState,
	history: initialHistoryState,
};

const addAnElement = (
	editorArray: EditorElement[],
	action: EditorAction,
): EditorElement[] => {
	if (action.type !== editorActionType.ADD_ELEMENT) {
		throw new Error(
			"You sent the wrong action type to the Add Element editor State",
		);
	}

	const elements = [...editorArray];
	const queue = [...elements];

	while (queue.length > 0) {
		const current = queue.shift();
		if (
			current?.id === action.payload.containerId &&
			Array.isArray(current.content)
		) {
			current.content = [...current.content, action.payload.elementDetails];
			return elements;
		}
		if (Array.isArray(current?.content)) {
			queue.push(...current.content);
		}
	}
	throw new Error("Container not found");
};

const updateAnElement = (
	editorArray: EditorElement[],
	action: EditorAction,
): EditorElement[] => {
	if (action.type !== editorActionType.UPDATE_ELEMENT) {
		throw Error("You sent the wrong action type to the update Element State");
	}
	return editorArray.map((item) => {
		if (item.id === action.payload.elementDetails.id) {
			return { ...item, ...action.payload.elementDetails };
		} else if (item.content && Array.isArray(item.content)) {
			return {
				...item,
				content: updateAnElement(item.content, action),
			};
		}
		return item;
	});
};

const deleteAnElement = (
	editorArray: EditorElement[],
	action: EditorAction,
): EditorElement[] => {
	if (action.type !== editorActionType.DELETE_ELEMENT)
		throw Error(
			"You sent the wrong action type to the Delete Element editor State",
		);
	return editorArray.filter((item) => {
		if (item.id === action.payload.elementDetails.id) {
			return false;
		} else if (item.content && Array.isArray(item.content)) {
			item.content = deleteAnElement(item.content, action);
		}
		return true;
	});
};

const editorReducer = (
	state: EditorState = initialState,
	action: EditorAction,
): EditorState => {
	switch (action.type) {
		case editorActionType.ADD_ELEMENT: {
			const updatedEditorState = {
				...state.editor,
				elements: addAnElement(state.editor.elements, action),
			};
			const updatedHistory = [
				...state.history.history.slice(0, state.history.currentIndex + 1),
				{ ...updatedEditorState },
			];

			const newEditorState = {
				...state,
				editor: updatedEditorState,
				history: {
					...state.history,
					history: updatedHistory,
					currentIndex: updatedHistory.length - 1,
				},
			};

			return newEditorState;
		}

		case editorActionType.UPDATE_ELEMENT: {
			const updatedElements = updateAnElement(state.editor.elements, action);

			const UpdatedElementIsSelected =
				state.editor.selectedElement.id === action.payload.elementDetails.id;

			const updatedEditorStateWithUpdate = {
				...state.editor,
				elements: updatedElements,
				selectedElement: UpdatedElementIsSelected
					? action.payload.elementDetails
					: {
							id: "",
							content: [],
							name: "",
							styles: {},
							type: null,
						},
			};

			const updatedHistoryWithUpdate = [
				...state.history.history.slice(0, state.history.currentIndex + 1),
				{ ...updatedEditorStateWithUpdate }, // Save a copy of the updated state
			];
			const updatedEditor = {
				...state,
				editor: updatedEditorStateWithUpdate,
				history: {
					...state.history,
					history: updatedHistoryWithUpdate,
					currentIndex: updatedHistoryWithUpdate.length - 1,
				},
			};
			return updatedEditor;
		}

		case editorActionType.DELETE_ELEMENT: {
			// Perform your logic to delete the element from the state
			const updatedElementsAfterDelete = deleteAnElement(
				state.editor.elements,
				action,
			);
			const updatedEditorStateAfterDelete = {
				...state.editor,
				elements: updatedElementsAfterDelete,
			};
			const updatedHistoryAfterDelete = [
				...state.history.history.slice(0, state.history.currentIndex + 1),
				{ ...updatedEditorStateAfterDelete }, // Save a copy of the updated state
			];

			const deletedState = {
				...state,
				editor: updatedEditorStateAfterDelete,
				history: {
					...state.history,
					history: updatedHistoryAfterDelete,
					currentIndex: updatedHistoryAfterDelete.length - 1,
				},
			};
			return deletedState;
		}

		case editorActionType.CHANGE_CLICKED_ELEMENT: {
			const clickedState = {
				...state,
				editor: {
					...state.editor,
					selectedElement: action.payload.elementDetails || {
						id: "",
						content: [],
						name: "",
						styles: {},
						type: null,
					},
				},
				history: {
					...state.history,
					history: [
						...state.history.history.slice(0, state.history.currentIndex + 1),
						{ ...state.editor }, // Save a copy of the current editor state
					],
					currentIndex: state.history.currentIndex + 1,
				},
			};
			return clickedState;
		}
		case editorActionType.CHANGE_DEVICE: {
			const changedDeviceState = {
				...state,
				editor: {
					...state.editor,
					device: action.payload.device,
				},
			};
			return changedDeviceState;
		}

		case editorActionType.TOGGLE_PREVIEW_MODE: {
			const toggleState = {
				...state,
				editor: {
					...state.editor,
					previewMode: !state.editor.previewMode,
				},
			};
			return toggleState;
		}

		case editorActionType.TOGGLE_LIVE_MODE: {
			const toggleLiveMode: EditorState = {
				...state,
				editor: {
					...state.editor,
					liveMode: action.payload
						? action.payload.value
						: !state.editor.liveMode,
				},
			};
			return toggleLiveMode;
		}

		case editorActionType.REDO:
			if (state.history.currentIndex < state.history.history.length - 1) {
				const nextIndex = state.history.currentIndex + 1;
				const nextEditorState = { ...state.history.history[nextIndex] };
				const redoState = {
					...state,
					editor: nextEditorState,
					history: {
						...state.history,
						currentIndex: nextIndex,
					},
				};
				return redoState;
			}
			return state;

		case editorActionType.UNDO:
			if (state.history.currentIndex > 0) {
				const prevIndex = state.history.currentIndex - 1;
				const prevEditorState = { ...state.history.history[prevIndex] };
				const undoState = {
					...state,
					editor: prevEditorState,
					history: {
						...state.history,
						currentIndex: prevIndex,
					},
				};
				return undoState;
			}
			return state;

		case editorActionType.LOAD_DATA:
			return {
				...initialState,
				editor: {
					...initialState.editor,
					elements: action.payload.elements || initialEditorState.elements,
					liveMode: !!action.payload.withLive,
				},
			};

		case editorActionType.SET_FUNNELPAGE_ID: {
			const { funnelPageId } = action.payload;
			const updatedEditorStateWithFunnelPageId = {
				...state.editor,
				funnelPageId,
			};

			const updatedHistoryWithFunnelPageId = [
				...state.history.history.slice(0, state.history.currentIndex + 1),
				{ ...updatedEditorStateWithFunnelPageId }, // Save a copy of the updated state
			];

			const funnelPageIdState = {
				...state,
				editor: updatedEditorStateWithFunnelPageId,
				history: {
					...state.history,
					history: updatedHistoryWithFunnelPageId,
					currentIndex: updatedHistoryWithFunnelPageId.length - 1,
				},
			};
			return funnelPageIdState;
		}

		default:
			return state;
	}
};

export type EditorContextData = {
	device: DeviceTypes;
	previewMode: boolean;
	setPreviewMode: (previewMode: boolean) => void;
	setDevice: (device: DeviceTypes) => void;
};

export const EditorContext = createContext<{
	state: EditorState;
	dispatch: Dispatch<EditorAction>;
	subaccountId: string;
	funnelId: string;
	pageDetails: FunnelPage | null;
}>({
	state: initialState,
	dispatch: () => undefined,
	subaccountId: "",
	funnelId: "",
	pageDetails: null,
});

type EditorProps = {
	children: React.ReactNode;
	subaccountId: string;
	funnelId: string;
	pageDetails: FunnelPage;
};

const EditorProvider = (props: EditorProps) => {
	const [state, dispatch] = useReducer(editorReducer, initialState);

	return (
		<EditorContext.Provider
			value={{
				state,
				dispatch,
				subaccountId: props.subaccountId,
				funnelId: props.funnelId,
				pageDetails: props.pageDetails,
			}}
		>
			{props.children}
		</EditorContext.Provider>
	);
};

export const useEditor = () => {
	const context = useContext(EditorContext);
	if (!context) {
		throw new Error("useEditor Hook must be used within the editor Provider");
	}
	return context;
};

export default EditorProvider;
