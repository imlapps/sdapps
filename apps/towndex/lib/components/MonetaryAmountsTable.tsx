import { Table, TableTbody, TableTd, TableTr, Text } from "@mantine/core";
import { Identifier } from "@sdapps/models";
import { Maybe } from "purify-ts";

export function MonetaryAmountsTable({
  monetaryAmounts,
}: {
  monetaryAmounts: readonly {
    readonly currency: Maybe<string>;
    readonly identifier: Identifier;
    readonly value: Maybe<number>;
  }[];
}) {
  const includeCurrency = monetaryAmounts.some((monetaryAmount) =>
    monetaryAmount.currency.isJust(),
  );

  return (
    <Table withColumnBorders withRowBorders withTableBorder>
      <TableTbody>
        {monetaryAmounts
          .filter((monetaryAmount) => monetaryAmount.value.isJust())
          .map((monetaryAmount) => (
            <TableTr key={Identifier.toString(monetaryAmount.identifier)}>
              <TableTd>
                <Text>{monetaryAmount.value.unsafeCoerce().toString()}</Text>
              </TableTd>
              {includeCurrency ? (
                <TableTd>
                  <Text>{monetaryAmount.currency.orDefault("")}</Text>
                </TableTd>
              ) : null}
            </TableTr>
          ))}
      </TableTbody>
    </Table>
  );
}
