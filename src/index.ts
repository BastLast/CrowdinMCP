import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import crowdin from "@crowdin/crowdin-api-client";

const token = process.env.CROWDIN_TOKEN;
if (!token) {
  console.error("CROWDIN_TOKEN environment variable is required");
  process.exit(1);
}

const client = new crowdin.default({ token });
const {
  projectsGroupsApi,
  sourceStringsApi,
  sourceFilesApi,
  stringTranslationsApi,
  translationStatusApi,
} = client;

const server = new McpServer({
  name: "crowdin",
  version: "1.0.0",
});

// ── List Projects ──────────────────────────────────────────────────────────
server.tool(
  "list_projects",
  "List all Crowdin projects accessible to the authenticated user",
  {},
  async () => {
    const res = await projectsGroupsApi.withFetchAll().listProjects();
    const projects = res.data.map((p) => ({
      id: p.data.id,
      name: p.data.name,
      identifier: p.data.identifier,
      sourceLanguageId: p.data.sourceLanguageId,
      targetLanguageIds: p.data.targetLanguageIds,
    }));
    return { content: [{ type: "text", text: JSON.stringify(projects, null, 2) }] };
  }
);

// ── Project Info ───────────────────────────────────────────────────────────
server.tool(
  "get_project",
  "Get detailed information about a Crowdin project",
  { projectId: z.number().describe("The project ID") },
  async ({ projectId }) => {
    const res = await projectsGroupsApi.getProject(projectId);
    return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
  }
);

// ── List Files ─────────────────────────────────────────────────────────────
server.tool(
  "list_files",
  "List all source files in a Crowdin project",
  { projectId: z.number().describe("The project ID") },
  async ({ projectId }) => {
    const res = await sourceFilesApi.withFetchAll().listProjectFiles(projectId);
    const files = res.data.map((f) => ({
      id: f.data.id,
      name: f.data.name,
      path: f.data.path,
      type: f.data.type,
    }));
    return { content: [{ type: "text", text: JSON.stringify(files, null, 2) }] };
  }
);

// ── Translation Progress ──────────────────────────────────────────────────
server.tool(
  "translation_progress",
  "Get translation and approval progress for a project by language",
  { projectId: z.number().describe("The project ID") },
  async ({ projectId }) => {
    const res = await translationStatusApi.withFetchAll().getProjectProgress(projectId);
    const progress = res.data.map((p) => ({
      languageId: p.data.languageId,
      translationProgress: p.data.translationProgress,
      approvalProgress: p.data.approvalProgress,
      words: p.data.words,
      phrases: p.data.phrases,
    }));
    return { content: [{ type: "text", text: JSON.stringify(progress, null, 2) }] };
  }
);

// ── List Source Strings ────────────────────────────────────────────────────
server.tool(
  "list_source_strings",
  "List source strings in a project. Supports filtering by file, CroQL, or text search.",
  {
    projectId: z.number().describe("The project ID"),
    fileId: z.number().optional().describe("Filter by file ID"),
    filter: z.string().optional().describe("Filter strings by text/context"),
    croql: z.string().optional().describe("Filter strings by CroQL expression"),
    limit: z.number().optional().default(25).describe("Max items (default 25, max 500)"),
    offset: z.number().optional().default(0).describe("Starting offset"),
  },
  async ({ projectId, fileId, filter, croql, limit, offset }) => {
    const options: Record<string, unknown> = { limit, offset };
    if (fileId) options.fileId = fileId;
    if (filter) options.filter = filter;
    if (croql) options.croql = croql;
    const res = await sourceStringsApi.listProjectStrings(projectId, options as any);
    const strings = res.data.map((s) => ({
      id: s.data.id,
      text: s.data.text,
      identifier: s.data.identifier,
      fileId: s.data.fileId,
      context: s.data.context,
    }));
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(
            { items: strings, count: strings.length },
            null,
            2
          ),
        },
      ],
    };
  }
);

// ── Get Source String ──────────────────────────────────────────────────────
server.tool(
  "get_source_string",
  "Get a single source string by ID",
  {
    projectId: z.number().describe("The project ID"),
    stringId: z.number().describe("The string ID"),
  },
  async ({ projectId, stringId }) => {
    const res = await sourceStringsApi.getString(projectId, stringId);
    return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
  }
);

// ── List Translations for a Language ───────────────────────────────────────
server.tool(
  "list_language_translations",
  "List translations for a specific language. Can filter by file, string IDs, or CroQL.",
  {
    projectId: z.number().describe("The project ID"),
    languageId: z.string().describe("Target language ID (e.g. 'en', 'de')"),
    fileId: z.number().optional().describe("Filter by file ID"),
    stringIds: z.string().optional().describe("Comma-separated string IDs"),
    croql: z.string().optional().describe("CroQL expression to filter"),
    limit: z.number().optional().default(25).describe("Max items (default 25)"),
    offset: z.number().optional().default(0).describe("Starting offset"),
  },
  async ({ projectId, languageId, fileId, stringIds, croql, limit, offset }) => {
    const options: Record<string, unknown> = { limit, offset };
    if (fileId) options.fileId = fileId;
    if (stringIds) options.stringIds = stringIds;
    if (croql) options.croql = croql;
    const res = await stringTranslationsApi.listLanguageTranslations(
      projectId,
      languageId,
      options as any
    );
    return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
  }
);

// ── List String Translations ──────────────────────────────────────────────
server.tool(
  "list_string_translations",
  "List all translations for a specific source string in a given language",
  {
    projectId: z.number().describe("The project ID"),
    stringId: z.number().describe("The source string ID"),
    languageId: z.string().describe("Target language ID"),
  },
  async ({ projectId, stringId, languageId }) => {
    const res = await stringTranslationsApi.listStringTranslations(
      projectId,
      stringId,
      languageId
    );
    return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
  }
);

// ── Add Translation ───────────────────────────────────────────────────────
server.tool(
  "add_translation",
  "Add a new translation for a source string. Use this to propose or fix a translation.",
  {
    projectId: z.number().describe("The project ID"),
    stringId: z.number().describe("The source string ID"),
    languageId: z.string().describe("Target language ID"),
    text: z.string().describe("The translation text"),
  },
  async ({ projectId, stringId, languageId, text }) => {
    const res = await stringTranslationsApi.addTranslation(projectId, {
      stringId,
      languageId,
      text,
    });
    return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
  }
);

// ── Delete Translation ────────────────────────────────────────────────────
server.tool(
  "delete_translation",
  "Delete a specific translation by its ID",
  {
    projectId: z.number().describe("The project ID"),
    translationId: z.number().describe("The translation ID to delete"),
  },
  async ({ projectId, translationId }) => {
    await stringTranslationsApi.deleteTranslation(projectId, translationId);
    return { content: [{ type: "text", text: "Translation deleted successfully" }] };
  }
);

// ── Delete All Translations ───────────────────────────────────────────────
server.tool(
  "delete_all_translations",
  "Delete all translations for a string (optionally for a specific language)",
  {
    projectId: z.number().describe("The project ID"),
    stringId: z.number().describe("The source string ID"),
    languageId: z.string().optional().describe("Target language (if omitted, deletes for all languages)"),
  },
  async ({ projectId, stringId, languageId }) => {
    await stringTranslationsApi.deleteAllTranslations(projectId, stringId, languageId);
    return { content: [{ type: "text", text: "All translations deleted successfully" }] };
  }
);

// ── Approve Translation ──────────────────────────────────────────────────
server.tool(
  "approve_translation",
  "Approve a translation by its translation ID",
  {
    projectId: z.number().describe("The project ID"),
    translationId: z.number().describe("The translation ID to approve"),
  },
  async ({ projectId, translationId }) => {
    const res = await stringTranslationsApi.addApproval(projectId, { translationId });
    return { content: [{ type: "text", text: JSON.stringify(res.data, null, 2) }] };
  }
);

// ── Remove Approval ──────────────────────────────────────────────────────
server.tool(
  "remove_approval",
  "Remove an approval by its approval ID",
  {
    projectId: z.number().describe("The project ID"),
    approvalId: z.number().describe("The approval ID to remove"),
  },
  async ({ projectId, approvalId }) => {
    await stringTranslationsApi.removeApproval(projectId, approvalId);
    return { content: [{ type: "text", text: "Approval removed successfully" }] };
  }
);

// ── Search and Replace Translation (bulk helper) ──────────────────────────
server.tool(
  "search_and_replace_translations",
  "Find translations containing a search term and replace with new text. Useful for bulk branding updates. Returns a preview of changes unless apply=true.",
  {
    projectId: z.number().describe("The project ID"),
    languageId: z.string().describe("Target language ID (e.g. 'en')"),
    search: z.string().describe("Text to search for in translations"),
    replace: z.string().describe("Replacement text"),
    fileId: z.number().optional().describe("Filter by file ID"),
    apply: z.boolean().optional().default(false).describe("If true, applies changes. If false, shows preview only."),
    limit: z.number().optional().default(100).describe("Max strings to process per call"),
  },
  async ({ projectId, languageId, search, replace, fileId, apply, limit }) => {
    // Fetch translations for the language
    const options: Record<string, unknown> = { limit };
    if (fileId) options.fileId = fileId;

    const res = await stringTranslationsApi.listLanguageTranslations(
      projectId,
      languageId,
      options as any
    );

    const matches: Array<{
      stringId: number;
      translationId: number;
      original: string;
      updated: string;
    }> = [];

    for (const item of res.data) {
      const data = item.data as any;
      const text =
        data.text ?? data.contentType?.text ?? "";
      if (typeof text === "string" && text.includes(search)) {
        matches.push({
          stringId: data.stringId,
          translationId: data.translationId,
          original: text,
          updated: text.replaceAll(search, replace),
        });
      }
    }

    if (!apply) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              { matchCount: matches.length, preview: matches.slice(0, 20) },
              null,
              2
            ),
          },
        ],
      };
    }

    // Apply the changes
    const results: Array<{ stringId: number; status: string }> = [];
    for (const match of matches) {
      try {
        await stringTranslationsApi.addTranslation(projectId, {
          stringId: match.stringId,
          languageId,
          text: match.updated,
        });
        results.push({ stringId: match.stringId, status: "updated" });
      } catch (err: any) {
        results.push({ stringId: match.stringId, status: `error: ${err.message}` });
      }
    }

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify({ applied: results.length, results }, null, 2),
        },
      ],
    };
  }
);

// ── Start server ──────────────────────────────────────────────────────────
const transport = new StdioServerTransport();
await server.connect(transport);
