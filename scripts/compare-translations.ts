import crowdinModule from "@crowdin/crowdin-api-client";

const token = process.env.CROWDIN_TOKEN!;
const projectId = 378229;
const languageId = "en";

const crowdin = new (crowdinModule as any).default({ token });

async function main() {
  // Get source strings for the DraftBot-mentioning translations to compare
  const stringIds = [39484, 39734, 50398, 50400, 50402, 50404, 50406, 50408, 50410, 50412, 50414, 50416, 50418, 50420, 50422, 50424, 50426, 50428, 50430, 50432, 50434, 50560, 50562, 50564, 50574];
  
  console.log("=== Comparing Source (FR) vs Translation (EN) for DraftBot strings ===\n");
  
  for (const id of stringIds) {
    try {
      // Get source string
      const source = await crowdin.sourceStringsApi.getSourceString(projectId, id);
      
      // Get translations for this string
      const translations = await crowdin.stringTranslationsApi.listStringTranslations(
        projectId,
        id,
        languageId,
        { limit: 1 }
      );
      
      const srcText = source.data.text?.toString() || "";
      const enText = translations.data[0]?.data?.text || "(no translation)";
      
      const srcHasDraftBot = srcText.toLowerCase().includes("draftbot");
      const enHasDraftBot = enText.toLowerCase().includes("draftbot");
      const srcHasCrownicles = srcText.toLowerCase().includes("crownicles");
      
      // Only show strings where source no longer says DraftBot but translation still does
      // OR where there's a branding mismatch
      if (enHasDraftBot) {
        console.log(`--- String ID: ${id} (Key: ${source.data.identifier}) ---`);
        console.log(`  Source has DraftBot: ${srcHasDraftBot} | Source has Crownicles: ${srcHasCrownicles}`);
        console.log(`  FR: ${srcText.substring(0, 200)}`);
        console.log(`  EN: ${enText.substring(0, 200)}`);
        
        // Classify the issue
        if (!srcHasDraftBot && srcHasCrownicles && enHasDraftBot) {
          console.log(`  >> ISSUE: Source says "Crownicles" but EN still says "DraftBot" - NEEDS FIX`);
        } else if (srcHasDraftBot && enHasDraftBot) {
          console.log(`  >> INFO: Source also says "DraftBot" - may be intentional`);
        } else if (enText.includes("draftbot.com") || enText.includes("guide.draftbot") || enText.includes("status.draftbot") || enText.includes("feedback.draftbot") || enText.includes("history.draftbot")) {
          console.log(`  >> URL: Contains draftbot URL - check if URL still active`);
        }
        console.log();
      }
    } catch (err: any) {
      console.log(`Error for string ${id}: ${err.message}`);
    }
  }

  // Also find strings where source has "Crownicles" but EN translation doesn't
  console.log("\n=== Source strings containing 'Crownicles' ===\n");
  const crowniclesStrings = await crowdin.sourceStringsApi.listProjectStrings(projectId, {
    filter: "Crownicles",
    limit: 50
  });
  console.log(`Found ${crowniclesStrings.data.length} source strings with "Crownicles":`);
  for (const s of crowniclesStrings.data) {
    console.log(`  ID: ${s.data.id} | Key: ${s.data.identifier}`);
    console.log(`    FR: ${s.data.text?.toString().substring(0, 150)}`);
    
    // Check EN translation
    try {
      const trans = await crowdin.stringTranslationsApi.listStringTranslations(
        projectId,
        s.data.id,
        languageId,
        { limit: 1 }
      );
      const enText = trans.data[0]?.data?.text || "(no translation)";
      console.log(`    EN: ${enText.substring(0, 150)}`);
      if (enText.toLowerCase().includes("draftbot") && !enText.toLowerCase().includes("crownicles")) {
        console.log(`    >> MISMATCH: EN says "DraftBot" but FR says "Crownicles"`);
      }
    } catch (err: any) {
      console.log(`    Error getting EN: ${err.message}`);
    }
    console.log();
  }
}

main().catch(console.error);
