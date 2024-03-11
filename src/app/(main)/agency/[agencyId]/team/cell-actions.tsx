import UserDetails from "@/components/forms/user-details";
import CustomModal from "@/components/global/custom-modal";
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
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useToast } from "@/components/ui/use-toast";
import { deleteUser } from "@/lib/queries";
import { UsersWithAgencySubAccountPermissionsSidebarOptions } from "@/lib/types";
import { useModal } from "@/providers/modal-provider";
import { Copy, Edit, MoreHorizontal, Trash } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useState } from "react";

interface CellActionsProps {
  rowData: UsersWithAgencySubAccountPermissionsSidebarOptions;
}

const CellActions: React.FC<CellActionsProps> = ({ rowData }) => {
  const { setOpen } = useModal();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  if (!rowData || !rowData.Agency) return null;

  const handleCopyEmail = async () => {
    await navigator.clipboard.writeText(rowData.email);
    toast({
      title: "Email Copied",
      description: "User email address has been copied to clipboard",
    });
  };

const handleEditDetails = async () => {
    if (!rowData || !rowData.Agency) return;
    setOpen(
        <CustomModal
            subheading="You can change permissions only when the user has an owned subaccount"
            title="Edit User Details"
        >        
            <UserDetails
                type="agency"
                id={rowData.Agency.id}
                subAccounts={rowData.Agency.SubAccount}
            />
        </CustomModal>
    );
};

  const handleDeleteUser = async () => {
    setLoading(true);
    await deleteUser(rowData.id);
    toast({
      title: "Deleted User",
      description:
        "The user has been deleted from this agency and no longer has access.",
    });
    setLoading(false);
    router.refresh();
  };

  return (
    <div>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Open actions menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Actions</DropdownMenuLabel>
          <DropdownMenuItem className="flex gap-2" onSelect={handleCopyEmail}>
            <Copy size={15} /> Copy Email
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem className="flex gap-2" onSelect={handleEditDetails}>
            <Edit size={15} /> Edit Details
          </DropdownMenuItem>
          {rowData.role !== "AGENCY_OWNER" && (
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <DropdownMenuItem className="flex gap-2">
                  <Trash size={15} /> Remove User
                </DropdownMenuItem>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete the
                  user and related data.
                </AlertDialogDescription>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    disabled={loading}
                    onClick={handleDeleteUser}
                  >
                    Delete
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};

export default CellActions;
