import crowdinModule from "@crowdin/crowdin-api-client";

const token = process.env.CROWDIN_TOKEN!;
const projectId = 378229;
const languageId = "en";

const crowdin = new (crowdinModule as any).default({ token });

async function approveTranslation(stringId: number, expectedText: string) {
  const trans = await crowdin.stringTranslationsApi.listStringTranslations(
    projectId,
    stringId,
    languageId,
    { limit: 10 }
  );
  
  // Find the translation matching our expected text
  const match = trans.data.find((t: any) => t.data.text === expectedText);
  
  if (match) {
    // Remove any existing approvals
    const approvals = await crowdin.stringTranslationsApi.listTranslationApprovals(
      projectId,
      { stringId, languageId, limit: 5 }
    );
    for (const a of approvals.data) {
      await crowdin.stringTranslationsApi.removeApproval(projectId, a.data.id);
    }
    
    // Approve the correct one
    await crowdin.stringTranslationsApi.addApproval(projectId, { translationId: match.data.id });
    console.log(`  ✅ Approved translation ID ${match.data.id}`);
  } else {
    console.log(`  ⚠️ Could not find matching translation. Available:`);
    for (const t of trans.data) {
      console.log(`    ID ${t.data.id}: ${t.data.text?.substring(0, 80)}...`);
    }
  }
}

async function main() {
  // Fix string 50428 (advices.96) - EN has French text
  console.log("--- String 50428 (advices.96) ---");
  console.log("  FR: Crownicles n'enregistre aucune de vos données personnelles.");
  console.log("  Expected EN: Crownicles does not store any of your personal data.");
  await approveTranslation(50428, "Crownicles does not store any of your personal data.");
  
  // Fix string 53458 (advices.177) - Privacy policy link
  console.log("\n--- String 53458 (advices.177) ---");
  console.log("  FR: Vous pouvez consulter notre politique de confidentialité...");
  // Check what's there
  const trans53458 = await crowdin.stringTranslationsApi.listStringTranslations(
    projectId,
    53458,
    languageId,
    { limit: 10 }
  );
  console.log(`  Current translations (${trans53458.data.length}):`);
  for (const t of trans53458.data) {
    console.log(`    ID ${t.data.id}: ${t.data.text?.substring(0, 120)}`);
  }
  
  // The correct translation should be about privacy policy
  const correctPrivacy = "You can view our privacy policy by following this link: https://crownicles.com/confidentialite/";
  const privacyMatch = trans53458.data.find((t: any) => t.data.text === correctPrivacy);
  if (privacyMatch) {
    // Remove existing approvals and approve correct one
    const approvals = await crowdin.stringTranslationsApi.listTranslationApprovals(
      projectId,
      { stringId: 53458, languageId, limit: 5 }
    );
    for (const a of approvals.data) {
      await crowdin.stringTranslationsApi.removeApproval(projectId, a.data.id);
    }
    await crowdin.stringTranslationsApi.addApproval(projectId, { translationId: privacyMatch.data.id });
    console.log(`  ✅ Approved privacy policy translation`);
  } else {
    console.log(`  ⚠️ Correct translation not found, adding new one...`);
    const newTrans = await crowdin.stringTranslationsApi.addTranslation(projectId, {
      stringId: 53458,
      languageId,
      text: correctPrivacy,
    });
    // Remove old approvals
    const approvals = await crowdin.stringTranslationsApi.listTranslationApprovals(
      projectId,
      { stringId: 53458, languageId, limit: 5 }
    );
    for (const a of approvals.data) {
      await crowdin.stringTranslationsApi.removeApproval(projectId, a.data.id);
    }
    await crowdin.stringTranslationsApi.addApproval(projectId, { translationId: newTrans.data.id });
    console.log(`  ✅ Added and approved!`);
  }
  
  // Fix string 53570 (advices.233) - Branding info
  console.log("\n--- String 53570 (advices.233) ---");
  console.log("  FR: Crownicles est le nouveau nom de DraftBot.");
  const correctBranding = "Crownicles is the new name for DraftBot.";
  
  const trans53570 = await crowdin.stringTranslationsApi.listStringTranslations(
    projectId,
    53570,
    languageId,
    { limit: 10 }
  );
  console.log(`  Current translations (${trans53570.data.length}):`);
  for (const t of trans53570.data) {
    console.log(`    ID ${t.data.id}: ${t.data.text?.substring(0, 120)}`);
  }
  
  const brandingMatch = trans53570.data.find((t: any) => t.data.text === correctBranding);
  if (brandingMatch) {
    const approvals = await crowdin.stringTranslationsApi.listTranslationApprovals(
      projectId,
      { stringId: 53570, languageId, limit: 5 }
    );
    for (const a of approvals.data) {
      await crowdin.stringTranslationsApi.removeApproval(projectId, a.data.id);
    }
    await crowdin.stringTranslationsApi.addApproval(projectId, { translationId: brandingMatch.data.id });
    console.log(`  ✅ Approved branding translation`);
  } else {
    console.log(`  Adding new translation...`);
    const newTrans = await crowdin.stringTranslationsApi.addTranslation(projectId, {
      stringId: 53570,
      languageId,
      text: correctBranding,
    });
    const approvals = await crowdin.stringTranslationsApi.listTranslationApprovals(
      projectId,
      { stringId: 53570, languageId, limit: 5 }
    );
    for (const a of approvals.data) {
      await crowdin.stringTranslationsApi.removeApproval(projectId, a.data.id);
    }
    await crowdin.stringTranslationsApi.addApproval(projectId, { translationId: newTrans.data.id });
    console.log(`  ✅ Added and approved!`);
  }
  
  // Now let's look at the QA spellcheck issues
  console.log("\n\n=== Investigating QA Spellcheck Issues ===\n");
  
  const qaIssues = await crowdin.translationStatusApi.listQaCheckIssues(
    projectId,
    { languageId: "en", limit: 100 }
  );
  
  // Group by category
  const byCategory: Record<string, number> = {};
  for (const issue of qaIssues.data) {
    const cat = issue.data.category;
    byCategory[cat] = (byCategory[cat] || 0) + 1;
  }
  
  console.log("QA Issues by category:");
  for (const [cat, count] of Object.entries(byCategory)) {
    console.log(`  ${cat}: ${count}`);
  }
  
  // Show details for non-spellcheck issues
  console.log("\n--- Non-spellcheck QA issues ---\n");
  for (const issue of qaIssues.data) {
    if (issue.data.category !== "spellcheck") {
      console.log(`  String ${issue.data.stringId}: ${issue.data.category} (${issue.data.validation})`);
    }
  }
  
  // Show first 10 spellcheck issues to understand patterns
  console.log("\n--- Sample spellcheck issues (first 10) ---\n");
  const spellchecks = qaIssues.data.filter((i: any) => i.data.category === "spellcheck");
  for (const issue of spellchecks.slice(0, 10)) {
    const stringId = issue.data.stringId;
    
    // Get the translation text
    const trans = await crowdin.stringTranslationsApi.listStringTranslations(
      projectId,
      stringId,
      languageId,
      { limit: 1 }
    );
    
    if (trans.data.length > 0) {
      console.log(`  String ${stringId}: ${trans.data[0].data.text?.substring(0, 150)}`);
    }
  }
}

main().catch(console.error);
