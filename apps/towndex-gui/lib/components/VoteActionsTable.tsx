"use client";

import { AgentList } from "@/lib/components/AgentList";
import { useHrefs } from "@/lib/hooks/useHrefs";
import { AgentStub, VoteAction } from "@sdapps/models";
import sortBy from "lodash.sortby";
import {
  DataTable,
  DataTableColumn,
  DataTableSortStatus,
} from "mantine-datatable";
import { useEffect, useMemo, useState } from "react";

interface Row {
  readonly agents: readonly AgentStub[];
  readonly description: string | null;
  readonly name: string;
  readonly participants: readonly AgentStub[];
}

export function VoteActionsTable(json: {
  voteActions: readonly ReturnType<VoteAction["toJson"]>[];
}) {
  const hrefs = useHrefs();

  const { columns, rows: unsortedRows } = useMemo(() => {
    const voteActions = json.voteActions.flatMap((voteAction) =>
      VoteAction.fromJson(voteAction).toMaybe().toList(),
    );

    const columns: DataTableColumn<Row>[] = [
      {
        accessor: "name",
        sortable: true,
      },
    ];
    const rows: Row[] = [];
    for (const voteAction of voteActions) {
      if (!voteAction.name.isJust()) {
        continue;
      }

      const row: Row = {
        agents: voteAction.agents,
        description: voteAction.description.extractNullable(),
        name: voteAction.name.unsafeCoerce(),
        participants: voteAction.participants,
      };

      if (
        row.agents.length > 0 &&
        !columns.some((column) => column.accessor === "agents")
      ) {
        columns.push({
          accessor: "agents",
          render: (row) => <AgentList agents={row.agents} hrefs={hrefs} />,
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

      if (
        row.participants.length > 0 &&
        !columns.some((column) => column.accessor === "participants")
      ) {
        columns.push({
          accessor: "participants",
          render: (row) => (
            <AgentList agents={row.participants} hrefs={hrefs} />
          ),
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
