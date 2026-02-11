import crowdinModule from "@crowdin/crowdin-api-client";

const token = process.env.CROWDIN_TOKEN!;
const projectId = 378229;
const languageId = "en";

const crowdin = new (crowdinModule as any).default({ token });

async function main() {
  console.log("=== Fixing possessive form and GitHub URL ===\n");
  
  // Fix "Crownicles's" → "Crownicles'" 
  const possessiveStrings = await crowdin.stringTranslationsApi.listLanguageTranslations(
    projectId,
    languageId,
    { croql: `text contains "Crownicles's"`, limit: 25 }
  );
  
  console.log(`Found ${possessiveStrings.data.length} translations with "Crownicles's":\n`);
  
  for (const t of possessiveStrings.data) {
    const data = t.data;
    const originalText = data.text || "";
    const newText = originalText.replaceAll("Crownicles's", "Crownicles'");
    
    if (newText === originalText) continue;
    
    console.log(`--- String ID: ${data.stringId} ---`);
    console.log(`  BEFORE: ${originalText.substring(0, 150)}`);
    console.log(`  AFTER:  ${newText.substring(0, 150)}`);
    
    try {
      await crowdin.stringTranslationsApi.addTranslation(projectId, {
        stringId: data.stringId,
        languageId: languageId,
        text: newText,
      });
      console.log(`  ✅ Fixed!\n`);
    } catch (err: any) {
      console.log(`  ❌ Error: ${err.message}\n`);
    }
  }
  
  // Fix GitHub URL: "Crownicles-A-Discord-Adventure" → should be just "Crownicles"
  // Source says: https://github.com/Crownicles/Crownicles/
  console.log("\n--- Fixing GitHub URL (string 50426) ---");
  const trans50426 = await crowdin.stringTranslationsApi.listStringTranslations(
    projectId,
    50426,
    languageId,
    { limit: 5 }
  );
  
  if (trans50426.data.length > 0) {
    // Find the latest translation
    const latest = trans50426.data[0].data;
    console.log(`  Current: ${latest.text?.substring(0, 200)}`);
    
    const fixedText = "The bot is open-source, which means that anyone can read the bot's code. Here is the link: https://github.com/Crownicles/Crownicles/";
    
    try {
      await crowdin.stringTranslationsApi.addTranslation(projectId, {
        stringId: 50426,
        languageId: languageId,
        text: fixedText,
      });
      console.log(`  ✅ Fixed GitHub URL!\n`);
    } catch (err: any) {
      console.log(`  ❌ Error: ${err.message}\n`);
    }
  }
  
  // Verify: check for any remaining "draftbot" references
  console.log("\n=== Verification: Remaining 'draftbot' references ===\n");
  let offset = 0;
  let remaining: any[] = [];
  while (true) {
    const batch = await crowdin.stringTranslationsApi.listLanguageTranslations(
      projectId,
      languageId,
      { croql: 'text contains "draftbot"', limit: 25, offset }
    );
    remaining.push(...batch.data);
    if (batch.data.length < 25) break;
    offset += 25;
  }
  
  console.log(`Remaining translations with "draftbot": ${remaining.length}`);
  for (const t of remaining) {
    const d = t.data;
    console.log(`  String ID: ${d.stringId} | ${d.text?.substring(0, 120)}`);
  }
}

main().catch(console.error);
