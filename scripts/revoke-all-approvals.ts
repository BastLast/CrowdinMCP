import crowdinModule from "@crowdin/crowdin-api-client";

const token = process.env.CROWDIN_TOKEN!;
const projectId = 378229;
const languages = process.argv[2] === "all" 
  ? ["en", "de", "it", "pt-PT", "es-ES"]
  : [process.argv[2] || "en"];
const DRY_RUN = process.argv.includes("--dry-run");
const DELAY_MS = 50; // 50ms between API calls to avoid rate limits

const crowdin = new (crowdinModule as any).default({ token });

function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function revokeApprovalsForLanguage(languageId: string) {
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Revoking approvals for language: ${languageId}`);
  console.log(`${"=".repeat(60)}\n`);
  
  const files = await crowdin.sourceFilesApi.listProjectFiles(projectId, { limit: 100 });
  
  let allApprovalIds: number[] = [];
  
  for (const file of files.data) {
    const fileId = file.data.id;
    const fileName = file.data.name;
    let offset = 0;
    const limit = 25;
    let fileApprovals = 0;
    
    while (true) {
      try {
        const batch = await crowdin.stringTranslationsApi.listTranslationApprovals(
          projectId,
          { fileId, languageId, limit, offset }
        );
        
        for (const a of batch.data) {
          allApprovalIds.push(a.data.id);
        }
        fileApprovals += batch.data.length;
        
        if (batch.data.length < limit) break;
        offset += limit;
        await sleep(DELAY_MS);
      } catch (err: any) {
        if (err.code === 429) {
          console.log(`    Rate limited, waiting 5s...`);
          await sleep(5000);
          continue;
        }
        console.log(`    Error on ${fileName} offset ${offset}: ${err.message}`);
        break;
      }
    }
    
    console.log(`  ${fileName}: ${fileApprovals} approvals`);
  }
  
  console.log(`\nTotal approvals for ${languageId}: ${allApprovalIds.length}`);
  
  if (DRY_RUN) {
    console.log("DRY RUN - no changes made");
    return allApprovalIds.length;
  }
  
  let removed = 0;
  let errors = 0;
  const startTime = Date.now();
  
  for (const approvalId of allApprovalIds) {
    try {
      await crowdin.stringTranslationsApi.removeApproval(projectId, approvalId);
      removed++;
      
      if (removed % 100 === 0) {
        const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
        const rate = (removed / parseFloat(elapsed)).toFixed(1);
        console.log(`  Progress: ${removed}/${allApprovalIds.length} (${rate}/s, ${elapsed}s elapsed)`);
      }
      
      await sleep(DELAY_MS);
    } catch (err: any) {
      if (err.code === 429) {
        console.log(`  Rate limited at ${removed}, waiting 10s...`);
        await sleep(10000);
        try {
          await crowdin.stringTranslationsApi.removeApproval(projectId, approvalId);
          removed++;
        } catch {
          errors++;
        }
      } else {
        errors++;
        if (errors <= 10) {
          console.log(`  Error removing ${approvalId}: ${err.message}`);
        }
      }
    }
  }
  
  const totalTime = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`\n${languageId} complete: ${removed} removed, ${errors} errors (${totalTime}s)`);
  return removed;
}

async function main() {
  console.log(`Mode: ${DRY_RUN ? "DRY RUN" : "⚠️ LIVE"}`);
  console.log(`Languages: ${languages.join(", ")}`);
  console.log(`Rate limit delay: ${DELAY_MS}ms\n`);
  
  let grandTotal = 0;
  
  for (const lang of languages) {
    const count = await revokeApprovalsForLanguage(lang);
    grandTotal += count;
  }
  
  console.log(`\n${"=".repeat(60)}`);
  console.log(`Grand total: ${grandTotal} approvals ${DRY_RUN ? "found" : "removed"}`);
  console.log(`${"=".repeat(60)}`);
}

main().catch(console.error);
