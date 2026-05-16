export abstract class PreflightException extends Error {
  readonly code: string = 'PREFLIGHT_ERROR';
  readonly httpStatus: number = 500;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class BadRequestException extends PreflightException {
  override readonly code = 'BAD_REQUEST';
  override readonly httpStatus = 400;
}

export class InvalidCampaignException extends PreflightException {
  override readonly code = 'INVALID_CAMPAIGN';
  override readonly httpStatus = 400;
}

export class InvalidAmountException extends PreflightException {
  override readonly code = 'INVALID_AMOUNT';
  override readonly httpStatus = 400;
}

export class UnprocessableEntityException extends PreflightException {
  override readonly code = 'UNPROCESSABLE_ENTITY';
  override readonly httpStatus = 422;
}

export class NotFoundException extends PreflightException {
  override readonly code: string = 'NOT_FOUND';
  override readonly httpStatus = 404;
}

export class CampaignNotFoundException extends NotFoundException {
  override readonly code: string = 'CAMPAIGN_NOT_FOUND';
}

export class RunNotFoundException extends NotFoundException {
  override readonly code: string = 'RUN_NOT_FOUND';
}

export class ConflictException extends PreflightException {
  override readonly code: string = 'CONFLICT';
  override readonly httpStatus = 409;
}

export class IdempotencyConflictException extends ConflictException {
  override readonly code: string = 'IDEMPOTENCY_CONFLICT';
}

export class ForbiddenException extends PreflightException {
  override readonly code = 'FORBIDDEN';
  override readonly httpStatus = 403;
}

export class SystemException extends PreflightException {
  override readonly code = 'SYSTEM_ERROR';
  override readonly httpStatus = 500;
}

export class NotReadyException extends PreflightException {
  override readonly code = 'NOT_READY';
  override readonly httpStatus = 503;
}

export class NoHandlerException extends PreflightException {
  override readonly code = 'NO_HANDLER';
  override readonly httpStatus = 500;
}

export function domainRequire(
  condition: boolean,
  makeException: () => PreflightException
): asserts condition {
  if (!condition) throw makeException();
}
