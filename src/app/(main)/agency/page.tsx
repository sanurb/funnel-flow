import AgencyDetails from "@/components/forms/agency-details";
import { currentUser } from "@clerk/nextjs";
import type { Plan } from "@prisma/client";
import { redirect } from "next/navigation";
import {
	getAuthUserDetails,
	verifyAndAcceptInvitation,
} from "../../../lib/queries";

interface ISearchParams {
	plan: Plan | null;
	state: string | null;
	code: string | null;
}

type RedirectPathResolver = (
	searchParams: ISearchParams,
	agencyId: string,
) => string;

interface RoleToRedirectPathMap {
	[role: string]: string | RedirectPathResolver;
}

const roleToRedirectPath: RoleToRedirectPathMap = {
	SUBACCOUNT_GUEST: "/subaccount",
	SUBACCOUNT_USER: "/subaccount",
	AGENCY_OWNER: (searchParams: ISearchParams, agencyId: string) =>
		determineAgencyRedirectPath(searchParams, agencyId),
	AGENCY_ADMIN: (searchParams: ISearchParams, agencyId: string) =>
		determineAgencyRedirectPath(searchParams, agencyId),
};

function determineAgencyRedirectPath(
	searchParams: ISearchParams,
	agencyId: string,
): string {
	if (searchParams.plan) {
		return `/agency/${agencyId}/billing?plan=${searchParams.plan}`;
	}
	return handleStateRedirect(searchParams, agencyId) || `/agency/${agencyId}`;
}

function handleStateRedirect(
	searchParams: ISearchParams,
	agencyId: string,
): string {
	if (!searchParams.state) {
		return `/agency/${agencyId}`;
	}
	const [statePath, stateAgencyId] = searchParams.state.split("___");
	if (!stateAgencyId) {
		return "NOT_AUTHORIZED";
	}
	return `/agency/${stateAgencyId}/${statePath}?code=${searchParams.code}`;
}

const Page = async ({
	searchParams,
}: { searchParams: { plan: Plan; state: string; code: string } }) => {
	const agencyId = await verifyAndAcceptInvitation();
	const user = await getAuthUserDetails();

	if (agencyId && user) {
		console.log("agencyId: ", agencyId);
		console.log("user role: ", user?.role);
		const redirectResolver = roleToRedirectPath[user.role];
		console.log("redirectResolver: ", redirectResolver);
		const redirectPath: string | RedirectPathResolver =
			typeof redirectResolver === "function"
				? redirectResolver(searchParams, agencyId)
				: redirectResolver;

		if (!redirectPath || redirectPath === "NOT_AUTHORIZED") {
			return <div>Not authorized</div>;
		}
		return redirect(redirectPath);
	}

	const authUser = await currentUser();
	if (!authUser) {
		return <div>Not authorized</div>;
	}

	return (
		<div className="flex flex-col items-center w-full min-w-0 min-h-lg pt-3">
			<div className="flex flex-col flex-grow w-full first:mt-0 last:mb-0 max-w-[850px] border-[1px] p-4 rounded-xl">
				<h1 className="text-4xl">Create An Agency</h1>
				<hr className="my-4 w-full border-t" />
				<AgencyDetails
					data={{ companyEmail: authUser.emailAddresses[0].emailAddress }}
				/>
			</div>
		</div>
	);
};

export default Page;
