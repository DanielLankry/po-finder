/** Keep provider errors out of the Hebrew product UI without exposing account details. */
export function registrationErrorMessage(code?: string, status?: number): string {
  if (status === 429 || code === "over_email_send_rate_limit" || code === "over_request_rate_limit") {
    return "נשלחו כמה בקשות ברצף. המתינו דקה ונסו שוב.";
  }
  if (code === "user_already_exists" || code === "email_exists") {
    return "לא ניתן ליצור חשבון עם הכתובת הזו. נסו להיכנס או לאפס את הסיסמה.";
  }
  if (code === "weak_password") return "הסיסמה אינה חזקה מספיק. בחרו סיסמה ארוכה יותר עם אותיות ומספרים.";
  if (code === "email_address_invalid") return "כתובת המייל אינה תקינה. בדקו אותה ונסו שוב.";
  return "לא הצלחנו להשלים את ההרשמה. בדקו את הפרטים ונסו שוב.";
}
