import crowdinModule from "@crowdin/crowdin-api-client";

const token = process.env.CROWDIN_TOKEN!;
const projectId = 378229;
const languageId = "en";

const crowdin = new (crowdinModule as any).default({ token });

async function main() {
  // Deep-dive into a specific string to understand the translation structure
  const testStringId = 50402; // "contribute to improvement of DraftBot/Crownicles"
  
  console.log(`=== All translations for string ${testStringId} ===\n`);
  
  const trans = await crowdin.stringTranslationsApi.listStringTranslations(
    projectId,
    testStringId,
    languageId,
    { limit: 10 }
  );
  
  for (const t of trans.data) {
    const d = t.data;
    console.log(`Translation ID: ${d.id}`);
    console.log(`  Text: ${d.text?.substring(0, 150)}`);
    console.log(`  Created: ${d.createdAt}`);
    console.log(`  User ID: ${d.user?.id} (${d.user?.username || 'unknown'})`);
    console.log(`  Rating: ${d.rating}`);
    console.log();
  }

  // Check approvals for this string
  console.log(`=== Approvals for string ${testStringId} ===\n`);
  try {
    const approvals = await crowdin.stringTranslationsApi.listTranslationApprovals(
      projectId,
      { stringId: testStringId, languageId, limit: 10 }
    );
    for (const a of approvals.data) {
      const d = a.data;
      console.log(`Approval ID: ${d.id}`);
      console.log(`  Translation ID: ${d.translationId}`);
      console.log(`  Created: ${d.createdAt}`);
      console.log();
    }
  } catch (err: any) {
    console.log(`Error: ${err.message}`);
  }
  
  // Now let's check approvals across multiple strings we fixed
  console.log(`\n=== Checking all fixed strings for approval status ===\n`);
  
  const fixedStrings = [39734, 50402, 50404, 50406, 50410, 50412, 50414, 50416, 50418, 50430, 50560, 50562, 50564, 50636, 50650, 50664, 50666, 50668, 50670, 50990, 53372, 53386, 53406, 53460, 53462];
  
  for (const stringId of fixedStrings) {
    const trans = await crowdin.stringTranslationsApi.listStringTranslations(
      projectId,
      stringId,
      languageId,
      { limit: 10 }
    );
    
    // Find our new translation (should contain "Crownicles" or "crownicles")  
    const newTrans = trans.data.find((t: any) => {
      const text = t.data.text?.toLowerCase() || "";
      return text.includes("crownicles") && !text.includes("draftbot");
    });
    
    const oldTrans = trans.data.find((t: any) => {
      const text = t.data.text?.toLowerCase() || "";
      return text.includes("draftbot");
    });
    
    if (newTrans && oldTrans) {
      console.log(`String ${stringId}:`);
      console.log(`  Old (DraftBot) ID: ${oldTrans.data.id} | Rating: ${oldTrans.data.rating}`);
      console.log(`  New (Crownicles) ID: ${newTrans.data.id} | Rating: ${newTrans.data.rating}`);
      
      // Check approvals
      const approvals = await crowdin.stringTranslationsApi.listTranslationApprovals(
        projectId,
        { stringId, languageId, limit: 5 }
      );
      
      if (approvals.data.length > 0) {
        const approvedTransId = approvals.data[0].data.translationId;
        const isOldApproved = approvedTransId === oldTrans.data.id;
        console.log(`  Approved: Translation ${approvedTransId} (${isOldApproved ? "OLD - needs switch" : "NEW - OK"})`);
        
        if (isOldApproved) {
          // Remove old approval and approve new one
          console.log(`  → Removing old approval (ID: ${approvals.data[0].data.id})...`);
          await crowdin.stringTranslationsApi.removeApproval(projectId, approvals.data[0].data.id);
          
          console.log(`  → Approving new translation (ID: ${newTrans.data.id})...`);
          await crowdin.stringTranslationsApi.addApproval(projectId, { translationId: newTrans.data.id });
          console.log(`  ✅ Approval switched!\n`);
        } else {
          console.log(`  ✅ Already approved correctly\n`);
        }
      } else {
        // No approval - just approve the new one
        console.log(`  No approval - approving new translation...`);
        await crowdin.stringTranslationsApi.addApproval(projectId, { translationId: newTrans.data.id });
        console.log(`  ✅ Approved!\n`);
      }
    } else if (!newTrans) {
      console.log(`String ${stringId}: ⚠️ No Crownicles translation found`);
    }
  }
}

main().catch(console.error);
