"use client";
import { AgentAnchor } from "@/lib/components/AgentAnchor";
import { useHrefs } from "@/lib/hooks/useHrefs";
import { AgentStub, Message, compare } from "@sdapps/models";
import sortBy from "lodash.sortby";
import {
  DataTable,
  DataTableColumn,
  DataTableSortStatus,
} from "mantine-datatable";
import { useEffect, useMemo, useState } from "react";

interface Row {
  readonly description: string;
  readonly sender: AgentStub;
}

export function MessagesTable(json: {
  messages: readonly ReturnType<Message["toJson"]>[];
}) {
  const hrefs = useHrefs();

  const { columns, rows: unsortedRows } = useMemo(() => {
    const messages = json.messages
      .flatMap((message) => Message.fromJson(message).toMaybe().toList())
      .toSorted(compare);

    const columns: DataTableColumn<Row>[] = [
      {
        accessor: "description",
        sortable: true,
      },
      {
        accessor: "sender",
        render: (row) => <AgentAnchor agent={row.sender} hrefs={hrefs} />,
      },
    ];
    const rows: Row[] = [];
    for (const message of messages) {
      if (!message.description.isJust() || !message.sender.isJust()) {
        continue;
      }

      const row: Row = {
        description: message.description.unsafeCoerce(),
        sender: message.sender.unsafeCoerce(),
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
    columnAccessor: "description",
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
