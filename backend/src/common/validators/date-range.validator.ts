import {
  registerDecorator,
  ValidationOptions,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

/**
 * Ensures a date string is today or in the future.
 * Usage: @IsFutureOrToday()
 */
@ValidatorConstraint({ name: 'IsFutureOrToday', async: false })
export class IsFutureOrTodayConstraint implements ValidatorConstraintInterface {
  validate(value: string): boolean {
    if (!value) return false;
    const date = new Date(value);
    if (isNaN(date.getTime())) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return date >= today;
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} must be today or a future date`;
  }
}

export function IsFutureOrToday(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsFutureOrTodayConstraint,
    });
  };
}

/**
 * Ensures the annotated end-date field is strictly after the peer start-date field.
 * Usage: @IsAfterDate('startDate')
 */
@ValidatorConstraint({ name: 'IsAfterDate', async: false })
export class IsAfterDateConstraint implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments): boolean {
    const [startDateProp] = args.constraints as string[];
    const obj = args.object as Record<string, string>;
    const startDate = obj[startDateProp];
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
    return end > start;
  }

  defaultMessage(args: ValidationArguments): string {
    const [startDateProp] = args.constraints as string[];
    return `${args.property} must be strictly after ${startDateProp}`;
  }
}

export function IsAfterDate(
  startDateProperty: string,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [startDateProperty],
      validator: IsAfterDateConstraint,
    });
  };
}

/**
 * Ensures two date fields span at least `minDays` calendar days.
 * Usage: @MinRentalDays('startDate', 1)
 */
@ValidatorConstraint({ name: 'MinRentalDays', async: false })
export class MinRentalDaysConstraint implements ValidatorConstraintInterface {
  validate(endDate: string, args: ValidationArguments): boolean {
    const [startDateProp, minDays] = args.constraints as [string, number];
    const obj = args.object as Record<string, string>;
    const startDate = obj[startDateProp];
    if (!startDate || !endDate) return false;
    const start = new Date(startDate);
    const end = new Date(endDate);
    if (isNaN(start.getTime()) || isNaN(end.getTime())) return false;
    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDays >= minDays;
  }

  defaultMessage(args: ValidationArguments): string {
    const [startDateProp, minDays] = args.constraints as [string, number];
    return `Rental duration must be at least ${minDays} day(s) (${args.property} vs ${startDateProp})`;
  }
}

export function MinRentalDays(
  startDateProperty: string,
  minDays = 1,
  validationOptions?: ValidationOptions,
) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName,
      options: validationOptions,
      constraints: [startDateProperty, minDays],
      validator: MinRentalDaysConstraint,
    });
  };
}
