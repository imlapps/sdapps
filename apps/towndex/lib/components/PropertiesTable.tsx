import { Table, TableTbody, TableTd, TableTr } from "@mantine/core";
import { ReactNode } from "react";

export function PropertiesTable({
  properties,
}: { properties: readonly { label: string; value: ReactNode }[] }) {
  return (
    <Table withColumnBorders withRowBorders withTableBorder>
      <TableTbody>
        {properties.map((property) => (
          <TableTr key={property.label}>
            <TableTd>{property.label}</TableTd>
            <TableTd>{property.value}</TableTd>
          </TableTr>
        ))}
      </TableTbody>
    </Table>
  );
}
