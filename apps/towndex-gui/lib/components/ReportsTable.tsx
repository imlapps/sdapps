"use client";

import { AgentList } from "@/lib/components/AgentList";
import { useHrefs } from "@/lib/hooks/useHrefs";
import { AgentStub, Report } from "@sdapps/models";
import sortBy from "lodash.sortby";
import {
  DataTable,
  DataTableColumn,
  DataTableSortStatus,
} from "mantine-datatable";
import { useEffect, useMemo, useState } from "react";

interface Row {
  readonly authors: readonly AgentStub[];
  readonly description: string | null;
  readonly name: string;
}

export function ReportsTable(json: {
  reports: readonly ReturnType<Report["toJson"]>[];
}) {
  const hrefs = useHrefs();

  const { columns, rows: unsortedRows } = useMemo(() => {
    const reports = json.reports.flatMap((report) =>
      Report.fromJson(report).toMaybe().toList(),
    );

    const columns: DataTableColumn<Row>[] = [
      {
        accessor: "name",
        sortable: true,
      },
    ];
    const rows: Row[] = [];
    for (const report of reports) {
      if (!report.name.isJust()) {
        continue;
      }

      const row: Row = {
        authors: report.authors,
        description: report.description.extractNullable(),
        name: report.name.unsafeCoerce(),
      };

      if (
        row.authors.length > 0 &&
        !columns.some((column) => column.accessor === "authors")
      ) {
        columns.push({
          accessor: "authors",
          render: (row) => <AgentList agents={row.authors} hrefs={hrefs} />,
        });
      }

      if (
        row.description !== null &&
        !columns.some((column) => column.accessor === "description")
      ) {
        columns.push({
          accessor: "description",
          sortable: true,
        });
      }

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
      striped
      withColumnBorders
      withTableBorder
    />
  );
}
