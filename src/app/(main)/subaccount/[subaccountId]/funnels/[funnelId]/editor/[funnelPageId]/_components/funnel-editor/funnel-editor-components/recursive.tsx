import type { EditorElement } from "@/providers/editor/editor-provider";
import type React from "react";
import Checkout from "./checkout";
import ContactFormComponent from "./contact-form-component";
import Container from "./container";
import LinkComponent from "./link-component";
import TextComponent from "./text";
import VideoComponent from "./video";

type Props = {
	element: EditorElement;
};

const componentMap: Record<string, React.ComponentType<Props>> = {
	text: TextComponent,
	container: Container,
	video: VideoComponent,
	link: LinkComponent,
	contactForm: ContactFormComponent,
	paymentForm: Checkout,
	"2Col": Container,
	__body: Container,
};

const Recursive = ({ element }: Props) => {
	if (!element?.type) return null;
	const Component = componentMap[element.type];
	return Component ? <Component element={element} /> : null;
};

export default Recursive;
