import crowdinModule from "@crowdin/crowdin-api-client";

const token = process.env.CROWDIN_TOKEN!;
const projectId = 378229; // Crownicles project
const languageId = "en"; // English

const crowdin = new (crowdinModule as any).default({ token });

async function main() {
  console.log("=== Crowdin English Translation Assessment ===\n");

  // 1. Get project info
  const project = await crowdin.projectsGroupsApi.getProject(projectId);
  console.log(`Project: ${project.data.name} (ID: ${projectId})`);
  console.log(`Source language: ${project.data.sourceLanguageId}`);
  console.log(`Target languages: ${project.data.targetLanguageIds.join(", ")}\n`);

  // 2. Get translation progress for English
  const progress = await crowdin.translationStatusApi.getProjectProgress(projectId);
  const enProgress = progress.data.find((p: any) => p.data.languageId === languageId);
  if (enProgress) {
    console.log(`English Translation Progress:`);
    console.log(`  Phrases: ${enProgress.data.phrases.total} total, ${enProgress.data.phrases.translated} translated, ${enProgress.data.phrases.approved} approved`);
    console.log(`  Words: ${enProgress.data.words.total} total, ${enProgress.data.words.translated} translated, ${enProgress.data.words.approved} approved`);
    console.log(`  Translation: ${enProgress.data.translationProgress}%, Approval: ${enProgress.data.approvalProgress}%\n`);
  }

  // 3. List source files
  const files = await crowdin.sourceFilesApi.listProjectFiles(projectId, { limit: 100 });
  console.log(`Source files (${files.data.length}):`);
  for (const f of files.data) {
    console.log(`  - ${f.data.name} (ID: ${f.data.id})`);
  }
  console.log();

  // 4. Search for "DraftBot" in English translations to assess branding issues
  console.log("=== Searching for branding issues (DraftBot in translations) ===\n");
  
  // Use CroQL to find translations containing "DraftBot"
  const draftbotStrings = await crowdin.stringTranslationsApi.listLanguageTranslations(
    projectId,
    languageId,
    { croql: 'text contains "DraftBot"', limit: 25 }
  );
  
  console.log(`Found ${draftbotStrings.data.length} translations containing "DraftBot" (showing up to 25):`);
  for (const t of draftbotStrings.data) {
    const d = t.data;
    if (d.stringId) {
      console.log(`  String ID: ${d.stringId}`);
      console.log(`    Translation: ${d.text?.substring(0, 120)}...`);
      console.log();
    }
  }

  // 5. Search for "draftbot" (lowercase) in translations
  console.log("\n=== Searching for 'draftbot' (lowercase) in translations ===\n");
  const draftbotLower = await crowdin.stringTranslationsApi.listLanguageTranslations(
    projectId,
    languageId,
    { croql: 'text contains "draftbot"', limit: 25 }
  );
  console.log(`Found ${draftbotLower.data.length} translations containing "draftbot" (showing up to 25):`);
  for (const t of draftbotLower.data) {
    const d = t.data;
    if (d.stringId) {
      console.log(`  String ID: ${d.stringId}`);
      console.log(`    Translation: ${d.text?.substring(0, 120)}...`);
      console.log();
    }
  }

  // 6. Check for common issues in source strings
  console.log("\n=== Source strings with 'DraftBot' (to understand the branding context) ===\n");
  const sourceStrings = await crowdin.sourceStringsApi.listProjectStrings(projectId, {
    filter: "DraftBot",
    limit: 10
  });
  console.log(`Found ${sourceStrings.data.length} source strings containing "DraftBot" (showing up to 10):`);
  for (const s of sourceStrings.data) {
    console.log(`  ID: ${s.data.id} | Key: ${s.data.identifier}`);
    console.log(`    Source (FR): ${s.data.text?.toString().substring(0, 150)}`);
    console.log();
  }
}

main().catch(console.error);
