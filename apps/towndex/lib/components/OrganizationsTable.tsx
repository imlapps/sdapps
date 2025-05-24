"use client";

import { useHrefs } from "@/lib/hooks/useHrefs";
import { Anchor } from "@mantine/core";
import { OrganizationStub, compare } from "@sdapps/models";
import sortBy from "lodash.sortby";
import {
  DataTable,
  DataTableColumn,
  DataTableSortStatus,
} from "mantine-datatable";
import { useEffect, useMemo, useState } from "react";

interface Row {
  readonly href: string;
  readonly name: string;
}

export function OrganizationsTable(json: {
  organizations: readonly ReturnType<OrganizationStub["toJson"]>[];
}) {
  const hrefs = useHrefs();

  const { columns, rows: unsortedRows } = useMemo(() => {
    const organizations = json.organizations
      .flatMap((organization) =>
        OrganizationStub.fromJson(organization).toMaybe().toList(),
      )
      .toSorted(compare);

    const columns: DataTableColumn<Row>[] = [
      {
        accessor: "name",
        render: (row) => <Anchor href={row.href}>{row.name}</Anchor>,
        sortable: true,
      },
    ];
    const rows: Row[] = [];
    for (const organization of organizations) {
      if (!organization.name.isJust()) {
        continue;
      }
      const row: Row = {
        href: hrefs.organization(organization),
        name: organization.name.unsafeCoerce(),
      };
      rows.push(row);
    }
    return {
      columns,
      rows,
    };
  }, [hrefs, json]);

  const [rows, setRows] = useState<Row[] | null>(null);

  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Row>>({
    columnAccessor: "name",
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
