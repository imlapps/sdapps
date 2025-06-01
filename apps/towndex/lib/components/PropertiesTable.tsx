import { Table, TableTbody, TableTd, TableTr, Text } from "@mantine/core";
import { ReactNode } from "react";

export function PropertiesTable({
  properties,
}: { properties: readonly { label: string; value: ReactNode }[] }) {
  return (
    <Table withColumnBorders withRowBorders withTableBorder>
      <TableTbody>
        {properties.map((property) => (
          <TableTr key={property.label}>
            <TableTd>
              <Text>{property.label}</Text>
            </TableTd>
            <TableTd>
              {typeof property.value === "object" ? (
                property.value
              ) : (
                <Text>{property.value}</Text>
              )}
            </TableTd>
          </TableTr>
        ))}
      </TableTbody>
    </Table>
  );
}
