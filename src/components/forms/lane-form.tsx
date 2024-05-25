"use client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
} from "@/components/ui/form";
import type { Lane } from "@prisma/client";
import type React from "react";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import type { z } from "zod";
import { Input } from "../ui/input";

import {
	getPipelineDetails,
	saveActivityLogsNotification,
	upsertLane,
} from "@/lib/queries";
import { LaneFormSchema } from "@/lib/types";
import { useModal } from "@/providers/modal-provider";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import Loading from "../global/loading";
import { Button } from "../ui/button";
import { toast } from "../ui/use-toast";

interface CreateLaneFormProps {
	defaultData?: Lane;
	pipelineId: string;
}

const LaneForm: React.FC<CreateLaneFormProps> = ({
	defaultData,
	pipelineId,
}) => {
	const { setClose } = useModal();
	const router = useRouter();
	const form = useForm<z.infer<typeof LaneFormSchema>>({
		mode: "onChange",
		resolver: zodResolver(LaneFormSchema),
		defaultValues: {
			name: defaultData?.name || "",
		},
	});

	useEffect(() => {
		if (defaultData) {
			form.reset({
				name: defaultData.name || "",
			});
		}
	}, [defaultData]);

	const isLoading = form.formState.isLoading;

	const onSubmit = async (values: z.infer<typeof LaneFormSchema>) => {
		if (!pipelineId) return;
		try {
			const response = await upsertLane({
				...values,
				id: defaultData?.id,
				pipelineId: pipelineId,
				order: defaultData?.order,
			});

			const d = await getPipelineDetails(pipelineId);
			if (!d) return;

			await saveActivityLogsNotification({
				agencyId: undefined,
				description: `Updated a lane | ${response?.name}`,
				subaccountId: d.subAccountId,
			});

			toast({
				title: "Success",
				description: "Saved pipeline details",
			});

			router.refresh();
		} catch (error) {
			toast({
				variant: "destructive",
				title: "Oppse!",
				description: "Could not save pipeline details",
			});
		}
		setClose();
	};
	return (
		<Card className="w-full ">
			<CardHeader>
				<CardTitle>Lane Details</CardTitle>
			</CardHeader>
			<CardContent>
				<Form {...form}>
					<form
						onSubmit={form.handleSubmit(onSubmit)}
						className="flex flex-col gap-4"
					>
						<FormField
							disabled={isLoading}
							control={form.control}
							name="name"
							render={({ field }) => (
								<FormItem>
									<FormLabel>Lane Name</FormLabel>
									<FormControl>
										<Input placeholder="Lane Name" {...field} />
									</FormControl>
									<FormMessage />
								</FormItem>
							)}
						/>

						<Button className="w-20 mt-4" disabled={isLoading} type="submit">
							{form.formState.isSubmitting ? <Loading /> : "Save"}
						</Button>
					</form>
				</Form>
			</CardContent>
		</Card>
	);
};

export default LaneForm;
