"use client";
import { type EditorBtns, editorActionType } from "@/lib/constants";
import type { FunnelPage } from "@prisma/client";
import { type Dispatch, createContext, useContext, useReducer } from "react";
import type { EditorAction } from "./editor-actions";

export type ActionHandler = {
	[K in EditorAction["type"]]: (
		state: EditorState,
		action: Extract<EditorAction, { type: K }>,
	) => EditorState;
};

export type EditorStateHandler = (
	state: EditorState,
	action: EditorAction,
) => EditorState;

export type DeviceTypes = "Desktop" | "Mobile" | "Tablet";

export type EditorElement = {
	id: string;
	styles: React.CSSProperties;
	name: string;
	type: EditorBtns;
	content:
		| EditorElement[]
		| { href?: string; innerText?: string; src?: string; target?: string };
};

export type Editor = {
	liveMode: boolean;
	elements: EditorElement[];
	selectedElement: EditorElement;
	device: DeviceTypes;
	previewMode: boolean;
	funnelPageId: string;
	draggingComponent: EditorBtns | null;
	dropTargetId: string | null;
	dropPosition: "top" | "center" | "bottom" | null;
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
	draggingComponent: null,
	dropTargetId: null,
	dropPosition: null,
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

	function addElementRecursively(
		elements: EditorElement[],
		containerId: string,
		elementDetails: EditorElement,
	): EditorElement[] {
		let found = false;

		const updatedElements = elements.map((element) => {
			if (found) {
				return element;
			}
			if (element.id === containerId && Array.isArray(element.content)) {
				found = true;
				return {
					...element,
					content: [...element.content, elementDetails],
				};
			}
			if (element.content && Array.isArray(element.content)) {
				return {
					...element,
					content: addElementRecursively(
						element.content,
						containerId,
						elementDetails,
					),
				};
			}
			return element;
		});

		return updatedElements;
	}

	return addElementRecursively(
		editorArray,
		action.payload.containerId,
		action.payload.elementDetails,
	);
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
		}

		if (item.content && Array.isArray(item.content)) {
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
		}

		if (item.content && Array.isArray(item.content)) {
			item.content = deleteAnElement(item.content, action);
		}
		return true;
	});
};

const actionHandlers: ActionHandler = {
	[editorActionType.ADD_ELEMENT]: (state, action) => {
		const updatedEditorState = {
			...state.editor,
			elements: addAnElement(state.editor.elements, action),
		};
		const updatedHistory = [
			...state.history.history.slice(0, state.history.currentIndex + 1),
			{ ...updatedEditorState },
		];

		return {
			...state,
			editor: updatedEditorState,
			history: {
				...state.history,
				history: updatedHistory,
				currentIndex: updatedHistory.length - 1,
			},
		};
	},

	[editorActionType.UPDATE_ELEMENT]: (state, action) => {
		const updatedElements = updateAnElement(state.editor.elements, action);
		const UpdatedElementIsSelected =
			state.editor.selectedElement.id === action.payload.elementDetails.id;

		const updatedEditorState = {
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

		const updatedHistory = [
			...state.history.history.slice(0, state.history.currentIndex + 1),
			{ ...updatedEditorState },
		];

		return {
			...state,
			editor: updatedEditorState,
			history: {
				...state.history,
				history: updatedHistory,
				currentIndex: updatedHistory.length - 1,
			},
		};
	},

	[editorActionType.DELETE_ELEMENT]: (state, action) => {
		const updatedElements = deleteAnElement(state.editor.elements, action);
		const updatedEditorState = {
			...state.editor,
			elements: updatedElements,
		};
		const updatedHistory = [
			...state.history.history.slice(0, state.history.currentIndex + 1),
			{ ...updatedEditorState },
		];

		return {
			...state,
			editor: updatedEditorState,
			history: {
				...state.history,
				history: updatedHistory,
				currentIndex: updatedHistory.length - 1,
			},
		};
	},

	[editorActionType.CHANGE_CLICKED_ELEMENT]: (state, action) => {
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
	},

	[editorActionType.CHANGE_DEVICE]: (state, action) => {
		const changedDeviceState = {
			...state,
			editor: {
				...state.editor,
				device: action.payload.device,
			},
		};
		return changedDeviceState;
	},

	[editorActionType.TOGGLE_PREVIEW_MODE]: (state, _action) => {
		const toggleState = {
			...state,
			editor: {
				...state.editor,
				previewMode: !state.editor.previewMode,
			},
		};
		return toggleState;
	},

	[editorActionType.TOGGLE_LIVE_MODE]: (state, action) => {
		const toggleLiveMode = {
			...state,
			editor: {
				...state.editor,
				liveMode: action.payload
					? action.payload.value
					: !state.editor.liveMode,
			},
		};
		return toggleLiveMode;
	},

	[editorActionType.REDO]: (state, _action) => {
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
	},

	[editorActionType.UNDO]: (state, _action) => {
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
	},

	[editorActionType.LOAD_DATA]: (_state, action) => {
		return {
			...initialState,
			editor: {
				...initialState.editor,
				elements: action.payload.elements || initialEditorState.elements,
				liveMode: !!action.payload.withLive,
			},
		};
	},

	[editorActionType.SET_FUNNELPAGE_ID]: (state, action) => {
		const { funnelPageId } = action.payload;
		const updatedEditorState = {
			...state.editor,
			funnelPageId,
		};
		const updatedHistory = [
			...state.history.history.slice(0, state.history.currentIndex + 1),
			{ ...updatedEditorState },
		];

		return {
			...state,
			editor: updatedEditorState,
			history: {
				...state.history,
				history: updatedHistory,
				currentIndex: updatedHistory.length - 1,
			},
		};
	},

	[editorActionType.SET_DRAGGING_COMPONENT]: (state, action) => {
		return {
			...state,
			editor: {
				...state.editor,
				draggingComponent: action.payload.componentType,
			},
		};
	},

	[editorActionType.CLEAR_DRAGGING_COMPONENT]: (state) => {
		return {
			...state,
			editor: {
				...state.editor,
				draggingComponent: null,
			},
		};
	},

	[editorActionType.SET_DROP_TARGET]: (state, action) => {
		return {
			...state,
			editor: {
				...state.editor,
				dropTargetId: action.payload.dropTargetId,
				dropPosition: action.payload.dropPosition,
			},
		};
	},

	[editorActionType.CLEAR_DROP_TARGET]: (state) => {
		return {
			...state,
			editor: {
				...state.editor,
				dropTargetId: null,
				dropPosition: null,
			},
		};
	},
};

const editorReducer = (
	// biome-ignore lint/style/useDefaultParameterLast: <explanation>
	state: EditorState = initialState,
	action: EditorAction,
): EditorState => {
	const handleAction = actionHandlers[action.type];
	// biome-ignore lint/suspicious/noExplicitAny: <explanation>
	const actions: any = action;
	if (handleAction) {
		return handleAction(state, actions);
	}
	return state;
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
