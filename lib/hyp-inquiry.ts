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

function isDebitRow(row: string): boolean {
  const transactionType = normalizeValue(extractTag(row, "transactionType"));
  const transactionTypeCode = normalizeValue(
    extractTagAttribute(row, "transactionType", "code"),
  );
  return (
    transactionType === "regulardebit" ||
    transactionType === "forceddebit" ||
    transactionType === "debit" ||
    transactionType === "01" ||
    transactionType === "03" ||
    transactionTypeCode === "01" ||
    transactionTypeCode === "03"
  );
}

function isCapturedDebit(row: string): boolean {
  const validation = normalizeValue(extractTag(row, "validation"));
  const financialStatus = normalizeValue(extractTag(row, "financialStatus"));

  return (
    isSuccessfulRow(row) &&
    validation === "autocomm" &&
    isDebitRow(row) &&
    (financialStatus === "captured" || financialStatus === "transmitted")
  );
}

function isTerminallyReversedDebit(row: string): boolean {
  const financialStatus = normalizeValue(extractTag(row, "financialStatus"));
  return (
    isDebitRow(row) &&
    (financialStatus === "cancelled" ||
      financialStatus === "canceled" ||
      financialStatus === "refunded" ||
      financialStatus === "reversed")
  );
}

function isReversalRow(row: string): boolean {
  const transactionType = normalizeValue(extractTag(row, "transactionType"));
  const transactionTypeCode = normalizeValue(
    extractTagAttribute(row, "transactionType", "code"),
  );
  return (
    transactionType === "cancel" ||
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
    transactionTypeCode === "58"
  );
}

function isSuccessfulReversal(row: string): boolean {
  const financialStatus = normalizeValue(extractTag(row, "financialStatus"));
  return (
    isSuccessfulRow(row) &&
    isReversalRow(row) &&
    (financialStatus === "captured" || financialStatus === "transmitted")
  );
}

function isNonTerminalSuccessfulReversal(row: string): boolean {
  return isSuccessfulRow(row) && isReversalRow(row) && !isSuccessfulReversal(row);
}

function sumTransactionAmounts(rows: string[]): number | null {
  let total = 0;
  for (const row of rows) {
    const amount = normalizeAmount(
      extractTag(row, "total") || extractTag(row, "amount"),
    );
    if (amount === null || amount <= 0) return null;
    total += amount;
  }
  return total;
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

  const chargedRows = rows.filter(isCapturedDebit);
  const terminallyReversedDebit = rows.find(isTerminallyReversedDebit);
  if (terminallyReversedDebit) {
    if (chargedRows.length > 0) {
      return inquiryDetails(
        rawXml,
        terminallyReversedDebit,
        "unknown",
        "mixed_financial_state",
      );
    }
    return inquiryDetails(
      rawXml,
      terminallyReversedDebit,
      "not_charged",
      "reversed",
    );
  }

  const reversalRows = rows.filter(isSuccessfulReversal);

  if (reversalRows.length > 0) {
    // HYP supports partial refunds and does not guarantee response row order.
    // Only a complete, amount-proven offset is terminally not charged. Any
    // partial, excess, or amount-less mix retains the attempt for review.
    const chargedAmount = sumTransactionAmounts(chargedRows);
    const reversedAmount = sumTransactionAmounts(reversalRows);
    const reversalRow = reversalRows[reversalRows.length - 1];
    if (
      chargedRows.length > 0 &&
      chargedAmount !== null &&
      reversedAmount !== null &&
      chargedAmount === reversedAmount
    ) {
      return inquiryDetails(rawXml, reversalRow, "not_charged", "reversed");
    }
    return inquiryDetails(rawXml, reversalRow, "unknown", "partial_reversal");
  }

  const nonTerminalReversal = rows.find(isNonTerminalSuccessfulReversal);
  if (nonTerminalReversal) {
    // A successful HYP response does not make a credit final. Its independent
    // financial pipeline status can still be Pending or Authorized, so it must
    // veto settlement without being treated as proof that the debit was offset.
    return inquiryDetails(
      rawXml,
      nonTerminalReversal,
      "unknown",
      "non_terminal_reversal",
    );
  }

  const chargedRow = chargedRows.length === 1 ? chargedRows[0] : undefined;
  if (chargedRow && extractTag(chargedRow, "tranId")) {
    // CancelTrans and the existing refund flow require the technical debit
    // tranId, not the MPI/cgUid identifier shared by related transactions.
    return inquiryDetails(rawXml, chargedRow, "charged", "");
  }

  if (chargedRows.length > 0) {
    return inquiryDetails(
      rawXml,
      chargedRows[0],
      "unknown",
      "multiple_captured_debits",
    );
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

  if (failedRow) {
    return inquiryDetails(rawXml, failedRow, "not_charged", "");
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
