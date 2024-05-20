import { type EditorBtns, defaultStyles } from "@/lib/constants";
import type { EditorElement } from "@/providers/editor/editor-provider";
import type React from "react";
import { v4 } from "uuid";

export const createBasicElementDetails = (
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

export const elementFactory: Record<
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
