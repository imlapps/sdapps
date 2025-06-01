import {
  Table,
  TableTbody,
  TableTd,
  TableTh,
  TableThead,
  TableTr,
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
            {includeName ? <TableTh>{translations("Name")}</TableTh> : null}
            <TableTh>{translations("Value")}</TableTh>
            {includeUnitText ? <TableTh>{translations("Unit")}</TableTh> : null}
          </TableTr>
        ) : null}
      </TableThead>
      <TableTbody>
        {quantitativeValues
          .filter((quantitativeValue) => quantitativeValue.value.isJust())
          .map((quantitativeValue) => (
            <TableTr key={Identifier.toString(quantitativeValue.identifier)}>
              {includeName ? (
                <TableTd>{quantitativeValue.name.orDefault("")}</TableTd>
              ) : null}
              <TableTd>
                {quantitativeValue.value.unsafeCoerce().toString()}
              </TableTd>
              {includeUnitText ? (
                <TableTd>{quantitativeValue.unitText.orDefault("")}</TableTd>
              ) : null}
            </TableTr>
          ))}
      </TableTbody>
    </Table>
  );
}
