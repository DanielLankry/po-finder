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

function normalizeValue(value: string): string {
  return value.trim().toLowerCase().replace(/[\s_-]+/g, "");
}

function isSuccessfulRow(row: string): boolean {
  const status = extractTag(row, "status") || extractTag(row, "statusCode");
  const errorCode = extractTag(row, "errorCode");
  return status === "000" || status === "0" || errorCode === "00";
}

function isCapturedDebit(row: string): boolean {
  const validation = normalizeValue(extractTag(row, "validation"));
  const financialStatus = normalizeValue(extractTag(row, "financialStatus"));
  const transactionType = normalizeValue(extractTag(row, "transactionType"));
  const debitType =
    transactionType === "regulardebit" ||
    transactionType === "forceddebit" ||
    transactionType === "debit" ||
    transactionType === "01" ||
    transactionType === "03";

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
  return (
    financialStatus === "cancelled" ||
    (isSuccessfulRow(row) &&
      (transactionType === "cancel" ||
        transactionType === "refund" ||
        transactionType === "regularcredit" ||
        transactionType === "reversal" ||
        transactionType === "51" ||
        transactionType === "52" ||
        transactionType === "58"))
  );
}

export function parseHypPaymentInquiry(rawXml: string): HypPaymentInquiry {
  const topResult = extractTag(rawXml, "result");
  const rows = [
    ...extractBlocks(rawXml, "row"),
    ...extractBlocks(rawXml, "transaction"),
  ];

  const chargedRowIndex = rows.reduce(
    (found, row, index) => (isCapturedDebit(row) ? index : found),
    -1,
  );
  const chargedRow = chargedRowIndex >= 0 ? rows[chargedRowIndex] : undefined;
  const reversalRowIndex = rows.findIndex(reversesCharge);
  const chargeWasReversed =
    reversalRowIndex >= 0 &&
    (chargedRowIndex < 0 || reversalRowIndex >= chargedRowIndex);

  if (chargedRow && !chargeWasReversed && extractTag(chargedRow, "tranId")) {
    return {
      outcome: "charged",
      // CancelTrans and the existing refund flow require the technical debit
      // tranId, not the MPI/cgUid identifier shared by related transactions.
      hypTransactionId: extractTag(chargedRow, "tranId"),
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
    return {
      outcome: "not_charged",
      hypTransactionId:
        extractTag(terminalRow ?? "", "tranId") ||
        extractTag(terminalRow ?? "", "cgUid") ||
        extractTag(terminalRow ?? "", "mpiTransactionId"),
      hypAuthCode: extractTag(terminalRow ?? "", "authNumber"),
      hypCardMask:
        extractTag(terminalRow ?? "", "cardMask") ||
        extractTag(terminalRow ?? "", "cardNo"),
      hypResponseCode:
        (chargeWasReversed ? "reversed" : "") ||
        extractTag(terminalRow ?? "", "cgGatewayResponseCode") ||
        extractTag(terminalRow ?? "", "status") ||
        extractTag(terminalRow ?? "", "statusCode") ||
        extractTag(terminalRow ?? "", "errorCode") ||
        "not_charged",
      amountAgorot: normalizeAmount(
        extractTag(terminalRow ?? "", "total") ||
          extractTag(terminalRow ?? "", "amount")
      ),
      rawXml,
    };
  }

  return {
    outcome: topResult === "000" && rows.length === 0 ? "not_found" : "unknown",
    hypTransactionId: "",
    hypAuthCode: "",
    hypCardMask: "",
    hypResponseCode: topResult || "unknown",
    amountAgorot: null,
    rawXml,
  };
}
