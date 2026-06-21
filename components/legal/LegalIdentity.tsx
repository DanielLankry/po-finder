import { BUSINESS_INFO, SITE_DOMAIN } from "@/lib/site-config";

const identityRows = [
  { label: "שם מסחרי", value: BUSINESS_INFO.businessDisplayName },
  { label: "שם העוסק / החברה", value: BUSINESS_INFO.legalBusinessName },
  { label: "מספר עוסק / ח.פ.", value: BUSINESS_INFO.businessId },
  { label: "כתובת למשלוח הודעות", value: BUSINESS_INFO.address },
  { label: "דוא\"ל", value: BUSINESS_INFO.contactEmail },
  { label: "טלפון / WhatsApp", value: BUSINESS_INFO.whatsappNumber },
  { label: "דומיין", value: SITE_DOMAIN },
];

export default function LegalIdentity() {
  const missingRequired = identityRows.some((row) => !row.value);

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-xl border border-stone-200">
        <table className="w-full text-sm">
          <tbody>
            {identityRows.map((row) => (
              <tr key={row.label} className="border-b border-stone-100 last:border-b-0">
                <th className="w-40 bg-stone-50 p-3 text-right font-semibold text-stone-800">
                  {row.label}
                </th>
                <td className="p-3 text-stone-700">
                  {row.value || "לא הוגדר באתר"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {missingRequired ? (
        <p className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900">
          חסרים פרטי עוסק מלאים. לפני גבייה ציבורית או פרסום מסחרי, יש להשלים את
          השדות ב-<span dir="ltr">BUSINESS_INFO</span> כדי לעמוד בדרישות גילוי
          של עסקה מרחוק.
        </p>
      ) : null}
    </div>
  );
}
