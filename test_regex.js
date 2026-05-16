const chart = `graph TD
  subgraph "1. Investor Request & Document Submission"
    A1[Investor Initiates Request (Subscription/Redemption/Transfer)] --> B1[Investor Submits Required Documents (e.g., Subscription Agreement, KYC Docs)]
    B1 --> B2[System Ingests Documents (Digital/Scanned)]
  end

  subgraph "2. Automated Data Extraction & Validation (OCR/NLP)"
    B2 --> C1{OCR/NLP Processing & Data Extraction}
    C1 --> C2{Data Extraction Accuracy >= 98%?}
    C2 -- No --> C3[Flag Discrepancies & Route for Manual Review]
    C2 -- Yes --> C4[Structured Data Available]
  end
`;

let cleanChart = chart.replace(/([a-zA-Z0-9_]+)\[([^\]]+)\]/g, (m, id, text) => {
   if (text.trim().startsWith('"') && text.trim().endsWith('"')) return m;
   return `${id}["${text.trim().replace(/"/g, "'")}"]`;
});
cleanChart = cleanChart.replace(/([a-zA-Z0-9_]+)\{([^}]+)\}/g, (m, id, text) => {
   if (text.trim().startsWith('"') && text.trim().endsWith('"')) return m;
   return `${id}{"${text.trim().replace(/"/g, "'")}"}`;
});
cleanChart = cleanChart.replace(/([a-zA-Z0-9_]+)\(([^)]+)\)/g, (m, id, text) => {
   if (text.trim().startsWith('"') && text.trim().endsWith('"')) return m;
   return `${id}("${text.trim().replace(/"/g, "'")}")`;
});

console.log(cleanChart);
