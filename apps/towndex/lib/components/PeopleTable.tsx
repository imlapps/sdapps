"use client";

import { useHrefs } from "@/lib/hooks/useHrefs";
import { Anchor } from "@mantine/core";
import { PersonStub, compare, displayLabel } from "@sdapps/models";
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

export function PeopleTable(json: {
  people: readonly ReturnType<PersonStub["toJson"]>[];
}) {
  const hrefs = useHrefs();
  const translations = useTranslations("PeopleTable");

  const { columns, rows: unsortedRows } = useMemo(() => {
    const people = json.people
      .flatMap((person) => PersonStub.fromJson(person).toMaybe().toList())
      .toSorted(compare);

    const columns: DataTableColumn<Row>[] = [
      {
        accessor: "label",
        render: (row) => <Anchor href={row.href}>{row.label}</Anchor>,
        sortable: true,
        title: translations("Name"),
      },
    ];
    const rows: Row[] = people.map((person) => ({
      href: hrefs.person(person),
      label: displayLabel(person),
    }));
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
      striped
      withColumnBorders
      withTableBorder
    />
  );
}
