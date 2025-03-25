"use client";

import { OrganizationStub } from "@sdapps/models";
import sortBy from "lodash.sortby";
import {
  DataTable,
  DataTableColumn,
  DataTableSortStatus,
} from "mantine-datatable";
import { useEffect, useMemo, useState } from "react";

interface Row {
  readonly name: string;
}

export function OrganizationsTable(json: {
  organizations: readonly ReturnType<OrganizationStub["toJson"]>[];
}) {
  const { columns, rows: unsortedRows } = useMemo(() => {
    const organizations = json.organizations.flatMap((organization) =>
      OrganizationStub.fromJson(organization).toMaybe().toList(),
    );

    const columns: DataTableColumn<Row>[] = [
      {
        accessor: "name",
        sortable: true,
      },
    ];
    const rows: Row[] = [];
    for (const organization of organizations) {
      if (!organization.name.isJust()) {
        continue;
      }
      const row: Row = {
        name: organization.name.unsafeCoerce(),
      };
      rows.push(row);
    }
    return {
      columns,
      rows,
    };
  }, [json]);

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
