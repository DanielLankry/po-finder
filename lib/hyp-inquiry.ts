export type HypInquiryOutcome = "charged" | "not_charged" | "not_found" | "unknown";

export type HypPaymentInquiry = {
  outcome: HypInquiryOutcome;
  inquiryUser: string;
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

function extractTagAttribute(
  xml: string,
  tag: string,
  attribute: string,
): string {
  const match = xml.match(
    new RegExp(`<${tag}\\b[^>]*\\b${attribute}\\s*=\\s*["']([^"']*)["']`, "i"),
  );
  return match?.[1]?.trim() ?? "";
}

function normalizeAmount(value: string): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.round(parsed) : null;
}

function normalizeValue(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

/** HYP documents payment-page `user` lookup values as at most 19 characters. */
export function toHypInquiryUser(attemptId: string): string {
  return attemptId.trim().slice(0, 19);
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function buildHypInquiryXml(
  terminalNumber: string,
  attemptId: string,
): string {
  return `<ashrait><request><version>2000</version><language>ENG</language><command>inquireTransactions</command><inquireTransactions><terminalNumber>${escapeXml(terminalNumber)}</terminalNumber><user>${escapeXml(toHypInquiryUser(attemptId))}</user></inquireTransactions></request></ashrait>`;
}

function isSuccessfulRow(row: string): boolean {
  const status = extractTag(row, "status") || extractTag(row, "statusCode");
  const errorCode = extractTag(row, "errorCode");
  return status ? status === "000" || status === "0" : errorCode === "00";
}

function isCapturedDebit(row: string): boolean {
  const validation = normalizeValue(extractTag(row, "validation"));
  const financialStatus = normalizeValue(extractTag(row, "financialStatus"));
  const transactionType = normalizeValue(extractTag(row, "transactionType"));
  const transactionTypeCode = normalizeValue(
    extractTagAttribute(row, "transactionType", "code"),
  );
  const debitType =
    transactionType === "regulardebit" ||
    transactionType === "forceddebit" ||
    transactionType === "debit" ||
    transactionType === "01" ||
    transactionType === "03" ||
    transactionTypeCode === "01" ||
    transactionTypeCode === "03";

  return (
    isSuccessfulRow(row) &&
    validation === "autocomm" &&
    debitType &&
    (financialStatus === "captured" || financialStatus === "transmitted")
  );
}

function reversesCharge(row: string): boolean {
  const financialStatus = normalizeValue(extractTag(row, "financialStatus"));
  const transactionType = normalizeValue(extractTag(row, "transactionType"));
  const transactionTypeCode = normalizeValue(
    extractTagAttribute(row, "transactionType", "code"),
  );
  return (
    financialStatus === "cancelled" ||
    financialStatus === "canceled" ||
    financialStatus === "refunded" ||
    financialStatus === "reversed" ||
    (isSuccessfulRow(row) &&
      (transactionType === "cancel" ||
        transactionType === "authcredit" ||
        transactionType === "refund" ||
        transactionType === "regularcredit" ||
        transactionType === "reversal" ||
        transactionType === "51" ||
        transactionType === "52" ||
        transactionType === "53" ||
        transactionType === "58" ||
        transactionTypeCode === "51" ||
        transactionTypeCode === "52" ||
        transactionTypeCode === "53" ||
        transactionTypeCode === "58"))
  );
}

function inquiryDetails(
  rawXml: string,
  row: string,
  outcome: HypInquiryOutcome,
  responseCodeFallback: string,
): HypPaymentInquiry {
  return {
    outcome,
    inquiryUser: extractTag(row, "user"),
    hypTransactionId:
      extractTag(row, "tranId") ||
      extractTag(row, "cgUid") ||
      extractTag(row, "mpiTransactionId"),
    hypAuthCode: extractTag(row, "authNumber"),
    hypCardMask: extractTag(row, "cardMask") || extractTag(row, "cardNo"),
    hypResponseCode:
      responseCodeFallback ||
      extractTag(row, "cgGatewayResponseCode") ||
      extractTag(row, "status") ||
      extractTag(row, "statusCode") ||
      extractTag(row, "errorCode") ||
      "unknown",
    amountAgorot: normalizeAmount(
      extractTag(row, "total") || extractTag(row, "amount"),
    ),
    rawXml,
  };
}

export function parseHypPaymentInquiry(
  rawXml: string,
  expectedAttemptId: string,
): HypPaymentInquiry {
  const topResult = extractTag(rawXml, "result");
  const expectedUser = toHypInquiryUser(expectedAttemptId);
  const rows = [
    ...extractBlocks(rawXml, "row"),
    ...extractBlocks(rawXml, "transaction"),
  ];

  // HYP documents `user` as both a payment-page field and an inquiry key.
  // Fail closed unless every returned transaction echoes the requested value.
  if (
    rows.length > 0 &&
    (!expectedUser || rows.some((row) => extractTag(row, "user") !== expectedUser))
  ) {
    return {
      outcome: "unknown",
      inquiryUser: "",
      hypTransactionId: "",
      hypAuthCode: "",
      hypCardMask: "",
      hypResponseCode: "correlation_unverified",
      amountAgorot: null,
      rawXml,
    };
  }

  const chargedRowIndex = rows.reduce(
    (found, row, index) => (isCapturedDebit(row) ? index : found),
    -1,
  );
  const chargedRow = chargedRowIndex >= 0 ? rows[chargedRowIndex] : undefined;
  // HYP does not guarantee response row order. Any applicable successful
  // cancel, credit, or reversal vetoes automatic settlement.
  const reversalRowIndex = rows.findIndex(reversesCharge);
  const chargeWasReversed = reversalRowIndex >= 0;

  if (chargedRow && !chargeWasReversed && extractTag(chargedRow, "tranId")) {
    // CancelTrans and the existing refund flow require the technical debit
    // tranId, not the MPI/cgUid identifier shared by related transactions.
    return inquiryDetails(rawXml, chargedRow, "charged", "");
  }

  const failedRow = rows.find((row) => {
    const validation = normalizeValue(extractTag(row, "validation"));
    const financialStatus = normalizeValue(extractTag(row, "financialStatus"));
    const status = extractTag(row, "status") || extractTag(row, "statusCode");
    const errorCode = extractTag(row, "errorCode");
    return (
      validation !== "txnsetup" &&
      (financialStatus === "rejected" ||
        financialStatus === "error" ||
        (status !== "000" && status !== "0" && Boolean(status)) ||
        (errorCode !== "00" && Boolean(errorCode)))
    );
  });

  if (chargeWasReversed || failedRow) {
    const terminalRow = chargeWasReversed
      ? rows[reversalRowIndex]
      : failedRow;
    return inquiryDetails(
      rawXml,
      terminalRow ?? "",
      "not_charged",
      chargeWasReversed ? "reversed" : "",
    );
  }

  return {
    outcome: topResult === "000" && rows.length === 0 ? "not_found" : "unknown",
    inquiryUser: "",
    hypTransactionId: "",
    hypAuthCode: "",
    hypCardMask: "",
    hypResponseCode: topResult || "unknown",
    amountAgorot: null,
    rawXml,
  };
}
