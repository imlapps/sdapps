import {
  Organization,
  OrganizationStub,
  Person,
  PersonStub,
} from "./generated";

/**
 * Convert a model to its stub equivalent e.g., Organization to OrganizationStub.
 */
export function stubify(organization: Organization): OrganizationStub;
export function stubify(person: Person): PersonStub;
export function stubify(
  model: Organization | Person,
): OrganizationStub | PersonStub {
  switch (model.type) {
    case "Organization":
      return new OrganizationStub({
        identifier: model.identifier,
        name: model.name,
      });
    case "Person":
      return new PersonStub({
        identifier: model.identifier,
        jobTitle: model.jobTitle,
        name: model.name,
      });
  }
}
