export type HypInquiryOutcome = "charged" | "not_charged" | "not_found" | "unknown";

export type HypPaymentInquiry = {
  outcome: HypInquiryOutcome;
  hypTransactionId: string;
  hypAuthCode: string;
  hypCardMask: string;
  hypResponseCode: string;
  amountAgorot: number | null;
  rawXml: string;
};

function extractTag(xml: string, tag: string): string {
  const match = xml.match(new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i"));
  return match?.[1]?.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim() ?? "";
}

function extractBlocks(xml: string, tag: string): string[] {
  return Array.from(
    xml.matchAll(new RegExp(`<${tag}(?:\\s[^>]*)?>[\\s\\S]*?</${tag}>`, "gi")),
    (match) => match[0],
  );
}

function normalizeAmount(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

export function parseHypPaymentInquiry(rawXml: string): HypPaymentInquiry {
  const topResult = extractTag(rawXml, "result");
  const rows = [
    ...extractBlocks(rawXml, "row"),
    ...extractBlocks(rawXml, "transaction"),
  ];

  const chargedRow = rows.find((row) => {
    const validation = extractTag(row, "validation");
    const status = extractTag(row, "status") || extractTag(row, "statusCode");
    const statusText = extractTag(row, "statusText");
    const errorCode = extractTag(row, "errorCode");
    return (
      (status === "000" || status === "0") &&
      (validation === "AutoComm" || statusText === "SUCCEEDED" || errorCode === "00")
    );
  });

  if (chargedRow) {
    return {
      outcome: "charged",
      hypTransactionId:
        extractTag(chargedRow, "mpiTransactionId") ||
        extractTag(chargedRow, "cgUid") ||
        extractTag(chargedRow, "tranId"),
      hypAuthCode: extractTag(chargedRow, "authNumber"),
      hypCardMask: extractTag(chargedRow, "cardMask") || extractTag(chargedRow, "cardNo"),
      hypResponseCode:
        extractTag(chargedRow, "cgGatewayResponseCode") ||
        extractTag(chargedRow, "status") ||
        extractTag(chargedRow, "statusCode") ||
        "000",
      amountAgorot: normalizeAmount(
        extractTag(chargedRow, "total") || extractTag(chargedRow, "amount")
      ),
      rawXml,
    };
  }

  const failedRow = rows.find((row) => {
    const validation = extractTag(row, "validation");
    const status = extractTag(row, "status") || extractTag(row, "statusCode");
    const errorCode = extractTag(row, "errorCode");
    return validation !== "TxnSetup" && (status || errorCode);
  });

  if (failedRow) {
    return {
      outcome: "not_charged",
      hypTransactionId:
        extractTag(failedRow, "mpiTransactionId") ||
        extractTag(failedRow, "cgUid") ||
        extractTag(failedRow, "tranId"),
      hypAuthCode: extractTag(failedRow, "authNumber"),
      hypCardMask: extractTag(failedRow, "cardMask") || extractTag(failedRow, "cardNo"),
      hypResponseCode:
        extractTag(failedRow, "cgGatewayResponseCode") ||
        extractTag(failedRow, "status") ||
        extractTag(failedRow, "statusCode") ||
        extractTag(failedRow, "errorCode") ||
        "not_charged",
      amountAgorot: normalizeAmount(
        extractTag(failedRow, "total") || extractTag(failedRow, "amount")
      ),
      rawXml,
    };
  }

  return {
    outcome: topResult === "000" ? "not_found" : "unknown",
    hypTransactionId: "",
    hypAuthCode: "",
    hypCardMask: "",
    hypResponseCode: topResult || "unknown",
    amountAgorot: null,
    rawXml,
  };
}
