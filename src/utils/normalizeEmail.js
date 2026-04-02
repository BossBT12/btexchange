/** Trim and lowercase for login/registration — matches typical mailbox handling. */
export function normalizeEmail(value) {
  if (value == null || value === "") return "";
  return String(value).trim().toLowerCase();
}
