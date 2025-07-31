"use client";

import { AgentList } from "@/lib/components/AgentList";
import { useHrefs } from "@/lib/hooks/useHrefs";
import { Anchor, Text } from "@mantine/core";
import { AgentStub, Report, compare, displayLabel } from "@sdapps/models";
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
  readonly href: string;
  readonly label: string;
}

export function ReportsTable(json: {
  reports: readonly Report.Json[];
}) {
  const hrefs = useHrefs();

  const { columns, rows: unsortedRows } = useMemo(() => {
    const reports = json.reports
      .flatMap((report) => Report.fromJson(report).toMaybe().toList())
      .toSorted(compare);

    const columns: DataTableColumn<Row>[] = [
      {
        accessor: "label",
        render: (row) => <Anchor href={row.href}>{row.label}</Anchor>,
        sortable: true,
      },
    ];
    const rows: Row[] = [];
    for (const report of reports) {
      const row: Row = {
        authors: report.authors,
        description: report.description.extractNullable(),
        href: hrefs.report(report),
        label: displayLabel(report),
      };

      if (
        row.authors.length > 0 &&
        !columns.some((column) => column.accessor === "authors")
      ) {
        columns.push({
          accessor: "authors",
          render: (row) => (
            <AgentList agents={row.authors.toSorted(compare)} hrefs={hrefs} />
          ),
        });
      }

      if (
        row.description !== null &&
        !columns.some((column) => column.accessor === "description")
      ) {
        columns.push({
          accessor: "description",
          render: (row) => <Text>{row.description}</Text>,
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
      striped
      withColumnBorders
      withTableBorder
    />
  );
}
