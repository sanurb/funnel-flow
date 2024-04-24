import BlurPage from "@/components/global/blur-page";
import type React from "react";

const PipelinesLayout = ({ children }: { children: React.ReactNode }) => {
	return <BlurPage>{children}</BlurPage>;
};

export default PipelinesLayout;
