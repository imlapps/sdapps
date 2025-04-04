"use client";

import { useHrefs } from "@/lib/hooks/useHrefs";
import { Anchor } from "@mantine/core";
import { PersonStub } from "@sdapps/models";
import sortBy from "lodash.sortby";
import {
  DataTable,
  DataTableColumn,
  DataTableSortStatus,
} from "mantine-datatable";
import { useEffect, useMemo, useState } from "react";

interface Row {
  readonly href: string;
  readonly jobTitle: string | null;
  readonly name: string;
}

export function PeopleTable(json: {
  people: readonly ReturnType<PersonStub["toJson"]>[];
}) {
  const hrefs = useHrefs();

  const { columns, rows: unsortedRows } = useMemo(() => {
    const people = json.people.flatMap((person) =>
      PersonStub.fromJson(person).toMaybe().toList(),
    );

    const columns: DataTableColumn<Row>[] = [
      {
        accessor: "name",
        render: (row) => <Anchor href={row.href}>{row.name}</Anchor>,
        sortable: true,
      },
    ];
    const rows: Row[] = [];
    for (const person of people) {
      if (!person.name.isJust()) {
        continue;
      }
      const row: Row = {
        href: hrefs.person(person),
        jobTitle: person.jobTitle.extractNullable(),
        name: person.name.unsafeCoerce(),
      };
      if (
        row.jobTitle &&
        !columns.some((column) => column.accessor === "jobTitle")
      ) {
        columns.push({
          accessor: "jobTitle",
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
