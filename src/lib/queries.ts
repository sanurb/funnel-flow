"use server";

import { clerkClient, currentUser } from "@clerk/nextjs";
import {
  Agency,
  Lane,
  Plan,
  Prisma,
  Role,
  SubAccount,
  Tag,
  Ticket,
  User,
} from "@prisma/client";
import { redirect } from "next/navigation";
import { v4 } from "uuid";
import { db } from "./db";
import {
  CreateFunnelFormSchema,
  CreateMediaType,
  UpsertFunnelPage,
} from "./types";
import { withRetry } from "./utils";
import { z } from "zod";
import { revalidatePath } from "next/cache";

/**
 * Retrieves the authenticated user's details from the database.
 * @returns A promise that resolves to the user's data if found, otherwise undefined.
 */
export const getAuthUserDetails = async () => {
  const user = await withRetry(async () => await currentUser());
  if (!user) {
    return;
  }

  const userData = await db.user.findUnique({
    where: {
      email: user.emailAddresses[0].emailAddress,
    },
    include: {
      Agency: {
        include: {
          SidebarOption: true,
          SubAccount: {
            include: {
              SidebarOption: true,
            },
          },
        },
      },
      Permissions: true,
    },
  });

  return userData;
};

/**
 * Creates a team user.
 * @param agencyId - The ID of the agency.
 * @param user - The user object.
 * @returns The response from the database.
 */
export const createTeamUser = async (agencyId: string, user: User) => {
  if (user.role === "AGENCY_OWNER") return null;
  const response = await db.user.create({ data: { ...user } });
  return response;
};

/**
 * Verifies and accepts an invitation for the current user.
 * If the user is not authenticated, it redirects to the sign-in page.
 * If the invitation exists and is pending, it creates a team user with the invitation details,
 * saves an activity log notification, updates the user's role metadata,
 * deletes the invitation, and returns the agency ID of the created user.
 * If the invitation does not exist, it retrieves the agency ID of the user and returns it.
 * @returns The agency ID of the created user or the agency ID of the user if the invitation does not exist.
 */
export const verifyAndAcceptInvitation = async () => {
  const user = await withRetry(async () => await currentUser());
  if (!user) return redirect("/sign-in");
  const invitationExists = await db.invitation.findUnique({
    where: {
      email: user.emailAddresses[0].emailAddress,
      status: "PENDING",
    },
  });

  if (invitationExists) {
    const userDetails = await createTeamUser(invitationExists.agencyId, {
      email: invitationExists.email,
      agencyId: invitationExists.agencyId,
      avatarUrl: user.imageUrl,
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      role: invitationExists.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await saveActivityLogsNotification({
      agencyId: invitationExists?.agencyId,
      description: `Joined`,
      subaccountId: undefined,
    });

    if (userDetails) {
      await clerkClient.users.updateUserMetadata(user.id, {
        privateMetadata: {
          role: userDetails.role || "SUBACCOUNT_USER",
        },
      });

      await db.invitation.delete({
        where: { email: userDetails.email },
      });

      return userDetails.agencyId;
    } else return null;
  } else {
    const agency = await db.user.findUnique({
      where: {
        email: user.emailAddresses[0].emailAddress,
      },
    });
    return agency?.agencyId ?? null;
  }
};

/**
 * Saves an activity log notification.
 * @param {Object} params - The parameters for saving the notification.
 * @param {string} [params.agencyId] - The ID of the agency.
 * @param {string} params.description - The description of the notification.
 * @param {string} [params.subaccountId] - The ID of the subaccount.
 * @returns {Promise<void>} - A promise that resolves when the notification is saved.
 */
export const saveActivityLogsNotification = async ({
  agencyId,
  description,
  subaccountId,
}: {
  agencyId?: string;
  description: string;
  subaccountId?: string;
}) => {
  const authUser = await currentUser();
  let userData;
  if (!authUser) {
    const response = await db.user.findFirst({
      where: {
        Agency: {
          SubAccount: {
            some: { id: subaccountId },
          },
        },
      },
    });
    if (response) {
      userData = response;
    }
  } else {
    userData = await db.user.findUnique({
      where: { email: authUser?.emailAddresses[0].emailAddress },
    });
  }

  if (!userData) {
    console.log("Could not find a user");
    return;
  }

  let foundAgencyId = agencyId;
  if (!foundAgencyId) {
    if (!subaccountId) {
      throw new Error(
        "You need to provide atleast an agency Id or subaccount Id"
      );
    }
    const response = await db.subAccount.findUnique({
      where: { id: subaccountId },
    });
    if (response) foundAgencyId = response.agencyId;
  }
  if (subaccountId) {
    await db.notification.create({
      data: {
        notification: `${userData.name} | ${description}`,
        User: {
          connect: {
            id: userData.id,
          },
        },
        Agency: {
          connect: {
            id: foundAgencyId,
          },
        },
        SubAccount: {
          connect: { id: subaccountId },
        },
      },
    });
  } else {
    await db.notification.create({
      data: {
        notification: `${userData.name} | ${description}`,
        User: {
          connect: {
            id: userData.id,
          },
        },
        Agency: {
          connect: {
            id: foundAgencyId,
          },
        },
      },
    });
  }
};

/**
 * Updates the details of an agency.
 * @param agencyId - The ID of the agency to update.
 * @param agencyDetails - The partial details of the agency to update.
 * @returns A promise that resolves to the updated agency details.
 */
export const updateAgencyDetails = async (
  agencyId: string,
  agencyDetails: Partial<Agency>
) => {
  const response = await db.agency.update({
    where: { id: agencyId },
    data: { ...agencyDetails },
  });
  return response;
};

/**
 * Deletes an agency from the database.
 * @param agencyId The ID of the agency to delete.
 * @returns A promise that resolves to the response from the database.
 */
export const deleteAgency = async (agencyId: string) => {
  const response = await db.agency.delete({ where: { id: agencyId } });
  return response;
};

/**
 * Initializes a user by creating or updating their data in the database.
 * @param newUser - The partial user object containing the updated user data.
 * @returns The updated user data.
 */
export const initUser = async (newUser: Partial<User>) => {
  const user = await currentUser();
  if (!user) return;

  const userData = await db.user.upsert({
    where: {
      email: user.emailAddresses[0].emailAddress,
    },
    update: newUser,
    create: {
      id: user.id,
      avatarUrl: user.imageUrl,
      email: user.emailAddresses[0].emailAddress,
      name: `${user.firstName} ${user.lastName}`,
      role: newUser.role || "SUBACCOUNT_USER",
    },
  });

  await clerkClient.users.updateUserMetadata(user.id, {
    privateMetadata: {
      role: newUser.role || "SUBACCOUNT_USER",
    },
  });

  return userData;
};

/**
 * Upserts an agency with the given agency details and optional price.
 *
 * @param agency - The agency object to upsert.
 * @param price - Optional price object.
 * @returns The agency details after upsert.
 */
export const upsertAgency = async (agency: Agency, price?: Plan) => {
  if (!agency.companyEmail) return null;
  try {
    const agencyDetails = await db.agency.upsert({
      where: {
        id: agency.id,
      },
      update: agency,
      create: {
        users: {
          connect: { email: agency.companyEmail },
        },
        ...agency,
        SidebarOption: {
          create: [
            {
              name: "Dashboard",
              icon: "category",
              link: `/agency/${agency.id}`,
            },
            {
              name: "Launchpad",
              icon: "clipboardIcon",
              link: `/agency/${agency.id}/launchpad`,
            },
            {
              name: "Billing",
              icon: "payment",
              link: `/agency/${agency.id}/billing`,
            },
            {
              name: "Settings",
              icon: "settings",
              link: `/agency/${agency.id}/settings`,
            },
            {
              name: "Sub Accounts",
              icon: "person",
              link: `/agency/${agency.id}/all-subaccounts`,
            },
            {
              name: "Team",
              icon: "shield",
              link: `/agency/${agency.id}/team`,
            },
          ],
        },
      },
    });
    return agencyDetails;
  } catch (error) {
    console.log(error);
  }
};

/**
 * Retrieves notifications and associated users for a given agency.
 * @param agencyId - The ID of the agency.
 * @returns A Promise that resolves to an array of notifications and associated users.
 */
export const getNotificationAndUser = async (agencyId: string) => {
  try {
    const response = await db.notification.findMany({
      where: { agencyId },
      include: { User: true },
      orderBy: {
        createdAt: "desc",
      },
    });
    return response;
  } catch (error) {
    console.log(error);
  }
};

/**
 * Upserts a subaccount.
 * @param subAccount - The subaccount object to upsert.
 * @returns The response from the upsert operation.
 */
export const upsertSubAccount = async (subAccount: SubAccount) => {
  if (!subAccount.companyEmail) return null;
  const agencyOwner = await db.user.findFirst({
    where: {
      Agency: {
        id: subAccount.agencyId,
      },
      role: "AGENCY_OWNER",
    },
  });
  if (!agencyOwner) return console.log("🔴Error: could not create subaccount");
  const permissionId = v4();
  const response = await db.subAccount.upsert({
    where: { id: subAccount.id },
    update: subAccount,
    create: {
      ...subAccount,
      Permissions: {
        create: {
          access: true,
          email: agencyOwner.email,
          id: permissionId,
        },
        connect: {
          subAccountId: subAccount.id,
          id: permissionId,
        },
      },
      Pipeline: {
        create: { name: "Lead Cycle" },
      },
      SidebarOption: {
        create: [
          {
            name: "Launchpad",
            icon: "clipboardIcon",
            link: `/subaccount/${subAccount.id}/launchpad`,
          },
          {
            name: "Settings",
            icon: "settings",
            link: `/subaccount/${subAccount.id}/settings`,
          },
          {
            name: "Funnels",
            icon: "pipelines",
            link: `/subaccount/${subAccount.id}/funnels`,
          },
          {
            name: "Media",
            icon: "database",
            link: `/subaccount/${subAccount.id}/media`,
          },
          {
            name: "Automations",
            icon: "chip",
            link: `/subaccount/${subAccount.id}/automations`,
          },
          {
            name: "Pipelines",
            icon: "flag",
            link: `/subaccount/${subAccount.id}/pipelines`,
          },
          {
            name: "Contacts",
            icon: "person",
            link: `/subaccount/${subAccount.id}/contacts`,
          },
          {
            name: "Dashboard",
            icon: "category",
            link: `/subaccount/${subAccount.id}`,
          },
        ],
      },
    },
  });
  return response;
};

/**
 * Retrieves the permissions of a user.
 * @param userId The ID of the user.
 * @returns A promise that resolves to the user's permissions.
 */
export const getUserPermissions = async (userId: string) => {
  const response = await db.user.findUnique({
    where: { id: userId },
    select: { Permissions: { include: { SubAccount: true } } },
  });

  return response;
};

/**
 * Updates a user in the database and updates the user metadata in Clerk.
 * @param user - The partial user object containing the updated user data.
 * @returns The updated user object.
 */
export const updateUser = async (user: Partial<User>) => {
  const response = await db.user.update({
    where: { email: user.email },
    data: { ...user },
  });

  await clerkClient.users.updateUserMetadata(response.id, {
    privateMetadata: {
      role: user.role || "SUBACCOUNT_USER",
    },
  });

  return response;
};

/**
 * Changes the user permissions.
 * @param permissionId - The ID of the permission.
 * @param userEmail - The email of the user.
 * @param subAccountId - The ID of the sub-account.
 * @param permission - The new permission value.
 * @returns The response from the database operation.
 */
export const changeUserPermissions = async (
  permissionId: string | undefined,
  userEmail: string,
  subAccountId: string,
  permission: boolean
) => {
  try {
    const response = await db.permissions.upsert({
      where: { id: permissionId },
      update: { access: permission },
      create: {
        access: permission,
        email: userEmail,
        subAccountId: subAccountId,
      },
    });
    return response;
  } catch (error) {
    console.log("🔴Could not change persmission", error);
  }
};

/**
 * Retrieves the details of a subaccount.
 * @param subaccountId - The ID of the subaccount to retrieve details for.
 * @returns A Promise that resolves to the response containing the subaccount details.
 */
export const getSubaccountDetails = async (subaccountId: string) => {
  const response = await db.subAccount.findUnique({
    where: {
      id: subaccountId,
    },
  });
  return response;
};

/**
 * Deletes a subaccount from the database.
 * @param subaccountId - The ID of the subaccount to delete.
 * @returns A Promise that resolves to the response from the database.
 */
export const deleteSubAccount = async (subaccountId: string) => {
  const response = await db.subAccount.delete({
    where: {
      id: subaccountId,
    },
  });
  return response;
};

/**
 * Deletes a user from the system.
 *
 * @param userId - The ID of the user to delete.
 * @returns The deleted user object.
 */
export const deleteUser = async (userId: string) => {
  await clerkClient.users.updateUserMetadata(userId, {
    privateMetadata: {
      role: undefined,
    },
  });
  const deletedUser = await db.user.delete({ where: { id: userId } });

  return deletedUser;
};

/**
 * Retrieves a user by their ID.
 * @param id - The ID of the user to retrieve.
 * @returns A Promise that resolves to the user object.
 */
export const getUser = async (id: string) => {
  const user = await db.user.findUnique({
    where: {
      id,
    },
  });

  return user;
};

/**
 * Sends an invitation to a user with the specified role, email, and agency ID.
 * @param role - The role of the user being invited.
 * @param email - The email address of the user being invited.
 * @param agencyId - The ID of the agency associated with the invitation.
 * @returns A Promise that resolves to the response from the database.
 */
export const sendInvitation = async (
  role: Role,
  email: string,
  agencyId: string
) => {
  const resposne = await db.invitation.create({
    data: { email, agencyId, role },
  });

  try {
    const invitation = await clerkClient.invitations.createInvitation({
      emailAddress: email,
      redirectUrl: process.env.NEXT_PUBLIC_URL,
      publicMetadata: {
        throughInvitation: true,
        role,
      },
    });
  } catch (error) {
    console.log(error);
    throw error;
  }

  return resposne;
};

/**
 * Retrieves the media files associated with a subaccount.
 * @param subaccountId - The ID of the subaccount.
 * @returns A Promise that resolves to the media files.
 */
export const getMedia = async (subaccountId: string) => {
  const mediafiles = await db.subAccount.findUnique({
    where: { id: subaccountId },
    include: { Media: true },
  });
  return mediafiles;
};

/**
 * Creates a new media entry in the database.
 *
 * @param subaccountId - The ID of the subaccount.
 * @param mediaFile - The media file object containing the link and name.
 * @returns A Promise that resolves to the response from the database.
 */
export const createMedia = async (
  subaccountId: string,
  mediaFile: CreateMediaType
) => {
  const response = await db.media.create({
    data: {
      link: mediaFile.link,
      name: mediaFile.name,
      subAccountId: subaccountId,
    },
  });

  return response;
};

/**
 * Deletes a media item from the database.
 * @param mediaId - The ID of the media item to delete.
 * @returns A Promise that resolves to the response from the database.
 */
export const deleteMedia = async (mediaId: string) => {
  const response = await db.media.delete({
    where: {
      id: mediaId,
    },
  });
  return response;
};

/**
 * Retrieves the details of a pipeline from the database.
 * @param pipelineId - The ID of the pipeline to retrieve.
 * @returns A promise that resolves to the pipeline details.
 */
export const getPipelineDetails = async (pipelineId: string) => {
  const response = await db.pipeline.findUnique({
    where: { id: pipelineId },
  });
  return response;
};

/**
 * Retrieves lanes with tickets and their associated tags.
 * @param pipelineId - The ID of the pipeline.
 * @returns A promise that resolves to an array of lanes with tickets and tags.
 */
export const getLanesWithTicketAndTags = async (pipelineId: string) => {
  const response = await db.lane.findMany({
    where: {
      pipelineId,
    },
    orderBy: { order: "asc" },
    include: {
      Tickets: {
        orderBy: {
          order: "asc",
        },
        include: {
          Tags: true,
          Assigned: true,
          Customer: true,
        },
      },
    },
  });
  return response;
};

/**
 * Upserts a funnel into the database.
 *
 * @param subaccountId - The ID of the subaccount.
 * @param funnel - The funnel object to upsert, including liveProducts.
 * @param funnelId - The ID of the funnel.
 * @returns The response from the upsert operation.
 */
export const upsertFunnel = async (
  subaccountId: string,
  funnel: z.infer<typeof CreateFunnelFormSchema> & { liveProducts: string },
  funnelId: string
) => {
  const response = await db.funnel.upsert({
    where: { id: funnelId },
    update: funnel,
    create: {
      ...funnel,
      id: funnelId || v4(),
      subAccountId: subaccountId,
    },
  });

  return response;
};

/**
 * Upserts a pipeline in the database.
 * If the pipeline with the given ID exists, it will be updated.
 * If the pipeline with the given ID does not exist, it will be created.
 *
 * @param pipeline - The pipeline object to upsert.
 * @returns The upserted pipeline object.
 */
export const upsertPipeline = async (
  pipeline: Prisma.PipelineUncheckedCreateWithoutLaneInput
) => {
  const response = await db.pipeline.upsert({
    where: { id: pipeline.id || v4() },
    update: pipeline,
    create: pipeline,
  });

  return response;
};

/**
 * Deletes a pipeline from the database.
 * @param pipelineId - The ID of the pipeline to delete.
 * @returns A promise that resolves to the response from the database.
 */
export const deletePipeline = async (pipelineId: string) => {
  const response = await db.pipeline.delete({
    where: { id: pipelineId },
  });
  return response;
};

/**
 * Updates the order of lanes in the database.
 * @param lanes - An array of Lane objects representing the lanes to be updated.
 * @returns A Promise that resolves when the lanes' order has been updated.
 */
export const updateLanesOrder = async (lanes: Lane[]) => {
  try {
    const updateTrans = lanes.map((lane) =>
      db.lane.update({
        where: {
          id: lane.id,
        },
        data: {
          order: lane.order,
        },
      })
    );

    await db.$transaction(updateTrans);
    console.log("🟢 Done reordered 🟢");
  } catch (error) {
    console.log(error, "ERROR UPDATE LANES ORDER");
  }
};

/**
 * Updates the order of tickets in the database.
 * @param tickets - An array of Ticket objects containing the updated order and laneId.
 */
export const updateTicketsOrder = async (tickets: Ticket[]) => {
  try {
    const updateTrans = tickets.map((ticket) =>
      db.ticket.update({
        where: {
          id: ticket.id,
        },
        data: {
          order: ticket.order,
          laneId: ticket.laneId,
        },
      })
    );

    await db.$transaction(updateTrans);
    console.log("🟢 Done reordered 🟢");
  } catch (error) {
    console.log(error, "🔴 ERROR UPDATE TICKET ORDER");
  }
};

/**
 * Upserts a lane in the database.
 * If the lane already exists, it updates the lane.
 * If the lane doesn't exist, it creates a new lane.
 * @param lane - The lane object to upsert.
 * @returns The upserted lane object.
 */
export const upsertLane = async (lane: Prisma.LaneUncheckedCreateInput) => {
  let order: number;

  if (!lane.order) {
    const lanes = await db.lane.findMany({
      where: {
        pipelineId: lane.pipelineId,
      },
    });

    order = lanes.length;
  } else {
    order = lane.order;
  }

  const response = await db.lane.upsert({
    where: { id: lane.id || v4() },
    update: lane,
    create: { ...lane, order },
  });

  return response;
};

/**
 * Deletes a lane from the database.
 * @param laneId - The ID of the lane to delete.
 * @returns A Promise that resolves to the response from the database.
 */
export const deleteLane = async (laneId: string) => {
  const resposne = await db.lane.delete({ where: { id: laneId } });
  return resposne;
};

/**
 * Retrieves tickets with tags based on the provided pipeline ID.
 * @param pipelineId - The ID of the pipeline.
 * @returns A promise that resolves to an array of tickets with tags, assigned users, and customers.
 */
export const getTicketsWithTags = async (pipelineId: string) => {
  const response = await db.ticket.findMany({
    where: {
      Lane: {
        pipelineId,
      },
    },
    include: { Tags: true, Assigned: true, Customer: true },
  });
  return response;
};

/**
 * Retrieves tickets with all their related entities.
 * @param laneId - The ID of the lane to filter the tickets by.
 * @returns A promise that resolves to an array of tickets with their related entities.
 */
export const _getTicketsWithAllRelations = async (laneId: string) => {
  const response = await db.ticket.findMany({
    where: { laneId: laneId },
    include: {
      Assigned: true,
      Customer: true,
      Lane: true,
      Tags: true,
    },
  });
  return response;
};

/**
 * Retrieves the team members associated with a specific subaccount.
 * @param subaccountId - The ID of the subaccount.
 * @returns A promise that resolves to an array of subaccount team members.
 */
export const getSubAccountTeamMembers = async (subaccountId: string) => {
  const subaccountUsersWithAccess = await db.user.findMany({
    where: {
      Agency: {
        SubAccount: {
          some: {
            id: subaccountId,
          },
        },
      },
      role: "SUBACCOUNT_USER",
      Permissions: {
        some: {
          subAccountId: subaccountId,
          access: true,
        },
      },
    },
  });
  return subaccountUsersWithAccess;
};

/**
 * Searches for contacts based on the provided search terms.
 * @param searchTerms - The search terms to match against contact names.
 * @returns A Promise that resolves to an array of contacts matching the search terms.
 */
export const searchContacts = async (searchTerms: string) => {
  const response = await db.contact.findMany({
    where: {
      name: {
        contains: searchTerms,
      },
    },
  });
  return response;
};

/**
 * Upserts a ticket into the database.
 * If the ticket already exists, it updates the ticket.
 * If the ticket doesn't exist, it creates a new ticket.
 * @param ticket - The ticket to upsert.
 * @param tags - The tags associated with the ticket.
 * @returns The upserted ticket.
 */
export const upsertTicket = async (
  ticket: Prisma.TicketUncheckedCreateInput,
  tags: Tag[]
) => {
  let order: number;
  if (!ticket.order) {
    const tickets = await db.ticket.findMany({
      where: { laneId: ticket.laneId },
    });
    order = tickets.length;
  } else {
    order = ticket.order;
  }

  const response = await db.ticket.upsert({
    where: {
      id: ticket.id || v4(),
    },
    update: { ...ticket, Tags: { set: tags } },
    create: { ...ticket, Tags: { connect: tags }, order },
    include: {
      Assigned: true,
      Customer: true,
      Tags: true,
      Lane: true,
    },
  });

  return response;
};

/**
 * Deletes a ticket from the database.
 * @param ticketId - The ID of the ticket to delete.
 * @returns A Promise that resolves to the response from the database.
 */
export const deleteTicket = async (ticketId: string) => {
  const response = await db.ticket.delete({
    where: {
      id: ticketId,
    },
  });

  return response;
};

/**
 * Upserts a tag for a specific subaccount.
 *
 * @param subaccountId - The ID of the subaccount.
 * @param tag - The tag to upsert.
 * @returns The upserted tag.
 */
export const upsertTag = async (
  subaccountId: string,
  tag: Prisma.TagUncheckedCreateInput
) => {
  const response = await db.tag.upsert({
    where: { id: tag.id || v4(), subAccountId: subaccountId },
    update: tag,
    create: { ...tag, subAccountId: subaccountId },
  });

  return response;
};

/**
 * Retrieves the tags associated with a specific subaccount.
 * @param subaccountId - The ID of the subaccount.
 * @returns A promise that resolves to the tags associated with the subaccount.
 */
export const getTagsForSubaccount = async (subaccountId: string) => {
  const response = await db.subAccount.findUnique({
    where: { id: subaccountId },
    select: { Tags: true },
  });
  return response;
};

/**
 * Deletes a tag from the database.
 * @param {string} tagId - The ID of the tag to be deleted.
 * @returns {Promise<any>} - A promise that resolves to the response from the database.
 */
export const deleteTag = async (tagId: string) => {
  const response = await db.tag.delete({ where: { id: tagId } });
  return response;
};

/**
 * Upserts a contact in the database.
 * If the contact already exists, it updates the existing contact.
 * If the contact does not exist, it creates a new contact.
 *
 * @param contact - The contact data to be upserted.
 * @returns A promise that resolves to the upserted contact.
 */
export const upsertContact = async (
  contact: Prisma.ContactUncheckedCreateInput
) => {
  const response = await db.contact.upsert({
    where: { id: contact.id || v4() },
    update: contact,
    create: contact,
  });
  return response;
};

/**
 * Retrieves the funnels associated with a given subaccount ID.
 * @param subaccountId - The ID of the subaccount.
 * @returns A promise that resolves to an array of funnels.
 */
export const getFunnels = async (subacountId: string) => {
  const funnels = await db.funnel.findMany({
    where: { subAccountId: subacountId },
    include: { FunnelPages: true },
  });

  return funnels;
};

export const getFunnel = async (funnelId: string) => {
  const funnel = await db.funnel.findUnique({
    where: { id: funnelId },
    include: {
      FunnelPages: {
        orderBy: {
          order: "asc",
        },
      },
    },
  });

  return funnel;
};

/**
 * Updates the live products of a funnel.
 * @param products - The new live products to be assigned to the funnel.
 * @param funnelId - The ID of the funnel to update.
 * @returns A Promise that resolves to the updated data.
 */
export const updateFunnelProducts = async (
  products: string,
  funnelId: string
) => {
  const data = await db.funnel.update({
    where: { id: funnelId },
    data: { liveProducts: products },
  });
  return data;
};

/**
 * Upserts a funnel page into the database.
 *
 * @param subaccountId - The ID of the subaccount.
 * @param funnelPage - The funnel page object to upsert.
 * @param funnelId - The ID of the funnel.
 * @returns The response from the upsert operation.
 */
export const upsertFunnelPage = async (
  subaccountId: string,
  funnelPage: UpsertFunnelPage,
  funnelId: string
) => {
  if (!subaccountId || !funnelId) return;
  const response = await db.funnelPage.upsert({
    where: { id: funnelPage.id || "" },
    update: { ...funnelPage },
    create: {
      ...funnelPage,
      content: funnelPage.content
        ? funnelPage.content
        : JSON.stringify([
            {
              content: [],
              id: "__body",
              name: "Body",
              styles: { backgroundColor: "white" },
              type: "__body",
            },
          ]),
      funnelId,
    },
  });

  revalidatePath(`/subaccount/${subaccountId}/funnels/${funnelId}`, "page");
  return response;
};

/**
 * Deletes a funnel page from the database.
 * @param funnelPageId - The ID of the funnel page to delete.
 * @returns A Promise that resolves to the response from the database.
 */
export const deleteFunnelePage = async (funnelPageId: string) => {
  const response = await db.funnelPage.delete({ where: { id: funnelPageId } });

  return response;
};

/**
 * Retrieves the details of a funnel page from the database.
 * @param funnelPageId - The ID of the funnel page to retrieve.
 * @returns A promise that resolves to the response containing the funnel page details.
 */
export const getFunnelPageDetails = async (funnelPageId: string) => {
  const response = await db.funnelPage.findUnique({
    where: {
      id: funnelPageId,
    },
  });

  return response;
};

/**
 * Retrieves the domain content for a given subdomain name.
 * @param subDomainName - The name of the subdomain.
 * @returns A Promise that resolves to the domain content.
 */
export const getDomainContent = async (subDomainName: string) => {
  const response = await db.funnel.findUnique({
    where: {
      subDomainName,
    },
    include: { FunnelPages: true },
  });
  return response;
};

/**
 * Retrieves pipelines for a given subaccount ID.
 * @param subaccountId - The ID of the subaccount.
 * @returns A Promise that resolves to an array of pipelines.
 */
export const getPipelines = async (subaccountId: string) => {
  const response = await db.pipeline.findMany({
    where: { subAccountId: subaccountId },
    include: {
      Lane: {
        include: { Tickets: true },
      },
    },
  });
  return response;
};
