export class DomainError extends Error {
  readonly code: string;
  constructor(code: string, message: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}

export class ForbiddenError extends DomainError {
  constructor(message = "Acesso não permitido para este tenant.") {
    super("FORBIDDEN", message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends DomainError {
  constructor(message = "Registro não encontrado.") {
    super("NOT_FOUND", message);
    this.name = "NotFoundError";
  }
}
