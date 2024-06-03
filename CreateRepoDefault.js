require('dotenv').config();
const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
    auth: process.env.GITHUB_TOKEN,
});

const OWNER = process.env.GITHUB_TEMPLATE_OWNER; 

async function createRepo(repoName) {
    try {
        const newRepoFullName = await createNewRepository(repoName);
        await addReadmeFile(repoName, 'main');
        await applyBranchProtectionRules(repoName, 'main');
        console.log('Repository creation and setup complete:', newRepoFullName);
    } catch (error) {
        console.error('Error creating repository or applying branch protection rules:', error.message);
    }
}

async function createNewRepository(repoName) {
    const response = await octokit.request('POST /orgs/{org}/repos', {
        org: OWNER,
        name: repoName,
        description: 'This is your api called repo repository',
        homepage: 'https://github.com',
        private: false,
        has_issues: true,
        has_projects: true,
        headers: {
            'X-GitHub-Api-Version': '2022-11-28',
        },
    });

    const newRepoFullName = response.data.full_name;
    console.log('Repository created:', newRepoFullName);
    return newRepoFullName;
}

async function applyBranchProtectionRules(repoName, branchName) {
    try {
        const branchProtectionRules = {
            required_status_checks: {
                strict: true,
                contexts: ['continuous-integration/travis-ci'],
            },
            enforce_admins: true,
            required_pull_request_reviews: {
                require_code_owner_reviews: true,
                required_approving_review_count: 2,
            },
            restrictions: null,
            require_signed_commits: true,
            required_linear_history: true,
            require_conversation_resolution: true,
        };

        await octokit.request('PUT /repos/{owner}/{repo}/branches/{branch}/protection', {
            owner: OWNER,
            repo: repoName,
            branch: branchName,
            ...branchProtectionRules,
            headers: {
                'X-GitHub-Api-Version': '2022-11-28',
            },
        });

        console.log(`Branch protection rules applied to the branch '${branchName}'.`);
    } catch (error) {
        console.error(`Error applying branch protection rules to branch '${branchName}':`, error.message);
    }
}

async function addReadmeFile(repoName, branchName) {
    try {
        const content = `# ${repoName}\n\nThis is the README file for the ${repoName} repository.`;
        const base64Content = Buffer.from(content).toString('base64'); // convert from base64 to string.

        await octokit.repos.createOrUpdateFileContents({
            owner: OWNER,
            repo: repoName,
            path: 'README.md',
            message: 'Add README file',
            content: base64Content,
            branch: branchName,
        });

        console.log('README file added to the repository.');
    } catch (error) {
        console.error('Error adding README file:', error.message);
    }
}


createRepo("Repo01");
