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
    super(problem?.detail ?? problem?.title ?? fallback ?? `Запрос завершился с ошибкой ${status}`);
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
  acceptInvitation: { "operationId": "acceptInvitation", "method": "post", "path": "/api/v1/auth/invitations/{token}/accept", "tag": "auth", "summary": "Активация приглашённого пользователя", "idempotent": false },
  addNoteLinks: { "operationId": "addNoteLinks", "method": "post", "path": "/api/v1/notes/{id}/links", "tag": "notes", "summary": "Привязать заметку к сущностям", "idempotent": false },
  applyDataImport: { "operationId": "applyDataImport", "method": "post", "path": "/api/v1/data-imports/{id}/apply", "tag": "data-imports", "summary": "Применить импорт: одна транзакция, конфликты пересчитываются", "idempotent": false },
  archiveContract: { "operationId": "archiveContract", "method": "delete", "path": "/api/v1/contracts/{id}", "tag": "contracts", "summary": "Архив договора", "idempotent": false },
  archiveCounterparty: { "operationId": "archiveCounterparty", "method": "delete", "path": "/api/v1/counterparties/{id}", "tag": "counterparties", "summary": "Архив контрагента", "idempotent": false },
  archiveOrganization: { "operationId": "archiveOrganization", "method": "delete", "path": "/api/v1/organizations/{id}", "tag": "organizations", "summary": "Архив (без удаления данных)", "idempotent": false },
  archiveProduct: { "operationId": "archiveProduct", "method": "delete", "path": "/api/v1/products/{id}", "tag": "products", "summary": "Архивировать позицию", "idempotent": false },
  archiveTemplate: { "operationId": "archiveTemplate", "method": "delete", "path": "/api/v1/templates/{id}", "tag": "templates", "summary": "Архив шаблона (не базовый)", "idempotent": false },
  assignTemplate: { "operationId": "assignTemplate", "method": "post", "path": "/api/v1/templates/{id}/assign", "tag": "templates", "summary": "Назначить шаблон организации или контрагенту", "idempotent": false },
  blockUser: { "operationId": "blockUser", "method": "post", "path": "/api/v1/users/{id}/block", "tag": "users", "summary": "Заблокировать пользователя (admin)", "idempotent": false },
  cancelDocument: { "operationId": "cancelDocument", "method": "post", "path": "/api/v1/documents/{id}/cancel", "tag": "documents", "summary": "Аннулировать документ", "idempotent": false },
  changePassword: { "operationId": "changePassword", "method": "post", "path": "/api/v1/auth/password/change", "tag": "auth", "summary": "Смена своего пароля", "idempotent": false },
  checkCounterpartyDuplicates: { "operationId": "checkCounterpartyDuplicates", "method": "post", "path": "/api/v1/counterparties/check-duplicates", "tag": "counterparties", "summary": "Кандидаты в дубли по ИНН", "idempotent": false },
  closeNote: { "operationId": "closeNote", "method": "post", "path": "/api/v1/notes/{id}/close", "tag": "notes", "summary": "Закрыть заметку", "idempotent": false },
  createActFromInvoice: { "operationId": "createActFromInvoice", "method": "post", "path": "/api/v1/documents/{id}/acts", "tag": "documents", "summary": "Создать акт по счёту", "idempotent": false },
  createBankAccount: { "operationId": "createBankAccount", "method": "post", "path": "/api/v1/organizations/{id}/bank-accounts", "tag": "organizations", "summary": "Добавить банковский счёт", "idempotent": false },
  createContract: { "operationId": "createContract", "method": "post", "path": "/api/v1/contracts", "tag": "contracts", "summary": "Создать договор", "idempotent": false },
  createCounterparty: { "operationId": "createCounterparty", "method": "post", "path": "/api/v1/counterparties", "tag": "counterparties", "summary": "Создать контрагента", "idempotent": false },
  createCounterpartyContact: { "operationId": "createCounterpartyContact", "method": "post", "path": "/api/v1/counterparties/{id}/contacts", "tag": "counterparties", "summary": "Добавить контакт", "idempotent": false },
  createDataExport: { "operationId": "createDataExport", "method": "post", "path": "/api/v1/data-exports", "tag": "data-exports", "summary": "Пакет переноса: организация/справочники/документы (JSON/ZIP)", "idempotent": false },
  createDocument: { "operationId": "createDocument", "method": "post", "path": "/api/v1/documents", "tag": "documents", "summary": "Создать черновик", "idempotent": false },
  createDocumentPdfLink: { "operationId": "createDocumentPdfLink", "method": "get", "path": "/api/v1/documents/{id}/pdf-link", "tag": "documents", "summary": "Короткоживущая ссылка на PDF", "idempotent": true },
  createDocumentRevision: { "operationId": "createDocumentRevision", "method": "post", "path": "/api/v1/documents/{id}/revisions", "tag": "documents", "summary": "Новая ревизия выданного", "idempotent": false },
  createInvoiceFromActs: { "operationId": "createInvoiceFromActs", "method": "post", "path": "/api/v1/documents/{id}/invoice", "tag": "documents", "summary": "Создать счёт из акта (акт раньше счёта) и включить все акты контрагента", "idempotent": false },
  createNote: { "operationId": "createNote", "method": "post", "path": "/api/v1/notes", "tag": "notes", "summary": "Создать заметку (Markdown)", "idempotent": false },
  createOrganization: { "operationId": "createOrganization", "method": "post", "path": "/api/v1/organizations", "tag": "organizations", "summary": "Создать организацию", "idempotent": false },
  createPayment: { "operationId": "createPayment", "method": "post", "path": "/api/v1/payments", "tag": "payments", "summary": "Создать оплату: пересчитывает статус и остаток документа", "idempotent": false },
  createPersonalToken: { "operationId": "createPersonalToken", "method": "post", "path": "/api/v1/tokens/personal", "tag": "tokens", "summary": "Создать personal-токен (не шире прав роли)", "idempotent": false },
  createProduct: { "operationId": "createProduct", "method": "post", "path": "/api/v1/products", "tag": "products", "summary": "Создать позицию номенклатуры", "idempotent": false },
  createReportExport: { "operationId": "createReportExport", "method": "post", "path": "/api/v1/reports/export", "tag": "reports", "summary": "Асинхронный экспорт отчёта (XLSX/CSV/JSON) через pg-boss", "idempotent": false },
  createShare: { "operationId": "createShare", "method": "post", "path": "/api/v1/shares", "tag": "shares", "summary": "Создать ссылку на документы (URL показывается один раз)", "idempotent": false },
  createSignatory: { "operationId": "createSignatory", "method": "post", "path": "/api/v1/organizations/{id}/signatories", "tag": "organizations", "summary": "Добавить подписанта", "idempotent": false },
  createTemplate: { "operationId": "createTemplate", "method": "post", "path": "/api/v1/templates", "tag": "templates", "summary": "Создать шаблон (копия базового)", "idempotent": false },
  createTemplateVersion: { "operationId": "createTemplateVersion", "method": "post", "path": "/api/v1/templates/{id}/versions", "tag": "templates", "summary": "Новая черновая версия", "idempotent": false },
  createToken: { "operationId": "createToken", "method": "post", "path": "/api/v1/tokens", "tag": "tokens", "summary": "Создать токен (admin), секрет — один раз", "idempotent": false },
  createUnit: { "operationId": "createUnit", "method": "post", "path": "/api/v1/units", "tag": "units", "summary": "Добавить единицу (admin)", "idempotent": false },
  createUser: { "operationId": "createUser", "method": "post", "path": "/api/v1/users", "tag": "users", "summary": "Создать пользователя (admin)", "idempotent": false },
  createWebhook: { "operationId": "createWebhook", "method": "post", "path": "/api/v1/webhooks", "tag": "webhooks", "summary": "Создать подписчика (секрет показывается один раз)", "idempotent": false },
  deleteBankAccount: { "operationId": "deleteBankAccount", "method": "delete", "path": "/api/v1/organizations/{id}/bank-accounts/{accountId}", "tag": "organizations", "summary": "Удалить банковский счёт", "idempotent": false },
  deleteContractFile: { "operationId": "deleteContractFile", "method": "delete", "path": "/api/v1/contracts/{id}/files/{assetId}", "tag": "contracts", "summary": "Удалить скан договора", "idempotent": false },
  deleteCounterpartyContact: { "operationId": "deleteCounterpartyContact", "method": "delete", "path": "/api/v1/counterparties/{id}/contacts/{contactId}", "tag": "counterparties", "summary": "Удалить контакт", "idempotent": false },
  deleteDocument: { "operationId": "deleteDocument", "method": "delete", "path": "/api/v1/documents/{id}", "tag": "documents", "summary": "Удалить черновик", "idempotent": false },
  deleteNote: { "operationId": "deleteNote", "method": "delete", "path": "/api/v1/notes/{id}", "tag": "notes", "summary": "Удалить заметку (физически)", "idempotent": false },
  deletePayment: { "operationId": "deletePayment", "method": "delete", "path": "/api/v1/payments/{id}", "tag": "payments", "summary": "Удалить оплату и откатить статус", "idempotent": false },
  deleteSignatory: { "operationId": "deleteSignatory", "method": "delete", "path": "/api/v1/organizations/{id}/signatories/{signatoryId}", "tag": "organizations", "summary": "Удалить подписанта", "idempotent": false },
  deleteUnit: { "operationId": "deleteUnit", "method": "delete", "path": "/api/v1/units/{code}", "tag": "units", "summary": "Удалить единицу (admin)", "idempotent": false },
  deleteUser: { "operationId": "deleteUser", "method": "delete", "path": "/api/v1/users/{id}", "tag": "users", "summary": "Soft delete пользователя (admin)", "idempotent": false },
  deleteWebhook: { "operationId": "deleteWebhook", "method": "delete", "path": "/api/v1/webhooks/{id}", "tag": "webhooks", "summary": "Удалить подписчика вместе с журналом", "idempotent": false },
  downloadDataExport: { "operationId": "downloadDataExport", "method": "get", "path": "/api/v1/data-exports/{id}/download", "tag": "data-exports", "summary": "Скачать готовый пакет", "idempotent": true },
  downloadDocumentPdf: { "operationId": "downloadDocumentPdf", "method": "get", "path": "/api/v1/documents/{id}/pdf", "tag": "documents", "summary": "PDF документа (печать, подпись, водяной знак)", "idempotent": true },
  downloadFile: { "operationId": "downloadFile", "method": "get", "path": "/api/v1/files/{versionId}", "tag": "files", "summary": "Скачать файл версии ассета", "idempotent": true },
  downloadReportExport: { "operationId": "downloadReportExport", "method": "get", "path": "/api/v1/reports/exports/{id}/download", "tag": "reports", "summary": "Скачать готовый экспорт", "idempotent": true },
  downloadSharedDocumentPdf: { "operationId": "downloadSharedDocumentPdf", "method": "get", "path": "/api/v1/documents/shared/{token}", "tag": "documents", "summary": "PDF по короткоживущей подписанной ссылке", "idempotent": true },
  downloadShareDocumentPdf: { "operationId": "downloadShareDocumentPdf", "method": "get", "path": "/s/{token}/documents/{documentId}/pdf", "tag": "shares-public", "summary": "PDF документа ссылки", "idempotent": true },
  duplicateDocument: { "operationId": "duplicateDocument", "method": "post", "path": "/api/v1/documents/{id}/duplicate", "tag": "documents", "summary": "Копия в новый черновик", "idempotent": false },
  duplicateTemplate: { "operationId": "duplicateTemplate", "method": "post", "path": "/api/v1/templates/{id}/duplicate", "tag": "templates", "summary": "Копия шаблона в кабинете", "idempotent": false },
  exportAudit: { "operationId": "exportAudit", "method": "get", "path": "/api/v1/audit/export", "tag": "audit", "summary": "Экспорт аудита: CSV (`;`, BOM) или JSON (admin)", "idempotent": true },
  forgotPassword: { "operationId": "forgotPassword", "method": "post", "path": "/api/v1/auth/password/forgot", "tag": "auth", "summary": "Запрос сброса пароля (всегда 202, письмо — фаза 2)", "idempotent": false },
  getAuditEntry: { "operationId": "getAuditEntry", "method": "get", "path": "/api/v1/audit/{id}", "tag": "audit", "summary": "Запись аудита с diff (admin)", "idempotent": true },
  getContract: { "operationId": "getContract", "method": "get", "path": "/api/v1/contracts/{id}", "tag": "contracts", "summary": "Карточка договора", "idempotent": true },
  getCounterparty: { "operationId": "getCounterparty", "method": "get", "path": "/api/v1/counterparties/{id}", "tag": "counterparties", "summary": "Карточка контрагента с контактами", "idempotent": true },
  getCounterpartyBalance: { "operationId": "getCounterpartyBalance", "method": "get", "path": "/api/v1/counterparties/{id}/balance", "tag": "counterparties", "summary": "Сальдо на дату", "idempotent": true },
  getCounterpartySummary: { "operationId": "getCounterpartySummary", "method": "get", "path": "/api/v1/counterparties/{id}/summary", "tag": "counterparties", "summary": "Сводка по контрагенту", "idempotent": true },
  getDataExport: { "operationId": "getDataExport", "method": "get", "path": "/api/v1/data-exports/{id}", "tag": "data-exports", "summary": "Статус пакета переноса", "idempotent": true },
  getDataImport: { "operationId": "getDataImport", "method": "get", "path": "/api/v1/data-imports/{id}", "tag": "data-imports", "summary": "Статус импорта и отчёт по строкам", "idempotent": true },
  getDocument: { "operationId": "getDocument", "method": "get", "path": "/api/v1/documents/{id}", "tag": "documents", "summary": "Документ с позициями", "idempotent": true },
  getDocumentHtml: { "operationId": "getDocumentHtml", "method": "get", "path": "/api/v1/documents/{id}/html", "tag": "documents", "summary": "HTML для предпросмотра", "idempotent": true },
  getDocumentVersion: { "operationId": "getDocumentVersion", "method": "get", "path": "/api/v1/documents/{id}/versions/{revision}", "tag": "documents", "summary": "Версия целиком", "idempotent": true },
  getEffectiveSettings: { "operationId": "getEffectiveSettings", "method": "get", "path": "/api/v1/settings", "tag": "settings", "summary": "Эффективные значения для контекста", "idempotent": true },
  getMe: { "operationId": "getMe", "method": "get", "path": "/api/v1/auth/me", "tag": "auth", "summary": "Текущий пользователь, роль и права", "idempotent": true },
  getNote: { "operationId": "getNote", "method": "get", "path": "/api/v1/notes/{id}", "tag": "notes", "summary": "Карточка заметки с привязками", "idempotent": true },
  getNotesCalendar: { "operationId": "getNotesCalendar", "method": "get", "path": "/api/v1/notes/calendar", "tag": "notes", "summary": "События календаря по дедлайнам и напоминаниям", "idempotent": true },
  getOrganization: { "operationId": "getOrganization", "method": "get", "path": "/api/v1/organizations/{id}", "tag": "organizations", "summary": "Карточка организации", "idempotent": true },
  getOrganizationEffectiveSettings: { "operationId": "getOrganizationEffectiveSettings", "method": "get", "path": "/api/v1/organizations/{id}/effective-settings", "tag": "organizations", "summary": "Эффективные настройки организации", "idempotent": true },
  getPayment: { "operationId": "getPayment", "method": "get", "path": "/api/v1/payments/{id}", "tag": "payments", "summary": "Карточка оплаты", "idempotent": true },
  getProduct: { "operationId": "getProduct", "method": "get", "path": "/api/v1/products/{id}", "tag": "products", "summary": "Карточка позиции", "idempotent": true },
  getPublicSettings: { "operationId": "getPublicSettings", "method": "get", "path": "/api/v1/settings/public", "tag": "settings", "summary": "Публичные настройки (без авторизации)", "idempotent": true },
  getReportExport: { "operationId": "getReportExport", "method": "get", "path": "/api/v1/reports/exports/{id}", "tag": "reports", "summary": "Статус экспорта отчёта", "idempotent": true },
  getShare: { "operationId": "getShare", "method": "get", "path": "/api/v1/shares/{id}", "tag": "shares", "summary": "Детали, просмотры и ответы", "idempotent": true },
  getSystemStatus: { "operationId": "getSystemStatus", "method": "get", "path": "/api/v1/system/status", "tag": "system", "summary": "Версия, БД, диск, рендер (admin)", "idempotent": true },
  getTemplate: { "operationId": "getTemplate", "method": "get", "path": "/api/v1/templates/{id}", "tag": "templates", "summary": "Карточка шаблона и версии", "idempotent": true },
  getTemplateVersion: { "operationId": "getTemplateVersion", "method": "get", "path": "/api/v1/templates/{id}/versions/{version}", "tag": "templates", "summary": "Версия шаблона целиком", "idempotent": true },
  getToken: { "operationId": "getToken", "method": "get", "path": "/api/v1/tokens/{id}", "tag": "tokens", "summary": "Метаданные токена (admin)", "idempotent": true },
  getUser: { "operationId": "getUser", "method": "get", "path": "/api/v1/users/{id}", "tag": "users", "summary": "Карточка пользователя (admin)", "idempotent": true },
  getWebhook: { "operationId": "getWebhook", "method": "get", "path": "/api/v1/webhooks/{id}", "tag": "webhooks", "summary": "Подписчик", "idempotent": true },
  healthCheck: { "operationId": "healthCheck", "method": "get", "path": "/health", "tag": "health", "summary": "Сервис отвечает", "idempotent": true },
  healthLive: { "operationId": "healthLive", "method": "get", "path": "/health/live", "tag": "health", "summary": "Процесс жив", "idempotent": true },
  healthReady: { "operationId": "healthReady", "method": "get", "path": "/health/ready", "tag": "health", "summary": "Готов принимать трафик (БД доступна)", "idempotent": true },
  importDocument: { "operationId": "importDocument", "method": "post", "path": "/api/v1/documents/import", "tag": "imports", "summary": "Создать черновик из текста или JSON", "idempotent": false },
  inviteUser: { "operationId": "inviteUser", "method": "post", "path": "/api/v1/users/{id}/invite", "tag": "users", "summary": "Приглашение/переотправка: токен активации в ответе (почта — фаза 2)", "idempotent": false },
  issueDocument: { "operationId": "issueDocument", "method": "post", "path": "/api/v1/documents/{id}/issue", "tag": "documents", "summary": "Выдать документ: номер и версия 1", "idempotent": false },
  listAppErrors: { "operationId": "listAppErrors", "method": "get", "path": "/api/v1/system/errors", "tag": "system", "summary": "Ошибки 5xx из ring buffer (admin)", "idempotent": true },
  listAudit: { "operationId": "listAudit", "method": "get", "path": "/api/v1/audit", "tag": "audit", "summary": "Журнал действий (admin)", "idempotent": true },
  listBankAccounts: { "operationId": "listBankAccounts", "method": "get", "path": "/api/v1/organizations/{id}/bank-accounts", "tag": "organizations", "summary": "Банковские счета организации", "idempotent": true },
  listContractFiles: { "operationId": "listContractFiles", "method": "get", "path": "/api/v1/contracts/{id}/file-links", "tag": "contracts", "summary": "Ссылки на сканы договора", "idempotent": true },
  listContracts: { "operationId": "listContracts", "method": "get", "path": "/api/v1/contracts", "tag": "contracts", "summary": "Реестр договоров", "idempotent": true },
  listCounterparties: { "operationId": "listCounterparties", "method": "get", "path": "/api/v1/counterparties", "tag": "counterparties", "summary": "Список контрагентов с поиском", "idempotent": true },
  listCounterpartyDocuments: { "operationId": "listCounterpartyDocuments", "method": "get", "path": "/api/v1/counterparties/{id}/documents", "tag": "counterparties", "summary": "Документы контрагента", "idempotent": true },
  listDevices: { "operationId": "listDevices", "method": "get", "path": "/api/v1/devices", "tag": "devices", "summary": "Устройства текущего пользователя", "idempotent": true },
  listDocumentNotes: { "operationId": "listDocumentNotes", "method": "get", "path": "/api/v1/documents/{id}/notes", "tag": "notes", "summary": "Заметки, привязанные к документу", "idempotent": true },
  listDocumentPayments: { "operationId": "listDocumentPayments", "method": "get", "path": "/api/v1/documents/{id}/payments", "tag": "payments", "summary": "Оплаты документа и остаток", "idempotent": true },
  listDocuments: { "operationId": "listDocuments", "method": "get", "path": "/api/v1/documents", "tag": "documents", "summary": "Список документов", "idempotent": true },
  listDocumentVersions: { "operationId": "listDocumentVersions", "method": "get", "path": "/api/v1/documents/{id}/versions", "tag": "documents", "summary": "Версии документа", "idempotent": true },
  listLoginAttempts: { "operationId": "listLoginAttempts", "method": "get", "path": "/api/v1/login-attempts", "tag": "audit", "summary": "Журнал попыток входа (admin)", "idempotent": true },
  listNotes: { "operationId": "listNotes", "method": "get", "path": "/api/v1/notes", "tag": "notes", "summary": "Список и поиск заметок", "idempotent": true },
  listOrganizationAssets: { "operationId": "listOrganizationAssets", "method": "get", "path": "/api/v1/organizations/{id}/assets", "tag": "organizations", "summary": "Файлы организации (версии)", "idempotent": true },
  listOrganizations: { "operationId": "listOrganizations", "method": "get", "path": "/api/v1/organizations", "tag": "organizations", "summary": "Список доступных организаций", "idempotent": true },
  listPayments: { "operationId": "listPayments", "method": "get", "path": "/api/v1/payments", "tag": "payments", "summary": "Список оплат", "idempotent": true },
  listPersonalTokens: { "operationId": "listPersonalTokens", "method": "get", "path": "/api/v1/tokens/personal", "tag": "tokens", "summary": "Свои personal-токены", "idempotent": true },
  listProducts: { "operationId": "listProducts", "method": "get", "path": "/api/v1/products", "tag": "products", "summary": "Номенклатура с поиском", "idempotent": true },
  listSettingDefinitions: { "operationId": "listSettingDefinitions", "method": "get", "path": "/api/v1/settings/definitions", "tag": "settings", "summary": "Реестр настроек (admin)", "idempotent": true },
  listShareReplies: { "operationId": "listShareReplies", "method": "get", "path": "/api/v1/shares/{id}/replies", "tag": "shares", "summary": "Ответы клиента", "idempotent": true },
  listShares: { "operationId": "listShares", "method": "get", "path": "/api/v1/shares", "tag": "shares", "summary": "Ссылки со статусами", "idempotent": true },
  listShareViews: { "operationId": "listShareViews", "method": "get", "path": "/api/v1/shares/{id}/views", "tag": "shares", "summary": "Журнал просмотров", "idempotent": true },
  listSignatories: { "operationId": "listSignatories", "method": "get", "path": "/api/v1/organizations/{id}/signatories", "tag": "organizations", "summary": "Подписанты организации", "idempotent": true },
  listTemplates: { "operationId": "listTemplates", "method": "get", "path": "/api/v1/templates", "tag": "templates", "summary": "Галерея шаблонов", "idempotent": true },
  listTokens: { "operationId": "listTokens", "method": "get", "path": "/api/v1/tokens", "tag": "tokens", "summary": "Список токенов кабинета (admin)", "idempotent": true },
  listUnits: { "operationId": "listUnits", "method": "get", "path": "/api/v1/units", "tag": "units", "summary": "Единицы измерения", "idempotent": true },
  listUsers: { "operationId": "listUsers", "method": "get", "path": "/api/v1/users", "tag": "users", "summary": "Список пользователей (admin)", "idempotent": true },
  listWebhookDeliveries: { "operationId": "listWebhookDeliveries", "method": "get", "path": "/api/v1/webhooks/{id}/deliveries", "tag": "webhooks", "summary": "Журнал доставок", "idempotent": true },
  listWebhooks: { "operationId": "listWebhooks", "method": "get", "path": "/api/v1/webhooks", "tag": "webhooks", "summary": "Подписчики кабинета", "idempotent": true },
  login: { "operationId": "login", "method": "post", "path": "/api/v1/auth/login", "tag": "auth", "summary": "Вход по email и паролю", "idempotent": false },
  logout: { "operationId": "logout", "method": "post", "path": "/api/v1/auth/logout", "tag": "auth", "summary": "Отзыв текущей сессии", "idempotent": false },
  lookupCounterparty: { "operationId": "lookupCounterparty", "method": "post", "path": "/api/v1/counterparties/lookup", "tag": "counterparties", "summary": "Автозаполнение по ИНН (вторая фаза — пока 501)", "idempotent": false },
  markDocumentReceived: { "operationId": "markDocumentReceived", "method": "post", "path": "/api/v1/documents/{id}/received", "tag": "documents", "summary": "Отметить акт полученным (подписан клиентом), опционально со сканом", "idempotent": false },
  openSharePage: { "operationId": "openSharePage", "method": "get", "path": "/s/{token}", "tag": "shares-public", "summary": "HTML-страница ссылки", "idempotent": true },
  previewDataImport: { "operationId": "previewDataImport", "method": "post", "path": "/api/v1/data-imports/preview", "tag": "data-imports", "summary": "Предпросмотр импорта пакета: план, конфликты, ошибки (dry-run)", "idempotent": false },
  previewImport: { "operationId": "previewImport", "method": "post", "path": "/api/v1/imports/preview", "tag": "imports", "summary": "Предпросмотр импорта позиций", "idempotent": false },
  previewTemplate: { "operationId": "previewTemplate", "method": "post", "path": "/api/v1/templates/{id}/preview", "tag": "templates", "summary": "Предпросмотр на тестовом снимке (html, pdf, png)", "idempotent": false },
  publishTemplateVersion: { "operationId": "publishTemplateVersion", "method": "post", "path": "/api/v1/templates/{id}/versions/{version}/publish", "tag": "templates", "summary": "Публикация версии после шести проверок", "idempotent": false },
  refreshTokens: { "operationId": "refreshTokens", "method": "post", "path": "/api/v1/auth/refresh", "tag": "auth", "summary": "Ротация refresh и новый access", "idempotent": false },
  registerDevice: { "operationId": "registerDevice", "method": "post", "path": "/api/v1/devices", "tag": "devices", "summary": "Регистрация push-токена (идемпотентно по pushToken)", "idempotent": false },
  removeNoteLink: { "operationId": "removeNoteLink", "method": "delete", "path": "/api/v1/notes/{id}/links", "tag": "notes", "summary": "Отвязать сущность от заметки", "idempotent": false },
  reopenNote: { "operationId": "reopenNote", "method": "post", "path": "/api/v1/notes/{id}/reopen", "tag": "notes", "summary": "Переоткрыть заметку", "idempotent": false },
  replaceDocumentItems: { "operationId": "replaceDocumentItems", "method": "put", "path": "/api/v1/documents/{id}/items", "tag": "documents", "summary": "Заменить позиции черновика", "idempotent": false },
  replyToShare: { "operationId": "replyToShare", "method": "post", "path": "/s/{token}/replies", "tag": "shares-public", "summary": "Ответ клиента по ссылке", "idempotent": false },
  reportsPayments: { "operationId": "reportsPayments", "method": "get", "path": "/api/v1/reports/payments", "tag": "reports", "summary": "Ведомость оплат за период с документом и контрагентом", "idempotent": true },
  reportsReconciliation: { "operationId": "reportsReconciliation", "method": "get", "path": "/api/v1/reports/reconciliation", "tag": "reports", "summary": "Акт сверки: начальное сальдо, обороты, нарастающий итог", "idempotent": true },
  reportsRegistry: { "operationId": "reportsRegistry", "method": "get", "path": "/api/v1/reports/registry", "tag": "reports", "summary": "Реестр документов за период: суммы, НДС, статусы", "idempotent": true },
  reportsSummary: { "operationId": "reportsSummary", "method": "get", "path": "/api/v1/reports/summary", "tag": "reports", "summary": "Сводка: выставлено, оплачено, долг и просрочка за период", "idempotent": true },
  reportsUnpaid: { "operationId": "reportsUnpaid", "method": "get", "path": "/api/v1/reports/unpaid", "tag": "reports", "summary": "Неоплаченные документы: остаток, просрочка, старые сверху", "idempotent": true },
  resetPassword: { "operationId": "resetPassword", "method": "post", "path": "/api/v1/auth/password/reset", "tag": "auth", "summary": "Сброс пароля по одноразовому токену", "idempotent": false },
  resetSetting: { "operationId": "resetSetting", "method": "delete", "path": "/api/v1/settings/{code}", "tag": "settings", "summary": "Сброс настройки к следующему уровню (admin)", "idempotent": false },
  resetUserPassword: { "operationId": "resetUserPassword", "method": "post", "path": "/api/v1/users/{id}/reset-password", "tag": "users", "summary": "Сброс пароля админом: временный пароль в ответе (один раз)", "idempotent": false },
  retryWebhookDelivery: { "operationId": "retryWebhookDelivery", "method": "post", "path": "/api/v1/webhooks/{id}/deliveries/{deliveryId}/retry", "tag": "webhooks", "summary": "Повторить доставку вручную", "idempotent": false },
  revokeDevice: { "operationId": "revokeDevice", "method": "delete", "path": "/api/v1/devices/{id}", "tag": "devices", "summary": "Выход: отзыв устройства", "idempotent": false },
  revokePersonalToken: { "operationId": "revokePersonalToken", "method": "delete", "path": "/api/v1/tokens/personal/{id}", "tag": "tokens", "summary": "Отозвать свой personal-токен (владелец; идемпотентно)", "idempotent": false },
  revokeShare: { "operationId": "revokeShare", "method": "delete", "path": "/api/v1/shares/{id}", "tag": "shares", "summary": "Отозвать ссылку", "idempotent": false },
  revokeToken: { "operationId": "revokeToken", "method": "delete", "path": "/api/v1/tokens/{id}", "tag": "tokens", "summary": "Отозвать токен (admin)", "idempotent": false },
  rotateWebhookSecret: { "operationId": "rotateWebhookSecret", "method": "post", "path": "/api/v1/webhooks/{id}/rotate-secret", "tag": "webhooks", "summary": "Новый секрет подписи", "idempotent": false },
  searchBanks: { "operationId": "searchBanks", "method": "get", "path": "/api/v1/banks", "tag": "banks", "summary": "Поиск банка в справочнике", "idempotent": true },
  setDefaultAsset: { "operationId": "setDefaultAsset", "method": "post", "path": "/api/v1/assets/{id}/default", "tag": "files", "summary": "Сделать файл основным для своего вида (печать, подпись)", "idempotent": false },
  setDefaultBankAccount: { "operationId": "setDefaultBankAccount", "method": "post", "path": "/api/v1/organizations/{id}/bank-accounts/{accountId}/default", "tag": "organizations", "summary": "Сделать счётом по умолчанию", "idempotent": false },
  setDefaultSignatory: { "operationId": "setDefaultSignatory", "method": "post", "path": "/api/v1/organizations/{id}/signatories/{signatoryId}/default", "tag": "organizations", "summary": "Сделать подписантом по умолчанию", "idempotent": false },
  testWebhook: { "operationId": "testWebhook", "method": "post", "path": "/api/v1/webhooks/{id}/test", "tag": "webhooks", "summary": "Тестовая доставка (синхронно)", "idempotent": false },
  unblockUser: { "operationId": "unblockUser", "method": "post", "path": "/api/v1/users/{id}/unblock", "tag": "users", "summary": "Разблокировать пользователя (admin)", "idempotent": false },
  unmarkDocumentReceived: { "operationId": "unmarkDocumentReceived", "method": "delete", "path": "/api/v1/documents/{id}/received", "tag": "documents", "summary": "Снять отметку получения акта", "idempotent": false },
  updateBankAccount: { "operationId": "updateBankAccount", "method": "patch", "path": "/api/v1/organizations/{id}/bank-accounts/{accountId}", "tag": "organizations", "summary": "Изменить банковский счёт", "idempotent": false },
  updateContract: { "operationId": "updateContract", "method": "patch", "path": "/api/v1/contracts/{id}", "tag": "contracts", "summary": "Изменить договор", "idempotent": false },
  updateCounterparty: { "operationId": "updateCounterparty", "method": "patch", "path": "/api/v1/counterparties/{id}", "tag": "counterparties", "summary": "Изменить контрагента", "idempotent": false },
  updateCounterpartyContact: { "operationId": "updateCounterpartyContact", "method": "patch", "path": "/api/v1/counterparties/{id}/contacts/{contactId}", "tag": "counterparties", "summary": "Изменить контакт", "idempotent": false },
  updateDevice: { "operationId": "updateDevice", "method": "patch", "path": "/api/v1/devices/{id}", "tag": "devices", "summary": "Уведомления, версия приложения, имя", "idempotent": false },
  updateDocument: { "operationId": "updateDocument", "method": "patch", "path": "/api/v1/documents/{id}", "tag": "documents", "summary": "Изменить черновик", "idempotent": false },
  updateNote: { "operationId": "updateNote", "method": "patch", "path": "/api/v1/notes/{id}", "tag": "notes", "summary": "Изменить заметку", "idempotent": false },
  updateOrganization: { "operationId": "updateOrganization", "method": "patch", "path": "/api/v1/organizations/{id}", "tag": "organizations", "summary": "Изменить реквизиты и режим НО", "idempotent": false },
  updateProduct: { "operationId": "updateProduct", "method": "patch", "path": "/api/v1/products/{id}", "tag": "products", "summary": "Изменить позицию", "idempotent": false },
  updateSettings: { "operationId": "updateSettings", "method": "patch", "path": "/api/v1/settings", "tag": "settings", "summary": "Массовое обновление настроек (admin)", "idempotent": false },
  updateSignatory: { "operationId": "updateSignatory", "method": "patch", "path": "/api/v1/organizations/{id}/signatories/{signatoryId}", "tag": "organizations", "summary": "Изменить подписанта", "idempotent": false },
  updateTemplate: { "operationId": "updateTemplate", "method": "patch", "path": "/api/v1/templates/{id}", "tag": "templates", "summary": "Название, ориентация, флаги", "idempotent": false },
  updateUnit: { "operationId": "updateUnit", "method": "patch", "path": "/api/v1/units/{code}", "tag": "units", "summary": "Изменить единицу (admin)", "idempotent": false },
  updateUser: { "operationId": "updateUser", "method": "patch", "path": "/api/v1/users/{id}", "tag": "users", "summary": "Изменить пользователя (admin)", "idempotent": false },
  updateWebhook: { "operationId": "updateWebhook", "method": "patch", "path": "/api/v1/webhooks/{id}", "tag": "webhooks", "summary": "Изменить адрес, события, активность", "idempotent": false },
  uploadContractFile: { "operationId": "uploadContractFile", "method": "post", "path": "/api/v1/contracts/{id}/files", "tag": "contracts", "summary": "Прикрепить скан договора", "idempotent": false },
  uploadFile: { "operationId": "uploadFile", "method": "post", "path": "/api/v1/files", "tag": "files", "summary": "Загрузить файл (скан, печать, подпись)", "idempotent": false },
  uploadOrganizationAsset: { "operationId": "uploadOrganizationAsset", "method": "post", "path": "/api/v1/organizations/{id}/assets", "tag": "organizations", "summary": "Загрузить печать/подпись/логотип", "idempotent": false },
  uploadOrganizationAssetVersion: { "operationId": "uploadOrganizationAssetVersion", "method": "post", "path": "/api/v1/organizations/{id}/assets/{assetId}/versions", "tag": "organizations", "summary": "Новая версия ассета", "idempotent": false },
  verifySharePin: { "operationId": "verifySharePin", "method": "post", "path": "/s/{token}/verify", "tag": "shares-public", "summary": "Проверить PIN и открыть сессию ссылки", "idempotent": false }
};

// packages/sdk/dist/client.js
var DEFAULT_TIMEOUT_MS = 3e4;
function createApiHttpClient(options) {
  const baseUrl = options.baseUrl.replace(/\/+$/, "");
  const fetchImpl = options.fetch ?? globalThis.fetch;
  if (typeof fetchImpl !== "function") {
    throw new Error("Не найден fetch: передайте options.fetch (Node < 18 не поддерживается)");
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
          throw new ApiError(0, void 0, "Превышен таймаут запроса");
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
      throw new Error(`Не передан параметр пути «${name}» для ${operationId}`);
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
var SERVER_VERSION = true ? "0.1.3" : "0.0.0";

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
  return `Сервис недоступен (INVOICES_API_URL=${context.apiUrl}). Проверьте адрес и доступность: curl ${context.apiUrl}/health/live`;
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
  return `${shown.join("; ")}${rest > 0 ? ` (ещё ${rest})` : ""}`;
}
function describeApiError(error, context) {
  if (error instanceof ApiError) {
    const { status, code, problem, requestId } = error;
    const detail = problem?.detail ?? error.message;
    if (status === 401) {
      return "Токен недействителен, истёк или отозван. Проверьте INVOICES_API_TOKEN и при необходимости создайте новый в админке → «Токены».";
    }
    if (status === 403 && code === "IP_NOT_ALLOWED") {
      return "IP этого клиента не в списке разрешённых у токена. Попросите админа добавить IP или очистить allowlist токена.";
    }
    if (status === 403) {
      const scope = code === "SCOPE_FORBIDDEN" ? detail : void 0;
      return `У токена нет нужного права${scope ? ` (${scope})` : ""}. Попросите админа выдать токен с этим правом или выполните операцию в кабинете.`;
    }
    if (status === 404 && code === "UNIT_NOT_FOUND") {
      return "Единица измерения не найдена. Возьмите код из существующих позиций (invoices_products_list) — например, «шт»; справочник единиц — в кабинете.";
    }
    if (status === 404) {
      return `Не найдено или недоступно этому токену: ${detail}. Проверьте идентификатор поиском.`;
    }
    if (status === 409) {
      return `Конфликт: ${detail}. Перечитайте объект и повторите действие.`;
    }
    if (status === 422) {
      const items = problem?.errors ?? [];
      return items.length > 0 ? `Данные не приняты: ${validationDetails(items)}. Исправьте и повторите.` : `Данные не приняты: ${detail}. Исправьте и повторите.`;
    }
    if (status === 429) {
      return "Превышен лимит запросов к API. Подождите минуту и повторите.";
    }
    if (status >= 500) {
      return `Ошибка сервиса (${status}): ${detail}. ${requestId ? `requestId: ${requestId} — передайте администратору.` : "Повторите позже."}`;
    }
    if (status === 0) {
      return detail === "Превышен таймаут запроса" ? `API не ответил за отведённое время. Увеличьте INVOICES_TIMEOUT_MS или проверьте доступность (${context.apiUrl}).` : serviceUnavailable(context);
    }
    return `${detail} (${status}${code ? ` ${code}` : ""})`;
  }
  const networkCode = networkCodeOf(error);
  if (networkCode !== void 0 && NETWORK_CODES.has(networkCode)) {
    return serviceUnavailable(context);
  }
  if (isBadPort(error)) {
    return `Порт в INVOICES_API_URL запрещён стандартом fetch (например, 1, 9, 25). Укажите рабочий порт API: ${context.apiUrl}`;
  }
  if (error instanceof Error) {
    if (error.name === "AbortError") {
      return "Запрос отменён клиентом.";
    }
    return `Внутренняя ошибка MCP: ${error.message}. Повторите запрос; если повторяется — сообщите администратору и приложите название инструмента.`;
  }
  return "Неизвестная ошибка при обращении к API.";
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
    messages.push(`Предупреждение: базовые справочники недоступны этому токену — ${describeApiError(error, {
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
      messages.push(`Предупреждение: версия API ${status.version} не совпадает с контрактом /api/v${SUPPORTED_API_MAJOR}, по которому собран MCP. Обновите MCP или API.`);
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
  INVOICES_API_URL: z.string().trim().min(1, "обязательна — базовый URL API"),
  INVOICES_API_TOKEN: z.string().trim().regex(TOKEN_PATTERN, "ожидается сервисный токен вида ivs_<kid>_<secret> (админка → Токены)"),
  INVOICES_TIMEOUT_MS: z.coerce.number().int().min(500).max(3e5).default(1e4),
  INVOICES_LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
  /**
   * Хосты, для которых разрешён `http://` помимо localhost.
   *
   * Нужно для локального запуска в Docker: из контейнера API доступен как
   * `http://host.docker.internal:3011` или `http://api:3000`, а TLS там нет.
   * По умолчанию пусто — поведение M1 не меняется.
   */
  INVOICES_ALLOW_HTTP_HOSTS: z.string().default(""),
  INVOICES_MCP_TRANSPORT: z.enum(["stdio", "http"]).default("stdio"),
  INVOICES_MCP_PORT: z.coerce.number().int().min(1).max(65535).default(7331)
});
function parseAllowedHttpHosts(raw) {
  return raw.split(",").map((host) => host.trim().toLowerCase()).filter((host) => host !== "");
}
function normalizeApiUrl(raw, allowedHosts = []) {
  let url;
  try {
    url = new URL(raw.trim());
  } catch {
    throw new ConfigError([
      "INVOICES_API_URL: ожидается абсолютный URL, например http://localhost:8080"
    ]);
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new ConfigError([
      `INVOICES_API_URL: поддерживаются только http и https, получено «${url.protocol}»`
    ]);
  }
  const allowedHttp = LOCAL_HOSTNAMES.has(url.hostname) || allowedHosts.includes(url.hostname.toLowerCase());
  if (url.protocol === "http:" && !allowedHttp) {
    throw new ConfigError([
      `INVOICES_API_URL: http разрешён только для localhost/127.0.0.1 и для хостов из INVOICES_ALLOW_HTTP_HOSTS — для «${url.hostname}» нужен https`
    ]);
  }
  const path = url.pathname.replace(/\/+$/, "");
  if (path !== "") {
    throw new ConfigError([
      `INVOICES_API_URL: укажите базовый адрес без пути и без /api/v1 — «${path}» лишний, SDK добавляет /api/v1 сам`
    ]);
  }
  if (url.search !== "" || url.hash !== "") {
    throw new ConfigError(["INVOICES_API_URL: без query и якоря — только базовый адрес API"]);
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
    apiUrl = normalizeApiUrl(parsed.data.INVOICES_API_URL, parseAllowedHttpHosts(parsed.data.INVOICES_ALLOW_HTTP_HOSTS));
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
  'Сервис счетов и актов. Деньги — строки "124000.00", даты — DD.MM.YYYY.',
  "Перед созданием: найди организацию и контрагента (invoices_organizations_list,",
  "invoices_contractors_search). Не придумывай цены и суммы — если не указаны, спроси.",
  "Черновик создаётся без выдачи. У черновика нет номера — ищи его по контрагенту и",
  'status: ["draft"], а не по номеру; храни id из ответа create_draft.',
  "Выдача, аннулирование, оплата, ссылка и создание",
  "контрагента требуют confirm: true и явного согласия пользователя.",
  "Токен только для чтения не позволяет изменять данные. Не запрашивай админские",
  "операции. Подробные сценарии — ресурс skill://invoices или инструмент invoices_help.",
  "Сервер передаёт данные кабинета в модель клиента (включая локальные модели).",
  "Не используйте его для данных, которые нельзя обрабатывать выбранной моделью;",
  "рекомендуется токен только для чтения."
].join("\n");

// apps/mcp/dist/prompts/act-from-invoice.js
import { z as z2 } from "zod";

// apps/mcp/dist/prompts/shared.js
var PROMPT_RULES = "Правила: суммы и даты — только из API, не пересчитывай их вручную. Ничего не записывай без явного подтверждения пользователя. Если прав токена не хватает — скажи об этом прямо.";
function userPrompt(text) {
  return {
    messages: [{ role: "user", content: { type: "text", text } }]
  };
}

// apps/mcp/dist/prompts/act-from-invoice.js
var PROMPT = "invoices_prompt_act_from_invoice";
var Args = z2.object({
  number: z2.string().trim().min(1).describe("Номер счёта, например СЧ-2026-0043")
});
function registerActFromInvoicePrompt(server) {
  server.registerPrompt(PROMPT, {
    title: "Акт по счёту",
    description: "Сценарий закрытия счёта актом: показать позиции и суммы из карточки счёта, дождаться подтверждения, создать акт и выдать его.",
    argsSchema: Args
  }, ({ number }) => userPrompt([
    `Создай акт по счёту ${number}. Если пользователь не уточнил — полное закрытие.`,
    "Покажи, какие позиции и суммы войдут в акт, дождись подтверждения,",
    "затем invoices_documents_create_act и (после подтверждения) invoices_documents_issue.",
    "",
    "Позиции и суммы возьми из карточки счёта (invoices_documents_search по номеру, затем invoices_documents_get).",
    "",
    PROMPT_RULES
  ].join("\n")));
}

// apps/mcp/dist/prompts/contractor-summary.js
import { z as z3 } from "zod";
var PROMPT2 = "invoices_prompt_contractor_summary";
var Args2 = z3.object({
  contractor: z3.string().trim().min(1).describe("Контрагент: название или ИНН"),
  period: z3.string().trim().min(1).optional().describe("Период сводки (необязательно)")
});
function registerContractorSummaryPrompt(server) {
  server.registerPrompt(PROMPT2, {
    title: "Сводка по контрагенту",
    description: "Сценарий сводки: выставлено, оплачено, долг, просрочка, неоплаченные счета и последние документы — из invoices_contractors_summary и invoices_reports_unpaid.",
    argsSchema: Args2
  }, ({ contractor, period }) => userPrompt([
    `Сделай сводку по контрагенту ${contractor}${period === void 0 ? "" : ` за ${period}`}:`,
    "- сколько выставлено, оплачено, долг, просрочка;",
    "- динамика по месяцам;",
    "- неоплаченные счета с днями просрочки;",
    "- последние документы.",
    "Используй invoices_contractors_summary и invoices_reports_unpaid. Не пересчитывай суммы вручную.",
    ...period === void 0 ? ["", "Период не указан — уточни его у пользователя, прежде чем считать."] : [],
    "",
    PROMPT_RULES
  ].join("\n")));
}

// apps/mcp/dist/prompts/create-invoice.js
import { z as z4 } from "zod";
var PROMPT3 = "invoices_prompt_create_invoice";
var Args3 = z4.object({
  organization: z4.string().trim().min(1).describe("Организация: название или ID"),
  contractor: z4.string().trim().min(1).describe("Контрагент: название или ИНН"),
  description: z4.string().trim().min(1).describe("Что выставить: работы, услуги, количество, единица, цена"),
  period: z4.string().trim().min(1).optional().describe("Период или дата счёта (необязательно)")
});
function registerCreateInvoicePrompt(server) {
  server.registerPrompt(PROMPT3, {
    title: "Создать счёт по описанию",
    description: "Пошаговый сценарий: найти организацию и контрагента, разложить описание на позиции, создать черновик, выдать после подтверждения и дать ссылку на PDF.",
    argsSchema: Args3
  }, ({ organization, contractor, description, period }) => userPrompt([
    `Создай счёт по описанию. Организация: ${organization}. Контрагент: ${contractor}.`,
    `Описание работ/услуг: ${description}.${period === void 0 ? "" : ` Период: ${period}.`}`,
    "",
    "Шаги:",
    "1. Найди организацию (invoices_organizations_list) и контрагента (invoices_contractors_search по названию/ИНН).",
    "   Если контрагента нет — предложи создать (invoices_contractors_create), но не создавай без подтверждения.",
    "2. Разбей описание на позиции: наименование, количество, единица, цена.",
    "   Если цена не указана — спроси. Не выдумывай суммы.",
    "3. Создай черновик (invoices_documents_create_draft) и покажи таблицу позиций и итог.",
    "4. Спроси подтверждение на выдачу. Выдавай только после явного «да» (invoices_documents_issue, confirm: true).",
    "5. Дай ссылку на PDF (invoices_documents_pdf_link).",
    "",
    PROMPT_RULES
  ].join("\n")));
}

// apps/mcp/dist/prompts/unpaid-review.js
var PROMPT4 = "invoices_prompt_unpaid_review";
function registerUnpaidReviewPrompt(server) {
  server.registerPrompt(PROMPT4, {
    title: "Проверка дебиторки",
    description: "Сценарий разбора просроченной дебиторки: сгруппировать по контрагентам, отметить просрочку больше 30 дней и предложить следующие шаги."
  }, () => userPrompt([
    "Проверь дебиторку: invoices_reports_unpaid. Сгруппируй по контрагентам,",
    "отметь просрочку > 30 дней, предложи следующие шаги (напомнить, выставить акт, создать ссылку).",
    "",
    "Шаги (акт, ссылка, напоминание) только предлагай: выполняй их после явного подтверждения пользователя.",
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
    throw new PaginationError(`limit должен быть целым числом от 1 до ${MAX_LIMIT}.`);
  }
  if (value > MAX_LIMIT) {
    throw new PaginationError(`limit больше ${MAX_LIMIT} не поддерживается: запросите ${MAX_LIMIT} и передайте nextCursor из ответа в cursor.`);
  }
  return value;
}
function toPage(response) {
  return { items: response.items, nextCursor: response.nextCursor ?? null };
}
function nextPageHint(page) {
  return page.nextCursor === null ? void 0 : `Есть ещё: передайте cursor=${page.nextCursor}`;
}

// apps/mcp/dist/tools/contracts.js
import { z as z6 } from "zod";

// apps/mcp/dist/format/labels.js
var ORGANIZATION_KIND = {
  sole_proprietor: "ИП",
  llc: "ООО",
  other: "Другое"
};
var TAX_REGIME = {
  osno: "ОСНО",
  usn: "УСН",
  ausn: "АУСН",
  eskh: "ЕСХН",
  psn: "ПСН",
  npd: "НПД"
};
var VAT_STATUS = {
  payer: "плательщик НДС",
  exempt: "без НДС"
};
var ORG_STATUS = {
  active: "активна",
  archived: "в архиве"
};
var COUNTERPARTY_KIND = {
  legal: "юрлицо",
  sole_proprietor: "ИП",
  individual: "физлицо"
};
var VISIBILITY = {
  organization: "своя организация",
  shared: "общий",
  personal: "личный"
};
var DOCUMENT_TYPE = {
  invoice: "Счёт",
  act: "Акт",
  invoice_facture: "Счёт-фактура",
  upd: "УПД",
  contract: "Договор"
};
var DOCUMENT_STATUS = {
  draft: "черновик",
  on_approval: "на согласовании",
  issued: "выставлен",
  sent: "отправлен",
  partially_paid: "частично оплачен",
  overdue: "просрочен",
  paid: "оплачен",
  cancelled: "аннулирован",
  signed: "подписан"
};
var CONTRACT_STATUS = {
  active: "действует",
  closed: "закрыт",
  archived: "в архиве"
};
var SHARE_STATUS = {
  active: "активна",
  expired: "истекла",
  exhausted: "просмотры закончились",
  revoked: "отозвана"
};
var PAYMENT_METHOD = {
  manual: "вручную",
  bank: "банк"
};
var PRODUCT_KIND = {
  product: "товар",
  service: "услуга"
};
function label(dictionary, value) {
  if (value === null || value === void 0 || value === "")
    return "—";
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
    lines.push("", `…и ещё ${hidden}. Уточните фильтры или запросите следующую страницу.`);
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
    throw new RangeError(`Некорректная денежная сумма: ${value}`);
  }
  const negative = trimmed.startsWith("-");
  const [rubles = "0", fraction = ""] = (negative ? trimmed.slice(1) : trimmed).split(".");
  const kopecks = BigInt(rubles) * 100n + BigInt(fraction.padEnd(2, "0"));
  return negative ? -kopecks : kopecks;
}

// apps/mcp/dist/format/money.js
var GROUP_SEPARATOR = " ";
var DASH = "—";
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
var TOO_LARGE_TEXT = "Ответ слишком большой, чтобы отдать его целиком. Уточните фильтры (период, контрагент, статус) или уменьшите limit — полные данные не помещаются в контекст.";
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
  return `…ответ сокращён на ${dropped} элемент(ов), чтобы уложиться в ${MAX_RESULT_BYTES / 1024} КБ. Уточните фильтры (период, контрагент) или запросите следующую страницу через cursor.`;
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
var CONFIRM_REQUIRED = "Операция изменяет данные. Ничего не выполнено. Повторите вызов с confirm: true, если это действительно нужно, и объясните пользователю, что изменится.";
function idempotencyKeyOf(value) {
  return value ?? randomUUID();
}
function failureText(error, config) {
  if (error instanceof PaginationError)
    return error.message;
  if (error instanceof ProtocolError)
    return error.message;
  if (error instanceof SdkError) {
    return `Ошибка MCP SDK: ${error.message}. Повторите запрос; если повторяется — сообщите администратору.`;
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
var DateOnly = z6.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, "дата в формате DD.MM.YYYY");
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
  organizationId: z6.uuid().optional().describe("Только договоры этой организации"),
  contractorId: z6.uuid().optional().describe("Только договоры этого контрагента"),
  query: z6.string().trim().min(1).optional().describe("Поиск по номеру, предмету, контрагенту"),
  status: z6.enum(["active", "closed", "archived"]).optional(),
  from: DateOnly.optional().describe("Дата договора с (DD.MM.YYYY)"),
  to: DateOnly.optional().describe("Дата договора по (DD.MM.YYYY)"),
  limit: z6.number().int().optional().describe("1–100, по умолчанию 20"),
  cursor: z6.string().optional().describe("nextCursor из предыдущего ответа")
});
var SearchOutput = z6.object({
  items: z6.array(ContractListItem),
  nextCursor: z6.string().nullable()
});
var GetInput = z6.object({
  contractId: z6.uuid().describe("Идентификатор договора (UUID)"),
  include: z6.array(z6.enum(["documents", "files"])).optional().describe("Добавить последние документы по договору и/или приложенные файлы")
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
    title: "Договоры: поиск",
    description: "Договоры кабинета: номер, дата, контрагент, предмет, сумма и статус. Нужен, чтобы привязать счёт к договору или проверить условия перед выставлением.",
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
      title: items.length === 0 ? "Договоры не найдены. Проверьте период и контрагента." : `Договоров на странице: ${items.length}`,
      headers: ["№", "Дата", "Контрагент", "Предмет", "Сумма", "Статус", "ID"],
      rows: items.map((contract) => [
        contract.number ?? "б/н",
        contract.contractDate ?? "—",
        contract.contractorShortName ?? "—",
        contract.subject ?? "—",
        formatMoneyString(contract.amount),
        label(CONTRACT_STATUS, contract.status),
        contract.id
      ]),
      footer: [
        ...nextPageHint(page) === void 0 ? [] : [nextPageHint(page) ?? ""],
        "ID из последнего столбца передайте в invoices_contracts_get — он отдаст файлы и документы."
      ]
    });
    return toolResult(markdown, { items, nextCursor: page.nextCursor });
  }));
  server.registerTool(GET_TOOL, {
    title: "Договор: карточка",
    description: 'Договор: номер, дата, предмет, сумма, статус, контрагент. include: ["files"] — приложенные файлы, ["documents"] — последние документы по договору.',
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
    `**Договор № ${contract.number ?? "б/н"}** от ${contract.contractDate ?? "—"}`,
    `Статус: ${label(CONTRACT_STATUS, contract.status)}`,
    `Контрагент: ${contract.counterparty?.shortName ?? "—"}` + (contract.counterparty?.inn === null || contract.counterparty?.inn === void 0 ? "" : ` (ИНН ${contract.counterparty.inn})`),
    contract.subject === null || contract.subject === "" ? "" : `Предмет: ${contract.subject}`,
    `Сумма: ${formatMoneyString(contract.amount)}`,
    contract.text === null || contract.text === "" ? "Текст договора не заполнен." : "Текст договора заполнен."
  ].filter((line) => line !== "");
  const blocks = [lines.join("\n")];
  if (files !== void 0) {
    blocks.push("", "**Файлы**", files.length === 0 ? "Файлов нет." : mdBullets(files.map((file) => `${file.fileName ?? "файл"}${file.sizeBytes === null ? "" : `, ${Math.round(file.sizeBytes / 1024)} КБ`}${file.downloadUrl === null ? "" : ` — ${file.downloadUrl}`}`)));
  }
  if (documents !== void 0) {
    blocks.push("", "**Последние документы**", documents.length === 0 ? "Документов по договору нет." : mdBullets(documents.map((document) => `${label(DOCUMENT_TYPE, document.type)} № ${document.number ?? "б/н"} от ${document.documentDate ?? "—"}: ${formatMoneyString(document.total)}, ${label(DOCUMENT_STATUS, document.status)}`)));
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
var MoneyString = z6.string().regex(/^\d+(\.\d{1,2})?$/, 'сумма строкой в рублях с копейками, например "300000.00"');
var CreateContractInput = z6.object({
  organizationId: z6.uuid().describe("Организация, от которой заключён договор"),
  contractorId: z6.uuid().describe("Контрагент (ID из invoices_contractors_search)"),
  number: z6.string().trim().min(1).describe("Номер договора"),
  contractDate: DateOnly.describe("Дата договора, DD.MM.YYYY"),
  subject: z6.string().optional().describe("Предмет договора"),
  amount: MoneyString.optional().describe("Сумма договора"),
  text: z6.string().optional().describe("Текст договора (в карточке показывается только hasText)"),
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
    title: "Договор: создать",
    description: "Создаёт договор. Требует confirm: true. После создания счёт можно привязать к договору через contractId в invoices_documents_create_draft.",
    inputSchema: CreateContractInput,
    outputSchema: CreateContractOutput,
    annotations: WRITE_ANNOTATIONS
  }, (args) => mutation(ctx, CREATE_CONTRACT_TOOL, args.confirm, async () => {
    const { confirm: _confirm, contractorId, ...rest } = args;
    const contract = await ctx.sdk.contracts.create({ ...rest, counterpartyId: contractorId });
    return toolResult(`Договор создан: № ${contract.number ?? "б/н"} от ${contract.contractDate ?? "—"}${contract.counterparty?.shortName === void 0 ? "" : `, ${contract.counterparty.shortName}`}
ID: ${contract.id}`, {
      id: contract.id,
      number: contract.number ?? null,
      contractorShortName: contract.counterparty?.shortName ?? null
    });
  }));
  server.registerTool(UPDATE_CONTRACT_TOOL, {
    title: "Договор: изменить",
    description: "Правит реквизиты договора (номер, дата, предмет, сумма, статус, текст). Требует confirm: true.",
    inputSchema: UpdateContractInput,
    outputSchema: UpdateContractOutput,
    annotations: WRITE_ANNOTATIONS
  }, (args) => mutation(ctx, UPDATE_CONTRACT_TOOL, args.confirm, async () => {
    const { confirm: _confirm, contractId, ...patch } = args;
    const contract = await ctx.sdk.contracts.update(contractId, patch);
    const updatedFields = Object.keys(patch).filter((key) => patch[key] !== void 0);
    return toolResult(`Договор обновлён: № ${contract.number ?? "б/н"}, статус ${label(CONTRACT_STATUS, contract.status)}
Изменены поля: ${updatedFields.length === 0 ? "—" : updatedFields.join(", ")}`, {
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
  throw new ProtocolError2(ProtocolErrorCode.InvalidParams, `В адресе ${template} нужен UUID. Возьмите его из поиска (invoices_documents_search, invoices_contractors_search, invoices_organizations_list, invoices_contracts_search). Получено: «${typeof value === "string" ? value : ""}».`);
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
        name: `Договор № ${contract.number}`,
        title: `Договор № ${contract.number}`,
        description: contract.counterparty?.shortName === void 0 ? `Договор от ${contract.contractDate}` : `Договор от ${contract.contractDate}, ${contract.counterparty.shortName}`
      }));
    }),
    complete: {
      id: completeIds(async () => toPage(await ctx.sdk.contracts.list({ limit: 5 })).items)
    }
  }), {
    title: "Договор",
    description: "Карточка договора: номер, сумма, статус, файлы и последние документы. Только чтение.",
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
    return "—";
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
  query: z7.string().trim().min(1).optional().describe("Поиск по названию, ИНН или email; пусто — первые N по алфавиту"),
  inn: z7.string().trim().min(10).optional().describe("Точный ИНН (10 или 12 цифр)"),
  kind: z7.enum(["legal", "sole_proprietor", "individual"]).optional(),
  visibility: z7.enum(["shared", "organization"]).optional().describe("shared — общие контрагенты рабочей области, organization — только этой организации"),
  organizationId: z7.uuid().optional().describe("Ограничить контрагентами одной организации"),
  status: z7.enum(["active", "archived"]).optional(),
  limit: z7.number().int().optional().describe("1–100, по умолчанию 20"),
  cursor: z7.string().optional().describe("nextCursor из предыдущего ответа")
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
  contractorId: z7.uuid().describe("Идентификатор контрагента (UUID)"),
  include: z7.array(z7.enum(["contacts", "documents", "summary"])).optional().describe("Что добавить к карточке: контакты (по умолчанию), последние документы, сводка")
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
  contractorId: z7.uuid().describe("Идентификатор контрагента (UUID)"),
  from: z7.string().regex(/^\d{2}\.\d{2}\.\d{4}$/).optional().describe("Начало периода, DD.MM.YYYY (по умолчанию — без ограничения)"),
  to: z7.string().regex(/^\d{2}\.\d{2}\.\d{4}$/).optional().describe("Конец периода, DD.MM.YYYY (влияет на сальдо и последние документы)")
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
    title: "Контрагенты: поиск",
    description: "Ищет контрагентов по названию, ИНН или email. Вызывать ПЕРЕД созданием счёта: сначала найди существующего контрагента по ИНН, и только если его нет — предложи создать. Возвращает страницу items + nextCursor.",
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
      title: items.length === 0 ? `Контрагенты не найдены${found === void 0 ? "" : ` по запросу «${found}»`}. Если его действительно нет — предложите создать нового (это изменит данные, нужно подтверждение).` : `Контрагентов: ${items.length}${found === void 0 ? "" : ` (запрос «${found}»)`}`,
      headers: ["Контрагент", "ИНН", "Вид", "Видимость", "Статус", "ID"],
      rows: items.map((contractor) => [
        contractor.shortName,
        contractor.inn,
        label(COUNTERPARTY_KIND, contractor.kind),
        label(VISIBILITY, contractor.visibility),
        label(ORG_STATUS, contractor.status),
        contractor.id
      ]),
      footer: [
        ...nextPageHint(page) === void 0 ? [] : [nextPageHint(page) ?? ""],
        "ID из последнего столбца передайте в invoices_contractors_get и invoices_contractors_summary."
      ]
    });
    return toolResult(markdown, { items, nextCursor: page.nextCursor });
  }));
  server.registerTool(GET_TOOL2, {
    title: "Контрагент: карточка",
    description: 'Карточка контрагента: реквизиты, контакты, по запросу — последние документы и сводка. include: ["documents"] добавит 5 последних документов, ["summary"] — суммы и долг.',
    inputSchema: GetInput2,
    outputSchema: GetOutput2,
    annotations: READ_ONLY_ANNOTATIONS
  }, (args) => execute(ctx, GET_TOOL2, async () => {
    const card = await loadContractorCard(ctx, args.contractorId, args.include ?? ["contacts"]);
    return toolResult(card.markdown, card.data);
  }));
  server.registerTool(SUMMARY_TOOL, {
    title: "Контрагент: карта взаимоотношений",
    description: "Сводка по контрагенту за период: сальдо и обороты, суммы по документам, долг, просрочка, последние документы и неоплаченные с просрочкой в днях. Использовать, когда спрашивают «сколько должен», «что не оплачено», «какие отношения».",
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
      `**${contractor.shortName}**, ИНН ${contractor.inn} — на ${balance.at}`,
      "",
      mdBullets([
        `Сальдо начальное: ${formatMoneyString(balance.opening)}`,
        `Оборот за период: ${formatMoneyString(balance.turnover)}`,
        `Сальдо конечное (долг): ${formatMoneyString(balance.closing)}`,
        `Документов: ${summaryView.documents.count} на ${formatMoneyString(summaryView.documents.total)}, оплачено ${formatMoneyString(summaryView.documents.paid)}, долг ${formatMoneyString(summaryView.documents.debt)}`,
        `Договоров: ${summaryView.contracts.count} на ${formatMoneyString(summaryView.contracts.amount)}`,
        summaryView.lastOperationAt === null ? "Операций не было" : `Последняя операция: ${formatIsoDate(summaryView.lastOperationAt)}`
      ]),
      "",
      "**Неоплаченные**",
      unpaid.length === 0 ? "Неоплаченных документов нет." : mdBullets(unpaid.map((item) => `${label(DOCUMENT_TYPE, item.type)} № ${item.number} от ${item.documentDate}: остаток ${formatMoneyString(item.remaining)}${item.daysOverdue > 0 ? `, просрочка ${item.daysOverdue} дн.` : ""}`)),
      "",
      "**Последние документы**",
      lastDocuments.length === 0 ? "Документов нет." : mdBullets(lastDocuments.map((document) => `${label(DOCUMENT_TYPE, document.type)} № ${document.number ?? "б/н"} от ${document.documentDate ?? "—"}: ${formatMoneyString(document.total)} (оплачено ${formatMoneyString(document.paid)})`))
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
    `ИНН ${contractor.inn}${contractor.kpp === null ? "" : `, КПП ${contractor.kpp}`}`,
    `Видимость: ${label(VISIBILITY, contractor.visibility)}; статус: ${label(ORG_STATUS, contractor.status)}`,
    contractor.legalAddress === null ? "" : `Адрес: ${contractor.legalAddress}`,
    contractor.phone === null ? "" : `Телефон: ${contractor.phone}`,
    contractor.emails.length === 0 ? "" : `Email: ${contractor.emails.join(", ")}`,
    contractor.comment === null ? "" : `Комментарий: ${contractor.comment}`
  ].filter((line) => line !== "");
  const contactLines = contacts.length === 0 ? ["Контактов нет."] : contacts.map((contact) => `- ${contact.fullName}${contact.position === null ? "" : `, ${contact.position}`}${contact.phone === null ? "" : `, ${contact.phone}`}${contact.isPrimary ? " (основной)" : ""}`);
  const blocks = [lines.join("\n"), "", "**Контакты**", contactLines.join("\n")];
  if (documents !== void 0) {
    blocks.push("", "**Последние документы**", documents.length === 0 ? "Документов нет." : mdBullets(documents.map((document) => `${label(DOCUMENT_TYPE, document.type)} № ${document.number ?? "б/н"} от ${document.documentDate ?? "—"}: ${formatMoneyString(document.total)}, ${label(DOCUMENT_STATUS, document.status)}`)));
  }
  if (summary !== void 0) {
    blocks.push("", "**Сводка**", mdBullets([
      `Документов: ${summary.documentsCount} на ${formatMoneyString(summary.total)}`,
      `Оплачено: ${formatMoneyString(summary.paid)}, долг: ${formatMoneyString(summary.debt)}`,
      `Договоров: ${summary.contractsCount} на ${formatMoneyString(summary.contractsAmount)}`
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
  kind: z7.enum(["legal", "sole_proprietor", "individual"]).describe("Вид контрагента"),
  visibility: z7.enum(["shared", "organization"]).optional().describe("shared — общий для рабочей области (по умолчанию), organization — только для организации"),
  organizationId: z7.uuid().optional().describe("Обязателен при visibility = organization"),
  shortName: z7.string().trim().min(1).describe("Краткое название, как в документах"),
  fullName: z7.string().trim().min(1).describe("Полное наименование"),
  inn: z7.string().trim().min(10).describe("ИНН: 10 цифр у юрлица, 12 у ИП и физлица"),
  kpp: z7.string().optional().describe("КПП — только для юрлица"),
  ogrn: z7.string().optional(),
  ogrnip: z7.string().optional(),
  legalAddress: z7.string().optional(),
  actualAddress: z7.string().optional(),
  phone: z7.string().optional(),
  emails: z7.array(z7.email()).optional(),
  comment: z7.string().optional(),
  contacts: z7.array(ContactInput).optional(),
  confirm: z7.boolean().optional().describe("Обязательно true — создание меняет данные")
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
    title: "Контрагент: создать",
    description: "Создаёт контрагента. СНАЧАЛА вызовите invoices_contractors_search по ИНН — дубли мешают истории. Требует confirm: true и явного согласия пользователя. API возвращает warnings (похожие контрагенты) — покажите их пользователю.",
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
      `Контрагент создан: **${result.counterparty.shortName}**, ИНН ${result.counterparty.inn}`,
      `ID: ${result.counterparty.id}`,
      ...warnings.length === 0 ? [] : ["", "**Обратите внимание**", mdBullets(warnings.map((warning) => warning.message))],
      "",
      "Дальше: черновик счёта создаётся через invoices_documents_create_draft."
    ].join("\n");
    return toolResult(markdown, {
      id: result.counterparty.id,
      shortName: result.counterparty.shortName,
      inn: result.counterparty.inn,
      warnings
    });
  }));
  server.registerTool(UPDATE_TOOL, {
    title: "Контрагент: изменить",
    description: "Правит реквизиты контрагента. `inn` и `kind` изменить нельзя (создайте нового и архивируйте старого). Требует confirm: true.",
    inputSchema: UpdateInput,
    outputSchema: UpdateOutput,
    annotations: WRITE_ANNOTATIONS
  }, (args) => mutation(ctx, UPDATE_TOOL, args.confirm, async () => {
    const { confirm: _confirm, contractorId, ...patch } = args;
    const updated = await ctx.sdk.counterparties.updateCounterparty(contractorId, patch);
    const updatedFields = Object.keys(patch).filter((key) => patch[key] !== void 0);
    return toolResult([
      `Контрагент обновлён: **${updated.shortName}**`,
      `Изменены поля: ${updatedFields.length === 0 ? "—" : updatedFields.join(", ")}`
    ].join("\n"), { id: updated.id, shortName: updated.shortName, updatedFields });
  }));
  server.registerTool(ARCHIVE_TOOL, {
    title: "Контрагент: архивировать",
    description: "Переносит контрагента в архив. Данные и документы сохраняются, но выбрать его в новых документах нельзя. Требует confirm: true — операция меняет справочник.",
    inputSchema: ArchiveInput,
    outputSchema: ArchiveOutput,
    annotations: DESTRUCTIVE_ANNOTATIONS
  }, (args) => mutation(ctx, ARCHIVE_TOOL, args.confirm, async () => {
    await ctx.sdk.counterparties.archiveCounterparty(args.contractorId);
    return toolResult(`Контрагент ${args.contractorId} перенесён в архив. Вернуть его можно в кабинете.`, { id: args.contractorId, status: "archived" });
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
        description: `Контрагент, ИНН ${contractor.inn}`
      }));
    }),
    complete: {
      id: completeIds(async () => toPage(await ctx.sdk.counterparties.list({ limit: 5 })).items)
    }
  }), {
    title: "Контрагент",
    description: "Карточка контрагента: реквизиты, контакты, суммы и долг, последние документы. Только чтение.",
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
var DateOnly2 = z8.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, "дата в формате DD.MM.YYYY");
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
  type: z8.enum(DOCUMENT_TYPES).optional().describe("Тип: счёт, акт, счёт-фактура, УПД, договор"),
  status: z8.array(z8.enum(DOCUMENT_STATUSES)).optional().describe('Фильтр по статусам (любой из); без фильтра — все, включая черновики (status:"draft")'),
  organizationId: z8.uuid().optional().describe("Только документы этой организации"),
  contractorId: z8.uuid().optional().describe("Только документы этого контрагента (ID из invoices_contractors_search)"),
  contractId: z8.uuid().optional().describe("Только документы этого договора"),
  number: z8.string().trim().min(1).optional().describe('Номер документа. У черновиков номера нет — ищите их по contractorId, status:["draft"] или query'),
  query: z8.string().trim().min(1).optional().describe("Поиск по номеру, контрагенту, назначению"),
  from: DateOnly2.optional().describe("Документы с даты (DD.MM.YYYY)"),
  to: DateOnly2.optional().describe("Документы по дату (DD.MM.YYYY)"),
  overdueOnly: z8.boolean().optional().describe("Только просроченные"),
  sort: z8.enum(["createdAt_desc", "documentDate_desc", "documentDate_asc"]).optional().describe("Сортировка; по умолчанию — createdAt_desc"),
  limit: z8.number().int().optional().describe("1–100, по умолчанию 20"),
  cursor: z8.string().optional().describe("nextCursor из предыдущего ответа")
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
  documentId: z8.uuid().describe("Идентификатор документа (UUID)"),
  revision: z8.number().int().min(0).optional().describe("Версия выданного документа; по умолчанию — текущая")
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
  documentId: z8.uuid().describe("Идентификатор документа (UUID)")
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
  documentId: z8.uuid().describe("Идентификатор документа (UUID)"),
  revision: z8.number().int().min(0).optional().describe("Версия документа"),
  seal: z8.boolean().optional().describe("С печатью организации (по умолчанию как в документе)"),
  sign: z8.boolean().optional().describe("С подписью (по умолчанию как в документе)"),
  watermark: z8.enum(["draft", "paid", "sample", "corrected"]).optional().describe("Водяной знак: черновик, оплачен, образец, исправленный")
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
    title: "Документы: поиск",
    description: 'Поиск счетов, актов, счетов-фактур, УПД и договоров по типу, статусу, контрагенту, договору, номеру, периоду и тексту. Возвращает страницу с суммами и nextCursor. Это основной способ найти документ перед вызовом invoices_documents_get. Черновики в выдаче есть (без status — все статусы), но по НОМЕРУ их не найти: номер появляется только после выдачи. Черновик ищите по contractorId + status:["draft"] или по query (название контрагента).',
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
      title: items.length === 0 ? "Документы не найдены. Проверьте период, тип и контрагента." : `Документов на странице: ${items.length}`,
      headers: ["№", "Дата", "Контрагент", "Сумма", "Оплачено", "Статус", "ID"],
      rows: items.map((document) => [
        document.number ?? "б/н",
        document.documentDate ?? "—",
        document.counterpartyShortName ?? "—",
        formatMoneyString(document.total),
        formatMoneyString(document.paid),
        label(DOCUMENT_STATUS, document.status),
        document.id
      ]),
      footer: [
        `Итого по странице: ${formatMoneyString(pageTotals.total)}, оплачено ${formatMoneyString(pageTotals.paid)}, остаток ${formatMoneyString(pageTotals.remaining)}`,
        ...nextPageHint(page) === void 0 ? [] : [nextPageHint(page) ?? ""],
        "ID из последнего столбца передайте в invoices_documents_get — он отдаст позиции, суммы и НДС, оплаты и PDF-ссылку."
      ]
    });
    return toolResult(markdown, { items, nextCursor: page.nextCursor, pageTotals });
  }));
  server.registerTool(GET_TOOL3, {
    title: "Документ: карточка",
    description: "Полная карточка документа: статус, суммы и НДС, позиции, оплаты, предупреждения. Параметр revision отдаёт сохранённую версию выданного документа. Выданный документ неизменяем — правки только новой версией через кабинет.",
    inputSchema: GetInput3,
    outputSchema: GetOutput3,
    annotations: READ_ONLY_ANNOTATIONS
  }, (args) => execute(ctx, GET_TOOL3, async () => {
    const card = await loadDocumentCard(ctx, args.documentId, args.revision);
    return toolResult(card.markdown, card.data);
  }));
  server.registerTool(PAYMENTS_TOOL, {
    title: "Документ: оплаты и остаток",
    description: "Оплаты по документу: сколько выставлено, сколько оплачено, остаток и переплата, список платежей с датой и способом. Для вопроса «оплачен ли счёт» используйте этот инструмент.",
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
      `Оплаты по документу: ${label(DOCUMENT_STATUS, result.status)}`,
      "",
      mdBullets([
        `Выставлено: ${formatMoneyString(result.total)}`,
        `Оплачено: ${formatMoneyString(result.paid)}`,
        `Остаток: ${formatMoneyString(result.remaining)}`,
        ...result.overpaid === null || result.overpaid === "0.00" ? [] : [`Переплата: ${formatMoneyString(result.overpaid)}`]
      ]),
      "",
      "**Платежи**",
      payments.length === 0 ? "Платежей нет." : mdBullets(payments.map((payment) => `${payment.paidAt ?? "—"}: ${formatMoneyString(payment.amount)}${payment.method === "bank" ? " (банк)" : " (вручную)"}${payment.comment === null ? "" : ` — ${payment.comment}`}`))
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
    title: "Документ: ссылка на PDF",
    description: "Короткоживущая ссылка на PDF документа (с печатью и подписью по запросу). PDF не возвращается содержимым — только URL: отдайте его пользователю, ссылка работает без токена ограниченное время.",
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
    `${label(DOCUMENT_TYPE, current.type)} № ${current.number ?? "б/н"} от ${current.documentDate ?? "—"}`,
    `Статус: ${label(DOCUMENT_STATUS, current.status)}` + (current.currentRevision === 0 ? "" : `, текущая версия ${current.currentRevision}`),
    `Контрагент: ${counterparty.shortName} (ИНН ${counterparty.inn ?? "—"})`,
    current.contractId === null ? "" : `Договор: ${current.contractId}`,
    `Сумма: ${formatMoneyString(grandTotal)}` + (vatTotal === null ? "" : `, в т.ч. НДС ${formatMoneyString(vatTotal)}`),
    `Оплачено: ${formatMoneyString(current.payments.paid)}, остаток ${formatMoneyString(current.payments.remaining)}`,
    current.issuedAt === null ? "" : `Выдан: ${formatIsoDate(current.issuedAt)}`,
    current.cancelledAt === null ? "" : `Аннулирован: ${formatIsoDate(current.cancelledAt)}` + (current.cancelReason === null ? "" : ` (${current.cancelReason})`),
    version === void 0 ? "" : `Показана версия ${version.revision} от ${formatIsoDate(version.createdAt)}` + (version.changeReason === "" ? "" : ` — ${version.changeReason}`)
  ].filter((line) => line !== "");
  const positionRows = items.slice(0, 10).map((item) => [
    String(item.lineNo),
    `${item.name}${item.unit === null ? "" : `, ${item.unit}`}`,
    `${item.qty ?? "—"} × ${formatMoneyString(item.price)}`,
    formatMoneyString(item.lineTotal),
    item.vatRate === null ? "—" : `${item.vatRate} %`
  ]);
  const blocks = [marks.join("\n")];
  if (positionRows.length > 0) {
    blocks.push("", `Позиции (${items.length}):`, "", summaryTable({
      title: "",
      headers: ["№", "Позиция", "Кол-во × цена", "Сумма", "НДС"],
      rows: positionRows
    }).replace(/^\n+/, "").replace(/^\n+/, ""));
    if (items.length > 10) {
      blocks.push("", `…и ещё ${items.length - 10}. Полный список — в structuredContent.`);
    }
  }
  if (current.warnings.length > 0) {
    blocks.push("", "**Предупреждения**", mdBullets(current.warnings.map((warning) => warning.message)));
  }
  blocks.push("", "PDF: ссылку отдаёт invoices_documents_pdf_link (живёт ограниченное время).");
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
    `Ссылка на PDF: ${link.url}`,
    "",
    `Действует до ${formatIsoDate(link.expiresAt)} (${link.expiresAt}).`,
    "Ссылка публичная: кто её получил, тот может открыть PDF. Не пересылайте её в недоверенные каналы."
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
var MoneyString2 = z8.string().regex(/^\d+(\.\d{1,2})?$/, 'сумма строкой в рублях с копейками, например "124000.00"');
var QtyString = z8.string().regex(/^\d+(\.\d{1,3})?$/, "количество строкой, до трёх знаков после точки");
var VatRate = z8.union([
  z8.literal(0),
  z8.literal(5),
  z8.literal(7),
  z8.literal(10),
  z8.literal(20),
  z8.literal(22)
]);
var ItemInput = z8.object({
  productId: z8.uuid().optional().describe("ID позиции номенклатуры, если цена берётся из справочника"),
  name: z8.string().trim().min(1).describe("Наименование в документе"),
  unit: z8.string().trim().min(1).describe("Единица: шт, усл, мес, ч …"),
  qty: QtyString,
  price: MoneyString2.describe("Цена за единицу в рублях"),
  discount: z8.object({ kind: z8.enum(["percent", "amount"]), value: z8.string() }).optional().describe("Скидка: percent — проценты, amount — сумма в рублях"),
  vatRate: VatRate.optional().describe("Ставка НДС: 0, 5, 7, 10, 20 или 22"),
  note: z8.string().optional()
});
var TotalsOutput = z8.object({
  subtotal: nullableString,
  discountTotal: nullableString,
  vatTotal: nullableString,
  grandTotal: nullableString
});
var CreateDraftInput = z8.object({
  type: z8.enum(["invoice", "act", "invoice_facture"]).describe("Тип черновика"),
  organizationId: z8.uuid().describe("Организация, от которой выставляется документ"),
  contractorId: z8.uuid().describe("Контрагент (ID из invoices_contractors_search)"),
  documentDate: DateOnly2.describe("Дата документа, DD.MM.YYYY"),
  contractId: z8.uuid().optional().describe("Договор, к которому относится документ"),
  basis: z8.string().optional().describe("Основание"),
  period: z8.object({ from: DateOnly2, to: DateOnly2, label: z8.string().optional() }).optional().describe("Период оказания услуг (для акта)"),
  note: z8.string().optional(),
  items: z8.array(ItemInput).min(1).describe("Позиции документа; цена и количество строками"),
  idempotencyKey: z8.string().regex(/^[A-Za-z0-9_-]{8,128}$/).optional().describe("Ключ идемпотентности: при повторе передайте тот же, чтобы не создать дубль"),
  confirm: z8.boolean().optional().describe("Обязательно true")
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
  items: z8.array(ItemInput).min(1).describe("Полная замена позиций: список заменит текущий целиком"),
  confirm: z8.boolean().optional()
});
var UpdateItemsOutput = z8.object({
  id: z8.string(),
  status: z8.string(),
  totals: TotalsOutput
});
var IssueInput = z8.object({
  documentId: z8.uuid(),
  number: z8.string().optional().describe("Свой номер; без него — из сервиса нумерации"),
  documentDate: DateOnly2.optional().describe("Дата документа; без неё — текущая"),
  withSeal: z8.boolean().optional().describe("Печать организации (если загружена)"),
  withSignature: z8.boolean().optional().describe("Подпись (если загружена)"),
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
  reason: z8.string().trim().min(3).describe("Причина аннулирования — обязательна и попадает в документ"),
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
  invoiceId: z8.uuid().describe("Счёт, по которому закрывается акт"),
  mode: z8.enum(["full", "partial"]).describe("full — весь счёт, partial — по позициям"),
  allocations: z8.array(z8.object({ itemId: z8.uuid(), qty: QtyString })).optional().describe("Обязательно для mode = partial: какие позиции и сколько закрыть"),
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
  type: z8.enum(["invoice", "act"]).describe("Тип создаваемого черновика"),
  organizationId: z8.uuid(),
  contractorId: z8.uuid().optional().describe("Контрагент; можно не указывать, если он есть в файле"),
  documentDate: DateOnly2,
  text: z8.string().min(1).optional().describe("Позиции текстом: TSV/CSV. Либо text, либо items — не оба"),
  items: z8.array(z8.record(z8.string(), z8.unknown())).optional().describe("Готовые позиции массивом объектов (поля как в items обычного создания)"),
  settings: z8.object({
    delimiter: z8.enum(["auto", ",", ";", "|", "	"]).optional().describe('Разделитель; для табуляции — "\\t"'),
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
    title: "Документ: создать черновик",
    description: 'Создаёт черновик счёта/акта/счёта-фактуры. НЕ выдаёт его: номер и PDF появятся только после invoices_documents_issue. Верните пользователю id из ответа: по нему работают invoices_documents_get, update_items и issue, а поиск по номеру черновик не найдёт. Цены и количество — строками ("124000.00"), не числами. Требует confirm: true.',
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
      `Черновик создан: ${label(DOCUMENT_TYPE, created.type)} от ${created.documentDate ?? "—"}`,
      `ID: ${created.id}`,
      "",
      mdBullets([
        `Сумма: ${formatMoneyString(totals.grandTotal)}`,
        `НДС: ${formatMoneyString(totals.vatTotal)}`,
        `Позиций: ${created.totals.itemsCount}`
      ]),
      ...warnings.length === 0 ? [] : ["", "**Обратите внимание**", mdBullets(warnings.map((warning) => warning.message))],
      "",
      "Дальше: проверить позиции (invoices_documents_get / update_items) и выдать с invoices_documents_issue (потребуется confirm: true)."
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
    title: "Документ: заменить позиции",
    description: "Полностью заменяет позиции ЧЕРНОВИКА. У выданного документа правки запрещены (нужна ревизия в кабинете). Требует confirm: true.",
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
      `Позиции заменены: ${label(DOCUMENT_TYPE, updated.type)} от ${updated.documentDate ?? "—"}`,
      "",
      mdBullets([
        `Сумма: ${formatMoneyString(totals.grandTotal)}`,
        `НДС: ${formatMoneyString(totals.vatTotal)}`,
        `Позиций: ${updated.totals.itemsCount}`
      ])
    ].join("\n"), { id: updated.id, status: updated.status, totals });
  }));
  server.registerTool(ISSUE_TOOL, {
    title: "Документ: выдать",
    description: "Выдаёт черновик: фиксирует номер, версию и PDF. Документ после этого неизменяем (правки — только ревизией в кабинете). НЕОБРАТИМО, требует confirm: true и согласия пользователя.",
    inputSchema: IssueInput,
    outputSchema: IssueOutput,
    annotations: DESTRUCTIVE_ANNOTATIONS
  }, (args) => mutation(ctx, ISSUE_TOOL, args.confirm, async () => {
    const { confirm: _confirm, documentId, idempotencyKey, ...body } = args;
    const issued = await ctx.sdk.documents.issue(documentId, body, {
      idempotencyKey: idempotencyKeyOf(idempotencyKey)
    });
    const markdown = [
      `Документ выдан: № **${issued.number ?? "б/н"}** от ${issued.documentDate ?? "—"}`,
      "",
      mdBullets([
        `Сумма: ${formatMoneyString(issued.totals.grandTotal)}`,
        `Версия: ${issued.currentRevision}`,
        `ID: ${issued.id}`
      ]),
      "",
      "Ссылку на PDF даёт invoices_documents_pdf_link. Аннулирование — invoices_documents_cancel (тоже с confirm)."
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
    title: "Документ: аннулировать",
    description: "Аннулирует выданный документ с причиной. Необратимо: документ остаётся в архиве с отметкой. Требует confirm: true и обязательной причины.",
    inputSchema: CancelInput,
    outputSchema: CancelOutput,
    annotations: DESTRUCTIVE_ANNOTATIONS
  }, (args) => mutation(ctx, CANCEL_TOOL, args.confirm, async () => {
    const { confirm: _confirm, documentId, reason } = args;
    const cancelled = await ctx.sdk.documents.cancel(documentId, { reason });
    return toolResult([
      `Документ № ${cancelled.number ?? "б/н"} аннулирован.`,
      `Причина: ${cancelled.cancelReason ?? reason}`,
      `Аннулирован: ${formatIsoDate(cancelled.cancelledAt)}`
    ].join("\n"), {
      id: cancelled.id,
      status: cancelled.status,
      cancelledAt: cancelled.cancelledAt ?? null,
      cancelReason: cancelled.cancelReason ?? reason
    });
  }));
  server.registerTool(DELETE_DRAFT_TOOL, {
    title: "Документ: удалить черновик",
    description: "Удаляет черновик. Выданный документ удалить нельзя — только аннулировать (invoices_documents_cancel). Требует confirm: true.",
    inputSchema: DeleteDraftInput,
    outputSchema: DeleteDraftOutput,
    annotations: DESTRUCTIVE_ANNOTATIONS
  }, (args) => mutation(ctx, DELETE_DRAFT_TOOL, args.confirm, async () => {
    await ctx.sdk.documents.delete(args.documentId);
    return toolResult(`Черновик ${args.documentId} удалён.`, {
      id: args.documentId,
      deleted: true
    });
  }));
  server.registerTool(CREATE_ACT_TOOL, {
    title: "Документ: акт по счёту",
    description: "Создаёт ЧЕРНОВИК акта по счёту: mode = full закрывает счёт целиком, partial — только указанные позиции и количества (allocations). Требует confirm: true. Выдача акта — отдельно через invoices_documents_issue.",
    inputSchema: CreateActInput,
    outputSchema: CreateActOutput,
    annotations: WRITE_ANNOTATIONS
  }, (args) => mutation(ctx, CREATE_ACT_TOOL, args.confirm, async () => {
    if (args.mode === "partial" && (args.allocations === void 0 || args.allocations.length === 0)) {
      throw new PaginationError("Для mode = partial нужен allocations: список позиций {itemId, qty} из счёта. Состав позиций счёта отдаёт invoices_documents_get.");
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
      `Черновик акта создан по счёту: ${act.id}`,
      "",
      mdBullets([
        `Сумма: ${formatMoneyString(totals.grandTotal)}`,
        `Позиций: ${act.totals.itemsCount}`,
        `Счёт-родитель: ${act.parentDocumentId ?? invoiceId}`
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
    title: "Документ: импорт позиций",
    description: "Создаёт ЧЕРНОВИК из списка позиций: текст (TSV/CSV) или готовый JSON-массив. Файлы не передаются. Возвращает importReport: сколько строк разобрано, что не удалось и почему. Требует confirm: true.",
    inputSchema: ImportInput,
    outputSchema: ImportOutput,
    annotations: WRITE_ANNOTATIONS
  }, (args) => mutation(ctx, IMPORT_TOOL, args.confirm, async () => {
    if (args.text === void 0 === (args.items === void 0)) {
      throw new PaginationError("Нужно ровно одно из двух: text (позиции строками TSV/CSV) или items (массив объектов). Оба сразу или ни одного — ошибка.");
    }
    const { confirm: _confirm, contractorId, idempotencyKey, ...rest } = args;
    const result = await ctx.sdk.imports.importDocument({
      ...rest,
      ...contractorId === void 0 ? {} : { counterpartyId: contractorId }
    }, { idempotencyKey: idempotencyKeyOf(idempotencyKey) });
    const report = result.importReport;
    return toolResult([
      `Импорт выполнен: создан черновик ${result.id}`,
      "",
      mdBullets([
        `Строк в источнике: ${report.rowsTotal}`,
        `Импортировано: ${report.imported}`,
        `Пропущено: ${report.skipped}`,
        `С ошибками: ${report.failed}`
      ]),
      ...report.errors.length === 0 ? [] : [
        "",
        "**Ошибки строк**",
        mdBullets(report.errors.slice(0, 10).map((error) => `строка ${error.row ?? "—"}${error.column === null ? "" : `, колонка ${error.column}`}: ${error.message}`)),
        ...report.errors.length > 10 ? [`…и ещё ${report.errors.length - 10}.`] : []
      ],
      "",
      "Проверьте позиции через invoices_documents_get перед выдачей."
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
    list: () => listTemplateItems(ctx, INVOICE, () => listDocuments(ctx, "invoice", "Счёт")),
    complete: {
      id: completeIds(async () => toPage(await ctx.sdk.documents.list({ type: "invoice", limit: 5 })).items)
    }
  }), {
    title: "Счёт",
    description: "Карточка счёта: шапка, позиции, итоги, статус, оплаты. Только чтение; выданный счёт неизменяем.",
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
      const items = await listDocuments(ctx, "invoice", "Счёт");
      return items.map((item) => ({
        ...item,
        uri: `${item.uri}/pdf`,
        name: `${item.name} — PDF`
      }));
    }),
    complete: {
      id: completeIds(async () => toPage(await ctx.sdk.documents.list({ type: "invoice", limit: 5 })).items)
    }
  }), {
    title: "PDF счёта",
    description: "Ссылка на PDF счёта с ограниченным сроком жизни (не бинарник). Только чтение.",
    mimeType: "text/markdown"
  }, (uri, variables) => readResource(ctx, INVOICE_PDF, async () => {
    const id = requireId(variables, INVOICE_PDF_TEMPLATE);
    const link = await createDocumentPdfLink(ctx, id, {});
    return resourceResult(uri, [`PDF документа ${id}`, "", link.markdown].join("\n"), {
      documentId: id,
      ...link.data
    });
  }));
  server.registerResource(ACT, new ResourceTemplate3(ACT_TEMPLATE, {
    list: () => listTemplateItems(ctx, ACT, () => listDocuments(ctx, "act", "Акт")),
    complete: {
      id: completeIds(async () => toPage(await ctx.sdk.documents.list({ type: "act", limit: 5 })).items)
    }
  }), {
    title: "Акт",
    description: "Карточка акта: позиции, суммы, счёт-основание. Только чтение.",
    mimeType: "text/markdown"
  }, (uri, variables) => readResource(ctx, ACT, async () => {
    const id = requireId(variables, ACT_TEMPLATE);
    const card = await loadDocumentCard(ctx, id);
    if (card.data.type !== "act") {
      throw wrongType(card.data.type, id, "act");
    }
    const parent = card.parentDocumentId;
    const markdown = [
      parent === null ? "Счёт-основание не указан." : `Счёт-основание: invoice://${parent}`,
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
    name: `${prefix} № ${document.number ?? "б/н"}`,
    title: `${prefix} № ${document.number ?? "б/н"} от ${document.documentDate}`,
    description: `Документ от ${document.documentDate}, ${document.counterpartyShortName}`
  }));
}
function wrongType(actual, id, expected) {
  const actualLabel = label(DOCUMENT_TYPE, actual);
  const hint = actual === "act" ? `Акт читайте по act://${id}.` : actual === "invoice" ? `Счёт читайте по invoice://${id}.` : "Карточку любого документа отдаёт invoices_documents_get.";
  return new ProtocolError3(ProtocolErrorCode2.InvalidParams, `${expected === "invoice" ? "invoice://{id}" : "act://{id}"} читает только ${expected === "invoice" ? "счета" : "акты"}, а этот документ — ${actualLabel}. ${hint}`);
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
  status: z9.enum(["active", "archived"]).optional().describe("Только активные или только архивные организации"),
  q: z9.string().trim().min(1).optional().describe("Поиск по названию или ИНН"),
  limit: z9.number().int().optional().describe("Сколько вернуть: 1–100, по умолчанию 20; больше 100 — ошибка с подсказкой про cursor"),
  cursor: z9.string().optional().describe("nextCursor из предыдущего ответа")
});
var ListOutput = z9.object({
  items: z9.array(OrganizationListItem),
  nextCursor: z9.string().nullable()
});
var GetInput4 = z9.object({
  organizationId: z9.uuid().describe("Идентификатор организации (UUID)")
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
    title: "Организации: список",
    description: "Список организаций кабинета (кратко: название, ИНН, режим НО, НДС, статус). Нужен в самом начале, чтобы понять, от какой организации выставлять документы. Возвращает страницу items + nextCursor.",
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
      title: `Организаций: ${items.length}${args.q === void 0 ? "" : ` (поиск «${args.q}»)`}`,
      headers: ["Организация", "ИНН", "Режим НО", "НДС", "Статус"],
      rows: items.map((organization) => [
        organization.shortName,
        organization.inn,
        label(TAX_REGIME, organization.taxRegime),
        label(VAT_STATUS, organization.vatStatus),
        label(ORG_STATUS, organization.status)
      ]),
      footer: [
        ...nextPageHint(page) === void 0 ? [] : [nextPageHint(page) ?? ""],
        "Карточку с реквизитами и банковскими счетами отдаёт invoices_organizations_get."
      ]
    });
    return toolResult(markdown, { items, nextCursor: page.nextCursor });
  }));
  server.registerTool(GET_TOOL4, {
    title: "Организация: карточка",
    description: "Реквизиты организации: ИНН/КПП/ОГРН, адреса, режим НО и НДС, банковские счета, подписанты по умолчанию. Нужна перед выставлением счёта и для проверки реквизитов в PDF.",
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
    `ИНН ${organization.inn}${organization.kpp === null ? "" : `, КПП ${organization.kpp}`}`,
    organization.ogrn === null ? "" : `ОГРН ${organization.ogrn}`,
    organization.ogrnip === null ? "" : `ОГРНИП ${organization.ogrnip}`,
    `Режим НО: ${label(TAX_REGIME, organization.taxRegime)}` + (organization.additionalRegime === null ? "" : ` + ${label(TAX_REGIME, organization.additionalRegime)}`),
    `НДС: ${label(VAT_STATUS, organization.vatStatus)}` + (organization.vatRateDefault === null ? "" : `, ставка по умолчанию ${organization.vatRateDefault} %`),
    organization.legalAddress === null ? "" : `Юридический адрес: ${organization.legalAddress}`,
    organization.phone === null ? "" : `Телефон: ${organization.phone}`,
    organization.email === null ? "" : `Email: ${organization.email}`
  ].filter((line) => line !== "");
  const accounts = bankAccounts.length === 0 ? ["Банковских счетов нет — счёт нельзя выдать, пока не добавлен счёт организации."] : bankAccounts.map((account) => `- ${account.bankName}, БИК ${account.bik}, счёт ${account.account}${account.isDefault ? " (основной)" : ""}`);
  const signers = signatories.length === 0 ? ["Подписантов нет."] : signatories.map((signatory) => `- ${signatory.fullName}${signatory.position === null ? "" : `, ${signatory.position}`}${signatory.isDefault ? " (основной)" : ""}`);
  const markdown = [
    requisites.join("\n"),
    "",
    "**Банковские счета**",
    accounts.join("\n"),
    "",
    "**Подписанты**",
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
        description: `Организация, ИНН ${organization.inn}`
      }));
    }),
    complete: {
      id: completeIds(async () => toPage(await ctx.sdk.organizations.list({ limit: 5 })).items)
    }
  }), {
    title: "Организация",
    description: "Карточка организации: реквизиты, режим НО и НДС, банковские счета, подписанты. Только чтение.",
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
var DateOnly3 = z10.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, "дата в формате DD.MM.YYYY");
var MoneyString3 = z10.string().regex(/^\d+(\.\d{1,2})?$/, 'сумма строкой в рублях с копейками, например "50000.00"');
var CreateInput2 = z10.object({
  amount: MoneyString3.describe("Сумма платежа в рублях"),
  paidAt: DateOnly3.describe("Дата платежа, DD.MM.YYYY"),
  documentId: z10.uuid().optional().describe("Документ, к которому относится оплата"),
  organizationId: z10.uuid().optional().describe("Организация; можно не указывать при documentId"),
  contractorId: z10.uuid().optional().describe("Контрагент; можно не указывать при documentId"),
  method: z10.enum(["manual", "bank"]).optional().describe("manual — вручную (по умолчанию), bank — банк"),
  bankTxId: z10.string().optional().describe("Идентификатор банковской транзакции (для method = bank)"),
  comment: z10.string().optional(),
  idempotencyKey: z10.string().regex(/^[A-Za-z0-9_-]{8,128}$/).optional().describe("Ключ идемпотентности: при повторе передайте тот же, чтобы не задвоить оплату"),
  confirm: z10.boolean().optional().describe("Обязательно true")
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
  contractorId: z10.uuid().optional().describe("Платежи этого контрагента"),
  documentId: z10.uuid().optional().describe("Платежи по документу"),
  from: DateOnly3.optional(),
  to: DateOnly3.optional(),
  limit: z10.number().int().optional().describe("1–100, по умолчанию 20"),
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
    title: "Оплата: отметить",
    description: "Отмечает поступление оплаты (вручную или банковскую). Сумма — строкой. Требует confirm: true: платежи влияют на долг и отчёты. При повторе передайте тот же idempotencyKey, чтобы не задвоить оплату.",
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
      `Оплата отмечена: ${formatMoneyString(payment.amount)} от ${payment.paidAt ?? "—"}`,
      `Способ: ${label(PAYMENT_METHOD, payment.method)}`,
      ...document === null ? [] : [
        "",
        mdBullets([
          `Документ № ${document.number ?? "б/н"}: ${label(DOCUMENT_STATUS, document.status)}`,
          `Оплачено: ${formatMoneyString(document.paid)}, остаток ${formatMoneyString(document.remaining)}`,
          ...document.overpaid === null || document.overpaid === "0.00" ? [] : [`Переплата: ${formatMoneyString(document.overpaid)}`]
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
    title: "Оплаты: список",
    description: "Поступления за период или по документу/контрагенту: дата, сумма, способ, документ. Для «какие оплаты были в октябре» и сверки выписки.",
    inputSchema: ListInput2,
    outputSchema: ListOutput2,
    annotations: {
      readOnlyHint: true,
      destructiveHint: false,
      idempotentHint: true,
      openWorldHint: false
    }
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
      title: items.length === 0 ? "Оплат за период нет." : `Оплат на странице: ${items.length}`,
      headers: ["Дата", "Сумма", "Способ", "Документ", "Комментарий"],
      rows: items.map((payment) => [
        payment.paidAt ?? "—",
        formatMoneyString(payment.amount),
        label(PAYMENT_METHOD, payment.method),
        payment.documentNumber ?? "—",
        payment.comment ?? "—"
      ]),
      footer: [
        `Итого по странице: ${formatMoneyString(totalRubles)}`,
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
var MoneyString4 = z11.string().regex(/^\d+(\.\d{1,2})?$/, 'сумма строкой в рублях с копейками, например "16500.00"');
var VatRate2 = z11.union([z11.literal(0), z11.literal(5), z11.literal(7), z11.literal(10), z11.literal(20), z11.literal(22)]).nullable();
var CreateInput3 = z11.object({
  name: z11.string().trim().min(1).describe("Наименование позиции"),
  kind: z11.enum(["service", "product"]).describe("Услуга или товар"),
  unit: z11.string().trim().min(1).optional().describe("Код единицы из справочника: «шт», «ч», «мес» … (в API — unitCode)"),
  price: MoneyString4.optional().describe('Цена за единицу строкой, "16500.00"; нет цены — не передавайте'),
  vatRate: VatRate2.optional().describe("Ставка НДС: 0, 5, 7, 10, 20, 22 или null (без НДС); неизвестна — не передавайте"),
  sku: z11.string().trim().min(1).optional().describe("Артикул"),
  description: z11.string().trim().min(1).optional().describe("Описание позиции"),
  confirm: z11.boolean().optional().describe("Обязательно true: создаёт запись")
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
  query: z11.string().trim().min(1).optional().describe("Поиск по названию или артикулу"),
  kind: z11.enum(["service", "product"]).optional().describe("Услуга или товар"),
  includeInactive: z11.boolean().optional().describe("Показать и архивные позиции (по умолчанию только активные)"),
  limit: z11.number().int().optional().describe("1–100, по умолчанию 20"),
  cursor: z11.string().optional().describe("nextCursor из предыдущего ответа")
});
var ListOutput3 = z11.object({
  items: z11.array(ProductListItem),
  nextCursor: z11.string().nullable()
});
function registerProductTools(server, ctx) {
  server.registerTool(LIST_TOOL3, {
    title: "Номенклатура: список",
    description: "Позиции номенклатуры: услуги и товары с ценой, единицей и ставкой НДС. Нужен, чтобы подобрать цену существующей позиции вместо выдуманной и не создавать дубликат.",
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
      title: items.length === 0 ? `Позиции не найдены${args.query === void 0 ? "" : ` по запросу «${args.query}»`}.` : `Позиций: ${items.length}${args.query === void 0 ? "" : ` (запрос «${args.query}»)`}`,
      headers: ["Название", "Вид", "Ед.", "Цена", "НДС", "Активна"],
      rows: items.map((product) => [
        product.name,
        label(PRODUCT_KIND, product.kind),
        product.unit ?? "—",
        product.price === null ? "—" : formatMoneyString(product.price),
        product.vatRate === null ? "—" : `${product.vatRate} %`,
        product.isActive ? "да" : "в архиве"
      ]),
      footer: [
        ...nextPageHint(page) === void 0 ? [] : [nextPageHint(page) ?? ""],
        "Цену и НДС в счёте берите из этой позиции, если она есть; иначе спросите пользователя."
      ]
    });
    return toolResult(markdown, { items, nextCursor: page.nextCursor });
  }));
}
function registerProductWriteTools(server, ctx) {
  server.registerTool(CREATE_TOOL3, {
    title: "Номенклатура: создать",
    description: "Создаёт позицию номенклатуры (услугу или товар). Требует confirm: true. Сначала проверьте, нет ли такой позиции через invoices_products_list — повтор создаст дубль. Цену и ставку НДС не выдумывайте: если их нет, не передавайте поле.",
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
      `Позиция создана: **${product.name}** (${label(PRODUCT_KIND, product.kind)})`,
      "",
      mdBullets([
        `Единица: ${product.unitCode ?? "—"}`,
        `Цена: ${formatMoneyString(product.price)}`,
        `НДС: ${product.vatRate === null ? "—" : `${product.vatRate} %`}`,
        ...product.sku === null ? [] : [`Артикул: ${product.sku}`],
        `ID: ${product.id}`
      ]),
      "",
      "Позиция активна и доступна в invoices_products_list; её productId можно подставить в позиции черновика."
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
var DateOnly4 = z12.string().regex(/^\d{2}\.\d{2}\.\d{4}$/, "дата в формате DD.MM.YYYY");
var Period = z12.object({ from: nullableString, to: nullableString });
var SummaryInput2 = z12.object({
  organizationId: z12.uuid().optional().describe("Организация; без него — все доступные токену"),
  from: DateOnly4.optional().describe("Начало периода, DD.MM.YYYY"),
  to: DateOnly4.optional().describe("Конец периода, DD.MM.YYYY"),
  groupBy: z12.enum(["month", "contractor"]).optional().describe("Разрез: по месяцам (по умолчанию) или по контрагентам")
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
  contractorId: z12.uuid().optional().describe("Только документы этого контрагента"),
  overdueOnly: z12.boolean().optional().describe("Только просроченные на сегодня"),
  limit: z12.number().int().optional().describe("1–100, по умолчанию 20"),
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
  organizationId: z12.uuid().describe("Организация, по которой строится акт сверки"),
  contractorId: z12.uuid().describe("Контрагент (ID из invoices_contractors_search)"),
  from: DateOnly4.describe("Начало периода, DD.MM.YYYY"),
  to: DateOnly4.describe("Конец периода, DD.MM.YYYY")
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
  type: z12.enum(["invoice", "act", "invoice_facture", "upd", "contract"]).optional().describe("Тип документа; без него — все"),
  from: DateOnly4.describe("Начало периода, DD.MM.YYYY"),
  to: DateOnly4.describe("Конец периода, DD.MM.YYYY"),
  limit: z12.number().int().optional().describe("1–100, по умолчанию 20"),
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
    title: "Отчёт: сводка за период",
    description: "Итоги за период: выставлено, оплачено, не оплачено, просрочено + количество документов. groupBy: month — разбивка по месяцам, contractor — по контрагентам. Ответ на вопросы «сколько выставлено за квартал», «кто больше всех должен».",
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
        `Период: ${report.period.from ?? "—"} — ${report.period.to ?? "—"}`,
        `Выставлено: ${formatMoneyString(report.totals.issued)}`,
        `Оплачено: ${formatMoneyString(report.totals.paid)}`,
        `Не оплачено: ${formatMoneyString(report.totals.unpaid)}`,
        `Просрочено: ${formatMoneyString(report.totals.overdue)}`,
        `Документов: счетов ${report.counts.invoices}, актов ${report.counts.acts}, неоплаченных ${report.counts.unpaidInvoices}`
      ])
    ];
    if (groupBy === "month" && byMonth !== void 0 && byMonth.length > 0) {
      blocks.push("", summaryTable({
        title: "",
        headers: ["Месяц", "Выставлено", "Оплачено"],
        rows: byMonth.map((row) => [
          row.month,
          formatMoneyString(row.issued),
          formatMoneyString(row.paid)
        ])
      }).replace(/^\n+/, "").replace(/^\n+/, ""));
    }
    if (groupBy === "contractor" && byContractor !== void 0 && byContractor.length > 0) {
      blocks.push("", summaryTable({
        title: "",
        headers: ["Контрагент", "Выставлено", "Оплачено"],
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
    title: "Отчёт: неоплаченные документы",
    description: "Неоплаченные и частично оплаченные документы: остаток и дни просрочки, старые сверху. overdueOnly: true — только просроченные. Для «что нам должны» и «что горит».",
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
      title: items.length === 0 ? "Неоплаченных документов нет." : `Неоплаченных документов: ${report.count}, остаток по странице ниже`,
      headers: ["№", "Дата", "Контрагент", "Остаток", "Просрочка", "ID"],
      rows: items.map((item) => [
        item.number ?? "б/н",
        item.documentDate ?? "—",
        item.counterpartyShortName ?? "—",
        formatMoneyString(item.remaining),
        item.daysOverdue > 0 ? `${item.daysOverdue} дн.` : "—",
        item.id
      ]),
      footer: [
        `Итого к получению: ${formatMoneyString(report.total)} (${report.count} документов)`,
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
    title: "Отчёт: акт сверки с контрагентом",
    description: "Акт сверки: начальное сальдо, обороты (дебет/кредит), конечное сальдо и построчная история документов и оплат с нарастающим итогом. Для «сверьтесь с контрагентом».",
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
        `Период: ${report.period.from ?? "—"} — ${report.period.to ?? "—"}`,
        `Сальдо начальное: ${formatMoneyString(report.money.openingBalance)}`,
        `Оборот: дебет ${formatMoneyString(report.money.turnover.debit)}, кредит ${formatMoneyString(report.money.turnover.credit)}`,
        `Сальдо конечное: ${formatMoneyString(report.money.closingBalance)}`,
        `Счетов: ${report.summary.invoices} на ${formatMoneyString(report.summary.invoicesTotal)}, оплачено ${formatMoneyString(report.summary.paidTotal)}`,
        report.summary.unclosedByActs === void 0 || report.summary.unclosedByActs === null ? "" : `Не закрыто актами: ${formatMoneyString(report.summary.unclosedByActs)}`
      ].filter((line) => line !== ""))
    ];
    if (rows.length > 0) {
      blocks.push("", summaryTable({
        title: "",
        headers: ["Дата", "Тип", "№", "Дебет", "Кредит", "Сальдо"],
        rows: rows.map((row) => [
          row.date ?? "—",
          label(DOCUMENT_TYPE, row.type),
          row.number ?? "б/н",
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
    title: "Отчёт: реестр документов",
    description: "Реестр документов за период: номер, дата, контрагент, сумма, НДС, оплачено, статус, плюс итоги по реестру. Для выгрузки «все счета за октябрь».",
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
      title: items.length === 0 ? "В реестре нет документов за период." : `Документов в реестре: ${report.totals.documents}`,
      headers: ["№", "Дата", "Контрагент", "Сумма", "НДС", "Оплачено", "Статус", "ID"],
      rows: items.map((item) => [
        item.number ?? "б/н",
        item.documentDate ?? "—",
        item.contractorShortName ?? "—",
        formatMoneyString(item.total),
        formatMoneyString(item.vat),
        formatMoneyString(item.paid),
        label(DOCUMENT_STATUS, item.status),
        item.id
      ]),
      footer: [
        `Итого: ${formatMoneyString(report.totals.total)}, НДС ${formatMoneyString(report.totals.vat)}, оплачено ${formatMoneyString(report.totals.paid)}` + (report.totals.cancelled > 0 ? `, аннулировано ${report.totals.cancelled}` : ""),
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
  organizationId: z13.uuid().optional().describe("Только ссылки этой организации"),
  status: z13.enum(["active", "expired", "exhausted", "revoked"]).optional(),
  limit: z13.number().int().optional().describe("1–100, по умолчанию 20"),
  cursor: z13.string().optional()
});
var ListOutput4 = z13.object({
  items: z13.array(ShareListItem),
  nextCursor: z13.string().nullable()
});
var GetInput5 = z13.object({
  shareId: z13.uuid().describe("Идентификатор ссылки (UUID из invoices_shares_list)"),
  include: z13.array(z13.enum(["views", "replies"])).optional().describe("Добавить просмотры и/или ответы клиента")
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
    title: "Ссылки: список",
    description: "Публичные ссылки на документы: статус, лимит и число просмотров, ответы клиента, срок. URL в списке не отдаётся (API его не хранит) — ссылку возвращает создание ссылки.",
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
      title: items.length === 0 ? "Ссылок нет." : `Ссылок на странице: ${items.length}`,
      headers: ["Статус", "Документов", "Просмотры", "Ответы", "Действует до", "ID"],
      rows: items.map((share) => [
        label(SHARE_STATUS, share.status),
        String(share.documentsCount),
        `${share.viewCount} из ${share.maxViews}`,
        share.allowReply ? String(share.replyCount) : "приём выключен",
        formatIsoDate(share.expiresAt),
        share.id
      ]),
      footer: [
        ...nextPageHint(page) === void 0 ? [] : [nextPageHint(page) ?? ""],
        "Подробности — invoices_shares_get; новая ссылка создаётся через invoices_shares_create (с подтверждением)."
      ]
    });
    return toolResult(markdown, { items, nextCursor: page.nextCursor });
  }));
  server.registerTool(GET_TOOL5, {
    title: "Ссылка: карточка",
    description: 'Публичная ссылка: документы, лимит и число просмотров, срок действия. include: ["views"] — кто и когда открывал, ["replies"] — ответы клиента.',
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
        `Статус: ${label(SHARE_STATUS, share.status)}`,
        `Просмотры: ${share.viewCount} из ${share.maxViews}`,
        `Действует до: ${formatIsoDate(share.expiresAt)}`,
        `Ответы клиента: ${share.allowReply ? share.replyCount : "приём выключен"}`,
        share.message === null || share.message === "" ? "" : `Сообщение клиенту: ${share.message}`
      ].filter((line) => line !== "")),
      "",
      "**Документы**",
      documents.length === 0 ? "Документов в ссылке нет." : mdBullets(documents.map((document) => `${label(DOCUMENT_TYPE, document.type)} № ${document.number ?? "б/н"} от ${document.documentDate ?? "—"}: ${formatMoneyString(document.grandTotal)}${document.status === null ? "" : `, ${label(DOCUMENT_STATUS, document.status)}`}`))
    ];
    if (views !== void 0) {
      blocks.push("", "**Просмотры**", views.length === 0 ? "Просмотров не было." : mdBullets(views.map((view) => `${formatIsoDate(view.viewedAt)}${view.ip === null ? "" : `, ${view.ip}`}`)));
    }
    if (replies !== void 0) {
      blocks.push("", "**Ответы клиента**", replies.length === 0 ? "Ответов нет." : mdBullets(replies.map((reply) => `${formatIsoDate(reply.createdAt)}, ${reply.authorName ?? "клиент"}: ${reply.message ?? "—"}`)));
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
  documentIds: z13.array(z13.uuid()).min(1).describe("Документы, которые открываются по ссылке"),
  message: z13.string().optional().describe("Сообщение клиенту"),
  maxViews: z13.number().int().min(1).optional().describe("Сколько раз можно открыть ссылку"),
  expiresAt: z13.string().regex(/^\d{2}\.\d{2}\.\d{4}$/).optional().describe("Срок действия, DD.MM.YYYY"),
  pin: z13.string().optional().describe("PIN-код для доступа"),
  allowReply: z13.boolean().optional().describe("Разрешить ответ клиента"),
  withSeal: z13.boolean().optional(),
  withSignature: z13.boolean().optional(),
  idempotencyKey: z13.string().regex(/^[A-Za-z0-9_-]{8,128}$/).optional().describe("Ключ идемпотентности: при повторе передайте тот же"),
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
    title: "Ссылка: создать",
    description: "Публикует документы по короткой ссылке: клиент откроет её без входа. Требует confirm: true — ссылка становится доступной снаружи. URL возвращается только здесь; позже его покажет разве что кабинет.",
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
      `Ссылка создана: ${share.url}`,
      "",
      mdBullets([
        `Документов: ${documents.length} (${documents.map((document) => document.number ?? "б/н").join(", ")})`,
        `Просмотров: ${share.maxViews}`,
        `Действует до: ${formatIsoDate(share.expiresAt)}`,
        `Ответы клиента: ${share.allowReply ? "разрешены" : "выключены"}`
      ]),
      "",
      "Ссылка публичная — передайте её клиенту. Отозвать можно в кабинете (invoices_shares_get покажет статус)."
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
      respondJson(res, 400, { error: "bad_request", message: "Некорректный URL запроса." });
      return;
    }
    if (pathname !== MCP_PATH) {
      respondJson(res, 404, {
        error: "not_found",
        message: `MCP доступен по ${MCP_PATH} (Streamable HTTP, POST).`
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
      const list = error.problems.map((problem) => `  • ${problem}`).join("\n");
      fail(`${SERVER_NAME}: конфигурация не загружена
${list}

Что указать:
  INVOICES_API_URL   — базовый адрес API, например https://accounting.example.ru
  INVOICES_API_TOKEN — сервисный токен ivs_<kid>_<secret> из админки (режим readonly)
Подробности: doc/mcp/03-config-auth.md`);
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
      `${SERVER_NAME} ${SERVER_VERSION} — MCP-сервер сервиса счетов и актов`,
      "",
      "Переменные окружения:",
      "  INVOICES_API_URL        базовый адрес API без /api/v1 (обязательно)",
      "  INVOICES_API_TOKEN      сервисный токен ivs_<kid>_<secret> из админки (обязательно)",
      "  INVOICES_ALLOW_HTTP_HOSTS  хосты через запятую, где разрешён http:// (по умолчанию только localhost)",
      "  INVOICES_MCP_TRANSPORT  stdio (по умолчанию) или http",
      "  INVOICES_MCP_PORT       порт HTTP-транспорта, только 127.0.0.1 (7331)",
      "  INVOICES_TIMEOUT_MS     таймаут запроса к API (10000)",
      "  INVOICES_LOG_LEVEL      debug | info | warn | error (info)",
      "",
      "Флаги:",
      "  -v, --version           версия сервера",
      "  -h, --help              эта справка",
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
      fail(`${SERVER_NAME}: HTTP-транспорт не запущен — ${message}
Проверьте, что порт ${config.port} свободен (INVOICES_MCP_PORT), и повторите запуск.`);
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
