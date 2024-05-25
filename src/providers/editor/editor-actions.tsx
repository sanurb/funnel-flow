import type { EditorBtns, editorActionType } from "@/lib/constants";
import type { DeviceTypes, EditorElement } from "./editor-provider";

type EmptyObject = {
	[K in never]: never;
};

export type EditorAction =
	| {
			type: typeof editorActionType.ADD_ELEMENT;
			payload: {
				containerId: string;
				elementDetails: EditorElement;
			};
	  }
	| {
			type: typeof editorActionType.UPDATE_ELEMENT;
			payload: {
				elementDetails: EditorElement;
			};
	  }
	| {
			type: typeof editorActionType.DELETE_ELEMENT;
			payload: {
				elementDetails: EditorElement;
			};
	  }
	| {
			type: typeof editorActionType.CHANGE_CLICKED_ELEMENT;
			payload: {
				elementDetails?:
					| EditorElement
					| {
							id: "";
							content: [];
							name: "";
							styles: EmptyObject;
							type: null;
					  };
			};
	  }
	| {
			type: typeof editorActionType.CHANGE_DEVICE;
			payload: {
				device: DeviceTypes;
			};
	  }
	| {
			type: typeof editorActionType.TOGGLE_PREVIEW_MODE;
	  }
	| {
			type: typeof editorActionType.TOGGLE_LIVE_MODE;
			payload?: {
				value: boolean;
			};
	  }
	| { type: typeof editorActionType.REDO }
	| { type: typeof editorActionType.UNDO }
	| {
			type: typeof editorActionType.LOAD_DATA;
			payload: {
				elements: EditorElement[];
				withLive: boolean;
			};
	  }
	| {
			type: typeof editorActionType.SET_FUNNELPAGE_ID;
			payload: {
				funnelPageId: string;
			};
	  }
	| {
			type: typeof editorActionType.SET_DRAGGING_COMPONENT;
			payload: {
				componentType: EditorBtns;
			};
	  }
	| {
			type: typeof editorActionType.CLEAR_DRAGGING_COMPONENT;
	  }
	| {
			type: typeof editorActionType.SET_DROP_TARGET;
			payload: {
				dropTargetId: string;
				dropPosition: "top" | "center" | "bottom";
			};
	  }
	| {
			type: typeof editorActionType.CLEAR_DROP_TARGET;
	  };
