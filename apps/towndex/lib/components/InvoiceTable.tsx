import { PropertiesTable } from "@/lib/components/PropertiesTable";
import {} from "@mantine/core";
import { $ObjectSet, Invoice, Order, displayLabel } from "@sdapps/models";
import { getTranslations } from "next-intl/server";
import { ReactNode } from "react";

export async function InvoiceTable({
  invoice,
  objectSet,
}: { invoice: Invoice; objectSet: $ObjectSet }) {
  const translations = await getTranslations("InvoiceTable");

  const properties: { label: string; value: ReactNode }[] = [];
  invoice.name.ifJust((name) => {
    properties.push({ label: translations("Name"), value: name });
  });
  invoice.description.ifJust((description) => {
    properties.push({ label: translations("Description"), value: description });
  });
  invoice.totalPaymentDue.ifJust((totalPaymentDue) => {
    properties.push({
      label: translations("Total"),
      value: displayLabel(totalPaymentDue),
    });
  });

  for (const orderStub of invoice.referencesOrder) {
    const order = (
      await objectSet.model<Order>({
        identifier: orderStub.identifier,
        type: "Order",
      })
    )
      .toMaybe()
      .extract();
    if (!order) {
      continue;
    }
    const partOfInvoiceStub = order.partOfInvoice.extract();
    if (!partOfInvoiceStub) {
      continue;
    }
    const partOfInvoice = (
      await objectSet.model<Invoice>({
        identifier: partOfInvoiceStub.identifier,
        type: "Invoice",
      })
    )
      .toMaybe()
      .extract();
    if (!partOfInvoice) {
      continue;
    }
    if (!partOfInvoice.totalPaymentDue.isJust()) {
      continue;
    }
    properties.push({
      label: `${translations("Item")}: ${displayLabel(order)}`,
      value: displayLabel(partOfInvoice.totalPaymentDue.unsafeCoerce()),
    });
  }

  return <PropertiesTable properties={properties} />;
}
