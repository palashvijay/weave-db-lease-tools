import { Octokit } from "@octokit/rest";
import { execSync } from "child_process";
import * as yaml from "js-yaml";
import * as vscode from "vscode";
// Helper to get token from `gh auth token`
function getGhToken() {
    try {
        const out = execSync("gh auth token", { encoding: "utf8" }).trim();
        return out || null;
    }
    catch {
        return null;
    }
}
// Helper to fetch repos
async function listRepos(octokit, org) {
    const repos = await octokit.paginate(octokit.rest.repos.listForOrg, {
        org,
        type: "all",
        per_page: 100,
    });
    return repos.map(r => r.name).sort();
}
// Helper to fetch .weave.yaml from a repo
async function fetchWeaveYaml(octokit, org, repo) {
    const repoMeta = await octokit.rest.repos.get({ owner: org, repo });
    const branch = repoMeta.data.default_branch || "main";
    try {
        const { data } = await octokit.rest.repos.getContent({
            owner: org,
            repo,
            path: ".weave.yaml",
            ref: branch,
        });
        if ("content" in data) {
            return Buffer.from(data.content, "base64").toString("utf8");
        }
    }
    catch (err) {
        vscode.window.showErrorMessage(`.weave.yaml not found in ${repo}`);
    }
    return null;
}
export function activate(context) {
    let disposable = vscode.commands.registerCommand("weave.generateLeaseCommand", async () => {
        // Use gh auth token instead of settings
        const token = getGhToken();
        const org = "weave-lab"; // default, or make configurable
        if (!token) {
            vscode.window.showErrorMessage("Could not retrieve GitHub token. Please run `gh auth login` first.");
            return;
        }
        const octokit = new Octokit({ auth: token });
        // List repos in org
        const repos = await listRepos(octokit, org);
        if (!repos.length) {
            vscode.window.showErrorMessage(`No repos found for org ${org}`);
            return;
        }
        const repo = await vscode.window.showQuickPick(repos, {
            placeHolder: "Select a service repo",
        });
        if (!repo)
            return;
        // Fetch .weave.yaml
        const yamlText = await fetchWeaveYaml(octokit, org, repo);
        if (!yamlText)
            return;
        const configObj = yaml.load(yamlText);
        // Pick environment
        const envs = Object.keys(configObj.deploy || {});
        if (!envs.length) {
            vscode.window.showErrorMessage("No environments found in .weave.yaml");
            return;
        }
        const env = await vscode.window.showQuickPick(envs, {
            placeHolder: "Select environment (e.g. dev or prod)",
        });
        if (!env)
            return;
        // Extract database info
        const db = configObj.deploy[env]?.databases?.[0];
        const defaults = configObj.defaults?.[0]?.env || [];
        const getDefault = (key) => defaults.find((d) => d.name === key)?.value;
        const host = db?.hostname || getDefault("CLOUDSQL_HOST");
        const name = db?.name || getDefault("CLOUDSQL_DATABASE");
        const schema = db?.schema || getDefault("CLOUDSQL_SCHEMA");
        if (!host || !name || !schema) {
            vscode.window.showErrorMessage("Could not extract database info from .weave.yaml");
            return;
        }
        const command = `bart database lease request -i ${host} -d ${name} -s ${schema}`;
        vscode.window
            .showInformationMessage(`Generated command: ${command}`, "Copy to Clipboard", "Run in Terminal")
            .then((action) => {
            if (action === "Copy to Clipboard") {
                vscode.env.clipboard.writeText(command);
            }
            else if (action === "Run in Terminal") {
                const terminal = vscode.window.createTerminal("Weave Lease");
                terminal.show();
                terminal.sendText(command);
            }
        });
    });
    context.subscriptions.push(disposable);
}
export function deactivate() { }
//# sourceMappingURL=extension.js.map