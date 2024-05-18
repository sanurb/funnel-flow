"use client";
import { Button } from "@/components/ui/button";
import { editorActionType } from "@/lib/constants";
import { getFunnelPageDetails } from "@/lib/queries";
import { useEditor } from "@/providers/editor/editor-provider";
import clsx from "clsx";
import { EyeOff } from "lucide-react";
import type React from "react";
import { useCallback, useEffect, useMemo } from "react";
import Recursive from "./funnel-editor-components/recursive";

type Props = { funnelPageId: string; liveMode?: boolean };

const FunnelEditor = ({ funnelPageId, liveMode = false }: Props) => {
	const { dispatch, state } = useEditor();

	useEffect(() => {
		if (liveMode) {
			dispatch({
				type: editorActionType.TOGGLE_LIVE_MODE,
				payload: { value: true },
			});
		}

		const fetchData = async () => {
			const response = await getFunnelPageDetails(funnelPageId);
			if (response) {
				dispatch({
					type: editorActionType.LOAD_DATA,
					payload: {
						elements: response.content ? JSON.parse(response.content) : [],
						withLive: liveMode,
					},
				});
			}
		};

		fetchData();
	}, [dispatch, funnelPageId, liveMode]);

	const handleClick = useCallback(
		() =>
			dispatch({ type: editorActionType.CHANGE_CLICKED_ELEMENT, payload: {} }),
		[dispatch],
	);

	const handleKeyUp = useCallback(
		(event: React.KeyboardEvent) => {
			if (event.key === "Enter" || event.key === " ") {
				handleClick();
			}
		},
		[handleClick],
	);

	const handleUnpreview = useCallback(() => {
		dispatch({ type: editorActionType.TOGGLE_PREVIEW_MODE });
		dispatch({ type: editorActionType.TOGGLE_LIVE_MODE });
	}, [dispatch]);

	const dynamicClasses = useMemo(
		() =>
			clsx(
				"use-automation-zoom-in h-full overflow-scroll mr-[385px] bg-background transition-all rounded-md",
				{
					"!p-0 !mr-0": state.editor.previewMode || state.editor.liveMode,
					"!w-[850px]": state.editor.device === "Tablet",
					"!w-[420px]": state.editor.device === "Mobile",
					"w-full": state.editor.device === "Desktop",
				},
			),
		[state.editor],
	);

	return (
		<div className={dynamicClasses} onKeyUp={handleKeyUp} onClick={handleClick}>
			{state.editor.previewMode && state.editor.liveMode && (
				<Button
					variant="ghost"
					size="icon"
					className="w-6 h-6 bg-slate-600 p-[2px] fixed top-0 left-0 z-[100]"
					onClick={handleUnpreview}
				>
					<EyeOff />
				</Button>
			)}
			{Array.isArray(state.editor.elements) &&
				state.editor.elements.map((childElement) => (
					<Recursive key={childElement.id} element={childElement} />
				))}
		</div>
	);
};

export default FunnelEditor;
