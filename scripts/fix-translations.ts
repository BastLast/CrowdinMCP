import crowdinModule from "@crowdin/crowdin-api-client";

const token = process.env.CROWDIN_TOKEN!;
const projectId = 378229;
const languageId = "en";

const crowdin = new (crowdinModule as any).default({ token });

// Define all the replacements needed
const replacements: Array<{search: string, replace: string, description: string}> = [
  // Text branding
  { search: "DraftBot", replace: "Crownicles", description: "Brand name in text" },
];

// URL replacements need to be more specific
const urlReplacements: Array<{search: string, replace: string, description: string}> = [
  { search: "guide.draftbot.com", replace: "guide.crownicles.com", description: "Guide URL" },
  { search: "history.draftbot.com", replace: "history.crownicles.com", description: "History URL" },
  { search: "status.draftbot.com", replace: "status.crownicles.com", description: "Status URL" },
  { search: "feedback.draftbot.com", replace: "feedback.crownicles.com", description: "Feedback URL" },
  { search: "https://draftbot.com", replace: "https://crownicles.com", description: "Main site URL" },
  { search: ":draftbot:", replace: ":crownicles:", description: "Discord emoji" },
];

async function fixBrandingIssues() {
  console.log("=== Fixing DraftBot → Crownicles Branding Issues in English ===\n");
  
  // Find all translations containing "DraftBot" (case-insensitive via CroQL)
  let offset = 0;
  const limit = 25;
  let allTranslations: any[] = [];
  
  // Paginate through all translations with "DraftBot"
  while (true) {
    const batch = await crowdin.stringTranslationsApi.listLanguageTranslations(
      projectId,
      languageId,
      { croql: 'text contains "DraftBot"', limit, offset }
    );
    allTranslations.push(...batch.data);
    if (batch.data.length < limit) break;
    offset += limit;
  }
  
  console.log(`Found ${allTranslations.length} translations containing "DraftBot"\n`);
  
  // Also find lowercase "draftbot" (for URLs and emoji)
  offset = 0;
  let lowercaseTranslations: any[] = [];
  while (true) {
    const batch = await crowdin.stringTranslationsApi.listLanguageTranslations(
      projectId,
      languageId,
      { croql: 'text contains "draftbot"', limit, offset }
    );
    lowercaseTranslations.push(...batch.data);
    if (batch.data.length < limit) break;
    offset += limit;
  }
  
  // Merge and deduplicate
  const seenIds = new Set<number>();
  const allToFix: any[] = [];
  for (const t of [...allTranslations, ...lowercaseTranslations]) {
    const id = t.data.stringId || t.data.translationId;
    if (!seenIds.has(id)) {
      seenIds.add(id);
      allToFix.push(t);
    }
  }
  
  console.log(`Total unique translations to fix: ${allToFix.length}\n`);
  
  let fixedCount = 0;
  let skippedCount = 0;
  
  for (const t of allToFix) {
    const data = t.data;
    const stringId = data.stringId;
    const originalText = data.text || "";
    let newText = originalText;
    
    // Apply all replacements
    // First URL replacements (more specific, to avoid partial matches)
    for (const r of urlReplacements) {
      newText = newText.replaceAll(r.search, r.replace);
    }
    // Then text replacements
    for (const r of replacements) {
      // Don't replace if it's part of a URL we already fixed, or a command name
      // Replace "DraftBot" but NOT inside already-fixed URLs
      newText = newText.replaceAll(r.search, r.replace);
    }
    
    // Special cases: don't change command names like /ilovedraftbot (leave it in the source)
    // Actually the source string already has /ilovedraftbot, so we shouldn't change that
    
    if (newText === originalText) {
      skippedCount++;
      continue;
    }
    
    console.log(`--- String ID: ${stringId} ---`);
    console.log(`  BEFORE: ${originalText.substring(0, 150)}`);
    console.log(`  AFTER:  ${newText.substring(0, 150)}`);
    
    // Apply the fix
    try {
      await crowdin.stringTranslationsApi.addTranslation(projectId, {
        stringId: stringId,
        languageId: languageId,
        text: newText,
      });
      console.log(`  ✅ Fixed!\n`);
      fixedCount++;
    } catch (err: any) {
      console.log(`  ❌ Error: ${err.message}\n`);
    }
  }
  
  console.log(`\n=== Summary ===`);
  console.log(`Fixed: ${fixedCount}`);
  console.log(`Skipped (no change needed): ${skippedCount}`);
  console.log(`Total processed: ${allToFix.length}`);
}

async function fixIndividualStrings() {
  console.log("\n=== Fixing Individual Translation Issues ===\n");
  
  // String 50428 (advices.96): FR says "Crownicles n'enregistre aucune de vos données personnelles."
  // EN currently has French text!
  console.log("--- String 50428 (advices.96) ---");
  console.log("  Issue: EN has French text instead of English");
  try {
    await crowdin.stringTranslationsApi.addTranslation(projectId, {
      stringId: 50428,
      languageId: "en",
      text: "Crownicles does not store any of your personal data.",
    });
    console.log("  ✅ Fixed: 'Crownicles does not store any of your personal data.'\n");
  } catch (err: any) {
    console.log(`  ❌ Error: ${err.message}\n`);
  }
  
  // String 53458 (advices.177): FR says privacy policy link, EN says something about mission change
  console.log("--- String 53458 (advices.177) ---");
  console.log("  Issue: Wrong translation (has mission change text instead of privacy policy)");
  try {
    await crowdin.stringTranslationsApi.addTranslation(projectId, {
      stringId: 53458,
      languageId: "en",
      text: "You can view our privacy policy by following this link: https://crownicles.com/confidentialite/",
    });
    console.log("  ✅ Fixed!\n");
  } catch (err: any) {
    console.log(`  ❌ Error: ${err.message}\n`);
  }
  
  // String 53570 (advices.233): FR says "Crownicles est le nouveau nom de DraftBot."
  // EN has completely wrong text about a dwarf
  console.log("--- String 53570 (advices.233) ---");
  console.log("  Issue: Wrong translation (has text about a dwarf instead of branding info)");
  try {
    await crowdin.stringTranslationsApi.addTranslation(projectId, {
      stringId: 53570,
      languageId: "en",
      text: "Crownicles is the new name for DraftBot.",
    });
    console.log("  ✅ Fixed!\n");
  } catch (err: any) {
    console.log(`  ❌ Error: ${err.message}\n`);
  }
}

async function main() {
  await fixBrandingIssues();
  await fixIndividualStrings();
}

main().catch(console.error);
