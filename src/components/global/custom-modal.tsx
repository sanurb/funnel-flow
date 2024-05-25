"use client";
import { useModal } from "@/providers/modal-provider";
import { DialogTitle } from "@radix-ui/react-dialog";
import type React from "react";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
} from "../ui/dialog";

type Props = {
	title: string;
	subheading: string;
	children: React.ReactNode;
	defaultOpen?: boolean;
};

const CustomModal = ({ children, defaultOpen, subheading, title }: Props) => {
	const { isOpen, setClose } = useModal();
	return (
		<Dialog open={isOpen || defaultOpen} onOpenChange={setClose}>
			<DialogContent className="overflow-scroll md:max-h-[700px] md:h-fit h-screen bg-card">
				<DialogHeader className="pt-8 text-left min-w-0">
					<DialogTitle className="text-2xl font-bold">{title}</DialogTitle>
					<DialogDescription>{subheading}</DialogDescription>
					{children}
				</DialogHeader>
			</DialogContent>
		</Dialog>
	);
};

export default CustomModal;
