import type { EditorBtns } from "@/lib/constants";
import { Youtube } from "lucide-react";
import type React from "react";

type Props = {};

const VideoPlaceholder = (props: Props) => {
	const handleDragStart = (e: React.DragEvent, type: EditorBtns) => {
		if (type === null) return;
		e.dataTransfer.setData("componentType", type);
	};
	return (
		<div
			draggable
			onDragStart={(e) => handleDragStart(e, "video")}
			className="cursor-move h-14 w-14 bg-muted rounded-lg flex items-center justify-center transition duration-300 ease-in-out hover:brightness-150"
		>
			<Youtube size={40} className="text-muted-foreground" />
		</div>
	);
};

export default VideoPlaceholder;
