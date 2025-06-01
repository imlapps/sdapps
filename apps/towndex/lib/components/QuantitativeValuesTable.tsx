import {
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
  Text,
} from "@mantine/core";
import { Identifier } from "@sdapps/models";
import { getTranslations } from "next-intl/server";
import { Maybe } from "purify-ts";

export async function QuantitativeValuesTable({
  quantitativeValues,
}: {
  quantitativeValues: readonly {
    readonly identifier: Identifier;
    readonly name: Maybe<string>;
    readonly unitText: Maybe<string>;
    readonly value: Maybe<number>;
  }[];
}) {
  const includeName = quantitativeValues.some((quantitativeValue) =>
    quantitativeValue.name.isJust(),
  );
  const includeUnitText = quantitativeValues.some((quantitativeValues) =>
    quantitativeValues.unitText.isJust(),
  );
  const translations = await getTranslations("QuantitativeValuesTable");

  return (
    <Table withColumnBorders withRowBorders withTableBorder>
      <TableThead>
        {includeName || includeUnitText ? (
          <TableTr>
            {includeName ? (
              <TableTh>
                <Text>{translations("Name")}</Text>
              </TableTh>
            ) : null}
            <TableTh>
              <Text>{translations("Value")}</Text>
            </TableTh>
            {includeUnitText ? (
              <TableTh>
                <Text>{translations("Unit")}</Text>
              </TableTh>
            ) : null}
          </TableTr>
        ) : null}
      </TableThead>
      <TableTbody>
        {quantitativeValues
          .filter((quantitativeValue) => quantitativeValue.value.isJust())
          .map((quantitativeValue) => (
            <TableTr key={Identifier.toString(quantitativeValue.identifier)}>
              {includeName ? (
                <TableTd>
                  <Text>{quantitativeValue.name.orDefault("")}</Text>
                </TableTd>
              ) : null}
              <TableTd>
                <Text>{quantitativeValue.value.unsafeCoerce().toString()}</Text>
              </TableTd>
              {includeUnitText ? (
                <TableTd>
                  <Text>{quantitativeValue.unitText.orDefault("")}</Text>
                </TableTd>
              ) : null}
            </TableTr>
          ))}
      </TableTbody>
    </Table>
  );
}
