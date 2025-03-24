import en from "./en.json";

type EnMessages = typeof en;

declare global {
  interface IntlMessages extends EnMessages {}
}
