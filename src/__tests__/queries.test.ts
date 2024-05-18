import { db } from "@/lib/db";
import { createTeamUser, getAuthUserDetails } from "@/lib/queries";
import { currentUser } from "@clerk/nextjs";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@clerk/nextjs", () => ({
	currentUser: vi.fn(),
}));

vi.mock("@/lib/db", () => ({
	db: {
		user: {
			findUnique: vi.fn(),
			create: vi.fn(),
		},
		invitation: {
			findUnique: vi.fn(),
		},
	},
}));

describe("getAuthUserDetails", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("returns user data if the user is authenticated and data is found", async () => {
		const mockUser = {
			id: "123",
			emailAddresses: [{ emailAddress: "test@example.com" }],
		};
		const mockUserData = {
			id: "123",
			email: "test@example.com",
			Permissions: {},
		};

		vi.mocked(currentUser).mockResolvedValue(mockUser);
		vi.mocked(db.user.findUnique).mockResolvedValue(mockUserData);

		const result = await getAuthUserDetails();

		expect(result).toEqual(mockUserData);
		expect(db.user.findUnique).toHaveBeenCalledWith({
			where: { email: mockUser.emailAddresses[0].emailAddress },
			include: expect.any(Object),
		});
	});

	it("returns undefined if the user is authenticated but no data is found", async () => {
		const mockUser = {
			id: "123",
			emailAddresses: [{ emailAddress: "test@example.com" }],
		};

		vi.mocked(currentUser).mockResolvedValue(mockUser);
		vi.mocked(db.user.findUnique).mockResolvedValue(null);

		const result = await getAuthUserDetails();
		console.log(result);

		expect(result).toBeNull();
	});

	it("returns undefined if the user is not authenticated", async () => {
		vi.mocked(currentUser).mockResolvedValue(null);

		const result = await getAuthUserDetails();

		expect(result).toBeUndefined();
	});
});

describe("createTeamUser", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("creates a team user successfully when role is not AGENCY_OWNER", async () => {
		const mockUser = {
			id: "124",
			email: "newuser@example.com",
			agencyId: "agency1",
			role: "SUBACCOUNT_USER",
			createdAt: new Date(),
			updatedAt: new Date(),
		};

		vi.mocked(db.user.create).mockResolvedValue(mockUser);

		const result = await createTeamUser("agency1", mockUser);

		expect(result).toEqual(mockUser);
		expect(db.user.create).toHaveBeenCalledWith({ data: mockUser });
	});

	it("returns null if the user role is AGENCY_OWNER", async () => {
		const mockUser = {
			id: "125",
			email: "owner@example.com",
			agencyId: "agency1",
			role: "AGENCY_OWNER",
		};

		const result = await createTeamUser("agency1", mockUser);

		expect(result).toBeNull();
		expect(db.user.create).not.toHaveBeenCalled();
	});
});

describe("verifyAndAcceptInvitation", () => {
	beforeEach(() => {
		vi.resetAllMocks();
	});

	it("returns the agency ID if no pending invitation exists", async () => {
		const mockUser = {
			id: "123",
			emailAddresses: [{ emailAddress: "test@example.com" }],
		};
		vi.mocked(currentUser).mockResolvedValue(mockUser);
		vi.mocked(db.invitation.findUnique).mockResolvedValue(null);
		vi.mocked(db.user.findUnique).mockResolvedValue({
			agencyId: "agency1",
		});

		const result = await verifyAndAcceptInvitation();

		expect(result).toEqual("agency1");
	});
});
