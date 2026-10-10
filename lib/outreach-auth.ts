export function isOutreachAuthorized(email?: string | null): boolean {
  if (!email) return false;
  const adminEmail = process.env.ADMIN_EMAIL || "priyanshu82711@gmail.com";
  return (
    email.toLowerCase() === "priyanshu82711@gmail.com" ||
    email.toLowerCase() === adminEmail.toLowerCase()
  );
}
