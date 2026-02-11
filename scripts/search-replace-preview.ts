import crowdinModule from "@crowdin/crowdin-api-client";

const token = process.env.CROWDIN_TOKEN!;
const projectId = 378229;
const languageId = "en";

const crowdin = new (crowdinModule as any).default({ token });

async function main() {
  // First try the raw API for search and replace (preview mode)
  console.log("=== Preview: DraftBot → Crownicles ===\n");
  
  try {
    // Use the underlying HTTP client directly
    const result = await crowdin.translationsApi.searchAndReplaceTranslation(
      projectId,
      languageId,
      {
        search: "DraftBot",
        replace: "Crownicles"
      }
    );
    console.log(`Found ${result.data.length} matches`);
    for (const item of result.data.slice(0, 20)) {
      console.log(`  String ID: ${item.data.stringId}`);
      console.log(`    Before: ${item.data.text?.substring(0, 100)}`);
      console.log();
    }
  } catch (err: any) {
    console.log(`Error with translationsApi: ${err.message}`);
    console.log(`Available methods:`, Object.getOwnPropertyNames(Object.getPrototypeOf(crowdin.translationsApi)).filter(m => m.includes('earch') || m.includes('eplace')));
    
    // Try to list available API methods
    console.log("\nAvailable API groups:");
    for (const key of Object.keys(crowdin)) {
      if (key.includes("Api") || key.includes("api")) {
        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(crowdin[key])).filter(m => !m.startsWith("_") && m !== "constructor");
        console.log(`  ${key}: ${methods.join(", ")}`);
      }
    }
  }
}

main().catch(console.error);
