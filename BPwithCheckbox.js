require('dotenv').config();
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

async function createBranch(owner, repo, branchName, sha) {
    await octokit.git.createRef({
        owner,
        repo,
        ref: `refs/heads/${branchName}`,
        sha,
    });
}

async function copyBranchProtections(templateOwner, templateRepo, owner, repoName, createMissingBranches) {
    const templateBranchesResponse = await octokit.repos.listBranches({
        owner: templateOwner,
        repo: templateRepo,
    });

    const repoBranchesResponse = await octokit.repos.listBranches({
        owner: owner,
        repo: repoName,
    });

    const templateBranches = templateBranchesResponse.data.map(branch => branch.name);
    const repoBranches = repoBranchesResponse.data.map(branch => branch.name);

    const commonBranches = templateBranches.filter(branch => repoBranches.includes(branch));
    const missingBranches = templateBranches.filter(branch => !repoBranches.includes(branch));

    if (createMissingBranches) {
        const mainBranchSha = repoBranchesResponse.data.find(branch => branch.name === 'main').commit.sha;
        for (const branch of missingBranches) {
            console.log(`Creating branch ${branch} in repository: ${repoName}`);
            await createBranch(owner, repoName, branch, mainBranchSha);
            commonBranches.push(branch);
        }
    }

    for (const branch of commonBranches) {
        try {
            const branchProtectionResponse = await octokit.repos.getBranchProtection({
                owner: templateOwner,
                repo: templateRepo,
                branch: branch,
            });

            const {
                required_status_checks,
                enforce_admins,
                required_pull_request_reviews,
                restrictions,
            } = branchProtectionResponse.data;

            await octokit.repos.updateBranchProtection({
                owner: owner,
                repo: repoName,
                branch: branch,
                required_status_checks: required_status_checks ? {
                    strict: required_status_checks.strict,
                    contexts: required_status_checks.contexts,
                } : null,
                enforce_admins: enforce_admins.enabled,
                required_pull_request_reviews: required_pull_request_reviews ? {
                    dismissal_restrictions: required_pull_request_reviews.dismissal_restrictions,
                    dismiss_stale_reviews: required_pull_request_reviews.dismiss_stale_reviews,
                    require_code_owner_reviews: required_pull_request_reviews.require_code_owner_reviews,
                    required_approving_review_count: required_pull_request_reviews.required_approving_review_count,
                    require_last_push_approval: required_pull_request_reviews.require_last_push_approval,
                    bypass_pull_request_allowances: required_pull_request_reviews.bypass_pull_request_allowances,
                } : null,
                restrictions: restrictions ? {
                    users: restrictions.users ? restrictions.users.map(user => user.login) : [],
                    teams: restrictions.teams ? restrictions.teams.map(team => team.slug) : [],
                    apps: restrictions.apps ? restrictions.apps.map(app => app.slug) : [],
                } : null,
                headers: {
                    'X-GitHub-Api-Version': '2022-11-28',
                },
            });

            console.log(`Branch protection rules applied to branch ${branch} in the new repository: ${repoName}`);
        } catch (error) {
            if (error.status === 404) {
                console.log(`No branch protection rules found for branch ${branch} in the template repository.`);
            } else {
                console.error(`Error applying branch protection rules to branch ${branch}:`, error.message);
            }
        }
    }
}

async function main() {
    const templateOwner = process.env.GITHUB_ORG_Name;
    const owner = process.env.GITHUB_ORG_Name;
    const repoNames = ['ZY1', 'ZY2'];
    const createMissingBranches = true; // Set this based on the checkbox value from frontend

    for (const repoName of repoNames) {
        await copyBranchProtections(templateOwner, 'Hello-World', owner, repoName, createMissingBranches);
    }
}

main().catch(console.error);
