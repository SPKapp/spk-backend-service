import { registerEnumType } from '@nestjs/graphql';

export enum RabbitStatus {
  Incoming = 'Incoming',
  InTreatment = 'InTreatment',
  Adoptable = 'Adoptable',
  Adopted = 'Adopted',
  Deceased = 'Deceased',
}

// eslint-disable-next-line @typescript-eslint/no-namespace
export class RabbitStatusHelper {
  static NotArrived = [RabbitStatus.Incoming];
  static isNotArrived(status: RabbitStatus): boolean {
    return this.NotArrived.includes(status);
  }

  static UnderCare = [RabbitStatus.InTreatment, RabbitStatus.Adoptable];
  static isUnderCare(status: RabbitStatus): boolean {
    return this.UnderCare.includes(status);
  }

  static Active = [
    RabbitStatus.Incoming,
    RabbitStatus.InTreatment,
    RabbitStatus.Adoptable,
  ];
  static isActive(status: RabbitStatus): boolean {
    return this.Active.includes(status);
  }

  static Archival = [RabbitStatus.Adopted, RabbitStatus.Deceased];
  static isArchival(status: RabbitStatus): boolean {
    return this.Archival.includes(status);
  }
}

export const valuesMap = {
  Incoming: { description: 'Rabbit is incoming' },
  InTretment: { description: 'Rabbit is in treatment' },
  Adoptable: { description: 'Rabbit is adoptable' },
  Adopted: { description: 'Rabbit is adopted - archival' },
  Deceased: { description: 'Rabbit is deceased - archival' },
};

registerEnumType(RabbitStatus, {
  name: 'RabbitStatus',
  description: 'Status of the rabbit',
  valuesMap: valuesMap,
});
