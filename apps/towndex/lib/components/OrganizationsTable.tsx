"use client";

import { useHrefs } from "@/lib/hooks/useHrefs";
import { Anchor } from "@mantine/core";
import { OrganizationStubStatic, compare, displayLabel } from "@sdapps/models";
import sortBy from "lodash.sortby";
import {
  DataTable,
  DataTableColumn,
  DataTableSortStatus,
} from "mantine-datatable";
import { useTranslations } from "next-intl";
import { useEffect, useMemo, useState } from "react";

interface Row {
  readonly href: string;
  readonly label: string;
}

export function OrganizationsTable(json: {
  organizations: readonly OrganizationStubStatic.Json[];
}) {
  const hrefs = useHrefs();
  const translations = useTranslations("OrganizationsTable");

  const { columns, rows: unsortedRows } = useMemo(() => {
    const organizations = json.organizations
      .flatMap((organization) =>
        OrganizationStubStatic.fromJson(organization).toMaybe().toList(),
      )
      .toSorted(compare);

    const columns: DataTableColumn<Row>[] = [
      {
        accessor: "label",
        render: (row) => <Anchor href={row.href}>{row.label}</Anchor>,
        title: translations("Name"),
        sortable: true,
      },
    ];
    const rows: Row[] = [];
    for (const organization of organizations) {
      const row: Row = {
        href: hrefs.organization(organization),
        label: displayLabel(organization),
      };
      rows.push(row);
    }
    return {
      columns,
      rows,
    };
  }, [hrefs, json, translations]);

  const [rows, setRows] = useState<Row[] | null>(null);

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Row>>({
    columnAccessor: "label",
    direction: "asc",
  });

  useEffect(() => {
    const rows = sortBy(unsortedRows, sortStatus.columnAccessor) as Row[];
    setRows(sortStatus.direction === "desc" ? rows.reverse() : rows);
  }, [sortStatus, unsortedRows]);

  if (rows === null) {
    return null;
  }

  return (
    <DataTable
      columns={columns}
      onSortStatusChange={setSortStatus}
      records={rows}
      sortStatus={sortStatus}
      withColumnBorders
      withTableBorder
    />
  );
}
