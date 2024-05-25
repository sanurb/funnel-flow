"use client";
import {
	deleteAgency,
	initUser,
	saveActivityLogsNotification,
	updateAgencyDetails,
	upsertAgency,
} from "@/lib/queries";
import { zodResolver } from "@hookform/resolvers/zod";
import type { Agency } from "@prisma/client";
import { NumberInput } from "@tremor/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { v4 } from "uuid";
import * as z from "zod";
import FileUpload from "../global/file-upload";
import Loading from "../global/loading";
import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
	AlertDialogTrigger,
	Button,
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
	Form,
	FormControl,
	FormDescription,
	FormField,
	FormItem,
	FormLabel,
	FormMessage,
	Input,
	Switch,
	useToast,
} from "../ui";

type Props = {
	data?: Partial<Agency>;
};

const FormSchema = z.object({
	name: z.string().min(2, { message: "Agency name must be atleast 2 chars." }),
	companyEmail: z.string().min(1),
	companyPhone: z.string().min(1),
	whiteLabel: z.boolean(),
	address: z.string().min(1),
	city: z.string().min(1),
	zipCode: z.string().min(1),
	state: z.string().min(1),
	country: z.string().min(1),
	agencyLogo: z.string().min(1, { message: "Please upload the agency logo." }),
});

const AgencyDetails = ({ data }: Props) => {
	const { toast } = useToast();
	const router = useRouter();
	const [deletingAgency, setDeletingAgency] = useState(false);
	const form = useForm<z.infer<typeof FormSchema>>({
		mode: "onChange",
		resolver: zodResolver(FormSchema),
		defaultValues: {
			name: data?.name,
			companyEmail: data?.companyEmail,
			companyPhone: data?.companyPhone,
			whiteLabel: data?.whiteLabel || false,
			address: data?.address,
			city: data?.city,
			zipCode: data?.zipCode,
			state: data?.state,
			country: data?.country,
			agencyLogo: data?.agencyLogo,
		},
	});

	const isLoading = form.formState.isSubmitting;

	useEffect(() => {
		if (data) {
			form.reset(data);
		}

		const fetchCountryData = async () => {
			try {
				const response = await fetch("https://get.geojs.io/v1/ip/country.json");
				const countryData = await response.json();
				form.setValue("country", countryData.name);
			} catch (error) {
				console.error("Failed to fetch country data", error);
			}
		};

		fetchCountryData();
	}, [form, data]);

	const handleSubmit = async (values: z.infer<typeof FormSchema>) => {
		try {
			let newUserData;
			let custId;
			if (!data?.id) {
				const bodyData = {
					email: values.companyEmail,
					name: values.name,
					shipping: {
						address: {
							city: values.city,
							country: values.country,
							line1: values.address,
							postal_code: values.zipCode,
							state: values.zipCode,
						},
						name: values.name,
					},
					address: {
						city: values.city,
						country: values.country,
						line1: values.address,
						postal_code: values.zipCode,
						state: values.zipCode,
					},
				};

				const customerResponse = await fetch("/api/stripe/create-customer", {
					method: "POST",
					headers: {
						"Content-Type": "application/json",
					},
					body: JSON.stringify(bodyData),
				});
				const customerData: { customerId: string } =
					await customerResponse.json();
				custId = customerData.customerId;
			}

			newUserData = await initUser({ role: "AGENCY_OWNER" });
			if (!data?.customerId && !custId) return;

			const response = await upsertAgency({
				id: data?.id ? data.id : v4(),
				customerId: data?.customerId || custId || "",
				address: values.address,
				agencyLogo: values.agencyLogo,
				city: values.city,
				companyPhone: values.companyPhone,
				country: values.country,
				name: values.name,
				state: values.state,
				whiteLabel: values.whiteLabel,
				zipCode: values.zipCode,
				createdAt: new Date(),
				updatedAt: new Date(),
				companyEmail: values.companyEmail,
				connectAccountId: "",
				goal: 5,
			});
			toast({
				title: "Created Agency",
			});
			if (data?.id) return router.refresh();
			if (response) {
				return router.refresh();
			}
		} catch (error) {
			console.log(error);
			toast({
				variant: "destructive",
				title: "Oppse!",
				description: "could not create your agency",
			});
		}
	};

	const handleDeleteAgency = async () => {
		if (!data?.id) return;
		setDeletingAgency(true);
		try {
			const response = await deleteAgency(data.id);
			toast({
				title: "Deleted Agency",
				description: "Deleted your agency and all subaccounts",
			});
			router.refresh();
		} catch (error) {
			console.log(error);
			toast({
				variant: "destructive",
				title: "Oppse!",
				description: "could not delete your agency ",
			});
		}
		setDeletingAgency(false);
	};

	return (
		<AlertDialog>
			<Card className="w-full">
				<CardHeader>
					<CardTitle>Agency Information</CardTitle>
					<CardDescription>
						Lets create an agency for you business. You can edit agency settings
						later from the agency settings tab.
					</CardDescription>
				</CardHeader>
				<CardContent>
					<Form {...form}>
						<form
							onSubmit={form.handleSubmit(handleSubmit)}
							className="space-y-4"
						>
							<FormField
								disabled={isLoading}
								control={form.control}
								name="agencyLogo"
								render={({ field }) => (
									<FormItem>
										<FormLabel>Agency Logo</FormLabel>
										<FormControl>
											<FileUpload
												apiEndpoint="agencyLogo"
												onChange={field.onChange}
												value={field.value}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="flex md:flex-row gap-4">
								<FormField
									disabled={isLoading}
									control={form.control}
									name="name"
									render={({ field }) => (
										<FormItem className="flex-1">
											<FormLabel>Agency Name</FormLabel>
											<FormControl>
												<Input
													autoComplete="new-off"
													placeholder="Your agency name"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									control={form.control}
									name="companyEmail"
									render={({ field }) => (
										<FormItem className="flex-1">
											<FormLabel>Agency Email</FormLabel>
											<FormControl>
												<Input readOnly placeholder="Email" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<div className="flex md:flex-row gap-4">
								<FormField
									disabled={isLoading}
									control={form.control}
									name="companyPhone"
									render={({ field }) => (
										<FormItem className="flex-1">
											<FormLabel>Agency Phone Number</FormLabel>
											<FormControl>
												<Input placeholder="Phone" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>

							<FormField
								disabled={isLoading}
								control={form.control}
								name="whiteLabel"
								render={({ field }) => {
									return (
										<FormItem className="flex flex-row items-center justify-between rounded-lg border gap-4 p-4">
											<div>
												<FormLabel>Whitelabel Agency</FormLabel>
												<FormDescription>
													Turning on whilelabel mode will show your agency logo
													to all sub accounts by default. You can overwrite this
													functionality through sub account settings.
												</FormDescription>
											</div>

											<FormControl>
												<Switch
													checked={field.value}
													onCheckedChange={field.onChange}
												/>
											</FormControl>
										</FormItem>
									);
								}}
							/>
							<FormField
								disabled={isLoading}
								control={form.control}
								name="address"
								render={({ field }) => (
									<FormItem className="flex-1">
										<FormLabel>Address</FormLabel>
										<FormControl>
											<Input
												autoComplete="street-address"
												placeholder="Cl 5..."
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							<div className="flex md:flex-row gap-4">
								<FormField
									disabled={isLoading}
									control={form.control}
									name="city"
									render={({ field }) => (
										<FormItem className="flex-1">
											<FormLabel>City</FormLabel>
											<FormControl>
												<Input
													autoComplete="home city"
													placeholder="City"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									disabled={isLoading}
									control={form.control}
									name="state"
									render={({ field }) => (
										<FormItem className="flex-1">
											<FormLabel>State</FormLabel>
											<FormControl>
												<Input placeholder="State" {...field} />
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
								<FormField
									disabled={isLoading}
									control={form.control}
									name="zipCode"
									render={({ field }) => (
										<FormItem className="flex-1">
											<FormLabel>Zipcode</FormLabel>
											<FormControl>
												<Input
													autoComplete="postal-code"
													placeholder="Zipcode"
													{...field}
												/>
											</FormControl>
											<FormMessage />
										</FormItem>
									)}
								/>
							</div>
							<FormField
								disabled={isLoading}
								control={form.control}
								name="country"
								render={({ field }) => (
									<FormItem className="flex-1">
										<FormLabel>Country</FormLabel>
										<FormControl>
											<Input
												autoComplete="country-name"
												placeholder="Country"
												{...field}
											/>
										</FormControl>
										<FormMessage />
									</FormItem>
								)}
							/>
							{data?.id && (
								<div className="flex flex-col gap-2">
									<FormLabel>Create A Goal</FormLabel>
									<FormDescription>
										✨ Create a goal for your agency. As your business grows
										your goals grow too so dont forget to set the bar higher!
									</FormDescription>
									<NumberInput
										defaultValue={data?.goal}
										onValueChange={async (val) => {
											if (!data?.id) return;
											await updateAgencyDetails(data.id, { goal: val });
											await saveActivityLogsNotification({
												agencyId: data.id,
												description: `Updated the agency goal to | ${val} Sub Account`,
												subaccountId: undefined,
											});
											router.refresh();
										}}
										min={1}
										className="bg-background !border !border-input"
										placeholder="Sub Account Goal"
									/>
								</div>
							)}
							<Button type="submit" disabled={isLoading}>
								{isLoading ? <Loading /> : "Save Agency Information"}
							</Button>
						</form>
					</Form>

					{data?.id && (
						<div
							className="flex flex-row items-center justify-between rounded-lg border border-destructive gap-4 p-4 mt-4 whitespace-nowrap h-[34px] px-3 hover:bg-red-100"
							style={{ width: "fit-content" }}
						>
							<AlertDialogTrigger
								disabled={isLoading || deletingAgency}
								className="text-red-600 p-2 text-center rounded-md hove:bg-red-600 whitespace-nowrap flex space-x-3 items-center"
							>
								<div className="flex space-x-3 items-center gap-1.5">
									<div
										className="icon-container icon-md text-red-500 stroke-0"
										aria-hidden="true"
									>
										<svg width="20" height="20" viewBox="0 0 20 20" fill="none">
											<path
												d="M15.2023 16.1859L18.3333 12.537L14.3751 13.125L15.6785 7.2476L12.0166 10.8486L9.99996 2.5L7.98329 10.8486L4.32139 7.2476L5.62506 13.125L1.66663 12.537L4.79758 16.1859M8.04758 16.6667L9.49988 15L9.99988 13.5L10.4999 15L11.9523 16.6667"
												stroke="currentColor"
												stroke-width="1.5"
												stroke-linecap="round"
												stroke-linejoin="round"
											></path>
										</svg>
									</div>

									{deletingAgency ? "Deleting..." : "Delete Agency"}
								</div>
							</AlertDialogTrigger>
						</div>
					)}
					<AlertDialogContent>
						<AlertDialogHeader>
							<AlertDialogTitle className="text-left">
								Are you absolutely sure?
							</AlertDialogTitle>
							<AlertDialogDescription className="text-left">
								This action cannot be undone. This will permanently delete the
								Agency account and all related sub accounts.
							</AlertDialogDescription>
						</AlertDialogHeader>
						<AlertDialogFooter className="flex items-baseline">
							<AlertDialogCancel className="mb-2">Cancel</AlertDialogCancel>
							<AlertDialogAction
								disabled={deletingAgency}
								className="bg-destructive hover:bg-destructive"
								onClick={handleDeleteAgency}
							>
								Yes, Delete Agency Forever
							</AlertDialogAction>
						</AlertDialogFooter>
					</AlertDialogContent>
				</CardContent>
			</Card>
		</AlertDialog>
	);
};

export default AgencyDetails;
