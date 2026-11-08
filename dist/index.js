#!/usr/bin/env node

// apps/mcp/dist/index.js
import { serveStdio } from "@modelcontextprotocol/server/stdio";

// packages/sdk/dist/errors.js
var ApiError = class extends Error {
  status;
  code;
  requestId;
  problem;
  constructor(status, problem, fallback) {
    super(problem?.detail ?? problem?.title ?? fallback ?? `\u0417\u0430\u043F\u0440\u043E\u0441 \u0437\u0430\u0432\u0435\u0440\u0448\u0438\u043B\u0441\u044F \u0441 \u043E\u0448\u0438\u0431\u043A\u043E\u0439 ${status}`);
    this.name = "ApiError";
    this.status = status;
    this.code = problem?.code;
    this.requestId = problem?.requestId;
    this.problem = problem;
  }
  /** Ошибка 401 — токен отсутствует, просрочен или отозван. */
  get isUnauthorized() {
    return this.status === 401;
  }
  /** Ошибка 409 при повторе с тем же `Idempotency-Key` (этап A15.1). */
  get isIdempotencyConflict() {
    return this.status === 409 && (this.code === "IDEMPOTENCY_KEY_REUSED" || this.code === "IDEMPOTENCY_IN_PROGRESS");
  }
};

// packages/sdk/dist/generated/operations.js
var OPERATIONS = {
  acceptInvitation: { "operationId": "acceptInvitation", "method": "post", "path": "/api/v1/auth/invitations/{token}/accept", "tag": "auth", "summary": "\u0410\u043A\u0442\u0438\u0432\u0430\u0446\u0438\u044F \u043F\u0440\u0438\u0433\u043B\u0430\u0448\u0451\u043D\u043D\u043E\u0433\u043E \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F", "idempotent": false },
  addNoteLinks: { "operationId": "addNoteLinks", "method": "post", "path": "/api/v1/notes/{id}/links", "tag": "notes", "summary": "\u041F\u0440\u0438\u0432\u044F\u0437\u0430\u0442\u044C \u0437\u0430\u043C\u0435\u0442\u043A\u0443 \u043A \u0441\u0443\u0449\u043D\u043E\u0441\u0442\u044F\u043C", "idempotent": false },
  applyDataImport: { "operationId": "applyDataImport", "method": "post", "path": "/api/v1/data-imports/{id}/apply", "tag": "data-imports", "summary": "\u041F\u0440\u0438\u043C\u0435\u043D\u0438\u0442\u044C \u0438\u043C\u043F\u043E\u0440\u0442: \u043E\u0434\u043D\u0430 \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u044F, \u043A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u044B \u043F\u0435\u0440\u0435\u0441\u0447\u0438\u0442\u044B\u0432\u0430\u044E\u0442\u0441\u044F", "idempotent": false },
  archiveContract: { "operationId": "archiveContract", "method": "delete", "path": "/api/v1/contracts/{id}", "tag": "contracts", "summary": "\u0410\u0440\u0445\u0438\u0432 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430", "idempotent": false },
  archiveCounterparty: { "operationId": "archiveCounterparty", "method": "delete", "path": "/api/v1/counterparties/{id}", "tag": "counterparties", "summary": "\u0410\u0440\u0445\u0438\u0432 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430", "idempotent": false },
  archiveOrganization: { "operationId": "archiveOrganization", "method": "delete", "path": "/api/v1/organizations/{id}", "tag": "organizations", "summary": "\u0410\u0440\u0445\u0438\u0432 (\u0431\u0435\u0437 \u0443\u0434\u0430\u043B\u0435\u043D\u0438\u044F \u0434\u0430\u043D\u043D\u044B\u0445)", "idempotent": false },
  archiveProduct: { "operationId": "archiveProduct", "method": "delete", "path": "/api/v1/products/{id}", "tag": "products", "summary": "\u0410\u0440\u0445\u0438\u0432\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u043E\u0437\u0438\u0446\u0438\u044E", "idempotent": false },
  archiveTemplate: { "operationId": "archiveTemplate", "method": "delete", "path": "/api/v1/templates/{id}", "tag": "templates", "summary": "\u0410\u0440\u0445\u0438\u0432 \u0448\u0430\u0431\u043B\u043E\u043D\u0430 (\u043D\u0435 \u0431\u0430\u0437\u043E\u0432\u044B\u0439)", "idempotent": false },
  assignTemplate: { "operationId": "assignTemplate", "method": "post", "path": "/api/v1/templates/{id}/assign", "tag": "templates", "summary": "\u041D\u0430\u0437\u043D\u0430\u0447\u0438\u0442\u044C \u0448\u0430\u0431\u043B\u043E\u043D \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 \u0438\u043B\u0438 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0443", "idempotent": false },
  blockUser: { "operationId": "blockUser", "method": "post", "path": "/api/v1/users/{id}/block", "tag": "users", "summary": "\u0417\u0430\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F (admin)", "idempotent": false },
  cancelDocument: { "operationId": "cancelDocument", "method": "post", "path": "/api/v1/documents/{id}/cancel", "tag": "documents", "summary": "\u0410\u043D\u043D\u0443\u043B\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442", "idempotent": false },
  changePassword: { "operationId": "changePassword", "method": "post", "path": "/api/v1/auth/password/change", "tag": "auth", "summary": "\u0421\u043C\u0435\u043D\u0430 \u0441\u0432\u043E\u0435\u0433\u043E \u043F\u0430\u0440\u043E\u043B\u044F", "idempotent": false },
  checkCounterpartyDuplicates: { "operationId": "checkCounterpartyDuplicates", "method": "post", "path": "/api/v1/counterparties/check-duplicates", "tag": "counterparties", "summary": "\u041A\u0430\u043D\u0434\u0438\u0434\u0430\u0442\u044B \u0432 \u0434\u0443\u0431\u043B\u0438 \u043F\u043E \u0418\u041D\u041D", "idempotent": false },
  closeNote: { "operationId": "closeNote", "method": "post", "path": "/api/v1/notes/{id}/close", "tag": "notes", "summary": "\u0417\u0430\u043A\u0440\u044B\u0442\u044C \u0437\u0430\u043C\u0435\u0442\u043A\u0443", "idempotent": false },
  createActFromInvoice: { "operationId": "createActFromInvoice", "method": "post", "path": "/api/v1/documents/{id}/acts", "tag": "documents", "summary": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0430\u043A\u0442 \u043F\u043E \u0441\u0447\u0451\u0442\u0443", "idempotent": false },
  createBankAccount: { "operationId": "createBankAccount", "method": "post", "path": "/api/v1/organizations/{id}/bank-accounts", "tag": "organizations", "summary": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0431\u0430\u043D\u043A\u043E\u0432\u0441\u043A\u0438\u0439 \u0441\u0447\u0451\u0442", "idempotent": false },
  createContract: { "operationId": "createContract", "method": "post", "path": "/api/v1/contracts", "tag": "contracts", "summary": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0434\u043E\u0433\u043E\u0432\u043E\u0440", "idempotent": false },
  createCounterparty: { "operationId": "createCounterparty", "method": "post", "path": "/api/v1/counterparties", "tag": "counterparties", "summary": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430", "idempotent": false },
  createCounterpartyContact: { "operationId": "createCounterpartyContact", "method": "post", "path": "/api/v1/counterparties/{id}/contacts", "tag": "counterparties", "summary": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043A\u043E\u043D\u0442\u0430\u043A\u0442", "idempotent": false },
  createDataExport: { "operationId": "createDataExport", "method": "post", "path": "/api/v1/data-exports", "tag": "data-exports", "summary": "\u041F\u0430\u043A\u0435\u0442 \u043F\u0435\u0440\u0435\u043D\u043E\u0441\u0430: \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F/\u0441\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A\u0438/\u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B (JSON/ZIP)", "idempotent": false },
  createDocument: { "operationId": "createDocument", "method": "post", "path": "/api/v1/documents", "tag": "documents", "summary": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A", "idempotent": false },
  createDocumentPdfLink: { "operationId": "createDocumentPdfLink", "method": "get", "path": "/api/v1/documents/{id}/pdf-link", "tag": "documents", "summary": "\u041A\u043E\u0440\u043E\u0442\u043A\u043E\u0436\u0438\u0432\u0443\u0449\u0430\u044F \u0441\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 PDF", "idempotent": true },
  createDocumentRevision: { "operationId": "createDocumentRevision", "method": "post", "path": "/api/v1/documents/{id}/revisions", "tag": "documents", "summary": "\u041D\u043E\u0432\u0430\u044F \u0440\u0435\u0432\u0438\u0437\u0438\u044F \u0432\u044B\u0434\u0430\u043D\u043D\u043E\u0433\u043E", "idempotent": false },
  createInvoiceFromActs: { "operationId": "createInvoiceFromActs", "method": "post", "path": "/api/v1/documents/{id}/invoice", "tag": "documents", "summary": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u0447\u0451\u0442 \u0438\u0437 \u0430\u043A\u0442\u0430 (\u0430\u043A\u0442 \u0440\u0430\u043D\u044C\u0448\u0435 \u0441\u0447\u0451\u0442\u0430) \u0438 \u0432\u043A\u043B\u044E\u0447\u0438\u0442\u044C \u0432\u0441\u0435 \u0430\u043A\u0442\u044B \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430", "idempotent": false },
  createNote: { "operationId": "createNote", "method": "post", "path": "/api/v1/notes", "tag": "notes", "summary": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0437\u0430\u043C\u0435\u0442\u043A\u0443 (Markdown)", "idempotent": false },
  createOrganization: { "operationId": "createOrganization", "method": "post", "path": "/api/v1/organizations", "tag": "organizations", "summary": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044E", "idempotent": false },
  createPayment: { "operationId": "createPayment", "method": "post", "path": "/api/v1/payments", "tag": "payments", "summary": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043E\u043F\u043B\u0430\u0442\u0443: \u043F\u0435\u0440\u0435\u0441\u0447\u0438\u0442\u044B\u0432\u0430\u0435\u0442 \u0441\u0442\u0430\u0442\u0443\u0441 \u0438 \u043E\u0441\u0442\u0430\u0442\u043E\u043A \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430", "idempotent": false },
  createPersonalToken: { "operationId": "createPersonalToken", "method": "post", "path": "/api/v1/tokens/personal", "tag": "tokens", "summary": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C personal-\u0442\u043E\u043A\u0435\u043D (\u043D\u0435 \u0448\u0438\u0440\u0435 \u043F\u0440\u0430\u0432 \u0440\u043E\u043B\u0438)", "idempotent": false },
  createProduct: { "operationId": "createProduct", "method": "post", "path": "/api/v1/products", "tag": "products", "summary": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u043E\u0437\u0438\u0446\u0438\u044E \u043D\u043E\u043C\u0435\u043D\u043A\u043B\u0430\u0442\u0443\u0440\u044B", "idempotent": false },
  createReportExport: { "operationId": "createReportExport", "method": "post", "path": "/api/v1/reports/export", "tag": "reports", "summary": "\u0410\u0441\u0438\u043D\u0445\u0440\u043E\u043D\u043D\u044B\u0439 \u044D\u043A\u0441\u043F\u043E\u0440\u0442 \u043E\u0442\u0447\u0451\u0442\u0430 (XLSX/CSV/JSON) \u0447\u0435\u0440\u0435\u0437 pg-boss", "idempotent": false },
  createShare: { "operationId": "createShare", "method": "post", "path": "/api/v1/shares", "tag": "shares", "summary": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443 \u043D\u0430 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B (URL \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437)", "idempotent": false },
  createSignatory: { "operationId": "createSignatory", "method": "post", "path": "/api/v1/organizations/{id}/signatories", "tag": "organizations", "summary": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u043E\u0434\u043F\u0438\u0441\u0430\u043D\u0442\u0430", "idempotent": false },
  createTemplate: { "operationId": "createTemplate", "method": "post", "path": "/api/v1/templates", "tag": "templates", "summary": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0448\u0430\u0431\u043B\u043E\u043D (\u043A\u043E\u043F\u0438\u044F \u0431\u0430\u0437\u043E\u0432\u043E\u0433\u043E)", "idempotent": false },
  createTemplateVersion: { "operationId": "createTemplateVersion", "method": "post", "path": "/api/v1/templates/{id}/versions", "tag": "templates", "summary": "\u041D\u043E\u0432\u0430\u044F \u0447\u0435\u0440\u043D\u043E\u0432\u0430\u044F \u0432\u0435\u0440\u0441\u0438\u044F", "idempotent": false },
  createToken: { "operationId": "createToken", "method": "post", "path": "/api/v1/tokens", "tag": "tokens", "summary": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0442\u043E\u043A\u0435\u043D (admin), \u0441\u0435\u043A\u0440\u0435\u0442 \u2014 \u043E\u0434\u0438\u043D \u0440\u0430\u0437", "idempotent": false },
  createUnit: { "operationId": "createUnit", "method": "post", "path": "/api/v1/units", "tag": "units", "summary": "\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u0435\u0434\u0438\u043D\u0438\u0446\u0443 (admin)", "idempotent": false },
  createUser: { "operationId": "createUser", "method": "post", "path": "/api/v1/users", "tag": "users", "summary": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F (admin)", "idempotent": false },
  createWebhook: { "operationId": "createWebhook", "method": "post", "path": "/api/v1/webhooks", "tag": "webhooks", "summary": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u043F\u043E\u0434\u043F\u0438\u0441\u0447\u0438\u043A\u0430 (\u0441\u0435\u043A\u0440\u0435\u0442 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u043E\u0434\u0438\u043D \u0440\u0430\u0437)", "idempotent": false },
  deleteBankAccount: { "operationId": "deleteBankAccount", "method": "delete", "path": "/api/v1/organizations/{id}/bank-accounts/{accountId}", "tag": "organizations", "summary": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0431\u0430\u043D\u043A\u043E\u0432\u0441\u043A\u0438\u0439 \u0441\u0447\u0451\u0442", "idempotent": false },
  deleteContractFile: { "operationId": "deleteContractFile", "method": "delete", "path": "/api/v1/contracts/{id}/files/{assetId}", "tag": "contracts", "summary": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0441\u043A\u0430\u043D \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430", "idempotent": false },
  deleteCounterpartyContact: { "operationId": "deleteCounterpartyContact", "method": "delete", "path": "/api/v1/counterparties/{id}/contacts/{contactId}", "tag": "counterparties", "summary": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043A\u043E\u043D\u0442\u0430\u043A\u0442", "idempotent": false },
  deleteDocument: { "operationId": "deleteDocument", "method": "delete", "path": "/api/v1/documents/{id}", "tag": "documents", "summary": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A", "idempotent": false },
  deleteNote: { "operationId": "deleteNote", "method": "delete", "path": "/api/v1/notes/{id}", "tag": "notes", "summary": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0437\u0430\u043C\u0435\u0442\u043A\u0443 (\u0444\u0438\u0437\u0438\u0447\u0435\u0441\u043A\u0438)", "idempotent": false },
  deletePayment: { "operationId": "deletePayment", "method": "delete", "path": "/api/v1/payments/{id}", "tag": "payments", "summary": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043E\u043F\u043B\u0430\u0442\u0443 \u0438 \u043E\u0442\u043A\u0430\u0442\u0438\u0442\u044C \u0441\u0442\u0430\u0442\u0443\u0441", "idempotent": false },
  deleteSignatory: { "operationId": "deleteSignatory", "method": "delete", "path": "/api/v1/organizations/{id}/signatories/{signatoryId}", "tag": "organizations", "summary": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043F\u043E\u0434\u043F\u0438\u0441\u0430\u043D\u0442\u0430", "idempotent": false },
  deleteUnit: { "operationId": "deleteUnit", "method": "delete", "path": "/api/v1/units/{code}", "tag": "units", "summary": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u0435\u0434\u0438\u043D\u0438\u0446\u0443 (admin)", "idempotent": false },
  deleteUser: { "operationId": "deleteUser", "method": "delete", "path": "/api/v1/users/{id}", "tag": "users", "summary": "Soft delete \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F (admin)", "idempotent": false },
  deleteWebhook: { "operationId": "deleteWebhook", "method": "delete", "path": "/api/v1/webhooks/{id}", "tag": "webhooks", "summary": "\u0423\u0434\u0430\u043B\u0438\u0442\u044C \u043F\u043E\u0434\u043F\u0438\u0441\u0447\u0438\u043A\u0430 \u0432\u043C\u0435\u0441\u0442\u0435 \u0441 \u0436\u0443\u0440\u043D\u0430\u043B\u043E\u043C", "idempotent": false },
  downloadDataExport: { "operationId": "downloadDataExport", "method": "get", "path": "/api/v1/data-exports/{id}/download", "tag": "data-exports", "summary": "\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u0433\u043E\u0442\u043E\u0432\u044B\u0439 \u043F\u0430\u043A\u0435\u0442", "idempotent": true },
  downloadDocumentPdf: { "operationId": "downloadDocumentPdf", "method": "get", "path": "/api/v1/documents/{id}/pdf", "tag": "documents", "summary": "PDF \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430 (\u043F\u0435\u0447\u0430\u0442\u044C, \u043F\u043E\u0434\u043F\u0438\u0441\u044C, \u0432\u043E\u0434\u044F\u043D\u043E\u0439 \u0437\u043D\u0430\u043A)", "idempotent": true },
  downloadFile: { "operationId": "downloadFile", "method": "get", "path": "/api/v1/files/{versionId}", "tag": "files", "summary": "\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u0444\u0430\u0439\u043B \u0432\u0435\u0440\u0441\u0438\u0438 \u0430\u0441\u0441\u0435\u0442\u0430", "idempotent": true },
  downloadReportExport: { "operationId": "downloadReportExport", "method": "get", "path": "/api/v1/reports/exports/{id}/download", "tag": "reports", "summary": "\u0421\u043A\u0430\u0447\u0430\u0442\u044C \u0433\u043E\u0442\u043E\u0432\u044B\u0439 \u044D\u043A\u0441\u043F\u043E\u0440\u0442", "idempotent": true },
  downloadSharedDocumentPdf: { "operationId": "downloadSharedDocumentPdf", "method": "get", "path": "/api/v1/documents/shared/{token}", "tag": "documents", "summary": "PDF \u043F\u043E \u043A\u043E\u0440\u043E\u0442\u043A\u043E\u0436\u0438\u0432\u0443\u0449\u0435\u0439 \u043F\u043E\u0434\u043F\u0438\u0441\u0430\u043D\u043D\u043E\u0439 \u0441\u0441\u044B\u043B\u043A\u0435", "idempotent": true },
  downloadShareDocumentPdf: { "operationId": "downloadShareDocumentPdf", "method": "get", "path": "/s/{token}/documents/{documentId}/pdf", "tag": "shares-public", "summary": "PDF \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430 \u0441\u0441\u044B\u043B\u043A\u0438", "idempotent": true },
  duplicateDocument: { "operationId": "duplicateDocument", "method": "post", "path": "/api/v1/documents/{id}/duplicate", "tag": "documents", "summary": "\u041A\u043E\u043F\u0438\u044F \u0432 \u043D\u043E\u0432\u044B\u0439 \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A", "idempotent": false },
  duplicateTemplate: { "operationId": "duplicateTemplate", "method": "post", "path": "/api/v1/templates/{id}/duplicate", "tag": "templates", "summary": "\u041A\u043E\u043F\u0438\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u0432 \u043A\u0430\u0431\u0438\u043D\u0435\u0442\u0435", "idempotent": false },
  exportAudit: { "operationId": "exportAudit", "method": "get", "path": "/api/v1/audit/export", "tag": "audit", "summary": "\u042D\u043A\u0441\u043F\u043E\u0440\u0442 \u0430\u0443\u0434\u0438\u0442\u0430: CSV (`;`, BOM) \u0438\u043B\u0438 JSON (admin)", "idempotent": true },
  forgotPassword: { "operationId": "forgotPassword", "method": "post", "path": "/api/v1/auth/password/forgot", "tag": "auth", "summary": "\u0417\u0430\u043F\u0440\u043E\u0441 \u0441\u0431\u0440\u043E\u0441\u0430 \u043F\u0430\u0440\u043E\u043B\u044F (\u0432\u0441\u0435\u0433\u0434\u0430 202, \u043F\u0438\u0441\u044C\u043C\u043E \u2014 \u0444\u0430\u0437\u0430 2)", "idempotent": false },
  getAuditEntry: { "operationId": "getAuditEntry", "method": "get", "path": "/api/v1/audit/{id}", "tag": "audit", "summary": "\u0417\u0430\u043F\u0438\u0441\u044C \u0430\u0443\u0434\u0438\u0442\u0430 \u0441 diff (admin)", "idempotent": true },
  getContract: { "operationId": "getContract", "method": "get", "path": "/api/v1/contracts/{id}", "tag": "contracts", "summary": "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430", "idempotent": true },
  getCounterparty: { "operationId": "getCounterparty", "method": "get", "path": "/api/v1/counterparties/{id}", "tag": "counterparties", "summary": "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430 \u0441 \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u0430\u043C\u0438", "idempotent": true },
  getCounterpartyBalance: { "operationId": "getCounterpartyBalance", "method": "get", "path": "/api/v1/counterparties/{id}/balance", "tag": "counterparties", "summary": "\u0421\u0430\u043B\u044C\u0434\u043E \u043D\u0430 \u0434\u0430\u0442\u0443", "idempotent": true },
  getCounterpartySummary: { "operationId": "getCounterpartySummary", "method": "get", "path": "/api/v1/counterparties/{id}/summary", "tag": "counterparties", "summary": "\u0421\u0432\u043E\u0434\u043A\u0430 \u043F\u043E \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0443", "idempotent": true },
  getDataExport: { "operationId": "getDataExport", "method": "get", "path": "/api/v1/data-exports/{id}", "tag": "data-exports", "summary": "\u0421\u0442\u0430\u0442\u0443\u0441 \u043F\u0430\u043A\u0435\u0442\u0430 \u043F\u0435\u0440\u0435\u043D\u043E\u0441\u0430", "idempotent": true },
  getDataImport: { "operationId": "getDataImport", "method": "get", "path": "/api/v1/data-imports/{id}", "tag": "data-imports", "summary": "\u0421\u0442\u0430\u0442\u0443\u0441 \u0438\u043C\u043F\u043E\u0440\u0442\u0430 \u0438 \u043E\u0442\u0447\u0451\u0442 \u043F\u043E \u0441\u0442\u0440\u043E\u043A\u0430\u043C", "idempotent": true },
  getDocument: { "operationId": "getDocument", "method": "get", "path": "/api/v1/documents/{id}", "tag": "documents", "summary": "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u0441 \u043F\u043E\u0437\u0438\u0446\u0438\u044F\u043C\u0438", "idempotent": true },
  getDocumentHtml: { "operationId": "getDocumentHtml", "method": "get", "path": "/api/v1/documents/{id}/html", "tag": "documents", "summary": "HTML \u0434\u043B\u044F \u043F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u0430", "idempotent": true },
  getDocumentVersion: { "operationId": "getDocumentVersion", "method": "get", "path": "/api/v1/documents/{id}/versions/{revision}", "tag": "documents", "summary": "\u0412\u0435\u0440\u0441\u0438\u044F \u0446\u0435\u043B\u0438\u043A\u043E\u043C", "idempotent": true },
  getEffectiveSettings: { "operationId": "getEffectiveSettings", "method": "get", "path": "/api/v1/settings", "tag": "settings", "summary": "\u042D\u0444\u0444\u0435\u043A\u0442\u0438\u0432\u043D\u044B\u0435 \u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044F \u0434\u043B\u044F \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442\u0430", "idempotent": true },
  getMe: { "operationId": "getMe", "method": "get", "path": "/api/v1/auth/me", "tag": "auth", "summary": "\u0422\u0435\u043A\u0443\u0449\u0438\u0439 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C, \u0440\u043E\u043B\u044C \u0438 \u043F\u0440\u0430\u0432\u0430", "idempotent": true },
  getNote: { "operationId": "getNote", "method": "get", "path": "/api/v1/notes/{id}", "tag": "notes", "summary": "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u0437\u0430\u043C\u0435\u0442\u043A\u0438 \u0441 \u043F\u0440\u0438\u0432\u044F\u0437\u043A\u0430\u043C\u0438", "idempotent": true },
  getNotesCalendar: { "operationId": "getNotesCalendar", "method": "get", "path": "/api/v1/notes/calendar", "tag": "notes", "summary": "\u0421\u043E\u0431\u044B\u0442\u0438\u044F \u043A\u0430\u043B\u0435\u043D\u0434\u0430\u0440\u044F \u043F\u043E \u0434\u0435\u0434\u043B\u0430\u0439\u043D\u0430\u043C \u0438 \u043D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u044F\u043C", "idempotent": true },
  getOrganization: { "operationId": "getOrganization", "method": "get", "path": "/api/v1/organizations/{id}", "tag": "organizations", "summary": "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438", "idempotent": true },
  getOrganizationEffectiveSettings: { "operationId": "getOrganizationEffectiveSettings", "method": "get", "path": "/api/v1/organizations/{id}/effective-settings", "tag": "organizations", "summary": "\u042D\u0444\u0444\u0435\u043A\u0442\u0438\u0432\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438", "idempotent": true },
  getPayment: { "operationId": "getPayment", "method": "get", "path": "/api/v1/payments/{id}", "tag": "payments", "summary": "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u043E\u043F\u043B\u0430\u0442\u044B", "idempotent": true },
  getProduct: { "operationId": "getProduct", "method": "get", "path": "/api/v1/products/{id}", "tag": "products", "summary": "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u043F\u043E\u0437\u0438\u0446\u0438\u0438", "idempotent": true },
  getPublicSettings: { "operationId": "getPublicSettings", "method": "get", "path": "/api/v1/settings/public", "tag": "settings", "summary": "\u041F\u0443\u0431\u043B\u0438\u0447\u043D\u044B\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 (\u0431\u0435\u0437 \u0430\u0432\u0442\u043E\u0440\u0438\u0437\u0430\u0446\u0438\u0438)", "idempotent": true },
  getReportExport: { "operationId": "getReportExport", "method": "get", "path": "/api/v1/reports/exports/{id}", "tag": "reports", "summary": "\u0421\u0442\u0430\u0442\u0443\u0441 \u044D\u043A\u0441\u043F\u043E\u0440\u0442\u0430 \u043E\u0442\u0447\u0451\u0442\u0430", "idempotent": true },
  getShare: { "operationId": "getShare", "method": "get", "path": "/api/v1/shares/{id}", "tag": "shares", "summary": "\u0414\u0435\u0442\u0430\u043B\u0438, \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u044B \u0438 \u043E\u0442\u0432\u0435\u0442\u044B", "idempotent": true },
  getSystemStatus: { "operationId": "getSystemStatus", "method": "get", "path": "/api/v1/system/status", "tag": "system", "summary": "\u0412\u0435\u0440\u0441\u0438\u044F, \u0411\u0414, \u0434\u0438\u0441\u043A, \u0440\u0435\u043D\u0434\u0435\u0440 (admin)", "idempotent": true },
  getTemplate: { "operationId": "getTemplate", "method": "get", "path": "/api/v1/templates/{id}", "tag": "templates", "summary": "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u0438 \u0432\u0435\u0440\u0441\u0438\u0438", "idempotent": true },
  getTemplateVersion: { "operationId": "getTemplateVersion", "method": "get", "path": "/api/v1/templates/{id}/versions/{version}", "tag": "templates", "summary": "\u0412\u0435\u0440\u0441\u0438\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u0430 \u0446\u0435\u043B\u0438\u043A\u043E\u043C", "idempotent": true },
  getToken: { "operationId": "getToken", "method": "get", "path": "/api/v1/tokens/{id}", "tag": "tokens", "summary": "\u041C\u0435\u0442\u0430\u0434\u0430\u043D\u043D\u044B\u0435 \u0442\u043E\u043A\u0435\u043D\u0430 (admin)", "idempotent": true },
  getUser: { "operationId": "getUser", "method": "get", "path": "/api/v1/users/{id}", "tag": "users", "summary": "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F (admin)", "idempotent": true },
  getWebhook: { "operationId": "getWebhook", "method": "get", "path": "/api/v1/webhooks/{id}", "tag": "webhooks", "summary": "\u041F\u043E\u0434\u043F\u0438\u0441\u0447\u0438\u043A", "idempotent": true },
  healthCheck: { "operationId": "healthCheck", "method": "get", "path": "/health", "tag": "health", "summary": "\u0421\u0435\u0440\u0432\u0438\u0441 \u043E\u0442\u0432\u0435\u0447\u0430\u0435\u0442", "idempotent": true },
  healthLive: { "operationId": "healthLive", "method": "get", "path": "/health/live", "tag": "health", "summary": "\u041F\u0440\u043E\u0446\u0435\u0441\u0441 \u0436\u0438\u0432", "idempotent": true },
  healthReady: { "operationId": "healthReady", "method": "get", "path": "/health/ready", "tag": "health", "summary": "\u0413\u043E\u0442\u043E\u0432 \u043F\u0440\u0438\u043D\u0438\u043C\u0430\u0442\u044C \u0442\u0440\u0430\u0444\u0438\u043A (\u0411\u0414 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430)", "idempotent": true },
  importDocument: { "operationId": "importDocument", "method": "post", "path": "/api/v1/documents/import", "tag": "imports", "summary": "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A \u0438\u0437 \u0442\u0435\u043A\u0441\u0442\u0430 \u0438\u043B\u0438 JSON", "idempotent": false },
  inviteUser: { "operationId": "inviteUser", "method": "post", "path": "/api/v1/users/{id}/invite", "tag": "users", "summary": "\u041F\u0440\u0438\u0433\u043B\u0430\u0448\u0435\u043D\u0438\u0435/\u043F\u0435\u0440\u0435\u043E\u0442\u043F\u0440\u0430\u0432\u043A\u0430: \u0442\u043E\u043A\u0435\u043D \u0430\u043A\u0442\u0438\u0432\u0430\u0446\u0438\u0438 \u0432 \u043E\u0442\u0432\u0435\u0442\u0435 (\u043F\u043E\u0447\u0442\u0430 \u2014 \u0444\u0430\u0437\u0430 2)", "idempotent": false },
  issueDocument: { "operationId": "issueDocument", "method": "post", "path": "/api/v1/documents/{id}/issue", "tag": "documents", "summary": "\u0412\u044B\u0434\u0430\u0442\u044C \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442: \u043D\u043E\u043C\u0435\u0440 \u0438 \u0432\u0435\u0440\u0441\u0438\u044F 1", "idempotent": false },
  listAppErrors: { "operationId": "listAppErrors", "method": "get", "path": "/api/v1/system/errors", "tag": "system", "summary": "\u041E\u0448\u0438\u0431\u043A\u0438 5xx \u0438\u0437 ring buffer (admin)", "idempotent": true },
  listAudit: { "operationId": "listAudit", "method": "get", "path": "/api/v1/audit", "tag": "audit", "summary": "\u0416\u0443\u0440\u043D\u0430\u043B \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0439 (admin)", "idempotent": true },
  listBankAccounts: { "operationId": "listBankAccounts", "method": "get", "path": "/api/v1/organizations/{id}/bank-accounts", "tag": "organizations", "summary": "\u0411\u0430\u043D\u043A\u043E\u0432\u0441\u043A\u0438\u0435 \u0441\u0447\u0435\u0442\u0430 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438", "idempotent": true },
  listContractFiles: { "operationId": "listContractFiles", "method": "get", "path": "/api/v1/contracts/{id}/file-links", "tag": "contracts", "summary": "\u0421\u0441\u044B\u043B\u043A\u0438 \u043D\u0430 \u0441\u043A\u0430\u043D\u044B \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430", "idempotent": true },
  listContracts: { "operationId": "listContracts", "method": "get", "path": "/api/v1/contracts", "tag": "contracts", "summary": "\u0420\u0435\u0435\u0441\u0442\u0440 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u043E\u0432", "idempotent": true },
  listCounterparties: { "operationId": "listCounterparties", "method": "get", "path": "/api/v1/counterparties", "tag": "counterparties", "summary": "\u0421\u043F\u0438\u0441\u043E\u043A \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u043E\u0432 \u0441 \u043F\u043E\u0438\u0441\u043A\u043E\u043C", "idempotent": true },
  listCounterpartyDocuments: { "operationId": "listCounterpartyDocuments", "method": "get", "path": "/api/v1/counterparties/{id}/documents", "tag": "counterparties", "summary": "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430", "idempotent": true },
  listDevices: { "operationId": "listDevices", "method": "get", "path": "/api/v1/devices", "tag": "devices", "summary": "\u0423\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430 \u0442\u0435\u043A\u0443\u0449\u0435\u0433\u043E \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F", "idempotent": true },
  listDocumentNotes: { "operationId": "listDocumentNotes", "method": "get", "path": "/api/v1/documents/{id}/notes", "tag": "notes", "summary": "\u0417\u0430\u043C\u0435\u0442\u043A\u0438, \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u043D\u043D\u044B\u0435 \u043A \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0443", "idempotent": true },
  listDocumentPayments: { "operationId": "listDocumentPayments", "method": "get", "path": "/api/v1/documents/{id}/payments", "tag": "payments", "summary": "\u041E\u043F\u043B\u0430\u0442\u044B \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430 \u0438 \u043E\u0441\u0442\u0430\u0442\u043E\u043A", "idempotent": true },
  listDocuments: { "operationId": "listDocuments", "method": "get", "path": "/api/v1/documents", "tag": "documents", "summary": "\u0421\u043F\u0438\u0441\u043E\u043A \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432", "idempotent": true },
  listDocumentVersions: { "operationId": "listDocumentVersions", "method": "get", "path": "/api/v1/documents/{id}/versions", "tag": "documents", "summary": "\u0412\u0435\u0440\u0441\u0438\u0438 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430", "idempotent": true },
  listLoginAttempts: { "operationId": "listLoginAttempts", "method": "get", "path": "/api/v1/login-attempts", "tag": "audit", "summary": "\u0416\u0443\u0440\u043D\u0430\u043B \u043F\u043E\u043F\u044B\u0442\u043E\u043A \u0432\u0445\u043E\u0434\u0430 (admin)", "idempotent": true },
  listNotes: { "operationId": "listNotes", "method": "get", "path": "/api/v1/notes", "tag": "notes", "summary": "\u0421\u043F\u0438\u0441\u043E\u043A \u0438 \u043F\u043E\u0438\u0441\u043A \u0437\u0430\u043C\u0435\u0442\u043E\u043A", "idempotent": true },
  listOrganizationAssets: { "operationId": "listOrganizationAssets", "method": "get", "path": "/api/v1/organizations/{id}/assets", "tag": "organizations", "summary": "\u0424\u0430\u0439\u043B\u044B \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 (\u0432\u0435\u0440\u0441\u0438\u0438)", "idempotent": true },
  listOrganizations: { "operationId": "listOrganizations", "method": "get", "path": "/api/v1/organizations", "tag": "organizations", "summary": "\u0421\u043F\u0438\u0441\u043E\u043A \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0445 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0439", "idempotent": true },
  listPayments: { "operationId": "listPayments", "method": "get", "path": "/api/v1/payments", "tag": "payments", "summary": "\u0421\u043F\u0438\u0441\u043E\u043A \u043E\u043F\u043B\u0430\u0442", "idempotent": true },
  listPersonalTokens: { "operationId": "listPersonalTokens", "method": "get", "path": "/api/v1/tokens/personal", "tag": "tokens", "summary": "\u0421\u0432\u043E\u0438 personal-\u0442\u043E\u043A\u0435\u043D\u044B", "idempotent": true },
  listProducts: { "operationId": "listProducts", "method": "get", "path": "/api/v1/products", "tag": "products", "summary": "\u041D\u043E\u043C\u0435\u043D\u043A\u043B\u0430\u0442\u0443\u0440\u0430 \u0441 \u043F\u043E\u0438\u0441\u043A\u043E\u043C", "idempotent": true },
  listSettingDefinitions: { "operationId": "listSettingDefinitions", "method": "get", "path": "/api/v1/settings/definitions", "tag": "settings", "summary": "\u0420\u0435\u0435\u0441\u0442\u0440 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A (admin)", "idempotent": true },
  listShareReplies: { "operationId": "listShareReplies", "method": "get", "path": "/api/v1/shares/{id}/replies", "tag": "shares", "summary": "\u041E\u0442\u0432\u0435\u0442\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u0430", "idempotent": true },
  listShares: { "operationId": "listShares", "method": "get", "path": "/api/v1/shares", "tag": "shares", "summary": "\u0421\u0441\u044B\u043B\u043A\u0438 \u0441\u043E \u0441\u0442\u0430\u0442\u0443\u0441\u0430\u043C\u0438", "idempotent": true },
  listShareViews: { "operationId": "listShareViews", "method": "get", "path": "/api/v1/shares/{id}/views", "tag": "shares", "summary": "\u0416\u0443\u0440\u043D\u0430\u043B \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u043E\u0432", "idempotent": true },
  listSignatories: { "operationId": "listSignatories", "method": "get", "path": "/api/v1/organizations/{id}/signatories", "tag": "organizations", "summary": "\u041F\u043E\u0434\u043F\u0438\u0441\u0430\u043D\u0442\u044B \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438", "idempotent": true },
  listTemplates: { "operationId": "listTemplates", "method": "get", "path": "/api/v1/templates", "tag": "templates", "summary": "\u0413\u0430\u043B\u0435\u0440\u0435\u044F \u0448\u0430\u0431\u043B\u043E\u043D\u043E\u0432", "idempotent": true },
  listTokens: { "operationId": "listTokens", "method": "get", "path": "/api/v1/tokens", "tag": "tokens", "summary": "\u0421\u043F\u0438\u0441\u043E\u043A \u0442\u043E\u043A\u0435\u043D\u043E\u0432 \u043A\u0430\u0431\u0438\u043D\u0435\u0442\u0430 (admin)", "idempotent": true },
  listUnits: { "operationId": "listUnits", "method": "get", "path": "/api/v1/units", "tag": "units", "summary": "\u0415\u0434\u0438\u043D\u0438\u0446\u044B \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u0438\u044F", "idempotent": true },
  listUsers: { "operationId": "listUsers", "method": "get", "path": "/api/v1/users", "tag": "users", "summary": "\u0421\u043F\u0438\u0441\u043E\u043A \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u0435\u0439 (admin)", "idempotent": true },
  listWebhookDeliveries: { "operationId": "listWebhookDeliveries", "method": "get", "path": "/api/v1/webhooks/{id}/deliveries", "tag": "webhooks", "summary": "\u0416\u0443\u0440\u043D\u0430\u043B \u0434\u043E\u0441\u0442\u0430\u0432\u043E\u043A", "idempotent": true },
  listWebhooks: { "operationId": "listWebhooks", "method": "get", "path": "/api/v1/webhooks", "tag": "webhooks", "summary": "\u041F\u043E\u0434\u043F\u0438\u0441\u0447\u0438\u043A\u0438 \u043A\u0430\u0431\u0438\u043D\u0435\u0442\u0430", "idempotent": true },
  login: { "operationId": "login", "method": "post", "path": "/api/v1/auth/login", "tag": "auth", "summary": "\u0412\u0445\u043E\u0434 \u043F\u043E email \u0438 \u043F\u0430\u0440\u043E\u043B\u044E", "idempotent": false },
  logout: { "operationId": "logout", "method": "post", "path": "/api/v1/auth/logout", "tag": "auth", "summary": "\u041E\u0442\u0437\u044B\u0432 \u0442\u0435\u043A\u0443\u0449\u0435\u0439 \u0441\u0435\u0441\u0441\u0438\u0438", "idempotent": false },
  lookupCounterparty: { "operationId": "lookupCounterparty", "method": "post", "path": "/api/v1/counterparties/lookup", "tag": "counterparties", "summary": "\u0410\u0432\u0442\u043E\u0437\u0430\u043F\u043E\u043B\u043D\u0435\u043D\u0438\u0435 \u043F\u043E \u0418\u041D\u041D (\u0432\u0442\u043E\u0440\u0430\u044F \u0444\u0430\u0437\u0430 \u2014 \u043F\u043E\u043A\u0430 501)", "idempotent": false },
  markDocumentReceived: { "operationId": "markDocumentReceived", "method": "post", "path": "/api/v1/documents/{id}/received", "tag": "documents", "summary": "\u041E\u0442\u043C\u0435\u0442\u0438\u0442\u044C \u0430\u043A\u0442 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043D\u044B\u043C (\u043F\u043E\u0434\u043F\u0438\u0441\u0430\u043D \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u043C), \u043E\u043F\u0446\u0438\u043E\u043D\u0430\u043B\u044C\u043D\u043E \u0441\u043E \u0441\u043A\u0430\u043D\u043E\u043C", "idempotent": false },
  openSharePage: { "operationId": "openSharePage", "method": "get", "path": "/s/{token}", "tag": "shares-public", "summary": "HTML-\u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0430 \u0441\u0441\u044B\u043B\u043A\u0438", "idempotent": true },
  previewDataImport: { "operationId": "previewDataImport", "method": "post", "path": "/api/v1/data-imports/preview", "tag": "data-imports", "summary": "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0438\u043C\u043F\u043E\u0440\u0442\u0430 \u043F\u0430\u043A\u0435\u0442\u0430: \u043F\u043B\u0430\u043D, \u043A\u043E\u043D\u0444\u043B\u0438\u043A\u0442\u044B, \u043E\u0448\u0438\u0431\u043A\u0438 (dry-run)", "idempotent": false },
  previewImport: { "operationId": "previewImport", "method": "post", "path": "/api/v1/imports/preview", "tag": "imports", "summary": "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u0438\u043C\u043F\u043E\u0440\u0442\u0430 \u043F\u043E\u0437\u0438\u0446\u0438\u0439", "idempotent": false },
  previewTemplate: { "operationId": "previewTemplate", "method": "post", "path": "/api/v1/templates/{id}/preview", "tag": "templates", "summary": "\u041F\u0440\u0435\u0434\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440 \u043D\u0430 \u0442\u0435\u0441\u0442\u043E\u0432\u043E\u043C \u0441\u043D\u0438\u043C\u043A\u0435 (html, pdf, png)", "idempotent": false },
  publishTemplateVersion: { "operationId": "publishTemplateVersion", "method": "post", "path": "/api/v1/templates/{id}/versions/{version}/publish", "tag": "templates", "summary": "\u041F\u0443\u0431\u043B\u0438\u043A\u0430\u0446\u0438\u044F \u0432\u0435\u0440\u0441\u0438\u0438 \u043F\u043E\u0441\u043B\u0435 \u0448\u0435\u0441\u0442\u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u043E\u043A", "idempotent": false },
  refreshTokens: { "operationId": "refreshTokens", "method": "post", "path": "/api/v1/auth/refresh", "tag": "auth", "summary": "\u0420\u043E\u0442\u0430\u0446\u0438\u044F refresh \u0438 \u043D\u043E\u0432\u044B\u0439 access", "idempotent": false },
  registerDevice: { "operationId": "registerDevice", "method": "post", "path": "/api/v1/devices", "tag": "devices", "summary": "\u0420\u0435\u0433\u0438\u0441\u0442\u0440\u0430\u0446\u0438\u044F push-\u0442\u043E\u043A\u0435\u043D\u0430 (\u0438\u0434\u0435\u043C\u043F\u043E\u0442\u0435\u043D\u0442\u043D\u043E \u043F\u043E pushToken)", "idempotent": false },
  removeNoteLink: { "operationId": "removeNoteLink", "method": "delete", "path": "/api/v1/notes/{id}/links", "tag": "notes", "summary": "\u041E\u0442\u0432\u044F\u0437\u0430\u0442\u044C \u0441\u0443\u0449\u043D\u043E\u0441\u0442\u044C \u043E\u0442 \u0437\u0430\u043C\u0435\u0442\u043A\u0438", "idempotent": false },
  reopenNote: { "operationId": "reopenNote", "method": "post", "path": "/api/v1/notes/{id}/reopen", "tag": "notes", "summary": "\u041F\u0435\u0440\u0435\u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0437\u0430\u043C\u0435\u0442\u043A\u0443", "idempotent": false },
  replaceDocumentItems: { "operationId": "replaceDocumentItems", "method": "put", "path": "/api/v1/documents/{id}/items", "tag": "documents", "summary": "\u0417\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u043E\u0437\u0438\u0446\u0438\u0438 \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A\u0430", "idempotent": false },
  replyToShare: { "operationId": "replyToShare", "method": "post", "path": "/s/{token}/replies", "tag": "shares-public", "summary": "\u041E\u0442\u0432\u0435\u0442 \u043A\u043B\u0438\u0435\u043D\u0442\u0430 \u043F\u043E \u0441\u0441\u044B\u043B\u043A\u0435", "idempotent": false },
  reportsPayments: { "operationId": "reportsPayments", "method": "get", "path": "/api/v1/reports/payments", "tag": "reports", "summary": "\u0412\u0435\u0434\u043E\u043C\u043E\u0441\u0442\u044C \u043E\u043F\u043B\u0430\u0442 \u0437\u0430 \u043F\u0435\u0440\u0438\u043E\u0434 \u0441 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u043C \u0438 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u043E\u043C", "idempotent": true },
  reportsReconciliation: { "operationId": "reportsReconciliation", "method": "get", "path": "/api/v1/reports/reconciliation", "tag": "reports", "summary": "\u0410\u043A\u0442 \u0441\u0432\u0435\u0440\u043A\u0438: \u043D\u0430\u0447\u0430\u043B\u044C\u043D\u043E\u0435 \u0441\u0430\u043B\u044C\u0434\u043E, \u043E\u0431\u043E\u0440\u043E\u0442\u044B, \u043D\u0430\u0440\u0430\u0441\u0442\u0430\u044E\u0449\u0438\u0439 \u0438\u0442\u043E\u0433", "idempotent": true },
  reportsRegistry: { "operationId": "reportsRegistry", "method": "get", "path": "/api/v1/reports/registry", "tag": "reports", "summary": "\u0420\u0435\u0435\u0441\u0442\u0440 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \u0437\u0430 \u043F\u0435\u0440\u0438\u043E\u0434: \u0441\u0443\u043C\u043C\u044B, \u041D\u0414\u0421, \u0441\u0442\u0430\u0442\u0443\u0441\u044B", "idempotent": true },
  reportsSummary: { "operationId": "reportsSummary", "method": "get", "path": "/api/v1/reports/summary", "tag": "reports", "summary": "\u0421\u0432\u043E\u0434\u043A\u0430: \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043E, \u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043E, \u0434\u043E\u043B\u0433 \u0438 \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u043A\u0430 \u0437\u0430 \u043F\u0435\u0440\u0438\u043E\u0434", "idempotent": true },
  reportsUnpaid: { "operationId": "reportsUnpaid", "method": "get", "path": "/api/v1/reports/unpaid", "tag": "reports", "summary": "\u041D\u0435\u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043D\u044B\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B: \u043E\u0441\u0442\u0430\u0442\u043E\u043A, \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u043A\u0430, \u0441\u0442\u0430\u0440\u044B\u0435 \u0441\u0432\u0435\u0440\u0445\u0443", "idempotent": true },
  resetPassword: { "operationId": "resetPassword", "method": "post", "path": "/api/v1/auth/password/reset", "tag": "auth", "summary": "\u0421\u0431\u0440\u043E\u0441 \u043F\u0430\u0440\u043E\u043B\u044F \u043F\u043E \u043E\u0434\u043D\u043E\u0440\u0430\u0437\u043E\u0432\u043E\u043C\u0443 \u0442\u043E\u043A\u0435\u043D\u0443", "idempotent": false },
  resetSetting: { "operationId": "resetSetting", "method": "delete", "path": "/api/v1/settings/{code}", "tag": "settings", "summary": "\u0421\u0431\u0440\u043E\u0441 \u043D\u0430\u0441\u0442\u0440\u043E\u0439\u043A\u0438 \u043A \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0435\u043C\u0443 \u0443\u0440\u043E\u0432\u043D\u044E (admin)", "idempotent": false },
  resetUserPassword: { "operationId": "resetUserPassword", "method": "post", "path": "/api/v1/users/{id}/reset-password", "tag": "users", "summary": "\u0421\u0431\u0440\u043E\u0441 \u043F\u0430\u0440\u043E\u043B\u044F \u0430\u0434\u043C\u0438\u043D\u043E\u043C: \u0432\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0439 \u043F\u0430\u0440\u043E\u043B\u044C \u0432 \u043E\u0442\u0432\u0435\u0442\u0435 (\u043E\u0434\u0438\u043D \u0440\u0430\u0437)", "idempotent": false },
  retryWebhookDelivery: { "operationId": "retryWebhookDelivery", "method": "post", "path": "/api/v1/webhooks/{id}/deliveries/{deliveryId}/retry", "tag": "webhooks", "summary": "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u044C \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0443 \u0432\u0440\u0443\u0447\u043D\u0443\u044E", "idempotent": false },
  revokeDevice: { "operationId": "revokeDevice", "method": "delete", "path": "/api/v1/devices/{id}", "tag": "devices", "summary": "\u0412\u044B\u0445\u043E\u0434: \u043E\u0442\u0437\u044B\u0432 \u0443\u0441\u0442\u0440\u043E\u0439\u0441\u0442\u0432\u0430", "idempotent": false },
  revokePersonalToken: { "operationId": "revokePersonalToken", "method": "delete", "path": "/api/v1/tokens/personal/{id}", "tag": "tokens", "summary": "\u041E\u0442\u043E\u0437\u0432\u0430\u0442\u044C \u0441\u0432\u043E\u0439 personal-\u0442\u043E\u043A\u0435\u043D (\u0432\u043B\u0430\u0434\u0435\u043B\u0435\u0446; \u0438\u0434\u0435\u043C\u043F\u043E\u0442\u0435\u043D\u0442\u043D\u043E)", "idempotent": false },
  revokeShare: { "operationId": "revokeShare", "method": "delete", "path": "/api/v1/shares/{id}", "tag": "shares", "summary": "\u041E\u0442\u043E\u0437\u0432\u0430\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443", "idempotent": false },
  revokeToken: { "operationId": "revokeToken", "method": "delete", "path": "/api/v1/tokens/{id}", "tag": "tokens", "summary": "\u041E\u0442\u043E\u0437\u0432\u0430\u0442\u044C \u0442\u043E\u043A\u0435\u043D (admin)", "idempotent": false },
  rotateWebhookSecret: { "operationId": "rotateWebhookSecret", "method": "post", "path": "/api/v1/webhooks/{id}/rotate-secret", "tag": "webhooks", "summary": "\u041D\u043E\u0432\u044B\u0439 \u0441\u0435\u043A\u0440\u0435\u0442 \u043F\u043E\u0434\u043F\u0438\u0441\u0438", "idempotent": false },
  searchBanks: { "operationId": "searchBanks", "method": "get", "path": "/api/v1/banks", "tag": "banks", "summary": "\u041F\u043E\u0438\u0441\u043A \u0431\u0430\u043D\u043A\u0430 \u0432 \u0441\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A\u0435", "idempotent": true },
  setDefaultAsset: { "operationId": "setDefaultAsset", "method": "post", "path": "/api/v1/assets/{id}/default", "tag": "files", "summary": "\u0421\u0434\u0435\u043B\u0430\u0442\u044C \u0444\u0430\u0439\u043B \u043E\u0441\u043D\u043E\u0432\u043D\u044B\u043C \u0434\u043B\u044F \u0441\u0432\u043E\u0435\u0433\u043E \u0432\u0438\u0434\u0430 (\u043F\u0435\u0447\u0430\u0442\u044C, \u043F\u043E\u0434\u043F\u0438\u0441\u044C)", "idempotent": false },
  setDefaultBankAccount: { "operationId": "setDefaultBankAccount", "method": "post", "path": "/api/v1/organizations/{id}/bank-accounts/{accountId}/default", "tag": "organizations", "summary": "\u0421\u0434\u0435\u043B\u0430\u0442\u044C \u0441\u0447\u0451\u0442\u043E\u043C \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E", "idempotent": false },
  setDefaultSignatory: { "operationId": "setDefaultSignatory", "method": "post", "path": "/api/v1/organizations/{id}/signatories/{signatoryId}/default", "tag": "organizations", "summary": "\u0421\u0434\u0435\u043B\u0430\u0442\u044C \u043F\u043E\u0434\u043F\u0438\u0441\u0430\u043D\u0442\u043E\u043C \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E", "idempotent": false },
  testWebhook: { "operationId": "testWebhook", "method": "post", "path": "/api/v1/webhooks/{id}/test", "tag": "webhooks", "summary": "\u0422\u0435\u0441\u0442\u043E\u0432\u0430\u044F \u0434\u043E\u0441\u0442\u0430\u0432\u043A\u0430 (\u0441\u0438\u043D\u0445\u0440\u043E\u043D\u043D\u043E)", "idempotent": false },
  unblockUser: { "operationId": "unblockUser", "method": "post", "path": "/api/v1/users/{id}/unblock", "tag": "users", "summary": "\u0420\u0430\u0437\u0431\u043B\u043E\u043A\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F (admin)", "idempotent": false },
  unmarkDocumentReceived: { "operationId": "unmarkDocumentReceived", "method": "delete", "path": "/api/v1/documents/{id}/received", "tag": "documents", "summary": "\u0421\u043D\u044F\u0442\u044C \u043E\u0442\u043C\u0435\u0442\u043A\u0443 \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044F \u0430\u043A\u0442\u0430", "idempotent": false },
  updateBankAccount: { "operationId": "updateBankAccount", "method": "patch", "path": "/api/v1/organizations/{id}/bank-accounts/{accountId}", "tag": "organizations", "summary": "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0431\u0430\u043D\u043A\u043E\u0432\u0441\u043A\u0438\u0439 \u0441\u0447\u0451\u0442", "idempotent": false },
  updateContract: { "operationId": "updateContract", "method": "patch", "path": "/api/v1/contracts/{id}", "tag": "contracts", "summary": "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0434\u043E\u0433\u043E\u0432\u043E\u0440", "idempotent": false },
  updateCounterparty: { "operationId": "updateCounterparty", "method": "patch", "path": "/api/v1/counterparties/{id}", "tag": "counterparties", "summary": "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430", "idempotent": false },
  updateCounterpartyContact: { "operationId": "updateCounterpartyContact", "method": "patch", "path": "/api/v1/counterparties/{id}/contacts/{contactId}", "tag": "counterparties", "summary": "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043A\u043E\u043D\u0442\u0430\u043A\u0442", "idempotent": false },
  updateDevice: { "operationId": "updateDevice", "method": "patch", "path": "/api/v1/devices/{id}", "tag": "devices", "summary": "\u0423\u0432\u0435\u0434\u043E\u043C\u043B\u0435\u043D\u0438\u044F, \u0432\u0435\u0440\u0441\u0438\u044F \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u0438\u044F, \u0438\u043C\u044F", "idempotent": false },
  updateDocument: { "operationId": "updateDocument", "method": "patch", "path": "/api/v1/documents/{id}", "tag": "documents", "summary": "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A", "idempotent": false },
  updateNote: { "operationId": "updateNote", "method": "patch", "path": "/api/v1/notes/{id}", "tag": "notes", "summary": "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0437\u0430\u043C\u0435\u0442\u043A\u0443", "idempotent": false },
  updateOrganization: { "operationId": "updateOrganization", "method": "patch", "path": "/api/v1/organizations/{id}", "tag": "organizations", "summary": "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0440\u0435\u043A\u0432\u0438\u0437\u0438\u0442\u044B \u0438 \u0440\u0435\u0436\u0438\u043C \u041D\u041E", "idempotent": false },
  updateProduct: { "operationId": "updateProduct", "method": "patch", "path": "/api/v1/products/{id}", "tag": "products", "summary": "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u043E\u0437\u0438\u0446\u0438\u044E", "idempotent": false },
  updateSettings: { "operationId": "updateSettings", "method": "patch", "path": "/api/v1/settings", "tag": "settings", "summary": "\u041C\u0430\u0441\u0441\u043E\u0432\u043E\u0435 \u043E\u0431\u043D\u043E\u0432\u043B\u0435\u043D\u0438\u0435 \u043D\u0430\u0441\u0442\u0440\u043E\u0435\u043A (admin)", "idempotent": false },
  updateSignatory: { "operationId": "updateSignatory", "method": "patch", "path": "/api/v1/organizations/{id}/signatories/{signatoryId}", "tag": "organizations", "summary": "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u043E\u0434\u043F\u0438\u0441\u0430\u043D\u0442\u0430", "idempotent": false },
  updateTemplate: { "operationId": "updateTemplate", "method": "patch", "path": "/api/v1/templates/{id}", "tag": "templates", "summary": "\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435, \u043E\u0440\u0438\u0435\u043D\u0442\u0430\u0446\u0438\u044F, \u0444\u043B\u0430\u0433\u0438", "idempotent": false },
  updateUnit: { "operationId": "updateUnit", "method": "patch", "path": "/api/v1/units/{code}", "tag": "units", "summary": "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0435\u0434\u0438\u043D\u0438\u0446\u0443 (admin)", "idempotent": false },
  updateUser: { "operationId": "updateUser", "method": "patch", "path": "/api/v1/users/{id}", "tag": "users", "summary": "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F (admin)", "idempotent": false },
  updateWebhook: { "operationId": "updateWebhook", "method": "patch", "path": "/api/v1/webhooks/{id}", "tag": "webhooks", "summary": "\u0418\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u0430\u0434\u0440\u0435\u0441, \u0441\u043E\u0431\u044B\u0442\u0438\u044F, \u0430\u043A\u0442\u0438\u0432\u043D\u043E\u0441\u0442\u044C", "idempotent": false },
  uploadContractFile: { "operationId": "uploadContractFile", "method": "post", "path": "/api/v1/contracts/{id}/files", "tag": "contracts", "summary": "\u041F\u0440\u0438\u043A\u0440\u0435\u043F\u0438\u0442\u044C \u0441\u043A\u0430\u043D \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430", "idempotent": false },
  uploadFile: { "operationId": "uploadFile", "method": "post", "path": "/api/v1/files", "tag": "files", "summary": "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u0444\u0430\u0439\u043B (\u0441\u043A\u0430\u043D, \u043F\u0435\u0447\u0430\u0442\u044C, \u043F\u043E\u0434\u043F\u0438\u0441\u044C)", "idempotent": false },
  uploadOrganizationAsset: { "operationId": "uploadOrganizationAsset", "method": "post", "path": "/api/v1/organizations/{id}/assets", "tag": "organizations", "summary": "\u0417\u0430\u0433\u0440\u0443\u0437\u0438\u0442\u044C \u043F\u0435\u0447\u0430\u0442\u044C/\u043F\u043E\u0434\u043F\u0438\u0441\u044C/\u043B\u043E\u0433\u043E\u0442\u0438\u043F", "idempotent": false },
  uploadOrganizationAssetVersion: { "operationId": "uploadOrganizationAssetVersion", "method": "post", "path": "/api/v1/organizations/{id}/assets/{assetId}/versions", "tag": "organizations", "summary": "\u041D\u043E\u0432\u0430\u044F \u0432\u0435\u0440\u0441\u0438\u044F \u0430\u0441\u0441\u0435\u0442\u0430", "idempotent": false },
  verifySharePin: { "operationId": "verifySharePin", "method": "post", "path": "/s/{token}/verify", "tag": "shares-public", "summary": "\u041F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C PIN \u0438 \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0441\u0435\u0441\u0441\u0438\u044E \u0441\u0441\u044B\u043B\u043A\u0438", "idempotent": false }
};

// packages/sdk/dist/client.js
var DEFAULT_TIMEOUT_MS = 3e4;
function createApiHttpClient(options) {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const fetchImpl = options.fetch ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new Error("\u041D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D fetch: \u043F\u0435\u0440\u0435\u0434\u0430\u0439\u0442\u0435 options.fetch (Node < 18 \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F)");
  }
  return {
    async call(operationId, args = {}) {
      const token = typeof options.accessToken === "function" ? await options.accessToken() : options.accessToken;
      const headers = new Headers({
        Accept: "application/json",
        ...options.headers ?? {},
        ...args.headers ?? {}
      });
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      if (args.requestId) {
        headers.set("X-Request-Id", args.requestId);
      }
      if (args.idempotencyKey) {
        headers.set("Idempotency-Key", args.idempotencyKey);
      }
      const url = buildUrl(baseUrl, operationId, args.pathParams, args.query);
      const body = serializeBody(args.body, headers);
      const signal = combineSignals(args.signal, AbortSignal.timeout(options.timeoutMs ?? DEFAULT_TIMEOUT_MS));
      let response;
      try {
        response = await fetchImpl(url, {
          method: methodOf(operationId),
          headers,
          body,
          signal,
          ...options.credentials ? { credentials: options.credentials } : {}
        });
      } catch (error) {
        const name = error?.name;
        if (name === "TimeoutError" || name === "AbortError") {
          throw new ApiError(0, void 0, "\u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u0442\u0430\u0439\u043C\u0430\u0443\u0442 \u0437\u0430\u043F\u0440\u043E\u0441\u0430");
        }
        throw error;
      }
      if (!response.ok) {
        throw await toApiError(response);
      }
      if (args.raw) {
        return response;
      }
      if (response.status === 204) {
        return void 0;
      }
      const contentType = response.headers.get("content-type") ?? "";
      if (contentType.includes("application/json")) {
        return await response.json();
      }
      if (contentType.includes("application/pdf") || contentType.includes("application/octet-stream") || contentType.includes("image/")) {
        return await response.blob();
      }
      const text = await response.text();
      return text === "" ? void 0 : text;
    }
  };
}
var CATALOG = OPERATIONS;
function methodOf(operationId) {
  return CATALOG[operationId]?.method?.toUpperCase() ?? "GET";
}
function pathOf(operationId) {
  return CATALOG[operationId]?.path ?? `/api/v1/${operationId}`;
}
function buildUrl(baseUrl, operationId, pathParams, query) {
  const template = pathOf(operationId);
  const path = template.replace(/\{([^}]+)\}/g, (_match, name) => {
    const value = pathParams?.[name];
    if (value === void 0 || value === "") {
      throw new Error(`\u041D\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u043D \u043F\u0430\u0440\u0430\u043C\u0435\u0442\u0440 \u043F\u0443\u0442\u0438 \xAB${name}\xBB \u0434\u043B\u044F ${operationId}`);
    }
    return encodeURIComponent(String(value));
  });
  const search = serializeQuery(query);
  return `${baseUrl}${path}${search}`;
}
function serializeQuery(query) {
  if (!query) {
    return "";
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === void 0 || value === null) {
      continue;
    }
    if (Array.isArray(value)) {
      for (const item of value) {
        if (item !== void 0 && item !== null) {
          params.append(key, String(item));
        }
      }
      continue;
    }
    if (value instanceof Date) {
      params.append(key, value.toISOString());
      continue;
    }
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
      params.append(key, String(value));
      continue;
    }
    params.append(key, JSON.stringify(value) ?? "");
  }
  const serialized = params.toString();
  return serialized === "" ? "" : `?${serialized}`;
}
function serializeBody(body, headers) {
  if (body === void 0 || body === null) {
    return void 0;
  }
  if (body instanceof FormData) {
    headers.delete("Content-Type");
    return body;
  }
  if (typeof body === "string" || body instanceof Blob || body instanceof Uint8Array) {
    return body;
  }
  if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return JSON.stringify(body);
}
function combineSignals(signal, timeout) {
  if (!signal) {
    return timeout;
  }
  return typeof AbortSignal.any === "function" ? AbortSignal.any([signal, timeout]) : signal;
}
async function toApiError(response) {
  const text = await response.text();
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json") && text !== "") {
    try {
      return new ApiError(response.status, JSON.parse(text));
    } catch {
      return new ApiError(response.status, void 0, text);
    }
  }
  return new ApiError(response.status, void 0, text || response.statusText);
}

// packages/sdk/dist/generated/facade.js
function createApiSdk(http) {
  const audit = {
    /** Экспорт аудита: CSV (`;`, BOM) или JSON (admin) */
    export(query, options) {
      const pathParams = {};
      return http.call("exportAudit", { pathParams, query, ...options });
    },
    /** Запись аудита с diff (admin) */
    getAuditEntry(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("getAuditEntry", { pathParams, ...options });
    },
    /** Журнал действий (admin) */
    list(query, options) {
      const pathParams = {};
      return http.call("listAudit", { pathParams, query, ...options });
    },
    /** Журнал попыток входа (admin) */
    listLoginAttempts(query, options) {
      const pathParams = {};
      return http.call("listLoginAttempts", { pathParams, query, ...options });
    }
  };
  const auth = {
    /** Активация приглашённого пользователя */
    acceptInvitation(token, body, options) {
      const pathParams = {};
      pathParams["token"] = token;
      return http.call("acceptInvitation", { pathParams, body, ...options });
    },
    /** Смена своего пароля */
    changePassword(body, options) {
      const pathParams = {};
      return http.call("changePassword", { pathParams, body, ...options });
    },
    /** Запрос сброса пароля (всегда 202, письмо — фаза 2) */
    forgotPassword(body, options) {
      const pathParams = {};
      return http.call("forgotPassword", { pathParams, body, ...options });
    },
    /** Текущий пользователь, роль и права */
    getMe(options) {
      const pathParams = {};
      return http.call("getMe", { pathParams, ...options });
    },
    /** Вход по email и паролю */
    login(body, options) {
      const pathParams = {};
      return http.call("login", { pathParams, body, ...options });
    },
    /** Отзыв текущей сессии */
    logout(body, options) {
      const pathParams = {};
      return http.call("logout", { pathParams, body, ...options });
    },
    /** Ротация refresh и новый access */
    refreshTokens(body, options) {
      const pathParams = {};
      return http.call("refreshTokens", { pathParams, body, ...options });
    },
    /** Сброс пароля по одноразовому токену */
    resetPassword(body, options) {
      const pathParams = {};
      return http.call("resetPassword", { pathParams, body, ...options });
    }
  };
  const banks = {
    /** Поиск банка в справочнике */
    search(query, options) {
      const pathParams = {};
      return http.call("searchBanks", { pathParams, query, ...options });
    }
  };
  const contracts = {
    /** Архив договора */
    archive(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("archiveContract", { pathParams, ...options });
    },
    /** Создать договор */
    create(body, options) {
      const pathParams = {};
      return http.call("createContract", { pathParams, body, ...options });
    },
    /** Удалить скан договора */
    deleteContractFile(id, assetId, options) {
      const pathParams = {};
      pathParams["id"] = id;
      pathParams["assetId"] = assetId;
      return http.call("deleteContractFile", { pathParams, ...options });
    },
    /** Карточка договора */
    get(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("getContract", { pathParams, ...options });
    },
    /** Ссылки на сканы договора */
    listContractFiles(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("listContractFiles", { pathParams, ...options });
    },
    /** Реестр договоров */
    list(query, options) {
      const pathParams = {};
      return http.call("listContracts", { pathParams, query, ...options });
    },
    /** Изменить договор */
    update(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("updateContract", { pathParams, body, ...options });
    },
    /** Прикрепить скан договора */
    uploadContractFile(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("uploadContractFile", { pathParams, body, ...options });
    }
  };
  const counterparties = {
    /** Архив контрагента */
    archiveCounterparty(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("archiveCounterparty", { pathParams, ...options });
    },
    /** Кандидаты в дубли по ИНН */
    checkCounterpartyDuplicates(body, options) {
      const pathParams = {};
      return http.call("checkCounterpartyDuplicates", { pathParams, body, ...options });
    },
    /** Создать контрагента */
    createCounterparty(body, options) {
      const pathParams = {};
      return http.call("createCounterparty", { pathParams, body, ...options });
    },
    /** Добавить контакт */
    createCounterpartyContact(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("createCounterpartyContact", { pathParams, body, ...options });
    },
    /** Удалить контакт */
    deleteCounterpartyContact(id, contactId, options) {
      const pathParams = {};
      pathParams["id"] = id;
      pathParams["contactId"] = contactId;
      return http.call("deleteCounterpartyContact", { pathParams, ...options });
    },
    /** Карточка контрагента с контактами */
    getCounterparty(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("getCounterparty", { pathParams, ...options });
    },
    /** Сальдо на дату */
    getCounterpartyBalance(id, query, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("getCounterpartyBalance", { pathParams, query, ...options });
    },
    /** Сводка по контрагенту */
    getCounterpartySummary(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("getCounterpartySummary", { pathParams, ...options });
    },
    /** Список контрагентов с поиском */
    list(query, options) {
      const pathParams = {};
      return http.call("listCounterparties", { pathParams, query, ...options });
    },
    /** Документы контрагента */
    listCounterpartyDocuments(id, query, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("listCounterpartyDocuments", { pathParams, query, ...options });
    },
    /** Автозаполнение по ИНН (вторая фаза — пока 501) */
    lookupCounterparty(options) {
      const pathParams = {};
      return http.call("lookupCounterparty", { pathParams, ...options });
    },
    /** Изменить контрагента */
    updateCounterparty(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("updateCounterparty", { pathParams, body, ...options });
    },
    /** Изменить контакт */
    updateCounterpartyContact(id, contactId, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      pathParams["contactId"] = contactId;
      return http.call("updateCounterpartyContact", { pathParams, body, ...options });
    }
  };
  const dataExports = {
    /** Пакет переноса: организация/справочники/документы (JSON/ZIP) */
    createDataExport(body, options) {
      const pathParams = {};
      return http.call("createDataExport", { pathParams, body, ...options });
    },
    /** Скачать готовый пакет */
    downloadDataExport(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("downloadDataExport", { pathParams, ...options });
    },
    /** Статус пакета переноса */
    getDataExport(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("getDataExport", { pathParams, ...options });
    }
  };
  const dataImports = {
    /** Применить импорт: одна транзакция, конфликты пересчитываются */
    applyDataImport(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("applyDataImport", { pathParams, body, ...options });
    },
    /** Статус импорта и отчёт по строкам */
    getDataImport(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("getDataImport", { pathParams, ...options });
    },
    /** Предпросмотр импорта пакета: план, конфликты, ошибки (dry-run) */
    previewDataImport(body, options) {
      const pathParams = {};
      return http.call("previewDataImport", { pathParams, body, ...options });
    }
  };
  const devices = {
    /** Устройства текущего пользователя */
    list(options) {
      const pathParams = {};
      return http.call("listDevices", { pathParams, ...options });
    },
    /** Регистрация push-токена (идемпотентно по pushToken) */
    register(body, options) {
      const pathParams = {};
      return http.call("registerDevice", { pathParams, body, ...options });
    },
    /** Выход: отзыв устройства */
    revoke(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("revokeDevice", { pathParams, ...options });
    },
    /** Уведомления, версия приложения, имя */
    update(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("updateDevice", { pathParams, body, ...options });
    }
  };
  const documents = {
    /** Аннулировать документ */
    cancel(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("cancelDocument", { pathParams, body, ...options });
    },
    /** Создать акт по счёту */
    createActFromInvoice(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("createActFromInvoice", { pathParams, body, ...options });
    },
    /** Создать черновик */
    create(body, options) {
      const pathParams = {};
      return http.call("createDocument", { pathParams, body, ...options });
    },
    /** Короткоживущая ссылка на PDF */
    createDocumentPdfLink(id, query, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("createDocumentPdfLink", { pathParams, query, ...options });
    },
    /** Новая ревизия выданного */
    createDocumentRevision(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("createDocumentRevision", { pathParams, body, ...options });
    },
    /** Создать счёт из акта (акт раньше счёта) и включить все акты контрагента */
    createInvoiceFromActs(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("createInvoiceFromActs", { pathParams, body, ...options });
    },
    /** Удалить черновик */
    delete(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("deleteDocument", { pathParams, ...options });
    },
    /** PDF документа (печать, подпись, водяной знак) */
    downloadDocumentPdf(id, query, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("downloadDocumentPdf", { pathParams, query, ...options });
    },
    /** PDF по короткоживущей подписанной ссылке */
    downloadSharedDocumentPdf(token, options) {
      const pathParams = {};
      pathParams["token"] = token;
      return http.call("downloadSharedDocumentPdf", { pathParams, ...options });
    },
    /** Копия в новый черновик */
    duplicate(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("duplicateDocument", { pathParams, body, ...options });
    },
    /** Документ с позициями */
    get(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("getDocument", { pathParams, ...options });
    },
    /** HTML для предпросмотра */
    getDocumentHtml(id, query, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("getDocumentHtml", { pathParams, query, ...options });
    },
    /** Версия целиком */
    getDocumentVersion(id, revision, options) {
      const pathParams = {};
      pathParams["id"] = id;
      pathParams["revision"] = revision;
      return http.call("getDocumentVersion", { pathParams, ...options });
    },
    /** Выдать документ: номер и версия 1 */
    issue(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("issueDocument", { pathParams, body, ...options });
    },
    /** Список документов */
    list(query, options) {
      const pathParams = {};
      return http.call("listDocuments", { pathParams, query, ...options });
    },
    /** Версии документа */
    listDocumentVersions(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("listDocumentVersions", { pathParams, ...options });
    },
    /** Отметить акт полученным (подписан клиентом), опционально со сканом */
    markDocumentReceived(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("markDocumentReceived", { pathParams, body, ...options });
    },
    /** Заменить позиции черновика */
    replaceDocumentItems(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("replaceDocumentItems", { pathParams, body, ...options });
    },
    /** Снять отметку получения акта */
    unmarkDocumentReceived(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("unmarkDocumentReceived", { pathParams, ...options });
    },
    /** Изменить черновик */
    update(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("updateDocument", { pathParams, body, ...options });
    }
  };
  const files = {
    /** Скачать файл версии ассета */
    download(versionId, options) {
      const pathParams = {};
      pathParams["versionId"] = versionId;
      return http.call("downloadFile", { pathParams, ...options });
    },
    /** Сделать файл основным для своего вида (печать, подпись) */
    setDefaultAsset(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("setDefaultAsset", { pathParams, ...options });
    },
    /** Загрузить файл (скан, печать, подпись) */
    upload(body, options) {
      const pathParams = {};
      return http.call("uploadFile", { pathParams, body, ...options });
    }
  };
  const health = {
    /** Сервис отвечает */
    healthCheck(options) {
      const pathParams = {};
      return http.call("healthCheck", { pathParams, ...options });
    },
    /** Процесс жив */
    healthLive(options) {
      const pathParams = {};
      return http.call("healthLive", { pathParams, ...options });
    },
    /** Готов принимать трафик (БД доступна) */
    healthReady(options) {
      const pathParams = {};
      return http.call("healthReady", { pathParams, ...options });
    }
  };
  const imports = {
    /** Создать черновик из текста или JSON */
    importDocument(body, options) {
      const pathParams = {};
      return http.call("importDocument", { pathParams, body, ...options });
    },
    /** Предпросмотр импорта позиций */
    preview(body, options) {
      const pathParams = {};
      return http.call("previewImport", { pathParams, body, ...options });
    }
  };
  const notes = {
    /** Привязать заметку к сущностям */
    addNoteLinks(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("addNoteLinks", { pathParams, body, ...options });
    },
    /** Закрыть заметку */
    close(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("closeNote", { pathParams, ...options });
    },
    /** Создать заметку (Markdown) */
    create(body, options) {
      const pathParams = {};
      return http.call("createNote", { pathParams, body, ...options });
    },
    /** Удалить заметку (физически) */
    delete(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("deleteNote", { pathParams, ...options });
    },
    /** Карточка заметки с привязками */
    get(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("getNote", { pathParams, ...options });
    },
    /** События календаря по дедлайнам и напоминаниям */
    getNotesCalendar(query, options) {
      const pathParams = {};
      return http.call("getNotesCalendar", { pathParams, query, ...options });
    },
    /** Заметки, привязанные к документу */
    listDocument(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("listDocumentNotes", { pathParams, ...options });
    },
    /** Список и поиск заметок */
    list(query, options) {
      const pathParams = {};
      return http.call("listNotes", { pathParams, query, ...options });
    },
    /** Отвязать сущность от заметки */
    removeNoteLink(id, query, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("removeNoteLink", { pathParams, query, ...options });
    },
    /** Переоткрыть заметку */
    reopen(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("reopenNote", { pathParams, ...options });
    },
    /** Изменить заметку */
    update(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("updateNote", { pathParams, body, ...options });
    }
  };
  const organizations = {
    /** Архив (без удаления данных) */
    archive(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("archiveOrganization", { pathParams, ...options });
    },
    /** Добавить банковский счёт */
    createBankAccount(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("createBankAccount", { pathParams, body, ...options });
    },
    /** Создать организацию */
    create(body, options) {
      const pathParams = {};
      return http.call("createOrganization", { pathParams, body, ...options });
    },
    /** Добавить подписанта */
    createSignatory(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("createSignatory", { pathParams, body, ...options });
    },
    /** Удалить банковский счёт */
    deleteBankAccount(id, accountId, options) {
      const pathParams = {};
      pathParams["id"] = id;
      pathParams["accountId"] = accountId;
      return http.call("deleteBankAccount", { pathParams, ...options });
    },
    /** Удалить подписанта */
    deleteSignatory(id, signatoryId, options) {
      const pathParams = {};
      pathParams["id"] = id;
      pathParams["signatoryId"] = signatoryId;
      return http.call("deleteSignatory", { pathParams, ...options });
    },
    /** Карточка организации */
    get(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("getOrganization", { pathParams, ...options });
    },
    /** Эффективные настройки организации */
    getOrganizationEffectiveSettings(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("getOrganizationEffectiveSettings", { pathParams, ...options });
    },
    /** Банковские счета организации */
    listBankAccounts(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("listBankAccounts", { pathParams, ...options });
    },
    /** Файлы организации (версии) */
    listOrganizationAssets(id, query, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("listOrganizationAssets", { pathParams, query, ...options });
    },
    /** Список доступных организаций */
    list(query, options) {
      const pathParams = {};
      return http.call("listOrganizations", { pathParams, query, ...options });
    },
    /** Подписанты организации */
    listSignatories(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("listSignatories", { pathParams, ...options });
    },
    /** Сделать счётом по умолчанию */
    setDefaultBankAccount(id, accountId, options) {
      const pathParams = {};
      pathParams["id"] = id;
      pathParams["accountId"] = accountId;
      return http.call("setDefaultBankAccount", { pathParams, ...options });
    },
    /** Сделать подписантом по умолчанию */
    setDefaultSignatory(id, signatoryId, options) {
      const pathParams = {};
      pathParams["id"] = id;
      pathParams["signatoryId"] = signatoryId;
      return http.call("setDefaultSignatory", { pathParams, ...options });
    },
    /** Изменить банковский счёт */
    updateBankAccount(id, accountId, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      pathParams["accountId"] = accountId;
      return http.call("updateBankAccount", { pathParams, body, ...options });
    },
    /** Изменить реквизиты и режим НО */
    update(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("updateOrganization", { pathParams, body, ...options });
    },
    /** Изменить подписанта */
    updateSignatory(id, signatoryId, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      pathParams["signatoryId"] = signatoryId;
      return http.call("updateSignatory", { pathParams, body, ...options });
    },
    /** Загрузить печать/подпись/логотип */
    uploadOrganizationAsset(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("uploadOrganizationAsset", { pathParams, body, ...options });
    },
    /** Новая версия ассета */
    uploadOrganizationAssetVersion(id, assetId, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      pathParams["assetId"] = assetId;
      return http.call("uploadOrganizationAssetVersion", { pathParams, body, ...options });
    }
  };
  const payments = {
    /** Создать оплату: пересчитывает статус и остаток документа */
    create(body, options) {
      const pathParams = {};
      return http.call("createPayment", { pathParams, body, ...options });
    },
    /** Удалить оплату и откатить статус */
    delete(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("deletePayment", { pathParams, ...options });
    },
    /** Карточка оплаты */
    get(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("getPayment", { pathParams, ...options });
    },
    /** Оплаты документа и остаток */
    listDocument(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("listDocumentPayments", { pathParams, ...options });
    },
    /** Список оплат */
    list(query, options) {
      const pathParams = {};
      return http.call("listPayments", { pathParams, query, ...options });
    }
  };
  const products = {
    /** Архивировать позицию */
    archive(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("archiveProduct", { pathParams, ...options });
    },
    /** Создать позицию номенклатуры */
    create(body, options) {
      const pathParams = {};
      return http.call("createProduct", { pathParams, body, ...options });
    },
    /** Карточка позиции */
    get(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("getProduct", { pathParams, ...options });
    },
    /** Номенклатура с поиском */
    list(query, options) {
      const pathParams = {};
      return http.call("listProducts", { pathParams, query, ...options });
    },
    /** Изменить позицию */
    update(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("updateProduct", { pathParams, body, ...options });
    }
  };
  const reports = {
    /** Асинхронный экспорт отчёта (XLSX/CSV/JSON) через pg-boss */
    createReportExport(body, options) {
      const pathParams = {};
      return http.call("createReportExport", { pathParams, body, ...options });
    },
    /** Скачать готовый экспорт */
    downloadReportExport(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("downloadReportExport", { pathParams, ...options });
    },
    /** Статус экспорта отчёта */
    getReportExport(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("getReportExport", { pathParams, ...options });
    },
    /** Ведомость оплат за период с документом и контрагентом */
    reportsPayments(query, options) {
      const pathParams = {};
      return http.call("reportsPayments", { pathParams, query, ...options });
    },
    /** Акт сверки: начальное сальдо, обороты, нарастающий итог */
    reportsReconciliation(query, options) {
      const pathParams = {};
      return http.call("reportsReconciliation", { pathParams, query, ...options });
    },
    /** Реестр документов за период: суммы, НДС, статусы */
    reportsRegistry(query, options) {
      const pathParams = {};
      return http.call("reportsRegistry", { pathParams, query, ...options });
    },
    /** Сводка: выставлено, оплачено, долг и просрочка за период */
    reportsSummary(query, options) {
      const pathParams = {};
      return http.call("reportsSummary", { pathParams, query, ...options });
    },
    /** Неоплаченные документы: остаток, просрочка, старые сверху */
    reportsUnpaid(query, options) {
      const pathParams = {};
      return http.call("reportsUnpaid", { pathParams, query, ...options });
    }
  };
  const settings = {
    /** Эффективные значения для контекста */
    getEffective(query, options) {
      const pathParams = {};
      return http.call("getEffectiveSettings", { pathParams, query, ...options });
    },
    /** Публичные настройки (без авторизации) */
    getPublic(options) {
      const pathParams = {};
      return http.call("getPublicSettings", { pathParams, ...options });
    },
    /** Реестр настроек (admin) */
    listSettingDefinitions(options) {
      const pathParams = {};
      return http.call("listSettingDefinitions", { pathParams, ...options });
    },
    /** Сброс настройки к следующему уровню (admin) */
    reset(code, query, options) {
      const pathParams = {};
      pathParams["code"] = code;
      return http.call("resetSetting", { pathParams, query, ...options });
    },
    /** Массовое обновление настроек (admin) */
    update(body, options) {
      const pathParams = {};
      return http.call("updateSettings", { pathParams, body, ...options });
    }
  };
  const shares = {
    /** Создать ссылку на документы (URL показывается один раз) */
    create(body, options) {
      const pathParams = {};
      return http.call("createShare", { pathParams, body, ...options });
    },
    /** Детали, просмотры и ответы */
    get(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("getShare", { pathParams, ...options });
    },
    /** Ответы клиента */
    listShareReplies(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("listShareReplies", { pathParams, ...options });
    },
    /** Ссылки со статусами */
    list(query, options) {
      const pathParams = {};
      return http.call("listShares", { pathParams, query, ...options });
    },
    /** Журнал просмотров */
    listShareViews(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("listShareViews", { pathParams, ...options });
    },
    /** Отозвать ссылку */
    revoke(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("revokeShare", { pathParams, ...options });
    }
  };
  const sharesPublic = {
    /** PDF документа ссылки */
    downloadShareDocumentPdf(token, documentId, options) {
      const pathParams = {};
      pathParams["token"] = token;
      pathParams["documentId"] = documentId;
      return http.call("downloadShareDocumentPdf", { pathParams, ...options });
    },
    /** HTML-страница ссылки */
    openSharePage(token, options) {
      const pathParams = {};
      pathParams["token"] = token;
      return http.call("openSharePage", { pathParams, ...options });
    },
    /** Ответ клиента по ссылке */
    replyToShare(token, body, options) {
      const pathParams = {};
      pathParams["token"] = token;
      return http.call("replyToShare", { pathParams, body, ...options });
    },
    /** Проверить PIN и открыть сессию ссылки */
    verifySharePin(token, body, options) {
      const pathParams = {};
      pathParams["token"] = token;
      return http.call("verifySharePin", { pathParams, body, ...options });
    }
  };
  const system = {
    /** Версия, БД, диск, рендер (admin) */
    getSystemStatus(options) {
      const pathParams = {};
      return http.call("getSystemStatus", { pathParams, ...options });
    },
    /** Ошибки 5xx из ring buffer (admin) */
    listAppErrors(query, options) {
      const pathParams = {};
      return http.call("listAppErrors", { pathParams, query, ...options });
    }
  };
  const templates = {
    /** Архив шаблона (не базовый) */
    archive(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("archiveTemplate", { pathParams, ...options });
    },
    /** Назначить шаблон организации или контрагенту */
    assign(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("assignTemplate", { pathParams, body, ...options });
    },
    /** Создать шаблон (копия базового) */
    create(body, options) {
      const pathParams = {};
      return http.call("createTemplate", { pathParams, body, ...options });
    },
    /** Новая черновая версия */
    createTemplateVersion(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("createTemplateVersion", { pathParams, body, ...options });
    },
    /** Копия шаблона в кабинете */
    duplicate(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("duplicateTemplate", { pathParams, ...options });
    },
    /** Карточка шаблона и версии */
    get(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("getTemplate", { pathParams, ...options });
    },
    /** Версия шаблона целиком */
    getTemplateVersion(id, version, options) {
      const pathParams = {};
      pathParams["id"] = id;
      pathParams["version"] = version;
      return http.call("getTemplateVersion", { pathParams, ...options });
    },
    /** Галерея шаблонов */
    list(query, options) {
      const pathParams = {};
      return http.call("listTemplates", { pathParams, query, ...options });
    },
    /** Предпросмотр на тестовом снимке (html, pdf, png) */
    preview(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("previewTemplate", { pathParams, body, ...options });
    },
    /** Публикация версии после шести проверок */
    publishTemplateVersion(id, version, options) {
      const pathParams = {};
      pathParams["id"] = id;
      pathParams["version"] = version;
      return http.call("publishTemplateVersion", { pathParams, ...options });
    },
    /** Название, ориентация, флаги */
    update(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("updateTemplate", { pathParams, body, ...options });
    }
  };
  const tokens = {
    /** Создать personal-токен (не шире прав роли) */
    createPersonal(body, options) {
      const pathParams = {};
      return http.call("createPersonalToken", { pathParams, body, ...options });
    },
    /** Создать токен (admin), секрет — один раз */
    create(body, options) {
      const pathParams = {};
      return http.call("createToken", { pathParams, body, ...options });
    },
    /** Метаданные токена (admin) */
    get(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("getToken", { pathParams, ...options });
    },
    /** Свои personal-токены */
    listPersonal(options) {
      const pathParams = {};
      return http.call("listPersonalTokens", { pathParams, ...options });
    },
    /** Список токенов кабинета (admin) */
    list(options) {
      const pathParams = {};
      return http.call("listTokens", { pathParams, ...options });
    },
    /** Отозвать свой personal-токен (владелец; идемпотентно) */
    revokePersonal(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("revokePersonalToken", { pathParams, ...options });
    },
    /** Отозвать токен (admin) */
    revoke(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("revokeToken", { pathParams, ...options });
    }
  };
  const units = {
    /** Добавить единицу (admin) */
    create(body, options) {
      const pathParams = {};
      return http.call("createUnit", { pathParams, body, ...options });
    },
    /** Удалить единицу (admin) */
    delete(code, options) {
      const pathParams = {};
      pathParams["code"] = code;
      return http.call("deleteUnit", { pathParams, ...options });
    },
    /** Единицы измерения */
    list(options) {
      const pathParams = {};
      return http.call("listUnits", { pathParams, ...options });
    },
    /** Изменить единицу (admin) */
    update(code, body, options) {
      const pathParams = {};
      pathParams["code"] = code;
      return http.call("updateUnit", { pathParams, body, ...options });
    }
  };
  const users = {
    /** Заблокировать пользователя (admin) */
    block(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("blockUser", { pathParams, ...options });
    },
    /** Создать пользователя (admin) */
    create(body, options) {
      const pathParams = {};
      return http.call("createUser", { pathParams, body, ...options });
    },
    /** Soft delete пользователя (admin) */
    delete(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("deleteUser", { pathParams, ...options });
    },
    /** Карточка пользователя (admin) */
    get(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("getUser", { pathParams, ...options });
    },
    /** Приглашение/переотправка: токен активации в ответе (почта — фаза 2) */
    invite(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("inviteUser", { pathParams, ...options });
    },
    /** Список пользователей (admin) */
    list(query, options) {
      const pathParams = {};
      return http.call("listUsers", { pathParams, query, ...options });
    },
    /** Сброс пароля админом: временный пароль в ответе (один раз) */
    resetUserPassword(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("resetUserPassword", { pathParams, ...options });
    },
    /** Разблокировать пользователя (admin) */
    unblock(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("unblockUser", { pathParams, ...options });
    },
    /** Изменить пользователя (admin) */
    update(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("updateUser", { pathParams, body, ...options });
    }
  };
  const webhooks = {
    /** Создать подписчика (секрет показывается один раз) */
    create(body, options) {
      const pathParams = {};
      return http.call("createWebhook", { pathParams, body, ...options });
    },
    /** Удалить подписчика вместе с журналом */
    delete(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("deleteWebhook", { pathParams, ...options });
    },
    /** Подписчик */
    get(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("getWebhook", { pathParams, ...options });
    },
    /** Журнал доставок */
    listWebhookDeliveries(id, query, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("listWebhookDeliveries", { pathParams, query, ...options });
    },
    /** Подписчики кабинета */
    list(options) {
      const pathParams = {};
      return http.call("listWebhooks", { pathParams, ...options });
    },
    /** Повторить доставку вручную */
    retryWebhookDelivery(id, deliveryId, options) {
      const pathParams = {};
      pathParams["id"] = id;
      pathParams["deliveryId"] = deliveryId;
      return http.call("retryWebhookDelivery", { pathParams, ...options });
    },
    /** Новый секрет подписи */
    rotateWebhookSecret(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("rotateWebhookSecret", { pathParams, ...options });
    },
    /** Тестовая доставка (синхронно) */
    test(id, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("testWebhook", { pathParams, ...options });
    },
    /** Изменить адрес, события, активность */
    update(id, body, options) {
      const pathParams = {};
      pathParams["id"] = id;
      return http.call("updateWebhook", { pathParams, body, ...options });
    }
  };
  return {
    audit,
    auth,
    banks,
    contracts,
    counterparties,
    dataExports,
    dataImports,
    devices,
    documents,
    files,
    health,
    imports,
    notes,
    organizations,
    payments,
    products,
    reports,
    settings,
    shares,
    sharesPublic,
    system,
    templates,
    tokens,
    units,
    users,
    webhooks
  };
}

// packages/sdk/dist/index.js
function createSdk(options) {
  return createApiSdk(createApiHttpClient(options));
}

// apps/mcp/dist/version.js
var SERVER_NAME = "invoices-mcp";
var SERVER_VERSION = true ? "0.1.0" : "0.0.0";

// apps/mcp/dist/api/client.js
function createApiClient(config, options = {}) {
  return createSdk({
    baseUrl: config.apiUrl,
    accessToken: config.apiToken,
    timeoutMs: config.timeoutMs,
    headers: { "X-Client": `${SERVER_NAME}/${SERVER_VERSION}` },
    ...options.fetch ? { fetch: options.fetch } : {}
  });
}

// apps/mcp/dist/api/errors.js
var NETWORK_CODES = /* @__PURE__ */ new Set([
  "ECONNREFUSED",
  "ECONNRESET",
  "ENOTFOUND",
  "EAI_AGAIN",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "ETIMEDOUT"
]);
function serviceUnavailable(context) {
  return `\u0421\u0435\u0440\u0432\u0438\u0441 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D (INVOICES_API_URL=${context.apiUrl}). \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0430\u0434\u0440\u0435\u0441 \u0438 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0441\u0442\u044C: curl ${context.apiUrl}/health/live`;
}
function networkCodeOf(error) {
  const cause = error?.cause;
  const code = cause?.code;
  return typeof code === "string" ? code : void 0;
}
function isBadPort(error) {
  const cause = error?.cause;
  return typeof cause?.message === "string" && cause.message.includes("bad port");
}
function validationDetails(items) {
  const shown = items.slice(0, 5).map((item) => item.field === void 0 ? item.message : `${item.field}: ${item.message}`);
  const rest = items.length - shown.length;
  return `${shown.join("; ")}${rest > 0 ? ` (\u0435\u0449\u0451 ${rest})` : ""}`;
}
function describeApiError(error, context) {
  if (error instanceof ApiError) {
    const { status, code, problem, requestId } = error;
    const detail = problem?.detail ?? error.message;
    if (status === 401) {
      return "\u0422\u043E\u043A\u0435\u043D \u043D\u0435\u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u0435\u043D, \u0438\u0441\u0442\u0451\u043A \u0438\u043B\u0438 \u043E\u0442\u043E\u0437\u0432\u0430\u043D. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 INVOICES_API_TOKEN \u0438 \u043F\u0440\u0438 \u043D\u0435\u043E\u0431\u0445\u043E\u0434\u0438\u043C\u043E\u0441\u0442\u0438 \u0441\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043D\u043E\u0432\u044B\u0439 \u0432 \u0430\u0434\u043C\u0438\u043D\u043A\u0435 \u2192 \xAB\u0422\u043E\u043A\u0435\u043D\u044B\xBB.";
    }
    if (status === 403 && code === "IP_NOT_ALLOWED") {
      return "IP \u044D\u0442\u043E\u0433\u043E \u043A\u043B\u0438\u0435\u043D\u0442\u0430 \u043D\u0435 \u0432 \u0441\u043F\u0438\u0441\u043A\u0435 \u0440\u0430\u0437\u0440\u0435\u0448\u0451\u043D\u043D\u044B\u0445 \u0443 \u0442\u043E\u043A\u0435\u043D\u0430. \u041F\u043E\u043F\u0440\u043E\u0441\u0438\u0442\u0435 \u0430\u0434\u043C\u0438\u043D\u0430 \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C IP \u0438\u043B\u0438 \u043E\u0447\u0438\u0441\u0442\u0438\u0442\u044C allowlist \u0442\u043E\u043A\u0435\u043D\u0430.";
    }
    if (status === 403) {
      const scope = code === "SCOPE_FORBIDDEN" ? detail : void 0;
      return `\u0423 \u0442\u043E\u043A\u0435\u043D\u0430 \u043D\u0435\u0442 \u043D\u0443\u0436\u043D\u043E\u0433\u043E \u043F\u0440\u0430\u0432\u0430${scope ? ` (${scope})` : ""}. \u041F\u043E\u043F\u0440\u043E\u0441\u0438\u0442\u0435 \u0430\u0434\u043C\u0438\u043D\u0430 \u0432\u044B\u0434\u0430\u0442\u044C \u0442\u043E\u043A\u0435\u043D \u0441 \u044D\u0442\u0438\u043C \u043F\u0440\u0430\u0432\u043E\u043C \u0438\u043B\u0438 \u0432\u044B\u043F\u043E\u043B\u043D\u0438\u0442\u0435 \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u044E \u0432 \u043A\u0430\u0431\u0438\u043D\u0435\u0442\u0435.`;
    }
    if (status === 404 && code === "UNIT_NOT_FOUND") {
      return "\u0415\u0434\u0438\u043D\u0438\u0446\u0430 \u0438\u0437\u043C\u0435\u0440\u0435\u043D\u0438\u044F \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u0430. \u0412\u043E\u0437\u044C\u043C\u0438\u0442\u0435 \u043A\u043E\u0434 \u0438\u0437 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0438\u0445 \u043F\u043E\u0437\u0438\u0446\u0438\u0439 (invoices_products_list) \u2014 \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440, \xAB\u0448\u0442\xBB; \u0441\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A \u0435\u0434\u0438\u043D\u0438\u0446 \u2014 \u0432 \u043A\u0430\u0431\u0438\u043D\u0435\u0442\u0435.";
    }
    if (status === 404) {
      return `\u041D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u043E \u0438\u043B\u0438 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E \u044D\u0442\u043E\u043C\u0443 \u0442\u043E\u043A\u0435\u043D\u0443: ${detail}. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0438\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u043F\u043E\u0438\u0441\u043A\u043E\u043C.`;
    }
    if (status === 409) {
      return `\u041A\u043E\u043D\u0444\u043B\u0438\u043A\u0442: ${detail}. \u041F\u0435\u0440\u0435\u0447\u0438\u0442\u0430\u0439\u0442\u0435 \u043E\u0431\u044A\u0435\u043A\u0442 \u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0435.`;
    }
    if (status === 422) {
      const items = problem?.errors ?? [];
      return items.length > 0 ? `\u0414\u0430\u043D\u043D\u044B\u0435 \u043D\u0435 \u043F\u0440\u0438\u043D\u044F\u0442\u044B: ${validationDetails(items)}. \u0418\u0441\u043F\u0440\u0430\u0432\u044C\u0442\u0435 \u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435.` : `\u0414\u0430\u043D\u043D\u044B\u0435 \u043D\u0435 \u043F\u0440\u0438\u043D\u044F\u0442\u044B: ${detail}. \u0418\u0441\u043F\u0440\u0430\u0432\u044C\u0442\u0435 \u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435.`;
    }
    if (status === 429) {
      return "\u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u043B\u0438\u043C\u0438\u0442 \u0437\u0430\u043F\u0440\u043E\u0441\u043E\u0432 \u043A API. \u041F\u043E\u0434\u043E\u0436\u0434\u0438\u0442\u0435 \u043C\u0438\u043D\u0443\u0442\u0443 \u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435.";
    }
    if (status >= 500) {
      return `\u041E\u0448\u0438\u0431\u043A\u0430 \u0441\u0435\u0440\u0432\u0438\u0441\u0430 (${status}): ${detail}. ${requestId ? `requestId: ${requestId} \u2014 \u043F\u0435\u0440\u0435\u0434\u0430\u0439\u0442\u0435 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0443.` : "\u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u043F\u043E\u0437\u0436\u0435."}`;
    }
    if (status === 0) {
      return detail === "\u041F\u0440\u0435\u0432\u044B\u0448\u0435\u043D \u0442\u0430\u0439\u043C\u0430\u0443\u0442 \u0437\u0430\u043F\u0440\u043E\u0441\u0430" ? `API \u043D\u0435 \u043E\u0442\u0432\u0435\u0442\u0438\u043B \u0437\u0430 \u043E\u0442\u0432\u0435\u0434\u0451\u043D\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F. \u0423\u0432\u0435\u043B\u0438\u0447\u044C\u0442\u0435 INVOICES_TIMEOUT_MS \u0438\u043B\u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0441\u0442\u044C (${context.apiUrl}).` : serviceUnavailable(context);
    }
    return `${detail} (${status}${code ? ` ${code}` : ""})`;
  }
  const networkCode = networkCodeOf(error);
  if (networkCode !== void 0 && NETWORK_CODES.has(networkCode)) {
    return serviceUnavailable(context);
  }
  if (isBadPort(error)) {
    return `\u041F\u043E\u0440\u0442 \u0432 INVOICES_API_URL \u0437\u0430\u043F\u0440\u0435\u0449\u0451\u043D \u0441\u0442\u0430\u043D\u0434\u0430\u0440\u0442\u043E\u043C fetch (\u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440, 1, 9, 25). \u0423\u043A\u0430\u0436\u0438\u0442\u0435 \u0440\u0430\u0431\u043E\u0447\u0438\u0439 \u043F\u043E\u0440\u0442 API: ${context.apiUrl}`;
  }
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "\u0417\u0430\u043F\u0440\u043E\u0441 \u043E\u0442\u043C\u0435\u043D\u0451\u043D \u043A\u043B\u0438\u0435\u043D\u0442\u043E\u043C.";
    }
    return `\u0412\u043D\u0443\u0442\u0440\u0435\u043D\u043D\u044F\u044F \u043E\u0448\u0438\u0431\u043A\u0430 MCP: ${error.message}. \u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u0437\u0430\u043F\u0440\u043E\u0441; \u0435\u0441\u043B\u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u0435\u0442\u0441\u044F \u2014 \u0441\u043E\u043E\u0431\u0449\u0438\u0442\u0435 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0443 \u0438 \u043F\u0440\u0438\u043B\u043E\u0436\u0438\u0442\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442\u0430.`;
  }
  return "\u041D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430\u044F \u043E\u0448\u0438\u0431\u043A\u0430 \u043F\u0440\u0438 \u043E\u0431\u0440\u0430\u0449\u0435\u043D\u0438\u0438 \u043A API.";
}

// apps/mcp/dist/api/probe.js
var SUPPORTED_API_MAJOR = 1;
function majorOf(version) {
  const [head] = version.split(".");
  if (head === void 0)
    return void 0;
  const major = Number.parseInt(head, 10);
  return Number.isInteger(major) ? major : void 0;
}
async function probeApi(sdk, config, logger) {
  const messages = [];
  try {
    await sdk.health.healthCheck();
  } catch (error) {
    const message = describeApiError(error, { apiUrl: config.apiUrl });
    logger.error("api.probe.unreachable", { apiUrl: config.apiUrl });
    return { reachable: false, authorized: false, messages: [message] };
  }
  let authorized = true;
  try {
    await sdk.organizations.list({ limit: 1 });
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      authorized = false;
      messages.push(describeApiError(error, { apiUrl: config.apiUrl }));
      logger.error("api.probe.unauthorized", { status: 401, code: error.code });
      return { reachable: true, authorized, messages };
    }
    messages.push(`\u041F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u0435: \u0431\u0430\u0437\u043E\u0432\u044B\u0435 \u0441\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A\u0438 \u043D\u0435\u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B \u044D\u0442\u043E\u043C\u0443 \u0442\u043E\u043A\u0435\u043D\u0443 \u2014 ${describeApiError(error, {
      apiUrl: config.apiUrl
    })}`);
    logger.warn("api.probe.scope_limited", {
      status: error instanceof ApiError ? error.status : void 0,
      code: error instanceof ApiError ? error.code : void 0
    });
  }
  try {
    const status = await sdk.system.getSystemStatus();
    const major = majorOf(status.version);
    logger.debug("api.version", { version: status.version });
    if (major !== void 0 && major !== 0 && major !== SUPPORTED_API_MAJOR) {
      messages.push(`\u041F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u0435: \u0432\u0435\u0440\u0441\u0438\u044F API ${status.version} \u043D\u0435 \u0441\u043E\u0432\u043F\u0430\u0434\u0430\u0435\u0442 \u0441 \u043A\u043E\u043D\u0442\u0440\u0430\u043A\u0442\u043E\u043C /api/v${SUPPORTED_API_MAJOR}, \u043F\u043E \u043A\u043E\u0442\u043E\u0440\u043E\u043C\u0443 \u0441\u043E\u0431\u0440\u0430\u043D MCP. \u041E\u0431\u043D\u043E\u0432\u0438\u0442\u0435 MCP \u0438\u043B\u0438 API.`);
    }
    return { reachable: true, authorized, apiVersion: status.version, messages };
  } catch (error) {
    logger.debug("api.version_unavailable", {
      status: error instanceof ApiError ? error.status : void 0
    });
    return { reachable: true, authorized, messages };
  }
}

// apps/mcp/dist/config.js
import { z } from "zod";
var TOKEN_PATTERN = /^ivs_[A-Za-z0-9]{8}_[A-Za-z0-9_-]{20,}$/;
var LOCAL_HOSTNAMES = /* @__PURE__ */ new Set(["localhost", "127.0.0.1", "::1", "[::1]"]);
var ConfigError = class extends Error {
  problems;
  constructor(problems) {
    super(problems.join("\n"));
    this.name = "ConfigError";
    this.problems = problems;
  }
};
var EnvSchema = z.object({
  INVOICES_API_URL: z.string().trim().min(1, "\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u0430 \u2014 \u0431\u0430\u0437\u043E\u0432\u044B\u0439 URL API"),
  INVOICES_API_TOKEN: z.string().trim().regex(TOKEN_PATTERN, "\u043E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F \u0441\u0435\u0440\u0432\u0438\u0441\u043D\u044B\u0439 \u0442\u043E\u043A\u0435\u043D \u0432\u0438\u0434\u0430 ivs_<kid>_<secret> (\u0430\u0434\u043C\u0438\u043D\u043A\u0430 \u2192 \u0422\u043E\u043A\u0435\u043D\u044B)"),
  INVOICES_TIMEOUT_MS: z.coerce.number().int().min(500).max(3e5).default(1e4),
  INVOICES_LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  INVOICES_MCP_TRANSPORT: z.enum(["stdio", "http"]).default("stdio"),
  INVOICES_MCP_PORT: z.coerce.number().int().min(1).max(65535).default(7331)
});
function normalizeApiUrl(raw) {
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new ConfigError([
      "INVOICES_API_URL: \u043E\u0436\u0438\u0434\u0430\u0435\u0442\u0441\u044F \u0430\u0431\u0441\u043E\u043B\u044E\u0442\u043D\u044B\u0439 URL, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 http://localhost:8080"
    ]);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ConfigError([
      `INVOICES_API_URL: \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u044E\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E http \u0438 https, \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u043E \xAB${url.protocol}\xBB`
    ]);
  }
  if (url.protocol === "http:" && !LOCAL_HOSTNAMES.has(url.hostname)) {
    throw new ConfigError([
      `INVOICES_API_URL: http \u0440\u0430\u0437\u0440\u0435\u0448\u0451\u043D \u0442\u043E\u043B\u044C\u043A\u043E \u0434\u043B\u044F \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u043E\u0439 \u0440\u0430\u0437\u0440\u0430\u0431\u043E\u0442\u043A\u0438 (localhost, 127.0.0.1), \u0434\u043B\u044F \xAB${url.hostname}\xBB \u043D\u0443\u0436\u0435\u043D https`
    ]);
  }
  const path = url.pathname.replace(/\/+$/, "");
  if (path !== "") {
    throw new ConfigError([
      `INVOICES_API_URL: \u0443\u043A\u0430\u0436\u0438\u0442\u0435 \u0431\u0430\u0437\u043E\u0432\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 \u0431\u0435\u0437 \u043F\u0443\u0442\u0438 \u0438 \u0431\u0435\u0437 /api/v1 \u2014 \xAB${path}\xBB \u043B\u0438\u0448\u043D\u0438\u0439, SDK \u0434\u043E\u0431\u0430\u0432\u043B\u044F\u0435\u0442 /api/v1 \u0441\u0430\u043C`
    ]);
  }
  if (url.search !== "" || url.hash !== "") {
    throw new ConfigError(["INVOICES_API_URL: \u0431\u0435\u0437 query \u0438 \u044F\u043A\u043E\u0440\u044F \u2014 \u0442\u043E\u043B\u044C\u043A\u043E \u0431\u0430\u0437\u043E\u0432\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 API"]);
  }
  return url.origin;
}
function loadConfig(env) {
  const problems = [];
  const parsed = EnvSchema.safeParse(env);
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      const field = issue.path.join(".");
      problems.push(field === "" ? issue.message : `${field}: ${issue.message}`);
    }
    throw new ConfigError(problems);
  }
  let apiUrl;
  try {
    apiUrl = normalizeApiUrl(parsed.data.INVOICES_API_URL);
  } catch (error) {
    if (error instanceof ConfigError)
      throw error;
    throw error;
  }
  const token = parsed.data.INVOICES_API_TOKEN;
  return {
    apiUrl,
    apiToken: token,
    tokenKid: token.slice("ivs_".length, "ivs_".length + 8),
    timeoutMs: parsed.data.INVOICES_TIMEOUT_MS,
    logLevel: parsed.data.INVOICES_LOG_LEVEL,
    transport: parsed.data.INVOICES_MCP_TRANSPORT,
    port: parsed.data.INVOICES_MCP_PORT
  };
}

// apps/mcp/dist/http.js
import { createServer as createHttpServer } from "node:http";
import { localhostHostValidation, localhostOriginValidation, toNodeHandler } from "@modelcontextprotocol/node";
import { createMcpHandler } from "@modelcontextprotocol/server";

// apps/mcp/dist/server.js
import { McpServer } from "@modelcontextprotocol/server";

// apps/mcp/dist/instructions.js
var INSTRUCTIONS = [
  '\u0421\u0435\u0440\u0432\u0438\u0441 \u0441\u0447\u0435\u0442\u043E\u0432 \u0438 \u0430\u043A\u0442\u043E\u0432. \u0414\u0435\u043D\u044C\u0433\u0438 \u2014 \u0441\u0442\u0440\u043E\u043A\u0438 "124000.00", \u0434\u0430\u0442\u044B \u2014 DD.MM.YYYY.',
  "\u041F\u0435\u0440\u0435\u0434 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435\u043C: \u043D\u0430\u0439\u0434\u0438 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044E \u0438 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430 (invoices_organizations_list,",
  "invoices_contractors_search). \u041D\u0435 \u043F\u0440\u0438\u0434\u0443\u043C\u044B\u0432\u0430\u0439 \u0446\u0435\u043D\u044B \u0438 \u0441\u0443\u043C\u043C\u044B \u2014 \u0435\u0441\u043B\u0438 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u044B, \u0441\u043F\u0440\u043E\u0441\u0438.",
  "\u0427\u0435\u0440\u043D\u043E\u0432\u0438\u043A \u0441\u043E\u0437\u0434\u0430\u0451\u0442\u0441\u044F \u0431\u0435\u0437 \u0432\u044B\u0434\u0430\u0447\u0438. \u0412\u044B\u0434\u0430\u0447\u0430, \u0430\u043D\u043D\u0443\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435, \u043E\u043F\u043B\u0430\u0442\u0430, \u0441\u0441\u044B\u043B\u043A\u0430 \u0438 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435",
  "\u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430 \u0442\u0440\u0435\u0431\u0443\u044E\u0442 confirm: true \u0438 \u044F\u0432\u043D\u043E\u0433\u043E \u0441\u043E\u0433\u043B\u0430\u0441\u0438\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F.",
  "\u0422\u043E\u043A\u0435\u043D \u0442\u043E\u043B\u044C\u043A\u043E \u0434\u043B\u044F \u0447\u0442\u0435\u043D\u0438\u044F \u043D\u0435 \u043F\u043E\u0437\u0432\u043E\u043B\u044F\u0435\u0442 \u0438\u0437\u043C\u0435\u043D\u044F\u0442\u044C \u0434\u0430\u043D\u043D\u044B\u0435. \u041D\u0435 \u0437\u0430\u043F\u0440\u0430\u0448\u0438\u0432\u0430\u0439 \u0430\u0434\u043C\u0438\u043D\u0441\u043A\u0438\u0435",
  "\u043E\u043F\u0435\u0440\u0430\u0446\u0438\u0438. \u041F\u043E\u0434\u0440\u043E\u0431\u043D\u044B\u0435 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0438 \u2014 \u0440\u0435\u0441\u0443\u0440\u0441 skill://invoices \u0438\u043B\u0438 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442 invoices_help.",
  "\u0421\u0435\u0440\u0432\u0435\u0440 \u043F\u0435\u0440\u0435\u0434\u0430\u0451\u0442 \u0434\u0430\u043D\u043D\u044B\u0435 \u043A\u0430\u0431\u0438\u043D\u0435\u0442\u0430 \u0432 \u043C\u043E\u0434\u0435\u043B\u044C \u043A\u043B\u0438\u0435\u043D\u0442\u0430 (\u0432\u043A\u043B\u044E\u0447\u0430\u044F \u043B\u043E\u043A\u0430\u043B\u044C\u043D\u044B\u0435 \u043C\u043E\u0434\u0435\u043B\u0438).",
  "\u041D\u0435 \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u0435\u0433\u043E \u0434\u043B\u044F \u0434\u0430\u043D\u043D\u044B\u0445, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u043D\u0435\u043B\u044C\u0437\u044F \u043E\u0431\u0440\u0430\u0431\u0430\u0442\u044B\u0432\u0430\u0442\u044C \u0432\u044B\u0431\u0440\u0430\u043D\u043D\u043E\u0439 \u043C\u043E\u0434\u0435\u043B\u044C\u044E;",
  "\u0440\u0435\u043A\u043E\u043C\u0435\u043D\u0434\u0443\u0435\u0442\u0441\u044F \u0442\u043E\u043A\u0435\u043D \u0442\u043E\u043B\u044C\u043A\u043E \u0434\u043B\u044F \u0447\u0442\u0435\u043D\u0438\u044F."
].join("\n");

// apps/mcp/dist/prompts/act-from-invoice.js
import { z as z2 } from "zod";

// apps/mcp/dist/prompts/shared.js
var PROMPT_RULES = "\u041F\u0440\u0430\u0432\u0438\u043B\u0430: \u0441\u0443\u043C\u043C\u044B \u0438 \u0434\u0430\u0442\u044B \u2014 \u0442\u043E\u043B\u044C\u043A\u043E \u0438\u0437 API, \u043D\u0435 \u043F\u0435\u0440\u0435\u0441\u0447\u0438\u0442\u044B\u0432\u0430\u0439 \u0438\u0445 \u0432\u0440\u0443\u0447\u043D\u0443\u044E. \u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0437\u0430\u043F\u0438\u0441\u044B\u0432\u0430\u0439 \u0431\u0435\u0437 \u044F\u0432\u043D\u043E\u0433\u043E \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F. \u0415\u0441\u043B\u0438 \u043F\u0440\u0430\u0432 \u0442\u043E\u043A\u0435\u043D\u0430 \u043D\u0435 \u0445\u0432\u0430\u0442\u0430\u0435\u0442 \u2014 \u0441\u043A\u0430\u0436\u0438 \u043E\u0431 \u044D\u0442\u043E\u043C \u043F\u0440\u044F\u043C\u043E.";
function userPrompt(text) {
  return {
    messages: [{ role: "user", content: { type: "text", text } }]
  };
}

// apps/mcp/dist/prompts/act-from-invoice.js
var PROMPT = "invoices_prompt_act_from_invoice";
var Args = z2.object({
  number: z2.string().trim().min(1).describe("\u041D\u043E\u043C\u0435\u0440 \u0441\u0447\u0451\u0442\u0430, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 \u0421\u0427-2026-0043")
});
function registerActFromInvoicePrompt(server) {
  server.registerPrompt(PROMPT, {
    title: "\u0410\u043A\u0442 \u043F\u043E \u0441\u0447\u0451\u0442\u0443",
    description: "\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0439 \u0437\u0430\u043A\u0440\u044B\u0442\u0438\u044F \u0441\u0447\u0451\u0442\u0430 \u0430\u043A\u0442\u043E\u043C: \u043F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u043F\u043E\u0437\u0438\u0446\u0438\u0438 \u0438 \u0441\u0443\u043C\u043C\u044B \u0438\u0437 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 \u0441\u0447\u0451\u0442\u0430, \u0434\u043E\u0436\u0434\u0430\u0442\u044C\u0441\u044F \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F, \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0430\u043A\u0442 \u0438 \u0432\u044B\u0434\u0430\u0442\u044C \u0435\u0433\u043E.",
    argsSchema: Args
  }, ({ number }) => userPrompt([
    `\u0421\u043E\u0437\u0434\u0430\u0439 \u0430\u043A\u0442 \u043F\u043E \u0441\u0447\u0451\u0442\u0443 ${number}. \u0415\u0441\u043B\u0438 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044C \u043D\u0435 \u0443\u0442\u043E\u0447\u043D\u0438\u043B \u2014 \u043F\u043E\u043B\u043D\u043E\u0435 \u0437\u0430\u043A\u0440\u044B\u0442\u0438\u0435.`,
    "\u041F\u043E\u043A\u0430\u0436\u0438, \u043A\u0430\u043A\u0438\u0435 \u043F\u043E\u0437\u0438\u0446\u0438\u0438 \u0438 \u0441\u0443\u043C\u043C\u044B \u0432\u043E\u0439\u0434\u0443\u0442 \u0432 \u0430\u043A\u0442, \u0434\u043E\u0436\u0434\u0438\u0441\u044C \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F,",
    "\u0437\u0430\u0442\u0435\u043C invoices_documents_create_act \u0438 (\u043F\u043E\u0441\u043B\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F) invoices_documents_issue.",
    "",
    "\u041F\u043E\u0437\u0438\u0446\u0438\u0438 \u0438 \u0441\u0443\u043C\u043C\u044B \u0432\u043E\u0437\u044C\u043C\u0438 \u0438\u0437 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0438 \u0441\u0447\u0451\u0442\u0430 (invoices_documents_search \u043F\u043E \u043D\u043E\u043C\u0435\u0440\u0443, \u0437\u0430\u0442\u0435\u043C invoices_documents_get).",
    "",
    PROMPT_RULES
  ].join("\n")));
}

// apps/mcp/dist/prompts/contractor-summary.js
import { z as z3 } from "zod";
var PROMPT2 = "invoices_prompt_contractor_summary";
var Args2 = z3.object({
  contractor: z3.string().trim().min(1).describe("\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442: \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0438\u043B\u0438 \u0418\u041D\u041D"),
  period: z3.string().trim().min(1).optional().describe("\u041F\u0435\u0440\u0438\u043E\u0434 \u0441\u0432\u043E\u0434\u043A\u0438 (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)")
});
function registerContractorSummaryPrompt(server) {
  server.registerPrompt(PROMPT2, {
    title: "\u0421\u0432\u043E\u0434\u043A\u0430 \u043F\u043E \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0443",
    description: "\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0439 \u0441\u0432\u043E\u0434\u043A\u0438: \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043E, \u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043E, \u0434\u043E\u043B\u0433, \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u043A\u0430, \u043D\u0435\u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043D\u044B\u0435 \u0441\u0447\u0435\u0442\u0430 \u0438 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u2014 \u0438\u0437 invoices_contractors_summary \u0438 invoices_reports_unpaid.",
    argsSchema: Args2
  }, ({ contractor, period }) => userPrompt([
    `\u0421\u0434\u0435\u043B\u0430\u0439 \u0441\u0432\u043E\u0434\u043A\u0443 \u043F\u043E \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0443 ${contractor}${period === void 0 ? "" : ` \u0437\u0430 ${period}`}:`,
    "- \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043E, \u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043E, \u0434\u043E\u043B\u0433, \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u043A\u0430;",
    "- \u0434\u0438\u043D\u0430\u043C\u0438\u043A\u0430 \u043F\u043E \u043C\u0435\u0441\u044F\u0446\u0430\u043C;",
    "- \u043D\u0435\u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043D\u044B\u0435 \u0441\u0447\u0435\u0442\u0430 \u0441 \u0434\u043D\u044F\u043C\u0438 \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u043A\u0438;",
    "- \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B.",
    "\u0418\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439 invoices_contractors_summary \u0438 invoices_reports_unpaid. \u041D\u0435 \u043F\u0435\u0440\u0435\u0441\u0447\u0438\u0442\u044B\u0432\u0430\u0439 \u0441\u0443\u043C\u043C\u044B \u0432\u0440\u0443\u0447\u043D\u0443\u044E.",
    ...period === void 0 ? ["", "\u041F\u0435\u0440\u0438\u043E\u0434 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D \u2014 \u0443\u0442\u043E\u0447\u043D\u0438 \u0435\u0433\u043E \u0443 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F, \u043F\u0440\u0435\u0436\u0434\u0435 \u0447\u0435\u043C \u0441\u0447\u0438\u0442\u0430\u0442\u044C."] : [],
    "",
    PROMPT_RULES
  ].join("\n")));
}

// apps/mcp/dist/prompts/create-invoice.js
import { z as z4 } from "zod";
var PROMPT3 = "invoices_prompt_create_invoice";
var Args3 = z4.object({
  organization: z4.string().trim().min(1).describe("\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F: \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0438\u043B\u0438 ID"),
  contractor: z4.string().trim().min(1).describe("\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442: \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435 \u0438\u043B\u0438 \u0418\u041D\u041D"),
  description: z4.string().trim().min(1).describe("\u0427\u0442\u043E \u0432\u044B\u0441\u0442\u0430\u0432\u0438\u0442\u044C: \u0440\u0430\u0431\u043E\u0442\u044B, \u0443\u0441\u043B\u0443\u0433\u0438, \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E, \u0435\u0434\u0438\u043D\u0438\u0446\u0430, \u0446\u0435\u043D\u0430"),
  period: z4.string().trim().min(1).optional().describe("\u041F\u0435\u0440\u0438\u043E\u0434 \u0438\u043B\u0438 \u0434\u0430\u0442\u0430 \u0441\u0447\u0451\u0442\u0430 (\u043D\u0435\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)")
});
function registerCreateInvoicePrompt(server) {
  server.registerPrompt(PROMPT3, {
    title: "\u0421\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u0447\u0451\u0442 \u043F\u043E \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u044E",
    description: "\u041F\u043E\u0448\u0430\u0433\u043E\u0432\u044B\u0439 \u0441\u0446\u0435\u043D\u0430\u0440\u0438\u0439: \u043D\u0430\u0439\u0442\u0438 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044E \u0438 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430, \u0440\u0430\u0437\u043B\u043E\u0436\u0438\u0442\u044C \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043D\u0430 \u043F\u043E\u0437\u0438\u0446\u0438\u0438, \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A, \u0432\u044B\u0434\u0430\u0442\u044C \u043F\u043E\u0441\u043B\u0435 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F \u0438 \u0434\u0430\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443 \u043D\u0430 PDF.",
    argsSchema: Args3
  }, ({ organization, contractor, description, period }) => userPrompt([
    `\u0421\u043E\u0437\u0434\u0430\u0439 \u0441\u0447\u0451\u0442 \u043F\u043E \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u044E. \u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F: ${organization}. \u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442: ${contractor}.`,
    `\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u0440\u0430\u0431\u043E\u0442/\u0443\u0441\u043B\u0443\u0433: ${description}.${period === void 0 ? "" : ` \u041F\u0435\u0440\u0438\u043E\u0434: ${period}.`}`,
    "",
    "\u0428\u0430\u0433\u0438:",
    "1. \u041D\u0430\u0439\u0434\u0438 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044E (invoices_organizations_list) \u0438 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430 (invoices_contractors_search \u043F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E/\u0418\u041D\u041D).",
    "   \u0415\u0441\u043B\u0438 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430 \u043D\u0435\u0442 \u2014 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0438 \u0441\u043E\u0437\u0434\u0430\u0442\u044C (invoices_contractors_create), \u043D\u043E \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u0432\u0430\u0439 \u0431\u0435\u0437 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F.",
    "2. \u0420\u0430\u0437\u0431\u0435\u0439 \u043E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043D\u0430 \u043F\u043E\u0437\u0438\u0446\u0438\u0438: \u043D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435, \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E, \u0435\u0434\u0438\u043D\u0438\u0446\u0430, \u0446\u0435\u043D\u0430.",
    "   \u0415\u0441\u043B\u0438 \u0446\u0435\u043D\u0430 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D\u0430 \u2014 \u0441\u043F\u0440\u043E\u0441\u0438. \u041D\u0435 \u0432\u044B\u0434\u0443\u043C\u044B\u0432\u0430\u0439 \u0441\u0443\u043C\u043C\u044B.",
    "3. \u0421\u043E\u0437\u0434\u0430\u0439 \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A (invoices_documents_create_draft) \u0438 \u043F\u043E\u043A\u0430\u0436\u0438 \u0442\u0430\u0431\u043B\u0438\u0446\u0443 \u043F\u043E\u0437\u0438\u0446\u0438\u0439 \u0438 \u0438\u0442\u043E\u0433.",
    "4. \u0421\u043F\u0440\u043E\u0441\u0438 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435 \u043D\u0430 \u0432\u044B\u0434\u0430\u0447\u0443. \u0412\u044B\u0434\u0430\u0432\u0430\u0439 \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u0441\u043B\u0435 \u044F\u0432\u043D\u043E\u0433\u043E \xAB\u0434\u0430\xBB (invoices_documents_issue, confirm: true).",
    "5. \u0414\u0430\u0439 \u0441\u0441\u044B\u043B\u043A\u0443 \u043D\u0430 PDF (invoices_documents_pdf_link).",
    "",
    PROMPT_RULES
  ].join("\n")));
}

// apps/mcp/dist/prompts/unpaid-review.js
var PROMPT4 = "invoices_prompt_unpaid_review";
function registerUnpaidReviewPrompt(server) {
  server.registerPrompt(PROMPT4, {
    title: "\u041F\u0440\u043E\u0432\u0435\u0440\u043A\u0430 \u0434\u0435\u0431\u0438\u0442\u043E\u0440\u043A\u0438",
    description: "\u0421\u0446\u0435\u043D\u0430\u0440\u0438\u0439 \u0440\u0430\u0437\u0431\u043E\u0440\u0430 \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u0435\u043D\u043D\u043E\u0439 \u0434\u0435\u0431\u0438\u0442\u043E\u0440\u043A\u0438: \u0441\u0433\u0440\u0443\u043F\u043F\u0438\u0440\u043E\u0432\u0430\u0442\u044C \u043F\u043E \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430\u043C, \u043E\u0442\u043C\u0435\u0442\u0438\u0442\u044C \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u043A\u0443 \u0431\u043E\u043B\u044C\u0448\u0435 30 \u0434\u043D\u0435\u0439 \u0438 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0438\u0442\u044C \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0435 \u0448\u0430\u0433\u0438."
  }, () => userPrompt([
    "\u041F\u0440\u043E\u0432\u0435\u0440\u044C \u0434\u0435\u0431\u0438\u0442\u043E\u0440\u043A\u0443: invoices_reports_unpaid. \u0421\u0433\u0440\u0443\u043F\u043F\u0438\u0440\u0443\u0439 \u043F\u043E \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430\u043C,",
    "\u043E\u0442\u043C\u0435\u0442\u044C \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u043A\u0443 > 30 \u0434\u043D\u0435\u0439, \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0438 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0438\u0435 \u0448\u0430\u0433\u0438 (\u043D\u0430\u043F\u043E\u043C\u043D\u0438\u0442\u044C, \u0432\u044B\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0430\u043A\u0442, \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443).",
    "",
    "\u0428\u0430\u0433\u0438 (\u0430\u043A\u0442, \u0441\u0441\u044B\u043B\u043A\u0430, \u043D\u0430\u043F\u043E\u043C\u0438\u043D\u0430\u043D\u0438\u0435) \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u0440\u0435\u0434\u043B\u0430\u0433\u0430\u0439: \u0432\u044B\u043F\u043E\u043B\u043D\u044F\u0439 \u0438\u0445 \u043F\u043E\u0441\u043B\u0435 \u044F\u0432\u043D\u043E\u0433\u043E \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F.",
    "",
    PROMPT_RULES
  ].join("\n")));
}

// apps/mcp/dist/prompts/index.js
function registerPrompts(server) {
  registerCreateInvoicePrompt(server);
  registerContractorSummaryPrompt(server);
  registerUnpaidReviewPrompt(server);
  registerActFromInvoicePrompt(server);
}

// apps/mcp/dist/resources/contracts.js
import { ResourceTemplate } from "@modelcontextprotocol/server";

// apps/mcp/dist/api/pagination.js
var DEFAULT_LIMIT = 20;
var MAX_LIMIT = 100;
var PaginationError = class extends Error {
  constructor(message) {
    super(message);
    this.name = "PaginationError";
  }
};
function resolveLimit(value, fallback = DEFAULT_LIMIT) {
  if (value === void 0)
    return fallback;
  if (!Number.isInteger(value) || value < 1) {
    throw new PaginationError(`limit \u0434\u043E\u043B\u0436\u0435\u043D \u0431\u044B\u0442\u044C \u0446\u0435\u043B\u044B\u043C \u0447\u0438\u0441\u043B\u043E\u043C \u043E\u0442 1 \u0434\u043E ${MAX_LIMIT}.`);
  }
  if (value > MAX_LIMIT) {
    throw new PaginationError(`limit \u0431\u043E\u043B\u044C\u0448\u0435 ${MAX_LIMIT} \u043D\u0435 \u043F\u043E\u0434\u0434\u0435\u0440\u0436\u0438\u0432\u0430\u0435\u0442\u0441\u044F: \u0437\u0430\u043F\u0440\u043E\u0441\u0438\u0442\u0435 ${MAX_LIMIT} \u0438 \u043F\u0435\u0440\u0435\u0434\u0430\u0439\u0442\u0435 nextCursor \u0438\u0437 \u043E\u0442\u0432\u0435\u0442\u0430 \u0432 cursor.`);
  }
  return value;
}
function toPage(response) {
  return { items: response.items, nextCursor: response.nextCursor ?? null };
}
function nextPageHint(page) {
  return page.nextCursor === null ? void 0 : `\u0415\u0441\u0442\u044C \u0435\u0449\u0451: \u043F\u0435\u0440\u0435\u0434\u0430\u0439\u0442\u0435 cursor=${page.nextCursor}`;
}

// apps/mcp/dist/tools/contracts.js
import { z as z6 } from "zod";

// apps/mcp/dist/format/labels.js
var ORGANIZATION_KIND = {
  sole_proprietor: "\u0418\u041F",
  llc: "\u041E\u041E\u041E",
  other: "\u0414\u0440\u0443\u0433\u043E\u0435"
};
var TAX_REGIME = {
  osno: "\u041E\u0421\u041D\u041E",
  usn: "\u0423\u0421\u041D",
  ausn: "\u0410\u0423\u0421\u041D",
  eskh: "\u0415\u0421\u0425\u041D",
  psn: "\u041F\u0421\u041D",
  npd: "\u041D\u041F\u0414"
};
var VAT_STATUS = {
  payer: "\u043F\u043B\u0430\u0442\u0435\u043B\u044C\u0449\u0438\u043A \u041D\u0414\u0421",
  exempt: "\u0431\u0435\u0437 \u041D\u0414\u0421"
};
var ORG_STATUS = {
  active: "\u0430\u043A\u0442\u0438\u0432\u043D\u0430",
  archived: "\u0432 \u0430\u0440\u0445\u0438\u0432\u0435"
};
var COUNTERPARTY_KIND = {
  legal: "\u044E\u0440\u043B\u0438\u0446\u043E",
  sole_proprietor: "\u0418\u041F",
  individual: "\u0444\u0438\u0437\u043B\u0438\u0446\u043E"
};
var VISIBILITY = {
  organization: "\u0441\u0432\u043E\u044F \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F",
  shared: "\u043E\u0431\u0449\u0438\u0439",
  personal: "\u043B\u0438\u0447\u043D\u044B\u0439"
};
var DOCUMENT_TYPE = {
  invoice: "\u0421\u0447\u0451\u0442",
  act: "\u0410\u043A\u0442",
  invoice_facture: "\u0421\u0447\u0451\u0442-\u0444\u0430\u043A\u0442\u0443\u0440\u0430",
  upd: "\u0423\u041F\u0414",
  contract: "\u0414\u043E\u0433\u043E\u0432\u043E\u0440"
};
var DOCUMENT_STATUS = {
  draft: "\u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A",
  on_approval: "\u043D\u0430 \u0441\u043E\u0433\u043B\u0430\u0441\u043E\u0432\u0430\u043D\u0438\u0438",
  issued: "\u0432\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D",
  sent: "\u043E\u0442\u043F\u0440\u0430\u0432\u043B\u0435\u043D",
  partially_paid: "\u0447\u0430\u0441\u0442\u0438\u0447\u043D\u043E \u043E\u043F\u043B\u0430\u0447\u0435\u043D",
  overdue: "\u043F\u0440\u043E\u0441\u0440\u043E\u0447\u0435\u043D",
  paid: "\u043E\u043F\u043B\u0430\u0447\u0435\u043D",
  cancelled: "\u0430\u043D\u043D\u0443\u043B\u0438\u0440\u043E\u0432\u0430\u043D",
  signed: "\u043F\u043E\u0434\u043F\u0438\u0441\u0430\u043D"
};
var CONTRACT_STATUS = {
  active: "\u0434\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442",
  closed: "\u0437\u0430\u043A\u0440\u044B\u0442",
  archived: "\u0432 \u0430\u0440\u0445\u0438\u0432\u0435"
};
var SHARE_STATUS = {
  active: "\u0430\u043A\u0442\u0438\u0432\u043D\u0430",
  expired: "\u0438\u0441\u0442\u0435\u043A\u043B\u0430",
  exhausted: "\u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u044B \u0437\u0430\u043A\u043E\u043D\u0447\u0438\u043B\u0438\u0441\u044C",
  revoked: "\u043E\u0442\u043E\u0437\u0432\u0430\u043D\u0430"
};
var PAYMENT_METHOD = {
  manual: "\u0432\u0440\u0443\u0447\u043D\u0443\u044E",
  bank: "\u0431\u0430\u043D\u043A"
};
var PRODUCT_KIND = {
  product: "\u0442\u043E\u0432\u0430\u0440",
  service: "\u0443\u0441\u043B\u0443\u0433\u0430"
};
function label(dictionary, value) {
  if (value === null || value === void 0 || value === "")
    return "\u2014";
  return dictionary[value] ?? value;
}

// apps/mcp/dist/format/markdown.js
var MAX_SUMMARY_ROWS = 10;
function escapeCell(value) {
  return value.replace(/\|/g, "\\|").replace(/\s*\n\s*/g, " ");
}
function mdTable(headers, rows) {
  const header = `| ${headers.map(escapeCell).join(" | ")} |`;
  const divider = `| ${headers.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${row.map(escapeCell).join(" | ")} |`);
  return [header, divider, ...body].join("\n");
}
function summaryTable(options) {
  const { title, headers, rows, footer = [] } = options;
  const shown = rows.slice(0, MAX_SUMMARY_ROWS);
  const hidden = rows.length - shown.length;
  const lines = [title, "", mdTable(headers, shown)];
  if (hidden > 0) {
    lines.push("", `\u2026\u0438 \u0435\u0449\u0451 ${hidden}. \u0423\u0442\u043E\u0447\u043D\u0438\u0442\u0435 \u0444\u0438\u043B\u044C\u0442\u0440\u044B \u0438\u043B\u0438 \u0437\u0430\u043F\u0440\u043E\u0441\u0438\u0442\u0435 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0443\u044E \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443.`);
  }
  for (const line of footer) {
    lines.push("", line);
  }
  return lines.join("\n");
}
function mdBullets(items) {
  return items.map((item) => `- ${item}`).join("\n");
}

// packages/contracts/dist/money.js
var MONEY_PATTERN = /^-?\d{1,15}(?:[.,]\d{1,2})?$/;
function parseKopecks(value) {
  const trimmed = value.trim().replace(",", ".");
  if (!MONEY_PATTERN.test(trimmed)) {
    throw new RangeError(`\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u0430\u044F \u0434\u0435\u043D\u0435\u0436\u043D\u0430\u044F \u0441\u0443\u043C\u043C\u0430: ${value}`);
  }
  const negative = trimmed.startsWith("-");
  const [rubles = "0", fraction = ""] = (negative ? trimmed.slice(1) : trimmed).split(".");
  const kopecks = BigInt(rubles) * 100n + BigInt(fraction.padEnd(2, "0"));
  return negative ? -kopecks : kopecks;
}

// apps/mcp/dist/format/money.js
var GROUP_SEPARATOR = "\xA0";
var DASH = "\u2014";
function groupDigits(digits) {
  return digits.replace(/\B(?=(\d{3})+(?!\d))/g, GROUP_SEPARATOR);
}
function formatMoney(kopecks) {
  const negative = kopecks < 0n;
  const absolute = negative ? -kopecks : kopecks;
  const rubles = groupDigits((absolute / 100n).toString());
  const fraction = (absolute % 100n).toString().padStart(2, "0");
  return `${negative ? "-" : ""}${rubles},${fraction}`;
}
function formatMoneyString(value) {
  if (value === null || value === void 0 || value === "")
    return DASH;
  try {
    return formatMoney(parseKopecks(value));
  } catch {
    return value;
  }
}

// apps/mcp/dist/tools/shared.js
import { randomUUID } from "node:crypto";
import { ProtocolError, SdkError } from "@modelcontextprotocol/server";
import { z as z5 } from "zod";

// apps/mcp/dist/result-size.js
var MAX_RESULT_BYTES = 64 * 1024;
var TOO_LARGE_TEXT = "\u041E\u0442\u0432\u0435\u0442 \u0441\u043B\u0438\u0448\u043A\u043E\u043C \u0431\u043E\u043B\u044C\u0448\u043E\u0439, \u0447\u0442\u043E\u0431\u044B \u043E\u0442\u0434\u0430\u0442\u044C \u0435\u0433\u043E \u0446\u0435\u043B\u0438\u043A\u043E\u043C. \u0423\u0442\u043E\u0447\u043D\u0438\u0442\u0435 \u0444\u0438\u043B\u044C\u0442\u0440\u044B (\u043F\u0435\u0440\u0438\u043E\u0434, \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442, \u0441\u0442\u0430\u0442\u0443\u0441) \u0438\u043B\u0438 \u0443\u043C\u0435\u043D\u044C\u0448\u0438\u0442\u0435 limit \u2014 \u043F\u043E\u043B\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u043D\u0435 \u043F\u043E\u043C\u0435\u0449\u0430\u044E\u0442\u0441\u044F \u0432 \u043A\u043E\u043D\u0442\u0435\u043A\u0441\u0442.";
function byteLength(value) {
  const json = JSON.stringify(value);
  return json === void 0 ? 0 : Buffer.byteLength(json);
}
function collectArrays(value, out) {
  if (Array.isArray(value)) {
    if (value.length > 1)
      out.push(value);
    for (const item of value)
      collectArrays(item, out);
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const item of Object.values(value))
      collectArrays(item, out);
  }
}
function trimNote(dropped) {
  return `\u2026\u043E\u0442\u0432\u0435\u0442 \u0441\u043E\u043A\u0440\u0430\u0449\u0451\u043D \u043D\u0430 ${dropped} \u044D\u043B\u0435\u043C\u0435\u043D\u0442(\u043E\u0432), \u0447\u0442\u043E\u0431\u044B \u0443\u043B\u043E\u0436\u0438\u0442\u044C\u0441\u044F \u0432 ${MAX_RESULT_BYTES / 1024} \u041A\u0411. \u0423\u0442\u043E\u0447\u043D\u0438\u0442\u0435 \u0444\u0438\u043B\u044C\u0442\u0440\u044B (\u043F\u0435\u0440\u0438\u043E\u0434, \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442) \u0438\u043B\u0438 \u0437\u0430\u043F\u0440\u043E\u0441\u0438\u0442\u0435 \u0441\u043B\u0435\u0434\u0443\u044E\u0449\u0443\u044E \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443 \u0447\u0435\u0440\u0435\u0437 cursor.`;
}
function trimArrays(data) {
  const arrays = [];
  collectArrays(data, arrays);
  let dropped = 0;
  while (byteLength(data) > MAX_RESULT_BYTES) {
    arrays.sort((left, right) => byteLength(right) - byteLength(left));
    const target = arrays.find((array) => array.length > 1);
    if (target === void 0)
      break;
    const keep = Math.max(1, Math.ceil(target.length / 2));
    dropped += target.length - keep;
    target.length = keep;
  }
  return dropped;
}
function fitCallToolResult(result) {
  const structured = result.structuredContent;
  if (structured === void 0 || byteLength(structured) <= MAX_RESULT_BYTES)
    return result;
  const data = structuredClone(structured);
  const dropped = trimArrays(data);
  if (byteLength(data) > MAX_RESULT_BYTES) {
    return { isError: true, content: [{ type: "text", text: TOO_LARGE_TEXT }] };
  }
  return {
    ...result,
    content: result.content.map((item) => item.type === "text" ? { ...item, text: `${item.text}

${trimNote(dropped)}` } : item),
    structuredContent: data
  };
}
function fitResourceResult(uri, markdown, data) {
  if (byteLength(data) <= MAX_RESULT_BYTES) {
    return {
      contents: [
        { uri: uri.href, mimeType: "text/markdown", text: markdown },
        { uri: uri.href, mimeType: "application/json", text: JSON.stringify(data) }
      ]
    };
  }
  const trimmed = structuredClone(data);
  const dropped = trimArrays(trimmed);
  if (byteLength(trimmed) > MAX_RESULT_BYTES) {
    return {
      contents: [
        {
          uri: uri.href,
          mimeType: "text/markdown",
          text: `${markdown}

${TOO_LARGE_TEXT}`
        }
      ]
    };
  }
  return {
    contents: [
      { uri: uri.href, mimeType: "text/markdown", text: `${markdown}

${trimNote(dropped)}` },
      { uri: uri.href, mimeType: "application/json", text: JSON.stringify(trimmed) }
    ]
  };
}

// apps/mcp/dist/tools/shared.js
var nullableString = z5.string().nullable();
var nullableRecord = z5.record(z5.string(), z5.unknown()).nullable();
var READ_ONLY_ANNOTATIONS = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
};
var WRITE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: false
};
var DESTRUCTIVE_ANNOTATIONS = {
  readOnlyHint: false,
  destructiveHint: true,
  idempotentHint: false,
  openWorldHint: false
};
var CONFIRM_REQUIRED = "\u041E\u043F\u0435\u0440\u0430\u0446\u0438\u044F \u0438\u0437\u043C\u0435\u043D\u044F\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0435. \u041D\u0438\u0447\u0435\u0433\u043E \u043D\u0435 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D\u043E. \u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u0432\u044B\u0437\u043E\u0432 \u0441 confirm: true, \u0435\u0441\u043B\u0438 \u044D\u0442\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u043D\u0443\u0436\u043D\u043E, \u0438 \u043E\u0431\u044A\u044F\u0441\u043D\u0438\u0442\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044E, \u0447\u0442\u043E \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u0441\u044F.";
function idempotencyKeyOf(value) {
  return value ?? randomUUID();
}
function failureText(error, config) {
  if (error instanceof PaginationError)
    return error.message;
  if (error instanceof ProtocolError)
    return error.message;
  if (error instanceof SdkError) {
    return `\u041E\u0448\u0438\u0431\u043A\u0430 MCP SDK: ${error.message}. \u041F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u0437\u0430\u043F\u0440\u043E\u0441; \u0435\u0441\u043B\u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u044F\u0435\u0442\u0441\u044F \u2014 \u0441\u043E\u043E\u0431\u0449\u0438\u0442\u0435 \u0430\u0434\u043C\u0438\u043D\u0438\u0441\u0442\u0440\u0430\u0442\u043E\u0440\u0443.`;
  }
  return describeApiError(error, { apiUrl: config.apiUrl });
}
function toolResult(markdown, structuredContent) {
  return {
    content: [{ type: "text", text: markdown }],
    structuredContent
  };
}
async function mutation(ctx, tool, confirmed, handler) {
  if (confirmed !== true) {
    ctx.logger.warn("tool.confirm_required", { tool });
    return { isError: true, content: [{ type: "text", text: CONFIRM_REQUIRED }] };
  }
  return execute(ctx, tool, handler);
}
async function execute(ctx, tool, handler) {
  const startedAt = Date.now();
  try {
    const result = fitCallToolResult(await handler());
    ctx.logger.info("tool.ok", { tool, ms: Date.now() - startedAt });
    return result;
  } catch (error) {
    const status = error instanceof ApiError ? error.status : void 0;
    const code = error instanceof ApiError ? error.code : void 0;
    ctx.logger.warn("tool.error", {
      tool,
      status,
      code,
      ms: Date.now() - startedAt
    });
    return {
      isError: true,
      content: [{ type: "text", text: failureText(error, ctx.config) }]
    };
  }
}

// apps/mcp/dist/tools/contracts.js
var SEARCH_TOOL = "invoices_contracts_search";
var GET_TOOL = "invoices_contracts_get";
var DateOnly = z6.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, "\u0434\u0430\u0442\u0430 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 DD.MM.YYYY");
var ContractListItem = z6.object({
  id: z6.string(),
  number: nullableString,
  contractDate: nullableString,
  contractorId: nullableString,
  contractorShortName: nullableString,
  subject: nullableString,
  amount: nullableString,
  status: z6.string()
});
var SearchInput = z6.object({
  organizationId: z6.uuid().optional().describe("\u0422\u043E\u043B\u044C\u043A\u043E \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u044B \u044D\u0442\u043E\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438"),
  contractorId: z6.uuid().optional().describe("\u0422\u043E\u043B\u044C\u043A\u043E \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u044B \u044D\u0442\u043E\u0433\u043E \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430"),
  query: z6.string().trim().min(1).optional().describe("\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043D\u043E\u043C\u0435\u0440\u0443, \u043F\u0440\u0435\u0434\u043C\u0435\u0442\u0443, \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0443"),
  status: z6.enum(["active", "closed", "archived"]).optional(),
  from: DateOnly.optional().describe("\u0414\u0430\u0442\u0430 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430 \u0441 (DD.MM.YYYY)"),
  to: DateOnly.optional().describe("\u0414\u0430\u0442\u0430 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430 \u043F\u043E (DD.MM.YYYY)"),
  limit: z6.number().int().optional().describe("1\u2013100, \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E 20"),
  cursor: z6.string().optional().describe("nextCursor \u0438\u0437 \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0433\u043E \u043E\u0442\u0432\u0435\u0442\u0430")
});
var SearchOutput = z6.object({
  items: z6.array(ContractListItem),
  nextCursor: z6.string().nullable()
});
var GetInput = z6.object({
  contractId: z6.uuid().describe("\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430 (UUID)"),
  include: z6.array(z6.enum(["documents", "files"])).optional().describe("\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u043F\u043E \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0443 \u0438/\u0438\u043B\u0438 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0435 \u0444\u0430\u0439\u043B\u044B")
});
var FileItem = z6.object({
  assetId: z6.string(),
  fileName: nullableString,
  mime: nullableString,
  sizeBytes: z6.number().nullable(),
  downloadUrl: nullableString
});
var ContractDocumentItem = z6.object({
  id: z6.string(),
  type: z6.string(),
  status: z6.string(),
  number: nullableString,
  documentDate: nullableString,
  total: nullableString,
  paid: nullableString
});
var GetOutput = z6.object({
  id: z6.string(),
  number: nullableString,
  contractDate: nullableString,
  subject: nullableString,
  amount: nullableString,
  status: z6.string(),
  contractor: z6.object({
    id: z6.string(),
    shortName: nullableString,
    inn: nullableString,
    kpp: nullableString
  }),
  organizationId: z6.string(),
  hasText: z6.boolean(),
  files: z6.array(FileItem).optional(),
  documents: z6.array(ContractDocumentItem).optional()
});
function registerContractTools(server, ctx) {
  server.registerTool(SEARCH_TOOL, {
    title: "\u0414\u043E\u0433\u043E\u0432\u043E\u0440\u044B: \u043F\u043E\u0438\u0441\u043A",
    description: "\u0414\u043E\u0433\u043E\u0432\u043E\u0440\u044B \u043A\u0430\u0431\u0438\u043D\u0435\u0442\u0430: \u043D\u043E\u043C\u0435\u0440, \u0434\u0430\u0442\u0430, \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442, \u043F\u0440\u0435\u0434\u043C\u0435\u0442, \u0441\u0443\u043C\u043C\u0430 \u0438 \u0441\u0442\u0430\u0442\u0443\u0441. \u041D\u0443\u0436\u0435\u043D, \u0447\u0442\u043E\u0431\u044B \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u0442\u044C \u0441\u0447\u0451\u0442 \u043A \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0443 \u0438\u043B\u0438 \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u0443\u0441\u043B\u043E\u0432\u0438\u044F \u043F\u0435\u0440\u0435\u0434 \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0435\u043C.",
    inputSchema: SearchInput,
    outputSchema: SearchOutput,
    annotations: READ_ONLY_ANNOTATIONS
  }, (args) => execute(ctx, SEARCH_TOOL, async () => {
    const limit = resolveLimit(args.limit);
    const response = await ctx.sdk.contracts.list({
      limit,
      ...args.organizationId === void 0 ? {} : { organizationId: args.organizationId },
      ...args.contractorId === void 0 ? {} : { counterpartyId: args.contractorId },
      ...args.query === void 0 ? {} : { q: args.query },
      ...args.status === void 0 ? {} : { status: args.status },
      ...args.from === void 0 ? {} : { from: args.from },
      ...args.to === void 0 ? {} : { to: args.to },
      ...args.cursor === void 0 ? {} : { cursor: args.cursor }
    });
    const page = toPage(response);
    const items = page.items.map((contract) => ({
      id: contract.id,
      number: contract.number ?? null,
      contractDate: contract.contractDate ?? null,
      contractorId: contract.counterparty?.id ?? null,
      contractorShortName: contract.counterparty?.shortName ?? null,
      subject: contract.subject ?? null,
      amount: contract.amount ?? null,
      status: contract.status
    }));
    const markdown = summaryTable({
      title: items.length === 0 ? "\u0414\u043E\u0433\u043E\u0432\u043E\u0440\u044B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043F\u0435\u0440\u0438\u043E\u0434 \u0438 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430." : `\u0414\u043E\u0433\u043E\u0432\u043E\u0440\u043E\u0432 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435: ${items.length}`,
      headers: ["\u2116", "\u0414\u0430\u0442\u0430", "\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442", "\u041F\u0440\u0435\u0434\u043C\u0435\u0442", "\u0421\u0443\u043C\u043C\u0430", "\u0421\u0442\u0430\u0442\u0443\u0441"],
      rows: items.map((contract) => [
        contract.number ?? "\u0431/\u043D",
        contract.contractDate ?? "\u2014",
        contract.contractorShortName ?? "\u2014",
        contract.subject ?? "\u2014",
        formatMoneyString(contract.amount),
        label(CONTRACT_STATUS, contract.status)
      ]),
      footer: [
        ...nextPageHint(page) === void 0 ? [] : [nextPageHint(page) ?? ""],
        "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0443 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430 \u0441 \u0444\u0430\u0439\u043B\u0430\u043C\u0438 \u0438 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430\u043C\u0438 \u043E\u0442\u0434\u0430\u0451\u0442 invoices_contracts_get."
      ]
    });
    return toolResult(markdown, { items, nextCursor: page.nextCursor });
  }));
  server.registerTool(GET_TOOL, {
    title: "\u0414\u043E\u0433\u043E\u0432\u043E\u0440: \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0430",
    description: '\u0414\u043E\u0433\u043E\u0432\u043E\u0440: \u043D\u043E\u043C\u0435\u0440, \u0434\u0430\u0442\u0430, \u043F\u0440\u0435\u0434\u043C\u0435\u0442, \u0441\u0443\u043C\u043C\u0430, \u0441\u0442\u0430\u0442\u0443\u0441, \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442. include: ["files"] \u2014 \u043F\u0440\u0438\u043B\u043E\u0436\u0435\u043D\u043D\u044B\u0435 \u0444\u0430\u0439\u043B\u044B, ["documents"] \u2014 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u043F\u043E \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0443.',
    inputSchema: GetInput,
    outputSchema: GetOutput,
    annotations: READ_ONLY_ANNOTATIONS
  }, (args) => execute(ctx, GET_TOOL, async () => {
    const card = await loadContractCard(ctx, args.contractId, args.include ?? []);
    return toolResult(card.markdown, card.data);
  }));
}
async function loadContractCard(ctx, contractId, includeList) {
  const include = new Set(includeList);
  const contract = await ctx.sdk.contracts.get(contractId);
  const files = include.has("files") ? (await ctx.sdk.contracts.listContractFiles(contractId)).map((file) => ({
    assetId: file.assetId,
    fileName: file.fileName ?? null,
    mime: file.mime ?? null,
    sizeBytes: file.sizeBytes ?? null,
    downloadUrl: file.downloadUrl ?? null
  })) : void 0;
  const documents = include.has("documents") ? toPage(await ctx.sdk.documents.list({ contractId, limit: 5 })).items.map((document) => ({
    id: document.id,
    type: document.type,
    status: document.status,
    number: document.number ?? null,
    documentDate: document.documentDate ?? null,
    total: document.total ?? null,
    paid: document.paid ?? null
  })) : void 0;
  const lines = [
    `**\u0414\u043E\u0433\u043E\u0432\u043E\u0440 \u2116 ${contract.number ?? "\u0431/\u043D"}** \u043E\u0442 ${contract.contractDate ?? "\u2014"}`,
    `\u0421\u0442\u0430\u0442\u0443\u0441: ${label(CONTRACT_STATUS, contract.status)}`,
    `\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442: ${contract.counterparty?.shortName ?? "\u2014"}` + (contract.counterparty?.inn === null || contract.counterparty?.inn === void 0 ? "" : ` (\u0418\u041D\u041D ${contract.counterparty.inn})`),
    contract.subject === null || contract.subject === "" ? "" : `\u041F\u0440\u0435\u0434\u043C\u0435\u0442: ${contract.subject}`,
    `\u0421\u0443\u043C\u043C\u0430: ${formatMoneyString(contract.amount)}`,
    contract.text === null || contract.text === "" ? "\u0422\u0435\u043A\u0441\u0442 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430 \u043D\u0435 \u0437\u0430\u043F\u043E\u043B\u043D\u0435\u043D." : "\u0422\u0435\u043A\u0441\u0442 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430 \u0437\u0430\u043F\u043E\u043B\u043D\u0435\u043D."
  ].filter((line) => line !== "");
  const blocks = [lines.join("\n")];
  if (files !== void 0) {
    blocks.push("", "**\u0424\u0430\u0439\u043B\u044B**", files.length === 0 ? "\u0424\u0430\u0439\u043B\u043E\u0432 \u043D\u0435\u0442." : mdBullets(files.map((file) => `${file.fileName ?? "\u0444\u0430\u0439\u043B"}${file.sizeBytes === null ? "" : `, ${Math.round(file.sizeBytes / 1024)} \u041A\u0411`}${file.downloadUrl === null ? "" : ` \u2014 ${file.downloadUrl}`}`)));
  }
  if (documents !== void 0) {
    blocks.push("", "**\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B**", documents.length === 0 ? "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \u043F\u043E \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0443 \u043D\u0435\u0442." : mdBullets(documents.map((document) => `${label(DOCUMENT_TYPE, document.type)} \u2116 ${document.number ?? "\u0431/\u043D"} \u043E\u0442 ${document.documentDate ?? "\u2014"}: ${formatMoneyString(document.total)}, ${label(DOCUMENT_STATUS, document.status)}`)));
  }
  return {
    markdown: blocks.join("\n"),
    data: {
      id: contract.id,
      number: contract.number ?? null,
      contractDate: contract.contractDate ?? null,
      subject: contract.subject ?? null,
      amount: contract.amount ?? null,
      status: contract.status,
      contractor: {
        id: contract.counterparty?.id ?? "",
        shortName: contract.counterparty?.shortName ?? null,
        inn: contract.counterparty?.inn ?? null,
        kpp: contract.counterparty?.kpp ?? null
      },
      organizationId: contract.organizationId,
      hasText: (contract.text ?? "") !== "",
      ...files === void 0 ? {} : { files },
      ...documents === void 0 ? {} : { documents }
    }
  };
}
var CREATE_CONTRACT_TOOL = "invoices_contracts_create";
var UPDATE_CONTRACT_TOOL = "invoices_contracts_update";
var MoneyString = z6.string().regex(/^\d+(\.\d{1,2})?$/, '\u0441\u0443\u043C\u043C\u0430 \u0441\u0442\u0440\u043E\u043A\u043E\u0439 \u0432 \u0440\u0443\u0431\u043B\u044F\u0445 \u0441 \u043A\u043E\u043F\u0435\u0439\u043A\u0430\u043C\u0438, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 "300000.00"');
var CreateContractInput = z6.object({
  organizationId: z6.uuid().describe("\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F, \u043E\u0442 \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u0437\u0430\u043A\u043B\u044E\u0447\u0451\u043D \u0434\u043E\u0433\u043E\u0432\u043E\u0440"),
  contractorId: z6.uuid().describe("\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442 (ID \u0438\u0437 invoices_contractors_search)"),
  number: z6.string().trim().min(1).describe("\u041D\u043E\u043C\u0435\u0440 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430"),
  contractDate: DateOnly.describe("\u0414\u0430\u0442\u0430 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430, DD.MM.YYYY"),
  subject: z6.string().optional().describe("\u041F\u0440\u0435\u0434\u043C\u0435\u0442 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430"),
  amount: MoneyString.optional().describe("\u0421\u0443\u043C\u043C\u0430 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430"),
  text: z6.string().optional().describe("\u0422\u0435\u043A\u0441\u0442 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430 (\u0432 \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0435 \u043F\u043E\u043A\u0430\u0437\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E hasText)"),
  confirm: z6.boolean().optional()
});
var CreateContractOutput = z6.object({
  id: z6.string(),
  number: nullableString,
  contractorShortName: nullableString
});
var UpdateContractInput = z6.object({
  contractId: z6.uuid(),
  number: z6.string().trim().min(1).optional(),
  contractDate: DateOnly.optional(),
  subject: z6.string().optional(),
  amount: MoneyString.optional(),
  status: z6.enum(["active", "closed", "archived"]).optional(),
  text: z6.string().optional(),
  confirm: z6.boolean().optional()
});
var UpdateContractOutput = z6.object({
  id: z6.string(),
  number: nullableString,
  status: z6.string(),
  updatedFields: z6.array(z6.string())
});
function registerContractWriteTools(server, ctx) {
  server.registerTool(CREATE_CONTRACT_TOOL, {
    title: "\u0414\u043E\u0433\u043E\u0432\u043E\u0440: \u0441\u043E\u0437\u0434\u0430\u0442\u044C",
    description: "\u0421\u043E\u0437\u0434\u0430\u0451\u0442 \u0434\u043E\u0433\u043E\u0432\u043E\u0440. \u0422\u0440\u0435\u0431\u0443\u0435\u0442 confirm: true. \u041F\u043E\u0441\u043B\u0435 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F \u0441\u0447\u0451\u0442 \u043C\u043E\u0436\u043D\u043E \u043F\u0440\u0438\u0432\u044F\u0437\u0430\u0442\u044C \u043A \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0443 \u0447\u0435\u0440\u0435\u0437 contractId \u0432 invoices_documents_create_draft.",
    inputSchema: CreateContractInput,
    outputSchema: CreateContractOutput,
    annotations: WRITE_ANNOTATIONS
  }, (args) => mutation(ctx, CREATE_CONTRACT_TOOL, args.confirm, async () => {
    const { confirm: _confirm, contractorId, ...rest } = args;
    const contract = await ctx.sdk.contracts.create({ ...rest, counterpartyId: contractorId });
    return toolResult(`\u0414\u043E\u0433\u043E\u0432\u043E\u0440 \u0441\u043E\u0437\u0434\u0430\u043D: \u2116 ${contract.number ?? "\u0431/\u043D"} \u043E\u0442 ${contract.contractDate ?? "\u2014"}${contract.counterparty?.shortName === void 0 ? "" : `, ${contract.counterparty.shortName}`}
ID: ${contract.id}`, {
      id: contract.id,
      number: contract.number ?? null,
      contractorShortName: contract.counterparty?.shortName ?? null
    });
  }));
  server.registerTool(UPDATE_CONTRACT_TOOL, {
    title: "\u0414\u043E\u0433\u043E\u0432\u043E\u0440: \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u044C",
    description: "\u041F\u0440\u0430\u0432\u0438\u0442 \u0440\u0435\u043A\u0432\u0438\u0437\u0438\u0442\u044B \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430 (\u043D\u043E\u043C\u0435\u0440, \u0434\u0430\u0442\u0430, \u043F\u0440\u0435\u0434\u043C\u0435\u0442, \u0441\u0443\u043C\u043C\u0430, \u0441\u0442\u0430\u0442\u0443\u0441, \u0442\u0435\u043A\u0441\u0442). \u0422\u0440\u0435\u0431\u0443\u0435\u0442 confirm: true.",
    inputSchema: UpdateContractInput,
    outputSchema: UpdateContractOutput,
    annotations: WRITE_ANNOTATIONS
  }, (args) => mutation(ctx, UPDATE_CONTRACT_TOOL, args.confirm, async () => {
    const { confirm: _confirm, contractId, ...patch } = args;
    const contract = await ctx.sdk.contracts.update(contractId, patch);
    const updatedFields = Object.keys(patch).filter((key) => patch[key] !== void 0);
    return toolResult(`\u0414\u043E\u0433\u043E\u0432\u043E\u0440 \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D: \u2116 ${contract.number ?? "\u0431/\u043D"}, \u0441\u0442\u0430\u0442\u0443\u0441 ${label(CONTRACT_STATUS, contract.status)}
\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u044B \u043F\u043E\u043B\u044F: ${updatedFields.length === 0 ? "\u2014" : updatedFields.join(", ")}`, {
      id: contract.id,
      number: contract.number ?? null,
      status: contract.status,
      updatedFields
    });
  }));
}

// apps/mcp/dist/resources/shared.js
import { ProtocolError as ProtocolError2, ProtocolErrorCode } from "@modelcontextprotocol/server";
var UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
function requireId(variables, template) {
  const value = variables.id;
  if (typeof value === "string" && UUID.test(value))
    return value;
  throw new ProtocolError2(ProtocolErrorCode.InvalidParams, `\u0412 \u0430\u0434\u0440\u0435\u0441\u0435 ${template} \u043D\u0443\u0436\u0435\u043D UUID. \u0412\u043E\u0437\u044C\u043C\u0438\u0442\u0435 \u0435\u0433\u043E \u0438\u0437 \u043F\u043E\u0438\u0441\u043A\u0430 (invoices_documents_search, invoices_contractors_search, invoices_organizations_list, invoices_contracts_search). \u041F\u043E\u043B\u0443\u0447\u0435\u043D\u043E: \xAB${typeof value === "string" ? value : ""}\xBB.`);
}
function resourceResult(uri, markdown, data) {
  return fitResourceResult(uri, markdown, data);
}
async function readResource(ctx, resource, handler) {
  const startedAt = Date.now();
  try {
    const result = await handler();
    ctx.logger.info("resource.ok", { resource, ms: Date.now() - startedAt });
    return result;
  } catch (error) {
    const status = error instanceof ApiError ? error.status : void 0;
    const code = error instanceof ApiError ? error.code : void 0;
    ctx.logger.warn("resource.error", { resource, status, code, ms: Date.now() - startedAt });
    if (error instanceof ProtocolError2)
      throw error;
    throw new ProtocolError2(ProtocolErrorCode.InvalidParams, failureText(error, ctx.config));
  }
}
async function listTemplateItems(ctx, resource, load) {
  try {
    const items = await load();
    return {
      resources: items.map((item) => ({ ...item, mimeType: "text/markdown" }))
    };
  } catch (error) {
    const status = error instanceof ApiError ? error.status : void 0;
    const code = error instanceof ApiError ? error.code : void 0;
    ctx.logger.debug("resource.list_failed", { resource, status, code });
    return { resources: [] };
  }
}
function completeIds(load) {
  return async (value) => {
    try {
      const items = await load();
      return items.map((item) => item.id).filter((id) => id.startsWith(value)).slice(0, 10);
    } catch {
      return [];
    }
  };
}

// apps/mcp/dist/resources/contracts.js
var RESOURCE = "contract";
var TEMPLATE = "contract://{id}";
function registerContractResources(server, ctx) {
  server.registerResource(RESOURCE, new ResourceTemplate(TEMPLATE, {
    list: () => listTemplateItems(ctx, RESOURCE, async () => {
      const items = toPage(await ctx.sdk.contracts.list({ limit: 5 })).items;
      return items.map((contract) => ({
        uri: `contract://${contract.id}`,
        name: `\u0414\u043E\u0433\u043E\u0432\u043E\u0440 \u2116 ${contract.number}`,
        title: `\u0414\u043E\u0433\u043E\u0432\u043E\u0440 \u2116 ${contract.number}`,
        description: contract.counterparty?.shortName === void 0 ? `\u0414\u043E\u0433\u043E\u0432\u043E\u0440 \u043E\u0442 ${contract.contractDate}` : `\u0414\u043E\u0433\u043E\u0432\u043E\u0440 \u043E\u0442 ${contract.contractDate}, ${contract.counterparty.shortName}`
      }));
    }),
    complete: {
      id: completeIds(async () => toPage(await ctx.sdk.contracts.list({ limit: 5 })).items)
    }
  }), {
    title: "\u0414\u043E\u0433\u043E\u0432\u043E\u0440",
    description: "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430: \u043D\u043E\u043C\u0435\u0440, \u0441\u0443\u043C\u043C\u0430, \u0441\u0442\u0430\u0442\u0443\u0441, \u0444\u0430\u0439\u043B\u044B \u0438 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B. \u0422\u043E\u043B\u044C\u043A\u043E \u0447\u0442\u0435\u043D\u0438\u0435.",
    mimeType: "text/markdown"
  }, (uri, variables) => readResource(ctx, RESOURCE, async () => {
    const card = await loadContractCard(ctx, requireId(variables, TEMPLATE), [
      "files",
      "documents"
    ]);
    return resourceResult(uri, card.markdown, card.data);
  }));
}

// apps/mcp/dist/resources/contractors.js
import { ResourceTemplate as ResourceTemplate2 } from "@modelcontextprotocol/server";

// apps/mcp/dist/tools/contractors.js
import { z as z7 } from "zod";

// apps/mcp/dist/format/date.js
function formatIsoDate(value) {
  if (value === null || value === void 0 || value === "")
    return "\u2014";
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value);
  if (match === null)
    return value;
  const [, year, month, day] = match;
  return `${day ?? ""}.${month ?? ""}.${year ?? ""}`;
}

// apps/mcp/dist/tools/contractors.js
var SEARCH_TOOL2 = "invoices_contractors_search";
var GET_TOOL2 = "invoices_contractors_get";
var SUMMARY_TOOL = "invoices_contractors_summary";
var nullableString2 = z7.string().nullable();
var ContractorListItem = z7.object({
  id: z7.string(),
  shortName: z7.string(),
  inn: z7.string(),
  kpp: nullableString2,
  kind: z7.string(),
  visibility: z7.string(),
  emails: z7.array(z7.string()),
  status: z7.string()
});
var SearchInput2 = z7.object({
  query: z7.string().trim().min(1).optional().describe("\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E, \u0418\u041D\u041D \u0438\u043B\u0438 email; \u043F\u0443\u0441\u0442\u043E \u2014 \u043F\u0435\u0440\u0432\u044B\u0435 N \u043F\u043E \u0430\u043B\u0444\u0430\u0432\u0438\u0442\u0443"),
  inn: z7.string().trim().min(10).optional().describe("\u0422\u043E\u0447\u043D\u044B\u0439 \u0418\u041D\u041D (10 \u0438\u043B\u0438 12 \u0446\u0438\u0444\u0440)"),
  kind: z7.enum(["legal", "sole_proprietor", "individual"]).optional(),
  visibility: z7.enum(["shared", "organization"]).optional().describe("shared \u2014 \u043E\u0431\u0449\u0438\u0435 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u044B \u0440\u0430\u0431\u043E\u0447\u0435\u0439 \u043E\u0431\u043B\u0430\u0441\u0442\u0438, organization \u2014 \u0442\u043E\u043B\u044C\u043A\u043E \u044D\u0442\u043E\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438"),
  organizationId: z7.uuid().optional().describe("\u041E\u0433\u0440\u0430\u043D\u0438\u0447\u0438\u0442\u044C \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430\u043C\u0438 \u043E\u0434\u043D\u043E\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438"),
  status: z7.enum(["active", "archived"]).optional(),
  limit: z7.number().int().optional().describe("1\u2013100, \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E 20"),
  cursor: z7.string().optional().describe("nextCursor \u0438\u0437 \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0433\u043E \u043E\u0442\u0432\u0435\u0442\u0430")
});
var SearchOutput2 = z7.object({
  items: z7.array(ContractorListItem),
  nextCursor: z7.string().nullable()
});
var ContactItem = z7.object({
  fullName: z7.string(),
  position: nullableString2,
  phone: nullableString2,
  email: nullableString2,
  isPrimary: z7.boolean()
});
var GetInput2 = z7.object({
  contractorId: z7.uuid().describe("\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430 (UUID)"),
  include: z7.array(z7.enum(["contacts", "documents", "summary"])).optional().describe("\u0427\u0442\u043E \u0434\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043A \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0435: \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u044B (\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E), \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B, \u0441\u0432\u043E\u0434\u043A\u0430")
});
var DocumentItemSchema = z7.object({
  id: z7.string(),
  type: z7.string(),
  number: nullableString2,
  documentDate: nullableString2,
  status: z7.string(),
  total: nullableString2,
  paid: nullableString2
});
var GetOutput2 = z7.object({
  id: z7.string(),
  shortName: z7.string(),
  fullName: z7.string(),
  kind: z7.string(),
  visibility: z7.string(),
  organizationId: nullableString2,
  inn: z7.string(),
  kpp: nullableString2,
  ogrn: nullableString2,
  ogrnip: nullableString2,
  legalAddress: nullableString2,
  actualAddress: nullableString2,
  phone: nullableString2,
  emails: z7.array(z7.string()),
  comment: nullableString2,
  status: z7.string(),
  contacts: z7.array(ContactItem),
  documents: z7.array(DocumentItemSchema).optional(),
  summary: z7.object({
    contractsCount: z7.number(),
    contractsAmount: z7.string(),
    documentsCount: z7.number(),
    total: z7.string(),
    paid: z7.string(),
    debt: z7.string(),
    lastOperationAt: nullableString2
  }).optional()
});
var SummaryInput = z7.object({
  contractorId: z7.uuid().describe("\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430 (UUID)"),
  from: z7.string().regex(/^\d{2}\.\d{2}\.\d{4}$/).optional().describe("\u041D\u0430\u0447\u0430\u043B\u043E \u043F\u0435\u0440\u0438\u043E\u0434\u0430, DD.MM.YYYY (\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E \u2014 \u0431\u0435\u0437 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u0438\u044F)"),
  to: z7.string().regex(/^\d{2}\.\d{2}\.\d{4}$/).optional().describe("\u041A\u043E\u043D\u0435\u0446 \u043F\u0435\u0440\u0438\u043E\u0434\u0430, DD.MM.YYYY (\u0432\u043B\u0438\u044F\u0435\u0442 \u043D\u0430 \u0441\u0430\u043B\u044C\u0434\u043E \u0438 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B)")
});
var SummaryOutput = z7.object({
  contractor: z7.object({
    id: z7.string(),
    shortName: z7.string(),
    inn: z7.string(),
    kpp: nullableString2,
    kind: z7.string(),
    status: z7.string()
  }),
  balance: z7.object({
    at: nullableString2,
    opening: z7.string(),
    turnover: z7.string(),
    closing: z7.string(),
    documents: z7.number(),
    payments: z7.number()
  }),
  totals: z7.object({
    contractsCount: z7.number(),
    contractsAmount: z7.string(),
    documentsCount: z7.number(),
    total: z7.string(),
    paid: z7.string(),
    debt: z7.string(),
    overdueRemaining: z7.string(),
    lastOperationAt: nullableString2
  }),
  lastDocuments: z7.array(DocumentItemSchema),
  unpaid: z7.array(z7.object({
    id: z7.string(),
    number: z7.string(),
    documentDate: z7.string(),
    type: z7.string(),
    status: z7.string(),
    total: z7.string(),
    remaining: z7.string(),
    daysOverdue: z7.number()
  }))
});
function documentRow(document) {
  return {
    id: document.id,
    type: document.type,
    number: document.number ?? null,
    documentDate: document.documentDate ?? null,
    status: document.status,
    total: document.total ?? null,
    paid: document.paid ?? null
  };
}
function registerContractorTools(server, ctx) {
  server.registerTool(SEARCH_TOOL2, {
    title: "\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u044B: \u043F\u043E\u0438\u0441\u043A",
    description: "\u0418\u0449\u0435\u0442 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u043E\u0432 \u043F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E, \u0418\u041D\u041D \u0438\u043B\u0438 email. \u0412\u044B\u0437\u044B\u0432\u0430\u0442\u044C \u041F\u0415\u0420\u0415\u0414 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435\u043C \u0441\u0447\u0451\u0442\u0430: \u0441\u043D\u0430\u0447\u0430\u043B\u0430 \u043D\u0430\u0439\u0434\u0438 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0435\u0433\u043E \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430 \u043F\u043E \u0418\u041D\u041D, \u0438 \u0442\u043E\u043B\u044C\u043A\u043E \u0435\u0441\u043B\u0438 \u0435\u0433\u043E \u043D\u0435\u0442 \u2014 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0438 \u0441\u043E\u0437\u0434\u0430\u0442\u044C. \u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443 items + nextCursor.",
    inputSchema: SearchInput2,
    outputSchema: SearchOutput2,
    annotations: READ_ONLY_ANNOTATIONS
  }, (args) => execute(ctx, SEARCH_TOOL2, async () => {
    const limit = resolveLimit(args.limit);
    const response = await ctx.sdk.counterparties.list({
      limit,
      ...args.query === void 0 ? {} : { q: args.query },
      ...args.inn === void 0 ? {} : { inn: args.inn },
      ...args.kind === void 0 ? {} : { kind: args.kind },
      ...args.visibility === void 0 ? {} : { visibility: args.visibility },
      ...args.organizationId === void 0 ? {} : { organizationId: args.organizationId },
      ...args.status === void 0 ? {} : { status: args.status },
      ...args.cursor === void 0 ? {} : { cursor: args.cursor }
    });
    const page = toPage(response);
    const items = page.items.map((contractor) => ({
      id: contractor.id,
      shortName: contractor.shortName,
      inn: contractor.inn,
      kpp: contractor.kpp ?? null,
      kind: contractor.kind,
      visibility: contractor.visibility,
      emails: contractor.emails ?? [],
      status: contractor.status
    }));
    const found = args.inn ?? args.query;
    const markdown = summaryTable({
      title: items.length === 0 ? `\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u044B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B${found === void 0 ? "" : ` \u043F\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u0443 \xAB${found}\xBB`}. \u0415\u0441\u043B\u0438 \u0435\u0433\u043E \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u0442\u0435\u043B\u044C\u043D\u043E \u043D\u0435\u0442 \u2014 \u043F\u0440\u0435\u0434\u043B\u043E\u0436\u0438\u0442\u0435 \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u043D\u043E\u0432\u043E\u0433\u043E (\u044D\u0442\u043E \u0438\u0437\u043C\u0435\u043D\u0438\u0442 \u0434\u0430\u043D\u043D\u044B\u0435, \u043D\u0443\u0436\u043D\u043E \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435).` : `\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u043E\u0432: ${items.length}${found === void 0 ? "" : ` (\u0437\u0430\u043F\u0440\u043E\u0441 \xAB${found}\xBB)`}`,
      headers: ["\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442", "\u0418\u041D\u041D", "\u0412\u0438\u0434", "\u0412\u0438\u0434\u0438\u043C\u043E\u0441\u0442\u044C", "\u0421\u0442\u0430\u0442\u0443\u0441"],
      rows: items.map((contractor) => [
        contractor.shortName,
        contractor.inn,
        label(COUNTERPARTY_KIND, contractor.kind),
        label(VISIBILITY, contractor.visibility),
        label(ORG_STATUS, contractor.status)
      ]),
      footer: [
        ...nextPageHint(page) === void 0 ? [] : [nextPageHint(page) ?? ""],
        "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0443 \u0438 \u0441\u0432\u043E\u0434\u043A\u0443 \u043F\u043E \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0443 \u043E\u0442\u0434\u0430\u044E\u0442 invoices_contractors_get \u0438 invoices_contractors_summary."
      ]
    });
    return toolResult(markdown, { items, nextCursor: page.nextCursor });
  }));
  server.registerTool(GET_TOOL2, {
    title: "\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442: \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0430",
    description: '\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430: \u0440\u0435\u043A\u0432\u0438\u0437\u0438\u0442\u044B, \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u044B, \u043F\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u0443 \u2014 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u0438 \u0441\u0432\u043E\u0434\u043A\u0430. include: ["documents"] \u0434\u043E\u0431\u0430\u0432\u0438\u0442 5 \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0445 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432, ["summary"] \u2014 \u0441\u0443\u043C\u043C\u044B \u0438 \u0434\u043E\u043B\u0433.',
    inputSchema: GetInput2,
    outputSchema: GetOutput2,
    annotations: READ_ONLY_ANNOTATIONS
  }, (args) => execute(ctx, GET_TOOL2, async () => {
    const card = await loadContractorCard(ctx, args.contractorId, args.include ?? ["contacts"]);
    return toolResult(card.markdown, card.data);
  }));
  server.registerTool(SUMMARY_TOOL, {
    title: "\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442: \u043A\u0430\u0440\u0442\u0430 \u0432\u0437\u0430\u0438\u043C\u043E\u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u0439",
    description: "\u0421\u0432\u043E\u0434\u043A\u0430 \u043F\u043E \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0443 \u0437\u0430 \u043F\u0435\u0440\u0438\u043E\u0434: \u0441\u0430\u043B\u044C\u0434\u043E \u0438 \u043E\u0431\u043E\u0440\u043E\u0442\u044B, \u0441\u0443\u043C\u043C\u044B \u043F\u043E \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430\u043C, \u0434\u043E\u043B\u0433, \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u043A\u0430, \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u0438 \u043D\u0435\u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043D\u044B\u0435 \u0441 \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u043A\u043E\u0439 \u0432 \u0434\u043D\u044F\u0445. \u0418\u0441\u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u044C, \u043A\u043E\u0433\u0434\u0430 \u0441\u043F\u0440\u0430\u0448\u0438\u0432\u0430\u044E\u0442 \xAB\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0434\u043E\u043B\u0436\u0435\u043D\xBB, \xAB\u0447\u0442\u043E \u043D\u0435 \u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043E\xBB, \xAB\u043A\u0430\u043A\u0438\u0435 \u043E\u0442\u043D\u043E\u0448\u0435\u043D\u0438\u044F\xBB.",
    inputSchema: SummaryInput,
    outputSchema: SummaryOutput,
    annotations: READ_ONLY_ANNOTATIONS
  }, (args) => execute(ctx, SUMMARY_TOOL, async () => {
    const [contractor, balance, summaryView, unpaidResponse, documentsResponse] = await Promise.all([
      ctx.sdk.counterparties.getCounterparty(args.contractorId),
      ctx.sdk.counterparties.getCounterpartyBalance(args.contractorId, {
        ...args.to === void 0 ? {} : { at: args.to }
      }),
      ctx.sdk.counterparties.getCounterpartySummary(args.contractorId),
      ctx.sdk.reports.reportsUnpaid({ counterpartyId: args.contractorId, limit: 10 }),
      ctx.sdk.counterparties.listCounterpartyDocuments(args.contractorId, {
        limit: 5,
        ...args.from === void 0 ? {} : { from: args.from },
        ...args.to === void 0 ? {} : { to: args.to }
      })
    ]);
    const unpaid = unpaidResponse.items.map((item) => ({
      id: item.id,
      number: item.number,
      documentDate: item.documentDate,
      type: item.type,
      status: item.status,
      total: item.total,
      remaining: item.remaining,
      daysOverdue: item.daysOverdue
    }));
    const overdueKopecks = unpaid.filter((item) => item.daysOverdue > 0).reduce((sum, item) => sum + parseKopecksSafe(item.remaining), 0n);
    const lastDocuments = toPage(documentsResponse).items.map(documentRow);
    const markdown = [
      `**${contractor.shortName}**, \u0418\u041D\u041D ${contractor.inn} \u2014 \u043D\u0430 ${balance.at}`,
      "",
      mdBullets([
        `\u0421\u0430\u043B\u044C\u0434\u043E \u043D\u0430\u0447\u0430\u043B\u044C\u043D\u043E\u0435: ${formatMoneyString(balance.opening)}`,
        `\u041E\u0431\u043E\u0440\u043E\u0442 \u0437\u0430 \u043F\u0435\u0440\u0438\u043E\u0434: ${formatMoneyString(balance.turnover)}`,
        `\u0421\u0430\u043B\u044C\u0434\u043E \u043A\u043E\u043D\u0435\u0447\u043D\u043E\u0435 (\u0434\u043E\u043B\u0433): ${formatMoneyString(balance.closing)}`,
        `\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432: ${summaryView.documents.count} \u043D\u0430 ${formatMoneyString(summaryView.documents.total)}, \u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043E ${formatMoneyString(summaryView.documents.paid)}, \u0434\u043E\u043B\u0433 ${formatMoneyString(summaryView.documents.debt)}`,
        `\u0414\u043E\u0433\u043E\u0432\u043E\u0440\u043E\u0432: ${summaryView.contracts.count} \u043D\u0430 ${formatMoneyString(summaryView.contracts.amount)}`,
        summaryView.lastOperationAt === null ? "\u041E\u043F\u0435\u0440\u0430\u0446\u0438\u0439 \u043D\u0435 \u0431\u044B\u043B\u043E" : `\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u044F\u044F \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u044F: ${formatIsoDate(summaryView.lastOperationAt)}`
      ]),
      "",
      "**\u041D\u0435\u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043D\u044B\u0435**",
      unpaid.length === 0 ? "\u041D\u0435\u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043D\u044B\u0445 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \u043D\u0435\u0442." : mdBullets(unpaid.map((item) => `${label(DOCUMENT_TYPE, item.type)} \u2116 ${item.number} \u043E\u0442 ${item.documentDate}: \u043E\u0441\u0442\u0430\u0442\u043E\u043A ${formatMoneyString(item.remaining)}${item.daysOverdue > 0 ? `, \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u043A\u0430 ${item.daysOverdue} \u0434\u043D.` : ""}`)),
      "",
      "**\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B**",
      lastDocuments.length === 0 ? "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \u043D\u0435\u0442." : mdBullets(lastDocuments.map((document) => `${label(DOCUMENT_TYPE, document.type)} \u2116 ${document.number ?? "\u0431/\u043D"} \u043E\u0442 ${document.documentDate ?? "\u2014"}: ${formatMoneyString(document.total)} (\u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043E ${formatMoneyString(document.paid)})`))
    ].join("\n");
    return toolResult(markdown, {
      contractor: {
        id: contractor.id,
        shortName: contractor.shortName,
        inn: contractor.inn,
        kpp: contractor.kpp ?? null,
        kind: contractor.kind,
        status: contractor.status
      },
      balance: {
        at: balance.at ?? null,
        opening: balance.opening,
        turnover: balance.turnover,
        closing: balance.closing,
        documents: balance.documents,
        payments: balance.payments
      },
      totals: {
        contractsCount: summaryView.contracts.count,
        contractsAmount: summaryView.contracts.amount,
        documentsCount: summaryView.documents.count,
        total: summaryView.documents.total,
        paid: summaryView.documents.paid,
        debt: summaryView.documents.debt,
        overdueRemaining: formatKopecksSafe(overdueKopecks),
        lastOperationAt: summaryView.lastOperationAt ?? null
      },
      lastDocuments,
      unpaid
    });
  }));
}
async function loadContractorCard(ctx, contractorId, includeList) {
  const include = new Set(includeList);
  const contractor = await ctx.sdk.counterparties.getCounterparty(contractorId);
  const contacts = contractor.contacts.map((contact) => ({
    fullName: contact.fullName,
    position: contact.position ?? null,
    phone: contact.phone ?? null,
    email: contact.email ?? null,
    isPrimary: contact.isPrimary
  }));
  const documents = include.has("documents") ? toPage(await ctx.sdk.counterparties.listCounterpartyDocuments(contractorId, { limit: 5 })).items.map(documentRow) : void 0;
  const summaryView = include.has("summary") ? await ctx.sdk.counterparties.getCounterpartySummary(contractorId) : void 0;
  const summary = summaryView === void 0 ? void 0 : {
    contractsCount: summaryView.contracts.count,
    contractsAmount: summaryView.contracts.amount,
    documentsCount: summaryView.documents.count,
    total: summaryView.documents.total,
    paid: summaryView.documents.paid,
    debt: summaryView.documents.debt,
    lastOperationAt: summaryView.lastOperationAt ?? null
  };
  const lines = [
    `**${contractor.shortName}** (${label(COUNTERPARTY_KIND, contractor.kind)})`,
    `\u0418\u041D\u041D ${contractor.inn}${contractor.kpp === null ? "" : `, \u041A\u041F\u041F ${contractor.kpp}`}`,
    `\u0412\u0438\u0434\u0438\u043C\u043E\u0441\u0442\u044C: ${label(VISIBILITY, contractor.visibility)}; \u0441\u0442\u0430\u0442\u0443\u0441: ${label(ORG_STATUS, contractor.status)}`,
    contractor.legalAddress === null ? "" : `\u0410\u0434\u0440\u0435\u0441: ${contractor.legalAddress}`,
    contractor.phone === null ? "" : `\u0422\u0435\u043B\u0435\u0444\u043E\u043D: ${contractor.phone}`,
    contractor.emails.length === 0 ? "" : `Email: ${contractor.emails.join(", ")}`,
    contractor.comment === null ? "" : `\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439: ${contractor.comment}`
  ].filter((line) => line !== "");
  const contactLines = contacts.length === 0 ? ["\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u043E\u0432 \u043D\u0435\u0442."] : contacts.map((contact) => `- ${contact.fullName}${contact.position === null ? "" : `, ${contact.position}`}${contact.phone === null ? "" : `, ${contact.phone}`}${contact.isPrimary ? " (\u043E\u0441\u043D\u043E\u0432\u043D\u043E\u0439)" : ""}`);
  const blocks = [lines.join("\n"), "", "**\u041A\u043E\u043D\u0442\u0430\u043A\u0442\u044B**", contactLines.join("\n")];
  if (documents !== void 0) {
    blocks.push("", "**\u041F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B**", documents.length === 0 ? "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \u043D\u0435\u0442." : mdBullets(documents.map((document) => `${label(DOCUMENT_TYPE, document.type)} \u2116 ${document.number ?? "\u0431/\u043D"} \u043E\u0442 ${document.documentDate ?? "\u2014"}: ${formatMoneyString(document.total)}, ${label(DOCUMENT_STATUS, document.status)}`)));
  }
  if (summary !== void 0) {
    blocks.push("", "**\u0421\u0432\u043E\u0434\u043A\u0430**", mdBullets([
      `\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432: ${summary.documentsCount} \u043D\u0430 ${formatMoneyString(summary.total)}`,
      `\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E: ${formatMoneyString(summary.paid)}, \u0434\u043E\u043B\u0433: ${formatMoneyString(summary.debt)}`,
      `\u0414\u043E\u0433\u043E\u0432\u043E\u0440\u043E\u0432: ${summary.contractsCount} \u043D\u0430 ${formatMoneyString(summary.contractsAmount)}`
    ]));
  }
  return {
    markdown: blocks.join("\n"),
    data: {
      id: contractor.id,
      shortName: contractor.shortName,
      fullName: contractor.fullName,
      kind: contractor.kind,
      visibility: contractor.visibility,
      organizationId: contractor.organizationId ?? null,
      inn: contractor.inn,
      kpp: contractor.kpp ?? null,
      ogrn: contractor.ogrn ?? null,
      ogrnip: contractor.ogrnip ?? null,
      legalAddress: contractor.legalAddress ?? null,
      actualAddress: contractor.actualAddress ?? null,
      phone: contractor.phone ?? null,
      emails: contractor.emails ?? [],
      comment: contractor.comment ?? null,
      status: contractor.status,
      contacts,
      ...documents === void 0 ? {} : { documents },
      ...summary === void 0 ? {} : { summary }
    }
  };
}
function parseKopecksSafe(value) {
  try {
    return parseKopecks(value);
  } catch {
    return 0n;
  }
}
function formatKopecksSafe(kopecks) {
  const negative = kopecks < 0n;
  const absolute = negative ? -kopecks : kopecks;
  return `${negative ? "-" : ""}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, "0")}`;
}
var CREATE_TOOL = "invoices_contractors_create";
var UPDATE_TOOL = "invoices_contractors_update";
var ARCHIVE_TOOL = "invoices_contractors_archive";
var ContactInput = z7.object({
  fullName: z7.string().trim().min(1),
  position: z7.string().optional(),
  phone: z7.string().optional(),
  email: z7.email().optional(),
  isPrimary: z7.boolean().optional()
});
var CreateInput = z7.object({
  kind: z7.enum(["legal", "sole_proprietor", "individual"]).describe("\u0412\u0438\u0434 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430"),
  visibility: z7.enum(["shared", "organization"]).optional().describe("shared \u2014 \u043E\u0431\u0449\u0438\u0439 \u0434\u043B\u044F \u0440\u0430\u0431\u043E\u0447\u0435\u0439 \u043E\u0431\u043B\u0430\u0441\u0442\u0438 (\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E), organization \u2014 \u0442\u043E\u043B\u044C\u043A\u043E \u0434\u043B\u044F \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438"),
  organizationId: z7.uuid().optional().describe("\u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u0435\u043D \u043F\u0440\u0438 visibility = organization"),
  shortName: z7.string().trim().min(1).describe("\u041A\u0440\u0430\u0442\u043A\u043E\u0435 \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435, \u043A\u0430\u043A \u0432 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430\u0445"),
  fullName: z7.string().trim().min(1).describe("\u041F\u043E\u043B\u043D\u043E\u0435 \u043D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435"),
  inn: z7.string().trim().min(10).describe("\u0418\u041D\u041D: 10 \u0446\u0438\u0444\u0440 \u0443 \u044E\u0440\u043B\u0438\u0446\u0430, 12 \u0443 \u0418\u041F \u0438 \u0444\u0438\u0437\u043B\u0438\u0446\u0430"),
  kpp: z7.string().optional().describe("\u041A\u041F\u041F \u2014 \u0442\u043E\u043B\u044C\u043A\u043E \u0434\u043B\u044F \u044E\u0440\u043B\u0438\u0446\u0430"),
  ogrn: z7.string().optional(),
  ogrnip: z7.string().optional(),
  legalAddress: z7.string().optional(),
  actualAddress: z7.string().optional(),
  phone: z7.string().optional(),
  emails: z7.array(z7.email()).optional(),
  comment: z7.string().optional(),
  contacts: z7.array(ContactInput).optional(),
  confirm: z7.boolean().optional().describe("\u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E true \u2014 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u043C\u0435\u043D\u044F\u0435\u0442 \u0434\u0430\u043D\u043D\u044B\u0435")
});
var CreateOutput = z7.object({
  id: z7.string(),
  shortName: z7.string(),
  inn: z7.string(),
  warnings: z7.array(z7.object({ code: z7.string(), message: z7.string() }))
});
var UpdateInput = z7.object({
  contractorId: z7.uuid(),
  shortName: z7.string().trim().min(1).optional(),
  fullName: z7.string().trim().min(1).optional(),
  visibility: z7.enum(["shared", "organization"]).optional(),
  organizationId: z7.uuid().optional(),
  kpp: z7.string().optional(),
  ogrn: z7.string().optional(),
  ogrnip: z7.string().optional(),
  legalAddress: z7.string().optional(),
  actualAddress: z7.string().optional(),
  phone: z7.string().optional(),
  emails: z7.array(z7.email()).optional(),
  comment: z7.string().optional(),
  confirm: z7.boolean().optional()
});
var UpdateOutput = z7.object({
  id: z7.string(),
  shortName: z7.string(),
  updatedFields: z7.array(z7.string())
});
var ArchiveInput = z7.object({
  contractorId: z7.uuid(),
  confirm: z7.boolean().optional()
});
var ArchiveOutput = z7.object({
  id: z7.string(),
  status: z7.literal("archived")
});
function registerContractorWriteTools(server, ctx) {
  server.registerTool(CREATE_TOOL, {
    title: "\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442: \u0441\u043E\u0437\u0434\u0430\u0442\u044C",
    description: "\u0421\u043E\u0437\u0434\u0430\u0451\u0442 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430. \u0421\u041D\u0410\u0427\u0410\u041B\u0410 \u0432\u044B\u0437\u043E\u0432\u0438\u0442\u0435 invoices_contractors_search \u043F\u043E \u0418\u041D\u041D \u2014 \u0434\u0443\u0431\u043B\u0438 \u043C\u0435\u0448\u0430\u044E\u0442 \u0438\u0441\u0442\u043E\u0440\u0438\u0438. \u0422\u0440\u0435\u0431\u0443\u0435\u0442 confirm: true \u0438 \u044F\u0432\u043D\u043E\u0433\u043E \u0441\u043E\u0433\u043B\u0430\u0441\u0438\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F. API \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442 warnings (\u043F\u043E\u0445\u043E\u0436\u0438\u0435 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u044B) \u2014 \u043F\u043E\u043A\u0430\u0436\u0438\u0442\u0435 \u0438\u0445 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044E.",
    inputSchema: CreateInput,
    outputSchema: CreateOutput,
    annotations: { ...WRITE_ANNOTATIONS, idempotentHint: false }
  }, (args) => mutation(ctx, CREATE_TOOL, args.confirm, async () => {
    const { confirm: _confirm, ...body } = args;
    const result = await ctx.sdk.counterparties.createCounterparty({
      ...body,
      ...body.visibility === void 0 ? {} : { visibility: body.visibility }
    });
    const warnings = result.warnings.map((warning) => ({
      code: warning.code,
      message: warning.message
    }));
    const markdown = [
      `\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442 \u0441\u043E\u0437\u0434\u0430\u043D: **${result.counterparty.shortName}**, \u0418\u041D\u041D ${result.counterparty.inn}`,
      `ID: ${result.counterparty.id}`,
      ...warnings.length === 0 ? [] : ["", "**\u041E\u0431\u0440\u0430\u0442\u0438\u0442\u0435 \u0432\u043D\u0438\u043C\u0430\u043D\u0438\u0435**", mdBullets(warnings.map((warning) => warning.message))],
      "",
      "\u0414\u0430\u043B\u044C\u0448\u0435: \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A \u0441\u0447\u0451\u0442\u0430 \u0441\u043E\u0437\u0434\u0430\u0451\u0442\u0441\u044F \u0447\u0435\u0440\u0435\u0437 invoices_documents_create_draft."
    ].join("\n");
    return toolResult(markdown, {
      id: result.counterparty.id,
      shortName: result.counterparty.shortName,
      inn: result.counterparty.inn,
      warnings
    });
  }));
  server.registerTool(UPDATE_TOOL, {
    title: "\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442: \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u044C",
    description: "\u041F\u0440\u0430\u0432\u0438\u0442 \u0440\u0435\u043A\u0432\u0438\u0437\u0438\u0442\u044B \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430. `inn` \u0438 `kind` \u0438\u0437\u043C\u0435\u043D\u0438\u0442\u044C \u043D\u0435\u043B\u044C\u0437\u044F (\u0441\u043E\u0437\u0434\u0430\u0439\u0442\u0435 \u043D\u043E\u0432\u043E\u0433\u043E \u0438 \u0430\u0440\u0445\u0438\u0432\u0438\u0440\u0443\u0439\u0442\u0435 \u0441\u0442\u0430\u0440\u043E\u0433\u043E). \u0422\u0440\u0435\u0431\u0443\u0435\u0442 confirm: true.",
    inputSchema: UpdateInput,
    outputSchema: UpdateOutput,
    annotations: WRITE_ANNOTATIONS
  }, (args) => mutation(ctx, UPDATE_TOOL, args.confirm, async () => {
    const { confirm: _confirm, contractorId, ...patch } = args;
    const updated = await ctx.sdk.counterparties.updateCounterparty(contractorId, patch);
    const updatedFields = Object.keys(patch).filter((key) => patch[key] !== void 0);
    return toolResult([
      `\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442 \u043E\u0431\u043D\u043E\u0432\u043B\u0451\u043D: **${updated.shortName}**`,
      `\u0418\u0437\u043C\u0435\u043D\u0435\u043D\u044B \u043F\u043E\u043B\u044F: ${updatedFields.length === 0 ? "\u2014" : updatedFields.join(", ")}`
    ].join("\n"), { id: updated.id, shortName: updated.shortName, updatedFields });
  }));
  server.registerTool(ARCHIVE_TOOL, {
    title: "\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442: \u0430\u0440\u0445\u0438\u0432\u0438\u0440\u043E\u0432\u0430\u0442\u044C",
    description: "\u041F\u0435\u0440\u0435\u043D\u043E\u0441\u0438\u0442 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430 \u0432 \u0430\u0440\u0445\u0438\u0432. \u0414\u0430\u043D\u043D\u044B\u0435 \u0438 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u0441\u043E\u0445\u0440\u0430\u043D\u044F\u044E\u0442\u0441\u044F, \u043D\u043E \u0432\u044B\u0431\u0440\u0430\u0442\u044C \u0435\u0433\u043E \u0432 \u043D\u043E\u0432\u044B\u0445 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430\u0445 \u043D\u0435\u043B\u044C\u0437\u044F. \u0422\u0440\u0435\u0431\u0443\u0435\u0442 confirm: true \u2014 \u043E\u043F\u0435\u0440\u0430\u0446\u0438\u044F \u043C\u0435\u043D\u044F\u0435\u0442 \u0441\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A.",
    inputSchema: ArchiveInput,
    outputSchema: ArchiveOutput,
    annotations: DESTRUCTIVE_ANNOTATIONS
  }, (args) => mutation(ctx, ARCHIVE_TOOL, args.confirm, async () => {
    await ctx.sdk.counterparties.archiveCounterparty(args.contractorId);
    return toolResult(`\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442 ${args.contractorId} \u043F\u0435\u0440\u0435\u043D\u0435\u0441\u0451\u043D \u0432 \u0430\u0440\u0445\u0438\u0432. \u0412\u0435\u0440\u043D\u0443\u0442\u044C \u0435\u0433\u043E \u043C\u043E\u0436\u043D\u043E \u0432 \u043A\u0430\u0431\u0438\u043D\u0435\u0442\u0435.`, { id: args.contractorId, status: "archived" });
  }));
}

// apps/mcp/dist/resources/contractors.js
var RESOURCE2 = "contractor";
var TEMPLATE2 = "contractor://{id}";
function registerContractorResources(server, ctx) {
  server.registerResource(RESOURCE2, new ResourceTemplate2(TEMPLATE2, {
    list: () => listTemplateItems(ctx, RESOURCE2, async () => {
      const items = toPage(await ctx.sdk.counterparties.list({ limit: 5 })).items;
      return items.map((contractor) => ({
        uri: `contractor://${contractor.id}`,
        name: contractor.shortName,
        title: contractor.shortName,
        description: `\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442, \u0418\u041D\u041D ${contractor.inn}`
      }));
    }),
    complete: {
      id: completeIds(async () => toPage(await ctx.sdk.counterparties.list({ limit: 5 })).items)
    }
  }), {
    title: "\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442",
    description: "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430: \u0440\u0435\u043A\u0432\u0438\u0437\u0438\u0442\u044B, \u043A\u043E\u043D\u0442\u0430\u043A\u0442\u044B, \u0441\u0443\u043C\u043C\u044B \u0438 \u0434\u043E\u043B\u0433, \u043F\u043E\u0441\u043B\u0435\u0434\u043D\u0438\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B. \u0422\u043E\u043B\u044C\u043A\u043E \u0447\u0442\u0435\u043D\u0438\u0435.",
    mimeType: "text/markdown"
  }, (uri, variables) => readResource(ctx, RESOURCE2, async () => {
    const card = await loadContractorCard(ctx, requireId(variables, TEMPLATE2), [
      "contacts",
      "documents",
      "summary"
    ]);
    return resourceResult(uri, card.markdown, card.data);
  }));
}

// apps/mcp/dist/resources/documents.js
import { ProtocolError as ProtocolError3, ProtocolErrorCode as ProtocolErrorCode2, ResourceTemplate as ResourceTemplate3 } from "@modelcontextprotocol/server";

// apps/mcp/dist/tools/documents.js
import { z as z8 } from "zod";
var SEARCH_TOOL3 = "invoices_documents_search";
var GET_TOOL3 = "invoices_documents_get";
var PAYMENTS_TOOL = "invoices_documents_payment_status";
var PDF_TOOL = "invoices_documents_pdf_link";
var DOCUMENT_STATUSES = [
  "draft",
  "on_approval",
  "issued",
  "sent",
  "partially_paid",
  "paid",
  "overdue",
  "cancelled",
  "signed"
];
var DOCUMENT_TYPES = ["invoice", "act", "invoice_facture", "upd", "contract"];
var DateOnly2 = z8.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, "\u0434\u0430\u0442\u0430 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 DD.MM.YYYY");
var DocumentListItem = z8.object({
  id: z8.string(),
  type: z8.string(),
  status: z8.string(),
  number: nullableString,
  documentDate: nullableString,
  counterpartyId: nullableString,
  counterpartyShortName: nullableString,
  contractNumber: nullableString,
  total: nullableString,
  paid: nullableString,
  remaining: nullableString,
  currentRevision: z8.number()
});
var SearchInput3 = z8.object({
  type: z8.enum(DOCUMENT_TYPES).optional().describe("\u0422\u0438\u043F: \u0441\u0447\u0451\u0442, \u0430\u043A\u0442, \u0441\u0447\u0451\u0442-\u0444\u0430\u043A\u0442\u0443\u0440\u0430, \u0423\u041F\u0414, \u0434\u043E\u0433\u043E\u0432\u043E\u0440"),
  status: z8.array(z8.enum(DOCUMENT_STATUSES)).optional().describe("\u0424\u0438\u043B\u044C\u0442\u0440 \u043F\u043E \u0441\u0442\u0430\u0442\u0443\u0441\u0430\u043C (\u043B\u044E\u0431\u043E\u0439 \u0438\u0437)"),
  organizationId: z8.uuid().optional().describe("\u0422\u043E\u043B\u044C\u043A\u043E \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u044D\u0442\u043E\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438"),
  contractorId: z8.uuid().optional().describe("\u0422\u043E\u043B\u044C\u043A\u043E \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u044D\u0442\u043E\u0433\u043E \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430 (ID \u0438\u0437 invoices_contractors_search)"),
  contractId: z8.uuid().optional().describe("\u0422\u043E\u043B\u044C\u043A\u043E \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u044D\u0442\u043E\u0433\u043E \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0430"),
  number: z8.string().trim().min(1).optional().describe("\u041D\u043E\u043C\u0435\u0440 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430 (\u0442\u043E\u0447\u043D\u043E\u0435 \u0441\u043E\u0432\u043F\u0430\u0434\u0435\u043D\u0438\u0435)"),
  query: z8.string().trim().min(1).optional().describe("\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043D\u043E\u043C\u0435\u0440\u0443, \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0443, \u043D\u0430\u0437\u043D\u0430\u0447\u0435\u043D\u0438\u044E"),
  from: DateOnly2.optional().describe("\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u0441 \u0434\u0430\u0442\u044B (DD.MM.YYYY)"),
  to: DateOnly2.optional().describe("\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u043F\u043E \u0434\u0430\u0442\u0443 (DD.MM.YYYY)"),
  overdueOnly: z8.boolean().optional().describe("\u0422\u043E\u043B\u044C\u043A\u043E \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u0435\u043D\u043D\u044B\u0435"),
  sort: z8.enum(["createdAt_desc", "documentDate_desc", "documentDate_asc"]).optional().describe("\u0421\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u043A\u0430; \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E \u2014 createdAt_desc"),
  limit: z8.number().int().optional().describe("1\u2013100, \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E 20"),
  cursor: z8.string().optional().describe("nextCursor \u0438\u0437 \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0433\u043E \u043E\u0442\u0432\u0435\u0442\u0430")
});
var SearchOutput3 = z8.object({
  items: z8.array(DocumentListItem),
  nextCursor: z8.string().nullable(),
  pageTotals: z8.object({
    total: z8.string(),
    paid: z8.string(),
    remaining: z8.string()
  })
});
var ItemView = z8.object({
  lineNo: z8.number(),
  name: z8.string(),
  unit: nullableString,
  qty: nullableString,
  price: nullableString,
  vatRate: z8.number().nullable(),
  lineTotal: nullableString,
  vatAmount: nullableString,
  discount: nullableRecord.optional(),
  note: nullableString
});
var GetInput3 = z8.object({
  documentId: z8.uuid().describe("\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430 (UUID)"),
  revision: z8.number().int().min(0).optional().describe("\u0412\u0435\u0440\u0441\u0438\u044F \u0432\u044B\u0434\u0430\u043D\u043D\u043E\u0433\u043E \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430; \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E \u2014 \u0442\u0435\u043A\u0443\u0449\u0430\u044F")
});
var GetOutput3 = z8.object({
  id: z8.string(),
  type: z8.string(),
  docKind: nullableString,
  status: z8.string(),
  number: nullableString,
  documentDate: nullableString,
  currentRevision: z8.number(),
  organizationId: z8.string(),
  counterparty: z8.object({
    id: z8.string(),
    shortName: z8.string(),
    inn: nullableString,
    kpp: nullableString
  }),
  contract: z8.object({ id: z8.string() }).nullable(),
  totals: z8.object({
    subtotal: nullableString,
    discountTotal: nullableString,
    vatTotal: nullableString,
    grandTotal: nullableString,
    itemsCount: z8.number(),
    vatMode: nullableString
  }),
  payments: z8.object({
    total: nullableString,
    paid: nullableString,
    remaining: nullableString,
    overpaid: nullableString
  }),
  dates: z8.object({
    issuedAt: nullableString,
    cancelledAt: nullableString,
    cancelReason: nullableString,
    receivedAt: nullableString,
    createdAt: nullableString
  }),
  items: z8.array(ItemView),
  warnings: z8.array(z8.object({ code: z8.string(), message: z8.string() })),
  viewRevision: z8.number(),
  changeReason: nullableString
});
var PaymentsInput = z8.object({
  documentId: z8.uuid().describe("\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430 (UUID)")
});
var PaymentItem = z8.object({
  id: z8.string(),
  amount: nullableString,
  paidAt: nullableString,
  method: nullableString,
  comment: nullableString
});
var PaymentsOutput = z8.object({
  documentId: z8.string(),
  status: z8.string(),
  total: nullableString,
  paid: nullableString,
  remaining: nullableString,
  overpaid: nullableString,
  payments: z8.array(PaymentItem)
});
var PdfInput = z8.object({
  documentId: z8.uuid().describe("\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430 (UUID)"),
  revision: z8.number().int().min(0).optional().describe("\u0412\u0435\u0440\u0441\u0438\u044F \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430"),
  seal: z8.boolean().optional().describe("\u0421 \u043F\u0435\u0447\u0430\u0442\u044C\u044E \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 (\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E \u043A\u0430\u043A \u0432 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0435)"),
  sign: z8.boolean().optional().describe("\u0421 \u043F\u043E\u0434\u043F\u0438\u0441\u044C\u044E (\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E \u043A\u0430\u043A \u0432 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0435)"),
  watermark: z8.enum(["draft", "paid", "sample", "corrected"]).optional().describe("\u0412\u043E\u0434\u044F\u043D\u043E\u0439 \u0437\u043D\u0430\u043A: \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A, \u043E\u043F\u043B\u0430\u0447\u0435\u043D, \u043E\u0431\u0440\u0430\u0437\u0435\u0446, \u0438\u0441\u043F\u0440\u0430\u0432\u043B\u0435\u043D\u043D\u044B\u0439")
});
var PdfOutput = z8.object({
  url: z8.string(),
  expiresAt: z8.string()
});
function sumPage(items) {
  const sum = (pick) => {
    const total = items.reduce((acc, item) => acc + parseSafe(pick(item)), 0n);
    const negative = total < 0n;
    const absolute = negative ? -total : total;
    return `${negative ? "-" : ""}${absolute / 100n}.${(absolute % 100n).toString().padStart(2, "0")}`;
  };
  return {
    total: sum((item) => item.total),
    paid: sum((item) => item.paid),
    remaining: sum((item) => item.remaining)
  };
}
function parseSafe(value) {
  if (value === null || value === "")
    return 0n;
  try {
    const [rubles = "0", fraction = ""] = value.split(".");
    const negative = rubles.startsWith("-");
    const kopecks = BigInt(negative ? rubles.slice(1) : rubles) * 100n + BigInt(fraction.padEnd(2, "0").slice(0, 2));
    return negative ? -kopecks : kopecks;
  } catch {
    return 0n;
  }
}
function registerDocumentTools(server, ctx) {
  server.registerTool(SEARCH_TOOL3, {
    title: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B: \u043F\u043E\u0438\u0441\u043A",
    description: "\u041F\u043E\u0438\u0441\u043A \u0441\u0447\u0435\u0442\u043E\u0432, \u0430\u043A\u0442\u043E\u0432, \u0441\u0447\u0435\u0442\u043E\u0432-\u0444\u0430\u043A\u0442\u0443\u0440, \u0423\u041F\u0414 \u0438 \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u043E\u0432 \u043F\u043E \u0442\u0438\u043F\u0443, \u0441\u0442\u0430\u0442\u0443\u0441\u0443, \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0443, \u0434\u043E\u0433\u043E\u0432\u043E\u0440\u0443, \u043D\u043E\u043C\u0435\u0440\u0443, \u043F\u0435\u0440\u0438\u043E\u0434\u0443 \u0438 \u0442\u0435\u043A\u0441\u0442\u0443. \u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443 \u0441 \u0441\u0443\u043C\u043C\u0430\u043C\u0438 \u0438 nextCursor. \u042D\u0442\u043E \u043E\u0441\u043D\u043E\u0432\u043D\u043E\u0439 \u0441\u043F\u043E\u0441\u043E\u0431 \u043D\u0430\u0439\u0442\u0438 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u043F\u0435\u0440\u0435\u0434 \u0432\u044B\u0437\u043E\u0432\u043E\u043C invoices_documents_get.",
    inputSchema: SearchInput3,
    outputSchema: SearchOutput3,
    annotations: READ_ONLY_ANNOTATIONS
  }, (args) => execute(ctx, SEARCH_TOOL3, async () => {
    const limit = resolveLimit(args.limit);
    const response = await ctx.sdk.documents.list({
      limit,
      ...args.type === void 0 ? {} : { type: args.type },
      ...args.status === void 0 ? {} : { status: [...args.status] },
      ...args.organizationId === void 0 ? {} : { organizationId: args.organizationId },
      ...args.contractorId === void 0 ? {} : { counterpartyId: args.contractorId },
      ...args.contractId === void 0 ? {} : { contractId: args.contractId },
      ...args.number === void 0 ? {} : { number: args.number },
      ...args.query === void 0 ? {} : { q: args.query },
      ...args.from === void 0 ? {} : { from: args.from },
      ...args.to === void 0 ? {} : { to: args.to },
      ...args.overdueOnly === true ? { overdueOnly: true } : {},
      ...args.sort === void 0 ? {} : { sort: args.sort },
      ...args.cursor === void 0 ? {} : { cursor: args.cursor }
    });
    const page = toPage(response);
    const items = page.items.map((document) => ({
      id: document.id,
      type: document.type,
      status: document.status,
      number: document.number ?? null,
      documentDate: document.documentDate ?? null,
      counterpartyId: document.counterpartyId ?? null,
      counterpartyShortName: document.counterpartyShortName ?? null,
      contractNumber: document.contractNumber ?? null,
      total: document.total ?? null,
      paid: document.paid ?? null,
      remaining: document.remaining ?? null,
      currentRevision: document.currentRevision
    }));
    const pageTotals = sumPage(items);
    const markdown = summaryTable({
      title: items.length === 0 ? "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B. \u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043F\u0435\u0440\u0438\u043E\u0434, \u0442\u0438\u043F \u0438 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430." : `\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435: ${items.length}`,
      headers: ["\u2116", "\u0414\u0430\u0442\u0430", "\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442", "\u0421\u0443\u043C\u043C\u0430", "\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E", "\u0421\u0442\u0430\u0442\u0443\u0441"],
      rows: items.map((document) => [
        document.number ?? "\u0431/\u043D",
        document.documentDate ?? "\u2014",
        document.counterpartyShortName ?? "\u2014",
        formatMoneyString(document.total),
        formatMoneyString(document.paid),
        label(DOCUMENT_STATUS, document.status)
      ]),
      footer: [
        `\u0418\u0442\u043E\u0433\u043E \u043F\u043E \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435: ${formatMoneyString(pageTotals.total)}, \u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043E ${formatMoneyString(pageTotals.paid)}, \u043E\u0441\u0442\u0430\u0442\u043E\u043A ${formatMoneyString(pageTotals.remaining)}`,
        ...nextPageHint(page) === void 0 ? [] : [nextPageHint(page) ?? ""],
        "\u041F\u043E\u043B\u043D\u044B\u0435 \u0434\u0430\u043D\u043D\u044B\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430 (\u043F\u043E\u0437\u0438\u0446\u0438\u0438, \u0441\u0443\u043C\u043C\u044B, \u041D\u0414\u0421) \u043E\u0442\u0434\u0430\u0451\u0442 invoices_documents_get."
      ]
    });
    return toolResult(markdown, { items, nextCursor: page.nextCursor, pageTotals });
  }));
  server.registerTool(GET_TOOL3, {
    title: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442: \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0430",
    description: "\u041F\u043E\u043B\u043D\u0430\u044F \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430: \u0441\u0442\u0430\u0442\u0443\u0441, \u0441\u0443\u043C\u043C\u044B \u0438 \u041D\u0414\u0421, \u043F\u043E\u0437\u0438\u0446\u0438\u0438, \u043E\u043F\u043B\u0430\u0442\u044B, \u043F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u044F. \u041F\u0430\u0440\u0430\u043C\u0435\u0442\u0440 revision \u043E\u0442\u0434\u0430\u0451\u0442 \u0441\u043E\u0445\u0440\u0430\u043D\u0451\u043D\u043D\u0443\u044E \u0432\u0435\u0440\u0441\u0438\u044E \u0432\u044B\u0434\u0430\u043D\u043D\u043E\u0433\u043E \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430. \u0412\u044B\u0434\u0430\u043D\u043D\u044B\u0439 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u043D\u0435\u0438\u0437\u043C\u0435\u043D\u044F\u0435\u043C \u2014 \u043F\u0440\u0430\u0432\u043A\u0438 \u0442\u043E\u043B\u044C\u043A\u043E \u043D\u043E\u0432\u043E\u0439 \u0432\u0435\u0440\u0441\u0438\u0435\u0439 \u0447\u0435\u0440\u0435\u0437 \u043A\u0430\u0431\u0438\u043D\u0435\u0442.",
    inputSchema: GetInput3,
    outputSchema: GetOutput3,
    annotations: READ_ONLY_ANNOTATIONS
  }, (args) => execute(ctx, GET_TOOL3, async () => {
    const card = await loadDocumentCard(ctx, args.documentId, args.revision);
    return toolResult(card.markdown, card.data);
  }));
  server.registerTool(PAYMENTS_TOOL, {
    title: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442: \u043E\u043F\u043B\u0430\u0442\u044B \u0438 \u043E\u0441\u0442\u0430\u0442\u043E\u043A",
    description: "\u041E\u043F\u043B\u0430\u0442\u044B \u043F\u043E \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0443: \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043E, \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043E, \u043E\u0441\u0442\u0430\u0442\u043E\u043A \u0438 \u043F\u0435\u0440\u0435\u043F\u043B\u0430\u0442\u0430, \u0441\u043F\u0438\u0441\u043E\u043A \u043F\u043B\u0430\u0442\u0435\u0436\u0435\u0439 \u0441 \u0434\u0430\u0442\u043E\u0439 \u0438 \u0441\u043F\u043E\u0441\u043E\u0431\u043E\u043C. \u0414\u043B\u044F \u0432\u043E\u043F\u0440\u043E\u0441\u0430 \xAB\u043E\u043F\u043B\u0430\u0447\u0435\u043D \u043B\u0438 \u0441\u0447\u0451\u0442\xBB \u0438\u0441\u043F\u043E\u043B\u044C\u0437\u0443\u0439\u0442\u0435 \u044D\u0442\u043E\u0442 \u0438\u043D\u0441\u0442\u0440\u0443\u043C\u0435\u043D\u0442.",
    inputSchema: PaymentsInput,
    outputSchema: PaymentsOutput,
    annotations: READ_ONLY_ANNOTATIONS
  }, (args) => execute(ctx, PAYMENTS_TOOL, async () => {
    const result = await ctx.sdk.payments.listDocument(args.documentId);
    const payments = result.items.map((payment) => ({
      id: payment.id,
      amount: payment.amount ?? null,
      paidAt: payment.paidAt ?? null,
      method: payment.method ?? null,
      comment: payment.comment ?? null
    }));
    const markdown = [
      `\u041E\u043F\u043B\u0430\u0442\u044B \u043F\u043E \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0443: ${label(DOCUMENT_STATUS, result.status)}`,
      "",
      mdBullets([
        `\u0412\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043E: ${formatMoneyString(result.total)}`,
        `\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E: ${formatMoneyString(result.paid)}`,
        `\u041E\u0441\u0442\u0430\u0442\u043E\u043A: ${formatMoneyString(result.remaining)}`,
        ...result.overpaid === null || result.overpaid === "0.00" ? [] : [`\u041F\u0435\u0440\u0435\u043F\u043B\u0430\u0442\u0430: ${formatMoneyString(result.overpaid)}`]
      ]),
      "",
      "**\u041F\u043B\u0430\u0442\u0435\u0436\u0438**",
      payments.length === 0 ? "\u041F\u043B\u0430\u0442\u0435\u0436\u0435\u0439 \u043D\u0435\u0442." : mdBullets(payments.map((payment) => `${payment.paidAt ?? "\u2014"}: ${formatMoneyString(payment.amount)}${payment.method === "bank" ? " (\u0431\u0430\u043D\u043A)" : " (\u0432\u0440\u0443\u0447\u043D\u0443\u044E)"}${payment.comment === null ? "" : ` \u2014 ${payment.comment}`}`))
    ].join("\n");
    return toolResult(markdown, {
      documentId: result.documentId,
      status: result.status,
      total: result.total ?? null,
      paid: result.paid ?? null,
      remaining: result.remaining ?? null,
      overpaid: result.overpaid ?? null,
      payments
    });
  }));
  server.registerTool(PDF_TOOL, {
    title: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442: \u0441\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 PDF",
    description: "\u041A\u043E\u0440\u043E\u0442\u043A\u043E\u0436\u0438\u0432\u0443\u0449\u0430\u044F \u0441\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 PDF \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430 (\u0441 \u043F\u0435\u0447\u0430\u0442\u044C\u044E \u0438 \u043F\u043E\u0434\u043F\u0438\u0441\u044C\u044E \u043F\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u0443). PDF \u043D\u0435 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442\u0441\u044F \u0441\u043E\u0434\u0435\u0440\u0436\u0438\u043C\u044B\u043C \u2014 \u0442\u043E\u043B\u044C\u043A\u043E URL: \u043E\u0442\u0434\u0430\u0439\u0442\u0435 \u0435\u0433\u043E \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044E, \u0441\u0441\u044B\u043B\u043A\u0430 \u0440\u0430\u0431\u043E\u0442\u0430\u0435\u0442 \u0431\u0435\u0437 \u0442\u043E\u043A\u0435\u043D\u0430 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F.",
    inputSchema: PdfInput,
    outputSchema: PdfOutput,
    annotations: READ_ONLY_ANNOTATIONS
  }, (args) => execute(ctx, PDF_TOOL, async () => {
    const link = await createDocumentPdfLink(ctx, args.documentId, {
      revision: args.revision,
      seal: args.seal,
      sign: args.sign,
      watermark: args.watermark
    });
    return toolResult(link.markdown, link.data);
  }));
}
async function loadDocumentCard(ctx, documentId, revision) {
  const current = await ctx.sdk.documents.get(documentId);
  const version = revision === void 0 ? void 0 : await ctx.sdk.documents.getDocumentVersion(documentId, String(revision));
  const itemsSource = version?.items ?? current.items;
  const items = itemsSource.map((item) => ({
    lineNo: item.lineNo,
    name: item.name,
    unit: item.unit ?? null,
    qty: item.qty ?? null,
    price: item.price ?? null,
    vatRate: item.vatRate ?? null,
    lineTotal: item.lineTotal ?? null,
    vatAmount: item.vatAmount ?? null,
    ...item.discount === void 0 || item.discount === null ? {} : { discount: item.discount },
    note: item.note ?? null
  }));
  const counterparty = {
    id: current.counterparty.id,
    shortName: current.counterparty.shortName,
    inn: current.counterparty.inn ?? null,
    kpp: current.counterparty.kpp ?? null
  };
  const grandTotal = version?.totals.grandTotal ?? current.totals.grandTotal ?? null;
  const vatTotal = version?.totals.vatTotal ?? current.totals.vatTotal ?? null;
  const subtotal = version?.totals.subtotal ?? current.totals.subtotal ?? null;
  const discountTotal = version?.totals.discountTotal ?? current.totals.discountTotal ?? null;
  const marks = [
    `${label(DOCUMENT_TYPE, current.type)} \u2116 ${current.number ?? "\u0431/\u043D"} \u043E\u0442 ${current.documentDate ?? "\u2014"}`,
    `\u0421\u0442\u0430\u0442\u0443\u0441: ${label(DOCUMENT_STATUS, current.status)}` + (current.currentRevision === 0 ? "" : `, \u0442\u0435\u043A\u0443\u0449\u0430\u044F \u0432\u0435\u0440\u0441\u0438\u044F ${current.currentRevision}`),
    `\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442: ${counterparty.shortName} (\u0418\u041D\u041D ${counterparty.inn ?? "\u2014"})`,
    current.contractId === null ? "" : `\u0414\u043E\u0433\u043E\u0432\u043E\u0440: ${current.contractId}`,
    `\u0421\u0443\u043C\u043C\u0430: ${formatMoneyString(grandTotal)}` + (vatTotal === null ? "" : `, \u0432 \u0442.\u0447. \u041D\u0414\u0421 ${formatMoneyString(vatTotal)}`),
    `\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E: ${formatMoneyString(current.payments.paid)}, \u043E\u0441\u0442\u0430\u0442\u043E\u043A ${formatMoneyString(current.payments.remaining)}`,
    current.issuedAt === null ? "" : `\u0412\u044B\u0434\u0430\u043D: ${formatIsoDate(current.issuedAt)}`,
    current.cancelledAt === null ? "" : `\u0410\u043D\u043D\u0443\u043B\u0438\u0440\u043E\u0432\u0430\u043D: ${formatIsoDate(current.cancelledAt)}` + (current.cancelReason === null ? "" : ` (${current.cancelReason})`),
    version === void 0 ? "" : `\u041F\u043E\u043A\u0430\u0437\u0430\u043D\u0430 \u0432\u0435\u0440\u0441\u0438\u044F ${version.revision} \u043E\u0442 ${formatIsoDate(version.createdAt)}` + (version.changeReason === "" ? "" : ` \u2014 ${version.changeReason}`)
  ].filter((line) => line !== "");
  const positionRows = items.slice(0, 10).map((item) => [
    String(item.lineNo),
    `${item.name}${item.unit === null ? "" : `, ${item.unit}`}`,
    `${item.qty ?? "\u2014"} \xD7 ${formatMoneyString(item.price)}`,
    formatMoneyString(item.lineTotal),
    item.vatRate === null ? "\u2014" : `${item.vatRate} %`
  ]);
  const blocks = [marks.join("\n")];
  if (positionRows.length > 0) {
    blocks.push("", `\u041F\u043E\u0437\u0438\u0446\u0438\u0438 (${items.length}):`, "", summaryTable({
      title: "",
      headers: ["\u2116", "\u041F\u043E\u0437\u0438\u0446\u0438\u044F", "\u041A\u043E\u043B-\u0432\u043E \xD7 \u0446\u0435\u043D\u0430", "\u0421\u0443\u043C\u043C\u0430", "\u041D\u0414\u0421"],
      rows: positionRows
    }).replace(/^\n+/, "").replace(/^\n+/, ""));
    if (items.length > 10) {
      blocks.push("", `\u2026\u0438 \u0435\u0449\u0451 ${items.length - 10}. \u041F\u043E\u043B\u043D\u044B\u0439 \u0441\u043F\u0438\u0441\u043E\u043A \u2014 \u0432 structuredContent.`);
    }
  }
  if (current.warnings.length > 0) {
    blocks.push("", "**\u041F\u0440\u0435\u0434\u0443\u043F\u0440\u0435\u0436\u0434\u0435\u043D\u0438\u044F**", mdBullets(current.warnings.map((warning) => warning.message)));
  }
  blocks.push("", "PDF: \u0441\u0441\u044B\u043B\u043A\u0443 \u043E\u0442\u0434\u0430\u0451\u0442 invoices_documents_pdf_link (\u0436\u0438\u0432\u0451\u0442 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u043D\u043E\u0435 \u0432\u0440\u0435\u043C\u044F).");
  return {
    markdown: blocks.join("\n"),
    parentDocumentId: current.parentDocumentId ?? null,
    data: {
      id: current.id,
      type: current.type,
      docKind: current.docKind ?? null,
      status: current.status,
      number: current.number ?? null,
      documentDate: current.documentDate ?? null,
      currentRevision: current.currentRevision,
      organizationId: current.organizationId,
      counterparty,
      contract: current.contractId === null ? null : { id: current.contractId },
      totals: {
        subtotal,
        discountTotal,
        vatTotal,
        grandTotal,
        itemsCount: items.length,
        vatMode: current.totals.vatMode ?? null
      },
      payments: {
        total: current.payments.total ?? null,
        paid: current.payments.paid ?? null,
        remaining: current.payments.remaining ?? null,
        overpaid: current.payments.overpaid ?? null
      },
      dates: {
        issuedAt: current.issuedAt ?? null,
        cancelledAt: current.cancelledAt ?? null,
        cancelReason: current.cancelReason ?? null,
        receivedAt: current.receivedAt ?? null,
        createdAt: current.createdAt ?? null
      },
      items,
      warnings: current.warnings.map((warning) => ({
        code: warning.code,
        message: warning.message
      })),
      viewRevision: version?.revision ?? 0,
      changeReason: version === void 0 ? null : version.changeReason
    }
  };
}
async function createDocumentPdfLink(ctx, documentId, options) {
  const link = await ctx.sdk.documents.createDocumentPdfLink(documentId, {
    ...options.revision === void 0 ? {} : { revision: options.revision },
    ...options.seal === void 0 ? {} : { seal: options.seal ? "true" : "false" },
    ...options.sign === void 0 ? {} : { sign: options.sign ? "true" : "false" },
    ...options.watermark === void 0 ? {} : { watermark: options.watermark }
  });
  const markdown = [
    `\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 PDF: ${link.url}`,
    "",
    `\u0414\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u0434\u043E ${formatIsoDate(link.expiresAt)} (${link.expiresAt}).`,
    "\u0421\u0441\u044B\u043B\u043A\u0430 \u043F\u0443\u0431\u043B\u0438\u0447\u043D\u0430\u044F: \u043A\u0442\u043E \u0435\u0451 \u043F\u043E\u043B\u0443\u0447\u0438\u043B, \u0442\u043E\u0442 \u043C\u043E\u0436\u0435\u0442 \u043E\u0442\u043A\u0440\u044B\u0442\u044C PDF. \u041D\u0435 \u043F\u0435\u0440\u0435\u0441\u044B\u043B\u0430\u0439\u0442\u0435 \u0435\u0451 \u0432 \u043D\u0435\u0434\u043E\u0432\u0435\u0440\u0435\u043D\u043D\u044B\u0435 \u043A\u0430\u043D\u0430\u043B\u044B."
  ].join("\n");
  return { markdown, data: { url: link.url, expiresAt: link.expiresAt } };
}
var CREATE_DRAFT_TOOL = "invoices_documents_create_draft";
var UPDATE_ITEMS_TOOL = "invoices_documents_update_items";
var ISSUE_TOOL = "invoices_documents_issue";
var CANCEL_TOOL = "invoices_documents_cancel";
var DELETE_DRAFT_TOOL = "invoices_documents_delete_draft";
var CREATE_ACT_TOOL = "invoices_documents_create_act";
var IMPORT_TOOL = "invoices_documents_import";
var MoneyString2 = z8.string().regex(/^\d+(\.\d{1,2})?$/, '\u0441\u0443\u043C\u043C\u0430 \u0441\u0442\u0440\u043E\u043A\u043E\u0439 \u0432 \u0440\u0443\u0431\u043B\u044F\u0445 \u0441 \u043A\u043E\u043F\u0435\u0439\u043A\u0430\u043C\u0438, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 "124000.00"');
var QtyString = z8.string().regex(/^\d+(\.\d{1,3})?$/, "\u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0441\u0442\u0440\u043E\u043A\u043E\u0439, \u0434\u043E \u0442\u0440\u0451\u0445 \u0437\u043D\u0430\u043A\u043E\u0432 \u043F\u043E\u0441\u043B\u0435 \u0442\u043E\u0447\u043A\u0438");
var VatRate = z8.union([
  z8.literal(0),
  z8.literal(5),
  z8.literal(7),
  z8.literal(10),
  z8.literal(20),
  z8.literal(22)
]);
var ItemInput = z8.object({
  productId: z8.uuid().optional().describe("ID \u043F\u043E\u0437\u0438\u0446\u0438\u0438 \u043D\u043E\u043C\u0435\u043D\u043A\u043B\u0430\u0442\u0443\u0440\u044B, \u0435\u0441\u043B\u0438 \u0446\u0435\u043D\u0430 \u0431\u0435\u0440\u0451\u0442\u0441\u044F \u0438\u0437 \u0441\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A\u0430"),
  name: z8.string().trim().min(1).describe("\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435 \u0432 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0435"),
  unit: z8.string().trim().min(1).describe("\u0415\u0434\u0438\u043D\u0438\u0446\u0430: \u0448\u0442, \u0443\u0441\u043B, \u043C\u0435\u0441, \u0447 \u2026"),
  qty: QtyString,
  price: MoneyString2.describe("\u0426\u0435\u043D\u0430 \u0437\u0430 \u0435\u0434\u0438\u043D\u0438\u0446\u0443 \u0432 \u0440\u0443\u0431\u043B\u044F\u0445"),
  discount: z8.object({ kind: z8.enum(["percent", "amount"]), value: z8.string() }).optional().describe("\u0421\u043A\u0438\u0434\u043A\u0430: percent \u2014 \u043F\u0440\u043E\u0446\u0435\u043D\u0442\u044B, amount \u2014 \u0441\u0443\u043C\u043C\u0430 \u0432 \u0440\u0443\u0431\u043B\u044F\u0445"),
  vatRate: VatRate.optional().describe("\u0421\u0442\u0430\u0432\u043A\u0430 \u041D\u0414\u0421: 0, 5, 7, 10, 20 \u0438\u043B\u0438 22"),
  note: z8.string().optional()
});
var TotalsOutput = z8.object({
  subtotal: nullableString,
  discountTotal: nullableString,
  vatTotal: nullableString,
  grandTotal: nullableString
});
var CreateDraftInput = z8.object({
  type: z8.enum(["invoice", "act", "invoice_facture"]).describe("\u0422\u0438\u043F \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A\u0430"),
  organizationId: z8.uuid().describe("\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F, \u043E\u0442 \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u044F\u0435\u0442\u0441\u044F \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442"),
  contractorId: z8.uuid().describe("\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442 (ID \u0438\u0437 invoices_contractors_search)"),
  documentDate: DateOnly2.describe("\u0414\u0430\u0442\u0430 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430, DD.MM.YYYY"),
  contractId: z8.uuid().optional().describe("\u0414\u043E\u0433\u043E\u0432\u043E\u0440, \u043A \u043A\u043E\u0442\u043E\u0440\u043E\u043C\u0443 \u043E\u0442\u043D\u043E\u0441\u0438\u0442\u0441\u044F \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442"),
  basis: z8.string().optional().describe("\u041E\u0441\u043D\u043E\u0432\u0430\u043D\u0438\u0435"),
  period: z8.object({ from: DateOnly2, to: DateOnly2, label: z8.string().optional() }).optional().describe("\u041F\u0435\u0440\u0438\u043E\u0434 \u043E\u043A\u0430\u0437\u0430\u043D\u0438\u044F \u0443\u0441\u043B\u0443\u0433 (\u0434\u043B\u044F \u0430\u043A\u0442\u0430)"),
  note: z8.string().optional(),
  items: z8.array(ItemInput).min(1).describe("\u041F\u043E\u0437\u0438\u0446\u0438\u0438 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430; \u0446\u0435\u043D\u0430 \u0438 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0441\u0442\u0440\u043E\u043A\u0430\u043C\u0438"),
  idempotencyKey: z8.string().regex(/^[A-Za-z0-9_-]{8,128}$/).optional().describe("\u041A\u043B\u044E\u0447 \u0438\u0434\u0435\u043C\u043F\u043E\u0442\u0435\u043D\u0442\u043D\u043E\u0441\u0442\u0438: \u043F\u0440\u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u0439\u0442\u0435 \u0442\u043E\u0442 \u0436\u0435, \u0447\u0442\u043E\u0431\u044B \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0434\u0443\u0431\u043B\u044C"),
  confirm: z8.boolean().optional().describe("\u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E true")
});
var CreateDraftOutput = z8.object({
  id: z8.string(),
  status: z8.string(),
  totals: TotalsOutput,
  warnings: z8.array(z8.object({ code: z8.string(), message: z8.string() })),
  idempotencyKey: z8.string()
});
var UpdateItemsInput = z8.object({
  documentId: z8.uuid(),
  items: z8.array(ItemInput).min(1).describe("\u041F\u043E\u043B\u043D\u0430\u044F \u0437\u0430\u043C\u0435\u043D\u0430 \u043F\u043E\u0437\u0438\u0446\u0438\u0439: \u0441\u043F\u0438\u0441\u043E\u043A \u0437\u0430\u043C\u0435\u043D\u0438\u0442 \u0442\u0435\u043A\u0443\u0449\u0438\u0439 \u0446\u0435\u043B\u0438\u043A\u043E\u043C"),
  confirm: z8.boolean().optional()
});
var UpdateItemsOutput = z8.object({
  id: z8.string(),
  status: z8.string(),
  totals: TotalsOutput
});
var IssueInput = z8.object({
  documentId: z8.uuid(),
  number: z8.string().optional().describe("\u0421\u0432\u043E\u0439 \u043D\u043E\u043C\u0435\u0440; \u0431\u0435\u0437 \u043D\u0435\u0433\u043E \u2014 \u0438\u0437 \u0441\u0435\u0440\u0432\u0438\u0441\u0430 \u043D\u0443\u043C\u0435\u0440\u0430\u0446\u0438\u0438"),
  documentDate: DateOnly2.optional().describe("\u0414\u0430\u0442\u0430 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430; \u0431\u0435\u0437 \u043D\u0435\u0451 \u2014 \u0442\u0435\u043A\u0443\u0449\u0430\u044F"),
  withSeal: z8.boolean().optional().describe("\u041F\u0435\u0447\u0430\u0442\u044C \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 (\u0435\u0441\u043B\u0438 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u0430)"),
  withSignature: z8.boolean().optional().describe("\u041F\u043E\u0434\u043F\u0438\u0441\u044C (\u0435\u0441\u043B\u0438 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u0430)"),
  idempotencyKey: z8.string().regex(/^[A-Za-z0-9_-]{8,128}$/).optional(),
  confirm: z8.boolean().optional()
});
var IssueOutput = z8.object({
  id: z8.string(),
  number: nullableString,
  status: z8.string(),
  issuedAt: nullableString,
  currentRevision: z8.number(),
  grandTotal: nullableString
});
var CancelInput = z8.object({
  documentId: z8.uuid(),
  reason: z8.string().trim().min(3).describe("\u041F\u0440\u0438\u0447\u0438\u043D\u0430 \u0430\u043D\u043D\u0443\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u044F \u2014 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u0430 \u0438 \u043F\u043E\u043F\u0430\u0434\u0430\u0435\u0442 \u0432 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442"),
  confirm: z8.boolean().optional()
});
var CancelOutput = z8.object({
  id: z8.string(),
  status: z8.string(),
  cancelledAt: nullableString,
  cancelReason: nullableString
});
var DeleteDraftInput = z8.object({
  documentId: z8.uuid(),
  confirm: z8.boolean().optional()
});
var DeleteDraftOutput = z8.object({
  id: z8.string(),
  deleted: z8.literal(true)
});
var CreateActInput = z8.object({
  invoiceId: z8.uuid().describe("\u0421\u0447\u0451\u0442, \u043F\u043E \u043A\u043E\u0442\u043E\u0440\u043E\u043C\u0443 \u0437\u0430\u043A\u0440\u044B\u0432\u0430\u0435\u0442\u0441\u044F \u0430\u043A\u0442"),
  mode: z8.enum(["full", "partial"]).describe("full \u2014 \u0432\u0435\u0441\u044C \u0441\u0447\u0451\u0442, partial \u2014 \u043F\u043E \u043F\u043E\u0437\u0438\u0446\u0438\u044F\u043C"),
  allocations: z8.array(z8.object({ itemId: z8.uuid(), qty: QtyString })).optional().describe("\u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E \u0434\u043B\u044F mode = partial: \u043A\u0430\u043A\u0438\u0435 \u043F\u043E\u0437\u0438\u0446\u0438\u0438 \u0438 \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0437\u0430\u043A\u0440\u044B\u0442\u044C"),
  documentDate: DateOnly2.optional(),
  confirm: z8.boolean().optional()
});
var CreateActOutput = z8.object({
  id: z8.string(),
  number: nullableString,
  status: z8.string(),
  parentDocumentId: nullableString,
  totals: TotalsOutput
});
var ImportInput = z8.object({
  type: z8.enum(["invoice", "act"]).describe("\u0422\u0438\u043F \u0441\u043E\u0437\u0434\u0430\u0432\u0430\u0435\u043C\u043E\u0433\u043E \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A\u0430"),
  organizationId: z8.uuid(),
  contractorId: z8.uuid().optional().describe("\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442; \u043C\u043E\u0436\u043D\u043E \u043D\u0435 \u0443\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C, \u0435\u0441\u043B\u0438 \u043E\u043D \u0435\u0441\u0442\u044C \u0432 \u0444\u0430\u0439\u043B\u0435"),
  documentDate: DateOnly2,
  text: z8.string().min(1).optional().describe("\u041F\u043E\u0437\u0438\u0446\u0438\u0438 \u0442\u0435\u043A\u0441\u0442\u043E\u043C: TSV/CSV. \u041B\u0438\u0431\u043E text, \u043B\u0438\u0431\u043E items \u2014 \u043D\u0435 \u043E\u0431\u0430"),
  items: z8.array(z8.record(z8.string(), z8.unknown())).optional().describe("\u0413\u043E\u0442\u043E\u0432\u044B\u0435 \u043F\u043E\u0437\u0438\u0446\u0438\u0438 \u043C\u0430\u0441\u0441\u0438\u0432\u043E\u043C \u043E\u0431\u044A\u0435\u043A\u0442\u043E\u0432 (\u043F\u043E\u043B\u044F \u043A\u0430\u043A \u0432 items \u043E\u0431\u044B\u0447\u043D\u043E\u0433\u043E \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u044F)"),
  settings: z8.object({
    delimiter: z8.enum(["auto", ",", ";", "|", "	"]).optional().describe('\u0420\u0430\u0437\u0434\u0435\u043B\u0438\u0442\u0435\u043B\u044C; \u0434\u043B\u044F \u0442\u0430\u0431\u0443\u043B\u044F\u0446\u0438\u0438 \u2014 "\\t"'),
    hasHeader: z8.boolean().optional(),
    decimalSeparator: z8.enum(["auto", ".", ","]).optional(),
    sumMismatchPolicy: z8.enum(["trust_sum", "recalc_by_price"]).optional(),
    defaults: z8.object({
      unit: z8.string().optional(),
      qty: z8.string().optional(),
      vatRate: VatRate.optional(),
      discountKind: z8.enum(["none", "percent", "amount"]).optional()
    }).optional()
  }).optional(),
  fileName: z8.string().optional(),
  idempotencyKey: z8.string().regex(/^[A-Za-z0-9_-]{8,128}$/).optional(),
  confirm: z8.boolean().optional()
});
var ImportOutput = z8.object({
  id: z8.string(),
  status: z8.string(),
  totals: z8.record(z8.string(), z8.unknown()),
  importReport: z8.object({
    rowsTotal: z8.number(),
    imported: z8.number(),
    failed: z8.number(),
    skipped: z8.number(),
    errors: z8.array(z8.object({
      row: z8.number().nullable(),
      column: nullableString,
      code: z8.string(),
      message: z8.string()
    }))
  })
});
function registerDocumentWriteTools(server, ctx) {
  server.registerTool(CREATE_DRAFT_TOOL, {
    title: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442: \u0441\u043E\u0437\u0434\u0430\u0442\u044C \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A",
    description: '\u0421\u043E\u0437\u0434\u0430\u0451\u0442 \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A \u0441\u0447\u0451\u0442\u0430/\u0430\u043A\u0442\u0430/\u0441\u0447\u0451\u0442\u0430-\u0444\u0430\u043A\u0442\u0443\u0440\u044B. \u041D\u0415 \u0432\u044B\u0434\u0430\u0451\u0442 \u0435\u0433\u043E: \u043D\u043E\u043C\u0435\u0440 \u0438 PDF \u043F\u043E\u044F\u0432\u044F\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u043E\u0441\u043B\u0435 invoices_documents_issue. \u0426\u0435\u043D\u044B \u0438 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u2014 \u0441\u0442\u0440\u043E\u043A\u0430\u043C\u0438 ("124000.00"), \u043D\u0435 \u0447\u0438\u0441\u043B\u0430\u043C\u0438. \u0422\u0440\u0435\u0431\u0443\u0435\u0442 confirm: true.',
    inputSchema: CreateDraftInput,
    outputSchema: CreateDraftOutput,
    annotations: WRITE_ANNOTATIONS
  }, (args) => mutation(ctx, CREATE_DRAFT_TOOL, args.confirm, async () => {
    const { confirm: _confirm, contractorId, idempotencyKey, ...rest } = args;
    const key = idempotencyKeyOf(idempotencyKey);
    const created = await ctx.sdk.documents.create({ ...rest, counterpartyId: contractorId }, { idempotencyKey: key });
    const totals = {
      subtotal: created.totals.subtotal ?? null,
      discountTotal: created.totals.discountTotal ?? null,
      vatTotal: created.totals.vatTotal ?? null,
      grandTotal: created.totals.grandTotal ?? null
    };
    const warnings = created.warnings.map((warning) => ({
      code: warning.code,
      message: warning.message
    }));
    const markdown = [
      `\u0427\u0435\u0440\u043D\u043E\u0432\u0438\u043A \u0441\u043E\u0437\u0434\u0430\u043D: ${label(DOCUMENT_TYPE, created.type)} \u043E\u0442 ${created.documentDate ?? "\u2014"}`,
      `ID: ${created.id}`,
      "",
      mdBullets([
        `\u0421\u0443\u043C\u043C\u0430: ${formatMoneyString(totals.grandTotal)}`,
        `\u041D\u0414\u0421: ${formatMoneyString(totals.vatTotal)}`,
        `\u041F\u043E\u0437\u0438\u0446\u0438\u0439: ${created.totals.itemsCount}`
      ]),
      ...warnings.length === 0 ? [] : ["", "**\u041E\u0431\u0440\u0430\u0442\u0438\u0442\u0435 \u0432\u043D\u0438\u043C\u0430\u043D\u0438\u0435**", mdBullets(warnings.map((warning) => warning.message))],
      "",
      "\u0414\u0430\u043B\u044C\u0448\u0435: \u043F\u0440\u043E\u0432\u0435\u0440\u0438\u0442\u044C \u043F\u043E\u0437\u0438\u0446\u0438\u0438 (invoices_documents_get / update_items) \u0438 \u0432\u044B\u0434\u0430\u0442\u044C \u0441 invoices_documents_issue (\u043F\u043E\u0442\u0440\u0435\u0431\u0443\u0435\u0442\u0441\u044F confirm: true)."
    ].join("\n");
    return toolResult(markdown, {
      id: created.id,
      status: created.status,
      totals,
      warnings,
      idempotencyKey: key
    });
  }));
  server.registerTool(UPDATE_ITEMS_TOOL, {
    title: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442: \u0437\u0430\u043C\u0435\u043D\u0438\u0442\u044C \u043F\u043E\u0437\u0438\u0446\u0438\u0438",
    description: "\u041F\u043E\u043B\u043D\u043E\u0441\u0442\u044C\u044E \u0437\u0430\u043C\u0435\u043D\u044F\u0435\u0442 \u043F\u043E\u0437\u0438\u0446\u0438\u0438 \u0427\u0415\u0420\u041D\u041E\u0412\u0418\u041A\u0410. \u0423 \u0432\u044B\u0434\u0430\u043D\u043D\u043E\u0433\u043E \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430 \u043F\u0440\u0430\u0432\u043A\u0438 \u0437\u0430\u043F\u0440\u0435\u0449\u0435\u043D\u044B (\u043D\u0443\u0436\u043D\u0430 \u0440\u0435\u0432\u0438\u0437\u0438\u044F \u0432 \u043A\u0430\u0431\u0438\u043D\u0435\u0442\u0435). \u0422\u0440\u0435\u0431\u0443\u0435\u0442 confirm: true.",
    inputSchema: UpdateItemsInput,
    outputSchema: UpdateItemsOutput,
    annotations: WRITE_ANNOTATIONS
  }, (args) => mutation(ctx, UPDATE_ITEMS_TOOL, args.confirm, async () => {
    const { confirm: _confirm, documentId, items } = args;
    const updated = await ctx.sdk.documents.replaceDocumentItems(documentId, { items });
    const totals = {
      subtotal: updated.totals.subtotal ?? null,
      discountTotal: updated.totals.discountTotal ?? null,
      vatTotal: updated.totals.vatTotal ?? null,
      grandTotal: updated.totals.grandTotal ?? null
    };
    return toolResult([
      `\u041F\u043E\u0437\u0438\u0446\u0438\u0438 \u0437\u0430\u043C\u0435\u043D\u0435\u043D\u044B: ${label(DOCUMENT_TYPE, updated.type)} \u043E\u0442 ${updated.documentDate ?? "\u2014"}`,
      "",
      mdBullets([
        `\u0421\u0443\u043C\u043C\u0430: ${formatMoneyString(totals.grandTotal)}`,
        `\u041D\u0414\u0421: ${formatMoneyString(totals.vatTotal)}`,
        `\u041F\u043E\u0437\u0438\u0446\u0438\u0439: ${updated.totals.itemsCount}`
      ])
    ].join("\n"), { id: updated.id, status: updated.status, totals });
  }));
  server.registerTool(ISSUE_TOOL, {
    title: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442: \u0432\u044B\u0434\u0430\u0442\u044C",
    description: "\u0412\u044B\u0434\u0430\u0451\u0442 \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A: \u0444\u0438\u043A\u0441\u0438\u0440\u0443\u0435\u0442 \u043D\u043E\u043C\u0435\u0440, \u0432\u0435\u0440\u0441\u0438\u044E \u0438 PDF. \u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u043F\u043E\u0441\u043B\u0435 \u044D\u0442\u043E\u0433\u043E \u043D\u0435\u0438\u0437\u043C\u0435\u043D\u044F\u0435\u043C (\u043F\u0440\u0430\u0432\u043A\u0438 \u2014 \u0442\u043E\u043B\u044C\u043A\u043E \u0440\u0435\u0432\u0438\u0437\u0438\u0435\u0439 \u0432 \u043A\u0430\u0431\u0438\u043D\u0435\u0442\u0435). \u041D\u0415\u041E\u0411\u0420\u0410\u0422\u0418\u041C\u041E, \u0442\u0440\u0435\u0431\u0443\u0435\u0442 confirm: true \u0438 \u0441\u043E\u0433\u043B\u0430\u0441\u0438\u044F \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F.",
    inputSchema: IssueInput,
    outputSchema: IssueOutput,
    annotations: DESTRUCTIVE_ANNOTATIONS
  }, (args) => mutation(ctx, ISSUE_TOOL, args.confirm, async () => {
    const { confirm: _confirm, documentId, idempotencyKey, ...body } = args;
    const issued = await ctx.sdk.documents.issue(documentId, body, {
      idempotencyKey: idempotencyKeyOf(idempotencyKey)
    });
    const markdown = [
      `\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u0432\u044B\u0434\u0430\u043D: \u2116 **${issued.number ?? "\u0431/\u043D"}** \u043E\u0442 ${issued.documentDate ?? "\u2014"}`,
      "",
      mdBullets([
        `\u0421\u0443\u043C\u043C\u0430: ${formatMoneyString(issued.totals.grandTotal)}`,
        `\u0412\u0435\u0440\u0441\u0438\u044F: ${issued.currentRevision}`,
        `ID: ${issued.id}`
      ]),
      "",
      "\u0421\u0441\u044B\u043B\u043A\u0443 \u043D\u0430 PDF \u0434\u0430\u0451\u0442 invoices_documents_pdf_link. \u0410\u043D\u043D\u0443\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u0438\u0435 \u2014 invoices_documents_cancel (\u0442\u043E\u0436\u0435 \u0441 confirm)."
    ].join("\n");
    return toolResult(markdown, {
      id: issued.id,
      number: issued.number ?? null,
      status: issued.status,
      issuedAt: issued.issuedAt ?? null,
      currentRevision: issued.currentRevision,
      grandTotal: issued.totals.grandTotal ?? null
    });
  }));
  server.registerTool(CANCEL_TOOL, {
    title: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442: \u0430\u043D\u043D\u0443\u043B\u0438\u0440\u043E\u0432\u0430\u0442\u044C",
    description: "\u0410\u043D\u043D\u0443\u043B\u0438\u0440\u0443\u0435\u0442 \u0432\u044B\u0434\u0430\u043D\u043D\u044B\u0439 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u0441 \u043F\u0440\u0438\u0447\u0438\u043D\u043E\u0439. \u041D\u0435\u043E\u0431\u0440\u0430\u0442\u0438\u043C\u043E: \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u043E\u0441\u0442\u0430\u0451\u0442\u0441\u044F \u0432 \u0430\u0440\u0445\u0438\u0432\u0435 \u0441 \u043E\u0442\u043C\u0435\u0442\u043A\u043E\u0439. \u0422\u0440\u0435\u0431\u0443\u0435\u0442 confirm: true \u0438 \u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E\u0439 \u043F\u0440\u0438\u0447\u0438\u043D\u044B.",
    inputSchema: CancelInput,
    outputSchema: CancelOutput,
    annotations: DESTRUCTIVE_ANNOTATIONS
  }, (args) => mutation(ctx, CANCEL_TOOL, args.confirm, async () => {
    const { confirm: _confirm, documentId, reason } = args;
    const cancelled = await ctx.sdk.documents.cancel(documentId, { reason });
    return toolResult([
      `\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u2116 ${cancelled.number ?? "\u0431/\u043D"} \u0430\u043D\u043D\u0443\u043B\u0438\u0440\u043E\u0432\u0430\u043D.`,
      `\u041F\u0440\u0438\u0447\u0438\u043D\u0430: ${cancelled.cancelReason ?? reason}`,
      `\u0410\u043D\u043D\u0443\u043B\u0438\u0440\u043E\u0432\u0430\u043D: ${formatIsoDate(cancelled.cancelledAt)}`
    ].join("\n"), {
      id: cancelled.id,
      status: cancelled.status,
      cancelledAt: cancelled.cancelledAt ?? null,
      cancelReason: cancelled.cancelReason ?? reason
    });
  }));
  server.registerTool(DELETE_DRAFT_TOOL, {
    title: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442: \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A",
    description: "\u0423\u0434\u0430\u043B\u044F\u0435\u0442 \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A. \u0412\u044B\u0434\u0430\u043D\u043D\u044B\u0439 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u0443\u0434\u0430\u043B\u0438\u0442\u044C \u043D\u0435\u043B\u044C\u0437\u044F \u2014 \u0442\u043E\u043B\u044C\u043A\u043E \u0430\u043D\u043D\u0443\u043B\u0438\u0440\u043E\u0432\u0430\u0442\u044C (invoices_documents_cancel). \u0422\u0440\u0435\u0431\u0443\u0435\u0442 confirm: true.",
    inputSchema: DeleteDraftInput,
    outputSchema: DeleteDraftOutput,
    annotations: DESTRUCTIVE_ANNOTATIONS
  }, (args) => mutation(ctx, DELETE_DRAFT_TOOL, args.confirm, async () => {
    await ctx.sdk.documents.delete(args.documentId);
    return toolResult(`\u0427\u0435\u0440\u043D\u043E\u0432\u0438\u043A ${args.documentId} \u0443\u0434\u0430\u043B\u0451\u043D.`, {
      id: args.documentId,
      deleted: true
    });
  }));
  server.registerTool(CREATE_ACT_TOOL, {
    title: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442: \u0430\u043A\u0442 \u043F\u043E \u0441\u0447\u0451\u0442\u0443",
    description: "\u0421\u043E\u0437\u0434\u0430\u0451\u0442 \u0427\u0415\u0420\u041D\u041E\u0412\u0418\u041A \u0430\u043A\u0442\u0430 \u043F\u043E \u0441\u0447\u0451\u0442\u0443: mode = full \u0437\u0430\u043A\u0440\u044B\u0432\u0430\u0435\u0442 \u0441\u0447\u0451\u0442 \u0446\u0435\u043B\u0438\u043A\u043E\u043C, partial \u2014 \u0442\u043E\u043B\u044C\u043A\u043E \u0443\u043A\u0430\u0437\u0430\u043D\u043D\u044B\u0435 \u043F\u043E\u0437\u0438\u0446\u0438\u0438 \u0438 \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u0430 (allocations). \u0422\u0440\u0435\u0431\u0443\u0435\u0442 confirm: true. \u0412\u044B\u0434\u0430\u0447\u0430 \u0430\u043A\u0442\u0430 \u2014 \u043E\u0442\u0434\u0435\u043B\u044C\u043D\u043E \u0447\u0435\u0440\u0435\u0437 invoices_documents_issue.",
    inputSchema: CreateActInput,
    outputSchema: CreateActOutput,
    annotations: WRITE_ANNOTATIONS
  }, (args) => mutation(ctx, CREATE_ACT_TOOL, args.confirm, async () => {
    if (args.mode === "partial" && (args.allocations === void 0 || args.allocations.length === 0)) {
      throw new PaginationError("\u0414\u043B\u044F mode = partial \u043D\u0443\u0436\u0435\u043D allocations: \u0441\u043F\u0438\u0441\u043E\u043A \u043F\u043E\u0437\u0438\u0446\u0438\u0439 {itemId, qty} \u0438\u0437 \u0441\u0447\u0451\u0442\u0430. \u0421\u043E\u0441\u0442\u0430\u0432 \u043F\u043E\u0437\u0438\u0446\u0438\u0439 \u0441\u0447\u0451\u0442\u0430 \u043E\u0442\u0434\u0430\u0451\u0442 invoices_documents_get.");
    }
    const { confirm: _confirm, invoiceId, ...body } = args;
    const act = await ctx.sdk.documents.createActFromInvoice(invoiceId, body);
    const totals = {
      subtotal: act.totals.subtotal ?? null,
      discountTotal: act.totals.discountTotal ?? null,
      vatTotal: act.totals.vatTotal ?? null,
      grandTotal: act.totals.grandTotal ?? null
    };
    return toolResult([
      `\u0427\u0435\u0440\u043D\u043E\u0432\u0438\u043A \u0430\u043A\u0442\u0430 \u0441\u043E\u0437\u0434\u0430\u043D \u043F\u043E \u0441\u0447\u0451\u0442\u0443: ${act.id}`,
      "",
      mdBullets([
        `\u0421\u0443\u043C\u043C\u0430: ${formatMoneyString(totals.grandTotal)}`,
        `\u041F\u043E\u0437\u0438\u0446\u0438\u0439: ${act.totals.itemsCount}`,
        `\u0421\u0447\u0451\u0442-\u0440\u043E\u0434\u0438\u0442\u0435\u043B\u044C: ${act.parentDocumentId ?? invoiceId}`
      ])
    ].join("\n"), {
      id: act.id,
      number: act.number ?? null,
      status: act.status,
      parentDocumentId: act.parentDocumentId ?? null,
      totals
    });
  }));
  server.registerTool(IMPORT_TOOL, {
    title: "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442: \u0438\u043C\u043F\u043E\u0440\u0442 \u043F\u043E\u0437\u0438\u0446\u0438\u0439",
    description: "\u0421\u043E\u0437\u0434\u0430\u0451\u0442 \u0427\u0415\u0420\u041D\u041E\u0412\u0418\u041A \u0438\u0437 \u0441\u043F\u0438\u0441\u043A\u0430 \u043F\u043E\u0437\u0438\u0446\u0438\u0439: \u0442\u0435\u043A\u0441\u0442 (TSV/CSV) \u0438\u043B\u0438 \u0433\u043E\u0442\u043E\u0432\u044B\u0439 JSON-\u043C\u0430\u0441\u0441\u0438\u0432. \u0424\u0430\u0439\u043B\u044B \u043D\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u044E\u0442\u0441\u044F. \u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442 importReport: \u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0441\u0442\u0440\u043E\u043A \u0440\u0430\u0437\u043E\u0431\u0440\u0430\u043D\u043E, \u0447\u0442\u043E \u043D\u0435 \u0443\u0434\u0430\u043B\u043E\u0441\u044C \u0438 \u043F\u043E\u0447\u0435\u043C\u0443. \u0422\u0440\u0435\u0431\u0443\u0435\u0442 confirm: true.",
    inputSchema: ImportInput,
    outputSchema: ImportOutput,
    annotations: WRITE_ANNOTATIONS
  }, (args) => mutation(ctx, IMPORT_TOOL, args.confirm, async () => {
    if (args.text === void 0 === (args.items === void 0)) {
      throw new PaginationError("\u041D\u0443\u0436\u043D\u043E \u0440\u043E\u0432\u043D\u043E \u043E\u0434\u043D\u043E \u0438\u0437 \u0434\u0432\u0443\u0445: text (\u043F\u043E\u0437\u0438\u0446\u0438\u0438 \u0441\u0442\u0440\u043E\u043A\u0430\u043C\u0438 TSV/CSV) \u0438\u043B\u0438 items (\u043C\u0430\u0441\u0441\u0438\u0432 \u043E\u0431\u044A\u0435\u043A\u0442\u043E\u0432). \u041E\u0431\u0430 \u0441\u0440\u0430\u0437\u0443 \u0438\u043B\u0438 \u043D\u0438 \u043E\u0434\u043D\u043E\u0433\u043E \u2014 \u043E\u0448\u0438\u0431\u043A\u0430.");
    }
    const { confirm: _confirm, contractorId, idempotencyKey, ...rest } = args;
    const result = await ctx.sdk.imports.importDocument({
      ...rest,
      ...contractorId === void 0 ? {} : { counterpartyId: contractorId }
    }, { idempotencyKey: idempotencyKeyOf(idempotencyKey) });
    const report = result.importReport;
    return toolResult([
      `\u0418\u043C\u043F\u043E\u0440\u0442 \u0432\u044B\u043F\u043E\u043B\u043D\u0435\u043D: \u0441\u043E\u0437\u0434\u0430\u043D \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A ${result.id}`,
      "",
      mdBullets([
        `\u0421\u0442\u0440\u043E\u043A \u0432 \u0438\u0441\u0442\u043E\u0447\u043D\u0438\u043A\u0435: ${report.rowsTotal}`,
        `\u0418\u043C\u043F\u043E\u0440\u0442\u0438\u0440\u043E\u0432\u0430\u043D\u043E: ${report.imported}`,
        `\u041F\u0440\u043E\u043F\u0443\u0449\u0435\u043D\u043E: ${report.skipped}`,
        `\u0421 \u043E\u0448\u0438\u0431\u043A\u0430\u043C\u0438: ${report.failed}`
      ]),
      ...report.errors.length === 0 ? [] : [
        "",
        "**\u041E\u0448\u0438\u0431\u043A\u0438 \u0441\u0442\u0440\u043E\u043A**",
        mdBullets(report.errors.slice(0, 10).map((error) => `\u0441\u0442\u0440\u043E\u043A\u0430 ${error.row ?? "\u2014"}${error.column === null ? "" : `, \u043A\u043E\u043B\u043E\u043D\u043A\u0430 ${error.column}`}: ${error.message}`)),
        ...report.errors.length > 10 ? [`\u2026\u0438 \u0435\u0449\u0451 ${report.errors.length - 10}.`] : []
      ],
      "",
      "\u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435 \u043F\u043E\u0437\u0438\u0446\u0438\u0438 \u0447\u0435\u0440\u0435\u0437 invoices_documents_get \u043F\u0435\u0440\u0435\u0434 \u0432\u044B\u0434\u0430\u0447\u0435\u0439."
    ].join("\n"), {
      id: result.id,
      status: result.status,
      totals: result.totals ?? {},
      importReport: {
        rowsTotal: report.rowsTotal,
        imported: report.imported,
        failed: report.failed,
        skipped: report.skipped,
        errors: report.errors.map((error) => ({
          row: error.row ?? null,
          column: error.column ?? null,
          code: error.code,
          message: error.message
        }))
      }
    });
  }));
}

// apps/mcp/dist/resources/documents.js
var INVOICE = "invoice";
var INVOICE_TEMPLATE = "invoice://{id}";
var INVOICE_PDF = "invoice-pdf";
var INVOICE_PDF_TEMPLATE = "invoice://{id}/pdf";
var ACT = "act";
var ACT_TEMPLATE = "act://{id}";
function registerDocumentResources(server, ctx) {
  server.registerResource(INVOICE, new ResourceTemplate3(INVOICE_TEMPLATE, {
    list: () => listTemplateItems(ctx, INVOICE, () => listDocuments(ctx, "invoice", "\u0421\u0447\u0451\u0442")),
    complete: {
      id: completeIds(async () => toPage(await ctx.sdk.documents.list({ type: "invoice", limit: 5 })).items)
    }
  }), {
    title: "\u0421\u0447\u0451\u0442",
    description: "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u0441\u0447\u0451\u0442\u0430: \u0448\u0430\u043F\u043A\u0430, \u043F\u043E\u0437\u0438\u0446\u0438\u0438, \u0438\u0442\u043E\u0433\u0438, \u0441\u0442\u0430\u0442\u0443\u0441, \u043E\u043F\u043B\u0430\u0442\u044B. \u0422\u043E\u043B\u044C\u043A\u043E \u0447\u0442\u0435\u043D\u0438\u0435; \u0432\u044B\u0434\u0430\u043D\u043D\u044B\u0439 \u0441\u0447\u0451\u0442 \u043D\u0435\u0438\u0437\u043C\u0435\u043D\u044F\u0435\u043C.",
    mimeType: "text/markdown"
  }, (uri, variables) => readResource(ctx, INVOICE, async () => {
    const id = requireId(variables, INVOICE_TEMPLATE);
    const card = await loadDocumentCard(ctx, id);
    if (card.data.type !== "invoice") {
      throw wrongType(card.data.type, id, "invoice");
    }
    return resourceResult(uri, card.markdown, card.data);
  }));
  server.registerResource(INVOICE_PDF, new ResourceTemplate3(INVOICE_PDF_TEMPLATE, {
    list: () => listTemplateItems(ctx, INVOICE_PDF, async () => {
      const items = await listDocuments(ctx, "invoice", "\u0421\u0447\u0451\u0442");
      return items.map((item) => ({
        ...item,
        uri: `${item.uri}/pdf`,
        name: `${item.name} \u2014 PDF`
      }));
    }),
    complete: {
      id: completeIds(async () => toPage(await ctx.sdk.documents.list({ type: "invoice", limit: 5 })).items)
    }
  }), {
    title: "PDF \u0441\u0447\u0451\u0442\u0430",
    description: "\u0421\u0441\u044B\u043B\u043A\u0430 \u043D\u0430 PDF \u0441\u0447\u0451\u0442\u0430 \u0441 \u043E\u0433\u0440\u0430\u043D\u0438\u0447\u0435\u043D\u043D\u044B\u043C \u0441\u0440\u043E\u043A\u043E\u043C \u0436\u0438\u0437\u043D\u0438 (\u043D\u0435 \u0431\u0438\u043D\u0430\u0440\u043D\u0438\u043A). \u0422\u043E\u043B\u044C\u043A\u043E \u0447\u0442\u0435\u043D\u0438\u0435.",
    mimeType: "text/markdown"
  }, (uri, variables) => readResource(ctx, INVOICE_PDF, async () => {
    const id = requireId(variables, INVOICE_PDF_TEMPLATE);
    const link = await createDocumentPdfLink(ctx, id, {});
    return resourceResult(uri, [`PDF \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430 ${id}`, "", link.markdown].join("\n"), {
      documentId: id,
      ...link.data
    });
  }));
  server.registerResource(ACT, new ResourceTemplate3(ACT_TEMPLATE, {
    list: () => listTemplateItems(ctx, ACT, () => listDocuments(ctx, "act", "\u0410\u043A\u0442")),
    complete: {
      id: completeIds(async () => toPage(await ctx.sdk.documents.list({ type: "act", limit: 5 })).items)
    }
  }), {
    title: "\u0410\u043A\u0442",
    description: "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u0430\u043A\u0442\u0430: \u043F\u043E\u0437\u0438\u0446\u0438\u0438, \u0441\u0443\u043C\u043C\u044B, \u0441\u0447\u0451\u0442-\u043E\u0441\u043D\u043E\u0432\u0430\u043D\u0438\u0435. \u0422\u043E\u043B\u044C\u043A\u043E \u0447\u0442\u0435\u043D\u0438\u0435.",
    mimeType: "text/markdown"
  }, (uri, variables) => readResource(ctx, ACT, async () => {
    const id = requireId(variables, ACT_TEMPLATE);
    const card = await loadDocumentCard(ctx, id);
    if (card.data.type !== "act") {
      throw wrongType(card.data.type, id, "act");
    }
    const parent = card.parentDocumentId;
    const markdown = [
      parent === null ? "\u0421\u0447\u0451\u0442-\u043E\u0441\u043D\u043E\u0432\u0430\u043D\u0438\u0435 \u043D\u0435 \u0443\u043A\u0430\u0437\u0430\u043D." : `\u0421\u0447\u0451\u0442-\u043E\u0441\u043D\u043E\u0432\u0430\u043D\u0438\u0435: invoice://${parent}`,
      "",
      card.markdown
    ].join("\n");
    return resourceResult(uri, markdown, { ...card.data, parentDocumentId: parent });
  }));
}
async function listDocuments(ctx, type, prefix) {
  const items = toPage(await ctx.sdk.documents.list({ type, limit: 5 })).items;
  return items.map((document) => ({
    uri: `${type === "invoice" ? "invoice" : "act"}://${document.id}`,
    name: `${prefix} \u2116 ${document.number ?? "\u0431/\u043D"}`,
    title: `${prefix} \u2116 ${document.number ?? "\u0431/\u043D"} \u043E\u0442 ${document.documentDate}`,
    description: `\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u043E\u0442 ${document.documentDate}, ${document.counterpartyShortName}`
  }));
}
function wrongType(actual, id, expected) {
  const actualLabel = label(DOCUMENT_TYPE, actual);
  const hint = actual === "act" ? `\u0410\u043A\u0442 \u0447\u0438\u0442\u0430\u0439\u0442\u0435 \u043F\u043E act://${id}.` : actual === "invoice" ? `\u0421\u0447\u0451\u0442 \u0447\u0438\u0442\u0430\u0439\u0442\u0435 \u043F\u043E invoice://${id}.` : "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0443 \u043B\u044E\u0431\u043E\u0433\u043E \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430 \u043E\u0442\u0434\u0430\u0451\u0442 invoices_documents_get.";
  return new ProtocolError3(ProtocolErrorCode2.InvalidParams, `${expected === "invoice" ? "invoice://{id}" : "act://{id}"} \u0447\u0438\u0442\u0430\u0435\u0442 \u0442\u043E\u043B\u044C\u043A\u043E ${expected === "invoice" ? "\u0441\u0447\u0435\u0442\u0430" : "\u0430\u043A\u0442\u044B"}, \u0430 \u044D\u0442\u043E\u0442 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u2014 ${actualLabel}. ${hint}`);
}

// apps/mcp/dist/resources/organizations.js
import { ResourceTemplate as ResourceTemplate4 } from "@modelcontextprotocol/server";

// apps/mcp/dist/tools/organizations.js
import { z as z9 } from "zod";
var LIST_TOOL = "invoices_organizations_list";
var GET_TOOL4 = "invoices_organizations_get";
var nullableString3 = z9.string().nullable();
var OrganizationListItem = z9.object({
  id: z9.string(),
  shortName: z9.string(),
  kind: z9.enum(["sole_proprietor", "llc", "other"]),
  inn: z9.string(),
  kpp: nullableString3,
  taxRegime: nullableString3,
  additionalRegime: nullableString3,
  vatStatus: nullableString3,
  status: z9.enum(["active", "archived"])
});
var ListInput = z9.object({
  status: z9.enum(["active", "archived"]).optional().describe("\u0422\u043E\u043B\u044C\u043A\u043E \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0435 \u0438\u043B\u0438 \u0442\u043E\u043B\u044C\u043A\u043E \u0430\u0440\u0445\u0438\u0432\u043D\u044B\u0435 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438"),
  q: z9.string().trim().min(1).optional().describe("\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E \u0438\u043B\u0438 \u0418\u041D\u041D"),
  limit: z9.number().int().optional().describe("\u0421\u043A\u043E\u043B\u044C\u043A\u043E \u0432\u0435\u0440\u043D\u0443\u0442\u044C: 1\u2013100, \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E 20; \u0431\u043E\u043B\u044C\u0448\u0435 100 \u2014 \u043E\u0448\u0438\u0431\u043A\u0430 \u0441 \u043F\u043E\u0434\u0441\u043A\u0430\u0437\u043A\u043E\u0439 \u043F\u0440\u043E cursor"),
  cursor: z9.string().optional().describe("nextCursor \u0438\u0437 \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0433\u043E \u043E\u0442\u0432\u0435\u0442\u0430")
});
var ListOutput = z9.object({
  items: z9.array(OrganizationListItem),
  nextCursor: z9.string().nullable()
});
var GetInput4 = z9.object({
  organizationId: z9.uuid().describe("\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 (UUID)")
});
var SignatoryItem = z9.object({
  fullName: z9.string(),
  position: nullableString3,
  basis: nullableString3,
  isDefault: z9.boolean()
});
var BankAccountItem = z9.object({
  bankName: z9.string(),
  bik: z9.string(),
  account: z9.string(),
  isDefault: z9.boolean()
});
var GetOutput4 = z9.object({
  id: z9.string(),
  shortName: z9.string(),
  fullName: z9.string(),
  kind: z9.string(),
  inn: z9.string(),
  kpp: nullableString3,
  ogrn: nullableString3,
  ogrnip: nullableString3,
  legalAddress: nullableString3,
  actualAddress: nullableString3,
  phone: nullableString3,
  email: nullableString3,
  taxRegime: nullableString3,
  additionalRegime: nullableString3,
  usnObject: nullableString3,
  vatStatus: nullableString3,
  vatScheme: nullableString3,
  vatRateDefault: z9.number().nullable(),
  vatModeDefault: nullableString3,
  bankAccounts: z9.array(BankAccountItem),
  signatories: z9.array(SignatoryItem)
});
function registerOrganizationTools(server, ctx) {
  server.registerTool(LIST_TOOL, {
    title: "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438: \u0441\u043F\u0438\u0441\u043E\u043A",
    description: "\u0421\u043F\u0438\u0441\u043E\u043A \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0439 \u043A\u0430\u0431\u0438\u043D\u0435\u0442\u0430 (\u043A\u0440\u0430\u0442\u043A\u043E: \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u0435, \u0418\u041D\u041D, \u0440\u0435\u0436\u0438\u043C \u041D\u041E, \u041D\u0414\u0421, \u0441\u0442\u0430\u0442\u0443\u0441). \u041D\u0443\u0436\u0435\u043D \u0432 \u0441\u0430\u043C\u043E\u043C \u043D\u0430\u0447\u0430\u043B\u0435, \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u043D\u044F\u0442\u044C, \u043E\u0442 \u043A\u0430\u043A\u043E\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438 \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u044F\u0442\u044C \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B. \u0412\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0443 items + nextCursor.",
    inputSchema: ListInput,
    outputSchema: ListOutput,
    annotations: READ_ONLY_ANNOTATIONS
  }, (args) => execute(ctx, LIST_TOOL, async () => {
    const limit = resolveLimit(args.limit);
    const response = await ctx.sdk.organizations.list({
      limit,
      ...args.status === void 0 ? {} : { status: args.status },
      ...args.q === void 0 ? {} : { q: args.q },
      ...args.cursor === void 0 ? {} : { cursor: args.cursor }
    });
    const page = toPage(response);
    const items = page.items.map((organization) => ({
      id: organization.id,
      shortName: organization.shortName,
      kind: organization.kind,
      inn: organization.inn,
      kpp: organization.kpp ?? null,
      taxRegime: organization.taxRegime ?? null,
      additionalRegime: organization.additionalRegime ?? null,
      vatStatus: organization.vatStatus ?? null,
      status: organization.status
    }));
    const markdown = summaryTable({
      title: `\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0439: ${items.length}${args.q === void 0 ? "" : ` (\u043F\u043E\u0438\u0441\u043A \xAB${args.q}\xBB)`}`,
      headers: ["\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F", "\u0418\u041D\u041D", "\u0420\u0435\u0436\u0438\u043C \u041D\u041E", "\u041D\u0414\u0421", "\u0421\u0442\u0430\u0442\u0443\u0441"],
      rows: items.map((organization) => [
        organization.shortName,
        organization.inn,
        label(TAX_REGIME, organization.taxRegime),
        label(VAT_STATUS, organization.vatStatus),
        label(ORG_STATUS, organization.status)
      ]),
      footer: [
        ...nextPageHint(page) === void 0 ? [] : [nextPageHint(page) ?? ""],
        "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0443 \u0441 \u0440\u0435\u043A\u0432\u0438\u0437\u0438\u0442\u0430\u043C\u0438 \u0438 \u0431\u0430\u043D\u043A\u043E\u0432\u0441\u043A\u0438\u043C\u0438 \u0441\u0447\u0435\u0442\u0430\u043C\u0438 \u043E\u0442\u0434\u0430\u0451\u0442 invoices_organizations_get."
      ]
    });
    return toolResult(markdown, { items, nextCursor: page.nextCursor });
  }));
  server.registerTool(GET_TOOL4, {
    title: "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F: \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0430",
    description: "\u0420\u0435\u043A\u0432\u0438\u0437\u0438\u0442\u044B \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438: \u0418\u041D\u041D/\u041A\u041F\u041F/\u041E\u0413\u0420\u041D, \u0430\u0434\u0440\u0435\u0441\u0430, \u0440\u0435\u0436\u0438\u043C \u041D\u041E \u0438 \u041D\u0414\u0421, \u0431\u0430\u043D\u043A\u043E\u0432\u0441\u043A\u0438\u0435 \u0441\u0447\u0435\u0442\u0430, \u043F\u043E\u0434\u043F\u0438\u0441\u0430\u043D\u0442\u044B \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E. \u041D\u0443\u0436\u043D\u0430 \u043F\u0435\u0440\u0435\u0434 \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u0438\u0435\u043C \u0441\u0447\u0451\u0442\u0430 \u0438 \u0434\u043B\u044F \u043F\u0440\u043E\u0432\u0435\u0440\u043A\u0438 \u0440\u0435\u043A\u0432\u0438\u0437\u0438\u0442\u043E\u0432 \u0432 PDF.",
    inputSchema: GetInput4,
    outputSchema: GetOutput4,
    annotations: READ_ONLY_ANNOTATIONS
  }, (args) => execute(ctx, GET_TOOL4, async () => {
    const card = await loadOrganizationCard(ctx, args.organizationId);
    return toolResult(card.markdown, card.data);
  }));
}
async function loadOrganizationCard(ctx, organizationId) {
  const organization = await ctx.sdk.organizations.get(organizationId);
  const bankAccounts = organization.bankAccounts.map((account) => ({
    bankName: account.bankName,
    bik: account.bik,
    account: account.account,
    isDefault: account.isDefault
  }));
  const signatories = organization.signatories.map((signatory) => ({
    fullName: signatory.fullName,
    position: signatory.position ?? null,
    basis: signatory.basis ?? null,
    isDefault: signatory.isDefault
  }));
  const kindLabel = label(ORGANIZATION_KIND, organization.kind);
  const kindSuffix = organization.shortName.includes(kindLabel) ? "" : ` (${kindLabel})`;
  const requisites = [
    `**${organization.shortName}**${kindSuffix}`,
    `\u0418\u041D\u041D ${organization.inn}${organization.kpp === null ? "" : `, \u041A\u041F\u041F ${organization.kpp}`}`,
    organization.ogrn === null ? "" : `\u041E\u0413\u0420\u041D ${organization.ogrn}`,
    organization.ogrnip === null ? "" : `\u041E\u0413\u0420\u041D\u0418\u041F ${organization.ogrnip}`,
    `\u0420\u0435\u0436\u0438\u043C \u041D\u041E: ${label(TAX_REGIME, organization.taxRegime)}` + (organization.additionalRegime === null ? "" : ` + ${label(TAX_REGIME, organization.additionalRegime)}`),
    `\u041D\u0414\u0421: ${label(VAT_STATUS, organization.vatStatus)}` + (organization.vatRateDefault === null ? "" : `, \u0441\u0442\u0430\u0432\u043A\u0430 \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E ${organization.vatRateDefault} %`),
    organization.legalAddress === null ? "" : `\u042E\u0440\u0438\u0434\u0438\u0447\u0435\u0441\u043A\u0438\u0439 \u0430\u0434\u0440\u0435\u0441: ${organization.legalAddress}`,
    organization.phone === null ? "" : `\u0422\u0435\u043B\u0435\u0444\u043E\u043D: ${organization.phone}`,
    organization.email === null ? "" : `Email: ${organization.email}`
  ].filter((line) => line !== "");
  const accounts = bankAccounts.length === 0 ? ["\u0411\u0430\u043D\u043A\u043E\u0432\u0441\u043A\u0438\u0445 \u0441\u0447\u0435\u0442\u043E\u0432 \u043D\u0435\u0442 \u2014 \u0441\u0447\u0451\u0442 \u043D\u0435\u043B\u044C\u0437\u044F \u0432\u044B\u0434\u0430\u0442\u044C, \u043F\u043E\u043A\u0430 \u043D\u0435 \u0434\u043E\u0431\u0430\u0432\u043B\u0435\u043D \u0441\u0447\u0451\u0442 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438."] : bankAccounts.map((account) => `- ${account.bankName}, \u0411\u0418\u041A ${account.bik}, \u0441\u0447\u0451\u0442 ${account.account}${account.isDefault ? " (\u043E\u0441\u043D\u043E\u0432\u043D\u043E\u0439)" : ""}`);
  const signers = signatories.length === 0 ? ["\u041F\u043E\u0434\u043F\u0438\u0441\u0430\u043D\u0442\u043E\u0432 \u043D\u0435\u0442."] : signatories.map((signatory) => `- ${signatory.fullName}${signatory.position === null ? "" : `, ${signatory.position}`}${signatory.isDefault ? " (\u043E\u0441\u043D\u043E\u0432\u043D\u043E\u0439)" : ""}`);
  const markdown = [
    requisites.join("\n"),
    "",
    "**\u0411\u0430\u043D\u043A\u043E\u0432\u0441\u043A\u0438\u0435 \u0441\u0447\u0435\u0442\u0430**",
    accounts.join("\n"),
    "",
    "**\u041F\u043E\u0434\u043F\u0438\u0441\u0430\u043D\u0442\u044B**",
    signers.join("\n")
  ].join("\n");
  return {
    markdown,
    data: {
      id: organization.id,
      shortName: organization.shortName,
      fullName: organization.fullName,
      kind: organization.kind,
      inn: organization.inn,
      kpp: organization.kpp ?? null,
      ogrn: organization.ogrn ?? null,
      ogrnip: organization.ogrnip ?? null,
      legalAddress: organization.legalAddress ?? null,
      actualAddress: organization.actualAddress ?? null,
      phone: organization.phone ?? null,
      email: organization.email ?? null,
      taxRegime: organization.taxRegime ?? null,
      additionalRegime: organization.additionalRegime ?? null,
      usnObject: organization.usnObject ?? null,
      vatStatus: organization.vatStatus ?? null,
      vatScheme: organization.vatScheme ?? null,
      vatRateDefault: organization.vatRateDefault ?? null,
      vatModeDefault: organization.vatModeDefault ?? null,
      bankAccounts,
      signatories
    }
  };
}

// apps/mcp/dist/resources/organizations.js
var RESOURCE3 = "organization";
var TEMPLATE3 = "organization://{id}";
function registerOrganizationResources(server, ctx) {
  server.registerResource(RESOURCE3, new ResourceTemplate4(TEMPLATE3, {
    list: () => listTemplateItems(ctx, RESOURCE3, async () => {
      const items = toPage(await ctx.sdk.organizations.list({ limit: 5 })).items;
      return items.map((organization) => ({
        uri: `organization://${organization.id}`,
        name: organization.shortName,
        title: organization.shortName,
        description: `\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F, \u0418\u041D\u041D ${organization.inn}`
      }));
    }),
    complete: {
      id: completeIds(async () => toPage(await ctx.sdk.organizations.list({ limit: 5 })).items)
    }
  }), {
    title: "\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F",
    description: "\u041A\u0430\u0440\u0442\u043E\u0447\u043A\u0430 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438: \u0440\u0435\u043A\u0432\u0438\u0437\u0438\u0442\u044B, \u0440\u0435\u0436\u0438\u043C \u041D\u041E \u0438 \u041D\u0414\u0421, \u0431\u0430\u043D\u043A\u043E\u0432\u0441\u043A\u0438\u0435 \u0441\u0447\u0435\u0442\u0430, \u043F\u043E\u0434\u043F\u0438\u0441\u0430\u043D\u0442\u044B. \u0422\u043E\u043B\u044C\u043A\u043E \u0447\u0442\u0435\u043D\u0438\u0435.",
    mimeType: "text/markdown"
  }, (uri, variables) => readResource(ctx, RESOURCE3, async () => {
    const card = await loadOrganizationCard(ctx, requireId(variables, TEMPLATE3));
    return resourceResult(uri, card.markdown, card.data);
  }));
}

// apps/mcp/dist/resources/index.js
function registerResources(server, ctx) {
  registerDocumentResources(server, ctx);
  registerContractorResources(server, ctx);
  registerOrganizationResources(server, ctx);
  registerContractResources(server, ctx);
}

// apps/mcp/dist/tools/payments.js
import { z as z10 } from "zod";
var CREATE_TOOL2 = "invoices_payments_create";
var LIST_TOOL2 = "invoices_payments_list";
var DateOnly3 = z10.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, "\u0434\u0430\u0442\u0430 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 DD.MM.YYYY");
var MoneyString3 = z10.string().regex(/^\d+(\.\d{1,2})?$/, '\u0441\u0443\u043C\u043C\u0430 \u0441\u0442\u0440\u043E\u043A\u043E\u0439 \u0432 \u0440\u0443\u0431\u043B\u044F\u0445 \u0441 \u043A\u043E\u043F\u0435\u0439\u043A\u0430\u043C\u0438, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 "50000.00"');
var CreateInput2 = z10.object({
  amount: MoneyString3.describe("\u0421\u0443\u043C\u043C\u0430 \u043F\u043B\u0430\u0442\u0435\u0436\u0430 \u0432 \u0440\u0443\u0431\u043B\u044F\u0445"),
  paidAt: DateOnly3.describe("\u0414\u0430\u0442\u0430 \u043F\u043B\u0430\u0442\u0435\u0436\u0430, DD.MM.YYYY"),
  documentId: z10.uuid().optional().describe("\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442, \u043A \u043A\u043E\u0442\u043E\u0440\u043E\u043C\u0443 \u043E\u0442\u043D\u043E\u0441\u0438\u0442\u0441\u044F \u043E\u043F\u043B\u0430\u0442\u0430"),
  organizationId: z10.uuid().optional().describe("\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F; \u043C\u043E\u0436\u043D\u043E \u043D\u0435 \u0443\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u043F\u0440\u0438 documentId"),
  contractorId: z10.uuid().optional().describe("\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442; \u043C\u043E\u0436\u043D\u043E \u043D\u0435 \u0443\u043A\u0430\u0437\u044B\u0432\u0430\u0442\u044C \u043F\u0440\u0438 documentId"),
  method: z10.enum(["manual", "bank"]).optional().describe("manual \u2014 \u0432\u0440\u0443\u0447\u043D\u0443\u044E (\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E), bank \u2014 \u0431\u0430\u043D\u043A"),
  bankTxId: z10.string().optional().describe("\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u0431\u0430\u043D\u043A\u043E\u0432\u0441\u043A\u043E\u0439 \u0442\u0440\u0430\u043D\u0437\u0430\u043A\u0446\u0438\u0438 (\u0434\u043B\u044F method = bank)"),
  comment: z10.string().optional(),
  idempotencyKey: z10.string().regex(/^[A-Za-z0-9_-]{8,128}$/).optional().describe("\u041A\u043B\u044E\u0447 \u0438\u0434\u0435\u043C\u043F\u043E\u0442\u0435\u043D\u0442\u043D\u043E\u0441\u0442\u0438: \u043F\u0440\u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u0439\u0442\u0435 \u0442\u043E\u0442 \u0436\u0435, \u0447\u0442\u043E\u0431\u044B \u043D\u0435 \u0437\u0430\u0434\u0432\u043E\u0438\u0442\u044C \u043E\u043F\u043B\u0430\u0442\u0443"),
  confirm: z10.boolean().optional().describe("\u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E true")
});
var CreateOutput2 = z10.object({
  id: z10.string(),
  documentId: nullableString,
  amount: nullableString,
  paidAt: nullableString,
  method: nullableString,
  document: z10.object({
    id: z10.string(),
    number: nullableString,
    status: z10.string(),
    paid: nullableString,
    remaining: nullableString,
    overpaid: nullableString
  }).nullable(),
  idempotencyKey: z10.string()
});
var ListInput2 = z10.object({
  organizationId: z10.uuid().optional(),
  contractorId: z10.uuid().optional().describe("\u041F\u043B\u0430\u0442\u0435\u0436\u0438 \u044D\u0442\u043E\u0433\u043E \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430"),
  documentId: z10.uuid().optional().describe("\u041F\u043B\u0430\u0442\u0435\u0436\u0438 \u043F\u043E \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0443"),
  from: DateOnly3.optional(),
  to: DateOnly3.optional(),
  limit: z10.number().int().optional().describe("1\u2013100, \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E 20"),
  cursor: z10.string().optional()
});
var ListItem = z10.object({
  id: z10.string(),
  amount: nullableString,
  paidAt: nullableString,
  method: nullableString,
  comment: nullableString,
  documentId: nullableString,
  documentNumber: nullableString,
  contractorShortName: nullableString
});
var ListOutput2 = z10.object({
  items: z10.array(ListItem),
  nextCursor: z10.string().nullable()
});
function registerPaymentTools(server, ctx) {
  server.registerTool(CREATE_TOOL2, {
    title: "\u041E\u043F\u043B\u0430\u0442\u0430: \u043E\u0442\u043C\u0435\u0442\u0438\u0442\u044C",
    description: "\u041E\u0442\u043C\u0435\u0447\u0430\u0435\u0442 \u043F\u043E\u0441\u0442\u0443\u043F\u043B\u0435\u043D\u0438\u0435 \u043E\u043F\u043B\u0430\u0442\u044B (\u0432\u0440\u0443\u0447\u043D\u0443\u044E \u0438\u043B\u0438 \u0431\u0430\u043D\u043A\u043E\u0432\u0441\u043A\u0443\u044E). \u0421\u0443\u043C\u043C\u0430 \u2014 \u0441\u0442\u0440\u043E\u043A\u043E\u0439. \u0422\u0440\u0435\u0431\u0443\u0435\u0442 confirm: true: \u043F\u043B\u0430\u0442\u0435\u0436\u0438 \u0432\u043B\u0438\u044F\u044E\u0442 \u043D\u0430 \u0434\u043E\u043B\u0433 \u0438 \u043E\u0442\u0447\u0451\u0442\u044B. \u041F\u0440\u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u0439\u0442\u0435 \u0442\u043E\u0442 \u0436\u0435 idempotencyKey, \u0447\u0442\u043E\u0431\u044B \u043D\u0435 \u0437\u0430\u0434\u0432\u043E\u0438\u0442\u044C \u043E\u043F\u043B\u0430\u0442\u0443.",
    inputSchema: CreateInput2,
    outputSchema: CreateOutput2,
    annotations: DESTRUCTIVE_ANNOTATIONS
  }, (args) => mutation(ctx, CREATE_TOOL2, args.confirm, async () => {
    const { confirm: _confirm, contractorId, idempotencyKey, ...rest } = args;
    const key = idempotencyKeyOf(idempotencyKey);
    const payment = await ctx.sdk.payments.create({
      ...rest,
      ...contractorId === void 0 ? {} : { counterpartyId: contractorId }
    }, { idempotencyKey: key });
    const document = payment.document === void 0 || payment.document === null ? null : {
      id: payment.document.id,
      number: payment.document.number ?? null,
      status: payment.document.status,
      paid: payment.document.paid ?? null,
      remaining: payment.document.remaining ?? null,
      overpaid: payment.document.overpaid ?? null
    };
    const markdown = [
      `\u041E\u043F\u043B\u0430\u0442\u0430 \u043E\u0442\u043C\u0435\u0447\u0435\u043D\u0430: ${formatMoneyString(payment.amount)} \u043E\u0442 ${payment.paidAt ?? "\u2014"}`,
      `\u0421\u043F\u043E\u0441\u043E\u0431: ${label(PAYMENT_METHOD, payment.method)}`,
      ...document === null ? [] : [
        "",
        mdBullets([
          `\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442 \u2116 ${document.number ?? "\u0431/\u043D"}: ${label(DOCUMENT_STATUS, document.status)}`,
          `\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E: ${formatMoneyString(document.paid)}, \u043E\u0441\u0442\u0430\u0442\u043E\u043A ${formatMoneyString(document.remaining)}`,
          ...document.overpaid === null || document.overpaid === "0.00" ? [] : [`\u041F\u0435\u0440\u0435\u043F\u043B\u0430\u0442\u0430: ${formatMoneyString(document.overpaid)}`]
        ])
      ]
    ].join("\n");
    return toolResult(markdown, {
      id: payment.id,
      documentId: payment.documentId ?? null,
      amount: payment.amount ?? null,
      paidAt: payment.paidAt ?? null,
      method: payment.method ?? null,
      document,
      idempotencyKey: key
    });
  }));
  server.registerTool(LIST_TOOL2, {
    title: "\u041E\u043F\u043B\u0430\u0442\u044B: \u0441\u043F\u0438\u0441\u043E\u043A",
    description: "\u041F\u043E\u0441\u0442\u0443\u043F\u043B\u0435\u043D\u0438\u044F \u0437\u0430 \u043F\u0435\u0440\u0438\u043E\u0434 \u0438\u043B\u0438 \u043F\u043E \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0443/\u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0443: \u0434\u0430\u0442\u0430, \u0441\u0443\u043C\u043C\u0430, \u0441\u043F\u043E\u0441\u043E\u0431, \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442. \u0414\u043B\u044F \xAB\u043A\u0430\u043A\u0438\u0435 \u043E\u043F\u043B\u0430\u0442\u044B \u0431\u044B\u043B\u0438 \u0432 \u043E\u043A\u0442\u044F\u0431\u0440\u0435\xBB \u0438 \u0441\u0432\u0435\u0440\u043A\u0438 \u0432\u044B\u043F\u0438\u0441\u043A\u0438.",
    inputSchema: ListInput2,
    outputSchema: ListOutput2,
    annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false }
  }, (args) => execute(ctx, LIST_TOOL2, async () => {
    const limit = resolveLimit(args.limit);
    const response = await ctx.sdk.payments.list({
      limit,
      ...args.organizationId === void 0 ? {} : { organizationId: args.organizationId },
      ...args.contractorId === void 0 ? {} : { counterpartyId: args.contractorId },
      ...args.documentId === void 0 ? {} : { documentId: args.documentId },
      ...args.from === void 0 ? {} : { from: args.from },
      ...args.to === void 0 ? {} : { to: args.to },
      ...args.cursor === void 0 ? {} : { cursor: args.cursor }
    });
    const page = toPage(response);
    const items = page.items.map((payment) => ({
      id: payment.id,
      amount: payment.amount ?? null,
      paidAt: payment.paidAt ?? null,
      method: payment.method ?? null,
      comment: payment.comment ?? null,
      documentId: payment.document?.id ?? null,
      documentNumber: payment.document?.number ?? null,
      contractorShortName: null
    }));
    const totalKopecks = page.items.reduce((sum, payment) => {
      try {
        return payment.amount === null ? sum : sum + parseKopecks(payment.amount);
      } catch {
        return sum;
      }
    }, 0n);
    const totalRubles = `${totalKopecks / 100n}.${(totalKopecks % 100n).toString().padStart(2, "0")}`;
    const markdown = summaryTable({
      title: items.length === 0 ? "\u041E\u043F\u043B\u0430\u0442 \u0437\u0430 \u043F\u0435\u0440\u0438\u043E\u0434 \u043D\u0435\u0442." : `\u041E\u043F\u043B\u0430\u0442 \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435: ${items.length}`,
      headers: ["\u0414\u0430\u0442\u0430", "\u0421\u0443\u043C\u043C\u0430", "\u0421\u043F\u043E\u0441\u043E\u0431", "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442", "\u041A\u043E\u043C\u043C\u0435\u043D\u0442\u0430\u0440\u0438\u0439"],
      rows: items.map((payment) => [
        payment.paidAt ?? "\u2014",
        formatMoneyString(payment.amount),
        label(PAYMENT_METHOD, payment.method),
        payment.documentNumber ?? "\u2014",
        payment.comment ?? "\u2014"
      ]),
      footer: [
        `\u0418\u0442\u043E\u0433\u043E \u043F\u043E \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435: ${formatMoneyString(totalRubles)}`,
        ...nextPageHint(page) === void 0 ? [] : [nextPageHint(page) ?? ""]
      ]
    });
    return toolResult(markdown, { items, nextCursor: page.nextCursor });
  }));
}

// apps/mcp/dist/tools/products.js
import { z as z11 } from "zod";
var LIST_TOOL3 = "invoices_products_list";
var CREATE_TOOL3 = "invoices_products_create";
var MoneyString4 = z11.string().regex(/^\d+(\.\d{1,2})?$/, '\u0441\u0443\u043C\u043C\u0430 \u0441\u0442\u0440\u043E\u043A\u043E\u0439 \u0432 \u0440\u0443\u0431\u043B\u044F\u0445 \u0441 \u043A\u043E\u043F\u0435\u0439\u043A\u0430\u043C\u0438, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 "16500.00"');
var VatRate2 = z11.union([z11.literal(0), z11.literal(5), z11.literal(7), z11.literal(10), z11.literal(20), z11.literal(22)]).nullable();
var CreateInput3 = z11.object({
  name: z11.string().trim().min(1).describe("\u041D\u0430\u0438\u043C\u0435\u043D\u043E\u0432\u0430\u043D\u0438\u0435 \u043F\u043E\u0437\u0438\u0446\u0438\u0438"),
  kind: z11.enum(["service", "product"]).describe("\u0423\u0441\u043B\u0443\u0433\u0430 \u0438\u043B\u0438 \u0442\u043E\u0432\u0430\u0440"),
  unit: z11.string().trim().min(1).optional().describe("\u041A\u043E\u0434 \u0435\u0434\u0438\u043D\u0438\u0446\u044B \u0438\u0437 \u0441\u043F\u0440\u0430\u0432\u043E\u0447\u043D\u0438\u043A\u0430: \xAB\u0448\u0442\xBB, \xAB\u0447\xBB, \xAB\u043C\u0435\u0441\xBB \u2026 (\u0432 API \u2014 unitCode)"),
  price: MoneyString4.optional().describe('\u0426\u0435\u043D\u0430 \u0437\u0430 \u0435\u0434\u0438\u043D\u0438\u0446\u0443 \u0441\u0442\u0440\u043E\u043A\u043E\u0439, "16500.00"; \u043D\u0435\u0442 \u0446\u0435\u043D\u044B \u2014 \u043D\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u0432\u0430\u0439\u0442\u0435'),
  vatRate: VatRate2.optional().describe("\u0421\u0442\u0430\u0432\u043A\u0430 \u041D\u0414\u0421: 0, 5, 7, 10, 20, 22 \u0438\u043B\u0438 null (\u0431\u0435\u0437 \u041D\u0414\u0421); \u043D\u0435\u0438\u0437\u0432\u0435\u0441\u0442\u043D\u0430 \u2014 \u043D\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u0432\u0430\u0439\u0442\u0435"),
  sku: z11.string().trim().min(1).optional().describe("\u0410\u0440\u0442\u0438\u043A\u0443\u043B"),
  description: z11.string().trim().min(1).optional().describe("\u041E\u043F\u0438\u0441\u0430\u043D\u0438\u0435 \u043F\u043E\u0437\u0438\u0446\u0438\u0438"),
  confirm: z11.boolean().optional().describe("\u041E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E true: \u0441\u043E\u0437\u0434\u0430\u0451\u0442 \u0437\u0430\u043F\u0438\u0441\u044C")
});
var CreateOutput3 = z11.object({
  id: z11.string(),
  kind: z11.string(),
  name: z11.string(),
  unit: z11.string().nullable(),
  price: z11.string().nullable(),
  vatRate: z11.number().nullable(),
  sku: z11.string().nullable(),
  description: z11.string().nullable(),
  isActive: z11.boolean()
});
var ProductListItem = z11.object({
  id: z11.string(),
  name: z11.string(),
  kind: z11.string(),
  unit: z11.string().nullable(),
  price: z11.string().nullable(),
  vatRate: z11.number().nullable(),
  isActive: z11.boolean()
});
var ListInput3 = z11.object({
  query: z11.string().trim().min(1).optional().describe("\u041F\u043E\u0438\u0441\u043A \u043F\u043E \u043D\u0430\u0437\u0432\u0430\u043D\u0438\u044E \u0438\u043B\u0438 \u0430\u0440\u0442\u0438\u043A\u0443\u043B\u0443"),
  kind: z11.enum(["service", "product"]).optional().describe("\u0423\u0441\u043B\u0443\u0433\u0430 \u0438\u043B\u0438 \u0442\u043E\u0432\u0430\u0440"),
  includeInactive: z11.boolean().optional().describe("\u041F\u043E\u043A\u0430\u0437\u0430\u0442\u044C \u0438 \u0430\u0440\u0445\u0438\u0432\u043D\u044B\u0435 \u043F\u043E\u0437\u0438\u0446\u0438\u0438 (\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E \u0442\u043E\u043B\u044C\u043A\u043E \u0430\u043A\u0442\u0438\u0432\u043D\u044B\u0435)"),
  limit: z11.number().int().optional().describe("1\u2013100, \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E 20"),
  cursor: z11.string().optional().describe("nextCursor \u0438\u0437 \u043F\u0440\u0435\u0434\u044B\u0434\u0443\u0449\u0435\u0433\u043E \u043E\u0442\u0432\u0435\u0442\u0430")
});
var ListOutput3 = z11.object({
  items: z11.array(ProductListItem),
  nextCursor: z11.string().nullable()
});
function registerProductTools(server, ctx) {
  server.registerTool(LIST_TOOL3, {
    title: "\u041D\u043E\u043C\u0435\u043D\u043A\u043B\u0430\u0442\u0443\u0440\u0430: \u0441\u043F\u0438\u0441\u043E\u043A",
    description: "\u041F\u043E\u0437\u0438\u0446\u0438\u0438 \u043D\u043E\u043C\u0435\u043D\u043A\u043B\u0430\u0442\u0443\u0440\u044B: \u0443\u0441\u043B\u0443\u0433\u0438 \u0438 \u0442\u043E\u0432\u0430\u0440\u044B \u0441 \u0446\u0435\u043D\u043E\u0439, \u0435\u0434\u0438\u043D\u0438\u0446\u0435\u0439 \u0438 \u0441\u0442\u0430\u0432\u043A\u043E\u0439 \u041D\u0414\u0421. \u041D\u0443\u0436\u0435\u043D, \u0447\u0442\u043E\u0431\u044B \u043F\u043E\u0434\u043E\u0431\u0440\u0430\u0442\u044C \u0446\u0435\u043D\u0443 \u0441\u0443\u0449\u0435\u0441\u0442\u0432\u0443\u044E\u0449\u0435\u0439 \u043F\u043E\u0437\u0438\u0446\u0438\u0438 \u0432\u043C\u0435\u0441\u0442\u043E \u0432\u044B\u0434\u0443\u043C\u0430\u043D\u043D\u043E\u0439 \u0438 \u043D\u0435 \u0441\u043E\u0437\u0434\u0430\u0432\u0430\u0442\u044C \u0434\u0443\u0431\u043B\u0438\u043A\u0430\u0442.",
    inputSchema: ListInput3,
    outputSchema: ListOutput3,
    annotations: READ_ONLY_ANNOTATIONS
  }, (args) => execute(ctx, LIST_TOOL3, async () => {
    const limit = resolveLimit(args.limit);
    const response = await ctx.sdk.products.list({
      limit,
      ...args.query === void 0 ? {} : { q: args.query },
      ...args.kind === void 0 ? {} : { kind: args.kind },
      ...args.includeInactive === true ? {} : { isActive: true },
      ...args.cursor === void 0 ? {} : { cursor: args.cursor }
    });
    const page = toPage(response);
    const items = page.items.map((product) => ({
      id: product.id,
      name: product.name,
      kind: product.kind,
      unit: product.unitCode ?? null,
      price: product.price ?? null,
      vatRate: product.vatRate ?? null,
      isActive: product.isActive
    }));
    const markdown = summaryTable({
      title: items.length === 0 ? `\u041F\u043E\u0437\u0438\u0446\u0438\u0438 \u043D\u0435 \u043D\u0430\u0439\u0434\u0435\u043D\u044B${args.query === void 0 ? "" : ` \u043F\u043E \u0437\u0430\u043F\u0440\u043E\u0441\u0443 \xAB${args.query}\xBB`}.` : `\u041F\u043E\u0437\u0438\u0446\u0438\u0439: ${items.length}${args.query === void 0 ? "" : ` (\u0437\u0430\u043F\u0440\u043E\u0441 \xAB${args.query}\xBB)`}`,
      headers: ["\u041D\u0430\u0437\u0432\u0430\u043D\u0438\u0435", "\u0412\u0438\u0434", "\u0415\u0434.", "\u0426\u0435\u043D\u0430", "\u041D\u0414\u0421", "\u0410\u043A\u0442\u0438\u0432\u043D\u0430"],
      rows: items.map((product) => [
        product.name,
        label(PRODUCT_KIND, product.kind),
        product.unit ?? "\u2014",
        product.price === null ? "\u2014" : formatMoneyString(product.price),
        product.vatRate === null ? "\u2014" : `${product.vatRate} %`,
        product.isActive ? "\u0434\u0430" : "\u0432 \u0430\u0440\u0445\u0438\u0432\u0435"
      ]),
      footer: [
        ...nextPageHint(page) === void 0 ? [] : [nextPageHint(page) ?? ""],
        "\u0426\u0435\u043D\u0443 \u0438 \u041D\u0414\u0421 \u0432 \u0441\u0447\u0451\u0442\u0435 \u0431\u0435\u0440\u0438\u0442\u0435 \u0438\u0437 \u044D\u0442\u043E\u0439 \u043F\u043E\u0437\u0438\u0446\u0438\u0438, \u0435\u0441\u043B\u0438 \u043E\u043D\u0430 \u0435\u0441\u0442\u044C; \u0438\u043D\u0430\u0447\u0435 \u0441\u043F\u0440\u043E\u0441\u0438\u0442\u0435 \u043F\u043E\u043B\u044C\u0437\u043E\u0432\u0430\u0442\u0435\u043B\u044F."
      ]
    });
    return toolResult(markdown, { items, nextCursor: page.nextCursor });
  }));
}
function registerProductWriteTools(server, ctx) {
  server.registerTool(CREATE_TOOL3, {
    title: "\u041D\u043E\u043C\u0435\u043D\u043A\u043B\u0430\u0442\u0443\u0440\u0430: \u0441\u043E\u0437\u0434\u0430\u0442\u044C",
    description: "\u0421\u043E\u0437\u0434\u0430\u0451\u0442 \u043F\u043E\u0437\u0438\u0446\u0438\u044E \u043D\u043E\u043C\u0435\u043D\u043A\u043B\u0430\u0442\u0443\u0440\u044B (\u0443\u0441\u043B\u0443\u0433\u0443 \u0438\u043B\u0438 \u0442\u043E\u0432\u0430\u0440). \u0422\u0440\u0435\u0431\u0443\u0435\u0442 confirm: true. \u0421\u043D\u0430\u0447\u0430\u043B\u0430 \u043F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435, \u043D\u0435\u0442 \u043B\u0438 \u0442\u0430\u043A\u043E\u0439 \u043F\u043E\u0437\u0438\u0446\u0438\u0438 \u0447\u0435\u0440\u0435\u0437 invoices_products_list \u2014 \u043F\u043E\u0432\u0442\u043E\u0440 \u0441\u043E\u0437\u0434\u0430\u0441\u0442 \u0434\u0443\u0431\u043B\u044C. \u0426\u0435\u043D\u0443 \u0438 \u0441\u0442\u0430\u0432\u043A\u0443 \u041D\u0414\u0421 \u043D\u0435 \u0432\u044B\u0434\u0443\u043C\u044B\u0432\u0430\u0439\u0442\u0435: \u0435\u0441\u043B\u0438 \u0438\u0445 \u043D\u0435\u0442, \u043D\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u0432\u0430\u0439\u0442\u0435 \u043F\u043E\u043B\u0435.",
    inputSchema: CreateInput3,
    outputSchema: CreateOutput3,
    annotations: { ...WRITE_ANNOTATIONS, idempotentHint: false }
  }, (args) => mutation(ctx, CREATE_TOOL3, args.confirm, async () => {
    const { confirm: _confirm, unit, ...rest } = args;
    const product = await ctx.sdk.products.create({
      ...rest,
      ...unit === void 0 ? {} : { unitCode: unit }
    });
    const view = {
      id: product.id,
      kind: product.kind,
      name: product.name,
      unit: product.unitCode ?? null,
      price: product.price ?? null,
      vatRate: product.vatRate ?? null,
      sku: product.sku ?? null,
      description: product.description ?? null,
      isActive: product.isActive
    };
    const markdown = [
      `\u041F\u043E\u0437\u0438\u0446\u0438\u044F \u0441\u043E\u0437\u0434\u0430\u043D\u0430: **${product.name}** (${label(PRODUCT_KIND, product.kind)})`,
      "",
      mdBullets([
        `\u0415\u0434\u0438\u043D\u0438\u0446\u0430: ${product.unitCode ?? "\u2014"}`,
        `\u0426\u0435\u043D\u0430: ${formatMoneyString(product.price)}`,
        `\u041D\u0414\u0421: ${product.vatRate === null ? "\u2014" : `${product.vatRate} %`}`,
        ...product.sku === null ? [] : [`\u0410\u0440\u0442\u0438\u043A\u0443\u043B: ${product.sku}`],
        `ID: ${product.id}`
      ]),
      "",
      "\u041F\u043E\u0437\u0438\u0446\u0438\u044F \u0430\u043A\u0442\u0438\u0432\u043D\u0430 \u0438 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u0430 \u0432 invoices_products_list; \u0435\u0451 productId \u043C\u043E\u0436\u043D\u043E \u043F\u043E\u0434\u0441\u0442\u0430\u0432\u0438\u0442\u044C \u0432 \u043F\u043E\u0437\u0438\u0446\u0438\u0438 \u0447\u0435\u0440\u043D\u043E\u0432\u0438\u043A\u0430."
    ].join("\n");
    return toolResult(markdown, view);
  }));
}

// apps/mcp/dist/tools/reports.js
import { z as z12 } from "zod";
var SUMMARY_TOOL2 = "invoices_reports_summary";
var UNPAID_TOOL = "invoices_reports_unpaid";
var RECONCILIATION_TOOL = "invoices_reports_reconciliation";
var REGISTRY_TOOL = "invoices_reports_registry";
var DateOnly4 = z12.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, "\u0434\u0430\u0442\u0430 \u0432 \u0444\u043E\u0440\u043C\u0430\u0442\u0435 DD.MM.YYYY");
var Period = z12.object({ from: nullableString, to: nullableString });
var SummaryInput2 = z12.object({
  organizationId: z12.uuid().optional().describe("\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F; \u0431\u0435\u0437 \u043D\u0435\u0433\u043E \u2014 \u0432\u0441\u0435 \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u044B\u0435 \u0442\u043E\u043A\u0435\u043D\u0443"),
  from: DateOnly4.optional().describe("\u041D\u0430\u0447\u0430\u043B\u043E \u043F\u0435\u0440\u0438\u043E\u0434\u0430, DD.MM.YYYY"),
  to: DateOnly4.optional().describe("\u041A\u043E\u043D\u0435\u0446 \u043F\u0435\u0440\u0438\u043E\u0434\u0430, DD.MM.YYYY"),
  groupBy: z12.enum(["month", "contractor"]).optional().describe("\u0420\u0430\u0437\u0440\u0435\u0437: \u043F\u043E \u043C\u0435\u0441\u044F\u0446\u0430\u043C (\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E) \u0438\u043B\u0438 \u043F\u043E \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430\u043C")
});
var SummaryOutput2 = z12.object({
  period: Period,
  groupBy: z12.enum(["month", "contractor"]),
  totals: z12.object({
    issued: nullableString,
    paid: nullableString,
    unpaid: nullableString,
    overdue: nullableString
  }),
  counts: z12.object({
    invoices: z12.number(),
    acts: z12.number(),
    unpaidInvoices: z12.number()
  }),
  byMonth: z12.array(z12.object({ month: z12.string(), issued: nullableString, paid: nullableString })).optional(),
  byContractor: z12.array(z12.object({
    contractorId: z12.string(),
    shortName: nullableString,
    issued: nullableString,
    paid: nullableString
  })).optional()
});
var UnpaidInput = z12.object({
  organizationId: z12.uuid().optional(),
  contractorId: z12.uuid().optional().describe("\u0422\u043E\u043B\u044C\u043A\u043E \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u044D\u0442\u043E\u0433\u043E \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430"),
  overdueOnly: z12.boolean().optional().describe("\u0422\u043E\u043B\u044C\u043A\u043E \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u0435\u043D\u043D\u044B\u0435 \u043D\u0430 \u0441\u0435\u0433\u043E\u0434\u043D\u044F"),
  limit: z12.number().int().optional().describe("1\u2013100, \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E 20"),
  cursor: z12.string().optional()
});
var UnpaidItem = z12.object({
  id: z12.string(),
  type: z12.string(),
  status: z12.string(),
  number: nullableString,
  documentDate: nullableString,
  counterpartyId: nullableString,
  counterpartyShortName: nullableString,
  total: nullableString,
  paid: nullableString,
  remaining: nullableString,
  daysOverdue: z12.number()
});
var UnpaidOutput = z12.object({
  items: z12.array(UnpaidItem),
  nextCursor: z12.string().nullable(),
  total: nullableString,
  count: z12.number()
});
var ReconciliationInput = z12.object({
  organizationId: z12.uuid().describe("\u041E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u044F, \u043F\u043E \u043A\u043E\u0442\u043E\u0440\u043E\u0439 \u0441\u0442\u0440\u043E\u0438\u0442\u0441\u044F \u0430\u043A\u0442 \u0441\u0432\u0435\u0440\u043A\u0438"),
  contractorId: z12.uuid().describe("\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442 (ID \u0438\u0437 invoices_contractors_search)"),
  from: DateOnly4.describe("\u041D\u0430\u0447\u0430\u043B\u043E \u043F\u0435\u0440\u0438\u043E\u0434\u0430, DD.MM.YYYY"),
  to: DateOnly4.describe("\u041A\u043E\u043D\u0435\u0446 \u043F\u0435\u0440\u0438\u043E\u0434\u0430, DD.MM.YYYY")
});
var ReconciliationRow = z12.object({
  date: nullableString,
  type: z12.string(),
  number: nullableString,
  debit: nullableString,
  credit: nullableString,
  balance: nullableString
});
var ReconciliationOutput = z12.object({
  generatedAt: nullableString,
  period: Period,
  counterpartyShortName: nullableString,
  money: z12.object({
    openingBalance: nullableString,
    turnover: z12.object({ debit: nullableString, credit: nullableString }),
    closingBalance: nullableString,
    rows: z12.array(ReconciliationRow)
  }),
  summary: z12.object({
    invoices: z12.number(),
    acts: z12.number(),
    receivedActs: z12.number(),
    invoicesTotal: nullableString,
    paidTotal: nullableString,
    actsTotal: nullableString,
    unclosedByActs: nullableString
  })
});
var RegistryInput = z12.object({
  organizationId: z12.uuid().optional(),
  type: z12.enum(["invoice", "act", "invoice_facture", "upd", "contract"]).optional().describe("\u0422\u0438\u043F \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u0430; \u0431\u0435\u0437 \u043D\u0435\u0433\u043E \u2014 \u0432\u0441\u0435"),
  from: DateOnly4.describe("\u041D\u0430\u0447\u0430\u043B\u043E \u043F\u0435\u0440\u0438\u043E\u0434\u0430, DD.MM.YYYY"),
  to: DateOnly4.describe("\u041A\u043E\u043D\u0435\u0446 \u043F\u0435\u0440\u0438\u043E\u0434\u0430, DD.MM.YYYY"),
  limit: z12.number().int().optional().describe("1\u2013100, \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E 20"),
  cursor: z12.string().optional()
});
var RegistryItem = z12.object({
  id: z12.string(),
  type: z12.string(),
  status: z12.string(),
  number: nullableString,
  documentDate: nullableString,
  contractorShortName: nullableString,
  total: nullableString,
  vat: nullableString,
  paid: nullableString
});
var RegistryOutput = z12.object({
  period: Period,
  items: z12.array(RegistryItem),
  nextCursor: z12.string().nullable(),
  totals: z12.object({
    documents: z12.number(),
    acts: z12.number(),
    cancelled: z12.number(),
    total: nullableString,
    vat: nullableString,
    paid: nullableString
  })
});
function registerReportTools(server, ctx) {
  server.registerTool(SUMMARY_TOOL2, {
    title: "\u041E\u0442\u0447\u0451\u0442: \u0441\u0432\u043E\u0434\u043A\u0430 \u0437\u0430 \u043F\u0435\u0440\u0438\u043E\u0434",
    description: "\u0418\u0442\u043E\u0433\u0438 \u0437\u0430 \u043F\u0435\u0440\u0438\u043E\u0434: \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043E, \u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043E, \u043D\u0435 \u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043E, \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u0435\u043D\u043E + \u043A\u043E\u043B\u0438\u0447\u0435\u0441\u0442\u0432\u043E \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432. groupBy: month \u2014 \u0440\u0430\u0437\u0431\u0438\u0432\u043A\u0430 \u043F\u043E \u043C\u0435\u0441\u044F\u0446\u0430\u043C, contractor \u2014 \u043F\u043E \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u0430\u043C. \u041E\u0442\u0432\u0435\u0442 \u043D\u0430 \u0432\u043E\u043F\u0440\u043E\u0441\u044B \xAB\u0441\u043A\u043E\u043B\u044C\u043A\u043E \u0432\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043E \u0437\u0430 \u043A\u0432\u0430\u0440\u0442\u0430\u043B\xBB, \xAB\u043A\u0442\u043E \u0431\u043E\u043B\u044C\u0448\u0435 \u0432\u0441\u0435\u0445 \u0434\u043E\u043B\u0436\u0435\u043D\xBB.",
    inputSchema: SummaryInput2,
    outputSchema: SummaryOutput2,
    annotations: READ_ONLY_ANNOTATIONS
  }, (args) => execute(ctx, SUMMARY_TOOL2, async () => {
    const groupBy = args.groupBy ?? "month";
    const report = await ctx.sdk.reports.reportsSummary({
      groupBy: groupBy === "contractor" ? "counterparty" : "month",
      ...args.organizationId === void 0 ? {} : { organizationId: args.organizationId },
      ...args.from === void 0 ? {} : { from: args.from },
      ...args.to === void 0 ? {} : { to: args.to }
    });
    const byMonth = report.byMonth === void 0 ? void 0 : report.byMonth.map((row) => ({
      month: row.month,
      issued: row.issued ?? null,
      paid: row.paid ?? null
    }));
    const byContractor = report.byCounterparty === void 0 ? void 0 : report.byCounterparty.map((row) => ({
      contractorId: row.counterpartyId,
      shortName: row.shortName ?? null,
      issued: row.issued ?? null,
      paid: row.paid ?? null
    }));
    const blocks = [
      mdBullets([
        `\u041F\u0435\u0440\u0438\u043E\u0434: ${report.period.from ?? "\u2014"} \u2014 ${report.period.to ?? "\u2014"}`,
        `\u0412\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043E: ${formatMoneyString(report.totals.issued)}`,
        `\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E: ${formatMoneyString(report.totals.paid)}`,
        `\u041D\u0435 \u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043E: ${formatMoneyString(report.totals.unpaid)}`,
        `\u041F\u0440\u043E\u0441\u0440\u043E\u0447\u0435\u043D\u043E: ${formatMoneyString(report.totals.overdue)}`,
        `\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432: \u0441\u0447\u0435\u0442\u043E\u0432 ${report.counts.invoices}, \u0430\u043A\u0442\u043E\u0432 ${report.counts.acts}, \u043D\u0435\u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043D\u044B\u0445 ${report.counts.unpaidInvoices}`
      ])
    ];
    if (groupBy === "month" && byMonth !== void 0 && byMonth.length > 0) {
      blocks.push("", summaryTable({
        title: "",
        headers: ["\u041C\u0435\u0441\u044F\u0446", "\u0412\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043E", "\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E"],
        rows: byMonth.map((row) => [row.month, formatMoneyString(row.issued), formatMoneyString(row.paid)])
      }).replace(/^\n+/, "").replace(/^\n+/, ""));
    }
    if (groupBy === "contractor" && byContractor !== void 0 && byContractor.length > 0) {
      blocks.push("", summaryTable({
        title: "",
        headers: ["\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442", "\u0412\u044B\u0441\u0442\u0430\u0432\u043B\u0435\u043D\u043E", "\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E"],
        rows: byContractor.map((row) => [
          row.shortName ?? row.contractorId,
          formatMoneyString(row.issued),
          formatMoneyString(row.paid)
        ])
      }).replace(/^\n+/, "").replace(/^\n+/, ""));
    }
    return toolResult(blocks.join("\n"), {
      period: { from: report.period.from ?? null, to: report.period.to ?? null },
      groupBy,
      totals: {
        issued: report.totals.issued ?? null,
        paid: report.totals.paid ?? null,
        unpaid: report.totals.unpaid ?? null,
        overdue: report.totals.overdue ?? null
      },
      counts: report.counts,
      ...byMonth === void 0 ? {} : { byMonth },
      ...byContractor === void 0 ? {} : { byContractor }
    });
  }));
  server.registerTool(UNPAID_TOOL, {
    title: "\u041E\u0442\u0447\u0451\u0442: \u043D\u0435\u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043D\u044B\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B",
    description: "\u041D\u0435\u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043D\u044B\u0435 \u0438 \u0447\u0430\u0441\u0442\u0438\u0447\u043D\u043E \u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043D\u044B\u0435 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B: \u043E\u0441\u0442\u0430\u0442\u043E\u043A \u0438 \u0434\u043D\u0438 \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u043A\u0438, \u0441\u0442\u0430\u0440\u044B\u0435 \u0441\u0432\u0435\u0440\u0445\u0443. overdueOnly: true \u2014 \u0442\u043E\u043B\u044C\u043A\u043E \u043F\u0440\u043E\u0441\u0440\u043E\u0447\u0435\u043D\u043D\u044B\u0435. \u0414\u043B\u044F \xAB\u0447\u0442\u043E \u043D\u0430\u043C \u0434\u043E\u043B\u0436\u043D\u044B\xBB \u0438 \xAB\u0447\u0442\u043E \u0433\u043E\u0440\u0438\u0442\xBB.",
    inputSchema: UnpaidInput,
    outputSchema: UnpaidOutput,
    annotations: READ_ONLY_ANNOTATIONS
  }, (args) => execute(ctx, UNPAID_TOOL, async () => {
    const limit = resolveLimit(args.limit);
    const report = await ctx.sdk.reports.reportsUnpaid({
      limit,
      ...args.organizationId === void 0 ? {} : { organizationId: args.organizationId },
      ...args.contractorId === void 0 ? {} : { counterpartyId: args.contractorId },
      ...args.overdueOnly === true ? { overdueOnly: true } : {},
      ...args.cursor === void 0 ? {} : { cursor: args.cursor }
    });
    const page = toPage(report);
    const items = page.items.map((item) => ({
      id: item.id,
      type: item.type,
      status: item.status,
      number: item.number ?? null,
      documentDate: item.documentDate ?? null,
      counterpartyId: item.counterpartyId ?? null,
      counterpartyShortName: item.counterparty?.shortName ?? null,
      total: item.total ?? null,
      paid: item.paid ?? null,
      remaining: item.remaining ?? null,
      daysOverdue: item.daysOverdue
    }));
    const markdown = summaryTable({
      title: items.length === 0 ? "\u041D\u0435\u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043D\u044B\u0445 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \u043D\u0435\u0442." : `\u041D\u0435\u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043D\u044B\u0445 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432: ${report.count}, \u043E\u0441\u0442\u0430\u0442\u043E\u043A \u043F\u043E \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435 \u043D\u0438\u0436\u0435`,
      headers: ["\u2116", "\u0414\u0430\u0442\u0430", "\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442", "\u041E\u0441\u0442\u0430\u0442\u043E\u043A", "\u041F\u0440\u043E\u0441\u0440\u043E\u0447\u043A\u0430"],
      rows: items.map((item) => [
        item.number ?? "\u0431/\u043D",
        item.documentDate ?? "\u2014",
        item.counterpartyShortName ?? "\u2014",
        formatMoneyString(item.remaining),
        item.daysOverdue > 0 ? `${item.daysOverdue} \u0434\u043D.` : "\u2014"
      ]),
      footer: [
        `\u0418\u0442\u043E\u0433\u043E \u043A \u043F\u043E\u043B\u0443\u0447\u0435\u043D\u0438\u044E: ${formatMoneyString(report.total)} (${report.count} \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432)`,
        ...nextPageHint(page) === void 0 ? [] : [nextPageHint(page) ?? ""]
      ]
    });
    return toolResult(markdown, {
      items,
      nextCursor: page.nextCursor,
      total: report.total ?? null,
      count: report.count
    });
  }));
  server.registerTool(RECONCILIATION_TOOL, {
    title: "\u041E\u0442\u0447\u0451\u0442: \u0430\u043A\u0442 \u0441\u0432\u0435\u0440\u043A\u0438 \u0441 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u043E\u043C",
    description: "\u0410\u043A\u0442 \u0441\u0432\u0435\u0440\u043A\u0438: \u043D\u0430\u0447\u0430\u043B\u044C\u043D\u043E\u0435 \u0441\u0430\u043B\u044C\u0434\u043E, \u043E\u0431\u043E\u0440\u043E\u0442\u044B (\u0434\u0435\u0431\u0435\u0442/\u043A\u0440\u0435\u0434\u0438\u0442), \u043A\u043E\u043D\u0435\u0447\u043D\u043E\u0435 \u0441\u0430\u043B\u044C\u0434\u043E \u0438 \u043F\u043E\u0441\u0442\u0440\u043E\u0447\u043D\u0430\u044F \u0438\u0441\u0442\u043E\u0440\u0438\u044F \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \u0438 \u043E\u043F\u043B\u0430\u0442 \u0441 \u043D\u0430\u0440\u0430\u0441\u0442\u0430\u044E\u0449\u0438\u043C \u0438\u0442\u043E\u0433\u043E\u043C. \u0414\u043B\u044F \xAB\u0441\u0432\u0435\u0440\u044C\u0442\u0435\u0441\u044C \u0441 \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442\u043E\u043C\xBB.",
    inputSchema: ReconciliationInput,
    outputSchema: ReconciliationOutput,
    annotations: READ_ONLY_ANNOTATIONS
  }, (args) => execute(ctx, RECONCILIATION_TOOL, async () => {
    const report = await ctx.sdk.reports.reportsReconciliation({
      organizationId: args.organizationId,
      counterpartyId: args.contractorId,
      from: args.from,
      to: args.to
    });
    const rows = report.money.rows.map((row) => ({
      date: row.date ?? null,
      type: row.type,
      number: row.number ?? null,
      debit: row.debit ?? null,
      credit: row.credit ?? null,
      balance: row.balance ?? null
    }));
    const counterpartyShortName = typeof report.counterparty?.shortName === "string" ? report.counterparty.shortName : null;
    const blocks = [
      mdBullets([
        `\u041F\u0435\u0440\u0438\u043E\u0434: ${report.period.from ?? "\u2014"} \u2014 ${report.period.to ?? "\u2014"}`,
        `\u0421\u0430\u043B\u044C\u0434\u043E \u043D\u0430\u0447\u0430\u043B\u044C\u043D\u043E\u0435: ${formatMoneyString(report.money.openingBalance)}`,
        `\u041E\u0431\u043E\u0440\u043E\u0442: \u0434\u0435\u0431\u0435\u0442 ${formatMoneyString(report.money.turnover.debit)}, \u043A\u0440\u0435\u0434\u0438\u0442 ${formatMoneyString(report.money.turnover.credit)}`,
        `\u0421\u0430\u043B\u044C\u0434\u043E \u043A\u043E\u043D\u0435\u0447\u043D\u043E\u0435: ${formatMoneyString(report.money.closingBalance)}`,
        `\u0421\u0447\u0435\u0442\u043E\u0432: ${report.summary.invoices} \u043D\u0430 ${formatMoneyString(report.summary.invoicesTotal)}, \u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043E ${formatMoneyString(report.summary.paidTotal)}`,
        report.summary.unclosedByActs === void 0 || report.summary.unclosedByActs === null ? "" : `\u041D\u0435 \u0437\u0430\u043A\u0440\u044B\u0442\u043E \u0430\u043A\u0442\u0430\u043C\u0438: ${formatMoneyString(report.summary.unclosedByActs)}`
      ].filter((line) => line !== ""))
    ];
    if (rows.length > 0) {
      blocks.push("", summaryTable({
        title: "",
        headers: ["\u0414\u0430\u0442\u0430", "\u0422\u0438\u043F", "\u2116", "\u0414\u0435\u0431\u0435\u0442", "\u041A\u0440\u0435\u0434\u0438\u0442", "\u0421\u0430\u043B\u044C\u0434\u043E"],
        rows: rows.map((row) => [
          row.date ?? "\u2014",
          label(DOCUMENT_TYPE, row.type),
          row.number ?? "\u0431/\u043D",
          formatMoneyString(row.debit),
          formatMoneyString(row.credit),
          formatMoneyString(row.balance)
        ])
      }).replace(/^\n+/, "").replace(/^\n+/, ""));
    }
    return toolResult(blocks.join("\n"), {
      generatedAt: report.generatedAt ?? null,
      period: { from: report.period.from ?? null, to: report.period.to ?? null },
      counterpartyShortName,
      money: {
        openingBalance: report.money.openingBalance ?? null,
        turnover: {
          debit: report.money.turnover.debit ?? null,
          credit: report.money.turnover.credit ?? null
        },
        closingBalance: report.money.closingBalance ?? null,
        rows
      },
      summary: {
        invoices: report.summary.invoices,
        acts: report.summary.acts,
        receivedActs: report.summary.receivedActs,
        invoicesTotal: report.summary.invoicesTotal ?? null,
        paidTotal: report.summary.paidTotal ?? null,
        actsTotal: report.summary.actsTotal ?? null,
        unclosedByActs: report.summary.unclosedByActs ?? null
      }
    });
  }));
  server.registerTool(REGISTRY_TOOL, {
    title: "\u041E\u0442\u0447\u0451\u0442: \u0440\u0435\u0435\u0441\u0442\u0440 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432",
    description: "\u0420\u0435\u0435\u0441\u0442\u0440 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \u0437\u0430 \u043F\u0435\u0440\u0438\u043E\u0434: \u043D\u043E\u043C\u0435\u0440, \u0434\u0430\u0442\u0430, \u043A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442, \u0441\u0443\u043C\u043C\u0430, \u041D\u0414\u0421, \u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043E, \u0441\u0442\u0430\u0442\u0443\u0441, \u043F\u043B\u044E\u0441 \u0438\u0442\u043E\u0433\u0438 \u043F\u043E \u0440\u0435\u0435\u0441\u0442\u0440\u0443. \u0414\u043B\u044F \u0432\u044B\u0433\u0440\u0443\u0437\u043A\u0438 \xAB\u0432\u0441\u0435 \u0441\u0447\u0435\u0442\u0430 \u0437\u0430 \u043E\u043A\u0442\u044F\u0431\u0440\u044C\xBB.",
    inputSchema: RegistryInput,
    outputSchema: RegistryOutput,
    annotations: READ_ONLY_ANNOTATIONS
  }, (args) => execute(ctx, REGISTRY_TOOL, async () => {
    const limit = resolveLimit(args.limit);
    const report = await ctx.sdk.reports.reportsRegistry({
      limit,
      from: args.from,
      to: args.to,
      ...args.organizationId === void 0 ? {} : { organizationId: args.organizationId },
      ...args.type === void 0 ? {} : { type: args.type },
      ...args.cursor === void 0 ? {} : { cursor: args.cursor }
    });
    const page = toPage(report);
    const items = page.items.map((item) => ({
      id: item.id,
      type: item.type,
      status: item.status,
      number: item.number ?? null,
      documentDate: item.documentDate ?? null,
      contractorShortName: item.counterparty?.shortName ?? null,
      total: item.total ?? null,
      vat: item.vat ?? null,
      paid: item.paid ?? null
    }));
    const markdown = summaryTable({
      title: items.length === 0 ? "\u0412 \u0440\u0435\u0435\u0441\u0442\u0440\u0435 \u043D\u0435\u0442 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \u0437\u0430 \u043F\u0435\u0440\u0438\u043E\u0434." : `\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \u0432 \u0440\u0435\u0435\u0441\u0442\u0440\u0435: ${report.totals.documents}`,
      headers: ["\u2116", "\u0414\u0430\u0442\u0430", "\u041A\u043E\u043D\u0442\u0440\u0430\u0433\u0435\u043D\u0442", "\u0421\u0443\u043C\u043C\u0430", "\u041D\u0414\u0421", "\u041E\u043F\u043B\u0430\u0447\u0435\u043D\u043E", "\u0421\u0442\u0430\u0442\u0443\u0441"],
      rows: items.map((item) => [
        item.number ?? "\u0431/\u043D",
        item.documentDate ?? "\u2014",
        item.contractorShortName ?? "\u2014",
        formatMoneyString(item.total),
        formatMoneyString(item.vat),
        formatMoneyString(item.paid),
        label(DOCUMENT_STATUS, item.status)
      ]),
      footer: [
        `\u0418\u0442\u043E\u0433\u043E: ${formatMoneyString(report.totals.total)}, \u041D\u0414\u0421 ${formatMoneyString(report.totals.vat)}, \u043E\u043F\u043B\u0430\u0447\u0435\u043D\u043E ${formatMoneyString(report.totals.paid)}` + (report.totals.cancelled > 0 ? `, \u0430\u043D\u043D\u0443\u043B\u0438\u0440\u043E\u0432\u0430\u043D\u043E ${report.totals.cancelled}` : ""),
        ...nextPageHint(page) === void 0 ? [] : [nextPageHint(page) ?? ""]
      ]
    });
    return toolResult(markdown, {
      period: { from: report.period.from ?? null, to: report.period.to ?? null },
      items,
      nextCursor: page.nextCursor,
      totals: {
        documents: report.totals.documents,
        acts: report.totals.acts,
        cancelled: report.totals.cancelled,
        total: report.totals.total ?? null,
        vat: report.totals.vat ?? null,
        paid: report.totals.paid ?? null
      }
    });
  }));
}

// apps/mcp/dist/tools/shares.js
import { z as z13 } from "zod";
var LIST_TOOL4 = "invoices_shares_list";
var GET_TOOL5 = "invoices_shares_get";
var ShareListItem = z13.object({
  id: z13.string(),
  status: z13.string(),
  documentsCount: z13.number(),
  maxViews: z13.number(),
  viewCount: z13.number(),
  replyCount: z13.number(),
  allowReply: z13.boolean(),
  expiresAt: nullableString
});
var ListInput4 = z13.object({
  organizationId: z13.uuid().optional().describe("\u0422\u043E\u043B\u044C\u043A\u043E \u0441\u0441\u044B\u043B\u043A\u0438 \u044D\u0442\u043E\u0439 \u043E\u0440\u0433\u0430\u043D\u0438\u0437\u0430\u0446\u0438\u0438"),
  status: z13.enum(["active", "expired", "exhausted", "revoked"]).optional(),
  limit: z13.number().int().optional().describe("1\u2013100, \u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E 20"),
  cursor: z13.string().optional()
});
var ListOutput4 = z13.object({
  items: z13.array(ShareListItem),
  nextCursor: z13.string().nullable()
});
var GetInput5 = z13.object({
  shareId: z13.uuid().describe("\u0418\u0434\u0435\u043D\u0442\u0438\u0444\u0438\u043A\u0430\u0442\u043E\u0440 \u0441\u0441\u044B\u043B\u043A\u0438 (UUID \u0438\u0437 invoices_shares_list)"),
  include: z13.array(z13.enum(["views", "replies"])).optional().describe("\u0414\u043E\u0431\u0430\u0432\u0438\u0442\u044C \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u044B \u0438/\u0438\u043B\u0438 \u043E\u0442\u0432\u0435\u0442\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u0430")
});
var ShareDocumentItem = z13.object({
  id: z13.string(),
  type: z13.string(),
  number: nullableString,
  documentDate: nullableString,
  grandTotal: nullableString,
  status: nullableString
});
var ViewItem = z13.object({
  viewedAt: nullableString,
  ip: nullableString,
  userAgent: nullableString
});
var ReplyItem = z13.object({
  authorName: nullableString,
  authorEmail: nullableString,
  message: nullableString,
  createdAt: nullableString
});
var GetOutput5 = z13.object({
  id: z13.string(),
  status: z13.string(),
  message: nullableString,
  allowReply: z13.boolean(),
  maxViews: z13.number(),
  viewCount: z13.number(),
  replyCount: z13.number(),
  expiresAt: nullableString,
  documents: z13.array(ShareDocumentItem),
  views: z13.array(ViewItem).optional(),
  replies: z13.array(ReplyItem).optional()
});
function registerShareTools(server, ctx) {
  server.registerTool(LIST_TOOL4, {
    title: "\u0421\u0441\u044B\u043B\u043A\u0438: \u0441\u043F\u0438\u0441\u043E\u043A",
    description: "\u041F\u0443\u0431\u043B\u0438\u0447\u043D\u044B\u0435 \u0441\u0441\u044B\u043B\u043A\u0438 \u043D\u0430 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B: \u0441\u0442\u0430\u0442\u0443\u0441, \u043B\u0438\u043C\u0438\u0442 \u0438 \u0447\u0438\u0441\u043B\u043E \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u043E\u0432, \u043E\u0442\u0432\u0435\u0442\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u0430, \u0441\u0440\u043E\u043A. URL \u0432 \u0441\u043F\u0438\u0441\u043A\u0435 \u043D\u0435 \u043E\u0442\u0434\u0430\u0451\u0442\u0441\u044F (API \u0435\u0433\u043E \u043D\u0435 \u0445\u0440\u0430\u043D\u0438\u0442) \u2014 \u0441\u0441\u044B\u043B\u043A\u0443 \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442 \u0441\u043E\u0437\u0434\u0430\u043D\u0438\u0435 \u0441\u0441\u044B\u043B\u043A\u0438.",
    inputSchema: ListInput4,
    outputSchema: ListOutput4,
    annotations: READ_ONLY_ANNOTATIONS
  }, (args) => execute(ctx, LIST_TOOL4, async () => {
    const limit = resolveLimit(args.limit);
    const response = await ctx.sdk.shares.list({
      limit,
      ...args.organizationId === void 0 ? {} : { organizationId: args.organizationId },
      ...args.status === void 0 ? {} : { status: args.status },
      ...args.cursor === void 0 ? {} : { cursor: args.cursor }
    });
    const page = toPage(response);
    const items = page.items.map((share) => ({
      id: share.id,
      status: share.status,
      documentsCount: share.documents.length,
      maxViews: share.maxViews,
      viewCount: share.viewCount,
      replyCount: share.replyCount,
      allowReply: share.allowReply,
      expiresAt: share.expiresAt ?? null
    }));
    const markdown = summaryTable({
      title: items.length === 0 ? "\u0421\u0441\u044B\u043B\u043E\u043A \u043D\u0435\u0442." : `\u0421\u0441\u044B\u043B\u043E\u043A \u043D\u0430 \u0441\u0442\u0440\u0430\u043D\u0438\u0446\u0435: ${items.length}`,
      headers: ["\u0421\u0442\u0430\u0442\u0443\u0441", "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432", "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u044B", "\u041E\u0442\u0432\u0435\u0442\u044B", "\u0414\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u0434\u043E"],
      rows: items.map((share) => [
        label(SHARE_STATUS, share.status),
        String(share.documentsCount),
        `${share.viewCount} \u0438\u0437 ${share.maxViews}`,
        share.allowReply ? String(share.replyCount) : "\u043F\u0440\u0438\u0451\u043C \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D",
        formatIsoDate(share.expiresAt)
      ]),
      footer: [
        ...nextPageHint(page) === void 0 ? [] : [nextPageHint(page) ?? ""],
        "\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0441\u0442\u0438 \u2014 invoices_shares_get; \u043D\u043E\u0432\u0430\u044F \u0441\u0441\u044B\u043B\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u0451\u0442\u0441\u044F \u0447\u0435\u0440\u0435\u0437 invoices_shares_create (\u0441 \u043F\u043E\u0434\u0442\u0432\u0435\u0440\u0436\u0434\u0435\u043D\u0438\u0435\u043C)."
      ]
    });
    return toolResult(markdown, { items, nextCursor: page.nextCursor });
  }));
  server.registerTool(GET_TOOL5, {
    title: "\u0421\u0441\u044B\u043B\u043A\u0430: \u043A\u0430\u0440\u0442\u043E\u0447\u043A\u0430",
    description: '\u041F\u0443\u0431\u043B\u0438\u0447\u043D\u0430\u044F \u0441\u0441\u044B\u043B\u043A\u0430: \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B, \u043B\u0438\u043C\u0438\u0442 \u0438 \u0447\u0438\u0441\u043B\u043E \u043F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u043E\u0432, \u0441\u0440\u043E\u043A \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F. include: ["views"] \u2014 \u043A\u0442\u043E \u0438 \u043A\u043E\u0433\u0434\u0430 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u043B, ["replies"] \u2014 \u043E\u0442\u0432\u0435\u0442\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u0430.',
    inputSchema: GetInput5,
    outputSchema: GetOutput5,
    annotations: READ_ONLY_ANNOTATIONS
  }, (args) => execute(ctx, GET_TOOL5, async () => {
    const include = new Set(args.include ?? []);
    const share = await ctx.sdk.shares.get(args.shareId);
    const documents = share.documents.map((document) => ({
      id: document.id,
      type: document.type,
      number: document.number ?? null,
      documentDate: document.documentDate ?? null,
      grandTotal: document.grandTotal ?? null,
      status: document.status ?? null
    }));
    const views = include.has("views") ? share.views.map((view) => ({
      viewedAt: view.viewedAt ?? null,
      ip: view.ip ?? null,
      userAgent: view.userAgent ?? null
    })) : void 0;
    const replies = include.has("replies") ? share.replies.map((reply) => ({
      authorName: reply.authorName ?? null,
      authorEmail: reply.authorEmail ?? null,
      message: reply.message ?? null,
      createdAt: reply.createdAt ?? null
    })) : void 0;
    const blocks = [
      mdBullets([
        `\u0421\u0442\u0430\u0442\u0443\u0441: ${label(SHARE_STATUS, share.status)}`,
        `\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u044B: ${share.viewCount} \u0438\u0437 ${share.maxViews}`,
        `\u0414\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u0434\u043E: ${formatIsoDate(share.expiresAt)}`,
        `\u041E\u0442\u0432\u0435\u0442\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u0430: ${share.allowReply ? share.replyCount : "\u043F\u0440\u0438\u0451\u043C \u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D"}`,
        share.message === null || share.message === "" ? "" : `\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043A\u043B\u0438\u0435\u043D\u0442\u0443: ${share.message}`
      ].filter((line) => line !== "")),
      "",
      "**\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B**",
      documents.length === 0 ? "\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432 \u0432 \u0441\u0441\u044B\u043B\u043A\u0435 \u043D\u0435\u0442." : mdBullets(documents.map((document) => `${label(DOCUMENT_TYPE, document.type)} \u2116 ${document.number ?? "\u0431/\u043D"} \u043E\u0442 ${document.documentDate ?? "\u2014"}: ${formatMoneyString(document.grandTotal)}${document.status === null ? "" : `, ${label(DOCUMENT_STATUS, document.status)}`}`))
    ];
    if (views !== void 0) {
      blocks.push("", "**\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u044B**", views.length === 0 ? "\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u043E\u0432 \u043D\u0435 \u0431\u044B\u043B\u043E." : mdBullets(views.map((view) => `${formatIsoDate(view.viewedAt)}${view.ip === null ? "" : `, ${view.ip}`}`)));
    }
    if (replies !== void 0) {
      blocks.push("", "**\u041E\u0442\u0432\u0435\u0442\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u0430**", replies.length === 0 ? "\u041E\u0442\u0432\u0435\u0442\u043E\u0432 \u043D\u0435\u0442." : mdBullets(replies.map((reply) => `${formatIsoDate(reply.createdAt)}, ${reply.authorName ?? "\u043A\u043B\u0438\u0435\u043D\u0442"}: ${reply.message ?? "\u2014"}`)));
    }
    return toolResult(blocks.join("\n"), {
      id: share.id,
      status: share.status,
      message: share.message ?? null,
      allowReply: share.allowReply,
      maxViews: share.maxViews,
      viewCount: share.viewCount,
      replyCount: share.replyCount,
      expiresAt: share.expiresAt ?? null,
      documents,
      ...views === void 0 ? {} : { views },
      ...replies === void 0 ? {} : { replies }
    });
  }));
}
var CREATE_SHARE_TOOL = "invoices_shares_create";
var CreateInput4 = z13.object({
  documentIds: z13.array(z13.uuid()).min(1).describe("\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B, \u043A\u043E\u0442\u043E\u0440\u044B\u0435 \u043E\u0442\u043A\u0440\u044B\u0432\u0430\u044E\u0442\u0441\u044F \u043F\u043E \u0441\u0441\u044B\u043B\u043A\u0435"),
  message: z13.string().optional().describe("\u0421\u043E\u043E\u0431\u0449\u0435\u043D\u0438\u0435 \u043A\u043B\u0438\u0435\u043D\u0442\u0443"),
  maxViews: z13.number().int().min(1).optional().describe("\u0421\u043A\u043E\u043B\u044C\u043A\u043E \u0440\u0430\u0437 \u043C\u043E\u0436\u043D\u043E \u043E\u0442\u043A\u0440\u044B\u0442\u044C \u0441\u0441\u044B\u043B\u043A\u0443"),
  expiresAt: z13.string().regex(/^\d{2}\.\d{2}\.\d{4}$/).optional().describe("\u0421\u0440\u043E\u043A \u0434\u0435\u0439\u0441\u0442\u0432\u0438\u044F, DD.MM.YYYY"),
  pin: z13.string().optional().describe("PIN-\u043A\u043E\u0434 \u0434\u043B\u044F \u0434\u043E\u0441\u0442\u0443\u043F\u0430"),
  allowReply: z13.boolean().optional().describe("\u0420\u0430\u0437\u0440\u0435\u0448\u0438\u0442\u044C \u043E\u0442\u0432\u0435\u0442 \u043A\u043B\u0438\u0435\u043D\u0442\u0430"),
  withSeal: z13.boolean().optional(),
  withSignature: z13.boolean().optional(),
  idempotencyKey: z13.string().regex(/^[A-Za-z0-9_-]{8,128}$/).optional().describe("\u041A\u043B\u044E\u0447 \u0438\u0434\u0435\u043C\u043F\u043E\u0442\u0435\u043D\u0442\u043D\u043E\u0441\u0442\u0438: \u043F\u0440\u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0435 \u043F\u0435\u0440\u0435\u0434\u0430\u0439\u0442\u0435 \u0442\u043E\u0442 \u0436\u0435"),
  confirm: z13.boolean().optional()
});
var CreateOutput4 = z13.object({
  id: z13.string(),
  url: z13.string(),
  status: z13.string(),
  maxViews: z13.number(),
  expiresAt: nullableString,
  documents: z13.array(z13.object({ id: z13.string(), number: nullableString })),
  idempotencyKey: z13.string()
});
function registerShareWriteTools(server, ctx) {
  server.registerTool(CREATE_SHARE_TOOL, {
    title: "\u0421\u0441\u044B\u043B\u043A\u0430: \u0441\u043E\u0437\u0434\u0430\u0442\u044C",
    description: "\u041F\u0443\u0431\u043B\u0438\u043A\u0443\u0435\u0442 \u0434\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u044B \u043F\u043E \u043A\u043E\u0440\u043E\u0442\u043A\u043E\u0439 \u0441\u0441\u044B\u043B\u043A\u0435: \u043A\u043B\u0438\u0435\u043D\u0442 \u043E\u0442\u043A\u0440\u043E\u0435\u0442 \u0435\u0451 \u0431\u0435\u0437 \u0432\u0445\u043E\u0434\u0430. \u0422\u0440\u0435\u0431\u0443\u0435\u0442 confirm: true \u2014 \u0441\u0441\u044B\u043B\u043A\u0430 \u0441\u0442\u0430\u043D\u043E\u0432\u0438\u0442\u0441\u044F \u0434\u043E\u0441\u0442\u0443\u043F\u043D\u043E\u0439 \u0441\u043D\u0430\u0440\u0443\u0436\u0438. URL \u0432\u043E\u0437\u0432\u0440\u0430\u0449\u0430\u0435\u0442\u0441\u044F \u0442\u043E\u043B\u044C\u043A\u043E \u0437\u0434\u0435\u0441\u044C; \u043F\u043E\u0437\u0436\u0435 \u0435\u0433\u043E \u043F\u043E\u043A\u0430\u0436\u0435\u0442 \u0440\u0430\u0437\u0432\u0435 \u0447\u0442\u043E \u043A\u0430\u0431\u0438\u043D\u0435\u0442.",
    inputSchema: CreateInput4,
    outputSchema: CreateOutput4,
    annotations: DESTRUCTIVE_ANNOTATIONS
  }, (args) => mutation(ctx, CREATE_SHARE_TOOL, args.confirm, async () => {
    const { confirm: _confirm, idempotencyKey, ...body } = args;
    const key = idempotencyKeyOf(idempotencyKey);
    const share = await ctx.sdk.shares.create(body, { idempotencyKey: key });
    const documents = share.documents.map((document) => ({
      id: document.id,
      number: document.number ?? null
    }));
    const markdown = [
      `\u0421\u0441\u044B\u043B\u043A\u0430 \u0441\u043E\u0437\u0434\u0430\u043D\u0430: ${share.url}`,
      "",
      mdBullets([
        `\u0414\u043E\u043A\u0443\u043C\u0435\u043D\u0442\u043E\u0432: ${documents.length} (${documents.map((document) => document.number ?? "\u0431/\u043D").join(", ")})`,
        `\u041F\u0440\u043E\u0441\u043C\u043E\u0442\u0440\u043E\u0432: ${share.maxViews}`,
        `\u0414\u0435\u0439\u0441\u0442\u0432\u0443\u0435\u0442 \u0434\u043E: ${formatIsoDate(share.expiresAt)}`,
        `\u041E\u0442\u0432\u0435\u0442\u044B \u043A\u043B\u0438\u0435\u043D\u0442\u0430: ${share.allowReply ? "\u0440\u0430\u0437\u0440\u0435\u0448\u0435\u043D\u044B" : "\u0432\u044B\u043A\u043B\u044E\u0447\u0435\u043D\u044B"}`
      ]),
      "",
      "\u0421\u0441\u044B\u043B\u043A\u0430 \u043F\u0443\u0431\u043B\u0438\u0447\u043D\u0430\u044F \u2014 \u043F\u0435\u0440\u0435\u0434\u0430\u0439\u0442\u0435 \u0435\u0451 \u043A\u043B\u0438\u0435\u043D\u0442\u0443. \u041E\u0442\u043E\u0437\u0432\u0430\u0442\u044C \u043C\u043E\u0436\u043D\u043E \u0432 \u043A\u0430\u0431\u0438\u043D\u0435\u0442\u0435 (invoices_shares_get \u043F\u043E\u043A\u0430\u0436\u0435\u0442 \u0441\u0442\u0430\u0442\u0443\u0441)."
    ].join("\n");
    return toolResult(markdown, {
      id: share.id,
      url: share.url,
      status: share.status,
      maxViews: share.maxViews,
      expiresAt: share.expiresAt ?? null,
      documents,
      idempotencyKey: key
    });
  }));
}

// apps/mcp/dist/tools/index.js
function registerTools(server, ctx) {
  registerOrganizationTools(server, ctx);
  registerContractorTools(server, ctx);
  registerContractorWriteTools(server, ctx);
  registerProductTools(server, ctx);
  registerProductWriteTools(server, ctx);
  registerDocumentTools(server, ctx);
  registerDocumentWriteTools(server, ctx);
  registerContractTools(server, ctx);
  registerContractWriteTools(server, ctx);
  registerReportTools(server, ctx);
  registerShareTools(server, ctx);
  registerShareWriteTools(server, ctx);
  registerPaymentTools(server, ctx);
}

// apps/mcp/dist/server.js
function createServer(ctx) {
  const server = new McpServer({ name: SERVER_NAME, version: SERVER_VERSION }, {
    instructions: INSTRUCTIONS,
    capabilities: { tools: {}, resources: {}, prompts: {} }
  });
  registerTools(server, ctx);
  registerResources(server, ctx);
  registerPrompts(server);
  return server;
}

// apps/mcp/dist/http.js
var MCP_PATH = "/mcp";
var HTTP_HOST = "127.0.0.1";
function respondJson(res, status, body) {
  if (res.headersSent) {
    res.end();
    return;
  }
  const payload = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "content-length": Buffer.byteLength(payload)
  });
  res.end(payload);
}
async function serveHttp(ctx, logger, config) {
  const handler = createMcpHandler(() => createServer(ctx), {
    legacy: "stateless",
    onerror: (error) => logger.error("server.http_error", { message: error.message })
  });
  const mcpHandler = toNodeHandler(handler, {
    onerror: (error) => logger.error("server.http_error", { message: error.message })
  });
  const validateHost = localhostHostValidation();
  const validateOrigin = localhostOriginValidation();
  const httpServer = createHttpServer((req, res) => {
    let pathname;
    try {
      pathname = new URL(req.url ?? "/", "http://localhost").pathname;
    } catch {
      respondJson(res, 400, { error: "bad_request", message: "\u041D\u0435\u043A\u043E\u0440\u0440\u0435\u043A\u0442\u043D\u044B\u0439 URL \u0437\u0430\u043F\u0440\u043E\u0441\u0430." });
      return;
    }
    if (pathname !== MCP_PATH) {
      respondJson(res, 404, {
        error: "not_found",
        message: `MCP \u0434\u043E\u0441\u0442\u0443\u043F\u0435\u043D \u043F\u043E ${MCP_PATH} (Streamable HTTP, POST).`
      });
      return;
    }
    if (!validateHost(req, res))
      return;
    if (!validateOrigin(req, res))
      return;
    void mcpHandler(req, res).catch((error) => {
      logger.error("server.http_error", {
        message: error instanceof Error ? error.message : String(error)
      });
      respondJson(res, 500, { error: "internal_error" });
    });
  });
  await new Promise((resolve, reject) => {
    httpServer.once("error", reject);
    httpServer.listen(config.port, HTTP_HOST, () => {
      httpServer.off("error", reject);
      resolve();
    });
  });
  return {
    host: HTTP_HOST,
    port: config.port,
    path: MCP_PATH,
    close: async () => {
      await new Promise((resolve) => {
        httpServer.close(() => resolve());
        httpServer.closeIdleConnections();
      });
      await handler.close();
    }
  };
}

// apps/mcp/dist/logger.js
var LEVEL_WEIGHT = {
  debug: 10,
  info: 20,
  warn: 30,
  error: 40
};
var SECRET_PATTERN = /ivs_[A-Za-z0-9_-]{8,}/g;
function redactSecrets(value) {
  return value.replace(SECRET_PATTERN, "ivs_***");
}
function createLogger(level, write = (line) => void process.stderr.write(line)) {
  const threshold = LEVEL_WEIGHT[level];
  function emit(level2, event, fields) {
    if (LEVEL_WEIGHT[level2] < threshold)
      return;
    const record = {
      ts: (/* @__PURE__ */ new Date()).toISOString(),
      level: level2,
      event
    };
    for (const [key, value] of Object.entries(fields ?? {})) {
      if (value === void 0)
        continue;
      record[key] = typeof value === "string" ? redactSecrets(value) : value;
    }
    write(`${JSON.stringify(record)}
`);
  }
  return {
    debug: (event, fields) => emit("debug", event, fields),
    info: (event, fields) => emit("info", event, fields),
    warn: (event, fields) => emit("warn", event, fields),
    error: (event, fields) => emit("error", event, fields)
  };
}

// apps/mcp/dist/index.js
function fail(message) {
  process.stderr.write(message.endsWith("\n") ? message : `${message}
`);
  process.exit(1);
}
function readConfig() {
  try {
    return loadConfig(process.env);
  } catch (error) {
    if (error instanceof ConfigError) {
      const list = error.problems.map((problem) => `  \u2022 ${problem}`).join("\n");
      fail(`${SERVER_NAME}: \u043A\u043E\u043D\u0444\u0438\u0433\u0443\u0440\u0430\u0446\u0438\u044F \u043D\u0435 \u0437\u0430\u0433\u0440\u0443\u0436\u0435\u043D\u0430
${list}

\u0427\u0442\u043E \u0443\u043A\u0430\u0437\u0430\u0442\u044C:
  INVOICES_API_URL   \u2014 \u0431\u0430\u0437\u043E\u0432\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 API, \u043D\u0430\u043F\u0440\u0438\u043C\u0435\u0440 https://accounting.example.ru
  INVOICES_API_TOKEN \u2014 \u0441\u0435\u0440\u0432\u0438\u0441\u043D\u044B\u0439 \u0442\u043E\u043A\u0435\u043D ivs_<kid>_<secret> \u0438\u0437 \u0430\u0434\u043C\u0438\u043D\u043A\u0438 (\u0440\u0435\u0436\u0438\u043C readonly)
\u041F\u043E\u0434\u0440\u043E\u0431\u043D\u043E\u0441\u0442\u0438: doc/mcp/03-config-auth.md`);
    }
    throw error;
  }
}
function logStart(config, logger, extra = {}) {
  logger.info("server.start", {
    version: SERVER_VERSION,
    transport: config.transport,
    apiUrl: config.apiUrl,
    tokenKid: config.tokenKid,
    timeoutMs: config.timeoutMs,
    ...extra
  });
}
async function runProbe(sdk, config, logger) {
  try {
    const probe = await probeApi(sdk, config, logger);
    const method = probe.reachable && probe.authorized ? "warn" : "error";
    for (const message of probe.messages) {
      logger[method]("api.probe.message", { message });
    }
  } catch (error) {
    logger.error("api.probe.failed", {
      message: error instanceof Error ? error.message : String(error)
    });
  }
}
function stopOnSignals(logger, close) {
  const stop = (signal) => {
    logger.info("server.stop", { signal });
    void close().then(() => process.exit(0), (error) => {
      logger.error("server.stop_failed", {
        message: error instanceof Error ? error.message : String(error)
      });
      process.exit(1);
    });
  };
  process.once("SIGINT", () => stop("SIGINT"));
  process.once("SIGTERM", () => stop("SIGTERM"));
}
function startStdio(sdk, config, logger) {
  logStart(config, logger);
  void runProbe(sdk, config, logger);
  const handle = serveStdio(() => createServer({ sdk, config, logger }), {
    onerror: (error) => logger.error("server.transport_error", { message: error.message })
  });
  stopOnSignals(logger, () => handle.close());
}
async function startHttp(config, logger) {
  const sdk = createApiClient(config);
  const transport = await serveHttp({ sdk, config, logger }, logger, config);
  logStart(config, logger, {
    host: transport.host,
    port: transport.port,
    path: transport.path
  });
  void runProbe(sdk, config, logger);
  stopOnSignals(logger, () => transport.close());
}
function runInfoFlags(argv) {
  if (argv.includes("--version") || argv.includes("-v")) {
    process.stdout.write(`${SERVER_NAME} ${SERVER_VERSION}
`);
    process.exit(0);
  }
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write([
      `${SERVER_NAME} ${SERVER_VERSION} \u2014 MCP-\u0441\u0435\u0440\u0432\u0435\u0440 \u0441\u0435\u0440\u0432\u0438\u0441\u0430 \u0441\u0447\u0435\u0442\u043E\u0432 \u0438 \u0430\u043A\u0442\u043E\u0432`,
      "",
      "\u041F\u0435\u0440\u0435\u043C\u0435\u043D\u043D\u044B\u0435 \u043E\u043A\u0440\u0443\u0436\u0435\u043D\u0438\u044F:",
      "  INVOICES_API_URL        \u0431\u0430\u0437\u043E\u0432\u044B\u0439 \u0430\u0434\u0440\u0435\u0441 API \u0431\u0435\u0437 /api/v1 (\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)",
      "  INVOICES_API_TOKEN      \u0441\u0435\u0440\u0432\u0438\u0441\u043D\u044B\u0439 \u0442\u043E\u043A\u0435\u043D ivs_<kid>_<secret> \u0438\u0437 \u0430\u0434\u043C\u0438\u043D\u043A\u0438 (\u043E\u0431\u044F\u0437\u0430\u0442\u0435\u043B\u044C\u043D\u043E)",
      "  INVOICES_MCP_TRANSPORT  stdio (\u043F\u043E \u0443\u043C\u043E\u043B\u0447\u0430\u043D\u0438\u044E) \u0438\u043B\u0438 http",
      "  INVOICES_MCP_PORT       \u043F\u043E\u0440\u0442 HTTP-\u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442\u0430, \u0442\u043E\u043B\u044C\u043A\u043E 127.0.0.1 (7331)",
      "  INVOICES_TIMEOUT_MS     \u0442\u0430\u0439\u043C\u0430\u0443\u0442 \u0437\u0430\u043F\u0440\u043E\u0441\u0430 \u043A API (10000)",
      "  INVOICES_LOG_LEVEL      debug | info | warn | error (info)",
      "",
      "\u0424\u043B\u0430\u0433\u0438:",
      "  -v, --version           \u0432\u0435\u0440\u0441\u0438\u044F \u0441\u0435\u0440\u0432\u0435\u0440\u0430",
      "  -h, --help              \u044D\u0442\u0430 \u0441\u043F\u0440\u0430\u0432\u043A\u0430",
      ""
    ].join("\n"));
    process.exit(0);
  }
}
function main() {
  runInfoFlags(process.argv.slice(2));
  const config = readConfig();
  const logger = createLogger(config.logLevel);
  if (config.transport === "http") {
    void startHttp(config, logger).catch((error) => {
      const message = error instanceof Error ? error.message : String(error);
      fail(`${SERVER_NAME}: HTTP-\u0442\u0440\u0430\u043D\u0441\u043F\u043E\u0440\u0442 \u043D\u0435 \u0437\u0430\u043F\u0443\u0449\u0435\u043D \u2014 ${message}
\u041F\u0440\u043E\u0432\u0435\u0440\u044C\u0442\u0435, \u0447\u0442\u043E \u043F\u043E\u0440\u0442 ${config.port} \u0441\u0432\u043E\u0431\u043E\u0434\u0435\u043D (INVOICES_MCP_PORT), \u0438 \u043F\u043E\u0432\u0442\u043E\u0440\u0438\u0442\u0435 \u0437\u0430\u043F\u0443\u0441\u043A.`);
    });
    return;
  }
  startStdio(createApiClient(config), config, logger);
}
try {
  main();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`${SERVER_NAME}: ${message}
`);
  process.exit(1);
}
