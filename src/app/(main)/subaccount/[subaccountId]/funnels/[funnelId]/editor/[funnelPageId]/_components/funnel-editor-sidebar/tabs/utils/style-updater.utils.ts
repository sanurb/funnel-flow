import type { EditorElement } from "@/providers/editor/editor-provider";

export type StyleUpdater = (
	styles: React.CSSProperties,
	value: string,
) => React.CSSProperties;

export const setGradientTextStyles = (bg: string) => ({
	background: `${bg} text`,
	backgroundColor: "transparent",
	WebkitTextFillColor: "transparent",
	WebkitBackgroundClip: "text",
});

export const unsetGradientTextStyles = () => ({
	WebkitBackgroundClip: "unset",
	WebkitTextFillColor: "unset",
	backgroundImage: "none",
});

export const updateColor: StyleUpdater = (styles, value) => {
	const isGradient = value.includes("gradient");
	return {
		...styles,
		color: value,
		...(isGradient ? setGradientTextStyles(value) : unsetGradientTextStyles()),
	};
};

export const updateBackgroundColor: StyleUpdater = (styles, value) => {
	const isGradient = value.includes("gradient");
	const isImage = value.startsWith("url");
	return {
		...styles,
		backgroundColor: value,
		...(isGradient || isImage
			? {
					background: value,
					color: styles.color?.includes("gradient")
						? undefined
						: styles.color ?? "",
				}
			: { background: "unset" }),
		...(isGradient ? {} : unsetGradientTextStyles()),
	};
};

export const updateBackground: StyleUpdater = (styles, value) => {
	const isGradient = value.includes("gradient");
	const isImage = value.startsWith("url");
	return {
		...styles,
		background: value,
		...(isGradient ? setGradientTextStyles(value) : unsetGradientTextStyles()),
		...(isImage ? unsetGradientTextStyles() : {}),
	};
};

export const defaultUpdater: StyleUpdater = (styles, value) => ({
	...styles,
	[property]: value,
});

export const styleUpdaters: Record<string, StyleUpdater> = {
	color: updateColor,
	backgroundColor: updateBackgroundColor,
	background: updateBackground,
};

export const updateElementStyles = (
	element: EditorElement,
	property: string,
	value: string,
): EditorElement => {
	const updater = styleUpdaters[property] || defaultUpdater;
	const styles = updater({ ...element.styles }, value);

	return {
		...element,
		styles,
	};
};
