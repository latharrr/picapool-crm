export class SheetsNotConfiguredError extends Error {
  constructor(message = "Google service account credentials are not configured.") {
    super(message);
    this.name = "SheetsNotConfiguredError";
  }
}

export class RecordNotFoundError extends Error {
  constructor(tabName: string, id: string) {
    super(`${tabName} record not found: ${id}`);
    this.name = "RecordNotFoundError";
  }
}
