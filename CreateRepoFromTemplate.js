require('dotenv').config();
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

async function createRepoFromTemplate(repoName, repoDesc, owner, templateOwner, templateRepo, users) {
    try {
        const newRepoFullName = await generateRepoFromTemplate(repoName, repoDesc, owner, templateOwner, templateRepo);
        await transferIssues(templateOwner, templateRepo, owner, repoName);
        await addCollaborators(owner, repoName, users);
        await copyBranchProtections(templateOwner, templateRepo, owner, repoName);

        console.log('Repository created:', newRepoFullName);
    } catch (error) {
        console.error('Error creating repository:', error.message);
    }
}

async function generateRepoFromTemplate(repoName, repoDesc, owner, templateOwner, templateRepo) {
    const createResponse = await octokit.request('POST /repos/{template_owner}/{template_repo}/generate', {
        template_owner: templateOwner,
        template_repo: templateRepo,
        owner: owner,
        name: repoName,
        description: repoDesc,
        include_all_branches: true,
        private: false,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
        },
    });

    return createResponse.data.full_name;
}

async function transferIssues(templateOwner, templateRepo, owner, repoName) {
    const issuesResponse = await octokit.issues.listForRepo({
        owner: templateOwner,
        repo: templateRepo,
    });

    for (const issue of issuesResponse.data) {
        const { title, body, labels, assignees } = issue;
        await octokit.issues.create({
            owner: owner,
            repo: repoName,
            title: title,
            body: body,
            labels: labels.map(label => label.name),
            assignees: assignees.map(assignee => assignee.login),
        });
    }

    console.log('Issues moved to the new repository:', repoName);
}

async function addCollaborators(owner, repoName, users) {
    for (const { username, permission } of users) {
        await octokit.repos.addCollaborator({
            owner: owner,
            repo: repoName,
            username: username,
            permission: permission,
        });
        
    }
    console.log("Collaborators have been granted required access");

}

async function copyBranchProtections(templateOwner, templateRepo, owner, repoName) {
    const branchesResponse = await octokit.repos.listBranches({
        owner: templateOwner,
        repo: templateRepo,
    });

    const branches = branchesResponse.data.map(branch => branch.name);

    for (const branch of branches) {
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
                required_status_checks: required_status_checks && {
                    strict: required_status_checks.strict,
                    contexts: required_status_checks.contexts,
                },
                enforce_admins: enforce_admins.enabled,
                required_pull_request_reviews: required_pull_request_reviews && {
                    dismissal_restrictions: required_pull_request_reviews.dismissal_restrictions,
                    dismiss_stale_reviews: required_pull_request_reviews.dismiss_stale_reviews,
                    require_code_owner_reviews: required_pull_request_reviews.require_code_owner_reviews,
                    required_approving_review_count: required_pull_request_reviews.required_approving_review_count,
                    require_last_push_approval: required_pull_request_reviews.require_last_push_approval,
                    bypass_pull_request_allowances: required_pull_request_reviews.bypass_pull_request_allowances,
                },
                restrictions: restrictions && {
                    users: restrictions.users.map(user => user.login),
                    teams: restrictions.teams.map(team => team.slug),
                    apps: restrictions.apps.map(app => app.slug),
                },
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

const users = [
    { username: 'themanvendra08', permission: 'push' },
    { username: 'themanvendra00', permission: 'pull' },
    { username: 'Dheeraj-pal', permission: 'admin' }
];
createRepoFromTemplate('ZY0770', 'Hello World!', 'GIthub-Cleanup-Playground', 'GIthub-Cleanup-Playground', 'Hello-World', users);
