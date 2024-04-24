"use client";
import { Badge } from "@/components/ui/badge";
import type { FunnelsForSubAccount } from "@/lib/types";
import type { ColumnDef, Row } from "@tanstack/react-table";
import { ExternalLink } from "lucide-react";
import Link from "next/link";
import {formatDate} from "@/lib/utils";


const renderNameCell = ({ row }: { row: Row<FunnelsForSubAccount> }) => (
    <Link
        className="flex gap-2 items-center"
        href={`/subaccount/${row.original.subAccountId}/funnels/${row.original.id}`}
    >
      {row.getValue("name")}
      <ExternalLink size={15} />
    </Link>
);

const renderUpdatedAtCell = ({ row }: { row: Row<FunnelsForSubAccount> }) => (
    <span className="text-muted-foreground">{formatDate(row.original.updatedAt)}</span>
);

const renderStatusCell = ({ row }: { row: Row<FunnelsForSubAccount> }) => {
  const status = row.original.published;
  return status ? (
      <Badge variant="default">Live - {row.original.subDomainName}</Badge>
  ) : (
      <Badge variant="secondary">Draft</Badge>
  );
};

export const columns: ColumnDef<FunnelsForSubAccount>[] = [
  {
    accessorKey: "name",
    header: "Name",
    cell: renderNameCell,
  },
  {
    accessorKey: "updatedAt",
    header: "Last Updated",
    cell: renderUpdatedAtCell,
  },
  {
    accessorKey: "published",
    header: "Status",
    cell: renderStatusCell,
  },
];
