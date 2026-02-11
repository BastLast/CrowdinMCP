import crowdinModule from "@crowdin/crowdin-api-client";

const token = process.env.CROWDIN_TOKEN!;
const projectId = 378229;
const languageId = "en";

const crowdin = new (crowdinModule as any).default({ token });

async function main() {
  // Check the current/active translations for key strings
  const keySt = [39734, 50402, 50404, 50428, 50430, 50560, 50562, 50636, 50650, 50664, 50668, 50670, 53372, 53458, 53570];
  
  console.log("=== Verifying Active Translations ===\n");
  
  for (const stringId of keySt) {
    try {
      // List all translations for this string, sorted by latest
      const trans = await crowdin.stringTranslationsApi.listStringTranslations(
        projectId,
        stringId,
        languageId,
        { limit: 3 }
      );
      
      if (trans.data.length > 0) {
        const latest = trans.data[0].data;
        const text = latest.text || "";
        const hasDraftBot = text.toLowerCase().includes("draftbot");
        const hasCrownicles = text.toLowerCase().includes("crownicles");
        
        console.log(`String ${stringId}: ${hasDraftBot ? "❌ still has DraftBot" : "✅ clean"} ${hasCrownicles ? "(has Crownicles)" : ""}`);
        console.log(`  Latest: ${text.substring(0, 120)}`);
        console.log(`  Total translations: ${trans.data.length} | Created: ${latest.createdAt}`);
        console.log();
      }
    } catch (err: any) {
      console.log(`Error for ${stringId}: ${err.message}\n`);
    }
  }
  
  // Also check the QA issues count
  console.log("\n=== QA Check Issues ===\n");
  try {
    // List QA issues for English
    const qaIssues = await crowdin.translationStatusApi.listQaCheckIssues(
      projectId,
      { languageId: "en", limit: 25 }
    );
    console.log(`QA issues found (first page): ${qaIssues.data.length}`);
    for (const issue of qaIssues.data.slice(0, 10)) {
      const d = issue.data;
      console.log(`  String ${d.stringId}: ${d.category} - ${d.validation}`);
    }
  } catch (err: any) {
    console.log(`Error listing QA issues: ${err.message}`);
  }
  
  // Check updated progress
  console.log("\n=== Updated Progress ===\n");
  const progress = await crowdin.translationStatusApi.getProjectProgress(projectId);
  const enProgress = progress.data.find((p: any) => p.data.languageId === languageId);
  if (enProgress) {
    console.log(`English: ${enProgress.data.translationProgress}% translated, ${enProgress.data.approvalProgress}% approved`);
    console.log(`  Phrases: ${enProgress.data.phrases.translated}/${enProgress.data.phrases.total} translated, ${enProgress.data.phrases.approved}/${enProgress.data.phrases.total} approved`);
  }
}

main().catch(console.error);
