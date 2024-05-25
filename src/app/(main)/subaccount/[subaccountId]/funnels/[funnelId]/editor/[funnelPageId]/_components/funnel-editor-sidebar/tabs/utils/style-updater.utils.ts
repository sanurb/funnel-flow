import type { EditorElement } from "@/providers/editor/editor-provider";

export type StyleUpdater = (
	styles: React.CSSProperties,
	value: string,
) => React.CSSProperties;

/**
 * Apply necessary styles to make text gradient effective.
 * - `background`: Sets the background to the gradient.
 * - `backgroundColor`: Ensures that the background color doesn't interfere with the gradient.
 * - `WebkitTextFillColor`: Makes the text transparent so the background gradient is visible.
 * - `WebkitBackgroundClip`: Clips the background to the text, ensuring the gradient only applies to the text.
 */
export const setGradientTextStyles = (bg: string) => ({
	background: `${bg} text`,
	backgroundColor: "transparent",
	WebkitTextFillColor: "transparent",
	WebkitBackgroundClip: "text",
});

/**
 * Remove styles related to text gradient.
 * - `WebkitBackgroundClip`: Unsets the background clip to text.
 * - `WebkitTextFillColor`: Restores the text fill color.
 * - `backgroundImage`: Ensures that no background image is set.
 */
export const unsetGradientTextStyles = () => ({
	WebkitBackgroundClip: "unset",
	WebkitTextFillColor: "unset",
	background: "unset",
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
					color: styles.color?.includes("gradient") ? "" : styles.color ?? "",
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
		...(isGradient ? setGradientTextStyles(value) : unsetGradientTextStyles()),
		...(isImage ? unsetGradientTextStyles() : {}),
	};
};

export const defaultUpdater: StyleUpdater = (styles) => ({
	...styles,
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
