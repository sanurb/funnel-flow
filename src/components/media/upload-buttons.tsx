"use client";
import { useModal } from "@/providers/modal-provider";
import UploadMediaForm from "../forms/upload-media";
import CustomModal from "../global/custom-modal";
import { Button } from "../ui/button";

type Props = {
	subaccountId: string;
};

const MediaUploadButton = ({ subaccountId }: Props) => {
	const { isOpen, setOpen, setClose } = useModal();

	return (
		<Button
			onClick={() => {
				setOpen(
					<CustomModal
						title="Upload Media"
						subheading="Upload a file to your media bucket"
					>
						<UploadMediaForm subaccountId={subaccountId}></UploadMediaForm>
					</CustomModal>,
				);
			}}
		>
			Upload
		</Button>
	);
};

export default MediaUploadButton;
